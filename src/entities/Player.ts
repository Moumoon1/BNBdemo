import Phaser from 'phaser';
import {
  PLAYER_VISUAL_SETTINGS,
  type CharacterFacing,
  type CharacterVisualSettings,
} from '../data/characterSettings';
import { PLAYER_SETTINGS } from '../data/playerSettings';
import { MAP_SETTINGS } from '../data/gameSettings';
import { worldToGrid } from '../domain/coordinates';
import { getRoleDepth } from '../domain/visDepth';
import { PlayerStats } from './PlayerStats';

export interface PlayerVelocity {
  x: number;
  y: number;
}

export type PlayerFacing = CharacterFacing;

const DIRECTION_ROW: Record<PlayerFacing, number> = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
};

function getDirectionRow(
  visual: CharacterVisualSettings,
  direction: PlayerFacing,
): number {
  return visual.directionRows?.[direction] ?? DIRECTION_ROW[direction];
}

function ensureAnimations(
  anims: Phaser.Animations.AnimationManager,
  visual: CharacterVisualSettings,
): void {
  const directions: PlayerFacing[] = ['up', 'down', 'left', 'right'];

  directions.forEach((direction) => {
    const row = getDirectionRow(visual, direction);
    const key = `${visual.id}-walk-${direction}`;
    if (anims.exists(key)) return;
    anims.create({
      key,
      frames: anims.generateFrameNumbers(visual.idleTextureKey, {
        start: row * visual.idleFramesPerDirection,
        end: row * visual.idleFramesPerDirection + visual.idleFramesPerDirection - 1,
      }),
      // vis 每 60ms 切一次帧，约 16.67 FPS。
      frameRate: 1000 / 60,
      repeat: -1,
    });
  });

  const trappedKey = `${visual.id}-trapped`;
  if (!anims.exists(trappedKey)) {
    const trappedStart = visual.trappedFrameStart ?? 0;
    anims.create({
      key: trappedKey,
      frames: anims.generateFrameNumbers(visual.trappedTextureKey, {
        start: trappedStart,
        end: trappedStart + visual.trappedFrameCount - 1,
      }),
      frameRate: 12,
      repeat: -1,
    });
  }

  const startKey = `${visual.id}-start`;
  if (visual.startTextureKey && !anims.exists(startKey)) {
    anims.create({
      key: startKey,
      frames: anims.generateFrameNumbers(visual.startTextureKey, { start: 0, end: 9 }),
      frameRate: 12,
      repeat: 0,
    });
  }

  const dieKey = `${visual.id}-die`;
  if (!anims.exists(dieKey)) {
    const dieStart = visual.dieFrameStart ?? 0;
    anims.create({
      key: dieKey,
      frames: anims.generateFrameNumbers(visual.dieTextureKey, {
        start: dieStart,
        end: dieStart + visual.dieFrameCount - 1,
      }),
      frameRate: 12,
      repeat: 0,
    });
  }

  if (!anims.exists('vis-big-popo-trap')) {
    anims.create({
      key: 'vis-big-popo-trap',
      frames: anims.generateFrameNumbers('vis-big-popo', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: 0,
    });
  }

  if (!anims.exists('vis-big-popo-die')) {
    anims.create({
      key: 'vis-big-popo-die',
      frames: anims.generateFrameNumbers('vis-big-popo', { start: 4, end: 8 }),
      frameRate: 10,
      repeat: 0,
    });
  }
}

export class Player extends Phaser.GameObjects.Container {
  private velocity: PlayerVelocity = { x: 0, y: 0 };
  private facing: PlayerFacing = 'down';
  private readonly stats: PlayerStats;
  private readonly sprite: Phaser.GameObjects.Sprite;
  private trappedBubble!: Phaser.GameObjects.Sprite;
  private moving = false;
  private alive = true;
  private trapped = false;
  private trapRemainingMs = 0;
  private deathAnimationComplete = false;
  private readonly visual: CharacterVisualSettings;

  constructor(
    scene: Phaser.Scene,
    position: { x: number; y: number },
    visual: CharacterVisualSettings = PLAYER_VISUAL_SETTINGS,
    maxSpeed: number = PLAYER_SETTINGS.maxSpeed,
  ) {
    super(scene, position.x, position.y);
    scene.add.existing(this);

    this.visual = visual;
    ensureAnimations(scene.anims, visual);
    this.stats = new PlayerStats(maxSpeed);
    // vis Role1 的 OffsetY=12：逻辑中心仍在格子中心，但视觉精灵整体上移 12px。
    this.sprite = new Phaser.GameObjects.Sprite(
      scene,
      0,
      visual.spriteY,
      visual.idleTextureKey,
      6,
    );
    this.sprite
      .setOrigin(0.5, 1)
      .setDisplaySize(visual.visualWidth, visual.visualHeight);
    this.createVisuals(scene);
  }

  getVelocity(): PlayerVelocity {
    return { ...this.velocity };
  }

  setVelocity(velocity: PlayerVelocity): void {
    this.velocity = { ...velocity };
  }

  setFacing(direction: { x: number; y: number }): void {
    if (direction.x > 0) this.facing = 'right';
    if (direction.x < 0) this.facing = 'left';
    if (direction.y > 0) this.facing = 'down';
    if (direction.y < 0) this.facing = 'up';

    if (!this.moving) {
      this.setIdleFrame();
    } else {
      this.playWalkAnimation();
    }
  }

  setMoving(moving: boolean): void {
    this.moving = moving;
    if (moving) {
      this.playWalkAnimation();
    } else {
      // 即使逻辑状态已经是停止，也要重新落到固定站立帧。这样结算、
      // Bot 清空路径或动画状态被外部改变时，不会停在任意走路中间帧。
      this.setIdleFrame();
    }
  }

  /** 结算等强制暂停场景使用：同时清掉位移、走路动画和残余速度。 */
  stopMovement(): void {
    this.moving = false;
    this.setVelocity({ x: 0, y: 0 });
    // 死亡/被困有自己的动画，不能被普通站立帧覆盖。
    if (this.alive && !this.trapped) this.setIdleFrame();
  }

  setTrapped(trapped: boolean): void {
    if (trapped) {
      this.sprite.play(`${this.visual.id}-trapped`);
      this.trappedBubble.setVisible(true).play('vis-big-popo-trap');
      this.trappedBubble.once('animationcomplete-vis-big-popo-trap', () => {
        if (this.trapped) this.trappedBubble.setFrame(3);
      });
    } else {
      this.trappedBubble.stop().setVisible(false);
      this.setIdleFrame();
    }
  }

  isAlive(): boolean {
    return this.alive;
  }

  isTrapped(): boolean {
    return this.trapped;
  }

  /**
   * 判断两个角色是否已经进入“击破困泡”的接触范围。
   *
   * 这个判定属于角色交互，不参与地图碰撞：角色仍然可以互相穿过，
   * 只有自由角色穿过被困角色时，DamageSystem 才会调用 popTrapped。
   */
  isTouching(other: Player): boolean {
    const contactRange = MAP_SETTINGS.tileSize * PLAYER_SETTINGS.trapContactRangeTiles;
    return Math.abs(this.x - other.x) < contactRange
      && Math.abs(this.y - other.y) < contactRange;
  }

  /** 被自由角色接触后立即击破困泡，并进入正常死亡动画。 */
  popTrapped(): void {
    if (this.alive && this.trapped) this.kill();
  }

  isDeathAnimationComplete(): boolean {
    return this.deathAnimationComplete;
  }

  trap(durationMs: number): void {
    if (!this.alive || this.trapped) return;
    this.trapped = true;
    this.trapRemainingMs = durationMs;
    this.setMoving(false);
    this.setVelocity({ x: 0, y: 0 });
    this.setTrapped(true);
  }

  tickStatus(deltaMs: number): void {
    if (!this.trapped || !this.alive) return;
    this.trapRemainingMs -= deltaMs;
    if (this.trapRemainingMs <= 0) this.kill();
  }

  kill(): void {
    if (!this.alive) return;
    const wasTrapped = this.trapped;
    this.alive = false;
    this.trapped = false;
    this.deathAnimationComplete = false;
    this.setMoving(false);
    this.setVelocity({ x: 0, y: 0 });
    this.playDeath(wasTrapped);
  }

  playDeath(showBubble = this.trapped): void {
    this.setVisible(true);
    this.sprite.setVisible(true);
    this.deathAnimationComplete = false;
    const dieAnimationKey = `${this.visual.id}-die`;
    this.sprite.once(`animationcomplete-${dieAnimationKey}`, () => {
      // vis 在死亡动画结束后 Dispose 角色对象；隐藏整个容器可以同时
      // 清掉角色和困住角色的泡泡，避免它继续压在爆炸特效上。
      this.setVisible(false);
      this.trappedBubble.setVisible(false);
      this.deathAnimationComplete = true;
    });
    this.sprite.play(dieAnimationKey);
    if (showBubble) {
      this.trappedBubble.setVisible(true).play('vis-big-popo-die');
    } else {
      this.trappedBubble.setVisible(false);
    }
  }

  playStart(): void {
    const startAnimationKey = `${this.visual.id}-start`;
    if (!this.visual.startTextureKey) {
      this.setIdleFrame();
      return;
    }

    this.sprite.once(`animationcomplete-${startAnimationKey}`, () => {
      if (!this.moving) {
        this.setIdleFrame();
      }
    });
    this.sprite.play(startAnimationKey);
  }

  getFacing(): PlayerFacing {
    return this.facing;
  }

  getStats(): PlayerStats {
    return this.stats;
  }

  getGridPosition(): { x: number; y: number } {
    // 连续坐标是唯一真实状态；格子坐标只在需要放泡泡/判定火焰时即时计算。
    return worldToGrid(this.x, this.y);
  }

  getSortY(): number {
    // 角色的脚底就是视觉遮挡的基准点。连续坐标使贴墙滑动和跨格移动
    // 都能得到稳定的前后关系，不再依赖“上一次成功移动”这个时机。
    return getRoleDepth(this.y + this.visual.sortFootOffset);
  }

  private playWalkAnimation(): void {
    const animationKey = `${this.visual.id}-walk-${this.facing}`;
    const currentAnimation = this.sprite.anims.currentAnim;
    if (currentAnimation?.key === animationKey && this.sprite.anims.isPlaying) return;
    this.sprite.play(animationKey);
  }

  private setIdleFrame(): void {
    // 启动/死亡动画使用独立纹理；切回普通站立帧前必须恢复 Role1 纹理，
    // 否则右方向的 frame 18 会被错误地应用到只有 10 帧的 Role1Start。
    this.sprite.stop();
    this.sprite.setTexture(this.visual.idleTextureKey);
    this.sprite.setFrame(
      getDirectionRow(this.visual, this.facing) * this.visual.idleFramesPerDirection,
    );
  }

  private createVisuals(scene: Phaser.Scene): void {
    this.trappedBubble = new Phaser.GameObjects.Sprite(scene, 0, -12, 'vis-big-popo', 0)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(72, 72)
      .setVisible(false);
    this.trappedBubble.once('animationcomplete-vis-big-popo-die', () => {
      this.trappedBubble.setVisible(false);
    });
    this.add([this.sprite, this.trappedBubble]);
  }
}

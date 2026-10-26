import Phaser from 'phaser';
import { BOMB_SETTINGS } from '../data/bombSettings';
import { gridToWorldCenter } from '../domain/coordinates';
import type { Player } from './Player';

function ensureBombAnimation(anims: Phaser.Animations.AnimationManager): void {
  if (anims.exists('vis-bubble-loop')) return;
  anims.create({
    key: 'vis-bubble-loop',
    frames: anims.generateFrameNumbers('vis-popo', { start: 0, end: 2 }),
    // vis 每 200ms 切一次泡泡帧。
    frameRate: 5,
    repeat: -1,
  });
}

export class Bomb extends Phaser.GameObjects.Container {
  readonly gridX: number;
  readonly gridY: number;
  readonly blastRange: number;
  readonly owner: Player;
  private elapsedMs = 0;

  constructor(
    scene: Phaser.Scene,
    gridX: number,
    gridY: number,
    blastRange: number,
    ownerDepth: number,
    owner: Player,
  ) {
    const position = gridToWorldCenter(gridX, gridY);
    super(scene, position.x, position.y);
    scene.add.existing(this);

    ensureBombAnimation(scene.anims);
    this.gridX = gridX;
    this.gridY = gridY;
    this.blastRange = blastRange;
    this.owner = owner;
    // vis Paopao 的 ZIndex = 放置时 Master.Object.ZIndex - 1。
    this.setDepth(ownerDepth - 1);
    this.createVisuals(scene);
  }

  update(deltaMs: number): boolean {
    this.elapsedMs += deltaMs;
    return this.elapsedMs >= BOMB_SETTINGS.fuseDurationMs;
  }

  getRemainingFuseMs(): number {
    return Math.max(0, BOMB_SETTINGS.fuseDurationMs - this.elapsedMs);
  }

  private createVisuals(scene: Phaser.Scene): void {
    // vis 的 Popo.png 位于格子顶部上方 5px，中心相对逻辑格心上移 4.5px。
    const bubble = new Phaser.GameObjects.Sprite(scene, 0, -4.5, 'vis-popo', 0);
    bubble.setOrigin(0.5, 0.5).setDisplaySize(44, 41);
    bubble.play('vis-bubble-loop');
    this.add(bubble);
  }
}

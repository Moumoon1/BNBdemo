import Phaser from 'phaser';
import { ITEM_ASSETS, ITEM_SETTINGS, type ItemKind } from '../data/itemSettings';
import { gridToWorldCenter } from '../domain/coordinates';
import { getItemMotionFrame } from '../domain/itemMotion';
import { getItemDepth } from '../domain/visDepth';

function ensureItemAnimation(
  anims: Phaser.Animations.AnimationManager,
  kind: ItemKind,
): void {
  const key = `vis-${kind}-item-loop`;
  if (anims.exists(key)) return;
  anims.create({
    key,
    frames: anims.generateFrameNumbers(ITEM_ASSETS[kind], { start: 0, end: 2 }),
    // vis Gift 帧每 400ms 切换一次。
    frameRate: 2.5,
    repeat: -1,
  });
}

export class Item extends Phaser.GameObjects.Container {
  readonly gridX: number;
  readonly gridY: number;
  readonly kind: ItemKind;
  private readonly gift: Phaser.GameObjects.Sprite;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private elapsedMs = 0;

  constructor(scene: Phaser.Scene, gridX: number, gridY: number, kind: ItemKind) {
    const position = gridToWorldCenter(gridX, gridY);
    super(scene, position.x, position.y);
    scene.add.existing(this);

    this.gridX = gridX;
    this.gridY = gridY;
    this.kind = kind;
    this.setDepth(getItemDepth(gridX, gridY));
    ensureItemAnimation(scene.anims, kind);

    const visual = ITEM_SETTINGS.visual;
    this.shadow = new Phaser.GameObjects.Ellipse(
      scene,
      0,
      visual.shadowOffsetY,
      visual.shadowWidth,
      visual.shadowHeight,
      0x0f172a,
      0.3,
    );
    // vis Barrier.Create 的 Gift1/2/3：42×45，左偏移 1px、上偏移 12px。
    this.gift = new Phaser.GameObjects.Sprite(
      scene,
      visual.giftOffsetX,
      visual.giftOffsetY,
      ITEM_ASSETS[kind],
      0,
    )
      .setOrigin(0, 0)
      .setDisplaySize(visual.width, visual.height);
    this.gift.play(`vis-${kind}-item-loop`);
    this.add([this.shadow, this.gift]);
  }

  updateTick(deltaMs: number): void {
    this.elapsedMs += deltaMs;
    const frame = getItemMotionFrame(this.elapsedMs);
    // 只移动道具本体；影子始终锚在当前格子的地面上。
    this.gift.setY(ITEM_SETTINGS.visual.giftOffsetY + frame.giftOffsetY);
    this.shadow.setScale(frame.shadowScaleX, 1);
  }
}

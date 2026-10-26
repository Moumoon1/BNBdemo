import Phaser from 'phaser';
import { CRATE_SETTINGS } from '../data/crateSettings';
import { MAP_SETTINGS } from '../data/gameSettings';
import { TILE_TYPES } from '../data/mapData';
import { gridToWorldCenter } from '../domain/coordinates';
import { getDepthFromGroundY, getObstacleDepth } from '../domain/visDepth';

export class MovingCrate extends Phaser.GameObjects.Image {
  private elapsedMs = 0;
  private readonly start: { x: number; y: number };
  private readonly end: { x: number; y: number };

  constructor(
    scene: Phaser.Scene,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const start = gridToWorldCenter(from.x, from.y);
    const end = gridToWorldCenter(to.x, to.y);
    super(scene, start.x, start.y + MAP_SETTINGS.tileSize / 2, 'vis-soft-box');
    scene.add.existing(this);

    this.start = { x: start.x, y: start.y + MAP_SETTINGS.tileSize / 2 };
    this.end = { x: end.x, y: end.y + MAP_SETTINGS.tileSize / 2 };
    this.setOrigin(0.5, 1)
      .setDisplaySize(MAP_SETTINGS.tileSize, 44)
      .setDepth(getObstacleDepth(from.x, from.y, TILE_TYPES.softBox));
  }

  updateTick(deltaMs: number): boolean {
    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / CRATE_SETTINGS.slideDurationMs);
    const eased = 1 - (1 - progress) ** 3;
    this.setPosition(
      Phaser.Math.Linear(this.start.x, this.end.x, eased),
      Phaser.Math.Linear(this.start.y, this.end.y, eased),
    );
    // 箱子沿通道滑动时也按当前脚底位置排序，避免跨行移动时跳层。
    this.setDepth(getDepthFromGroundY(this.y));
    return progress >= 1;
  }
}

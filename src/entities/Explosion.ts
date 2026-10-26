import Phaser from 'phaser';
import { BOMB_SETTINGS } from '../data/bombSettings';
import { MAP_SETTINGS } from '../data/gameSettings';
import type { ExplosionCell } from '../domain/bombRules';
import { getExplosionDepth } from '../domain/visDepth';

interface ExplosionVisual {
  sprite: Phaser.GameObjects.Sprite;
  type: 'center' | 'leftEnd' | 'rightEnd' | 'upEnd' | 'downEnd' | 'leftMiddle' | 'rightMiddle' | 'upMiddle' | 'downMiddle';
}

const ATLAS_COLUMNS = 14;
const ANIMATION_START_COLUMN = 6;
const ANIMATION_END_COLUMN = 13;

function atlasFrame(column: number, row: number): number {
  return row * ATLAS_COLUMNS + column;
}

/** visolleon/bnb Explosion.png 的 40×40 图集渲染。 */
export class Explosion {
  private elapsedMs = 0;
  private readonly visuals: ExplosionVisual[] = [];

  constructor(scene: Phaser.Scene, readonly cells: readonly ExplosionCell[]) {
    this.createVisuals(scene);
  }

  update(deltaMs: number): boolean {
    this.elapsedMs += deltaMs;
    this.updateAnimationFrames();
    return this.elapsedMs >= BOMB_SETTINGS.explosionDurationMs;
  }

  destroy(): void {
    this.visuals.forEach(({ sprite }) => sprite.destroy());
    this.visuals.length = 0;
  }

  containsCell(gridX: number, gridY: number): boolean {
    return this.cells.some((cell) => cell.gridX === gridX && cell.gridY === gridY);
  }

  private createVisuals(scene: Phaser.Scene): void {
    const origin = this.cells[0];
    if (!origin) return;

    const horizontal = this.cells.filter((cell) => cell.gridY === origin.gridY && cell.gridX !== origin.gridX);
    const vertical = this.cells.filter((cell) => cell.gridX === origin.gridX && cell.gridY !== origin.gridY);
    const minHorizontal = Math.min(...horizontal.map((cell) => cell.gridX));
    const maxHorizontal = Math.max(...horizontal.map((cell) => cell.gridX));
    const minVertical = Math.min(...vertical.map((cell) => cell.gridY));
    const maxVertical = Math.max(...vertical.map((cell) => cell.gridY));

    this.cells.forEach((cell) => {
      const type = cell.gridX === origin.gridX && cell.gridY === origin.gridY
        ? 'center'
        : cell.gridY === origin.gridY
          ? cell.gridX < origin.gridX
            ? (cell.gridX === minHorizontal ? 'leftEnd' : 'leftMiddle')
            : (cell.gridX === maxHorizontal ? 'rightEnd' : 'rightMiddle')
          : cell.gridY < origin.gridY
            ? (cell.gridY === minVertical ? 'upEnd' : 'upMiddle')
            : (cell.gridY === maxVertical ? 'downEnd' : 'downMiddle');

      const sprite = new Phaser.GameObjects.Sprite(
        scene,
        MAP_SETTINGS.originX + cell.gridX * MAP_SETTINGS.tileSize + MAP_SETTINGS.tileSize / 2,
        MAP_SETTINGS.originY + cell.gridY * MAP_SETTINGS.tileSize + MAP_SETTINGS.tileSize / 2,
        'vis-explosion',
        this.getFrame(type, this.getInitialColumn(type)),
      );
      sprite.setDisplaySize(MAP_SETTINGS.tileSize, MAP_SETTINGS.tileSize);
      // 每个火焰单元按自身所在行排序；火焰在同一格中应位于角色和建筑
      // 之上，但不会因为中心点所在行而把整条十字火焰盖过地图。
      sprite.setDepth(getExplosionDepth(cell.gridY));
      scene.add.existing(sprite);
      this.visuals.push({ sprite, type });
    });
  }

  private updateAnimationFrames(): void {
    // vis 每 50ms 推进一次；模拟 tick 约 33ms，因此加半个 tick 后取整，
    // 保证第一次 tick 仍保持端点的初始第 5 列。
    const animationStep = Math.floor((this.elapsedMs + 16) / 50);
    const animationColumn = Math.min(
      ANIMATION_END_COLUMN,
      ANIMATION_START_COLUMN + Math.max(0, animationStep),
    );
    const centerColumn = Math.min(3, Math.max(0, animationStep));
    this.visuals.forEach(({ sprite, type }) => {
      sprite.setFrame(this.getFrame(type, type === 'center' ? centerColumn : animationColumn));
    });
  }

  private getInitialColumn(type: ExplosionVisual['type']): number {
    if (type === 'center') return 0;
    if (type.endsWith('Middle')) return 3;
    return 5;
  }

  private getFrame(type: ExplosionVisual['type'], animatedColumn: number): number {
    switch (type) {
      case 'center': return atlasFrame(animatedColumn, 4);
      case 'leftEnd': return atlasFrame(animatedColumn, 2);
      case 'rightEnd': return atlasFrame(animatedColumn, 3);
      case 'upEnd': return atlasFrame(animatedColumn, 0);
      case 'downEnd': return atlasFrame(animatedColumn, 1);
      case 'leftMiddle': return atlasFrame(3, 2);
      case 'rightMiddle': return atlasFrame(3, 3);
      case 'upMiddle': return atlasFrame(3, 0);
      case 'downMiddle': return atlasFrame(3, 1);
    }
  }
}

import Phaser from 'phaser';
import { MAP_SETTINGS } from '../data/gameSettings';
import type { TileType } from '../data/mapData';
import { TILE_ASSETS, TILE_HEIGHTS } from '../data/tileAssets';
import { getGroundStyle } from '../data/ground';
import { gridKey } from '../domain/coordinates';
import { getGroundDepth, getObstacleDepth } from '../domain/visDepth';

interface RenderedTile {
  tileType: TileType;
  ground: Phaser.GameObjects.Rectangle;
  obstacle?: Phaser.GameObjects.Image;
}


export class MapRenderer {
  private readonly scene: Phaser.Scene;
  private readonly renderedTiles = new Map<string, RenderedTile>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(mapData: readonly (readonly TileType[])[]): void {
    const activeKeys = new Set<string>();

    mapData.forEach((row, gridY) => {
      row.forEach((tileType, gridX) => {
        const key = gridKey(gridX, gridY);
        activeKeys.add(key);
        const current = this.renderedTiles.get(key);
        if (!current) {
          const ground = this.createGround(gridX, gridY);
          const entry: RenderedTile = { tileType, ground };
          this.scene.add.existing(ground);
          entry.obstacle = this.createObstacle(gridX, gridY, tileType);
          this.renderedTiles.set(key, entry);
          return;
        }

        if (current.tileType === tileType) return;
        current.obstacle?.destroy();
        current.tileType = tileType;
        current.obstacle = this.createObstacle(gridX, gridY, tileType);
      });
    });

    for (const [key, tile] of this.renderedTiles) {
      if (activeKeys.has(key)) continue;
      tile.ground.destroy();
      tile.obstacle?.destroy();
      this.renderedTiles.delete(key);
    }
  }

  private createGround(gridX: number, gridY: number): Phaser.GameObjects.Rectangle {
    const x = MAP_SETTINGS.originX + gridX * MAP_SETTINGS.tileSize + MAP_SETTINGS.tileSize / 2;
    const y = MAP_SETTINGS.originY + gridY * MAP_SETTINGS.tileSize + MAP_SETTINGS.tileSize / 2;
    const style = getGroundStyle(gridX, gridY);
    const ground = new Phaser.GameObjects.Rectangle(
      this.scene,
      x,
      y,
      MAP_SETTINGS.tileSize,
      MAP_SETTINGS.tileSize,
      style.fill,
      1,
    );
    ground
      .setStrokeStyle(1, style.border, 0.35)
      .setDepth(getGroundDepth());
    return ground;
  }

  private createObstacle(
    gridX: number,
    gridY: number,
    tileType: TileType,
  ): Phaser.GameObjects.Image | undefined {
    const asset = TILE_ASSETS[tileType];
    if (!asset) return undefined;

    const x = MAP_SETTINGS.originX + gridX * MAP_SETTINGS.tileSize + MAP_SETTINGS.tileSize / 2;
    const obstacle = new Phaser.GameObjects.Image(
      this.scene,
      x,
      MAP_SETTINGS.originY + (gridY + 1) * MAP_SETTINGS.tileSize,
      asset,
    );
    obstacle
      .setOrigin(0.5, 1)
      .setDisplaySize(MAP_SETTINGS.tileSize, TILE_HEIGHTS[tileType] ?? MAP_SETTINGS.tileSize)
      .setDepth(getObstacleDepth(gridX, gridY, tileType));
    this.scene.add.existing(obstacle);
    return obstacle;
  }
}

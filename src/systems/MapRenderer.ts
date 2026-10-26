import Phaser from 'phaser';
import { MAP_SETTINGS } from '../data/gameSettings';
import { TILE_TYPES, type TileType } from '../data/mapData';
import { gridKey } from '../domain/coordinates';
import { getGroundDepth, getObstacleDepth } from '../domain/visDepth';

const TILE_ASSETS: Partial<Record<TileType, string>> = {
  [TILE_TYPES.softRed]: 'vis-soft-red',
  [TILE_TYPES.softYellow]: 'vis-soft-yellow',
  [TILE_TYPES.softBox]: 'vis-soft-box',
  [TILE_TYPES.houseBlue]: 'vis-house-blue',
  [TILE_TYPES.houseRed]: 'vis-house-red',
  [TILE_TYPES.houseYellow]: 'vis-house-yellow',
  [TILE_TYPES.tree]: 'vis-tree',
};

const TILE_HEIGHTS: Partial<Record<TileType, number>> = {
  [TILE_TYPES.softRed]: 44,
  [TILE_TYPES.softYellow]: 44,
  [TILE_TYPES.softBox]: 44,
  [TILE_TYPES.houseBlue]: 57,
  [TILE_TYPES.houseRed]: 57,
  [TILE_TYPES.houseYellow]: 57,
  [TILE_TYPES.tree]: 67,
};

interface RenderedTile {
  tileType: TileType;
  ground: Phaser.GameObjects.Rectangle;
  obstacle?: Phaser.GameObjects.Image;
}

// 复制 vis 的 townGroundMap：TownGround.png 是 7 个 40×40 地面帧横向图集。
const GROUND_LAYOUT = [
  [1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1, 1],
  [2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2, 1],
  [2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1],
  [1, 2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2],
  [2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [3, 2, 2, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 2],
  [2, 1, 1, 1, 1, 1, 1, 3, 1, 3, 1, 1, 1, 1, 1],
];

export class MapRenderer {
  private readonly scene: Phaser.Scene;
  private readonly renderedTiles = new Map<string, RenderedTile>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    scene.add.image(400, 300, 'vis-bg').setDepth(-100);
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
    const groundKind = GROUND_LAYOUT[gridY][gridX];
    const ground = new Phaser.GameObjects.Rectangle(
      this.scene,
      x,
      y,
      MAP_SETTINGS.tileSize,
      MAP_SETTINGS.tileSize,
      groundKind === 3 ? 0x9b9b9b : groundKind === 2 ? 0x78d33e : 0x6dcc34,
      1,
    );
    ground
      .setStrokeStyle(1, groundKind === 3 ? 0xbdbdbd : 0x83e24a, 0.35)
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

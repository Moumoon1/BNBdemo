import { MAP_DATA, TILE_TYPES, type TileType } from './mapData';

export class MapState {
  private readonly tiles: TileType[][];

  constructor(source: readonly (readonly TileType[])[] = MAP_DATA) {
    this.tiles = source.map((row) => [...row]);
  }

  getTile(gridX: number, gridY: number): TileType | undefined {
    return this.tiles[gridY]?.[gridX];
  }

  isWalkableCell(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile === TILE_TYPES.floor;
  }

  isDestructibleCell(gridX: number, gridY: number): boolean {
    const tile = this.getTile(gridX, gridY);
    return tile === TILE_TYPES.softRed
      || tile === TILE_TYPES.softYellow
      || tile === TILE_TYPES.softBox;
  }

  destroyCell(gridX: number, gridY: number): boolean {
    if (!this.isDestructibleCell(gridX, gridY)) return false;
    this.tiles[gridY][gridX] = TILE_TYPES.floor;
    return true;
  }

  startSoftBoxMove(fromX: number, fromY: number, toX: number, toY: number): boolean {
    if (this.getTile(fromX, fromY) !== TILE_TYPES.softBox) return false;
    if (!this.isWalkableCell(toX, toY)) return false;
    this.tiles[fromY][fromX] = TILE_TYPES.floor;
    return true;
  }

  placeSoftBox(gridX: number, gridY: number): boolean {
    if (!this.isWalkableCell(gridX, gridY)) return false;
    this.tiles[gridY][gridX] = TILE_TYPES.softBox;
    return true;
  }

  getSnapshot(): readonly (readonly TileType[])[] {
    return this.tiles;
  }
}

import { MAP_SETTINGS } from './gameSettings';

// 数值直接沿用 visolleon/bnb 的 townBarrierMap：
// 0 地面；1/2/3 可炸方块；4/5/6 房屋；7 树。
export const TILE_TYPES = {
  floor: 0,
  softRed: 1,
  softYellow: 2,
  softBox: 3,
  houseBlue: 4,
  houseRed: 5,
  houseYellow: 6,
  tree: 7,
} as const;

export type TileType = (typeof TILE_TYPES)[keyof typeof TILE_TYPES];

// 9 × 12 portrait village. Open spawn areas connect to multiple escape routes;
// permanent buildings form islands, while crates open routes during play.
export const MAP_DATA: readonly (readonly TileType[])[] = [
  [0, 0, 3, 1, 0, 2, 3, 0, 0],
  [0, 5, 0, 7, 0, 7, 0, 4, 0],
  [0, 3, 0, 2, 0, 1, 0, 3, 0],
  [2, 5, 0, 7, 3, 7, 0, 4, 1],
  [0, 0, 3, 0, 0, 0, 3, 0, 0],
  [3, 7, 0, 6, 1, 5, 0, 7, 3],
  [0, 0, 1, 0, 0, 0, 2, 0, 0],
  [1, 4, 0, 7, 3, 7, 0, 6, 2],
  [0, 3, 0, 1, 0, 2, 0, 3, 0],
  [0, 4, 0, 7, 0, 7, 0, 6, 0],
  [2, 0, 3, 0, 0, 0, 3, 0, 1],
  [0, 0, 1, 0, 0, 0, 2, 0, 0],
];

function validateMap(data: readonly (readonly TileType[])[]): void {
  if (data.length !== MAP_SETTINGS.rows || data.some((row) => row.length !== MAP_SETTINGS.columns)) {
    throw new Error(`地图尺寸错误：需要 ${MAP_SETTINGS.columns} × ${MAP_SETTINGS.rows}`);
  }
}

validateMap(MAP_DATA);

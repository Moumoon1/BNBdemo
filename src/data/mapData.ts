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

export const MAP_DATA: readonly (readonly TileType[])[] = [
  [0, 3, 1, 5, 1, 7, 0, 7, 0, 7, 1, 4, 1, 4, 0],
  [0, 0, 3, 0, 0, 1, 0, 0, 0, 1, 2, 1, 2, 0, 0],
  [3, 5, 3, 5, 1, 7, 3, 7, 3, 7, 1, 4, 1, 4, 0],
  [0, 3, 2, 1, 7, 3, 3, 1, 3, 3, 7, 1, 2, 1, 2],
  [1, 7, 1, 7, 3, 3, 7, 0, 7, 3, 3, 7, 1, 7, 1],
  [2, 0, 3, 0, 0, 7, 1, 1, 1, 7, 0, 0, 3, 0, 2],
  [2, 7, 1, 7, 0, 2, 3, 3, 3, 2, 0, 7, 1, 7, 2],
  [2, 0, 3, 0, 0, 7, 1, 1, 1, 7, 0, 0, 3, 0, 2],
  [1, 7, 1, 7, 3, 3, 7, 2, 7, 3, 3, 7, 1, 7, 1],
  [2, 1, 2, 1, 7, 3, 3, 1, 3, 3, 7, 1, 2, 1, 2],
  [0, 4, 1, 4, 1, 7, 3, 7, 3, 7, 1, 6, 1, 6, 0],
  [0, 0, 2, 1, 2, 1, 0, 0, 0, 1, 2, 1, 2, 0, 0],
  [0, 4, 1, 4, 1, 7, 0, 7, 0, 7, 1, 6, 1, 6, 0],
];

function validateMap(data: readonly (readonly TileType[])[]): void {
  if (data.length !== MAP_SETTINGS.rows || data.some((row) => row.length !== MAP_SETTINGS.columns)) {
    throw new Error(`地图尺寸错误：需要 ${MAP_SETTINGS.columns} × ${MAP_SETTINGS.rows}`);
  }
}

validateMap(MAP_DATA);

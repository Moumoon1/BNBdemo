import { TILE_TYPES, type TileType } from './mapData';

export const TILE_ASSETS: Partial<Record<TileType, string>> = {
  [TILE_TYPES.softRed]: 'vis-soft-red',
  [TILE_TYPES.softYellow]: 'vis-soft-yellow',
  [TILE_TYPES.softBox]: 'vis-soft-box',
  [TILE_TYPES.houseBlue]: 'vis-house-blue',
  [TILE_TYPES.houseRed]: 'vis-house-red',
  [TILE_TYPES.houseYellow]: 'vis-house-yellow',
  [TILE_TYPES.tree]: 'vis-tree',
};

export const TILE_HEIGHTS: Partial<Record<TileType, number>> = {
  [TILE_TYPES.softRed]: 44, [TILE_TYPES.softYellow]: 44, [TILE_TYPES.softBox]: 44,
  [TILE_TYPES.houseBlue]: 57, [TILE_TYPES.houseRed]: 57, [TILE_TYPES.houseYellow]: 57,
  [TILE_TYPES.tree]: 67,
};

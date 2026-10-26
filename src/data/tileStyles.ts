import { TILE_TYPES, type TileType } from './mapData';

// 地图障碍现在由 vis 素材渲染；这些样式仅作为类型的兜底/调试颜色。
export interface TileStyle {
  fillColor: number;
  borderColor: number;
}

export const TILE_STYLES: Record<TileType, TileStyle> = {
  [TILE_TYPES.floor]: { fillColor: 0x777777, borderColor: 0x777777 },
  [TILE_TYPES.softRed]: { fillColor: 0xef3d27, borderColor: 0xffa07a },
  [TILE_TYPES.softYellow]: { fillColor: 0xffa11a, borderColor: 0xffd166 },
  [TILE_TYPES.softBox]: { fillColor: 0xd99a28, borderColor: 0xffdd75 },
  [TILE_TYPES.houseBlue]: { fillColor: 0x1f9ce0, borderColor: 0x9edfff },
  [TILE_TYPES.houseRed]: { fillColor: 0xef3d27, borderColor: 0xffa07a },
  [TILE_TYPES.houseYellow]: { fillColor: 0xf2c94c, borderColor: 0xffef9b },
  [TILE_TYPES.tree]: { fillColor: 0x20a83a, borderColor: 0x8ded62 },
};

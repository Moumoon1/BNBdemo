import { MAP_DATA, type TileType } from './mapData';
import { MAP_SETTINGS } from './gameSettings';

export interface MapDefinition {
  readonly id: string;
  readonly name: string;
  readonly number: string;
  readonly tag: string;
  readonly description: string;
  readonly tiles: readonly (readonly TileType[])[];

}

export const MAPS: readonly MapDefinition[] = [
  {
    id: 'village', number: '01', name: '经典村庄', tag: '均衡布局',
    description: '熟悉的小屋与十字街道。推开箱子，\n在转角给对手一个惊喜。',
    tiles: MAP_DATA,
  },
  {
    id: 'forest', number: '02', name: '森林迷径', tag: '迂回穿梭',
    description: '穿梭在树林与小径之间。利用岔路，\n避开爆炸，再找机会反击。',
    tiles: [
      [0, 0, 3, 7, 0, 7, 3, 0, 0],
      [0, 7, 0, 3, 0, 3, 0, 7, 0],
      [0, 3, 0, 7, 2, 7, 0, 3, 0],
      [3, 7, 0, 0, 0, 0, 0, 7, 3],
      [0, 0, 2, 7, 0, 7, 2, 0, 0],
      [0, 7, 3, 0, 3, 0, 3, 7, 0],
      [0, 7, 0, 7, 0, 7, 0, 7, 0],
      [0, 3, 0, 0, 0, 0, 0, 3, 0],
      [3, 7, 1, 7, 2, 7, 1, 7, 3],
      [0, 0, 0, 3, 0, 3, 0, 0, 0],
      [0, 7, 3, 0, 0, 0, 3, 7, 0],
      [0, 0, 2, 0, 0, 0, 2, 0, 0],
    ],
  },
  {
    id: 'plaza', number: '03', name: '彩虹街区', tag: '开阔交锋',
    description: '彩色屋顶围绕着开阔广场。炸开路障，\n小心长街上的连锁泡泡！',
    tiles: [
      [0, 0, 1, 0, 2, 0, 1, 0, 0],
      [0, 3, 0, 3, 0, 3, 0, 3, 0],
      [0, 4, 0, 6, 0, 5, 0, 4, 0],
      [0, 0, 3, 0, 1, 0, 3, 0, 0],
      [1, 0, 0, 0, 0, 0, 0, 0, 1],
      [0, 5, 2, 0, 3, 0, 2, 6, 0],
      [0, 0, 0, 3, 0, 3, 0, 0, 0],
      [3, 4, 0, 5, 2, 6, 0, 4, 3],
      [0, 0, 1, 0, 0, 0, 1, 0, 0],
      [2, 0, 0, 3, 0, 3, 0, 0, 2],
      [0, 6, 1, 0, 0, 0, 1, 5, 0],
      [0, 0, 3, 0, 0, 0, 3, 0, 0],
    ],
  },
];

for (const map of MAPS) {
  if (map.tiles.length !== MAP_SETTINGS.rows || map.tiles.some((row) => row.length !== MAP_SETTINGS.columns)) {
    throw new Error(`地图 ${map.id} 尺寸错误`);
  }
}

export function getMapDefinition(id: unknown): MapDefinition {
  return MAPS.find((map) => map.id === id) ?? MAPS[0];
}


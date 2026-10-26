import { MAP_SETTINGS } from '../data/gameSettings';
import type { TileType } from '../data/mapData';

// 深度统一使用场景内的“脚底 Y”。这样角色在格子之间移动时，前后
// 关系会连续变化；同一条通道内则由很小的偏移保证角色不会因为建筑
// 被销毁/重建而突然被盖住。
const ROLE_DEPTH_BIAS = 0.1;
const ITEM_DEPTH_BIAS = -0.1;
const EXPLOSION_DEPTH_BIAS = 0.2;

function getTileBottomY(gridY: number): number {
  return MAP_SETTINGS.originY + (gridY + 1) * MAP_SETTINGS.tileSize;
}

export function getDepthFromGroundY(groundY: number): number {
  return groundY;
}

export function getGroundDepth(): number {
  return 1;
}

// 保留 gridX 参数是为了让地图、道具、箱子共享同一个领域接口；
// vis 原版的 x 分层会导致相邻通道的建筑压住角色，因此这里按脚底 YSort。
export function getMapRowDepth(_gridX: number, gridY: number): number {
  return getDepthFromGroundY(getTileBottomY(gridY));
}

export function getObstacleDepth(_gridX: number, gridY: number, _tileType: TileType): number {
  return getMapRowDepth(0, gridY);
}

export function getRoleDepth(groundY: number): number {
  return getDepthFromGroundY(groundY) + ROLE_DEPTH_BIAS;
}

export function getItemDepth(_gridX: number, gridY: number): number {
  return getMapRowDepth(0, gridY) + ITEM_DEPTH_BIAS;
}

export function getExplosionDepth(gridY: number): number {
  return getMapRowDepth(0, gridY) + EXPLOSION_DEPTH_BIAS;
}

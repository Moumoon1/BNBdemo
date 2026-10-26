import { MAP_SETTINGS } from '../data/gameSettings';
import { gridToWorldCenter, type GridPosition } from './coordinates';

export interface CrateCollisionActor {
  readonly x: number;
  readonly y: number;
  isAlive(): boolean;
}

/** 移动箱子的扫掠范围同时占用源格和目标格，防止角色从任一侧穿箱。 */
export function getMovingCrateBlockedCells(
  from: GridPosition,
  to: GridPosition,
): readonly GridPosition[] {
  return [from, to];
}

/** 与 tpoison 的 overlapsTile 一致：角色碰撞方块与目标格有真实重叠即视为占用。 */
export function isCellOccupiedByActor(
  actors: readonly CrateCollisionActor[],
  gridX: number,
  gridY: number,
): boolean {
  const center = gridToWorldCenter(gridX, gridY);
  return actors.some((actor) => actor.isAlive()
    && Math.abs(actor.x - center.x) < MAP_SETTINGS.tileSize
    && Math.abs(actor.y - center.y) < MAP_SETTINGS.tileSize);
}

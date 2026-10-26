import { MapState } from '../data/MapState';
import { TILE_TYPES } from '../data/mapData';
import { DIRECTIONS } from './directions';
import { gridKey } from './coordinates';

export interface ExplosionCell {
  gridX: number;
  gridY: number;
}

export function computeFlameCells(
  mapState: MapState,
  originX: number,
  originY: number,
  blastRange: number,
): ExplosionCell[] {
  const cells: ExplosionCell[] = [{ gridX: originX, gridY: originY }];

  for (const direction of DIRECTIONS) {
    for (let distance = 1; distance <= blastRange; distance += 1) {
      const gridX = originX + direction.x * distance;
      const gridY = originY + direction.y * distance;
      const tile = mapState.getTile(gridX, gridY);

      // 地图外和硬障碍会挡住火焰，且自身不产生火焰格。
      if (tile === undefined || tile >= TILE_TYPES.houseBlue) break;

      cells.push({ gridX, gridY });

      // 可破坏方块会被烧掉，但火焰不能穿过它继续延伸。
      if (mapState.isDestructibleCell(gridX, gridY)) break;
    }
  }

  return cells;
}

export function hasExplosionCell(cells: readonly ExplosionCell[], gridX: number, gridY: number): boolean {
  return cells.some((cell) => gridKey(cell.gridX, cell.gridY) === gridKey(gridX, gridY));
}

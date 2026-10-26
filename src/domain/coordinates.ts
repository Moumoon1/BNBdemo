import { MAP_SETTINGS } from '../data/gameSettings';

export interface GridPosition {
  x: number;
  y: number;
}

export function worldToGrid(x: number, y: number): GridPosition {
  return {
    x: Math.floor((x - MAP_SETTINGS.originX) / MAP_SETTINGS.tileSize),
    y: Math.floor((y - MAP_SETTINGS.originY) / MAP_SETTINGS.tileSize),
  };
}

export function gridToWorldCenter(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: MAP_SETTINGS.originX + (gridX + 0.5) * MAP_SETTINGS.tileSize,
    y: MAP_SETTINGS.originY + (gridY + 0.5) * MAP_SETTINGS.tileSize,
  };
}

export function gridBounds(gridX: number, gridY: number) {
  const left = MAP_SETTINGS.originX + gridX * MAP_SETTINGS.tileSize;
  const top = MAP_SETTINGS.originY + gridY * MAP_SETTINGS.tileSize;
  return {
    left,
    right: left + MAP_SETTINGS.tileSize,
    top,
    bottom: top + MAP_SETTINGS.tileSize,
  };
}

export function gridKey(gridX: number, gridY: number): string {
  return `${gridX}:${gridY}`;
}

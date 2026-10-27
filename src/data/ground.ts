import { MAP_SETTINGS } from './gameSettings';

// All maps keep the original portrait village ground. Only obstacles vary.
export const GROUND_EDGE = 0xd1e7bf;

export function getGroundStyle(x: number, y: number): { fill: number; border: number } {
  const road = x === Math.floor(MAP_SETTINGS.columns / 2) || y === 4 || y === 8;
  return {
    fill: road ? 0x9b9b9b : (x + y * 3) % 5 === 0 ? 0x78d33e : 0x6dcc34,
    border: road ? 0xbdbdbd : 0x83e24a,
  };
}

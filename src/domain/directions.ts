export interface DirectionVector {
  x: number;
  y: number;
}

export const DIRECTIONS: readonly DirectionVector[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export const MAP_SETTINGS = {
  columns: 15,
  rows: 13,
  tileSize: 40,
  originX: 20,
  originY: 40,
} as const;

export const SIDEBAR_SETTINGS = {
  x: 640,
  width: 160,
} as const;

export const UI_DEPTH = {
  sidebar: 1000,
  result: 1200,
} as const;

export const GAME_SETTINGS = {
  width: 800,
  height: 600,
  backgroundColor: '#0868ad',
  roundDurationSeconds: 90,
  simulationTickMs: 1000 / 30,
} as const;

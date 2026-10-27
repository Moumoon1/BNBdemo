export const MAP_SETTINGS = {
  columns: 9,
  rows: 12,
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
  width: 414,
  height: 896,
  backgroundColor: '#f1f6fb',
  roundDurationSeconds: 90,
  simulationTickMs: 1000 / 30,
} as const;

// Leave room around edge cells for sprites that extend beyond their tile.
const MAP_VIEW_WIDTH = MAP_SETTINGS.columns * MAP_SETTINGS.tileSize + 16;
const MAP_VIEW_HEIGHT = MAP_SETTINGS.rows * MAP_SETTINGS.tileSize + 32;
const MAP_ZOOM = 386 / MAP_VIEW_WIDTH;

export const MOBILE_LAYOUT = {
  mapX: 14,
  mapY: 124,
  mapWidth: 386,
  mapHeight: MAP_VIEW_HEIGHT * MAP_ZOOM,
  mapZoom: MAP_ZOOM,
  mapCenterX: MAP_SETTINGS.originX + MAP_SETTINGS.columns * MAP_SETTINGS.tileSize / 2,
  mapCenterY: MAP_SETTINGS.originY - 28 + MAP_VIEW_HEIGHT / 2,
  statsY: 679,
  controlsLabelY: 868,
  joystickX: 104,
  joystickY: 788,
  joystickRadius: 66,
  joystickTravel: 40,
  joystickDeadZone: 10,
  bombX: 318,
  bombY: 788,
  bombRadius: 51,
} as const;

import { gridToWorldCenter } from '../domain/coordinates';

export const BOT_SETTINGS = {
  // 竖屏地图右上角，出生区向左、向下都有逃生空间。
  spawnGridX: 8,
  spawnGridY: 0,
  maxSpeed: 180,
  // 连续两次收到真实的碰撞阻挡后才放弃当前路点，过滤单帧边界抖动。
  blockedFeedbackTicks: 2,
  // 失败方向暂时记忆 3 秒，避免在同一格左右反复重试。
  failedDirectionTtlTicks: 90,
  maxSearchDepth: 64,
  objectiveRefreshTicks: 15,
  bombEscapeMarginMs: 350,
} as const;

export function getBotSpawnPosition(): { x: number; y: number } {
  return gridToWorldCenter(BOT_SETTINGS.spawnGridX, BOT_SETTINGS.spawnGridY);
}

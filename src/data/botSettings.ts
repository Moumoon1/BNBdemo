import { gridToWorldCenter } from '../domain/coordinates';

export const BOT_SETTINGS = {
  // 选在 vis 地图上有多个出口的开放格，避免 Bot 一出生就在边角死路。
  spawnGridX: 6,
  spawnGridY: 1,
  maxSpeed: 180,
  // 连续两次收到真实的碰撞阻挡后才放弃当前路点，过滤单帧边界抖动。
  blockedFeedbackTicks: 2,
  // 失败方向暂时记忆 3 秒，避免在同一格左右反复重试。
  failedDirectionTtlTicks: 90,
  maxSearchDepth: 64,
  bombEscapeMarginMs: 350,
} as const;

export const SECOND_BOT_SPAWN = {
  // 地图下方中间的三向通道，与玩家及第一个 Bot 保持足够出生距离。
  gridX: 8,
  gridY: 11,
} as const;

export function getBotSpawnPosition(): { x: number; y: number } {
  return gridToWorldCenter(BOT_SETTINGS.spawnGridX, BOT_SETTINGS.spawnGridY);
}

export function getSecondBotSpawnPosition(): { x: number; y: number } {
  return gridToWorldCenter(SECOND_BOT_SPAWN.gridX, SECOND_BOT_SPAWN.gridY);
}

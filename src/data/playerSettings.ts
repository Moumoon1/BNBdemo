import { gridToWorldCenter } from '../domain/coordinates';

const ROLE_FRAME_WIDTH = 48;
const ROLE_FRAME_HEIGHT = 64;

export const PLAYER_SETTINGS = {
  spawnGridX: 0,
  spawnGridY: 0,
  // vis bnbRole.js 的 MoveStep=4、20ms 一次，对应 200 px/s。
  maxSpeed: 200,
  acceleration: 1100,
  deceleration: 1450,
  // vis 使用角色中心点前方 20px 的探点判定移动；视觉角色仍然保持 48×64。
  // 85bits 只负责在探点被挡时选择另一条可行轴。
  // visolleon/bnb 的 Role1 原始显示尺寸。
  visualWidth: ROLE_FRAME_WIDTH,
  visualHeight: ROLE_FRAME_HEIGHT,
  // Container 的逻辑点在角色中心，排序点在角色脚底。
  sortFootOffset: 20,
  // tpoison 的 updateTraps 使用 0.7 个格宽作为自由角色击破困泡的接触范围。
  trapContactRangeTiles: 0.7,
  faceRadius: 5,
  bodyColor: 0x38bdf8,
  bodyOutlineColor: 0xe0f2fe,
} as const;

export function getPlayerSpawnPosition(): { x: number; y: number } {
  return gridToWorldCenter(PLAYER_SETTINGS.spawnGridX, PLAYER_SETTINGS.spawnGridY);
}

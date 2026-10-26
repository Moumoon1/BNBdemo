import { ITEM_SETTINGS } from '../data/itemSettings';

export interface ItemMotionFrame {
  readonly giftOffsetY: number;
  readonly shadowScaleX: number;
}

/**
 * vis 的道具每 100ms 上下移动 1px，最高离地约 5px；影子留在地面。
 * 这里用等价的三角波保持幅度和周期，同时避免低帧率时出现跳动。
 */
export function getItemMotionFrame(elapsedMs: number): ItemMotionFrame {
  const { floatAmplitude, floatCycleMs, shadowPeakScaleX } = ITEM_SETTINGS.visual;
  const normalized = ((elapsedMs % floatCycleMs) + floatCycleMs) % floatCycleMs / floatCycleMs;
  const lift = normalized <= 0.5 ? normalized * 2 : (1 - normalized) * 2;

  return {
    giftOffsetY: lift === 0 ? 0 : -floatAmplitude * lift,
    shadowScaleX: 1 - (1 - shadowPeakScaleX) * lift,
  };
}

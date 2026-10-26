export type ItemKind = 'bomb' | 'shoe' | 'range';

export const ITEM_SETTINGS = {
  dropRate: 0.5,
  pickupAnimationMs: 120,
  speedIncrease: 24,
  kinds: ['bomb', 'shoe', 'range'] as const,
  visual: {
    width: 42,
    height: 45,
    // vis 的格子左上角偏移：(-1, -12)。容器锚在格子中心，故为 (-21, -32)。
    giftOffsetX: -21,
    giftOffsetY: -32,
    shadowWidth: 18,
    shadowHeight: 9,
    // vis ShadowGift 顶边位于格子顶边 +28px；换算成椭圆中心是格心 +12.5px。
    shadowOffsetY: 12.5,
    floatAmplitude: 5,
    floatCycleMs: 1_000,
    shadowPeakScaleX: 0.82,
  },
} as const;

export const ITEM_ASSETS: Record<ItemKind, string> = {
  bomb: 'vis-gift-1',
  shoe: 'vis-gift-2',
  range: 'vis-gift-3',
};

export function rollItemKind(random = Math.random): ItemKind | undefined {
  if (random() >= ITEM_SETTINGS.dropRate) return undefined;
  const index = Math.floor(random() * ITEM_SETTINGS.kinds.length);
  return ITEM_SETTINGS.kinds[index];
}

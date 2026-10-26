import { describe, expect, it } from 'vitest';
import { ITEM_SETTINGS } from '../data/itemSettings';
import { getItemMotionFrame } from './itemMotion';

describe('getItemMotionFrame', () => {
  it('lifts only the item while the ground shadow stays independently anchored', () => {
    const start = getItemMotionFrame(0);
    const peak = getItemMotionFrame(ITEM_SETTINGS.visual.floatCycleMs / 2);
    const end = getItemMotionFrame(ITEM_SETTINGS.visual.floatCycleMs);

    expect(start.giftOffsetY).toBe(0);
    expect(peak.giftOffsetY).toBe(-ITEM_SETTINGS.visual.floatAmplitude);
    expect(end.giftOffsetY).toBe(0);
    expect(peak.shadowScaleX).toBe(ITEM_SETTINGS.visual.shadowPeakScaleX);
  });
});

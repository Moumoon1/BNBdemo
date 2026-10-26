import { describe, expect, it } from 'vitest';
import { getTimerDigitFrames } from './timerDigits';

describe('getTimerDigitFrames', () => {
  it('maps the 90 second countdown to vis bitmap frames', () => {
    expect(getTimerDigitFrames(90)).toEqual([0, 1, 3, 0]);
  });

  it('clamps the countdown at zero', () => {
    expect(getTimerDigitFrames(-1)).toEqual([0, 0, 0, 0]);
  });
});

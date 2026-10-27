import { describe, expect, it } from 'vitest';
import { getJoystickDirection, getJoystickMovement } from './joystick';

describe('mobile joystick', () => {
  it('ignores resting fingers and small movements', () => {
    expect(getJoystickDirection(0, 0)).toEqual({ x: 0, y: 0 });
    expect(getJoystickDirection(6, -6)).toEqual({ x: 0, y: 0 });
  });

  it('uses the dominant axis for facing and pushing', () => {
    expect(getJoystickDirection(30, 12)).toEqual({ x: 1, y: 0 });
    expect(getJoystickDirection(-30, 12)).toEqual({ x: -1, y: 0 });
    expect(getJoystickDirection(12, -30)).toEqual({ x: 0, y: -1 });
    expect(getJoystickDirection(12, 30)).toEqual({ x: 0, y: 1 });
  });

  it('keeps a unit direction when dragged far beyond the pad', () => {
    expect(getJoystickDirection(-800, 200)).toEqual({ x: -1, y: 0 });
  });
});


describe('joystick movement vector', () => {
  it('keeps both axes for deliberate diagonals, at the same per-axis speed as keyboard input', () => {
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        expect(getJoystickMovement(x * 40, y * 25)).toEqual({ x, y });
        expect(getJoystickMovement(x * 25, y * 40)).toEqual({ x, y });
      }
    }
  });

  it('ignores slight side drift when walking straight', () => {
    expect(getJoystickMovement(40, 5)).toEqual({ x: 1, y: 0 });
    expect(getJoystickMovement(-4, -40)).toEqual({ x: 0, y: -1 });
  });

  it('stops inside the dead zone and caps input when dragged beyond the pad', () => {
    expect(getJoystickMovement(0, 0)).toEqual({ x: 0, y: 0 });
    expect(getJoystickMovement(6, -6)).toEqual({ x: 0, y: 0 });
    expect(getJoystickMovement(400, -300)).toEqual({ x: 1, y: -1 });
  });
});

import { MOBILE_LAYOUT } from '../data/gameSettings';

/** Facing and crate pushes must remain cardinal, even when moving diagonally. */
export function getJoystickDirection(dx: number, dy: number): { x: number; y: number } {
  if (Math.hypot(dx, dy) < MOBILE_LAYOUT.joystickDeadZone) return { x: 0, y: 0 };
  return Math.abs(dx) > Math.abs(dy)
    ? { x: Math.sign(dx), y: 0 }
    : { x: 0, y: Math.sign(dy) };
}

/** Match keyboard per-axis movement, with a 22.5° straight-ahead sector.
 * Small sideways finger drift stays cardinal; deliberate diagonals retain both
 * axes so CollisionSystem can slide along the unblocked axis at keyboard speed.
 */
export function getJoystickMovement(dx: number, dy: number): { x: number; y: number } {
  if (Math.hypot(dx, dy) < MOBILE_LAYOUT.joystickDeadZone) return { x: 0, y: 0 };
  const threshold = Math.max(Math.abs(dx), Math.abs(dy)) * Math.tan(Math.PI / 8);
  return {
    x: Math.abs(dx) >= threshold ? Math.sign(dx) : 0,
    y: Math.abs(dy) >= threshold ? Math.sign(dy) : 0,
  };
}

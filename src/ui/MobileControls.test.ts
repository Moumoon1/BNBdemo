import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import type { InputSystem } from '../systems/InputSystem';
import { MOBILE_LAYOUT as L } from '../data/gameSettings';
import { MobileControls } from './MobileControls';

vi.mock('phaser', () => ({ default: {
  Scale: { Events: { RESIZE: 'resize' } },
  GameObjects: { Events: { DESTROY: 'destroy' } },
  Core: { Events: { BLUR: 'blur', HIDDEN: 'hidden' } },
  Scenes: { Events: { SHUTDOWN: 'shutdown' } },
} }));

class Events {
  private listeners: { event: string; callback: (...args: any[]) => void; context?: unknown; once?: boolean }[] = [];
  on(event: string, callback: (...args: any[]) => void, context?: unknown): void {
    this.listeners.push({ event, callback, context });
  }
  once(event: string, callback: (...args: any[]) => void): void {
    this.listeners.push({ event, callback, once: true });
  }
  off(event: string, callback: (...args: any[]) => void): void {
    this.listeners = this.listeners.filter((item) => item.event !== event || item.callback !== callback);
  }
  emit(event: string, ...args: unknown[]): void {
    for (const item of [...this.listeners]) {
      if (item.event !== event) continue;
      if (item.once) this.off(event, item.callback);
      item.callback.apply(item.context, args);
    }
  }
}

function setup() {
  const shape = { once() { return this; }, setFontSize() { return this; }, setResolution() { return this; }, setStrokeStyle() { return this; }, setOrigin() { return this; }, setScale() { return this; }, setFillStyle() { return this; }, setPosition() { return this; } };
  const scene = {
    add: { container: () => shape, circle: () => shape, sprite: () => shape, text: () => shape },
    input: new Events(), events: new Events(),
    scale: Object.assign(new Events(), { displaySize: { width: 414 }, gameSize: { width: 414 } }),
    game: { events: new Events(), canvas: new EventTarget() },
  };
  const input = { setTouchInput: vi.fn(), pressBomb: vi.fn() };
  const controls = new MobileControls(scene as unknown as Phaser.Scene, input as unknown as InputSystem);
  return { scene, input, controls };
}

const stick = { id: 1, x: L.joystickX + 35, y: L.joystickY };
const bomb = { id: 2, x: L.bombX, y: L.bombY };

describe('mobile touch controls', () => {
  it('lets a second finger place a bomb without interrupting movement', () => {
    const { scene, input } = setup();
    scene.input.emit('pointerdown', stick);
    scene.input.emit('pointerdown', bomb);
    scene.input.emit('pointerup', bomb);
    expect(input.pressBomb).toHaveBeenCalledTimes(1);
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 1, y: 0 }, { x: 1, y: 0 });
    scene.input.emit('pointermove', { ...stick, x: L.joystickX, y: L.joystickY - 100 });
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 0, y: -1 }, { x: 0, y: -1 });
    scene.input.emit('pointermove', { ...stick, y: L.joystickY - 25 });
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 1, y: 0 }, { x: 1, y: -1 });
    scene.input.emit('pointerupoutside', stick);
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  it('ignores a third finger trying to take over the joystick', () => {
    const { scene, input } = setup();
    scene.input.emit('pointerdown', stick);
    scene.input.emit('pointerdown', { ...stick, id: 3, x: L.joystickX - 35 });
    scene.input.emit('pointermove', { ...stick, id: 3, x: L.joystickX - 35 });
    expect(input.setTouchInput).toHaveBeenCalledTimes(1);
  });

  it.each(['blur', 'hidden', 'touchcancel'])('releases movement after %s', (event) => {
    const { scene, input } = setup();
    scene.input.emit('pointerdown', stick);
    if (event === 'touchcancel') scene.game.canvas.dispatchEvent(new Event(event));
    else scene.game.events.emit(event);
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 0, y: 0 });
    scene.input.emit('pointermove', stick);
    expect(input.setTouchInput).toHaveBeenLastCalledWith({ x: 0, y: 0 });
  });

  it('disables controls when the round ends and removes listeners on shutdown', () => {
    const { scene, input, controls } = setup();
    scene.input.emit('pointerdown', stick);
    controls.disable();
    scene.input.emit('pointerdown', bomb);
    expect(input.pressBomb).not.toHaveBeenCalled();
    scene.events.emit('shutdown');
    input.setTouchInput.mockClear();
    scene.input.emit('pointerdown', stick);
    scene.game.events.emit('blur');
    expect(input.setTouchInput).not.toHaveBeenCalled();
  });
});

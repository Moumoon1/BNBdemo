import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import type Phaser from 'phaser';
import { MAP_SETTINGS, GAME_SETTINGS } from '../data/gameSettings';
import { MapState } from '../data/MapState';
import { TILE_TYPES, type TileType } from '../data/mapData';
import { gridToWorldCenter, worldToGrid } from '../domain/coordinates';
import { getJoystickDirection, getJoystickMovement } from '../domain/joystick';
import type { Player } from '../entities/Player';
import { CollisionSystem } from './CollisionSystem';
import { InputSystem } from './InputSystem';
import { MovementSystem } from './MovementSystem';

vi.mock('phaser', () => ({ default: {
  Core: { Events: { BLUR: 'blur', HIDDEN: 'hidden' } },
  Scenes: { Events: { SHUTDOWN: 'shutdown' } },
} }));

function setup(walls: [number, number][] = []) {
  const tiles = Array.from({ length: MAP_SETTINGS.rows }, () => Array<TileType>(MAP_SETTINGS.columns).fill(TILE_TYPES.floor));
  walls.forEach(([x, y]) => { tiles[y][x] = TILE_TYPES.houseBlue; });
  const keys = new Map<string, EventEmitter>();
  const scene = {
    input: { keyboard: {
      addKey: (name: string) => { const key = new EventEmitter(); keys.set(name, key); return key; },
      removeKey: vi.fn(),
    } },
    game: { events: new EventEmitter() }, events: new EventEmitter(),
  } as unknown as Phaser.Scene;
  const input = new InputSystem(scene);
  const actor = {
    ...gridToWorldCenter(2, 2),
    isAlive: () => true, isTrapped: () => false,
    getGridPosition: () => worldToGrid(actor.x, actor.y),
    getStats: () => ({ getMoveSpeed: () => 200 }),
    setFacing: vi.fn(), setMoving: vi.fn(), setVelocity: vi.fn(),
    setPosition: (x: number, y: number) => { actor.x = x; actor.y = y; },
  };
  const collision = new CollisionSystem(new MapState(tiles));
  const movement = new MovementSystem(actor as unknown as Player, input, collision);
  const push = (dx: number, dy: number): void => input.setTouchInput(getJoystickDirection(dx, dy), getJoystickMovement(dx, dy));
  return { input, actor, collision, movement, keys, push };
}

const step = 200 * GAME_SETTINGS.simulationTickMs / 1000;

describe('mobile wall sliding through the real input, movement and collision systems', () => {
  it.each([
    { walls: [[3, 2]] as [number, number][], dx: 40, dy: -25, moveX: 0, moveY: -1 },
    { walls: [[1, 2]] as [number, number][], dx: -40, dy: 25, moveX: 0, moveY: 1 },
    { walls: [[2, 1]] as [number, number][], dx: 25, dy: -40, moveX: 1, moveY: 0 },
    { walls: [[2, 3]] as [number, number][], dx: -25, dy: 40, moveX: -1, moveY: 0 },
  ])('slides along the free axis for input ($dx, $dy)', ({ walls, dx, dy, moveX, moveY }) => {
    const { actor, movement, push } = setup(walls);
    const before = { x: actor.x, y: actor.y };
    push(dx, dy);
    expect(movement.updateTick().moved).toBe(true);
    expect(actor.x).toBeCloseTo(before.x + moveX * step);
    expect(actor.y).toBeCloseTo(before.y + moveY * step);
  });

  it('matches keyboard wall sliding over repeated ticks while retaining cardinal facing', () => {
    const walls = Array.from({ length: MAP_SETTINGS.rows }, (_, y): [number, number] => [3, y]);
    const mobile = setup(walls);
    const keyboard = setup(walls);
    mobile.push(40, -25);
    keyboard.keys.get('D')!.emit('down');
    keyboard.keys.get('W')!.emit('down');
    for (let tick = 0; tick < 8; tick += 1) {
      mobile.movement.updateTick();
      keyboard.movement.updateTick();
      expect(mobile.actor.x).toBeCloseTo(keyboard.actor.x);
      expect(mobile.actor.y).toBeCloseTo(keyboard.actor.y);
    }
    expect(mobile.input.readMovementDirection()).toEqual({ x: 1, y: 0 });
    expect(mobile.input.readMovementVector()).toEqual({ x: 1, y: -1 });
  });

  it('keeps the same diagonal displacement as keyboard on open ground', () => {
    const { actor, push, movement } = setup();
    const before = { x: actor.x, y: actor.y };
    push(40, 25);
    movement.updateTick();
    expect(actor.x).toBeCloseTo(before.x + step);
    expect(actor.y).toBeCloseTo(before.y + step);
  });

  it('does not pass through a blocked corner', () => {
    const { actor, push, movement } = setup([[3, 2], [2, 1]]);
    const before = { x: actor.x, y: actor.y };
    push(40, -25);
    expect(movement.updateTick().moved).toBe(false);
    expect({ x: actor.x, y: actor.y }).toEqual(before);
  });

  it('slides around solid bombs and moving crate cells too', () => {
    for (const type of ['bomb', 'crate']) {
      const { actor, collision, movement, push } = setup();
      if (type === 'bomb') collision.setBombBlocked(3, 2, true);
      else collision.setDynamicBlocked(3, 2, true);
      const before = { x: actor.x, y: actor.y };
      push(40, -25);
      movement.updateTick();
      expect(actor.x).toBe(before.x);
      expect(actor.y).toBeCloseTo(before.y - step);
    }
  });

  it('preserves lane-center correction when brushing a wall corner', () => {
    const { actor, push, movement } = setup([[3, 1]]);
    const center = { x: actor.x, y: actor.y };
    actor.y -= 8;
    push(40, 0);
    movement.updateTick();
    expect(actor.x).toBeCloseTo(center.x + step);
    expect(actor.y).toBe(center.y);
  });

  it('stops both axes on release/reset and can place bombs during diagonal movement', () => {
    const { actor, push, input, movement } = setup();
    push(40, -25);
    input.pressBomb();
    expect(input.consumeBombPress()).toBe(true);
    expect(input.readMovementVector()).toEqual({ x: 1, y: -1 });
    push(0, 0);
    const before = { x: actor.x, y: actor.y };
    expect(movement.updateTick().moved).toBe(false);
    expect({ x: actor.x, y: actor.y }).toEqual(before);
    push(40, -25);
    input.reset();
    expect(input.readMovementVector()).toEqual({ x: 0, y: 0 });
    expect(input.readMovementDirection()).toEqual({ x: 0, y: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import { TILE_TYPES, type TileType } from '../data/mapData';
import { MapState } from '../data/MapState';
import { MAP_SETTINGS } from '../data/gameSettings';
import { gridToWorldCenter, worldToGrid } from '../domain/coordinates';
import type { Bot } from '../entities/Bot';
import type { Bomb } from '../entities/Bomb';
import type { Item } from '../entities/Item';
import type { Player } from '../entities/Player';
import type { ExplosionSystem } from '../systems/ExplosionSystem';
import { BotBrain, type BotWorldState } from './BotBrain';

const FLOOR = TILE_TYPES.floor;
const WALL = TILE_TYPES.houseBlue;
const SOFT = TILE_TYPES.softRed;

function createMap(fill: TileType = WALL): TileType[][] {
  return Array.from({ length: MAP_SETTINGS.rows }, () => Array<TileType>(MAP_SETTINGS.columns).fill(fill));
}

function createBot(gridX: number, gridY: number, moveSpeed = 180, blastRange = 1): Bot {
  const position = gridToWorldCenter(gridX, gridY);
  const actor = {
    x: position.x,
    y: position.y,
    isAlive: () => true,
    isTrapped: () => false,
    getGridPosition: () => worldToGrid(actor.x, actor.y),
    getStats: () => ({
      getBombCapacity: () => 1,
      getBlastRange: () => blastRange,
      getMoveSpeed: () => moveSpeed,
    }),
  };
  return actor as unknown as Bot;
}

function createTarget(gridX = MAP_SETTINGS.columns - 1, gridY = MAP_SETTINGS.rows - 1): Player {
  return {
    isAlive: () => false,
    isTrapped: () => false,
    getGridPosition: () => ({ x: gridX, y: gridY }),
  } as unknown as Player;
}

function liveTarget(x: number, y: number, trapped = false): Player {
  return { isAlive: () => true, isTrapped: () => trapped, getGridPosition: () => ({ x, y }) } as unknown as Player;
}

function createBomb(
  gridX: number,
  gridY: number,
  remainingFuseMs: number,
  blastRange: number,
): Bomb {
  return {
    gridX,
    gridY,
    blastRange,
    owner: {},
    getRemainingFuseMs: () => remainingFuseMs,
  } as unknown as Bomb;
}

function createWorld(
  bot: Bot,
  map: TileType[][],
  bombs: readonly Bomb[] = [],
): BotWorldState {
  return {
    bot,
    target: createTarget(),
    mapState: new MapState(map),
    bombs,
    items: [],
    explosionSystem: {
      isCellInExplosion: () => false,
    } as unknown as ExplosionSystem,
  };
}

describe('BotBrain', () => {
  it('does not waste bombs on a diagonal target outside the actual blast', () => {
    const world = createWorld(createBot(2, 2), createMap(FLOOR));
    expect(new BotBrain().decide({ ...world, target: liveTarget(3, 3) }).placeBomb).toBe(false);
  });

  it('respects walls and uses upgraded blast range when choosing an attack', () => {
    const map = createMap(FLOOR);
    const world = { ...createWorld(createBot(2, 2, 180, 3), map), target: liveTarget(5, 2) };
    expect(new BotBrain().decide(world).placeBomb).toBe(true);
    map[2][3] = WALL;
    expect(new BotBrain().decide({ ...world, mapState: new MapState(map) }).placeBomb).toBe(false);
  });

  it('takes an attack opportunity before finishing an old chase path', () => {
    const bot = createBot(2, 2);
    const world = createWorld(bot, createMap(FLOOR));
    const brain = new BotBrain();
    expect(brain.decide({ ...world, target: liveTarget(6, 2) }).direction).toEqual({ x: 1, y: 0 });
    Object.assign(bot, gridToWorldCenter(3, 2));
    expect(brain.decide({ ...world, target: liveTarget(4, 2) }).placeBomb).toBe(true);
  });

  it('refreshes a chase when the target moves, without turning in the middle of a cell', () => {
    const bot = createBot(2, 2);
    const world = createWorld(bot, createMap(FLOOR));
    const brain = new BotBrain();
    brain.decide({ ...world, target: liveTarget(6, 2) });
    bot.x += 6;
    for (let tick = 0; tick < 20; tick += 1) {
      expect(brain.decide({ ...world, target: liveTarget(2, 6) }).direction.x).toBeGreaterThan(0);
    }
    Object.assign(bot, gridToWorldCenter(3, 2));
    const action = brain.decide({ ...world, target: liveTarget(3, 6) });
    expect(action.direction).toEqual({ x: 0, y: 1 });
  });

  it('collects nearby safe items before bombing more scenery', () => {
    const map = createMap(FLOOR);
    map[2][3] = SOFT;
    const world = { ...createWorld(createBot(2, 2), map), items: [{ gridX: 2, gridY: 3 } as Item] };
    for (const style of ['balanced', 'aggressive'] as const) {
      expect(new BotBrain(style).decide(world)).toEqual({ direction: { x: 0, y: 1 }, placeBomb: false });
    }
  });

  it('gives the two opponents distinct item-versus-attack priorities', () => {
    const world = {
      ...createWorld(createBot(2, 2), createMap(FLOOR)),
      target: liveTarget(3, 2), items: [{ gridX: 2, gridY: 3 } as Item],
    };
    expect(new BotBrain('balanced').decide(world)).toEqual({ direction: { x: 0, y: 1 }, placeBomb: false });
    expect(new BotBrain('aggressive').decide(world).placeBomb).toBe(true);
  });

  it('does not collect an item on an active flame', () => {
    const world = {
      ...createWorld(createBot(2, 2), createMap(FLOOR)),
      target: liveTarget(5, 2), items: [{ gridX: 2, gridY: 3 } as Item],
      explosionSystem: { isCellInExplosion: (x: number, y: number) => x === 2 && y === 3 } as ExplosionSystem,
    };
    expect(new BotBrain().decide(world).direction).toEqual({ x: 1, y: 0 });
  });

  it('finishes a trapped target by contact instead of planting another bomb', () => {
    const map = createMap(FLOOR);
    map[1][2] = SOFT;
    const world = { ...createWorld(createBot(2, 2), map), target: liveTarget(3, 2, true) };
    expect(new BotBrain().decide(world)).toEqual({ direction: { x: 1, y: 0 }, placeBomb: false });
  });

  it('keeps escaping its own bomb even when an attack opportunity appears', () => {
    const map = createMap(FLOOR);
    map[2][3] = SOFT;
    const bot = createBot(2, 2);
    const brain = new BotBrain('aggressive');
    expect(brain.decide(createWorld(bot, map)).placeBomb).toBe(true);
    Object.assign(bot, gridToWorldCenter(1, 2));
    const world = { ...createWorld(bot, map, [createBomb(2, 2, 2000, 1)]), target: liveTarget(1, 3) };
    expect(brain.decide(world)).toEqual({ direction: { x: -1, y: 0 }, placeBomb: false });
  });

  it('only places a bomb when a complete escape route exists', () => {
    const map = createMap(FLOOR);
    map[2][3] = SOFT;
    const bot = createBot(2, 2);

    const action = new BotBrain().decide(createWorld(bot, map));

    expect(action.placeBomb).toBe(true);
    expect(Math.abs(action.direction.x) + Math.abs(action.direction.y)).toBe(1);
  });

  it('does not bomb itself inside a corridor with no cell outside the blast', () => {
    const map = createMap();
    map[1][1] = FLOOR;
    map[1][2] = FLOOR;
    map[1][0] = SOFT;
    const bot = createBot(1, 1);

    const action = new BotBrain().decide(createWorld(bot, map));

    expect(action.placeBomb).toBe(false);
  });

  it('remembers a genuinely blocked direction instead of retrying it immediately', () => {
    const map = createMap(FLOOR);
    map[2][4] = SOFT;
    const bot = createBot(2, 2);
    const brain = new BotBrain();
    const world = createWorld(bot, map);

    const first = brain.decide(world);
    expect(first.direction).toEqual({ x: 1, y: 0 });

    const blocked = {
      requested: first.direction,
      moved: false,
      blockedX: true,
      blockedY: false,
    };
    brain.reportMovementResult(bot, blocked);
    brain.reportMovementResult(bot, blocked);

    const replanned = brain.decide(world);
    expect(replanned.direction).not.toEqual({ x: 1, y: 0 });
  });

  it('uses an earlier chain-reaction deadline when deciding whether escape is possible', () => {
    const map = createMap();
    for (let x = 0; x <= 3; x += 1) map[1][x] = FLOOR;
    map[2][0] = FLOOR;
    const bot = createBot(0, 1);
    const delayedBomb = createBomb(2, 1, 3_000, 2);

    const normalEscape = new BotBrain().decide(createWorld(bot, map, [delayedBomb]));
    expect(normalEscape.direction).toEqual({ x: 0, y: 1 });

    const triggeringBomb = createBomb(3, 1, 500, 1);
    const unsafeAfterChain = new BotBrain().decide(
      createWorld(bot, map, [delayedBomb, triggeringBomb]),
    );
    expect(unsafeAfterChain.direction).toEqual({ x: 0, y: 0 });
  });

  it('shortens the final step after a speed upgrade instead of oscillating over a waypoint', () => {
    const map = createMap(FLOOR);
    map[2][4] = SOFT;
    const bot = createBot(2, 2, 270);
    const brain = new BotBrain();
    const world = createWorld(bot, map);
    const destination = gridToWorldCenter(3, 2);
    const horizontalInputs: number[] = [];

    for (let tick = 0; tick < 8 && bot.x < destination.x; tick += 1) {
      const action = brain.decide(world);
      horizontalInputs.push(action.direction.x);
      bot.x += action.direction.x * 9;
    }

    expect(horizontalInputs.every((input) => input >= 0)).toBe(true);
    expect(bot.x).toBeCloseTo(destination.x, 5);
  });
});

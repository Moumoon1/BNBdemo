import { describe, expect, it } from 'vitest';
import { TILE_TYPES, type TileType } from '../data/mapData';
import { MapState } from '../data/MapState';
import { gridToWorldCenter, worldToGrid } from '../domain/coordinates';
import type { Bot } from '../entities/Bot';
import type { Bomb } from '../entities/Bomb';
import type { Player } from '../entities/Player';
import type { ExplosionSystem } from '../systems/ExplosionSystem';
import { BotBrain, type BotWorldState } from './BotBrain';

const FLOOR = TILE_TYPES.floor;
const WALL = TILE_TYPES.houseBlue;
const SOFT = TILE_TYPES.softRed;

function createMap(fill: TileType = WALL): TileType[][] {
  return Array.from({ length: 13 }, () => Array<TileType>(15).fill(fill));
}

function createBot(gridX: number, gridY: number, moveSpeed = 180): Bot {
  const position = gridToWorldCenter(gridX, gridY);
  const actor = {
    x: position.x,
    y: position.y,
    isAlive: () => true,
    isTrapped: () => false,
    getGridPosition: () => worldToGrid(actor.x, actor.y),
    getStats: () => ({
      getBombCapacity: () => 1,
      getBlastRange: () => 1,
      getMoveSpeed: () => moveSpeed,
    }),
  };
  return actor as unknown as Bot;
}

function createTarget(gridX = 14, gridY = 12): Player {
  return {
    isAlive: () => false,
    isTrapped: () => false,
    getGridPosition: () => ({ x: gridX, y: gridY }),
  } as unknown as Player;
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

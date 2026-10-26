import { describe, expect, it, vi } from 'vitest';
import { MapState } from '../data/MapState';
import { CRATE_SETTINGS } from '../data/crateSettings';
import { TILE_TYPES, type TileType } from '../data/mapData';
import { gridToWorldCenter } from '../domain/coordinates';
import type { Player } from '../entities/Player';
import type { InputSystem } from './InputSystem';
import type { ItemSystem } from './ItemSystem';
import { CollisionSystem } from './CollisionSystem';

vi.mock('../entities/MovingCrate', () => ({
  MovingCrate: class {
    updateTick(): boolean { return false; }
    destroy(): void {}
  },
}));

import { CrateSystem } from './CrateSystem';

function createActor(gridX: number, gridY: number): Player {
  const position = gridToWorldCenter(gridX, gridY);
  return {
    x: position.x,
    y: position.y,
    scene: {},
    isAlive: () => true,
    isTrapped: () => false,
    getGridPosition: () => ({ x: gridX, y: gridY }),
  } as unknown as Player;
}

function createMap(): TileType[][] {
  const map = Array.from({ length: 3 }, () => Array<TileType>(5).fill(TILE_TYPES.floor));
  map[1][2] = TILE_TYPES.softBox;
  return map;
}

function createSystem(actors: readonly Player[]) {
  const player = actors[0];
  const mapState = new MapState(createMap());
  const collision = new CollisionSystem(mapState);
  const input = {
    readMovementDirection: () => ({ x: 1, y: 0 }),
  } as InputSystem;
  const items = { hasItemAt: () => false } as unknown as ItemSystem;
  const system = new CrateSystem(
    player,
    actors,
    input,
    mapState,
    collision,
    items,
    vi.fn(),
  );
  return { system, mapState, collision };
}

describe('CrateSystem', () => {
  it('keeps both swept cells solid for the whole sliding animation', () => {
    const player = createActor(1, 1);
    const { system, mapState, collision } = createSystem([player]);

    for (let tick = 0; tick < CRATE_SETTINGS.pushDelayTicks; tick += 1) {
      system.updateTick(1000 / 30);
    }

    expect(mapState.getTile(2, 1)).toBe(TILE_TYPES.floor);
    expect(collision.isCellBlocked(2, 1, player)).toBe(true);
    expect(collision.isCellBlocked(3, 1, player)).toBe(true);
  });

  it('does not start a slide into a cell occupied by a bot', () => {
    const player = createActor(1, 1);
    const bot = createActor(3, 1);
    const { system, mapState } = createSystem([player, bot]);

    for (let tick = 0; tick < CRATE_SETTINGS.pushDelayTicks; tick += 1) {
      system.updateTick(1000 / 30);
    }

    expect(mapState.getTile(2, 1)).toBe(TILE_TYPES.softBox);
  });
});

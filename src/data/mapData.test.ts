import { describe, expect, it } from 'vitest';
import { TILE_TYPES } from './mapData';
import { MAPS, getMapDefinition } from './maps';
import { MapState } from './MapState';
import { PLAYER_SETTINGS } from './playerSettings';
import { BOT_SETTINGS } from './botSettings';
import { computeFlameCells } from '../domain/bombRules';

const spawns = [
  { x: PLAYER_SETTINGS.spawnGridX, y: PLAYER_SETTINGS.spawnGridY },
  { x: BOT_SETTINGS.spawnGridX, y: BOT_SETTINGS.spawnGridY },
];
const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function reachable(start: { x: number; y: number }, passable: (x: number, y: number) => boolean): Set<string> {
  const visited = new Set([`${start.x}:${start.y}`]);
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const [dx, dy] of directions) {
      const x = current.x + dx;
      const y = current.y + dy;
      const key = `${x}:${y}`;
      if (!visited.has(key) && passable(x, y)) {
        visited.add(key);
        queue.push({ x, y });
      }
    }
  }
  return visited;
}

describe.each(MAPS)('$name playability', (definition) => {
  it('gives every spawn at least two exits and space to escape its first bomb', () => {
    const map = new MapState(definition.tiles);
    for (const spawn of spawns) {
      expect(map.isWalkableCell(spawn.x, spawn.y)).toBe(true);
      expect(directions.filter(([dx, dy]) => map.isWalkableCell(spawn.x + dx, spawn.y + dy)).length).toBeGreaterThanOrEqual(2);
      const danger = new Set(computeFlameCells(map, spawn.x, spawn.y, 1).map((cell) => `${cell.gridX}:${cell.gridY}`));
      const escape = reachable(spawn, (x, y) => map.isWalkableCell(x, y));
      expect([...escape].some((key) => !danger.has(key))).toBe(true);
    }
  });

  it('has no permanent islands that prevent opponents meeting after clearing blocks', () => {
    const map = new MapState(definition.tiles);
    const connected = reachable(spawns[0], (x, y) => map.isWalkableCell(x, y) || map.isDestructibleCell(x, y));
    definition.tiles.forEach((row, y) => row.forEach((tile, x) => {
      if (tile === TILE_TYPES.floor || map.isDestructibleCell(x, y)) {
        expect(connected.has(`${x}:${y}`)).toBe(true);
      }
    }));
  });
});


describe('map selection', () => {
  it('resolves all three selections and falls back safely for an unknown ID', () => {
    expect(new Set(MAPS.map((map) => map.id)).size).toBe(3);
    for (const map of MAPS) expect(getMapDefinition(map.id)).toBe(map);
    expect(getMapDefinition('missing')).toBe(MAPS[0]);
    expect(getMapDefinition(undefined)).toBe(MAPS[0]);
  });

  it('starts every round from fresh tiles without modifying the catalog or another round', () => {
    for (const definition of MAPS) {
      const first = new MapState(definition.tiles);
      const next = new MapState(definition.tiles);
      for (let y = 0; y < definition.tiles.length; y += 1) {
        for (let x = 0; x < definition.tiles[y].length; x += 1) {
          if (!first.isDestructibleCell(x, y)) continue;
          const original = definition.tiles[y][x];
          first.destroyCell(x, y);
          expect(first.getTile(x, y)).toBe(TILE_TYPES.floor);
          expect(next.getTile(x, y)).toBe(original);
          expect(definition.tiles[y][x]).toBe(original);
        }
      }
    }
  });
});

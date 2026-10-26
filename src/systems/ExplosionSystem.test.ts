import { describe, expect, it, vi } from 'vitest';
import { MapState } from '../data/MapState';
import { TILE_TYPES } from '../data/mapData';

const destroyed = vi.hoisted(() => vi.fn());

vi.mock('../entities/Explosion', () => ({
  Explosion: class {
    readonly cells;
    constructor(_scene: unknown, cells: unknown) { this.cells = cells; }
    update(): boolean { return false; }
    destroy(): void { destroyed(); }
  },
}));

import { ExplosionSystem } from './ExplosionSystem';

describe('ExplosionSystem', () => {
  it('removes unfinished explosion visuals when the round finishes', () => {
    const map = new MapState([[TILE_TYPES.floor]]);
    const system = new ExplosionSystem(
      {} as never,
      map,
      vi.fn(),
      vi.fn(),
    );
    system.createExplosion(0, 0, 1);
    expect(system.isCellInExplosion(0, 0)).toBe(true);

    system.clear();

    expect(destroyed).toHaveBeenCalledOnce();
    expect(system.isCellInExplosion(0, 0)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { gridToWorldCenter } from './coordinates';
import {
  getMovingCrateBlockedCells,
  isCellOccupiedByActor,
  type CrateCollisionActor,
} from './crateRules';

function actorAt(x: number, y: number): CrateCollisionActor {
  return { x, y, isAlive: () => true };
}

describe('crate collision rules', () => {
  it('blocks both the source and destination during a slide', () => {
    expect(getMovingCrateBlockedCells({ x: 3, y: 2 }, { x: 4, y: 2 })).toEqual([
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });

  it('rejects a push when a character is already entering the destination cell', () => {
    const destination = gridToWorldCenter(4, 2);
    const approachingFromRight = actorAt(destination.x + 30, destination.y);
    const oneCellAway = actorAt(destination.x + 40, destination.y);

    expect(isCellOccupiedByActor([approachingFromRight], 4, 2)).toBe(true);
    expect(isCellOccupiedByActor([oneCellAway], 4, 2)).toBe(false);
  });
});

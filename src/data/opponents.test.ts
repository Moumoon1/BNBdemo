import { describe, expect, it } from 'vitest';
import { getOpponentDefinition, OPPONENTS } from './opponents';

describe('opponent selection', () => {
  it('resolves both existing characters with their own behavior', () => {
    expect(OPPONENTS).toHaveLength(2);
    expect(new Set(OPPONENTS.map((opponent) => opponent.visual.id)).size).toBe(2);
    expect(OPPONENTS.map((opponent) => opponent.style)).toEqual(['balanced', 'aggressive']);
    for (const opponent of OPPONENTS) expect(getOpponentDefinition(opponent.id)).toBe(opponent);
  });

  it('falls back to one valid opponent for missing or obsolete selections', () => {
    expect(getOpponentDefinition(undefined)).toBe(OPPONENTS[0]);
    expect(getOpponentDefinition('missing')).toBe(OPPONENTS[0]);
  });
});

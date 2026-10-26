import { describe, expect, it } from 'vitest';
import { BotController } from './BotController';

describe('BotController', () => {
  it('clears movement and pending bomb input when a round stops', () => {
    const controller = new BotController();
    controller.setAction({ direction: { x: -1, y: 0 }, placeBomb: true });

    controller.stop();

    expect(controller.readMovementVector()).toEqual({ x: 0, y: 0 });
    expect(controller.consumeBombPress()).toBe(false);
  });
});

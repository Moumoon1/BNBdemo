import { describe, expect, it, vi } from 'vitest';
import { ResultPanel } from './ResultPanel';

vi.mock('phaser', () => ({ default: { GameObjects: { Container: class {} } } }));

describe('single-opponent round result', () => {
  it.each([
    ['击败对手', '漂亮，赢下这局！'],
    ['被困住后淘汰', '再来一次吧！'],
    ['时间到', '时间到！'],
  ])('shows the correct result for %s', (message, title) => {
    const panel = Object.create(ResultPanel.prototype) as ResultPanel;
    const messageText = { setText: vi.fn() };
    const setVisible = vi.fn();
    Object.assign(panel, { messageText, detail: { setText: vi.fn() }, setVisible });
    panel.show(message);
    expect(messageText.setText).toHaveBeenCalledWith(title);
    expect(setVisible).toHaveBeenCalledWith(true);
  });
});

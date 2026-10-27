import Phaser from 'phaser';
import { UI_DEPTH } from '../data/gameSettings';
import { panel, text, UI } from './theme';

export class GameSidebar extends Phaser.GameObjects.Container {
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly opponentsText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private readonly totalOpponents = 1) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(UI_DEPTH.sidebar);
    const left = panel(scene, 14, 70, 174, 42, 0xffffff, 14);
    const right = panel(scene, 198, 70, 202, 42, 0xffffff, 14);
    const clock = scene.add.graphics().lineStyle(2, UI.teal)
      .strokeCircle(35, 91, 8).lineBetween(35, 85, 35, 91).lineBetween(35, 91, 39, 94);
    this.timeText = text(scene, 52, 91, '01:30', 26, UI.ink, true).setOrigin(0, 0.5);
    const timeLabel = text(scene, 172, 91, '剩余', 16, UI.muted).setOrigin(1, 0.5);
    const dot = scene.add.circle(218, 91, 5, 0xf2b751);
    this.opponentsText = text(scene, 234, 91, `对手  ${totalOpponents} / ${totalOpponents}`, 18, UI.ink, true).setOrigin(0, 0.5);
    this.add([left, right, clock, this.timeText, timeLabel, dot, this.opponentsText]);
  }

  update(remainingSeconds: number, bots = this.totalOpponents): void {
    const seconds = Math.max(0, Math.ceil(remainingSeconds));
    this.timeText.setText(`${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`);
    this.timeText.setColor(seconds <= 15 ? '#dc6b43' : UI.ink);
    this.opponentsText.setText(`对手  ${bots} / ${this.totalOpponents}`);
  }
}

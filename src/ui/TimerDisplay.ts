import Phaser from 'phaser';
import { SIDEBAR_COPY, SIDEBAR_THEME } from '../data/sidebarSettings';

export class TimerDisplay extends Phaser.GameObjects.Container {
  private readonly timeText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number) {
    super(scene, x, y);

    const panel = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      width,
      34,
      0x063e70,
      1,
    );
    panel.setOrigin(0).setStrokeStyle(1, SIDEBAR_THEME.panelBorderColor, 0.85);

    const label = new Phaser.GameObjects.Text(scene, 10, 8, SIDEBAR_COPY.time, {
      color: SIDEBAR_THEME.mutedTextColor,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
    });

    this.timeText = new Phaser.GameObjects.Text(scene, width - 10, 5, '', {
      color: '#ffd22e',
      fontFamily: 'monospace',
      fontSize: '20px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.add([panel, label, this.timeText]);
    this.update(0);
  }

  update(remainingSeconds: number): void {
    const totalSeconds = Math.max(0, Math.ceil(remainingSeconds));
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    this.timeText.setText(`${minutes}:${seconds}`);
  }
}

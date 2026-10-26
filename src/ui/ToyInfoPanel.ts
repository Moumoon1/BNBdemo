import Phaser from 'phaser';
import { DEFAULT_TOY_INFO, SIDEBAR_COPY, SIDEBAR_THEME } from '../data/sidebarSettings';
import type { PlayerStatsSnapshot } from '../entities/PlayerStats';

export class ToyInfoPanel extends Phaser.GameObjects.Container {
  private readonly bombCountText: Phaser.GameObjects.Text;
  private readonly blastRangeText: Phaser.GameObjects.Text;
  private readonly speedLevelText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);

    const panel = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      width,
      height,
      0x075da0,
      1,
    );
    panel.setOrigin(0).setStrokeStyle(1, SIDEBAR_THEME.panelBorderColor, 0.85);

    const title = new Phaser.GameObjects.Text(scene, 10, 10, SIDEBAR_COPY.title, {
      color: SIDEBAR_THEME.textColor,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    });

    this.add([panel, title]);
    this.bombCountText = this.addRow(scene, SIDEBAR_COPY.bombCount, DEFAULT_TOY_INFO.bombCount.toString(), 52, width);
    this.blastRangeText = this.addRow(scene, SIDEBAR_COPY.blastRange, DEFAULT_TOY_INFO.blastRange.toString(), 92, width);
    this.speedLevelText = this.addRow(scene, SIDEBAR_COPY.speedLevel, DEFAULT_TOY_INFO.speedLevel.toString(), 132, width);
    this.statusText = this.addRow(scene, SIDEBAR_COPY.status, DEFAULT_TOY_INFO.status, 172, width);
  }

  update(stats: PlayerStatsSnapshot): void {
    this.bombCountText.setText(stats.bombCapacity.toString());
    this.blastRangeText.setText(stats.blastRange.toString());
    this.speedLevelText.setText(stats.speedLevel.toString());
    this.statusText.setText(DEFAULT_TOY_INFO.status);
  }

  private addRow(
    scene: Phaser.Scene,
    label: string,
    value: string,
    y: number,
    width: number,
  ): Phaser.GameObjects.Text {
    const row = new Phaser.GameObjects.Rectangle(scene, 8, y - 8, width - 16, 30, 0x064a82, 1);
    row.setOrigin(0).setStrokeStyle(1, 0x3b82f6, 0.45);

    const labelText = new Phaser.GameObjects.Text(scene, 14, y, label, {
      color: SIDEBAR_THEME.mutedTextColor,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
    });
    const valueText = new Phaser.GameObjects.Text(scene, width - 14, y, value, {
      color: SIDEBAR_THEME.textColor,
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.add([row, labelText, valueText]);
    return valueText;
  }
}

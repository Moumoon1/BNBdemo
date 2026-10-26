import Phaser from 'phaser';
import { SIDEBAR_COPY, SIDEBAR_THEME } from '../data/sidebarSettings';

export class ExitButton extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    onExit: () => void,
  ) {
    super(scene, x, y);

    const button = new Phaser.GameObjects.Rectangle(
      scene,
      0,
      0,
      width,
      38,
      0x087fd1,
      1,
    );
    button.setOrigin(0).setStrokeStyle(1, SIDEBAR_THEME.panelBorderColor, 1);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', onExit);
    button.on('pointerover', () => button.setFillStyle(0x1d9be8, 1));
    button.on('pointerout', () => button.setFillStyle(0x087fd1, 1));

    const label = new Phaser.GameObjects.Text(scene, width / 2, 19, SIDEBAR_COPY.exit, {
      color: SIDEBAR_THEME.textColor,
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add([button, label]);
  }
}

import Phaser from 'phaser';
import { UI_DEPTH } from '../data/gameSettings';

export class ResultPanel extends Phaser.GameObjects.Container {
  private readonly messageText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onRestart: () => void) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(UI_DEPTH.result).setVisible(false);

    const panel = new Phaser.GameObjects.Rectangle(scene, 0, 0, 360, 170, 0x0f172a, 0.96);
    panel.setOrigin(0.5).setStrokeStyle(2, 0x60a5fa, 1);

    this.messageText = new Phaser.GameObjects.Text(scene, 0, -34, '', {
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '20px',
      align: 'center',
    }).setOrigin(0.5);

    const restartButton = new Phaser.GameObjects.Rectangle(scene, 0, 48, 150, 40, 0x1476c9, 1);
    restartButton.setOrigin(0.5).setStrokeStyle(1, 0x93c5fd, 1);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on('pointerdown', onRestart);

    const restartLabel = new Phaser.GameObjects.Text(scene, 0, 48, '重新开始', {
      color: '#e0f2fe',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add([panel, this.messageText, restartButton, restartLabel]);
  }

  show(message: string): void {
    this.messageText.setText(message);
    this.setPosition(this.scene.scale.width / 2, this.scene.scale.height / 2);
    this.setVisible(true);
  }
}

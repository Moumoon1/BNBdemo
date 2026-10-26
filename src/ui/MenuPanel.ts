import Phaser from 'phaser';
import { GAME_SETTINGS } from '../data/gameSettings';
import { MENU_SETTINGS } from '../data/menuSettings';

export class MenuPanel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, onStart: () => void) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const background = new Phaser.GameObjects.Image(
      scene,
      GAME_SETTINGS.width / 2,
      GAME_SETTINGS.height / 2,
      MENU_SETTINGS.backgroundTextureKey,
    );
    this.fitCover(background, GAME_SETTINGS.width, GAME_SETTINGS.height);

    const startButton = new Phaser.GameObjects.Image(
      scene,
      GAME_SETTINGS.width / 2,
      0,
      MENU_SETTINGS.startButtonTextureKey,
    );
    startButton.setOrigin(0.5);
    const buttonHeight = MENU_SETTINGS.startButtonWidth * (startButton.height / startButton.width);
    startButton.setY(GAME_SETTINGS.height - MENU_SETTINGS.buttonBottomMargin - buttonHeight / 2);
    startButton.setDisplaySize(
      MENU_SETTINGS.startButtonWidth,
      buttonHeight,
    );
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerdown', onStart);

    const baseScaleX = startButton.scaleX;
    const baseScaleY = startButton.scaleY;
    startButton.on('pointerover', () => {
      scene.tweens.add({
        targets: startButton,
        scaleX: baseScaleX * MENU_SETTINGS.hoverScale,
        scaleY: baseScaleY * MENU_SETTINGS.hoverScale,
        duration: 120,
        ease: 'Quad.easeOut',
      });
    });
    startButton.on('pointerout', () => {
      scene.tweens.add({
        targets: startButton,
        scaleX: baseScaleX,
        scaleY: baseScaleY,
        duration: 120,
        ease: 'Quad.easeOut',
      });
    });

    this.add([background, startButton]);
  }

  private fitCover(image: Phaser.GameObjects.Image, width: number, height: number): void {
    const scale = Math.max(width / image.width, height / image.height);
    image.setDisplaySize(image.width * scale, image.height * scale);
  }
}

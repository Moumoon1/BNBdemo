import Phaser from 'phaser';
import { UI_DEPTH } from '../data/gameSettings';
import { getTimerDigitFrames } from './timerDigits';

export class GameSidebar extends Phaser.GameObjects.Container {
  private readonly timeDigits: Phaser.GameObjects.Sprite[];
  private readonly fpsText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(UI_DEPTH.sidebar);

    // vis bnb.js 用四个 Number.png 位图显示时间，冒号已经画在 BG.png 中。
    const positions = [708, 720, 742, 754];
    this.timeDigits = positions.map((x) => new Phaser.GameObjects.Sprite(
      scene,
      x,
      43,
      'vis-number',
      0,
    ).setOrigin(0, 0));

    // vis 的 Label 没有指定 Font，浏览器 Canvas 使用默认 10px sans-serif。
    // fillText 的 y=20 是文字基线，Phaser 顶边换算到约 y=10。
    this.fpsText = new Phaser.GameObjects.Text(scene, 700, 10, 'FPS: 0', {
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontSize: '10px',
    }).setOrigin(0, 0);

    this.add([...this.timeDigits, this.fpsText]);
  }

  update(remainingSeconds: number): void {
    getTimerDigitFrames(remainingSeconds).forEach((frame, index) => {
      this.timeDigits[index].setFrame(frame);
    });
    const fps = Math.round(this.scene.game.loop.actualFps * 10) / 10;
    this.fpsText.setText(`FPS: ${fps}`);
  }
}

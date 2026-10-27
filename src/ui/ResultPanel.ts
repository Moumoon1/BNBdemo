import Phaser from 'phaser';
import { GAME_SETTINGS, UI_DEPTH } from '../data/gameSettings';
import { button, panel, text, UI } from './theme';

export class ResultPanel extends Phaser.GameObjects.Container {
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly detail: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onRestart: () => void, onMaps: () => void, mapName: string) {
    super(scene, GAME_SETTINGS.width / 2, GAME_SETTINGS.height / 2);
    scene.add.existing(this);
    this.setDepth(UI_DEPTH.result).setVisible(false);
    const shade = scene.add.rectangle(0, 0, GAME_SETTINGS.width, GAME_SETTINGS.height, 0x183653, 0.58).setInteractive();
    const card = panel(scene, -170, -192, 340, 384, 0xf6faff, 28);
    const bubble = scene.add.sprite(0, -126, 'vis-popo', 0).setDisplaySize(54, 50);
    this.messageText = text(scene, 0, -68, '', 28, UI.ink, true).setOrigin(0.5);
    this.detail = text(scene, 0, -22, '', 16, UI.muted).setOrigin(0.5);
    this.detail.setWordWrapWidth(280).setAlign('center').setLineSpacing(4);
    const map = text(scene, 0, 20, mapName, 16, UI.tealText).setOrigin(0.5);
    const restart = button(scene, -140, 49, 280, 52, '再玩一局', onRestart);
    const maps = button(scene, -140, 119, 280, 46, '重选地图与对手', onMaps, false);
    this.add([shade, card, bubble, this.messageText, this.detail, map, restart, maps]);
  }

  show(message: string): void {
    const win = message === '击败对手';
    this.messageText.setText(win ? '漂亮，赢下这局！' : message === '时间到' ? '时间到！' : '再来一次吧！');
    this.detail.setText(win ? '对手已淘汰，再来一场挑战吧。' : message === '时间到' ? '这次没分出胜负，再挑战一局。' : '躲开爆炸，下次一定能更进一步。');
    this.setVisible(true);
  }
}

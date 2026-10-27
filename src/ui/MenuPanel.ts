import Phaser from 'phaser';
import { getMapDefinition, MAPS, type MapDefinition } from '../data/maps';
import { getOpponentDefinition, OPPONENTS, type OpponentDefinition } from '../data/opponents';
import { MapPreview } from './MapPreview';
import { MuteButton } from './MuteButton';
import { button, menuBackground, text, UI } from './theme';

export class MenuPanel {
  private selected: MapDefinition;
  private preview?: MapPreview;
  private readonly scene: Phaser.Scene;
  private readonly cards: { background: Phaser.GameObjects.Graphics; number: Phaser.GameObjects.Text; name: Phaser.GameObjects.Text; check: Phaser.GameObjects.Text }[] = [];
  private opponent: OpponentDefinition;
  private readonly opponentCards: { background: Phaser.GameObjects.Graphics; name: Phaser.GameObjects.Text; label: Phaser.GameObjects.Text; check: Phaser.GameObjects.Text }[] = [];

  constructor(scene: Phaser.Scene, onStart: (mapId: string, opponentId: string) => void) {
    this.scene = scene;
    this.selected = getMapDefinition(scene.registry.get('selectedMapId'));
    this.opponent = getOpponentDefinition(scene.registry.get('selectedOpponentId'));
    menuBackground(scene);
    scene.add.sprite(41, 42, 'vis-popo', 0).setDisplaySize(35, 33);
    text(scene, 65, 23, '泡泡堂', 30, UI.ink, true);
    new MuteButton(scene);
    text(scene, 24, 75, '选择你的地图', 16, UI.ink);

    MAPS.forEach((map, index) => {
      const x = 22 + index * 126;
      const background = scene.add.graphics();
      const number = text(scene, x + 14, 127, `地图 ${index + 1}`, 16, UI.muted, true);
      const name = text(scene, x + 14, 153, map.name, 18, UI.ink, true);
      const check = text(scene, x + 99, 126, '✓', 18, UI.tealText).setOrigin(0.5, 0);
      const hit = scene.add.zone(x + 59, 150, 118, 68).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => this.select(map));
      this.cards.push({ background, number, name, check });
    });

    text(scene, 24, 734, '选择你的对手', 16, UI.ink);
    OPPONENTS.forEach((opponent, index) => {
      const x = 22 + index * 190;
      const background = scene.add.graphics();
      const visual = opponent.visual;
      scene.add.sprite(x + 28, 787, visual.idleTextureKey, (visual.directionRows?.down ?? 1) * visual.idleFramesPerDirection)
        .setDisplaySize(40, 48);
      const name = text(scene, x + 57, 765, opponent.name, 16, UI.ink, true);
      const label = text(scene, x + 57, 789, opponent.label, 16, UI.muted);
      const check = text(scene, x + 161, 787, '✓', 18, UI.tealText).setOrigin(0.5);
      scene.add.zone(x + 90, 787, 180, 54).setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.selectOpponent(opponent));
      this.opponentCards.push({ background, name, label, check });
    });
    button(scene, 24, 830, 366, 50, '开始冒险', () => onStart(this.selected.id, this.opponent.id), true, '#5c3518');
    this.select(this.selected);
    this.selectOpponent(this.opponent);
  }

  private selectOpponent(opponent: OpponentDefinition): void {
    this.opponent = opponent;
    this.scene.registry.set('selectedOpponentId', opponent.id);
    this.opponentCards.forEach((card, index) => {
      const selected = OPPONENTS[index].id === opponent.id;
      const x = 22 + index * 190;
      card.background.clear()
        .fillStyle(selected ? UI.teal : UI.white).fillRoundedRect(x, 760, 180, 54, 12)
        .lineStyle(1, selected ? UI.teal : UI.line).strokeRoundedRect(x, 760, 180, 54, 12);
      card.name.setColor(selected ? '#ffffff' : UI.ink);
      card.label.setColor(selected ? '#eaf3ff' : UI.muted);
      card.check.setColor('#ffffff').setVisible(selected);
    });
  }

  private select(map: MapDefinition): void {
    this.selected = map;
    this.scene.registry.set('selectedMapId', map.id);
    this.preview?.destroy();
    this.preview = new MapPreview(this.scene, map, 22, 200);
    this.cards.forEach((card, index) => {
      const selected = MAPS[index].id === map.id;
      const x = 22 + index * 126;
      card.background.clear()
        .fillStyle(selected ? UI.teal : 0xffffff).fillRoundedRect(x, 116, 118, 68, 17)
        .lineStyle(1, selected ? UI.teal : UI.line).strokeRoundedRect(x, 116, 118, 68, 17);
      card.name.setColor(selected ? '#ffffff' : UI.ink);
      card.number.setColor(selected ? '#eaf3ff' : UI.muted);
      card.check.setColor('#ffffff').setVisible(selected);
    });
  }
}

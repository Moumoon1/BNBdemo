import Phaser from 'phaser';
import { GAME_SETTINGS, MOBILE_LAYOUT as L } from '../data/gameSettings';
import type { MapDefinition } from '../data/maps';
import type { OpponentDefinition } from '../data/opponents';
import type { Player } from '../entities/Player';
import type { InputSystem } from '../systems/InputSystem';
import { MobileControls } from '../ui/MobileControls';
import { MuteButton } from '../ui/MuteButton';
import { GameSidebar } from '../ui/GameSidebar';
import { ResultPanel } from '../ui/ResultPanel';
import { panel, text, UI } from '../ui/theme';

interface UIData {
  game: Phaser.Scene;
  input: InputSystem;
  player: Player;
  map: MapDefinition;
  opponent: OpponentDefinition;
  opponentCount: number;
}

/** UI has its own unscaled camera, leaving the full-size playfield unobstructed. */
export class GameUIScene extends Phaser.Scene {
  constructor() { super('GameUIScene'); }

  create({ game, input, player, map, opponent, opponentCount }: UIData): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(UI.paper).fillRect(0, 0, 414, L.mapY);
    graphics.fillStyle(UI.paper).fillRect(0, L.mapY + L.mapHeight, 414, 896);
    graphics.fillStyle(UI.paper).fillRect(0, L.mapY, L.mapX, L.mapHeight);
    graphics.fillStyle(UI.paper).fillRect(400, L.mapY, 14, L.mapHeight);
    graphics.lineStyle(1, 0xb5c9df).strokeRoundedRect(10, L.mapY - 4, 394, L.mapHeight + 8, 7);

    this.add.circle(34, 35, 20, 0xe0ebf7);
    text(this, 34, 31, '‹', 33, UI.tealText).setOrigin(0.5);
    const exit = this.add.zone(34, 35, 44, 48).setInteractive({ useHandCursor: true });
    exit.on('pointerup', () => game.scene.start('MenuScene'));
    text(this, 66, 15, map.name, 24, UI.ink, true);
    text(this, 67, 43, `地图 ${map.number}  ·  ${map.tag}`, 16, UI.muted);
    new MuteButton(this);

    const hud = new GameSidebar(this, opponentCount);
    const stats = ['泡泡', '范围', '速度'].map((name, index) => {
      const x = 14 + index * 131;
      panel(this, x, 663, 124, 35, 0xffffff, 12);
      this.add.sprite(x + 19, 681, ['vis-gift-1', 'vis-gift-3', 'vis-gift-2'][index], 0).setDisplaySize(23, 25);
      return text(this, x + 37, 681, `${name}  1`, 16, UI.ink, true).setOrigin(0, 0.5);
    });
    const controls = new MobileControls(this, input);
    const result = new ResultPanel(this, () => game.scene.restart({ mapId: map.id, opponentId: opponent.id }), () => game.scene.start('MenuScene'), map.name);
    const update = (seconds: number, bots: number): void => {
      hud.update(seconds, bots);
      const values = player.getStats().getSnapshot();
      stats[0].setText(`泡泡  ${values.bombCapacity}`);
      stats[1].setText(`范围  ${values.blastRange}`);
      stats[2].setText(`速度  ${values.speedLevel}`);
    };
    const finish = (message: string): void => {
      controls.disable();
      result.show(message);
    };
    update(GAME_SETTINGS.roundDurationSeconds, opponentCount);
    game.events.on('round-update', update);
    game.events.on('round-end', finish);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      game.events.off('round-update', update);
      game.events.off('round-end', finish);
    });
  }
}

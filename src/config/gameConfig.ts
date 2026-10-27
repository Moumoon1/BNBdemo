import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { MenuScene } from '../scenes/MenuScene';
import { GameUIScene } from '../scenes/GameUIScene';
import { GAME_SETTINGS } from '../data/gameSettings';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: GAME_SETTINGS.backgroundColor,
    input: { activePointers: 3 },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_SETTINGS.width,
      height: GAME_SETTINGS.height,
    },
    scene: [BootScene, MenuScene, GameScene, GameUIScene],
  };
}

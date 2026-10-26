import Phaser from 'phaser';
import {
  BOT_VISUAL_SETTINGS,
  type CharacterVisualSettings,
} from '../data/characterSettings';
import { BOT_SETTINGS } from '../data/botSettings';
import { Player } from './Player';

/** 使用 vis Role2 素材的对手角色。碰撞、状态和动画生命周期复用 Player。 */
export class Bot extends Player {
  constructor(
    scene: Phaser.Scene,
    position: { x: number; y: number },
    visual: CharacterVisualSettings = BOT_VISUAL_SETTINGS,
  ) {
    super(scene, position, visual, BOT_SETTINGS.maxSpeed);
  }
}

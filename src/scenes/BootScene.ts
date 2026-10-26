import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  preload(): void {
    this.load.audio('menu-bgm', 'assets/audio/menu.mp3');
    this.load.audio('game-bgm', 'assets/audio/village.mp3');
    this.load.image('bnb-start-screen', 'assets/ui/bnb-start-screen.png');
    this.load.image('bnb-start-button', 'assets/ui/start-button.png');
    this.load.image('vis-bg', 'assets/vis/BG.png');
    this.load.image('vis-ground', 'assets/vis/TownGround.png');
    this.load.image('vis-soft-red', 'assets/vis/TownBlockRed.png');
    this.load.image('vis-soft-yellow', 'assets/vis/TownBlockYellow.png');
    this.load.image('vis-soft-box', 'assets/vis/TownBox.png');
    this.load.image('vis-house-blue', 'assets/vis/TownHouseBlue.png');
    this.load.image('vis-house-red', 'assets/vis/TownHouseRed.png');
    this.load.image('vis-house-yellow', 'assets/vis/TownHouseYellow.png');
    this.load.image('vis-tree', 'assets/vis/TownTree.png');
    this.load.spritesheet('vis-number', 'assets/vis/Number.png', {
      frameWidth: 12,
      frameHeight: 10,
    });
    this.load.spritesheet('vis-popo', 'assets/vis/Popo.png', {
      frameWidth: 44,
      frameHeight: 41,
    });
    this.load.spritesheet('vis-explosion', 'assets/vis/Explosion.png', {
      frameWidth: 40,
      frameHeight: 40,
    });
    this.load.spritesheet('vis-big-popo', 'assets/vis/BigPopo.png', {
      frameWidth: 72,
      frameHeight: 72,
    });
    this.load.spritesheet('vis-gift-1', 'assets/vis/Gift1.png', {
      frameWidth: 42,
      frameHeight: 45,
    });
    this.load.spritesheet('vis-gift-2', 'assets/vis/Gift2.png', {
      frameWidth: 42,
      frameHeight: 45,
    });
    this.load.spritesheet('vis-gift-3', 'assets/vis/Gift3.png', {
      frameWidth: 42,
      frameHeight: 45,
    });
    this.load.spritesheet('vis-role1', 'assets/vis/Role1.png', {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet('vis-role1-ani', 'assets/vis/Role1Ani.png', {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet('vis-role1-die', 'assets/vis/Role1Die.png', {
      frameWidth: 48,
      frameHeight: 100,
    });
    this.load.spritesheet('vis-role1-start', 'assets/vis/Role1Start.png', {
      frameWidth: 48,
      frameHeight: 64,
    });
    this.load.spritesheet('vis-role2', 'assets/vis/Role2.png', {
      frameWidth: 56,
      frameHeight: 67,
    });
    this.load.spritesheet('vis-role2-ani', 'assets/vis/Role2Ani.png', {
      frameWidth: 56,
      frameHeight: 70,
    });
    this.load.spritesheet('vis-role2-die', 'assets/vis/Role2Die.png', {
      frameWidth: 56,
      frameHeight: 98,
    });
    this.load.spritesheet('rb-role', 'assets/vis/RBROLE-idle.png', {
      frameWidth: 56,
      frameHeight: 67,
    });
  }
}

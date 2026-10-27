import Phaser from 'phaser';
import { AUDIO_SETTINGS } from '../data/audioSettings';
import { BackgroundMusic } from '../systems/BackgroundMusic';
import { MenuPanel } from '../ui/MenuPanel';

export class MenuScene extends Phaser.Scene {
  private backgroundMusic!: BackgroundMusic;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.backgroundMusic = new BackgroundMusic(
      this,
      AUDIO_SETTINGS.menuMusicKey,
      AUDIO_SETTINGS.menuVolume,
    );
    this.backgroundMusic.play();
    // 浏览器首次加载页面可能锁定音频，第一次用户交互时重试播放。
    this.input.once('pointerdown', () => this.backgroundMusic.play());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.backgroundMusic.stop());

    new MenuPanel(this, (mapId, opponentId) => {
      // 绑定到开始按钮自身的 pointerdown：这是浏览器认可的用户手势，
      // 比仅依赖场景初始化时的自动播放更可靠，尤其是在作品集 iframe 中。
      this.backgroundMusic.play();
      this.scene.start('GameScene', { mapId, opponentId });
    });
  }
}

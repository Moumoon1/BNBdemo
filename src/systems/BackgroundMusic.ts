import Phaser from 'phaser';

/** 管理单个场景的循环背景音乐，避免重启场景时叠加多个音轨。 */
export class BackgroundMusic {
  private sound?: Phaser.Sound.BaseSound;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly key: string,
    private readonly volume: number,
  ) {}

  play(): void {
    if (this.sound?.isPlaying) return;
    this.sound ??= this.scene.sound.add(this.key, {
      loop: true,
      volume: this.volume,
    });
    this.sound.play();
  }

  stop(): void {
    this.sound?.stop();
    this.sound?.destroy();
    this.sound = undefined;
  }
}

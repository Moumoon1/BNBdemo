import Phaser from 'phaser';
import { text, UI } from './theme';

/** The game's sound manager is shared by all scenes, including new rounds. */
export class MuteButton {
  constructor(scene: Phaser.Scene, x = 282, y = 14) {
    // AudioContext gain values can lag while the browser is unlocking audio.
    // Keep the requested state separately so the button always responds at once.
    const stateKey = 'audioMuted';
    if (!scene.registry.has(stateKey)) scene.registry.set(stateKey, scene.sound.mute);
    const background = scene.add.graphics();
    const icon = scene.add.graphics();
    const label = text(scene, x + 40, y + 22, '', 16, UI.tealText, true).setOrigin(0, 0.5);
    const hit = scene.add.zone(x + 55, y + 22, 110, 44).setInteractive({ useHandCursor: true });
    const refresh = (): void => {
      const muted = scene.registry.get(stateKey) === true;
      const color = muted ? 0x4e6379 : UI.teal;
      background.clear().fillStyle(muted ? 0xe1e8ef : 0xe2edfc)
        .fillRoundedRect(x, y, 110, 44, 14);
      icon.clear().fillStyle(color).lineStyle(2, color);
      icon.fillRect(x + 12, y + 18, 5, 9);
      icon.fillTriangle(x + 16, y + 18, x + 23, y + 13, x + 23, y + 31);
      if (muted) {
        icon.lineBetween(x + 27, y + 18, x + 33, y + 26);
        icon.lineBetween(x + 27, y + 26, x + 33, y + 18);
      } else {
        icon.beginPath().arc(x + 22, y + 22, 8, -0.8, 0.8).strokePath();
      }
      label.setText(muted ? '已静音' : '声音开').setColor(muted ? UI.muted : UI.tealText);
    };
    const sync = (_manager: unknown, muted: boolean): void => {
      scene.registry.set(stateKey, muted);
      refresh();
    };
    hit.on('pointerdown', () => {
      const muted = scene.registry.get(stateKey) !== true;
      scene.registry.set(stateKey, muted);
      scene.sound.mute = muted;
      refresh();
    });
    scene.sound.on(Phaser.Sound.Events.GLOBAL_MUTE, sync);
    hit.once(Phaser.GameObjects.Events.DESTROY, () => scene.sound.off(Phaser.Sound.Events.GLOBAL_MUTE, sync));
    scene.sound.mute = scene.registry.get(stateKey) === true;
    refresh();
  }
}

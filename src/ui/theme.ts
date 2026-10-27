import Phaser from 'phaser';

export const UI = {
  ink: '#183653', muted: '#4e6379', teal: 0x276cba, tealText: '#276cba',
  paper: 0xf1f6fb, line: 0xcbd9e8, white: 0xffffff,
  minScreenFontSize: 12,
  font: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
} as const;

export function text(scene: Phaser.Scene, x: number, y: number, value: string, size = 16, color: string = UI.ink, bold = false): Phaser.GameObjects.Text {
  const label = scene.add.text(x, y, value, {
    fontFamily: UI.font, fontSize: `${size}px`, color, fontStyle: bold ? 'bold' : 'normal',
  }).setResolution(2);
  // FIT shrinks the canvas in short/narrow windows. Keep the *displayed* type
  // at least 12 CSS pixels, including after resizing the preview panel.
  const resize = (): void => {
    const scale = scene.scale.displaySize.width / scene.scale.gameSize.width;
    label.setFontSize(Math.max(size, Math.ceil(UI.minScreenFontSize / Math.max(scale, 0.01))));
  };
  resize();
  scene.scale.on(Phaser.Scale.Events.RESIZE, resize);
  label.once(Phaser.GameObjects.Events.DESTROY, () => scene.scale.off(Phaser.Scale.Events.RESIZE, resize));
  return label;
}

export function panel(scene: Phaser.Scene, x: number, y: number, width: number, height: number, fill: number = UI.white, radius = 20): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  graphics.fillStyle(fill).fillRoundedRect(x, y, width, height, radius);
  graphics.lineStyle(1, UI.line, 0.85).strokeRoundedRect(x + 0.5, y + 0.5, width - 1, height - 1, radius);
  return graphics;
}

export function button(scene: Phaser.Scene, x: number, y: number, width: number, height: number, title: string, onClick: () => void, primary = true, labelColor: string = primary ? UI.ink : UI.tealText): Phaser.GameObjects.Container {
  const group = scene.add.container(x + width / 2, y + height / 2);
  const background = scene.add.graphics();
  const paint = (pressed = false): void => {
    const fill = primary ? (pressed ? 0xf1bd4e : 0xffcf62) : (pressed ? 0xd5e4f6 : 0xe7eff9);
    background.clear().fillStyle(fill).fillRoundedRect(-width / 2, -height / 2, width, height, 16);
  };
  paint();
  const label = text(scene, 0, -1, title, 22, labelColor, true).setOrigin(0.5);
  const hit = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  group.add([background, label, hit]);
  hit.on('pointerdown', () => paint(true));
  hit.on('pointerout', () => paint());
  hit.on('pointerup', () => { paint(); onClick(); });
  return group;
}

export function menuBackground(scene: Phaser.Scene): void {
  scene.add.graphics().fillStyle(UI.paper).fillRect(0, 0, 414, 896);
}

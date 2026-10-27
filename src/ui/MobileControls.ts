import Phaser from 'phaser';
import { MOBILE_LAYOUT as L } from '../data/gameSettings';
import { getJoystickDirection, getJoystickMovement } from '../domain/joystick';
import type { InputSystem } from '../systems/InputSystem';
import { text, UI } from './theme';

export class MobileControls {
  private joystickPointer: number | null = null;
  private bombPointer: number | null = null;
  private enabled = true;
  private readonly knob: Phaser.GameObjects.Container;
  private readonly bomb: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, private readonly input: InputSystem) {
    scene.add.circle(L.joystickX, L.joystickY, L.joystickRadius, 0xe8f1fb);
    for (const [dx, dy, arrow] of [[0, -53, '▲'], [0, 53, '▼'], [-53, 0, '◀'], [53, 0, '▶']] as const) {
      text(scene, L.joystickX + dx, L.joystickY + dy, arrow, 14, '#527ca5').setOrigin(0.5);
    }
    this.knob = scene.add.container(L.joystickX, L.joystickY, [
      scene.add.circle(0, 0, 29, UI.teal),
    ]);
    this.bomb = scene.add.circle(L.bombX, L.bombY, L.bombRadius, 0xffdb77);
    scene.add.sprite(L.bombX, L.bombY - 8, 'vis-popo', 0).setScale(1.15);
    text(scene, L.bombX, L.bombY + 28, '放泡泡', 16, '#7c622a', true).setOrigin(0.5);
    text(scene, L.joystickX, L.controlsLabelY, '移动', 16, UI.muted).setOrigin(0.5);
    text(scene, L.bombX, L.controlsLabelY, '点击释放', 16, UI.muted).setOrigin(0.5);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.reset, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.reset, this);
    scene.game.canvas.addEventListener('touchcancel', this.onCancel);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this.onDown, this);
      scene.input.off('pointermove', this.onMove, this);
      scene.input.off('pointerup', this.onUp, this);
      scene.input.off('pointerupoutside', this.onUp, this);
      scene.game.events.off(Phaser.Core.Events.BLUR, this.reset, this);
      scene.game.events.off(Phaser.Core.Events.HIDDEN, this.reset, this);
      scene.game.canvas.removeEventListener('touchcancel', this.onCancel);
      this.input.setTouchInput({ x: 0, y: 0 });
    });
  }

  disable(): void {
    this.enabled = false;
    this.reset();
  }

  private readonly onCancel = (): void => this.reset();

  private reset(): void {
    this.joystickPointer = null;
    this.bombPointer = null;
    this.knob.setPosition(L.joystickX, L.joystickY);
    this.bomb.setFillStyle(0xffdb77);
    this.input.setTouchInput({ x: 0, y: 0 });
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    if (this.joystickPointer === null && Math.hypot(pointer.x - L.joystickX, pointer.y - L.joystickY) <= L.joystickRadius + 10) {
      this.joystickPointer = pointer.id;
      this.onMove(pointer);
    } else if (this.bombPointer === null && Math.hypot(pointer.x - L.bombX, pointer.y - L.bombY) <= L.bombRadius + 8) {
      this.bombPointer = pointer.id;
      this.bomb.setFillStyle(0xf5bc4c);
      this.input.pressBomb();
    }
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || pointer.id !== this.joystickPointer) return;
    const dx = pointer.x - L.joystickX;
    const dy = pointer.y - L.joystickY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > L.joystickTravel ? L.joystickTravel / distance : 1;
    this.knob.setPosition(L.joystickX + dx * scale, L.joystickY + dy * scale);
    this.input.setTouchInput(getJoystickDirection(dx, dy), getJoystickMovement(dx, dy));
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickPointer) {
      this.joystickPointer = null;
      this.knob.setPosition(L.joystickX, L.joystickY);
      this.input.setTouchInput({ x: 0, y: 0 });
    }
    if (pointer.id === this.bombPointer) {
      this.bombPointer = null;
      this.bomb.setFillStyle(0xffdb77);
    }
  }
}

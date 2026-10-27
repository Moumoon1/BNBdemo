import Phaser from 'phaser';
import { INPUT_BINDINGS } from '../data/inputBindings';

export interface MovementDirection {
  x: number;
  y: number;
}

export interface MovementInput {
  readMovementDirection(): MovementDirection;
  readMovementVector(): MovementDirection;
}

export interface BombInput {
  consumeBombPress(): boolean;
}

type DirectionName = 'up' | 'down' | 'left' | 'right';

export class InputSystem implements MovementInput, BombInput {
  private readonly keys: Record<keyof typeof INPUT_BINDINGS, Phaser.Input.Keyboard.Key[]>;
  private readonly directionStack: DirectionName[] = [];
  private bombPressed = false;
  private touchDirection: MovementDirection = { x: 0, y: 0 };
  private touchMovement: MovementDirection = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('键盘输入系统初始化失败：当前场景没有键盘输入插件。');
    }

    this.keys = {
      up: INPUT_BINDINGS.up.map((key) => keyboard.addKey(key)),
      down: INPUT_BINDINGS.down.map((key) => keyboard.addKey(key)),
      left: INPUT_BINDINGS.left.map((key) => keyboard.addKey(key)),
      right: INPUT_BINDINGS.right.map((key) => keyboard.addKey(key)),
      bomb: INPUT_BINDINGS.bomb.map((key) => keyboard.addKey(key)),
    };

    (['up', 'down', 'left', 'right'] as const).forEach((direction) => {
      this.keys[direction].forEach((key) => {
        key.on('down', () => this.pushDirection(direction));
        key.on('up', () => this.removeDirection(direction));
      });
    });

    this.keys.bomb.forEach((key) => {
      key.on('down', () => {
        this.bombPressed = true;
      });
    });

    scene.game.events.on(Phaser.Core.Events.BLUR, this.reset, this);
    scene.game.events.on(Phaser.Core.Events.HIDDEN, this.reset, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.game.events.off(Phaser.Core.Events.BLUR, this.reset, this);
      scene.game.events.off(Phaser.Core.Events.HIDDEN, this.reset, this);
      Object.values(this.keys).flat().forEach((key) => keyboard.removeKey(key, true));
      this.reset();
    });
  }

  setTouchInput(direction: MovementDirection, movement: MovementDirection = direction): void {
    this.touchDirection = { ...direction };
    this.touchMovement = { ...movement };
  }

  pressBomb(): void {
    this.bombPressed = true;
  }

  reset(): void {
    this.touchDirection = { x: 0, y: 0 };
    this.touchMovement = { x: 0, y: 0 };
    this.directionStack.length = 0;
    this.bombPressed = false;
  }

  readGridDirection(): MovementDirection {
    if (this.touchDirection.x || this.touchDirection.y) return { ...this.touchDirection };
    const direction = this.directionStack[this.directionStack.length - 1];
    if (direction === 'left') return { x: -1, y: 0 };
    if (direction === 'right') return { x: 1, y: 0 };
    if (direction === 'up') return { x: 0, y: -1 };
    if (direction === 'down') return { x: 0, y: 1 };
    return { x: 0, y: 0 };
  }

  readMovementDirection(): MovementDirection {
    return this.readGridDirection();
  }

  readMovementVector(): MovementDirection {
    if (this.touchMovement.x || this.touchMovement.y) return { ...this.touchMovement };
    let x = 0;
    let y = 0;
    for (const direction of this.directionStack) {
      if (direction === 'left') x -= 1;
      if (direction === 'right') x += 1;
      if (direction === 'up') y -= 1;
      if (direction === 'down') y += 1;
    }
    return {
      x: Math.sign(x),
      y: Math.sign(y),
    };
  }

  consumeBombPress(): boolean {
    const wasPressed = this.bombPressed;
    this.bombPressed = false;
    return wasPressed;
  }

  private pushDirection(direction: DirectionName): void {
    this.removeDirection(direction);
    this.directionStack.push(direction);
  }

  private removeDirection(direction: DirectionName): void {
    for (let index = this.directionStack.length - 1; index >= 0; index -= 1) {
      if (this.directionStack[index] === direction) this.directionStack.splice(index, 1);
    }
  }
}

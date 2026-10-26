import type { MovementDirection, MovementInput, BombInput } from './InputSystem';

export interface BotAction {
  direction: MovementDirection;
  placeBomb: boolean;
}

/** 把 Bot 的决策结果转换成与键盘输入相同的控制接口。 */
export class BotController implements MovementInput, BombInput {
  private direction: MovementDirection = { x: 0, y: 0 };
  private bombRequested = false;

  setAction(action: BotAction): void {
    this.direction = { ...action.direction };
    this.bombRequested = action.placeBomb;
  }

  stop(): void {
    this.direction = { x: 0, y: 0 };
    this.bombRequested = false;
  }

  readGridDirection(): MovementDirection {
    return { ...this.direction };
  }

  readMovementDirection(): MovementDirection {
    return this.readGridDirection();
  }

  readMovementVector(): MovementDirection {
    return this.readGridDirection();
  }

  consumeBombPress(): boolean {
    const requested = this.bombRequested;
    this.bombRequested = false;
    return requested;
  }
}

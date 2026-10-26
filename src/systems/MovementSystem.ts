import { GAME_SETTINGS } from '../data/gameSettings';
import type { Player } from '../entities/Player';
import type { CollisionSystem } from './CollisionSystem';
import type { MovementInput } from './InputSystem';

export interface MovementTickResult {
  readonly requested: { x: number; y: number };
  readonly moved: boolean;
  readonly blockedX: boolean;
  readonly blockedY: boolean;
}

const IDLE_RESULT: MovementTickResult = {
  requested: { x: 0, y: 0 },
  moved: false,
  blockedX: false,
  blockedY: false,
};

export class MovementSystem {
  constructor(
    private readonly player: Player,
    private readonly inputSystem: MovementInput,
    private readonly collisionSystem: CollisionSystem,
    private readonly stopAnimationWhenBlocked = false,
  ) {}

  updateTick(): MovementTickResult {
    this.collisionSystem.updateBombPass(this.player);
    if (!this.player.isAlive() || this.player.isTrapped()) return IDLE_RESULT;
    const direction = this.inputSystem.readMovementDirection();
    const movement = this.inputSystem.readMovementVector();

    if (movement.x === 0 && movement.y === 0) {
      this.player.setMoving(false);
      this.player.setVelocity({ x: 0, y: 0 });
      return IDLE_RESULT;
    }

    this.player.setFacing(direction);
    const step = this.player.getStats().getMoveSpeed() * (GAME_SETTINGS.simulationTickMs / 1000);
    const previousPosition = { x: this.player.x, y: this.player.y };
    const resolved = this.collisionSystem.resolveMovementVector(
      this.player,
      movement,
      step,
    );

    const moved = resolved.x !== previousPosition.x || resolved.y !== previousPosition.y;
    // 玩家保留 vis 的“按住方向键即播放走路动画”手感；Bot 没有真实
    // 键盘输入，若路点被挡住则必须停动画并尽快重新规划。
    this.player.setMoving(this.stopAnimationWhenBlocked ? moved : true);

    this.player.setPosition(resolved.x, resolved.y);
    const tickSeconds = GAME_SETTINGS.simulationTickMs / 1000;
    this.player.setVelocity({
      x: (resolved.x - previousPosition.x) / tickSeconds,
      y: (resolved.y - previousPosition.y) / tickSeconds,
    });

    this.collisionSystem.updateBombPass(this.player);
    return {
      requested: { ...movement },
      moved,
      blockedX: resolved.blockedX,
      blockedY: resolved.blockedY,
    };
  }
}

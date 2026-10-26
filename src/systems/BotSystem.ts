import type { Bot } from '../entities/Bot';
import { BotBrain } from '../ai/BotBrain';
import type { MapState } from '../data/MapState';
import type { Player } from '../entities/Player';
import type { BombSystem } from './BombSystem';
import type { BotController } from './BotController';
import type { ExplosionSystem } from './ExplosionSystem';
import type { ItemSystem } from './ItemSystem';
import type { MovementTickResult } from './MovementSystem';

/** 把游戏系统当前状态提供给 BotBrain，并将决策写入 BotController。 */
export class BotSystem {
  constructor(
    private readonly bot: Bot,
    private readonly target: Player,
    private readonly controller: BotController,
    private readonly brain: BotBrain,
    private readonly mapState: MapState,
    private readonly bombSystem: BombSystem,
    private readonly itemSystem: ItemSystem,
    private readonly explosionSystem: ExplosionSystem,
  ) {}

  updateTick(): void {
    const action = this.brain.decide({
      bot: this.bot,
      target: this.target,
      mapState: this.mapState,
      bombs: this.bombSystem.getActiveBombs(),
      items: this.itemSystem.getItems(),
      explosionSystem: this.explosionSystem,
    });
    this.controller.setAction(action);
  }

  reportMovementResult(result: MovementTickResult): void {
    this.brain.reportMovementResult(this.bot, result);
  }
}

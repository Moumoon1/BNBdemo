import type { Player } from '../entities/Player';
import type { ExplosionSystem } from './ExplosionSystem';

const TRAP_DURATION_MS = 4000;

/**
 * tpoison 的 applyFlameDamage/updateTraps 的单机版。
 * 爆炸不会立即结束回合，而是先把角色困住；倒计时结束后才死亡。
 */
export class DamageSystem {
  constructor(
    private readonly actors: readonly Player[],
    private readonly explosionSystem: ExplosionSystem,
  ) {}

  updateTick(): void {
    // 先记录本 tick 开始时已经困住的角色。这样同一团爆炸新困住的
    // 两个角色不会在同一 tick 互相“接触击破”，与原版 updateTraps 的
    // “先处理火焰，再处理自由角色触碰”语义一致。
    const trappedBeforeDamage = new Set(
      this.actors.filter((actor) => actor.isAlive() && actor.isTrapped()),
    );

    for (const actor of this.actors) {
      if (actor.isAlive()
        && !actor.isTrapped()
        && this.explosionSystem.isPlayerInExplosion(actor)) {
        actor.trap(TRAP_DURATION_MS);
      }
    }

    // tpoison server/game.js:updateTraps 的核心规则：自由角色进入困泡
    // 的接触范围，困泡立即破裂。碰撞只用于这次交互，不会把角色当成墙。
    for (const trappedActor of trappedBeforeDamage) {
      if (!trappedActor.isAlive() || !trappedActor.isTrapped()) continue;
      const contactActor = this.actors.find((actor) =>
        actor !== trappedActor
        && actor.isAlive()
        && !actor.isTrapped()
        && trappedActor.isTouching(actor),
      );
      if (contactActor) trappedActor.popTrapped();
    }
  }
}

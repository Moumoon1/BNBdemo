import Phaser from 'phaser';
import { MapState } from '../data/MapState';
import { GAME_SETTINGS } from '../data/gameSettings';
import { computeFlameCells } from '../domain/bombRules';
import { gridKey } from '../domain/coordinates';
import { Bomb } from '../entities/Bomb';
import type { Player } from '../entities/Player';
import type { BombInput } from './InputSystem';
import type { CollisionSystem } from './CollisionSystem';
import type { ExplosionSystem } from './ExplosionSystem';
import type { ItemSystem } from './ItemSystem';

export class BombSystem {
  private readonly activeBombs = new Map<string, Bomb>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly actors: readonly Player[],
    private readonly inputs: ReadonlyMap<Player, BombInput>,
    private readonly mapState: MapState,
    private readonly collisionSystem: CollisionSystem,
    private readonly explosionSystem: ExplosionSystem,
    private readonly itemSystem: ItemSystem,
  ) {}

  /**
   * 在移动前处理本 tick 的放泡请求。
   * Bot 会按当前格规划逃生路线，因此泡泡也必须落在同一个当前格。
   */
  processPlacementRequests(): void {
    for (const actor of this.actors) {
      const input = this.inputs.get(actor);
      if (actor.isAlive() && input?.consumeBombPress()) {
        this.tryPlaceBomb(actor);
      }
    }
  }

  updateTick(): void {
    const dueBombs: Bomb[] = [];
    for (const bomb of this.activeBombs.values()) {
      if (bomb.update(GAME_SETTINGS.simulationTickMs)) dueBombs.push(bomb);
    }
    this.detonate(dueBombs);
  }

  getActiveBombs(): readonly Bomb[] {
    return [...this.activeBombs.values()];
  }

  hasBombAt(gridX: number, gridY: number): boolean {
    return this.activeBombs.has(this.getCellKey(gridX, gridY));
  }

  private detonate(initialBombs: readonly Bomb[]): void {
    const queue = [...initialBombs];
    while (queue.length > 0) {
      const bomb = queue.shift();
      if (!bomb) return;

      const key = this.getCellKey(bomb.gridX, bomb.gridY);
      if (this.activeBombs.get(key) !== bomb) continue;

      // 先从索引和碰撞系统移除，再计算火焰，才能正确支持同一团火连锁引爆其他水泡。
      this.activeBombs.delete(key);
      this.collisionSystem.setBombBlocked(bomb.gridX, bomb.gridY, false);
      bomb.destroy();

      // 先清掉爆炸范围内原有的道具；随后 ExplosionSystem 处理方块并生成新道具。
      this.itemSystem.removeInCells(
        computeFlameCells(this.mapState, bomb.gridX, bomb.gridY, bomb.blastRange),
      );
      const cells = this.explosionSystem.createExplosion(
        bomb.gridX,
        bomb.gridY,
        bomb.blastRange,
      );
      for (const cell of cells) {
        const chainedBomb = this.activeBombs.get(this.getCellKey(cell.gridX, cell.gridY));
        if (chainedBomb) queue.push(chainedBomb);
      }
    }
  }

  private tryPlaceBomb(actor: Player): void {
    const ownedBombs = [...this.activeBombs.values()]
      .filter((bomb) => bomb.owner === actor).length;
    if (ownedBombs >= actor.getStats().getBombCapacity()) return;

    const position = actor.getGridPosition();
    const key = this.getCellKey(position.x, position.y);
    if (!this.mapState.isWalkableCell(position.x, position.y) || this.activeBombs.has(key)) return;

    const bomb = new Bomb(
      this.scene,
      position.x,
      position.y,
      actor.getStats().getBlastRange(),
      actor.getSortY(),
      actor,
    );
    this.activeBombs.set(key, bomb);
    this.collisionSystem.setBombBlocked(position.x, position.y, true, actor);
  }

  private getCellKey(gridX: number, gridY: number): string {
    return gridKey(gridX, gridY);
  }
}

import { TILE_TYPES } from '../data/mapData';
import { CRATE_SETTINGS } from '../data/crateSettings';
import { MovingCrate } from '../entities/MovingCrate';
import type { MapState } from '../data/MapState';
import type { Player } from '../entities/Player';
import type { CollisionSystem } from './CollisionSystem';
import type { InputSystem } from './InputSystem';
import type { ItemSystem } from './ItemSystem';
import {
  getMovingCrateBlockedCells,
  isCellOccupiedByActor,
} from '../domain/crateRules';

/** 只处理 vis TownBox（黄色 X 箱）的推箱行为。 */
export class CrateSystem {
  private pushTicks = 0;
  private movingCrate: MovingCrate | undefined;
  private movingFrom: { x: number; y: number } | undefined;
  private movingTo: { x: number; y: number } | undefined;

  constructor(
    private readonly player: Player,
    private readonly actors: readonly Player[],
    private readonly inputSystem: InputSystem,
    private readonly mapState: MapState,
    private readonly collisionSystem: CollisionSystem,
    private readonly itemSystem: ItemSystem,
    private readonly onMapChanged: () => void,
  ) {}

  updateTick(deltaMs: number): void {
    if (this.movingCrate) {
      if (!this.movingCrate.updateTick(deltaMs)) return;
      this.movingCrate.destroy();
      this.movingCrate = undefined;
      if (this.movingFrom && this.movingTo) {
        this.mapState.placeSoftBox(this.movingTo.x, this.movingTo.y);
        this.setMovingCrateBlocked(this.movingFrom, this.movingTo, false);
        this.movingFrom = undefined;
        this.movingTo = undefined;
        this.onMapChanged();
      }
      return;
    }

    if (!this.player.isAlive() || this.player.isTrapped()) {
      this.pushTicks = 0;
      return;
    }

    const direction = this.inputSystem.readMovementDirection();
    if (direction.x === 0 && direction.y === 0) {
      this.pushTicks = 0;
      return;
    }

    // 推箱目标必须来自“当前格 + 面向方向”，不能用连续坐标加偏移反推。
    // 角色贴墙滑行或尚未回到格子中心时，后者会把前方箱子误判到相邻行/列。
    const playerGrid = this.player.getGridPosition();
    const crate = {
      x: playerGrid.x + direction.x,
      y: playerGrid.y + direction.y,
    };
    if (this.mapState.getTile(crate.x, crate.y) !== TILE_TYPES.softBox) {
      this.pushTicks = 0;
      return;
    }

    this.pushTicks += 1;
    if (this.pushTicks < CRATE_SETTINGS.pushDelayTicks) return;
    this.pushTicks = 0;

    const destination = { x: crate.x + direction.x, y: crate.y + direction.y };
    if (!this.mapState.isWalkableCell(destination.x, destination.y)) return;
    if (this.collisionSystem.isCellBlocked(destination.x, destination.y, this.player)) return;
    if (this.itemSystem.hasItemAt(destination.x, destination.y)) return;
    if (isCellOccupiedByActor(this.actors, destination.x, destination.y)) return;
    if (this.mapState.startSoftBoxMove(crate.x, crate.y, destination.x, destination.y)) {
      // tpoison 在滑动完成前保留源格实体，并额外封锁目标格。我们的地图
      // 为了隐藏静态箱子会先清空源格，因此用动态碰撞同时占住两格。
      this.setMovingCrateBlocked(crate, destination, true);
      this.movingFrom = crate;
      this.movingTo = destination;
      this.movingCrate = new MovingCrate(
        this.player.scene,
        crate,
        destination,
      );
      this.onMapChanged();
    }
  }

  private setMovingCrateBlocked(
    from: { x: number; y: number },
    to: { x: number; y: number },
    blocked: boolean,
  ): void {
    for (const cell of getMovingCrateBlockedCells(from, to)) {
      this.collisionSystem.setDynamicBlocked(cell.x, cell.y, blocked);
    }
  }
}

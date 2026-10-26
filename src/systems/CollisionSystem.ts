import { MAP_SETTINGS } from '../data/gameSettings';
import { MapState } from '../data/MapState';
import { gridKey, gridToWorldCenter, worldToGrid } from '../domain/coordinates';
import type { Player } from '../entities/Player';

export interface ResolvedMovement {
  x: number;
  y: number;
  blockedX: boolean;
  blockedY: boolean;
}

/**
 * 角色与地图实体的唯一碰撞边界。
 *
 * 规则以 visolleon/bnb 的角色移动为基线：
 * - 角色保留连续世界坐标；
 * - 地图和水泡使用格子坐标；
 * - 移动使用角色中心点沿行进方向前方 20px 的探点；
 * - 放泡者仍处于泡泡所在格时，泡泡对它保持可穿过；
 * - 探点被挡时按 X/Y 独立尝试，未被挡的轴继续移动；
 * - 成功移动后，只复用 vis 的角点位置修正，不额外做“前方整格”探测。
 */
export class CollisionSystem {
  private readonly bombCells = new Set<string>();
  private readonly bombPassPlayers = new Map<string, Set<Player>>();
  private readonly dynamicBlockedCells = new Set<string>();

  constructor(private readonly mapState: MapState) {}

  isMapCellWalkable(gridX: number, gridY: number): boolean {
    return this.mapState.isWalkableCell(gridX, gridY);
  }

  isCellBlocked(gridX: number, gridY: number, player?: Player): boolean {
    if (!this.isMapCellWalkable(gridX, gridY)) return true;
    const key = gridKey(gridX, gridY);
    if (this.dynamicBlockedCells.has(key)) return true;
    return this.bombCells.has(key) && (!player || !this.bombPassPlayers.get(key)?.has(player));
  }

  setDynamicBlocked(gridX: number, gridY: number, blocked: boolean): void {
    const key = gridKey(gridX, gridY);
    if (blocked) this.dynamicBlockedCells.add(key);
    else this.dynamicBlockedCells.delete(key);
  }

  setBombBlocked(gridX: number, gridY: number, blocked: boolean, passPlayer?: Player): void {
    const key = gridKey(gridX, gridY);
    if (!blocked) {
      this.bombCells.delete(key);
      this.bombPassPlayers.delete(key);
      return;
    }

    this.bombCells.add(key);
    this.bombPassPlayers.set(key, passPlayer ? new Set([passPlayer]) : new Set());
  }

  updateBombPass(player: Player): void {
    for (const [key, passPlayers] of this.bombPassPlayers) {
      if (!passPlayers.has(player)) continue;
      const [gridX, gridY] = key.split(':').map(Number);
      const currentGrid = player.getGridPosition();
      if (currentGrid.x !== gridX || currentGrid.y !== gridY) passPlayers.delete(player);
      if (passPlayers.size === 0) this.bombPassPlayers.delete(key);
    }
  }

  /**
   * 连续坐标移动 + 85bits 分轴滑动 + vis 角点修正。
   *
   * 先分别测试 X-only / Y-only，再测试完整向量。完整向量可行时保持连续
   * 斜向移动；完整向量被挡时，优先保留仍然可行的轴，从而形成贴墙滑动。
   * 如果两个单轴候选组合后仍然碰撞，只采用其中一个合法轴，避免把两个
   * 合法的单轴结果拼成一个非法位置。
   *
   * vis 的 RoleOffset 只在角色实际沿某个轴移动后检查行进方向的两个角点，
   * 发现角点擦到障碍时把垂直坐标拉回当前通道中心线。它不会改变三面墙
   * 场景的出口，也不会把角色推向一个未经碰撞检查的位置。
   */
  resolveMovementVector(
    player: Player,
    movement: { x: number; y: number },
    step: number,
  ): ResolvedMovement {
    const deltaX = movement.x * step;
    const deltaY = movement.y * step;
    const moveX = deltaX === 0
      ? { x: player.x, y: player.y }
      : this.tryMove(player, player.x + deltaX, player.y, 'x');
    const moveY = deltaY === 0
      ? { x: player.x, y: player.y }
      : this.tryMove(player, player.x, player.y + deltaY, 'y');
    const direct = this.tryMove(
      player,
      player.x + deltaX,
      player.y + deltaY,
      this.getMoveAxis(deltaX, deltaY),
    );

    let resolved = direct;
    if (!resolved) {
      const combinedAxes = this.tryMove(
        player,
        moveX?.x ?? player.x,
        moveY?.y ?? player.y,
        this.getMoveAxis(
          (moveX?.x ?? player.x) - player.x,
          (moveY?.y ?? player.y) - player.y,
        ),
      );

      if (combinedAxes) {
        resolved = combinedAxes;
      } else if (deltaX !== 0 && moveX) {
        // 与 vis 的方向移动一致：当前轴能走就保留当前轴；另一个轴停住。
        resolved = moveX;
      } else if (deltaY !== 0 && moveY) {
        resolved = moveY;
      } else {
        resolved = { x: player.x, y: player.y };
      }
    }

    // 只有实际发生了单轴位移时才套用 vis 的 RoleOffset，避免斜向移动时
    // 两次修正互相覆盖。修正结果必须再次通过同一套 vis 探点检查。
    if (resolved.x !== player.x && resolved.y === player.y) {
      resolved = this.applyCornerOffset(player, resolved, 'x');
    } else if (resolved.y !== player.y && resolved.x === player.x) {
      resolved = this.applyCornerOffset(player, resolved, 'y');
    }

    return {
      x: resolved.x,
      y: resolved.y,
      blockedX: deltaX !== 0 && resolved.x === player.x,
      blockedY: deltaY !== 0 && resolved.y === player.y,
    };
  }

  private tryMove(
    player: Player,
    x: number,
    y: number,
    axis: 'x' | 'y' | 'both',
  ): { x: number; y: number } | undefined {
    if (this.isBlocked(player, x, y, axis)) return undefined;
    return { x, y };
  }

  private getMoveAxis(deltaX: number, deltaY: number): 'x' | 'y' | 'both' {
    if (deltaX !== 0 && deltaY !== 0) return 'both';
    return deltaX !== 0 ? 'x' : 'y';
  }

  /**
   * vis RoleOffset 的 Phaser 版本。
   *
   * 角色沿 X 轴移动时检查左/右行进角点，沿 Y 轴移动时检查上/下行进
   * 角点。角点撞到障碍只修正垂直轴，不阻止已经合法的前进轴。
   */
  private applyCornerOffset(
    player: Player,
    position: { x: number; y: number },
    axis: 'x' | 'y',
  ): { x: number; y: number } {
    const halfTile = MAP_SETTINGS.tileSize / 2;
    const points = axis === 'x'
      ? [
        { x: position.x + Math.sign(position.x - player.x) * halfTile, y: position.y - halfTile },
        { x: position.x + Math.sign(position.x - player.x) * halfTile, y: position.y + halfTile },
      ]
      : [
        { x: position.x - halfTile, y: position.y + Math.sign(position.y - player.y) * halfTile },
        { x: position.x + halfTile, y: position.y + Math.sign(position.y - player.y) * halfTile },
      ];

    const hasBlockingCorner = points.some((point) => {
      const grid = worldToGrid(point.x, point.y);
      // vis 的 GetMapIDByRelativePoint 对地图外点返回 null；地图边界由主探点
      // 检查处理，这里只把地图内的障碍作为角点修正触发条件。
      if (this.mapState.getTile(grid.x, grid.y) === undefined) return false;
      return this.isCellBlocked(grid.x, grid.y, player);
    });
    if (!hasBlockingCorner) return position;

    const grid = worldToGrid(position.x, position.y);
    const laneCenter = axis === 'x'
      ? gridToWorldCenter(grid.x, grid.y).y
      : gridToWorldCenter(grid.x, grid.y).x;
    const corrected = axis === 'x'
      ? { x: position.x, y: laneCenter }
      : { x: laneCenter, y: position.y };
    return this.tryMove(player, corrected.x, corrected.y, axis) ?? position;
  }

  private isBlocked(
    player: Player,
    x: number,
    y: number,
    axis: 'x' | 'y' | 'both',
  ): boolean {
    const horizontalClear = axis === 'y'
      || this.isVisProbePassable(player, x + Math.sign(x - player.x) * MAP_SETTINGS.tileSize / 2, y);
    const verticalClear = axis === 'x'
      || this.isVisProbePassable(player, x, y + Math.sign(y - player.y) * MAP_SETTINGS.tileSize / 2);
    return !horizontalClear || !verticalClear;
  }

  private isVisProbePassable(player: Player, x: number, y: number): boolean {
    const relativeX = x - MAP_SETTINGS.originX;
    const relativeY = y - MAP_SETTINGS.originY;
    if (
      relativeX < 0
      || relativeY < 0
      || relativeX >= MAP_SETTINGS.columns * MAP_SETTINGS.tileSize
      || relativeY >= MAP_SETTINGS.rows * MAP_SETTINGS.tileSize
    ) {
      return false;
    }

    const grid = worldToGrid(x, y);
    return !this.isCellBlocked(grid.x, grid.y, player);
  }
}

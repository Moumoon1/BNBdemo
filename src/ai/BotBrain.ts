import { BOT_SETTINGS } from '../data/botSettings';
import { BOMB_SETTINGS } from '../data/bombSettings';
import { GAME_SETTINGS, MAP_SETTINGS } from '../data/gameSettings';
import { MapState } from '../data/MapState';
import { computeFlameCells } from '../domain/bombRules';
import { gridKey, gridToWorldCenter, type GridPosition } from '../domain/coordinates';
import type { Bot } from '../entities/Bot';
import type { Bomb } from '../entities/Bomb';
import type { Item } from '../entities/Item';
import type { Player } from '../entities/Player';
import type { BotAction } from '../systems/BotController';
import type { ExplosionSystem } from '../systems/ExplosionSystem';
import type { MovementDirection } from '../systems/InputSystem';
import type { MovementTickResult } from '../systems/MovementSystem';

const DIRECTIONS: readonly GridPosition[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

type DirectionKey = 'right' | 'left' | 'down' | 'up';
type BotMode = 'navigate' | 'escape';

interface VirtualBomb {
  readonly gridX: number;
  readonly gridY: number;
  readonly blastRange: number;
  readonly remainingFuseMs: number;
}

interface SearchOptions {
  readonly blocked?: ReadonlySet<string>;
  readonly maxDepth?: number;
  readonly requireMove?: boolean;
  readonly blockedFirstDirections?: ReadonlySet<DirectionKey>;
}

interface TimedSearchNode {
  readonly x: number;
  readonly y: number;
  readonly path: GridPosition[];
  readonly arrivalMs: number;
}

function getDirectionKey(direction: GridPosition): DirectionKey {
  if (direction.x > 0) return 'right';
  if (direction.x < 0) return 'left';
  if (direction.y > 0) return 'down';
  return 'up';
}

export interface BotWorldState {
  readonly bot: Bot;
  readonly target: Player;
  readonly mapState: MapState;
  readonly bombs: readonly Bomb[];
  readonly items: readonly Item[];
  readonly explosionSystem: ExplosionSystem;
}

/**
 * 单机 Bot 决策器。
 *
 * 决策层只负责状态、路径和放泡意图；连续坐标碰撞仍由 MovementSystem
 * 统一处理。Bot 使用稳定的导航/逃生两态，并接收真实碰撞反馈，避免在
 * 同一格反复尝试已经失败的方向。
 */
export class BotBrain {
  private path: GridPosition[] = [];
  private mode: BotMode = 'navigate';
  private decisionTick = 0;
  private blockedFeedbackTicks = 0;
  private readonly failedDirections = new Map<string, Map<DirectionKey, number>>();

  decide(world: BotWorldState): BotAction {
    this.decisionTick += 1;
    this.pruneFailedDirections();

    const { bot } = world;
    if (!bot.isAlive() || bot.isTrapped()) return this.idleAction();

    const current = bot.getGridPosition();
    const currentKey = gridKey(current.x, current.y);
    const dangerDeadlines = this.getDangerDeadlines(world);
    const explosion = this.getCurrentExplosion(world);

    if (this.path.length && this.pathInvalid(world, dangerDeadlines, explosion)) {
      this.resetPath();
    }

    const isThreatened = dangerDeadlines.has(currentKey) || explosion.has(currentKey);
    if (isThreatened) {
      // 逃生路径一旦建立就持续执行；只有路径失效或被真实碰撞阻挡时才重算。
      // 旧逻辑每个 tick 都从当前格重新 BFS，是格内来回转向的主要原因之一。
      if (this.mode !== 'escape' || !this.path.length) {
        this.path = this.findTimedEscapePath(
          world,
          current,
          dangerDeadlines,
          explosion,
        ) ?? [];
        this.mode = 'escape';
      }
      return this.createMovementAction(bot, false);
    }

    if (this.mode === 'escape') {
      if (this.path.length) return this.createMovementAction(bot, false);
      this.mode = 'navigate';
    }

    if (!this.path.length) {
      const bombAction = this.tryPlanBomb(
        world,
        current,
        dangerDeadlines,
        explosion,
      );
      if (bombAction) return bombAction;

      const blocked = new Set([...dangerDeadlines.keys(), ...explosion]);
      const failedDirections = this.getFailedDirections(currentKey);
      this.path = this.findObjective(world, current, blocked, failedDirections)
        ?? this.randomStep(world, current, blocked, failedDirections)
        ?? [];
      this.mode = 'navigate';
    }

    return this.createMovementAction(bot, false);
  }

  /** 接收 MovementSystem 的真实结果，而不是用坐标变化猜测是否撞墙。 */
  reportMovementResult(bot: Bot, result: MovementTickResult): void {
    const { requested } = result;
    if (requested.x === 0 && requested.y === 0) {
      this.blockedFeedbackTicks = 0;
      return;
    }

    const requestedAxisBlocked = (requested.x !== 0 && result.blockedX)
      || (requested.y !== 0 && result.blockedY);
    if (result.moved || !requestedAxisBlocked) {
      this.blockedFeedbackTicks = 0;
      return;
    }

    this.blockedFeedbackTicks += 1;
    if (this.blockedFeedbackTicks < BOT_SETTINGS.blockedFeedbackTicks) return;

    const current = bot.getGridPosition();
    this.rememberFailedDirection(
      gridKey(current.x, current.y),
      getDirectionKey(requested),
    );
    this.blockedFeedbackTicks = 0;
    this.resetPath();
  }

  private tryPlanBomb(
    world: BotWorldState,
    current: GridPosition,
    dangerDeadlines: ReadonlyMap<string, number>,
    explosion: ReadonlySet<string>,
  ): BotAction | undefined {
    const currentKey = gridKey(current.x, current.y);
    const ownedBombs = world.bombs.filter((bomb) => bomb.owner === world.bot).length;
    if (
      dangerDeadlines.has(currentKey)
      || explosion.has(currentKey)
      || ownedBombs >= world.bot.getStats().getBombCapacity()
      || world.bombs.some((bomb) => gridKey(bomb.gridX, bomb.gridY) === currentKey)
    ) {
      return undefined;
    }

    const nearSoft = DIRECTIONS.some(({ x, y }) =>
      world.mapState.isDestructibleCell(current.x + x, current.y + y));
    const targetGrid = world.target.getGridPosition();
    const nearTarget = world.target.isAlive()
      && !world.target.isTrapped()
      && Math.abs(targetGrid.x - current.x) + Math.abs(targetGrid.y - current.y) <= 2;
    if (!nearSoft && !nearTarget) return undefined;

    // 把尚未落地的泡泡加入时间模型。它的未来火线可以在爆炸前穿过，
    // 但路径必须在 fuse - margin 之前完整离开火线。
    const plannedDanger = this.getDangerDeadlines(world, {
      gridX: current.x,
      gridY: current.y,
      blastRange: world.bot.getStats().getBlastRange(),
      remainingFuseMs: BOMB_SETTINGS.fuseDurationMs,
    });
    const escapePath = this.findTimedEscapePath(
      world,
      current,
      plannedDanger,
      explosion,
    );
    if (!escapePath?.length) return undefined;

    this.path = escapePath;
    this.mode = 'escape';
    return this.createMovementAction(world.bot, true);
  }

  private findObjective(
    world: BotWorldState,
    current: GridPosition,
    blocked: ReadonlySet<string>,
    blockedFirstDirections: ReadonlySet<DirectionKey>,
  ): GridPosition[] | undefined {
    const targetGrid = world.target.getGridPosition();
    const itemGoal = (x: number, y: number) =>
      world.items.some((item) => item.gridX === x && item.gridY === y);
    const enemyGoal = (x: number, y: number) =>
      world.target.isAlive()
      && targetGrid.x === x
      && targetGrid.y === y;
    const softGoal = (x: number, y: number) =>
      DIRECTIONS.some(({ x: dx, y: dy }) => world.mapState.isDestructibleCell(x + dx, y + dy));
    const targetDistance = Math.abs(targetGrid.x - current.x) + Math.abs(targetGrid.y - current.y);
    const shouldChaseTarget = world.target.isAlive()
      && (world.target.isTrapped() || targetDistance <= 8);
    const goals = shouldChaseTarget
      ? [enemyGoal, softGoal, itemGoal]
      : [softGoal, itemGoal, enemyGoal];

    for (const goal of goals) {
      const path = this.bfs(world, current.x, current.y, goal, {
        blocked,
        requireMove: goal === softGoal,
        blockedFirstDirections,
      });
      if (path?.length) return path;
    }
    return undefined;
  }

  private randomStep(
    world: BotWorldState,
    current: GridPosition,
    blocked: ReadonlySet<string>,
    blockedFirstDirections: ReadonlySet<DirectionKey>,
  ): GridPosition[] | undefined {
    const options = DIRECTIONS
      .filter((direction) => !blockedFirstDirections.has(getDirectionKey(direction)))
      .map(({ x, y }) => ({ x: current.x + x, y: current.y + y }))
      .filter(({ x, y }) => this.isWalkable(world, x, y) && !blocked.has(gridKey(x, y)));

    // 所有方向都已经失败时宁可短暂停住，不能重新把失败方向放回候选池。
    if (!options.length) return undefined;
    return [options[Math.floor(Math.random() * options.length)]];
  }

  private bfs(
    world: BotWorldState,
    startX: number,
    startY: number,
    isGoal: (gridX: number, gridY: number) => boolean,
    {
      blocked = new Set<string>(),
      maxDepth = BOT_SETTINGS.maxSearchDepth,
      requireMove = false,
      blockedFirstDirections = new Set<DirectionKey>(),
    }: SearchOptions = {},
  ): GridPosition[] | undefined {
    const startKey = gridKey(startX, startY);
    if (!requireMove && isGoal(startX, startY) && !blocked.has(startKey)) return [];

    const visited = new Set<string>([startKey]);
    const queue: Array<{ x: number; y: number; path: GridPosition[] }> = [
      { x: startX, y: startY, path: [] },
    ];

    while (queue.length) {
      const current = queue.shift();
      if (!current || current.path.length >= maxDepth) continue;

      for (const direction of DIRECTIONS) {
        if (
          current.path.length === 0
          && blockedFirstDirections.has(getDirectionKey(direction))
        ) continue;

        const x = current.x + direction.x;
        const y = current.y + direction.y;
        const nextKey = gridKey(x, y);
        if (
          visited.has(nextKey)
          || blocked.has(nextKey)
          || !this.isWalkable(world, x, y)
        ) continue;

        visited.add(nextKey);
        const path = [...current.path, { x, y }];
        if (isGoal(x, y)) return path;
        queue.push({ x, y, path });
      }
    }
    return undefined;
  }

  /**
   * 带时间约束的逃生 BFS。
   * deadline 表示该格最早被火焰覆盖的剩余毫秒数；路径只有在安全余量前
   * 离开当前格并进入下一格才可使用，最终目标必须完全不在预测火线中。
   */
  private findTimedEscapePath(
    world: BotWorldState,
    start: GridPosition,
    dangerDeadlines: ReadonlyMap<string, number>,
    explosion: ReadonlySet<string>,
  ): GridPosition[] | undefined {
    const startKey = gridKey(start.x, start.y);
    const failedDirections = this.getFailedDirections(startKey);
    const bestArrival = new Map<string, number>([[startKey, 0]]);
    const queue: TimedSearchNode[] = [{ x: start.x, y: start.y, path: [], arrivalMs: 0 }];

    while (queue.length) {
      const current = queue.shift();
      if (!current || current.path.length >= BOT_SETTINGS.maxSearchDepth) continue;

      for (const direction of DIRECTIONS) {
        if (current.path.length === 0 && failedDirections.has(getDirectionKey(direction))) {
          continue;
        }

        const x = current.x + direction.x;
        const y = current.y + direction.y;
        const nextKey = gridKey(x, y);
        if (!this.isWalkable(world, x, y) || explosion.has(nextKey)) continue;

        const segmentMs = this.getSegmentTravelMs(world.bot, current, x, y);
        const arrivalMs = current.arrivalMs + segmentMs;
        const currentDeadline = dangerDeadlines.get(gridKey(current.x, current.y));
        const nextDeadline = dangerDeadlines.get(nextKey);
        const edgeDeadline = this.getEarliestDeadline(currentDeadline, nextDeadline);
        if (
          edgeDeadline !== undefined
          && arrivalMs + BOT_SETTINGS.bombEscapeMarginMs >= edgeDeadline
        ) continue;

        const previousBest = bestArrival.get(nextKey);
        if (previousBest !== undefined && previousBest <= arrivalMs) continue;
        bestArrival.set(nextKey, arrivalMs);

        const path = [...current.path, { x, y }];
        if (nextDeadline === undefined) return path;
        queue.push({ x, y, path, arrivalMs });
      }
    }
    return undefined;
  }

  private pathInvalid(
    world: BotWorldState,
    dangerDeadlines: ReadonlyMap<string, number>,
    explosion: ReadonlySet<string>,
  ): boolean {
    if (!this.path.length) return false;

    if (this.path.some(({ x, y }) =>
      !this.isWalkable(world, x, y) || explosion.has(gridKey(x, y)))) {
      return true;
    }

    if (this.mode !== 'escape') {
      return this.path.some(({ x, y }) => dangerDeadlines.has(gridKey(x, y)));
    }

    let arrivalMs = 0;
    let fromX = world.bot.x;
    let fromY = world.bot.y;
    const botGrid = world.bot.getGridPosition();
    let previousKey = gridKey(botGrid.x, botGrid.y);

    for (const cell of this.path) {
      const center = gridToWorldCenter(cell.x, cell.y);
      arrivalMs += this.getTravelTimeMs(
        Math.abs(center.x - fromX) + Math.abs(center.y - fromY),
        world.bot,
      );
      const nextKey = gridKey(cell.x, cell.y);
      const edgeDeadline = this.getEarliestDeadline(
        dangerDeadlines.get(previousKey),
        dangerDeadlines.get(nextKey),
      );
      if (
        edgeDeadline !== undefined
        && arrivalMs + BOT_SETTINGS.bombEscapeMarginMs >= edgeDeadline
      ) return true;

      fromX = center.x;
      fromY = center.y;
      previousKey = nextKey;
    }

    const last = this.path[this.path.length - 1];
    return dangerDeadlines.has(gridKey(last.x, last.y));
  }

  private followPath(bot: Bot): MovementDirection {
    while (this.path.length) {
      const next = this.path[0];
      const center = gridToWorldCenter(next.x, next.y);
      const dx = center.x - bot.x;
      const dy = center.y - bot.y;

      if (Math.abs(dx) <= 0.1 && Math.abs(dy) <= 0.1) {
        this.path.shift();
        continue;
      }

      const maxStep = bot.getStats().getMoveSpeed()
        * (GAME_SETTINGS.simulationTickMs / 1000);

      // 网格路径每 tick 只输出一个轴；接近路点时按剩余距离缩短最后一步。
      // 鞋子提高速度后，固定整步会越过中心并在两侧永久反向，这是此前
      // “偶尔在同一格左右/上下闪动”的确定性原因。
      if (Math.abs(dx) > 3 && Math.abs(dy) > 3) {
        return Math.abs(dx) >= Math.abs(dy)
          ? { x: this.getAxisInput(dx, maxStep), y: 0 }
          : { x: 0, y: this.getAxisInput(dy, maxStep) };
      }
      return Math.abs(dx) > 0.1
        ? { x: this.getAxisInput(dx, maxStep), y: 0 }
        : { x: 0, y: this.getAxisInput(dy, maxStep) };
    }
    return { x: 0, y: 0 };
  }

  private getAxisInput(remainingDistance: number, maxStep: number): number {
    if (maxStep <= 0) return 0;
    return Math.sign(remainingDistance)
      * Math.min(1, Math.abs(remainingDistance) / maxStep);
  }

  /** 计算连锁引爆后的“每个格子最早爆炸时间”。 */
  private getDangerDeadlines(
    world: BotWorldState,
    virtualBomb?: VirtualBomb,
  ): Map<string, number> {
    const bombs: VirtualBomb[] = world.bombs.map((bomb) => ({
      gridX: bomb.gridX,
      gridY: bomb.gridY,
      blastRange: bomb.blastRange,
      remainingFuseMs: bomb.getRemainingFuseMs(),
    }));
    if (virtualBomb) bombs.push(virtualBomb);

    const flameCells = bombs.map((bomb) => computeFlameCells(
      world.mapState,
      bomb.gridX,
      bomb.gridY,
      bomb.blastRange,
    ));
    const detonationMs = bombs.map((bomb) => bomb.remainingFuseMs);
    const bombIndexByCell = new Map(
      bombs.map((bomb, index) => [gridKey(bomb.gridX, bomb.gridY), index]),
    );

    // 传播连锁引爆时间，直到没有水泡会被更早的火焰触发。
    let changed = true;
    while (changed) {
      changed = false;
      flameCells.forEach((cells, sourceIndex) => {
        cells.forEach((cell) => {
          const targetIndex = bombIndexByCell.get(gridKey(cell.gridX, cell.gridY));
          if (
            targetIndex !== undefined
            && detonationMs[targetIndex] > detonationMs[sourceIndex]
          ) {
            detonationMs[targetIndex] = detonationMs[sourceIndex];
            changed = true;
          }
        });
      });
    }

    const deadlines = new Map<string, number>();
    flameCells.forEach((cells, bombIndex) => {
      cells.forEach((cell) => {
        const key = gridKey(cell.gridX, cell.gridY);
        const previous = deadlines.get(key);
        if (previous === undefined || detonationMs[bombIndex] < previous) {
          deadlines.set(key, detonationMs[bombIndex]);
        }
      });
    });
    return deadlines;
  }

  private getCurrentExplosion(world: BotWorldState): Set<string> {
    const cells = new Set<string>();
    for (let gridY = 0; gridY < MAP_SETTINGS.rows; gridY += 1) {
      for (let gridX = 0; gridX < MAP_SETTINGS.columns; gridX += 1) {
        if (world.explosionSystem.isCellInExplosion(gridX, gridY)) {
          cells.add(gridKey(gridX, gridY));
        }
      }
    }
    return cells;
  }

  private isWalkable(world: BotWorldState, gridX: number, gridY: number): boolean {
    if (
      gridX < 0
      || gridY < 0
      || gridX >= MAP_SETTINGS.columns
      || gridY >= MAP_SETTINGS.rows
    ) return false;
    if (!world.mapState.isWalkableCell(gridX, gridY)) return false;
    return !world.bombs.some((bomb) => bomb.gridX === gridX && bomb.gridY === gridY);
  }

  private getSegmentTravelMs(
    bot: Bot,
    current: TimedSearchNode,
    nextX: number,
    nextY: number,
  ): number {
    const destination = gridToWorldCenter(nextX, nextY);
    if (current.path.length === 0) {
      return this.getTravelTimeMs(
        Math.abs(destination.x - bot.x) + Math.abs(destination.y - bot.y),
        bot,
      );
    }
    return this.getTravelTimeMs(MAP_SETTINGS.tileSize, bot);
  }

  private getTravelTimeMs(distance: number, bot: Bot): number {
    return distance / bot.getStats().getMoveSpeed() * 1000;
  }

  private getEarliestDeadline(
    first: number | undefined,
    second: number | undefined,
  ): number | undefined {
    if (first === undefined) return second;
    if (second === undefined) return first;
    return Math.min(first, second);
  }

  private createMovementAction(bot: Bot, placeBomb: boolean): BotAction {
    return { direction: this.followPath(bot), placeBomb };
  }

  private rememberFailedDirection(cellKey: string, direction: DirectionKey): void {
    const directions = this.failedDirections.get(cellKey) ?? new Map<DirectionKey, number>();
    directions.set(direction, this.decisionTick + BOT_SETTINGS.failedDirectionTtlTicks);
    this.failedDirections.set(cellKey, directions);
  }

  private getFailedDirections(cellKey: string): ReadonlySet<DirectionKey> {
    const directions = this.failedDirections.get(cellKey);
    if (!directions) return new Set<DirectionKey>();
    return new Set(
      [...directions.entries()]
        .filter(([, expiresAt]) => expiresAt > this.decisionTick)
        .map(([direction]) => direction),
    );
  }

  private pruneFailedDirections(): void {
    for (const [cellKey, directions] of this.failedDirections) {
      for (const [direction, expiresAt] of directions) {
        if (expiresAt <= this.decisionTick) directions.delete(direction);
      }
      if (directions.size === 0) this.failedDirections.delete(cellKey);
    }
  }

  private resetPath(): void {
    this.path = [];
  }

  private idleAction(): BotAction {
    return { direction: { x: 0, y: 0 }, placeBomb: false };
  }
}

import Phaser from 'phaser';
import { MapState } from '../data/MapState';
import { GAME_SETTINGS } from '../data/gameSettings';
import { computeFlameCells, hasExplosionCell, type ExplosionCell } from '../domain/bombRules';
import { worldToGrid } from '../domain/coordinates';
import type { Player } from '../entities/Player';
import { Explosion } from '../entities/Explosion';

export class ExplosionSystem {
  private readonly activeExplosions: Explosion[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly mapState: MapState,
    private readonly onMapChanged: () => void,
    private readonly onDestructibleDestroyed: (gridX: number, gridY: number) => void,
  ) {}

  createExplosion(gridX: number, gridY: number, blastRange: number): readonly ExplosionCell[] {
    const cells = computeFlameCells(this.mapState, gridX, gridY, blastRange);
    let mapChanged = false;
    for (const cell of cells) {
      const destroyed = this.mapState.destroyCell(cell.gridX, cell.gridY);
      mapChanged = destroyed || mapChanged;
      if (destroyed) this.onDestructibleDestroyed(cell.gridX, cell.gridY);
    }
    if (mapChanged) this.onMapChanged();
    this.activeExplosions.push(new Explosion(this.scene, cells));
    return cells;
  }

  updateTick(): void {
    for (let index = this.activeExplosions.length - 1; index >= 0; index -= 1) {
      const explosion = this.activeExplosions[index];
      if (!explosion.update(GAME_SETTINGS.simulationTickMs)) continue;

      explosion.destroy();
      this.activeExplosions.splice(index, 1);
    }
  }

  /** 结算时立即移除尚未走完生命周期的十字水花。 */
  clear(): void {
    this.activeExplosions.forEach((explosion) => explosion.destroy());
    this.activeExplosions.length = 0;
  }

  isPlayerInExplosion(player: Player): boolean {
    const position = worldToGrid(player.x, player.y);
    return this.isCellInExplosion(position.x, position.y);
  }

  isCellInExplosion(gridX: number, gridY: number): boolean {
    return this.activeExplosions.some((explosion) =>
      hasExplosionCell(explosion.cells, gridX, gridY),
    );
  }
}

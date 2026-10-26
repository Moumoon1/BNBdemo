import Phaser from 'phaser';
import { ITEM_SETTINGS, rollItemKind, type ItemKind } from '../data/itemSettings';
import { gridKey } from '../domain/coordinates';
import { Item } from '../entities/Item';
import type { Player } from '../entities/Player';

export class ItemSystem {
  private readonly items = new Map<string, Item>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly actors: readonly Player[],
  ) {}

  handleDestructibleDestroyed(gridX: number, gridY: number): void {
    const kind = rollItemKind();
    if (kind) this.spawn(gridX, gridY, kind);
  }

  updateTick(deltaMs: number): void {
    for (const item of this.items.values()) item.updateTick(deltaMs);

    for (const actor of this.actors) {
      if (!actor.isAlive() || actor.isTrapped()) continue;
      const position = actor.getGridPosition();
      const key = gridKey(position.x, position.y);
      const item = this.items.get(key);
      if (!item) continue;

      this.apply(actor, item.kind);
      item.destroy();
      this.items.delete(key);
    }
  }

  removeInCells(cells: readonly { gridX: number; gridY: number }[]): void {
    for (const cell of cells) {
      const key = gridKey(cell.gridX, cell.gridY);
      const item = this.items.get(key);
      if (!item) continue;
      item.destroy();
      this.items.delete(key);
    }
  }

  hasItemAt(gridX: number, gridY: number): boolean {
    return this.items.has(gridKey(gridX, gridY));
  }

  getItems(): readonly Item[] {
    return [...this.items.values()];
  }

  private spawn(gridX: number, gridY: number, kind: ItemKind): void {
    const key = gridKey(gridX, gridY);
    if (this.items.has(key)) return;
    this.items.set(key, new Item(this.scene, gridX, gridY, kind));
  }

  private apply(actor: Player, kind: ItemKind): void {
    if (kind === 'bomb') actor.getStats().addBombCapacity();
    if (kind === 'shoe') actor.getStats().addMoveSpeed(ITEM_SETTINGS.speedIncrease);
    if (kind === 'range') actor.getStats().addBlastRange();
  }
}

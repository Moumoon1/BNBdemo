import Phaser from 'phaser';
import type { MapDefinition } from '../data/maps';
import { getGroundStyle, GROUND_EDGE } from '../data/ground';
import { TILE_ASSETS, TILE_HEIGHTS } from '../data/tileAssets';
import { MAP_SETTINGS } from '../data/gameSettings';

/** Full-width terrain preview. Actors are only created inside the playable scene. */
export class MapPreview extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, map: MapDefinition, x: number, y: number, width = 370) {
    super(scene, x, y);
    scene.add.existing(this);
    const mapWidth = MAP_SETTINGS.columns * MAP_SETTINGS.tileSize;
    const mapHeight = MAP_SETTINGS.rows * MAP_SETTINGS.tileSize + 28;
    this.setScale(width / mapWidth);
    const backdrop = new Phaser.GameObjects.Graphics(scene);
    backdrop.fillStyle(GROUND_EDGE).fillRect(0, 0, mapWidth, mapHeight);
    this.add(backdrop);
    const objects: Phaser.GameObjects.GameObject[] = [];
    map.tiles.forEach((row, rowIndex) => row.forEach((tile, columnIndex) => {
      const x = columnIndex * MAP_SETTINGS.tileSize;
      const y = 28 + rowIndex * MAP_SETTINGS.tileSize;
      const style = getGroundStyle(columnIndex, rowIndex);
      const ground = new Phaser.GameObjects.Rectangle(scene, x, y, 40, 40, style.fill)
        .setOrigin(0).setStrokeStyle(1, style.border, 0.35);
      this.add(ground);
      const asset = TILE_ASSETS[tile];
      if (asset) objects.push(new Phaser.GameObjects.Image(scene, x + 20, y + 40, asset)
        .setOrigin(0.5, 1).setDisplaySize(40, TILE_HEIGHTS[tile] ?? 40).setDepth(y + 40));
    }));
    objects.sort((a, b) => (a as Phaser.GameObjects.Image).depth - (b as Phaser.GameObjects.Image).depth);
    this.add(objects);
  }
}

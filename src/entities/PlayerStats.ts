export interface PlayerStatsSnapshot {
  bombCapacity: number;
  blastRange: number;
  moveSpeed: number;
  speedLevel: number;
}

export class PlayerStats {
  private bombCapacity = 1;
  private blastRange = 1;
  private moveSpeed: number;
  private speedLevel = 1;

  constructor(baseMoveSpeed: number) {
    this.moveSpeed = baseMoveSpeed;
  }

  getMoveSpeed(): number {
    return this.moveSpeed;
  }

  getBombCapacity(): number {
    return this.bombCapacity;
  }

  getBlastRange(): number {
    return this.blastRange;
  }

  addBombCapacity(amount = 1): void {
    this.bombCapacity += amount;
  }

  addBlastRange(amount = 1): void {
    this.blastRange += amount;
  }

  addMoveSpeed(amount: number): void {
    this.moveSpeed += amount;
    this.speedLevel += 1;
  }

  getSnapshot(): PlayerStatsSnapshot {
    return {
      bombCapacity: this.bombCapacity,
      blastRange: this.blastRange,
      moveSpeed: this.moveSpeed,
      speedLevel: this.speedLevel,
    };
  }
}

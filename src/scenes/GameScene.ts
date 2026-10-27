import Phaser from 'phaser';
import { MapState } from '../data/MapState';
import { GROUND_EDGE } from '../data/ground';
import { getBotSpawnPosition } from '../data/botSettings';
import { AUDIO_SETTINGS } from '../data/audioSettings';
import { getOpponentDefinition, type OpponentDefinition } from '../data/opponents';
import { GAME_SETTINGS, MOBILE_LAYOUT } from '../data/gameSettings';
import { getMapDefinition, type MapDefinition } from '../data/maps';
import { getPlayerSpawnPosition } from '../data/playerSettings';
import { Bot } from '../entities/Bot';
import { Player } from '../entities/Player';
import { BotBrain } from '../ai/BotBrain';
import { MapRenderer } from '../systems/MapRenderer';
import { BombSystem } from '../systems/BombSystem';
import { BotController } from '../systems/BotController';
import { BotSystem } from '../systems/BotSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { DepthSortSystem } from '../systems/DepthSortSystem';
import { DamageSystem } from '../systems/DamageSystem';
import { ExplosionSystem } from '../systems/ExplosionSystem';
import { InputSystem } from '../systems/InputSystem';
import type { BombInput } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CrateSystem } from '../systems/CrateSystem';
import { BackgroundMusic } from '../systems/BackgroundMusic';
import { ItemSystem } from '../systems/ItemSystem';

export class GameScene extends Phaser.Scene {
  private readonly depthSortSystem = new DepthSortSystem();
  private mapState!: MapState;
  private selectedMap!: MapDefinition;
  private selectedOpponent!: OpponentDefinition;
  private mapRenderer!: MapRenderer;
  private player!: Player;
  private bots: Bot[] = [];
  private inputSystem!: InputSystem;
  private botControllers: BotController[] = [];
  private movementSystem!: MovementSystem;
  private botMovementSystems: MovementSystem[] = [];
  private botSystems: BotSystem[] = [];
  private bombSystem!: BombSystem;
  private explosionSystem!: ExplosionSystem;
  private damageSystem!: DamageSystem;
  private itemSystem!: ItemSystem;
  private crateSystem!: CrateSystem;
  private backgroundMusic!: BackgroundMusic;
  private gameOver = false;
  private remainingSeconds: number = GAME_SETTINGS.roundDurationSeconds;
  private simulationAccumulatorMs = 0;

  constructor() {
    super('GameScene');
  }

  init(data: { mapId?: string; opponentId?: string } = {}): void {
    this.selectedMap = getMapDefinition(data.mapId ?? this.registry.get('selectedMapId'));
    this.registry.set('selectedMapId', this.selectedMap.id);
    this.selectedOpponent = getOpponentDefinition(data.opponentId ?? this.registry.get('selectedOpponentId'));
    this.registry.set('selectedOpponentId', this.selectedOpponent.id);
  }

  create(): void {
    // Scene.restart() reuses this scene instance, so reset all round state
    // before creating the new systems and UI.
    this.gameOver = false;
    this.remainingSeconds = GAME_SETTINGS.roundDurationSeconds;
    this.simulationAccumulatorMs = 0;

    this.cameras.main
      .setViewport(MOBILE_LAYOUT.mapX, MOBILE_LAYOUT.mapY, MOBILE_LAYOUT.mapWidth, MOBILE_LAYOUT.mapHeight)
      .setZoom(MOBILE_LAYOUT.mapZoom)
      .centerOn(MOBILE_LAYOUT.mapCenterX, MOBILE_LAYOUT.mapCenterY)
      .setBackgroundColor(GROUND_EDGE);

    this.backgroundMusic = new BackgroundMusic(
      this,
      AUDIO_SETTINGS.gameMusicKey,
      AUDIO_SETTINGS.gameVolume,
    );
    this.backgroundMusic.play();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.backgroundMusic.stop());

    this.mapState = new MapState(this.selectedMap.tiles);
    this.mapRenderer = new MapRenderer(this);
    this.mapRenderer.render(this.mapState.getSnapshot());

    this.player = new Player(this, getPlayerSpawnPosition());
    this.player.playStart();
    this.bots = [new Bot(this, getBotSpawnPosition(), this.selectedOpponent.visual)];
    this.bots.forEach((bot) => bot.setFacing({ x: 0, y: 1 }));
    this.inputSystem = new InputSystem(this);
    this.botControllers = this.bots.map(() => new BotController());
    const actors: readonly Player[] = [this.player, ...this.bots];
    const collisionSystem = new CollisionSystem(this.mapState);
    this.itemSystem = new ItemSystem(this, actors);
    this.explosionSystem = new ExplosionSystem(this, this.mapState, () => {
      this.mapRenderer.render(this.mapState.getSnapshot());
    }, (gridX, gridY) => {
      this.itemSystem.handleDestructibleDestroyed(gridX, gridY);
    });
    this.damageSystem = new DamageSystem(actors, this.explosionSystem);
    this.movementSystem = new MovementSystem(
      this.player,
      this.inputSystem,
      collisionSystem,
    );
    this.botMovementSystems = this.bots.map((bot, index) => new MovementSystem(
      bot,
      this.botControllers[index],
      collisionSystem,
      true,
    ));
    this.bombSystem = new BombSystem(
      this,
      actors,
      new Map<Player, BombInput>([
        [this.player, this.inputSystem],
        ...this.bots.map((bot, index): [Player, BombInput] => [
          bot,
          this.botControllers[index],
        ]),
      ]),
      this.mapState,
      collisionSystem,
      this.explosionSystem,
      this.itemSystem,
    );
    this.crateSystem = new CrateSystem(
      this.player,
      actors,
      this.inputSystem,
      this.mapState,
      collisionSystem,
      this.itemSystem,
      () => this.mapRenderer.render(this.mapState.getSnapshot()),
    );
    this.botSystems = this.bots.map((bot, index) => new BotSystem(
      bot,
      this.player,
      this.botControllers[index],
      new BotBrain(this.selectedOpponent.style),
      this.mapState,
      this.bombSystem,
      this.itemSystem,
      this.explosionSystem,
    ));
    this.scene.launch('GameUIScene', { game: this, input: this.inputSystem, player: this.player, map: this.selectedMap, opponent: this.selectedOpponent, opponentCount: this.bots.length });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scene.stop('GameUIScene'));
  }

  update(_time: number, delta: number): void {
    if (this.gameOver) return;

    this.simulationAccumulatorMs += Math.min(delta, 100);
    while (this.simulationAccumulatorMs >= GAME_SETTINGS.simulationTickMs && !this.gameOver) {
      this.simulationAccumulatorMs -= GAME_SETTINGS.simulationTickMs;
      this.runSimulationTick();
    }
    this.depthSortSystem.sort([this.player, ...this.bots]);
    // 标签页被切到后台时，浏览器可能一次性给出很大的 delta；不能让
    // 一次渲染暂停直接把整局倒计时扣完。
    this.remainingSeconds = Math.max(0, this.remainingSeconds - Math.min(delta, 100) / 1000);
    this.events.emit('round-update', this.remainingSeconds, this.bots.filter((bot) => bot.isAlive()).length);

  }

  private runSimulationTick(): void {
    this.botSystems.forEach((system) => system.updateTick());
    this.bombSystem.processPlacementRequests();
    // 推箱判定先于角色移动：箱子一旦开始滑动，本 tick 内源格和目标格
    // 就必须同时成为实体，不能留给对向 Bot 一帧穿越窗口。
    this.crateSystem.updateTick(GAME_SETTINGS.simulationTickMs);
    this.movementSystem.updateTick();
    this.botMovementSystems.forEach((movementSystem, index) => {
      const result = movementSystem.updateTick();
      this.botSystems[index].reportMovementResult(result);
    });
    this.bombSystem.updateTick();
    this.explosionSystem.updateTick();
    this.damageSystem.updateTick();
    this.player.tickStatus(GAME_SETTINGS.simulationTickMs);
    this.bots.forEach((bot) => bot.tickStatus(GAME_SETTINGS.simulationTickMs));
    this.itemSystem.updateTick(GAME_SETTINGS.simulationTickMs);

    if (!this.player.isAlive() && this.player.isDeathAnimationComplete()) {
      this.finishRound('被困住后淘汰');
    } else if (this.bots.every((bot) => !bot.isAlive() && bot.isDeathAnimationComplete())) {
      this.finishRound('击败对手');
    } else if (
      this.player.isAlive()
      && this.bots.some((bot) => bot.isAlive())
      && this.remainingSeconds <= 0
    ) {
      this.finishRound('时间到');
    }
  }

  private finishRound(message: string): void {
    if (this.gameOver) return;
    this.gameOver = true;

    // gameOver 会停止后续模拟 tick，但 Phaser 的精灵动画仍会独立播放；
    // 因此结算时必须显式清空控制输入，并把所有存活角色落到静止帧。
    this.botControllers.forEach((controller) => controller.stop());
    [this.player, ...this.bots].forEach((actor) => actor.stopMovement());
    // 模拟停止后 ExplosionSystem 不会再收到 updateTick；必须在结算前
    // 主动销毁未结束的蓝色十字，否则最后一帧会永久留在地图上。
    this.explosionSystem.clear();
    this.inputSystem.reset();
    this.events.emit('round-end', message);
  }
}

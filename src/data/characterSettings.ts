export type CharacterFacing = 'up' | 'down' | 'left' | 'right';

export interface CharacterVisualSettings {
  readonly id: string;
  readonly idleTextureKey: string;
  readonly trappedTextureKey: string;
  readonly dieTextureKey: string;
  readonly startTextureKey?: string;
  readonly idleFramesPerDirection: number;
  readonly directionRows?: Readonly<Record<CharacterFacing, number>>;
  readonly trappedFrameStart?: number;
  readonly trappedFrameCount: number;
  readonly dieFrameStart?: number;
  readonly dieFrameCount: number;
  readonly visualWidth: number;
  readonly visualHeight: number;
  readonly spriteY: number;
  readonly sortFootOffset: number;
}

export const PLAYER_VISUAL_SETTINGS: CharacterVisualSettings = {
  id: 'role1',
  idleTextureKey: 'vis-role1',
  trappedTextureKey: 'vis-role1-ani',
  dieTextureKey: 'vis-role1-die',
  startTextureKey: 'vis-role1-start',
  idleFramesPerDirection: 6,
  trappedFrameCount: 8,
  dieFrameCount: 11,
  visualWidth: 48,
  visualHeight: 64,
  spriteY: 20,
  sortFootOffset: 20,
};

export const BOT_VISUAL_SETTINGS: CharacterVisualSettings = {
  id: 'role2',
  idleTextureKey: 'vis-role2',
  trappedTextureKey: 'vis-role2-ani',
  dieTextureKey: 'vis-role2-die',
  idleFramesPerDirection: 6,
  trappedFrameCount: 8,
  dieFrameCount: 11,
  visualWidth: 56,
  visualHeight: 67,
  spriteY: 20,
  sortFootOffset: 20,
};

/** 第二个 Bot：用户提供的 6×4、单帧 56×67 精灵表。 */
export const SECOND_BOT_VISUAL_SETTINGS: CharacterVisualSettings = {
  id: 'rb-role',
  idleTextureKey: 'rb-role',
  // 当前素材只包含四方向走路帧；被困和死亡阶段仍保持同一角色外观，
  // 公共 BigPopo 会继续提供困泡与破泡动画。
  trappedTextureKey: 'rb-role',
  dieTextureKey: 'rb-role',
  idleFramesPerDirection: 6,
  // 第三行向左、第四行向右；与键盘和世界坐标方向保持一致。
  directionRows: { up: 0, down: 1, left: 2, right: 3 },
  trappedFrameStart: 6,
  trappedFrameCount: 6,
  dieFrameStart: 6,
  dieFrameCount: 6,
  visualWidth: 56,
  visualHeight: 67,
  spriteY: 20,
  sortFootOffset: 20,
};

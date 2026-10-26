export const SIDEBAR_COPY = {
  title: '玩具信息',
  time: '时间',
  bombCount: '炸弹数量',
  blastRange: '爆炸范围',
  speedLevel: '移动速度',
  status: '状态',
  statusReady: '准备中',
  exit: '退出游戏',
} as const;

export const DEFAULT_TOY_INFO = {
  bombCount: 1,
  blastRange: 1,
  speedLevel: 1,
  status: SIDEBAR_COPY.statusReady,
} as const;

export const SIDEBAR_THEME = {
  backgroundColor: 0x0b4a83,
  panelColor: 0x145da0,
  panelBorderColor: 0x60a5fa,
  textColor: '#e0f2fe',
  mutedTextColor: '#bfdbfe',
  accentColor: '#facc15',
} as const;

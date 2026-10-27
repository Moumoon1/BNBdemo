import { BOT_VISUAL_SETTINGS, SECOND_BOT_VISUAL_SETTINGS, type CharacterVisualSettings } from './characterSettings';

export type BotStyle = 'balanced' | 'aggressive';

export interface OpponentDefinition {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly style: BotStyle;
  readonly visual: CharacterVisualSettings;
}

export const OPPONENTS: readonly OpponentDefinition[] = [
  { id: 'role2', name: '对手 1', label: '稳健型', style: 'balanced', visual: BOT_VISUAL_SETTINGS },
  { id: 'rb-role', name: '对手 2', label: '进攻型', style: 'aggressive', visual: SECOND_BOT_VISUAL_SETTINGS },
];

export function getOpponentDefinition(id: unknown): OpponentDefinition {
  return OPPONENTS.find((opponent) => opponent.id === id) ?? OPPONENTS[0];
}

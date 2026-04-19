import { StrategyId } from '../store/types';

export const STRATEGIES: { id: StrategyId, name: string, description: string, tag: string }[] = [
  { id: 'go_loud', name: 'GO LOUD', description: 'More fights. More loot. More risk.', tag: 'FREE' },
  { id: 'lay_low', name: 'LAY LOW', description: 'Fewer fights. Fewer losses. Boring wins.', tag: 'FREE' },
  { id: 'chaos_mode', name: 'CHAOS MODE', description: 'More random events. Nobody knows what happens next. Including you.', tag: 'FREE' }
];

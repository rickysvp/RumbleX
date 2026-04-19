import { Player, ItemId } from '../store/types';

export interface ItemOutcome {
  success: boolean;
  redirectTarget: Player | null;
  narrativeSuffix: string;
}

export const itemEngine = {
  resolveItem(item: ItemId | null, attacker: Player, target: Player, allPlayers: Player[]): ItemOutcome {
    if (!item) return { success: false, redirectTarget: null, narrativeSuffix: '' };

    switch (item) {
      case 'uno_reverse':
        const randomThirdParty = allPlayers
          .filter(p => p.id !== attacker.id && p.id !== target.id && p.status === 'alive')
          .sort(() => 0.5 - Math.random())[0];
        return {
          success: true,
          redirectTarget: randomThirdParty || null,
          narrativeSuffix: 'redirected via Uno Reverse'
        };

      case 'drama_bomb':
        return {
          success: true,
          redirectTarget: null,
          narrativeSuffix: 'instigated absolute chaos'
        };

      case 'back_off_horn':
      case 'act_natural':
      case 'slip_card':
      case 'decoy_dummy':
        return {
          success: true,
          redirectTarget: null,
          narrativeSuffix: 'utilized item'
        };

      default:
        return { success: false, redirectTarget: null, narrativeSuffix: '' };
    }
  }
};

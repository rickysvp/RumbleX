import { Player, SkillId } from '../store/types';

export interface SkillOutcome {
  success: boolean;
  modifiedTarget: Player | null;
  narrativeSuffix: string;
}

export const skillEngine = {
  resolveSkill(skill: SkillId | null, attacker: Player, target: Player, allPlayers: Player[]): SkillOutcome {
    if (!skill) return { success: false, modifiedTarget: null, narrativeSuffix: '' };

    switch (skill) {
      case 'one_tap':
        return {
          success: true,
          modifiedTarget: target,
          narrativeSuffix: 'One Tap executed'
        };

      case 'bounty_rush':
        // Find richest target
        const richest = allPlayers
          .filter(p => p.id !== attacker.id && p.status === 'alive')
          .reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr), target);
        return {
          success: true,
          modifiedTarget: richest,
          narrativeSuffix: 'targeted the richest'
        };

      case 'no_u':
        // Counter-attack logic is usually handled in the main combat loop, 
        // but here we check if target has a skill to reverse.
        return {
          success: true,
          modifiedTarget: target,
          narrativeSuffix: 'reversed the momentum'
        };

      case 'smoke_out':
      case 'play_dead':
      case 'miss_me':
        // Defensive skills
        return {
          success: true,
          modifiedTarget: null,
          narrativeSuffix: 'invoked defense'
        };

      default:
        return { success: false, modifiedTarget: null, narrativeSuffix: '' };
    }
  }
};

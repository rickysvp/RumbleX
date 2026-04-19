import { SeasonEntry } from '../store/types';

/**
 * Computes season payouts based on a kill-threshold airdrop model.
 * Each qualified player (kills >= threshold) receives a share of the pool
 * proportional to their kills vs the total qualified kills.
 */
export function computeSeasonPayouts(
  leaderboard: SeasonEntry[],
  seasonPool: number,
  threshold: number
): { updatedLeaderboard: SeasonEntry[]; totalQualifiedKills: number } {
  // 1. Filter qualified players and calculate total qualified kills
  const qualifiedPlayers = leaderboard.filter(p => p.kills >= threshold);
  const totalQualifiedKills = qualifiedPlayers.reduce((sum, p) => sum + p.kills, 0);

  // 2. Update leaderboard with estimated payouts and qualification status
  const updatedLeaderboard = leaderboard.map(p => {
    const qualified = p.kills >= threshold;
    let estimatedPayout = 0;

    if (qualified && totalQualifiedKills > 0) {
      estimatedPayout = seasonPool * (p.kills / totalQualifiedKills);
    }

    return {
      ...p,
      qualified,
      estimatedPayout
    };
  });

  return {
    updatedLeaderboard,
    totalQualifiedKills
  };
}

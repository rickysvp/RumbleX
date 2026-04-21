import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Crown, Medal } from 'lucide-react';

export function RankPage() {
  const seasonLeaderboard = useGameStore(state => state.seasonLeaderboard || []);
  const seasonPool = useGameStore(state => state.seasonPool || 0);
  const seasonNumber = useGameStore(state => state.seasonNumber || 1);
  const threshold = 100; // SEASON_CONFIG.SEASON_KILL_THRESHOLD

  const top10 = seasonLeaderboard.slice(0, 10);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={16} className="text-yellow-400" />;
    if (index === 1) return <Medal size={16} className="text-gray-400" />;
    if (index === 2) return <Medal size={16} className="text-amber-600" />;
    return <span className="text-[12px] text-app-muted w-4 text-center">#{index + 1}</span>;
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Season {seasonNumber} Rank
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Top players by kills. Prize pool: <span className="text-app-accent font-bold">{seasonPool.toFixed(0)} MON</span>
          </p>
        </div>

        {/* Leaderboard */}
        {top10.length === 0 ? (
          <div className="text-center py-20 text-app-muted">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-[14px]">Season just started. No rankings yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {top10.map((player, index) => (
              <div
                key={player.handle}
                className={`flex items-center justify-between p-4 border ${
                  index < 3 
                    ? 'bg-app-accent/5 border-app-accent/20' 
                    : 'bg-[#111] border-[#222]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="text-white font-app-bold text-[14px]">{player.handle}</div>
                    <div className="text-[11px] text-app-muted">
                      {player.kills} Kills {player.qualified ? '• Qualified' : `• Need ${threshold - player.kills} more`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-app-accent font-app-mono text-[16px]">
                    {player.estimatedPayout.toFixed(0)} MON
                  </div>
                  <div className="text-[10px] text-app-muted">Est. Payout</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Qualification Note */}
        <div className="mt-6 p-4 bg-[#111] border border-[#222]">
          <div className="text-[12px] text-app-muted">
            <span className="text-white font-bold">Qualification:</span> Achieve {threshold}+ kills during the season to be eligible for rewards.
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useGameStore } from '../../../store/gameStore';
import { SEASON_CONFIG } from '../../../lib/seasonConfig';

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  return `${days}D ${hours}H`;
};

export function SeasonInfo() {
  const seasonNumber = useGameStore(state => state.seasonNumber || 1);
  const seasonPool = useGameStore(state => state.seasonPool || 0);
  const seasonEndsIn = useGameStore(state => state.seasonEndsIn || 0);
  const totalRoundsPlayed = useGameStore(state => state.totalRoundsPlayed || 0);

  return (
    <div className="p-5 border-b border-app-border">
      {/* 合并标题 */}
      <div className="font-app-bold text-[14px] uppercase tracking-widest mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        Season {seasonNumber} Prize Pool
      </div>
      
      <div className="mb-6">
        <div className="text-[28px] font-app-bold text-app-accent leading-none mb-1">{seasonPool.toFixed(0)} MON</div>
        <div className="text-[10px] text-app-muted font-app-mono italic">
          10% of every round · airdropped to {SEASON_CONFIG.SEASON_KILL_THRESHOLD}+ kill players
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-[9px] text-app-muted uppercase font-app-bold tracking-widest mb-1">Ends In</div>
          <div className="text-[14px] font-app-bold text-white uppercase tracking-tight">{formatDuration(seasonEndsIn)}</div>
        </div>
        <div>
          <div className="text-[9px] text-app-muted uppercase font-app-bold tracking-widest mb-1">Rounds Played</div>
          <div className="text-[14px] font-app-bold text-white uppercase tracking-tight">{totalRoundsPlayed}</div>
        </div>
      </div>

      <div className="text-[8px] text-app-muted font-app-mono uppercase tracking-wider border-t border-[#1a1a1a] pt-3 leading-relaxed">
        AIRDROP: {SEASON_CONFIG.SEASON_KILL_THRESHOLD}+ KILLS TO QUALIFY · SPLIT BY KILL SHARE AT SEASON END
      </div>
    </div>
  );
}

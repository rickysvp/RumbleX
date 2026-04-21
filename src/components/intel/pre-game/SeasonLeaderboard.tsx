import React from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useWalletStore } from '../../../store/walletStore';

export function SeasonLeaderboard() {
  const leaderboard = useGameStore(state => state.leaderboard || []);
  const { status: walletStatus } = useWalletStore();
  const top5 = leaderboard.slice(0, 5);
  
  const isConnected = walletStatus === "connected";

  return (
    <div className="p-4 border-b border-app-border">
      <div className="flex justify-between items-center mb-4">
        <div className="font-app-bold text-[14px] uppercase tracking-wide flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Leaderboard
        </div>
        <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-wide">Top 5</div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[28px_1fr_50px_70px] gap-2 text-[9px] text-app-muted uppercase font-app-bold tracking-wide mb-2 px-1">
        <div>#</div>
        <div>Player</div>
        <div className="text-right">Kills</div>
        <div className="text-right">MON</div>
      </div>

      {top5.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center border border-dashed border-[#222] bg-[#050505]">
          <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-[3px] mb-2 opacity-50">Season just started</div>
          <div className="text-[9px] text-[#444] font-app-bold uppercase">First blood await...</div>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {top5.map((p, i) => (
            <div 
              key={p.handle}
              className="grid grid-cols-[28px_1fr_50px_70px] gap-2 items-center py-1.5 px-1 transition-colors hover:bg-white/[0.02]"
            >
              {/* Rank */}
              <div className={`font-app-bold text-[11px] ${i === 0 ? 'text-app-accent' : 'text-white'}`}>
                {i + 1}
              </div>
              
              {/* Player Name - with more space */}
              <div className="font-app-bold text-[11px] truncate text-app-muted" title={p.handle}>
                {p.handle}
              </div>
              
              {/* Kills */}
              <div className="text-right font-app-bold text-[11px] text-white tabular-nums">
                {p.kills}
              </div>
              
              {/* Rewards - compact format */}
              <div className="text-right font-app-bold text-[10px] text-app-accent tabular-nums">
                {p.estimatedPayout >= 1000 
                  ? `${(p.estimatedPayout / 1000).toFixed(1)}K` 
                  : p.estimatedPayout.toFixed(0)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

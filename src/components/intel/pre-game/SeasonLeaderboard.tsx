import React from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useWalletStore } from '../../../store/walletStore';
import { SEASON_CONFIG } from '../../../lib/seasonConfig';

export function SeasonLeaderboard() {
  const leaderboard = useGameStore(state => state.leaderboard || []);
  const { status: walletStatus } = useWalletStore();
  const top5 = leaderboard.slice(0, 5);
  const userEntry = leaderboard.find(e => e.isUser);
  const userRank = leaderboard.findIndex(e => e.isUser) + 1;
  const isInTop5 = userRank > 0 && userRank <= 5;
  
  const threshold = SEASON_CONFIG.SEASON_KILL_THRESHOLD;
  const isConnected = walletStatus === "connected";

  return (
    <div className="p-5 border-b border-app-border">
      <div className="flex justify-between items-center mb-5">
        <div className="font-app-bold text-[14px] uppercase tracking-wide flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Leaderboard
        </div>
        <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-wide">Top 5</div>
      </div>

      <div className="grid grid-cols-[30px_1fr_45px_75px] gap-2 text-[9px] text-app-muted uppercase font-app-bold tracking-wide mb-3 px-2">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Kills</div>
        <div className="text-right">REWARDS</div>
      </div>

        {top5.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[#222] bg-[#050505]">
            <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-[3px] mb-2 opacity-50">Season just started</div>
            <div className="text-[9px] text-[#444] font-app-bold uppercase">First blood await...</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {top5.map((p, i) => (
              <div 
                key={p.handle}
                className={`grid grid-cols-[30px_1fr_45px_75px] gap-2 items-center py-2 px-2 transition-colors ${
                  isConnected && p.isUser ? 'bg-app-accent/5 border border-app-accent/20 rounded-sm' : ''
                }`}
              >
                <div className={`font-app-bold text-[11px] ${i === 0 ? 'text-app-accent' : 'text-white'}`}>#{i + 1}</div>
                <div className={`font-app-bold text-[11px] truncate flex flex-wrap items-center gap-1.5 ${isConnected && p.isUser ? 'text-white' : 'text-app-muted'}`}>
                  <span>{isConnected && p.isUser ? '★ ' : ''}{p.handle}</span>
                  {isConnected && !p.qualified && (
                    <span className="text-[7px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded-[1px] tracking-tight border border-red-500/30">NOT QUALIFIED</span>
                  )}
                </div>
                <div className="text-right font-app-bold text-[11px] text-white">{p.kills}</div>
                <div className="text-right font-app-bold text-[10px] text-app-accent">
                  {p.estimatedPayout.toFixed(0)} MON
                </div>
              </div>
            ))}

            {/* 用户不在前5时的位置显示 - 只在登录后显示 */}
            {isConnected && !isInTop5 && userEntry && (
              <>
                <div className="text-center py-1 text-app-muted tracking-[4px]">---</div>
                <div className="grid grid-cols-[30px_1fr_45px_75px] gap-2 items-center py-2 px-2 bg-app-accent/5 border border-app-accent/20 rounded-sm">
                    <div className="font-app-bold text-[11px] text-[#999]">#{userRank}</div>
                    <div className="font-app-bold text-[11px] text-white flex items-center gap-1.5">
                      <span>★ {userEntry.handle}</span>
                      {!userEntry.qualified && (
                        <span className="text-[7px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded-[1px] tracking-tight border border-red-500/30">NOT QUALIFIED</span>
                      )}
                    </div>
                    <div className="text-right font-app-bold text-[11px] text-white">{userEntry.kills}</div>
                    <div className="text-right font-app-bold text-[10px] text-app-accent">
                      {userEntry.estimatedPayout.toFixed(0)} MON
                    </div>
                </div>
              </>
            )}
            
            {/* User Qualification Progress Bar - 只在登录后显示 */}
            {isConnected && userEntry && !userEntry.qualified && (
              <div className="mt-6 px-1">
                 <div className="flex justify-between items-end mb-2">
                   <div className="text-[9px] font-app-bold text-white uppercase tracking-wide">
                     ★ {userEntry.handle}: {userEntry.kills} / {threshold} Kills
                   </div>
                   <div className="text-[8px] font-app-bold text-app-muted uppercase">
                     {threshold - userEntry.kills} TO QUALIFY
                   </div>
                 </div>
                 <div className="h-1.5 bg-black border border-[#222] rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-app-accent transition-all duration-500 ease-out shadow-[0_0_8px_rgba(217,255,0,0.4)]"
                     style={{ width: `${Math.min((userEntry.kills / threshold) * 100, 100)}%` }}
                   />
                 </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

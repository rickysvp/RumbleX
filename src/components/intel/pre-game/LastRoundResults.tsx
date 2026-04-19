import React from 'react';
import { useGameStore } from '../../../store/gameStore';

export function LastRoundResults() {
  const lastRoundResult = useGameStore(state => state.lastRoundResult);

  if (!lastRoundResult) {
    return (
      <div className="p-5 border-b border-app-border">
         <div className="font-app-bold text-[14px] uppercase tracking-widest mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Last Round Results
        </div>
        <div className="text-[10px] font-app-mono text-app-muted italic p-2">Waiting for first round...</div>
      </div>
    );
  }

  return (
    <div className="p-5 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-widest mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        Round #{lastRoundResult.roundNumber} Results
      </div>

      <div className="bg-[#111] border border-[#222] p-4 mb-5 relative rounded-sm">
        <div className="text-[9px] text-app-muted uppercase font-app-bold tracking-widest mb-1">Champion</div>
        <div className="text-[18px] font-app-bold text-app-accent leading-none mb-1">
          ★★ {lastRoundResult.champion}
        </div>
        <div className="text-[10px] text-app-accent/80 font-app-mono uppercase tracking-tight">
          +{lastRoundResult.championMon.toFixed(1)} MON Cashed Out
        </div>
      </div>

      <div className="grid grid-cols-[30px_1fr_70px] gap-2 text-[8px] text-app-muted uppercase font-app-bold tracking-widest mb-2 px-2">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Payout</div>
      </div>

      <div className="flex flex-col gap-0.5">
         {lastRoundResult.payouts.map((row, i) => (
           <div key={i} className="grid grid-cols-[30px_1fr_70px] gap-2 items-center py-1.5 px-2 text-[10px] font-app-mono">
             <div className="text-app-muted">#{row.place}</div>
             <div className="text-white truncate">{row.handle}</div>
             <div className={`text-right ${i === 0 ? 'text-app-accent' : 'text-white'}`}>{row.mon.toFixed(2)} MON</div>
           </div>
         ))}
      </div>

      {/* Protocol / Season Cuts Summary */}
      <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-col gap-2">
          <div className="flex justify-between text-[9px] font-app-mono text-app-muted uppercase">
             <span>Season Pool +</span>
             <span className="text-white">{(lastRoundResult.totalVolume * 0.05).toFixed(2)} MON</span>
          </div>
          <div className="flex justify-between text-[9px] font-app-mono text-app-muted uppercase">
             <span>Protocol Vault +</span>
             <span className="text-white">{(lastRoundResult.totalVolume * 0.05).toFixed(2)} MON</span>
          </div>
      </div>
    </div>
  );
}

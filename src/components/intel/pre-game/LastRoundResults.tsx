import React from 'react';
import { useGameStore } from '../../../store/gameStore';

export function LastRoundResults() {
  const lastRoundResult = useGameStore(state => state.lastRoundResult);
  const roundNumber = useGameStore(state => state.roundNumber);

  if (!lastRoundResult) {
    return (
      <div className="p-5 border-b border-app-border">
         <div className="font-app-bold text-[14px] uppercase tracking-wide mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Last Round Results
        </div>
        <div className="text-[10px] font-app-bold text-app-muted italic p-2">Waiting for first round...</div>
      </div>
    );
  }

  const { 
    survivors = [], 
    topFrag = null, 
    biggestStack = null, 
    totalEliminations = 0, 
    totalVolume = 0, 
    roundNumber: lastRoundNum = 0 
  } = lastRoundResult || {};

  return (
    <div className="p-5 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-wide mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        Round #{lastRoundNum} Closed
      </div>

      {/* 统计信息 */}
      <div className="flex flex-col gap-2 mb-4 px-2 border-l-2 border-app-accent/30 pl-3">
        <div className="flex justify-between items-center">
            <div className="text-[10px] text-app-muted uppercase tracking-wider">Survivors</div>
            <div className="text-[12px] text-white font-app-bold">{survivors.length}</div>
        </div>
        <div className="flex justify-between items-center">
            <div className="text-[10px] text-app-muted uppercase tracking-wider">Total Eliminations</div>
            <div className="text-[12px] text-red-500 font-app-bold">{totalEliminations}</div>
        </div>
        <div className="flex justify-between items-center">
            <div className="text-[10px] text-app-muted uppercase tracking-wider">Stack Volume</div>
            <div className="text-[12px] text-app-accent font-app-bold">{totalVolume.toFixed(1)} MON</div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="bg-[#151515] p-2 border border-white/5">
            <div className="text-[8px] text-app-muted uppercase mb-1">Top Frag</div>
            <div className="text-[11px] text-cyan-400 font-app-bold truncate">{topFrag?.handle || '—'}</div>
            <div className="text-[9px] text-[#666]">{topFrag?.kills || 0} Kills</div>
        </div>
        <div className="bg-[#151515] p-2 border border-white/5">
            <div className="text-[8px] text-app-muted uppercase mb-1">Biggest Stack</div>
            <div className="text-[11px] text-app-accent font-app-bold truncate">{biggestStack?.handle || '—'}</div>
            <div className="text-[9px] text-[#666]">{biggestStack?.mon.toFixed(1) || 0} MON</div>
        </div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[1fr_50px_70px] gap-2 text-[8px] text-app-muted uppercase font-app-bold tracking-wide mb-2 px-2">
        <div>Survivor</div>
        <div className="text-right">Kills</div>
        <div className="text-right">Stack</div>
      </div>

      {/* 存活榜单 */}
      <div className="flex flex-col gap-0.5 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
         {survivors.map((row, i) => (
           <div 
             key={i} 
             className={`grid grid-cols-[1fr_50px_70px] gap-2 items-center py-1.5 px-2 text-[10px] font-app-bold border-b border-white/5 ${
               row.isUser ? 'bg-app-accent/10' : ''
             }`}
           >
             <div className={row.isUser ? 'text-app-accent' : 'text-white'}>{row.handle}</div>
             <div className="text-right text-[#666]">{row.kills || 0}K</div>
             <div className="text-right text-white italic">{row.mon.toFixed(1)} MON</div>
           </div>
         ))}
      </div>
    </div>
  );
}

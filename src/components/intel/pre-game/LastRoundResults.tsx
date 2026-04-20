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

  // 显示所有存活玩家，按收益排序
  const survivors = lastRoundResult.payouts
    .filter(p => p.mon > 0)
    .sort((a, b) => b.mon - a.mon);

  return (
    <div className="p-5 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-wide mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        Round #{lastRoundResult.roundNumber} Results
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="text-[10px] text-app-muted uppercase">{survivors.length} Survivors</div>
        <div className="text-[10px] text-app-accent font-app-bold">{lastRoundResult.totalVolume.toFixed(1)} MON</div>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[30px_1fr_50px_70px] gap-2 text-[8px] text-app-muted uppercase font-app-bold tracking-wide mb-2 px-2">
        <div>Rank</div>
        <div>Player</div>
        <div className="text-right">Kills</div>
        <div className="text-right">Earned</div>
      </div>

      {/* 存活榜单 */}
      <div className="flex flex-col gap-0.5">
         {survivors.map((row, i) => (
           <div 
             key={i} 
             className={`grid grid-cols-[30px_1fr_50px_70px] gap-2 items-center py-1.5 px-2 text-[10px] font-app-bold ${
               i === 0 ? 'bg-app-accent/10 border border-app-accent/20' : ''
             }`}
           >
             <div className={i === 0 ? 'text-app-accent' : 'text-app-muted'}>#{i + 1}</div>
             <div className="text-white truncate">{row.handle}</div>
             <div className="text-right text-[#666]">{row.kills || 0}K</div>
             <div className={`text-right ${i === 0 ? 'text-app-accent' : 'text-white'}`}>{row.mon.toFixed(1)} MON</div>
           </div>
         ))}
      </div>
    </div>
  );
}

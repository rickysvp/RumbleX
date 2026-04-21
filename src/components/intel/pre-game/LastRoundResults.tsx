import React from 'react';
import { useGameStore } from '../../../store/gameStore';

export function LastRoundResults() {
  const lastRoundResult = useGameStore(state => state.lastRoundResult);

  if (!lastRoundResult) {
    return (
      <div className="p-4 border-b border-app-border">
         <div className="font-app-bold text-[14px] uppercase tracking-wide mb-3 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Last Round Results
        </div>
        <div className="text-[10px] font-app-bold text-app-muted italic p-2">Waiting for first round...</div>
      </div>
    );
  }

  const { 
    survivors = [], 
    totalParticipants = 0,
    totalVolume = 0
  } = lastRoundResult || {};

  return (
    <div className="p-4 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-wide mb-4 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        Last Round Results
      </div>

      {/* Core Stats - Large Numbers */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-[24px] font-app-bold text-white leading-none mb-1">{totalParticipants}</div>
          <div className="text-[9px] text-app-muted uppercase tracking-wide">Joined</div>
        </div>
        <div className="text-center">
          <div className="text-[24px] font-app-bold text-app-accent leading-none mb-1">{totalVolume.toFixed(0)}</div>
          <div className="text-[9px] text-app-muted uppercase tracking-wide">MON Pool</div>
        </div>
        <div className="text-center">
          <div className="text-[24px] font-app-bold text-white leading-none mb-1">{survivors.length}</div>
          <div className="text-[9px] text-app-muted uppercase tracking-wide">Survivors</div>
        </div>
      </div>

      {/* Survivor List */}
      <div className="border-t border-[#222] pt-3">
        <div className="text-[9px] text-app-muted uppercase mb-2">Survivors ({survivors.length})</div>
        <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
          {survivors.slice(0, 5).map((row, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between py-2 px-2 bg-[#111] border border-[#222]"
            >
              <span className="text-white text-[11px] font-app-bold truncate flex-1">{row.handle}</span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-[#666]">{row.kills} Kills</span>
                <span className="text-[11px] text-app-accent font-app-bold">{row.mon.toFixed(1)} MON</span>
              </div>
            </div>
          ))}
          {survivors.length > 5 && (
            <div className="text-center text-[9px] text-app-muted py-2">+{survivors.length - 5} more survivors</div>
          )}
        </div>
      </div>
    </div>
  );
}

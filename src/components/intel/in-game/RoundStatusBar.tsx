import React from 'react';
import { useGameStore } from '../../../store/gameStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function RoundStatusBar() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const timeRemaining = useGameStore(state => state.timeRemaining);

  return (
    <div className="sticky top-0 z-20 bg-[#0A0A0A] border-b border-app-border px-5 py-3 flex justify-between items-center shrink-0">
      <div className="font-app-bold text-[13px] text-white uppercase tracking-widest">
        Round #{roundNumber}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-app-accent rounded-full animate-pulse"></div>
        <div className="font-app-bold text-[11px] text-app-accent uppercase tracking-widest">Live</div>
      </div>

      <div className="font-app-mono text-[18px] text-app-accent tabular-nums leading-none">
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
}

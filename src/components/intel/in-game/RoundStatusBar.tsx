import React from 'react';
import { useGameStore } from '../../../store/gameStore';

export function RoundStatusBar() {
  const roundNumber = useGameStore(state => state.roundNumber);

  return (
    <div className="sticky top-0 z-20 bg-[#0A0A0A] border-b border-app-border px-5 py-3 flex justify-center items-center shrink-0">
      <div className="font-app-bold text-[13px] text-white uppercase tracking-wide">
        Round #{roundNumber}
      </div>
    </div>
  );
}

import React from 'react';
import { EntryOpenStage } from './EntryOpenStage';
import { LiveStage } from './LiveStage';
import { ConcludedStage } from './ConcludedStage';
import { useGameStore } from '../../store/gameStore';

export function RoundStage() {
  const phase = useGameStore(state => state.phase);

  return (
    <div className="w-full h-full bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)] opacity-60" />
      </div>

      <div className="relative z-10 h-full w-full">
        {phase === 'entry_open' && (
          <EntryOpenStage />
        )}
        {phase === 'live' && (
          <LiveStage />
        )}
        {phase === 'concluded' && (
          <ConcludedStage />
        )}
      </div>
    </div>
  );
}

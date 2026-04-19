import React from 'react';
import { RoundStatusBar } from './in-game/RoundStatusBar';
import { KillBoard } from './in-game/KillBoard';
import { KillLog } from './in-game/KillLog';
import { useGameStore } from '../../store/gameStore';

export function InGamePanel() {
  const phase = useGameStore(state => state.phase);
  if (phase !== 'live') return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <RoundStatusBar />
      <KillBoard />
      <KillLog />
    </div>
  );
}

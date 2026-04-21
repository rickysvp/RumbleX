import React from 'react';
import { SeasonInfo } from './pre-game/SeasonInfo';
import { SeasonLeaderboard } from './pre-game/SeasonLeaderboard';
import { LastRoundResults } from './pre-game/LastRoundResults';

export function PreGamePanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <SeasonInfo />
      <SeasonLeaderboard />
      <LastRoundResults />
    </div>
  );
}

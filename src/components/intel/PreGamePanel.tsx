import React from 'react';
import { SeasonInfo } from './pre-game/SeasonInfo';
import { SeasonLeaderboard } from './pre-game/SeasonLeaderboard';
import { LastRoundResults } from './pre-game/LastRoundResults';
import { MyHistory } from './pre-game/MyHistory';

export function PreGamePanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <SeasonInfo />
      <SeasonLeaderboard />
      <LastRoundResults />
      <MyHistory />
    </div>
  );
}

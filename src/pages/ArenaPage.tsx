import React from 'react';
import { RoundStage } from '../components/arena/RoundStage';
import { MixedFeed } from '../components/feed/MixedFeed';

export function ArenaPage() {
  return (
    <div className="h-full w-full flex flex-col bg-[#0D0D0D]">
      {/* Arena Stage - Top Section */}
      <div className="shrink-0 h-[45%] min-h-[300px] max-h-[450px]">
        <RoundStage />
      </div>
      
      {/* Divider */}
      <div className="h-px w-full bg-app-border shrink-0" />
      
      {/* Feed - Bottom Section */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <MixedFeed />
      </div>
    </div>
  );
}

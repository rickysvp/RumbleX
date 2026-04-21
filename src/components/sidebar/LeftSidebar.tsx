import React from 'react';
import { UserBlock } from './UserBlock';
import { ChannelNav } from './ChannelNav';

export function LeftSidebar() {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] w-full border-r border-app-border">
      <div className="px-6 py-[25px] border-b border-app-border shrink-0">
        <img src="/rumblex.png" alt="RumbleX" className="h-8 object-contain" />
      </div>
      <UserBlock />
      <ChannelNav />
    </div>
  );
}

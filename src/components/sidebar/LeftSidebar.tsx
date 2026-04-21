import React from 'react';
import { ChannelNav } from './ChannelNav';

interface LeftSidebarProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export function LeftSidebar({ onNavigate, currentView = 'arena' }: LeftSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] w-full border-r border-app-border">
      <ChannelNav onNavigate={onNavigate} currentView={currentView} />
    </div>
  );
}

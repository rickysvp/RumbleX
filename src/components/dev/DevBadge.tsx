import React from 'react';
import { useDevStore } from '../../store/devStore';

export function DevBadge() {
  const togglePanel = useDevStore(state => state.togglePanel);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <button
      onClick={togglePanel}
      className="fixed bottom-3 left-3 z-[9999] bg-[#111] border border-[#333] px-2 py-1 flex items-center gap-2 group hover:border-app-accent transition-colors"
    >
      <div className="w-1.5 h-1.5 bg-app-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(217,255,0,0.5)]"></div>
      <span className="text-[9px] font-app-bold text-app-muted uppercase tracking-[2px] group-hover:text-white">Dev Mode</span>
    </button>
  );
}

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FeedRow } from './FeedRow';
import { useGameStore } from '../../store/gameStore';
import { useVirtualizer } from '@tanstack/react-virtual';

interface MixedFeedProps {
  eventsEndRef: React.RefObject<HTMLDivElement>;
}

export function MixedFeed() {
  const [activeTab, setActiveTab] = useState('ALL');
  const feedEvents = useGameStore(state => state.feedEvents || []);
  const parentRef = useRef<HTMLDivElement>(null);

  const tabs = ['ALL', 'COMBAT', 'SYSTEM'];

  const filteredEvents = useMemo(() => {
    return feedEvents.filter(ev => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'COMBAT') return ev.type === 'elim' || ev.type === 'loot' || ev.type === 'ability';
      if (activeTab === 'SYSTEM') return ev.type === 'system';
      return true;
    });
  }, [feedEvents, activeTab]);

  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  // Auto-scroll logic
  useEffect(() => {
    if (filteredEvents.length > 0) {
      virtualizer.scrollToIndex(filteredEvents.length - 1, { align: 'end', behavior: 'smooth' });
    }
  }, [filteredEvents.length, virtualizer]);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0D0D0D]">
      {/* Header */}
      <div className="px-5 md:px-[30px] pt-4 pb-0 border-b border-app-border flex justify-between items-end shrink-0 bg-[#0D0D0D] z-10 w-full relative">
        <div className="font-app-bold tracking-widest text-app-muted uppercase text-[12px] pb-4 flex items-center gap-2">
          <span className="text-app-accent">■</span> ARENA FEED
        </div>
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[11px] font-app-mono uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-app-accent text-app-accent' 
                  : 'border-transparent text-app-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto pb-4 custom-scrollbar relative"
      >
        {filteredEvents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-app-muted text-[11px] font-app-mono uppercase tracking-[3px] opacity-50">
             ARENA IS QUIET. FOR NOW.
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <FeedRow event={filteredEvents[virtualRow.index]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-app-border bg-[#0a0a0a] shrink-0">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted font-app-bold text-[14px]">›</div>
          <input 
            type="text" 
            placeholder="TRANSMIT COMM..."
            className="w-full bg-[#111] border border-[#333] text-white py-3 pl-8 pr-4 font-app-mono text-[13px] focus:outline-none focus:border-app-accent"
          />
        </div>
      </div>
    </div>
  );
}

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

  // Get player handles and user handle once at the parent level
  const players = useGameStore(state => state.players);
  const userHandle = useGameStore(state => state.userHandle);
  
  // Memoize player handles to prevent unnecessary re-renders
  const playerHandles = useMemo(() => players.map(p => p.handle), [players]);

  const tabs = ['ALL', 'BATTLE', 'CHAT'];

  const filteredEvents = useMemo(() => {
    return feedEvents.filter(ev => {
      if (activeTab === 'ALL') return true;
      if (activeTab === 'BATTLE') return ev.type === 'elim' || ev.type === 'loot' || ev.type === 'ability';
      if (activeTab === 'CHAT') return ev.type === 'chat';
      return true;
    });
  }, [feedEvents, activeTab]);

  const virtualizer = useVirtualizer({
    count: filteredEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 45,
    overscan: 10,
  });

  // Auto-scroll logic - only scroll when new events are added
  const prevLengthRef = useRef(filteredEvents.length);
  useEffect(() => {
    if (filteredEvents.length > prevLengthRef.current) {
      virtualizer.scrollToIndex(filteredEvents.length - 1, { align: 'end' });
    }
    prevLengthRef.current = filteredEvents.length;
  }, [filteredEvents.length, virtualizer]);

  const [message, setMessage] = useState('');
  const addFeedEvent = useGameStore(state => state.addFeedEvent);
  const timeRemaining = useGameStore(state => state.timeRemaining);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const phase = useGameStore.getState().phase;
    const currentTimestamp = phase === 'live' 
      ? (600 - timeRemaining) 
      : phase === 'entry_open' 
        ? (300 - timeRemaining) 
        : 600;

    addFeedEvent({
      timestamp: currentTimestamp,
      type: 'chat',
      text: message.trim(),
      attacker: userHandle,
      target: null,
      monAmount: null,
      skillUsed: null,
      itemUsed: null
    });
    
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0D0D0D] relative">
      {/* Header */}
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-0 border-b border-app-border flex justify-between items-end shrink-0 bg-[#0D0D0D] z-10">
        <div className="font-app-bold tracking-widest text-app-muted uppercase text-[11px] sm:text-[12px] pb-3 flex items-center gap-2">
          <span className="text-app-accent">■</span> ARENA FEED
        </div>
        <div className="flex gap-4 sm:gap-6">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[10px] sm:text-[11px] font-app-mono uppercase tracking-widest border-b-2 transition-colors ${
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
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{ paddingBottom: '120px' }}
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-app-muted text-[11px] font-app-mono uppercase tracking-[3px] opacity-50">
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
                <FeedRow 
                  event={filteredEvents[virtualRow.index]} 
                  playerHandles={playerHandles}
                  userHandle={userHandle}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-app-border bg-[#0a0a0a] z-30">
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted font-app-bold text-[12px]">›</div>
          <input 
            type="text" 
            placeholder="TRANSMIT COMM..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#111] border border-[#333] text-white py-2.5 pl-7 pr-3 text-[12px] focus:outline-none focus:border-app-accent placeholder:text-neutral-700"
          />
        </div>
      </div>
    </div>
  );
}

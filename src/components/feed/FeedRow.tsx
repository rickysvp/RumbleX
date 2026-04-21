import React from 'react';
import { FeedEvent } from '../../store/types';
import { useGameStore } from '../../store/gameStore';

interface FeedRowProps {
  event: FeedEvent;
}

export const FeedRow = React.memo(({ event }: FeedRowProps) => {
  const userHandle = useGameStore(state => state.userHandle);

  // Get all player handles from the game state for highlighting
  const playerHandles = useGameStore(state => state.players.map(p => p.handle));

  // Specialized renderer for System Logs (Dynamic, Less Aggressive)
  const renderSystemNarrative = (text: string) => {
    if (!text) return null;

    // Build a regex pattern that matches all player handles (escape special regex chars)
    const handlePattern = playerHandles
      .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    // Split by: Round #IDs, Numbers with decimals, MON, or player handles
    const splitRegex = new RegExp(`(#\\d+|\\b\\d+\\.?\\d*(?:\\s?MON)?\\b|${handlePattern})`, 'g');
    let parts = text.split(splitRegex);

    return parts.map((part, i) => {
      if (!part) return null;

      if (part.match(/^#\d+$/)) {
        return <span key={i} className="text-white font-app-bold tracking-wider mx-0.5 sm:mx-1 bg-white/10 px-1 py-0.5 rounded text-[11px] sm:text-[13px]">{part}</span>;
      }
      if (part.match(/^\d+\.?\d*$/)) {
        return <span key={i} className="text-app-accent font-app-bold mx-0.5 sm:mx-1 bg-app-accent/10 px-1 py-0.5 rounded text-[11px] sm:text-[13px]">{part}</span>;
      }
      if (part.match(/MON/)) {
        return <span key={i} className="text-app-accent font-app-bold mx-0.5 sm:mx-1 text-[11px] sm:text-[13px]">{part}</span>;
      }
      // Highlight player handles - current user gets accent color, others get white
      if (playerHandles.includes(part)) {
        const isCurrentUser = part === userHandle;
        return <span key={i} className={`${isCurrentUser ? 'text-app-accent' : 'text-white'} font-app-bold mx-0.5 sm:mx-1 bg-white/10 px-1 py-0.5 rounded text-[11px] sm:text-[13px]`}>{part}</span>;
      }
      return <span key={i} className="text-app-muted text-[11px] sm:text-[13px]">{part}</span>;
    });
  };

  const renderCombatNarrative = (text: string) => {
    if (!text) return null;

    // Build a regex pattern that matches all player handles
    const handlePattern = playerHandles
      .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    // Split by MON amounts or player handles
    const monRegex = /([\d.]+ MON)/g;
    let parts = text.split(monRegex);

    return parts.flatMap((part, i) => {
      if (part.match(/[\d.]+ MON/)) {
        return <span key={`mon-${i}`} className="text-app-accent font-bold mx-0.5 sm:mx-1 bg-app-accent/10 px-1 py-0.5 rounded text-[11px] sm:text-[13px]">{part}</span>;
      }

      // Split remaining parts by player handles
      const handleRegex = new RegExp(`(${handlePattern})`, 'g');
      let handleParts = part.split(handleRegex);

      return handleParts.map((hp, j) => {
        if (playerHandles.includes(hp)) {
          const isCurrentUser = hp === userHandle;
          return (
            <span key={`h-${i}-${j}`} className={`${isCurrentUser ? 'text-app-accent font-app-bold' : 'text-white'} font-bold mx-0.5 sm:mx-1 bg-white/5 px-1 py-0.5 rounded text-[11px] sm:text-[13px]`}>
              {hp}
            </span>
          );
        }
        return hp;
      });
    });
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  const timeString = formatSeconds(event.timestamp);
  const timeDisplay = `[${timeString}]`;

  // Standard Header for Time Metadata
  const TimeColumn = ({ type }: { type?: string }) => (
    <div className="shrink-0 w-[70px] sm:w-[100px] flex flex-col justify-center relative z-10 font-app-mono">
      {type === 'system' && (
        <span className="text-app-accent/80 text-[6px] sm:text-[7px] font-app-bold tracking-[0.2em] uppercase mb-0.5 leading-none">
          SYSTEM_LOG
        </span>
      )}
      <span className={`${type === 'system' ? 'text-[10px] sm:text-[11px] text-[#555]' : 'text-[11px] sm:text-[13px] text-[#444]'} leading-none`}>
        {timeDisplay}
      </span>
    </div>
  );

  // CHAT BRANCH
  if (event.type === 'chat') {
    const isCurrentUser = event.attacker === userHandle;
    return (
      <div className="px-3 sm:px-5 py-2.5 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] animate-row-in">
        <div className="flex gap-2 sm:gap-4">
          <TimeColumn />
          <div className="flex-1 min-w-0">
            <span className={`${isCurrentUser ? 'text-app-accent' : 'text-cyan-400'} font-app-bold text-[12px] sm:text-[13px]`}>
              {event.attacker || 'ANON'}
            </span>
            <span className="text-white/80 text-[12px] sm:text-[13px] ml-2 break-words">{event.text}</span>
          </div>
        </div>
      </div>
    );
  }

  // SYSTEM BRANCH
  if (event.type === 'system') {
    return (
      <div className="px-3 sm:px-5 py-3 border-b border-white/[0.03] bg-app-accent/5 relative group animate-row-in">
        <div className="flex gap-2 sm:gap-4">
          <TimeColumn type="system" />
          <div className="flex-1 relative z-10 italic min-w-0">
            {renderSystemNarrative(event.text)}
          </div>
        </div>
      </div>
    );
  }

  // COMBAT BRANCH (ELIM, LOOT, ABILITY)
  return (
    <div className={`px-3 sm:px-5 py-2.5 border-b border-white/[0.03] transition-colors animate-row-in ${
      event.type === 'elim'
        ? 'animate-flash-danger bg-red-500/5'
        : 'hover:bg-white/[0.02]'
    }`}>
      <div className="flex gap-2 sm:gap-4">
        <TimeColumn />
        <div className="text-white/90 flex-1 min-w-0 text-[12px] sm:text-[13px]">{renderCombatNarrative(event.text)}</div>
      </div>
    </div>
  );
});

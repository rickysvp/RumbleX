import React from 'react';
import { FeedEvent } from '../../store/types';

interface FeedRowProps {
  event: FeedEvent;
  playerHandles: string[];
  userHandle: string;
}

// Build regex patterns outside component to avoid recreating on every render
const buildHandlePattern = (handles: string[]): string => {
  if (handles.length === 0) return '';
  return handles
    .map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
};

export const FeedRow = React.memo(({ event, playerHandles, userHandle }: FeedRowProps) => {
  // Build pattern once per render (handles are memoized by parent)
  const handlePattern = buildHandlePattern(playerHandles);

  // Specialized renderer for System Logs (Dynamic, Less Aggressive)
  const renderSystemNarrative = (text: string) => {
    if (!text || !handlePattern) return <span className="text-app-muted text-[11px] sm:text-[13px]">{text}</span>;

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
    if (!text || !handlePattern) return <span className="text-white/90 text-[12px] sm:text-[13px]">{text}</span>;

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
        return <span key={`h-${i}-${j}`} className="text-white/90">{hp}</span>;
      });
    });
  };

  // Format current real time as HH:MM:SS
  const now = new Date();
  const timeDisplay = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  // Time display component - positioned at the right
  const TimeDisplay = ({ type }: { type?: string }) => (
    <span className={`shrink-0 font-app-mono ${type === 'system' ? 'text-[10px] sm:text-[11px] text-[#555]' : 'text-[11px] sm:text-[13px] text-[#444]'} leading-none`}>
      {timeDisplay}
    </span>
  );

  // CHAT BRANCH
  if (event.type === 'chat') {
    const isCurrentUser = event.attacker === userHandle;
    return (
      <div className="px-3 sm:px-5 py-2.5 border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] animate-row-in">
        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="flex-1 min-w-0">
            <span className={`${isCurrentUser ? 'text-app-accent' : 'text-cyan-400'} font-app-bold text-[12px] sm:text-[13px]`}>
              {event.attacker || 'ANON'}
            </span>
            <span className="text-white/80 text-[12px] sm:text-[13px] ml-2 break-words">{event.text}</span>
          </div>
          <TimeDisplay />
        </div>
      </div>
    );
  }

  // SYSTEM BRANCH
  if (event.type === 'system') {
    return (
      <div className="px-3 sm:px-5 py-3 border-b border-white/[0.03] bg-app-accent/5 relative group animate-row-in border-l-2 border-l-app-accent/30">
        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="flex-1 relative z-10 italic min-w-0">
            {renderSystemNarrative(event.text)}
          </div>
          <TimeDisplay type="system" />
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
      <div className="flex gap-2 sm:gap-4 items-center">
        <div className="text-white/90 flex-1 min-w-0 text-[12px] sm:text-[13px]">{renderCombatNarrative(event.text)}</div>
        <TimeDisplay />
      </div>
    </div>
  );
});

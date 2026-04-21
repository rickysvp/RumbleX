import React from 'react';
import { FeedEvent } from '../../store/types';

interface FeedRowProps {
  event: FeedEvent;
}

export const FeedRow = React.memo(({ event }: FeedRowProps) => {
  // Specialized renderer for System Logs (Dynamic, Less Aggressive)
  const renderSystemNarrative = (text: string) => {
    if (!text) return null;
    
    // Highlight Round #IDs, Numbers with decimals, and MON specifically
    // Uses word boundaries (\b) to avoid catching surrounding punctuation
    let parts = text.split(/(#\d+|\b\d+\.?\d*(?:\s?MON)?\b)/g);
    
    return parts.map((part, i) => {
      if (!part) return null;

      if (part.match(/^#\d+$/)) {
        return <span key={i} className="text-white font-app-bold tracking-wider mx-1 bg-white/10 px-1.5 py-0.5 rounded">{part}</span>;
      }
      if (part.match(/^\d+\.?\d*$/)) {
        return <span key={i} className="text-app-accent font-app-bold mx-1 bg-app-accent/10 px-1.5 py-0.5 rounded">{part}</span>;
      }
      if (part.match(/MON/)) {
        return <span key={i} className="text-app-accent font-app-bold mx-1">{part}</span>;
      }
      return <span key={i} className="text-app-muted">{part}</span>;
    });
  };

  const renderCombatNarrative = (text: string) => {
    if (!text) return null;
    
    // Legacy logic for combat that highlights MON
    let parts = text.split(/([\d.]+ MON)/g);
    
    return parts.flatMap((part, i) => {
      if (part.match(/[\d.]+ MON/)) {
        return <span key={`mon-${i}`} className="text-app-accent font-bold mx-1 bg-app-accent/10 px-1.5 py-0.5 rounded">{part}</span>;
      }
      
      // Look for specific handles (UPPER_CASE or CamelCase)
      let handleParts = part.split(/(\[?[A-Z][a-zA-Z0-9_]{3,}\]?)/g);
      return handleParts.map((hp, j) => {
        // Only highlight if it looks like a known format and NOT common words like ROUND, OPEN, etc.
        // We'll use a blacklist or just be more restrictive
        const commonWords = ['ROUND', 'OPEN', 'ENTRY', 'FINAL', 'CALL', 'REMAIN', 'SCALE', 'LATE', 'TOTAL'];
        const isCommon = commonWords.includes(hp.replace(/[\[\]]/g, ''));
        
        if (hp.match(/^\[?[A-Z][a-zA-Z0-9_]{3,}\]?$/) && !hp.includes('MON') && !isCommon) {
          const isUser = hp.includes('PILOT_01');
          return (
            <span key={`h-${i}-${j}`} className={`${isUser ? 'text-app-accent font-app-bold' : 'text-cyan-400'} font-bold mx-1 bg-white/5 px-1.5 py-0.5 rounded`}>
              {hp}
            </span>
          );
        }
        return hp;
      });
    });
  };

  const timeString = new Date(event.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: false 
  });
  const timeDisplay = `[${timeString}]`;

  // Standard Header for Time Metadata
  const TimeColumn = ({ type }: { type?: string }) => (
    <div className="shrink-0 w-[100px] flex flex-col justify-center relative z-10 font-app-mono">
      {type === 'system' && (
        <span className="text-app-accent/80 text-[7px] font-app-bold tracking-[0.2em] uppercase mb-0.5 leading-none">
          SYSTEM_LOG
        </span>
      )}
      <span className={`${type === 'system' ? 'text-[11px] text-[#555]' : 'text-[13px] text-[#444]'} leading-none`}>
        {timeDisplay}
      </span>
    </div>
  );

  // CHAT BRANCH
  if (event.type === 'chat') {
    return (
      <div className="px-5 py-2.5 text-[13px] md:text-[14px] leading-relaxed border-b border-white/[0.03] transition-colors flex gap-4 hover:bg-white/[0.02] animate-row-in items-center">
        <TimeColumn />
        <div className="flex-1 flex gap-2 overflow-hidden">
          <span className={`${event.attacker === 'PILOT_01' ? 'text-app-accent' : 'text-cyan-400'} font-app-bold shrink-0 bg-white/5 px-2 py-0.5 rounded`}>
            {event.attacker || 'ANON'}
          </span>
          <span className="text-white/80 truncate md:whitespace-normal">{event.text}</span>
        </div>
      </div>
    );
  }

  // SYSTEM BRANCH
  if (event.type === 'system') {
    return (
      <div className="px-5 py-3.5 text-[12px] md:text-[13px] leading-relaxed border-b border-white/[0.03] flex gap-4 bg-app-accent/5 relative group animate-row-in overflow-hidden items-center">
        {/* Subtle Left Accent */}
        <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-app-accent/50 group-hover:bg-app-accent transition-colors" />
        
        <TimeColumn type="system" />
        
        <div className="flex-1 relative z-10 italic flex items-center pr-4">
          {renderSystemNarrative(event.text)}
        </div>
      </div>
    );
  }

  // COMBAT BRANCH (ELIM, LOOT, ABILITY)
  return (
    <div className={`px-5 py-2.5 text-[13px] md:text-[14px] leading-relaxed border-b border-white/[0.03] transition-colors flex gap-4 animate-row-in items-center ${
      event.type === 'elim' 
        ? 'animate-flash-danger bg-red-500/5' 
        : 'hover:bg-white/[0.02]'
    }`}>
      <TimeColumn />
      <div className="text-white/90 flex-1">{renderCombatNarrative(event.text)}</div>
    </div>
  );
});

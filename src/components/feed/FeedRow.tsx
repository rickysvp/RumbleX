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
        return <span key={i} className="text-white font-app-bold tracking-wider mx-0.5 bg-white/5 px-1 rounded-sm">{part}</span>;
      }
      if (part.match(/^\d+\.?\d*(?:\s?MON)?$/)) {
        return <span key={i} className="text-app-accent font-app-bold mx-0.5">{part}</span>;
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
        return <span key={`mon-${i}`} className="text-app-accent font-bold">{part}</span>;
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
            <span key={`h-${i}-${j}`} className={`${isUser ? 'text-app-accent font-app-bold' : 'text-cyan-400'} font-bold`}>
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

  // CHAT BRANCH
  if (event.type === 'chat') {
    return (
      <div className="px-5 py-2 text-[13px] md:text-[14px] leading-relaxed border-b border-white/[0.03] transition-colors flex gap-4 hover:bg-white/[0.02] animate-row-in">
        <div className="shrink-0 text-[#444] w-[100px] flex items-center">{timeDisplay}</div>
        <div className="flex-1 flex gap-2">
          <span className={`${event.attacker === 'PILOT_01' ? 'text-app-accent' : 'text-cyan-400'} font-app-bold shrink-0`}>
            {event.attacker || 'ANON'}
          </span>
          <span className="text-white/80">{event.text}</span>
        </div>
      </div>
    );
  }

  // SYSTEM BRANCH
  if (event.type === 'system') {
    return (
      <div className="px-5 py-3 text-[12px] md:text-[13px] leading-relaxed border-b border-white/[0.03] flex gap-4 bg-white/[0.015] relative group animate-row-in overflow-hidden">
        {/* Simplified Left Accent */}
        <div className="absolute left-0 top-2 bottom-2 w-[2px] bg-app-accent/20 group-hover:bg-app-accent/50 transition-colors" />
        
        <div className="shrink-0 text-[#444] w-[100px] relative z-10 flex flex-col justify-center">
           <span className="text-app-accent/60 text-[7px] font-app-bold tracking-widest uppercase mb-0.5">ARENA_LOG</span>
           <span className="text-[11px] opacity-80">{timeDisplay}</span>
        </div>
        <div className="flex-1 relative z-10 italic flex items-center pr-4">
          {renderSystemNarrative(event.text)}
        </div>
      </div>
    );
  }

  // COMBAT BRANCH (ELIM, LOOT, ABILITY)
  return (
    <div className={`px-5 py-2 text-[13px] md:text-[14px] leading-relaxed border-b border-white/[0.03] transition-colors flex gap-4 animate-row-in ${
      event.type === 'elim' 
        ? 'animate-flash-danger bg-red-500/5' 
        : 'hover:bg-white/[0.02]'
    }`}>
      <div className="shrink-0 text-[#444] w-[100px] flex items-center">{timeDisplay}</div>
      <div className="text-white/90 flex-1">{renderCombatNarrative(event.text)}</div>
    </div>
  );
});

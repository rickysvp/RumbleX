import React from 'react';
import { FeedEvent } from '../../store/types';

interface FeedRowProps {
  event: FeedEvent;
}

export const FeedRow = React.memo(({ event }: FeedRowProps) => {
  const renderNarrative = (text: string) => {
    if (!text) return null;
    
    // First split by MON
    let parts = text.split(/([\d.]+ MON)/g);
    
    return parts.flatMap((part, i) => {
      if (part.match(/[\d.]+ MON/)) {
        return <span key={`mon-${i}`} className="text-app-accent font-bold">{part}</span>;
      }
      
      // For non-MON parts, look for handles (UPPER_CASE or CamelCase)
      // We look for patterns like PILOT_01, CryptoKnight, etc.
      // Also catch [PILOT_01] format from chat
      let handleParts = part.split(/(\[?[A-Z][a-zA-Z0-9_]{3,}\]?)/g);
      return handleParts.map((hp, j) => {
        if (hp.match(/^\[?[A-Z][a-zA-Z0-9_]{3,}\]?$/) && !hp.includes('MON')) {
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

  const mins = Math.floor(event.timestamp / 60).toString().padStart(2, '0');
  const secs = (event.timestamp % 60).toString().padStart(2, '0');
  const timeString = `[${mins}:${secs}]`;

  return (
    <div className={`px-5 py-2 text-[13px] md:text-[14px] leading-relaxed border-b border-[#1a1a1a] transition-colors flex gap-3 font-app-mono animate-row-in ${
      event.type === 'elim' 
        ? 'animate-flash-danger' 
        : event.type === 'system' 
          ? 'animate-flash-accent' 
          : 'hover:bg-[#111]'
    }`}>
      <div className="shrink-0 text-[#666] w-[60px]">{timeString}</div>
      <div className="text-white flex-1">{renderNarrative(event.text)}</div>
    </div>
  );
});

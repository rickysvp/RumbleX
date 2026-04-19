import React from 'react';
import { FeedEvent } from '../../store/types';

interface FeedRowProps {
  event: FeedEvent;
}

export const FeedRow = React.memo(({ event }: FeedRowProps) => {
  let typeTag = 'SYSTEM';
  let tagClass = 'text-cyan-500';

  if (event.type === 'elim') {
    typeTag = 'ELIM';
    tagClass = 'text-app-danger';
  } else if (event.type === 'loot') {
    typeTag = 'LOOT';
    tagClass = 'text-app-accent';
  } else if (event.type === 'ability') {
    typeTag = 'ABILITY';
    tagClass = 'text-[#B088FF]';
  }

  const renderNarrative = (text: string) => {
    if (!text) return null;
    let parts = text.split(/([\d.]+ MON)/g);
    return parts.flatMap((part, i) => {
      if (part.match(/[\d.]+ MON/)) {
        return <span key={`mon-${i}`} className="text-app-accent font-bold">{part}</span>;
      }
      return [part];
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
      <div className={`shrink-0 w-[60px] font-bold ${tagClass}`}>{typeTag}</div>
      <div className="text-white flex-1">{renderNarrative(event.text)}</div>
    </div>
  );
});

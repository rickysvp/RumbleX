import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FeedEvent } from '../../store/types';

export function EventInjector() {
  const [text, setText] = useState('');
  const [type, setType] = useState<FeedEvent['type']>('system');

  const inject = (customText?: string, customType?: FeedEvent['type']) => {
    const activeText = customText || text;
    const activeType = customType || type;
    
    if (!activeText) return;

    const state = useGameStore.getState();
    const phase = state.phase;
    const timeRemaining = state.timeRemaining;
    
    // Calculate realistic timestamp
    let currentTimestamp = 0;
    if (phase === 'live') {
      currentTimestamp = 600 - timeRemaining;
    } else if (phase === 'entry_open') {
      currentTimestamp = 300 - timeRemaining;
    } else if (phase === 'concluded') {
      currentTimestamp = 600;
    }

    useGameStore.getState().addFeedEvent({
      timestamp: currentTimestamp,
      type: activeType,
      text: activeText,
      attacker: activeType === 'elim' ? 'CryptoKnight' : null,
      target: activeType === 'elim' ? 'DegenBear25' : null,
      monAmount: activeType === 'elim' || activeType === 'loot' ? 0.88 : null,
      skillUsed: null,
      itemUsed: null
    });

    if (!customText) setText('');
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mt-2 border-t border-[#1a1a1a] pt-3">Inject Event</div>
      
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => inject("CryptoKnight eliminated DegenBear25: +0.88 MON", "elim")} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-app-muted hover:text-white uppercase font-app-bold">Kill Event</button>
        <button onClick={() => inject("DEBUG: System message injected.", "system")} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-app-muted hover:text-white uppercase font-app-bold">System Msg</button>
        <button onClick={() => inject("PILOT_01: testing the feed...", "chat")} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-app-muted hover:text-white uppercase font-app-bold">Chat Msg</button>
        <button onClick={() => inject("VoidWalker relieved NullPointer of 0.32 MON and kept moving.", "loot")} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-app-muted hover:text-white uppercase font-app-bold">Loot Event</button>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <textarea 
          placeholder="Custom event text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="bg-black border border-[#333] text-white font-app-mono text-[11px] p-2 h-16 focus:border-app-accent outline-none resize-none"
        />
        <div className="flex gap-2">
          <select 
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="bg-[#111] border border-[#333] text-white text-[10px] px-2 flex-grow outline-none"
          >
            <option value="system">SYSTEM</option>
            <option value="elim">ELIM</option>
            <option value="loot">LOOT</option>
            <option value="ability">ABILITY</option>
            <option value="chat">CHAT</option>
          </select>
          <button 
            onClick={() => inject()}
            className="bg-app-accent text-black text-[10px] px-4 py-1.5 uppercase font-app-bold hover:bg-white"
          >
            Inject
          </button>
        </div>
      </div>
    </div>
  );
}

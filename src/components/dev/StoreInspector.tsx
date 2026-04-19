import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useWalletStore } from '../../store/walletStore';
import { ChevronRight, ChevronDown } from 'lucide-react';

export function StoreInspector() {
  const gameStore = useGameStore();
  const walletStore = useWalletStore();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (process.env.NODE_ENV !== 'development') return null;

  const sections = [
    { id: 'game', label: 'GAME STATE', data: gameStore },
    { id: 'wallet', label: 'WALLET STATE', data: walletStore },
    { id: 'players', label: `PLAYERS [${gameStore.players.length}]`, data: gameStore.players },
    { id: 'feed', label: `FEED EVENTS [${gameStore.feedEvents.length}]`, data: gameStore.feedEvents },
    { id: 'leaderboard', label: 'LEADERBOARD', data: gameStore.leaderboard }
  ];

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mt-2 border-t border-[#1a1a1a] pt-3 mb-2">Store State</div>
      
      {sections.map(s => (
        <div key={s.id} className="border border-[#1a1a1a] mb-1 overflow-hidden">
          <button 
            onClick={() => toggle(s.id)}
            className="w-full flex items-center justify-between p-2 bg-[#0a0a0a] hover:bg-[#111] transition-colors"
          >
            <span className="text-[10px] font-app-bold text-app-accent tracking-tighter">{s.label}</span>
            {expanded[s.id] ? <ChevronDown size={12} className="text-app-muted"/> : <ChevronRight size={12} className="text-app-muted"/>}
          </button>
          
          {expanded[s.id] && (
            <div className="p-2 bg-black overflow-x-auto max-h-[300px] custom-scrollbar">
              <pre className="text-[9px] font-app-mono text-[#888] leading-tight">
                {JSON.stringify(s.data, (key, value) => {
                  // Prevent circular references or massive sub-objects if any
                  if (key === 'tickTimer' || key === 'startRound' || key === 'concludeRound' || key === 'openNextRound' || key === 'addFeedEvent' || key === 'playerEliminated' || key === 'queueUserLoadout' || key === 'concludeSeason' || key === 'connect' || key === 'disconnect' || key === 'refreshBalance') {
                    return '[Action]';
                  }
                  return value;
                }, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

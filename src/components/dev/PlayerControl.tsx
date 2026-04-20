import React from 'react';
import { useDevStore } from '../../store/devStore';
import { useGameStore } from '../../store/gameStore';
import { generateMockPlayers } from '../../simulator/mockPlayers';

export function PlayerControl() {
  const { playerCount, setPlayerCount } = useDevStore();
  const phase = useGameStore(state => state.phase);
  const players = useGameStore(state => state.players);

  const aliveCount = players.filter(p => p.status === 'alive').length;
  const queuedCount = players.filter(p => p.status === 'queued').length;
  const elimCount = players.filter(p => p.status === 'eliminated').length;
  const specCount = players.filter(p => p.status === 'spectating').length;

  const applyPlayerCount = (count: number) => {
    setPlayerCount(count);
    const newPlayers = generateMockPlayers(count, true);
    const currentUser = players.find(p => p.isUser);
    
    const merged = newPlayers.map(p => {
      if (p.isUser && currentUser) {
        return { ...p, ...currentUser, handle: 'PILOT_01', isUser: true };
      }
      if (phase === 'live') {
        return { ...p, status: 'alive' as const, mon: 0.5 + Math.random() * 1.5 };
      }
      return p;
    });

    useGameStore.setState({ players: merged });
  };

  const addPlayers = (n: number) => {
    applyPlayerCount(playerCount + n);
  };

  const presetCounts = [4, 8, 12, 20, 30, 50];

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest border-t border-[#1a1a1a] pt-3">Player Count</div>
      
      <div className="text-[11px] font-app-mono">
        TOTAL: <span className="text-app-accent">{players.length}</span>
        <span className="text-[#444] ml-2">
          [{aliveCount} alive · {queuedCount} queued · {elimCount} elim · {specCount} spec]
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {presetCounts.map(n => (
          <button
            key={n}
            onClick={() => applyPlayerCount(n)}
            className={`text-[9px] py-1.5 border font-app-bold uppercase ${
              playerCount === n ? 'border-app-accent text-app-accent bg-app-accent/5' : 'border-[#222] text-app-muted hover:text-white'
            }`}
          >
            {n}P
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => addPlayers(-5)}
          className="bg-[#111] border border-[#222] text-[9px] py-1.5 px-3 text-white uppercase font-app-bold hover:bg-[#222] flex-1"
        >
          -5
        </button>
        <button 
          onClick={() => addPlayers(-1)}
          className="bg-[#111] border border-[#222] text-[9px] py-1.5 px-3 text-white uppercase font-app-bold hover:bg-[#222] flex-1"
        >
          -1
        </button>
        <div className="text-[14px] font-app-mono text-app-accent text-center min-w-[32px]">
          {playerCount}
        </div>
        <button 
          onClick={() => addPlayers(1)}
          className="bg-[#111] border border-[#222] text-[9px] py-1.5 px-3 text-white uppercase font-app-bold hover:bg-[#222] flex-1"
        >
          +1
        </button>
        <button 
          onClick={() => addPlayers(5)}
          className="bg-[#111] border border-[#222] text-[9px] py-1.5 px-3 text-white uppercase font-app-bold hover:bg-[#222] flex-1"
        >
          +5
        </button>
      </div>

      <div className="flex gap-1">
        <button 
          onClick={() => applyPlayerCount(2)}
          className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] py-1.5 uppercase font-app-bold hover:bg-red-500/20 flex-1"
        >
          MIN 2P
        </button>
        <button 
          onClick={() => applyPlayerCount(50)}
          className="bg-green-500/10 border border-green-500/30 text-green-400 text-[9px] py-1.5 uppercase font-app-bold hover:bg-green-500/20 flex-1"
        >
          MAX 50P
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { useDevStore } from '../../store/devStore';
import { useGameStore } from '../../store/gameStore';
import { simulationEngine } from '../../lib/simulationEngine';
import { generateMockPlayers } from '../../simulator/mockPlayers';

export function SimControl() {
  const { simulationIntervalMs, setSimulationSpeed, playerCount } = useDevStore();

  const handleFireEvent = () => {
    simulationEngine.generateCombatEvent();
  };

  const handleElimRandom = () => {
    const alive = useGameStore.getState().players.filter(p => p.status === 'alive');
    if (alive.length < 2) return;
    const victim = alive[Math.floor(Math.random() * alive.length)];
    const attackers = alive.filter(p => p.id !== victim.id);
    const attacker = attackers[Math.floor(Math.random() * attackers.length)];
    useGameStore.getState().playerEliminated(attacker.id, victim.id, 0);
  };

  const handleForceLeader = () => {
    const alive = useGameStore.getState().players.filter(p => p.status === 'alive');
    if (alive.length <= 1) return;
    
    const leader = alive.reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr));
    const others = alive.filter(p => p.id !== leader.id);
    
    others.forEach(v => {
      useGameStore.getState().playerEliminated(leader.id, v.id, 0);
    });
  };

  const handleResetRound = () => {
    const freshPlayers = generateMockPlayers(playerCount, true).map(p => ({
      ...p,
      status: p.isUser ? 'spectating' as const : 'queued' as const,
      mon: 0.8,
      kills: 0,
      eliminatedAt: null,
      eliminatedBy: null
    }));

    useGameStore.setState({ 
        phase: 'entry_open', 
        timeRemaining: 300, 
        players: freshPlayers,
        feedEvents: [{
          id: 'reset_1',
          timestamp: 0,
          type: 'system' as const,
          text: `ROUND RESET. ${freshPlayers.length - 1} PLAYERS QUEUED.`,
          attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
        }]
    });
  };

  if (process.env.NODE_ENV !== 'development') return null;

  const speeds = [
    { label: 'Slow 15s', val: 15000 },
    { label: 'Normal 8s', val: 8000 },
    { label: 'Fast 2s', val: 2000 },
    { label: 'Instant 0.5s', val: 500 }
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mt-2 border-t border-[#1a1a1a] pt-3">Simulation</div>
      
      <div className="text-[10px] text-app-muted font-app-mono uppercase mb-1">Tick Interval</div>
      <div className="grid grid-cols-2 gap-1">
        {speeds.map(s => (
          <button
            key={s.label}
            onClick={() => setSimulationSpeed(s.val)}
            className={`text-[9px] py-1 border font-app-bold uppercase ${
              simulationIntervalMs === s.val ? 'border-app-accent text-app-accent bg-app-accent/5' : 'border-[#222] text-app-muted hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setSimulationSpeed(null)}
          className={`text-[9px] py-1 border font-app-bold uppercase col-span-2 ${
            simulationIntervalMs === null ? 'border-app-accent text-app-accent bg-app-accent/5' : 'border-[#222] text-app-muted hover:text-white'
          }`}
        >
          Reset to Logic (8-15s Random)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 mt-1">
        <button onClick={handleFireEvent} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-white uppercase font-app-bold hover:bg-[#222]">Fire One Event</button>
        <button onClick={handleElimRandom} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-white uppercase font-app-bold hover:bg-[#222]">Elim Random</button>
        <button onClick={handleForceLeader} className="bg-[#111] border border-[#222] text-[9px] py-1.5 text-white uppercase font-app-bold hover:bg-[#222]">Force Leader</button>
        <button onClick={handleResetRound} className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] py-1.5 uppercase font-app-bold hover:bg-red-500/20">Reset Round</button>
      </div>
    </div>
  );
}

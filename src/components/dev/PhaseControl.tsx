import React, { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function PhaseControl() {
  const { phase, timeRemaining } = useGameStore();
  const [tempTime, setTempTime] = useState(timeRemaining.toString());

  const setPhase = (newPhase: 'entry_open' | 'live' | 'concluded') => {
    let time = 300;
    if (newPhase === 'live') time = 600;
    if (newPhase === 'concluded') time = 90;
    
    useGameStore.setState({ phase: newPhase, timeRemaining: time });
  };

  const updateTime = (val: number) => {
    useGameStore.setState({ timeRemaining: Math.max(0, val) });
    setTempTime(Math.max(0, val).toString());
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest">Phase Control</div>
      
      <div className="text-[11px] font-app-mono">
        CURRENT: <span className="text-app-accent uppercase">{phase}</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {(['entry_open', 'live', 'concluded'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`text-[9px] py-1.5 border font-app-bold uppercase tracking-tighter ${
              phase === p ? 'bg-app-accent text-black border-app-accent' : 'border-[#333] text-app-muted hover:text-white'
            }`}
          >
            {p.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-app-muted uppercase font-app-bold tracking-widest">Time Remaining</div>
      <div className="flex gap-2">
        <input 
          type="number"
          value={tempTime}
          onChange={(e) => setTempTime(e.target.value)}
          className="bg-black border border-[#333] text-white font-app-mono text-[11px] px-2 py-1 w-20 focus:border-app-accent outline-none"
        />
        <button 
          onClick={() => updateTime(parseInt(tempTime))}
          className="bg-[#222] text-white text-[9px] px-3 uppercase font-app-bold hover:bg-[#333]"
        >
          Set
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1 mt-1">
        <button onClick={() => updateTime(timeRemaining + 60)} className="bg-[#111] border border-[#222] text-[9px] py-1 text-app-muted hover:text-white">+60s</button>
        <button onClick={() => updateTime(timeRemaining - 60)} className="bg-[#111] border border-[#222] text-[9px] py-1 text-app-muted hover:text-white">-60s</button>
        <button onClick={() => updateTime(0)} className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] py-1 hover:bg-red-500/20">→ 0s</button>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

export function EliminationCinematic() {
  const lastElim = useGameStore(state => state.lastElimination);
  const players = useGameStore(state => state.players);
  const [active, setActive] = useState(false);
  const [data, setData] = useState<{attacker: string, target: string, mon: number} | null>(null);

  useEffect(() => {
    if (lastElim) {
      setData(lastElim);
      setActive(true);
      const timer = setTimeout(() => setActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastElim]);

  if (!active || !data) return null;

  const isUserTarget = (players || []).find(p => p.handle === data.target)?.isUser;
  const isUserAttacker = (players || []).find(p => p.handle === data.attacker)?.isUser;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Glitch Background Flash */}
      <div className={`absolute inset-0 transition-opacity duration-200 ${isUserTarget ? 'bg-app-danger/20' : isUserAttacker ? 'bg-app-accent/10' : 'bg-white/5'} animate-pulse`} />
      
      {/* Radial Impact */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_30%,rgba(0,0,0,0.8)_100%)]" />

      {/* Hero Text */}
      <div className="relative flex flex-col items-center animate-[glitchIn_0.3s_ease-out_forwards]">
        <div className={`text-[10px] font-app-bold tracking-[10px] uppercase mb-2 ${isUserTarget ? 'text-app-danger' : 'text-app-accent'}`}>
          {isUserTarget ? 'CRITICAL_FAILURE' : 'ELIMINATION_CONFIRMED'}
        </div>
        
        <div className="flex items-center gap-6">
           <div className="text-right">
              <div className="text-app-muted text-[9px] uppercase tracking-widest">SIGNAL_LOST</div>
              <div className="text-white font-app-bold text-[24px] md:text-[32px]">{data.target}</div>
           </div>
           
           <div className="h-12 w-px bg-white/20 rotate-12" />
           
           <div className="text-left">
              <div className="text-app-muted text-[9px] uppercase tracking-widest">COLLECTED</div>
              <div className="text-app-accent font-app-bold text-[24px] md:text-[32px]">+{data.mon.toFixed(1)} MON</div>
           </div>
        </div>

        <div className="mt-4 px-6 py-1 border border-white/20 bg-white/5 backdrop-blur-sm">
           <span className="text-[10px] text-white/50 font-app-mono uppercase tracking-[2px]">CREDIT: {data.attacker}</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glitchIn {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: brightness(2) contrast(2); }
          10% { transform: scale(1) translateX(-2px); filter: brightness(1) contrast(1); }
          20% { transform: translateX(2px); }
          30% { transform: translateX(0); opacity: 1; }
          90% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
      `}} />
    </div>
  );
}

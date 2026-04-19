import React from 'react';
import { useGameStore } from '../../store/gameStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function ConcludedStage() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const lastRoundResult = useGameStore(state => state.lastRoundResult);
  const queueRemaining = useGameStore(state => state.userLoadout.queueRemaining);
  const players = useGameStore(state => state.players);
  const openNextRound = useGameStore(state => state.openNextRound);

  const alivePlayers = players.filter(p => p.status === 'alive');
  const totalInPlay = players.reduce((acc, p) => acc + p.mon, 0);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.15s_ease-in-out_forwards]">
      {/* Background brutalist element */}
      <div className="absolute top-[-40px] right-[-20px] p-4 opacity-[0.03] pointer-events-none select-none">
        <div className="text-[140px] md:text-[200px] font-app-bold leading-none tracking-tighter">{roundNumber}</div>
      </div>

      <div className="w-full max-w-xl z-10 flex flex-col items-center text-center px-4">
        <h1 className="font-app-bold text-[22px] md:text-[28px] text-white uppercase tracking-widest mb-6 animate-[fadeIn_0.2s_ease-out]">
          ROUND #{roundNumber} — CONCLUDED
        </h1>

        <div className="bg-[#151515] border border-[#333] w-full p-6 mb-8 relative overflow-hidden shadow-2xl animate-[fadeIn_0.5s_ease-out,slideDown_0.3s_ease-out]">
           <div className="absolute left-0 top-0 w-1 md:w-2 h-full bg-app-accent shadow-[0_0_20px_rgba(217,255,0,0.3)]"></div>
           <div className="text-[10px] md:text-[11px] text-app-muted font-app-bold uppercase tracking-[4px] mb-2">★ CHAMPION ★</div>
           <div className="text-[28px] md:text-[40px] font-app-bold text-app-accent mb-2 leading-none tracking-tighter drop-shadow-lg">
             {lastRoundResult ? lastRoundResult.champion : 'NONE'}
           </div>
           <div className="text-[12px] md:text-[14px] font-app-mono text-white opacity-80 uppercase tracking-widest">
             +{lastRoundResult ? lastRoundResult.championMon.toFixed(1) : '0.0'} MON cashed out
           </div>
        </div>

        <div className="flex gap-4 md:gap-8 w-full mb-8 justify-center border border-[#222] bg-[#0a0a0a] p-4">
           <div className="flex flex-col items-center">
             <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">SURVIVORS</span>
             <span className="text-[16px] font-app-mono text-white">{alivePlayers.length}</span>
           </div>
           <div className="w-px h-10 bg-[#333]"></div>
           <div className="flex flex-col items-center">
             <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">TOTAL LOOT</span>
             <span className="text-[16px] font-app-mono text-app-accent">{totalInPlay.toFixed(1)} MON</span>
           </div>
           {queueRemaining > 0 && (
             <>
               <div className="w-px h-10 bg-[#333]"></div>
               <div className="flex flex-col items-center">
                 <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">ROUNDS LEFT</span>
                 <span className="text-[16px] font-app-mono text-white">Your queue: {queueRemaining}</span>
               </div>
             </>
           )}
        </div>

        {queueRemaining > 0 ? (
           <div className="flex flex-col items-center w-full">
             <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-widest mb-2">
               NEXT ROUND IN: {formatTime(timeRemaining)}
             </div>
             <div className="px-4 py-3 md:py-4 bg-app-accent/10 border border-app-accent text-app-accent font-app-bold text-[10px] md:text-[12px] tracking-widest uppercase w-full">
               YOUR NEXT LOADOUT IS READY. ROUND #{roundNumber + 1} STARTS IN {formatTime(timeRemaining)}
             </div>
           </div>
        ) : (
           <div className="flex flex-col items-center w-full max-w-xs">
             <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-widest mb-3">
               NEXT ROUND IN: {formatTime(timeRemaining)}
             </div>
             <button 
               onClick={openNextRound}
               className="bg-app-accent text-[#000] font-app-bold text-[14px] md:text-[16px] py-4 w-full uppercase tracking-widest hover:bg-white transition-colors"
             >
               Play to Win
             </button>
           </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Trophy, ChevronRight, History } from 'lucide-react';

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
  const recentChampions = useGameStore(state => state.recentChampions);
  const openNextRound = useGameStore(state => state.openNextRound);

  const alivePlayers = players.filter(p => p.status === 'alive');
  const totalInPlay = players.reduce((acc, p) => acc + p.mon, 0);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 overflow-y-auto custom-scrollbar animate-[fadeIn_0.15s_ease-in-out_forwards]">
      {/* Background brutalist element */}
      <div className="absolute top-[-20px] right-[-20px] p-4 opacity-[0.03] pointer-events-none select-none">
        <div className="text-[120px] md:text-[200px] font-app-bold leading-none tracking-tighter">FIN</div>
      </div>

      <div className="w-full max-w-2xl z-10 flex flex-col items-center text-center px-4">
        
        {/* UPPER STATUS */}
        <div className="flex items-center gap-3 mb-8 opacity-60">
           <div className="h-[1px] w-8 bg-white/30" />
           <span className="font-app-mono text-[10px] uppercase tracking-[4px]">POST_MATCH_SUMMARY</span>
           <div className="h-[1px] w-8 bg-white/30" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start w-full">
          
          {/* LEFT: CHAMPION SHOWCASE (8 cols) */}
          <div className="md:col-span-12 lg:col-span-8 flex flex-col items-stretch">
            <div className="bg-[#0D0D0D] border-2 border-app-accent/20 w-full p-8 mb-6 relative overflow-hidden shadow-[0_0_50px_rgba(217,255,0,0.05)] group">
               <div className="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                  <Trophy size={160} />
               </div>
               
               <div className="text-[11px] text-app-muted font-app-bold uppercase tracking-[6px] mb-4 flex items-center justify-center gap-2">
                 <span className="w-2 h-2 bg-app-accent rounded-full animate-pulse" />
                 CHAMPION_CERTIFIED
               </div>
               
               <div className="text-[36px] md:text-[56px] font-app-bold text-app-accent mb-2 leading-none tracking-tight drop-shadow-[0_0_20px_rgba(217,255,0,0.4)]">
                 {lastRoundResult ? lastRoundResult.champion : 'NONE'}
               </div>
               
               <div className="text-[14px] md:text-[18px] font-app-mono text-white opacity-80 uppercase tracking-[2px] mb-6">
                 NET_PRIZE: <span className="font-app-bold">{lastRoundResult ? lastRoundResult.championMon.toFixed(1) : '0.0'} MON</span>
               </div>

               <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div className="text-left">
                     <div className="text-[9px] text-app-accent font-app-bold uppercase tracking-widest mb-1">PLATFORM_FEE</div>
                     <div className="text-[14px] text-white font-app-mono">5.0%</div>
                  </div>
                  <div className="text-right">
                     <div className="text-[9px] text-app-accent font-app-bold uppercase tracking-widest mb-1">SEASON_POOL</div>
                     <div className="text-[14px] text-white font-app-mono">5.0%</div>
                  </div>
               </div>
            </div>

            {/* QUICK STATS */}
            <div className="flex gap-4 md:gap-px bg-[#222] border border-[#222]">
               <div className="flex-1 bg-[#050505] p-4 flex flex-col items-center">
                 <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">ALIVE_END</span>
                 <span className="text-[18px] font-app-mono text-white">{alivePlayers.length}</span>
               </div>
               <div className="flex-1 bg-[#050505] p-4 flex flex-col items-center">
                 <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">ROUND_MON</span>
                 <span className="text-[18px] font-app-mono text-app-accent">{lastRoundResult?.totalVolume.toFixed(1)}</span>
               </div>
               <div className="flex-1 bg-[#050505] p-4 flex flex-col items-center">
                 <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">ROUND_ID</span>
                 <span className="text-[18px] font-app-mono text-white">#{roundNumber}</span>
               </div>
            </div>
          </div>

          {/* RIGHT: RECENT HISTORY (4 cols - Hidden on small mobile if needed) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col items-stretch h-full">
            <div className="bg-[#050505] border border-app-border p-4 h-full flex flex-col">
               <div className="text-[10px] text-app-accent font-app-bold uppercase tracking-[4px] mb-4 flex items-center gap-2">
                 <History size={12} />
                 GLOBAL_HISTORY
               </div>
               
               <div className="flex flex-col gap-3">
                  {recentChampions.slice(0, 6).map((champ, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                       <span className="text-white font-app-mono text-[11px] uppercase tracking-wider">{champ}</span>
                       <span className="text-app-muted font-app-mono text-[9px]">#{roundNumber - i - 1}</span>
                    </div>
                  ))}
               </div>
               
               <div className="mt-auto pt-4 text-[8px] text-app-muted font-app-mono uppercase tracking-widest text-left">
                  ALL CONTRACTS VERIFIED_OK
               </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION */}
        <div className="mt-10 w-full">
           {queueRemaining > 0 ? (
              <div className="bg-app-accent/5 border-2 border-app-accent/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4 group">
                 <div className="text-left">
                    <div className="text-app-accent font-app-bold text-[18px] uppercase tracking-[6px] mb-1">AUTO_QUEUE_ACTIVE</div>
                    <div className="text-app-muted text-[10px] font-app-mono uppercase tracking-[2px]">ROUNDS_REMAINING: {queueRemaining}</div>
                 </div>
                 <div className="flex flex-col items-end">
                    <div className="text-white font-app-mono text-[24px] mb-1">{formatTime(timeRemaining)}</div>
                    <div className="w-32 h-1 bg-white/10 overflow-hidden">
                       <div className="h-full bg-app-accent animate-[scan_2s_linear_infinite]" style={{ width: '30%' }} />
                    </div>
                 </div>
              </div>
           ) : (
              <div className="flex flex-col md:flex-row items-stretch gap-px bg-app-border border border-app-border shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                 <div className="flex-[2] bg-[#050505] p-6 flex flex-col items-start justify-center">
                    <div className="text-white font-app-bold text-[14px] uppercase tracking-[4px] mb-1">NEXT_ROUND_INITIATION</div>
                    <div className="text-app-muted font-app-mono text-[10px] uppercase">ENTRIES_OPENING_IN: {formatTime(timeRemaining)}</div>
                 </div>
                 <button 
                   onClick={openNextRound}
                   className="flex-1 bg-app-accent hover:bg-white text-black font-app-bold py-6 px-10 uppercase tracking-[6px] transition-all flex items-center justify-center gap-3 group"
                 >
                   RE_ENTER <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
           )}
        </div>

      </div>
    </div>
  );
}

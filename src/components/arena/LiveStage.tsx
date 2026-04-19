import React from 'react';
import { useGameStore } from '../../store/gameStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function LiveStage() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const players = useGameStore(state => state.players);
  
  const alivePlayers = players.filter(p => p.status === 'alive');
  const aliveCount = alivePlayers.length;
  const totalInRound = players.filter(p => p.status !== 'spectating').length;
  
  const killLeader = alivePlayers.length > 0 
    ? alivePlayers.reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr))
    : null;
  
  const totalInPlay = players.reduce((acc, p) => acc + p.mon, 0);
  
  const user = players.find(p => p.isUser);

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.15s_ease-in-out_forwards] ${timeRemaining <= 10 ? 'animate-vignette' : ''}`}>
      {/* Background brutalist element */}
      <div className="absolute top-[-40px] right-[-20px] p-4 opacity-[0.03] pointer-events-none select-none">
        <div className="text-[140px] md:text-[200px] font-app-bold leading-none tracking-tighter">{roundNumber}</div>
      </div>

      <div className="w-full max-w-2xl z-10 flex flex-col items-center text-center px-4">
        {/* Row 1: Status header */}
        <div className="flex justify-between w-full mb-4 md:mb-6 font-app-bold text-[14px] md:text-[16px] uppercase tracking-widest border-b border-[#222] pb-2">
           <span className="text-app-muted">ROUND #{roundNumber}</span>
           <span className="text-app-accent flex items-center gap-2">
             <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-app-accent animate-pulse"></span>
             LIVE
           </span>
        </div>

        {/* Row 2: Countdown */}
        <div className="mb-6 md:mb-8">
          <div 
            className={`font-app-mono text-[56px] md:text-[80px] leading-none shadow-sm ${
              timeRemaining <= 10 ? 'text-app-danger animate-pulse-urgent' : 'text-app-accent animate-pulse-timer'
            }`} 
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(timeRemaining)}
          </div>
          <div className="text-[10px] md:text-[12px] text-app-muted uppercase font-app-bold tracking-widest mt-2 md:mt-3">TIME REMAINING</div>
        </div>

        {/* Row 3: Live Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 w-full mb-6 max-w-xl">
          <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col items-center">
            <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">ALIVE</span>
            <span className="text-[16px] text-white font-app-mono">{aliveCount} / {totalInRound}</span>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col items-center">
            <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">KILL LEADER</span>
            <span className="text-[14px] text-white font-app-mono truncate w-full px-1">{killLeader ? killLeader.handle : '---'}</span>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col items-center">
            <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">LEADER MON</span>
            <span className="text-[16px] text-app-accent font-app-mono">{killLeader ? killLeader.mon.toFixed(1) : '0.0'} MON</span>
          </div>
          <div className="bg-[#0a0a0a] border border-[#222] p-3 flex flex-col items-center">
            <span className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">IN PLAY</span>
            <span className="text-[16px] text-app-accent font-app-mono">{totalInPlay.toFixed(1)} MON</span>
          </div>
        </div>

        {/* Row 4: Your Status */}
        <div className="w-full max-w-xl bg-[#151515] border border-[#333] p-4 text-[12px] md:text-[14px] font-app-mono tracking-wide uppercase">
          {user?.status === 'alive' ? (
            <span className="text-white">
              YOU: <span className="font-app-bold">PILOT_01</span> — <span className="text-app-accent">{user.mon.toFixed(1)} MON</span> — ALIVE
            </span>
          ) : user?.status === 'eliminated' ? (
            <span className="text-[#888]">
              YOU: ELIMINATED AT {formatTime(user.eliminatedAt || 0)} BY {user.eliminatedBy}
            </span>
          ) : (
            <span className="text-[#666]">YOU: SPECTATING</span>
          )}
        </div>
      </div>
    </div>
  );
}

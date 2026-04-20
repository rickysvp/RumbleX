import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { EliminationCinematic } from './EliminationCinematic';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function LiveStage() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const players = useGameStore(state => state.players);
  const lastElim = useGameStore(state => state.lastElimination);
  
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (lastElim) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(timer);
    }
  }, [lastElim]);

  const alivePlayers = players.filter(p => p.status === 'alive');
  const aliveCount = alivePlayers.length;
  const totalInRound = players.filter(p => p.status !== 'spectating').length;
  
  const killLeader = alivePlayers.length > 0 
    ? alivePlayers.reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr))
    : null;
  
  const totalInPlay = players.reduce((acc, p) => acc + p.mon, 0);
  const user = players.find(p => p.isUser);

  return (
    <div className={`h-full w-full flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 overflow-hidden relative transition-all duration-75 ${
      shake ? 'translate-x-1 translate-y-1' : 'translate-x-0 translate-y-0'
    } ${timeRemaining <= 10 ? 'animate-vignette' : ''}`}>
      
      {/* CORNER HUD DECORATIONS - 移动端隐藏 */}
      <div className="hidden sm:block absolute top-10 left-10 w-8 h-8 border-t border-l border-app-accent/20" />
      <div className="hidden sm:block absolute top-10 right-10 w-8 h-8 border-t border-r border-app-accent/20" />
      <div className="hidden sm:block absolute bottom-10 left-10 w-8 h-8 border-b border-l border-app-accent/20" />
      <div className="hidden sm:block absolute bottom-10 right-10 w-8 h-8 border-b border-r border-app-accent/20" />

      <EliminationCinematic />

      <div className={`w-full max-w-2xl flex flex-col items-center text-center px-2 z-10 transition-transform ${shake ? 'scale-[1.01]' : 'scale-100'}`}>
        <div className="flex justify-center w-full mb-1 sm:mb-2 md:mb-4 uppercase tracking-[0.3em] border-b border-[#222] pb-1 sm:pb-2 md:pb-4">
           <span className="text-white font-app-bold text-[11px] sm:text-[14px] md:text-[18px]">ROUND #{roundNumber}</span>
        </div>

        <div className="mb-2 sm:mb-4 md:mb-6 relative flex flex-col items-center">
          {timeRemaining <= 10 && (
            <div className="absolute -top-3 sm:-top-4 md:-top-6 left-1/2 -translate-x-1/2 text-app-danger font-app-bold text-[7px] sm:text-[8px] md:text-[10px] tracking-[2px] sm:tracking-[3px] md:tracking-[5px] animate-pulse">
              !! CRITICAL_WINDOW !!
            </div>
          )}
          <div className="text-[7px] sm:text-[8px] md:text-[11px] text-app-muted uppercase font-app-bold tracking-[3px] sm:tracking-[4px] md:tracking-[6px] mb-0.5 sm:mb-1 md:mb-2">ENDS IN</div>
          <div 
            className={`font-app-bold text-[36px] sm:text-[48px] md:text-[96px] leading-none tracking-[-0.05em] ${
              timeRemaining <= 10 ? 'text-app-danger animate-pulse-urgent' : 'text-app-accent'
            }`} 
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* 简化的统计信息 - 只显示存活和奖池 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full mb-2 sm:mb-4 md:mb-8 max-w-[280px] sm:max-w-xs md:max-w-md">
          <div className="bg-[#050505] border border-app-border p-1.5 sm:p-2 md:p-4 flex flex-col items-center">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-0.5 md:mb-1">ALIVE</span>
            <span className="text-[12px] sm:text-[14px] md:text-[18px] text-white font-app-bold">{aliveCount}<span className="text-[9px] sm:text-[10px] md:text-[12px] text-[#444] ml-1">/{totalInRound}</span></span>
          </div>
          <div className="bg-[#050505] border border-app-border p-1.5 sm:p-2 md:p-4 flex flex-col items-center">
            <span className="text-[7px] sm:text-[8px] md:text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-0.5 md:mb-1">PRIZE POOL</span>
            <span className="text-[12px] sm:text-[14px] md:text-[18px] text-app-accent font-app-bold">{totalInPlay.toFixed(1)} <span className="text-[9px] md:text-[11px]">MON</span></span>
          </div>
        </div>

        <div className="w-full max-w-xl bg-white/5 border border-white/10 backdrop-blur-md p-2 sm:p-3 md:p-6 text-[10px] sm:text-[11px] md:text-[14px] tracking-wider relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          {user?.status === 'alive' ? (
            <div className="flex flex-col items-center">
               <span className="text-[7px] sm:text-[8px] md:text-[10px] text-app-accent font-app-bold tracking-[2px] sm:tracking-[4px] uppercase mb-0.5 md:mb-1">LINK_ESTABLISHED</span>
               <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
                  <span className="text-white font-app-bold uppercase text-[12px] sm:text-[14px] md:text-[16px]">PILOT_01</span>
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-app-accent animate-pulse" />
                  <span className="text-app-accent font-app-bold text-[12px] sm:text-[14px] md:text-[16px]">{user.mon.toFixed(1)} MON</span>
               </div>
            </div>
          ) : user?.status === 'eliminated' ? (
            <div className="flex flex-col items-center text-app-danger">
              <span className="text-[7px] sm:text-[8px] md:text-[10px] font-app-bold tracking-[2px] sm:tracking-[4px] uppercase mb-0.5 md:mb-1">LINK_SEVERED</span>
              <span className="font-app-bold text-[10px] sm:text-[11px] md:text-[14px]">ELIMINATED BY {user.eliminatedBy?.toUpperCase()}</span>
              <span className="text-[7px] sm:text-[8px] md:text-[10px] opacity-60">AT {formatTime(user.eliminatedAt || 0)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../../../store/types';

interface Props {
  player: Player;
  rank?: number | string;
  isUser?: boolean;
  isRichest?: boolean;
  isUnderAttack?: boolean;
}

export const KillBoardRow = React.memo(({ player, rank, isUser, isRichest, isUnderAttack }: Props) => {
  const isAlive = player.status === 'alive';
  const prevMonRef = useRef(player.mon);
  const [shouldFlash, setShouldFlash] = useState(false);

  useEffect(() => {
    if (prevMonRef.current !== player.mon) {
      setShouldFlash(true);
      const timer = setTimeout(() => setShouldFlash(false), 500);
      prevMonRef.current = player.mon;
      return () => clearTimeout(timer);
    }
  }, [player.mon]);

  return (
    <div 
      className={`grid grid-cols-[25px_15px_1fr_60px_35px_80px] gap-2 items-center py-1.5 px-2 border border-transparent transition-all animate-row-in ${
        isUser ? 'bg-app-accent/5' : ''
      } ${isUnderAttack ? 'animate-attack-flash border-app-accent bg-app-accent/10' : ''} ${
        !isAlive ? 'opacity-40 grayscale' : ''
      }`}
    >
      {/* Rank */}
      <div className="text-[10px] font-app-mono text-app-muted">
        {rank !== undefined ? (typeof rank === 'number' ? `#${rank}` : rank) : '✕'}
      </div>

      {/* Status Dot */}
      <div className="flex justify-center">
        <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
          isAlive ? (isUnderAttack ? 'bg-yellow-400' : 'bg-app-accent') : 'bg-app-danger'
        }`}></div>
      </div>

      {/* Handle */}
      <div className={`text-[11px] font-app-bold truncate ${isAlive ? 'text-white' : 'text-[#666] line-through'}`}>
        {isUser ? '★' : ''}{player.handle}
      </div>

      {/* MON */}
      <div className={`text-right font-app-mono text-[11px] transition-all duration-300 ${
        !isAlive ? 'text-app-danger line-through' : (isRichest ? 'text-app-accent' : 'text-white')
      } ${shouldFlash ? 'animate-val-update' : ''}`}>
        {player.mon.toFixed(1)} <span className="text-[8px] opacity-70">M</span>
      </div>

      {/* Kills */}
      <div className="text-right text-[10px] font-app-mono text-[#666]">
        {player.kills}K
      </div>

      {/* Tag */}
      <div className="flex justify-end">
        {!isAlive ? (
          <span className="text-[8px] text-app-danger font-app-bold uppercase truncate max-w-[70px]">
             BY {player.eliminatedBy || 'ANON'}
          </span>
        ) : isRichest ? (
          <span className="bg-app-accent text-black text-[8px] font-app-bold px-1 py-0.5 uppercase tracking-tighter animate-[fadeIn_0.2s_ease-out]">
            Kill Leader
          </span>
        ) : isUnderAttack ? (
          <span className="bg-yellow-400 text-black text-[8px] font-app-bold px-1 py-0.5 uppercase tracking-tighter animate-pulse">
            ATTACK
          </span>
        ) : null}
      </div>
    </div>
  );
});

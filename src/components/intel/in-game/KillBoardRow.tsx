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
      className={`grid grid-cols-[30px_12px_1fr_70px_40px] gap-2 items-center py-2 px-2 border border-transparent transition-all animate-row-in ${
        isUser ? 'bg-app-accent/10 border-app-accent/30' : ''
      } ${isUnderAttack ? 'animate-attack-flash border-app-accent bg-app-accent/10' : ''} ${
        !isAlive ? 'opacity-40 grayscale' : ''
      }`}
    >
      {/* Rank */}
      <div className={`text-[11px] font-app-mono ${isRichest ? 'text-app-accent' : 'text-app-muted'}`}>
        {rank !== undefined ? (typeof rank === 'number' ? `#${rank}` : rank) : '✕'}
      </div>

      {/* Status Dot */}
      <div className="flex justify-center">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          isAlive ? (isUnderAttack ? 'bg-yellow-400' : 'bg-app-accent') : 'bg-app-danger'
        }`}></div>
      </div>

      {/* Handle - 显示玩家名，当前用户高亮 */}
      <div className={`text-[13px] font-app-bold truncate ${
        isUser ? 'text-app-accent' : (isAlive ? 'text-white' : 'text-[#666] line-through')
      }`}>
        {player.handle}
      </div>

      {/* MON */}
      <div className={`text-right font-app-mono text-[12px] transition-all duration-300 ${
        !isAlive ? 'text-app-danger line-through' : (isRichest ? 'text-app-accent' : 'text-white')
      } ${shouldFlash ? 'animate-val-update' : ''}`}>
        {player.mon.toFixed(1)} <span className="text-[9px] opacity-70">MON</span>
      </div>

      {/* Kills */}
      <div className={`text-right text-[11px] font-app-mono ${isUser ? 'text-app-accent' : 'text-[#666]'}`}>
        {player.kills}K
      </div>
    </div>
  );
});

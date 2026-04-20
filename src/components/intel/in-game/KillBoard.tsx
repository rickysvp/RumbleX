import React from 'react';
import { KillBoardRow } from './KillBoardRow';
import { useKillBoard } from '../../../hooks/useKillBoard';
import { useGameStore } from '../../../store/gameStore';

export function KillBoard() {
  const players = useGameStore(state => state.players);
  const feedEvents = useGameStore(state => state.feedEvents);
  
  const { alive, dead, underAttack } = useKillBoard(players, feedEvents);
  const richest = alive[0];

  return (
    <div className="flex flex-col flex-grow min-h-0 overflow-hidden">
      <div className="p-5 flex justify-between items-center border-b border-app-border shrink-0">
         <div className="font-app-bold text-[14px] uppercase tracking-wide flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
          Kill Board
        </div>
        <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-wide">
          {alive.length} Alive
        </div>
      </div>

      <div className="flex-grow overflow-y-auto intel-scroll px-1 py-2 relative">
        {alive.length === 0 && dead.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
             <div className="text-app-muted text-[10px] font-app-bold uppercase tracking-[4px] leading-relaxed opacity-60">
               Waiting for first blood...
             </div>
             <div className="mt-4 w-12 h-[1px] bg-app-border animate-blockBlink"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {alive.map((p, i) => (
              <KillBoardRow 
                key={p.id}
                player={p}
                rank={i + 1}
                isUser={p.isUser}
                isRichest={p.id === richest?.id}
                isUnderAttack={underAttack.has(p.handle)}
              />
            ))}

            {dead.length > 0 && (
              <>
                <div className="text-center py-4 text-[9px] uppercase font-app-bold text-[#333] tracking-[6px]">
                  Eliminated
                </div>
                {dead.map((p) => (
                  <KillBoardRow 
                    key={p.id}
                    player={p}
                    isUser={p.isUser}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

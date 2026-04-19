import React from 'react';
import { useKillLog } from '../../../hooks/useKillLog';
import { useGameStore } from '../../../store/gameStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function KillLog() {
  const feedEvents = useGameStore(state => state.feedEvents);
  const log = useKillLog(feedEvents);

  return (
    <div className="h-[220px] shrink-0 flex flex-col border-t border-app-border bg-[#050505]">
       <div className="p-4 flex justify-between items-center border-b border-[#1a1a1a] shrink-0">
         <div className="font-app-bold text-[12px] uppercase tracking-widest flex items-center gap-2 before:content-[''] before:block before:w-1.5 before:h-1.5 before:bg-[#444]">
          Kill Log
        </div>
      </div>

      <div className="flex-grow overflow-y-auto intel-scroll p-4">
        {log.length > 0 ? (
          <div className="flex flex-col gap-2">
            {log.map((e) => (
              <div key={e.id} className="text-[10px] font-app-mono leading-tight flex flex-wrap gap-x-2">
                <span className="text-app-muted shrink-0">{formatTime(e.timestamp)}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white">{e.text}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[10px] text-app-muted uppercase font-app-bold tracking-widest italic opacity-30">
            No Eliminations Yet
          </div>
        )}
      </div>
    </div>
  );
}

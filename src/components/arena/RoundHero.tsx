import React from 'react';
import { useRoundHero } from '../../hooks/useRoundHero';
import { LoadoutPanel } from '../loadout/LoadoutPanel';

export function RoundHero({ onConfirmLoadout }: { onConfirmLoadout: (config: any) => void }) {
  const hero = useRoundHero();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (hero.isLoadoutOpen) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-app-bg animate-[fadeIn_0.2s_ease-out_forwards] border-b border-app-border">
        <LoadoutPanel 
          onClose={() => hero.setIsLoadoutOpen(false)} 
          onConfirm={(config) => {
            hero.setIsLoadoutOpen(false);
            onConfirmLoadout(config);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="w-full border-b border-app-border bg-[#111] flex flex-col items-center justify-center py-6 md:py-8 px-4 shrink-0 text-center relative overflow-hidden h-[40%] min-h-[250px] transition-all duration-300">
      {/* Background brutalist element */}
      <div className="absolute top-[-20px] right-[-20px] p-4 opacity-[0.03] pointer-events-none select-none">
        <div className="text-[180px] font-app-bold leading-none tracking-tighter">843</div>
      </div>

      <div className="font-app-bold text-[20px] md:text-[28px] text-white uppercase tracking-widest mb-6 relative z-10">
        RUMBLEX ROUND #{hero.roundNumber}
      </div>

      <div className="mb-6 relative z-10 flex flex-col items-center">
        <div className="text-[10px] text-app-muted uppercase tracking-widest mb-1 font-app-bold">STARTS IN</div>
        <div className="font-app-mono text-[48px] md:text-[64px] text-app-accent leading-none highlight-text shadow-sm">
          {formatTime(hero.timeRemaining)}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 md:gap-12 mb-6 relative z-10 border border-[#333] p-4 bg-[#0a0a0a]">
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mb-1">ENTRY FEE</div>
          <div className="font-app-bold text-[18px] text-white">{hero.entryFee} MON</div>
        </div>
        <div className="w-px h-10 bg-[#333]"></div>
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mb-1">PRIZE POOL</div>
          <div className="font-app-bold text-[24px] text-app-accent">{hero.prizePool} MON</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8 relative z-10 flex-wrap">
        <span className="text-[10px] uppercase font-app-bold tracking-widest px-3 py-1 border border-[#333] text-app-muted bg-[#1a1a1a]">⚔ KILL TO LOOT ALL</span>
        <span className="text-[10px] uppercase font-app-bold tracking-widest px-3 py-1 border border-[#333] text-app-muted bg-[#1a1a1a]">✓ SURVIVE TO CASH OUT</span>
      </div>

      <button 
         onClick={() => hero.setIsLoadoutOpen(true)} 
         className="bg-app-accent text-[#000] font-app-bold text-[16px] py-4 px-12 md:px-20 uppercase tracking-widest hover:bg-white transition-colors relative z-10 mb-4"
      >
        Play to Win
      </button>

      <div className="text-[10px] text-app-muted font-app-mono tracking-wide relative z-10">
        CHAMPION: 75% | RUNNER-UP: 10% | THIRD: 5% | S1 PRIZE: 5% | PROTOCOL: 5%
      </div>
    </div>
  );
}

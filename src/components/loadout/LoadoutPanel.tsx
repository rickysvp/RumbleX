import React, { useEffect, useState } from 'react';
import { RoundsSelector } from './RoundsSelector';
import { StrategyCards } from './StrategyCards';
import { SkillCards } from './SkillCards';
import { ItemCards } from './ItemCards';
import { CostSummary } from './CostSummary';
import { useLoadout } from '../../hooks/useLoadout';

export function LoadoutPanel({ roundNumber, readOnly, onClose, onConfirm }: { roundNumber?: number, readOnly?: boolean, onClose: () => void, onConfirm: (config: any) => void }) {
  const loadout = useLoadout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div 
      className={`bg-app-bg transition-opacity duration-100 ease-out flex flex-col relative w-full h-full overflow-hidden ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex justify-between items-center p-4 md:px-[30px] md:py-[20px] border-b border-app-border shrink-0 bg-[#0a0a0a] z-10">
        <div>
          <h2 className="font-app-bold text-[14px] md:text-[18px] tracking-widest uppercase text-white before:content-[''] before:block before:w-[8px] before:h-[8px] before:bg-app-accent before:mr-3 before:inline-block">
             {readOnly ? '⚙ YOUR LOADOUT' : '⚙ CONFIGURE LOADOUT'} — ROUND #{roundNumber || '843'}
          </h2>
          <p className="text-app-muted text-[10px] md:text-[12px] mt-1 font-app-mono italic ml-2 md:ml-5">
            {readOnly ? 'Locked for current entry.' : 'Same loadout repeats every queued round.'}
          </p>
        </div>
        <button onClick={() => { setMounted(false); setTimeout(onClose, 100); }} className="px-4 py-2 md:px-6 md:py-3 border border-app-border text-app-muted hover:border-white hover:text-white font-app-mono text-[12px] md:text-[14px] bg-[#111] transition-colors">
          {readOnly ? '✕ CLOSE' : '✕ CANCEL'}
        </button>
      </div>

      {readOnly && (
        <div className="bg-app-accent py-2 px-10 flex items-center justify-center gap-3 shrink-0">
           <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
           <span className="text-black font-app-bold text-[10px] uppercase tracking-[2px]">Locked · Round starts in [Check Main View]</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row flex-grow min-h-0 overflow-hidden">
        {/* Left: Selection Area */}
        <div className="flex-grow overflow-y-auto px-4 md:px-[30px] pt-[30px] pb-[60px] custom-scrollbar">
          <StrategyCards selected={loadout.strategy} onSelect={loadout.setStrategy} readOnly={readOnly} />
          <SkillCards selected={loadout.skill} onSelect={loadout.setSkill} readOnly={readOnly} />
          <ItemCards selected={loadout.item} onSelect={loadout.setItem} readOnly={readOnly} />
        </div>

        {/* Right: Control Center */}
        <div className="w-full lg:w-[380px] shrink-0 border-l border-app-border bg-[#050505] flex flex-col overflow-y-auto">
          <div className="p-4 md:p-[30px] flex-grow">
            <RoundsSelector rounds={loadout.rounds} setRounds={loadout.setRounds} readOnly={readOnly} />
          </div>
          
          <div className="mt-auto">
            <CostSummary 
              rounds={loadout.rounds}
              skillPrice={loadout.skillPrice}
              itemPrice={loadout.itemPrice}
              totalCost={loadout.totalCost}
              startingMON={loadout.startingMON}
              entryFeePerRound={loadout.entryFeePerRound}
              config={loadout.config}
              readOnly={readOnly}
              onConfirm={() => {
                  setMounted(false);
                  setTimeout(() => onConfirm({ ...loadout.config }), 100);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

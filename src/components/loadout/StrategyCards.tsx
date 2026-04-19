import React from 'react';
import { StrategyId } from '../../store/types';
import { STRATEGIES } from '../../data/strategies';

export function StrategyCards({ selected, onSelect, readOnly }: { selected: StrategyId, onSelect: (s: StrategyId) => void, readOnly?: boolean }) {
  return (
    <div className="mb-10">
      <div className="text-[11px] text-app-muted uppercase font-app-bold mb-1 tracking-widest">FREE STRATEGY</div>
      <div className="text-[12px] text-app-muted mb-4 font-app-mono italic">Choose one. Free. Affects event probabilities.</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STRATEGIES.map(s => {
          const isActive = selected === s.id;
          return (
             <button 
                key={s.id}
                onClick={() => !readOnly && onSelect(s.id)}
                disabled={readOnly}
                className={`group p-5 border text-left flex flex-col justify-between transition-colors min-h-[140px] ${
                  readOnly ? 'cursor-default' : ''
                } ${
                  isActive 
                    ? 'border-app-accent bg-[#1a1c00]' 
                    : `border-app-border bg-[#111] ${readOnly ? 'opacity-40' : 'hover:border-[#444]'}`
                }`}
             >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`font-app-bold text-[16px] uppercase tracking-wide ${isActive ? 'text-app-accent' : 'text-white group-hover:text-gray-200'}`}>{s.name}</span>
                    <span className="text-[10px] font-app-bold bg-[#222] text-app-muted px-2 py-1 tracking-widest">{s.tag}</span>
                  </div>
                  <div className="text-app-muted text-[13px] leading-relaxed font-app-mono">{s.description}</div>
                </div>
             </button>
          );
        })}
      </div>
    </div>
  );
}

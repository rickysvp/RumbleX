import React from 'react';
import { ItemId } from '../../store/types';
import { ITEMS } from '../../data/items';

export function ItemCards({ selected, onSelect, readOnly }: { selected: ItemId | null, onSelect: (s: ItemId | null) => void, readOnly?: boolean }) {
  return (
    <div className="mb-10">
      <div className="text-[11px] text-app-muted uppercase font-app-bold mb-1 tracking-widest">ITEM SLOT</div>
      <div className="text-[12px] text-app-muted mb-4 font-app-mono italic">Choose one paid item. One use per round.</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={() => !readOnly && onSelect(null)}
          disabled={readOnly}
          className={`p-5 border text-left transition-colors min-h-[160px] flex flex-col ${
            readOnly ? 'cursor-default' : ''
          } ${
            selected === null 
              ? 'border-app-accent bg-[#1a1c00]' 
              : `border-app-border bg-[#111] ${readOnly ? 'opacity-40' : 'hover:border-[#444]'}`
          }`}
        >
          <div className={`font-app-bold text-[16px] uppercase tracking-wide mb-3 ${selected === null ? 'text-app-accent' : 'text-white'}`}>NO ITEM</div>
          <div className="text-app-muted text-[13px] font-app-mono">Free. No special effect.</div>
          <div className="mt-auto pt-4 text-app-muted font-app-mono text-[12px]">+0.00 MON / round</div>
        </button>
        
        {ITEMS.map(i => {
          const isActive = selected === i.id;
          return (
            <button 
              key={i.id}
              onClick={() => !readOnly && onSelect(i.id)}
              disabled={readOnly}
              className={`group p-5 border text-left flex flex-col justify-between transition-colors min-h-[160px] ${
                readOnly ? 'cursor-default' : ''
              } ${
                isActive 
                  ? 'border-app-accent bg-[#1a1c00]' 
                  : `border-app-border bg-[#111] ${readOnly ? 'opacity-40' : 'hover:border-[#444]'}`
              }`}
            >
              <div>
                 <div className={`font-app-bold text-[16px] uppercase tracking-wide mb-2 ${isActive ? 'text-app-accent' : 'text-white group-hover:text-gray-200'}`}>{i.name}</div>
                 <div className="text-white text-[13px] mb-2 font-app-mono">{i.effect}</div>
              </div>
              <div className="mt-4 text-app-accent font-app-mono text-[12px]">+{i.price.toFixed(2)} MON / round</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

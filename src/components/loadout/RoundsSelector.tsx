import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function RoundsSelector({ rounds, setRounds, readOnly }: { rounds: number, setRounds: (r: number) => void, readOnly?: boolean }) {
  const chips = [1, 3, 5, 10];
  
  const increment = () => setRounds(Math.min(rounds + 1, 50));
  const decrement = () => setRounds(Math.max(rounds - 1, 1));
  
  return (
    <div className="mb-0">
      <div className="text-[10px] text-app-muted uppercase font-app-bold mb-4 tracking-widest border-b border-[#222] pb-2">Queued Rounds</div>
      
      {readOnly ? (
        <div className="py-8 flex flex-col items-center justify-center border border-dashed border-[#222] bg-[#0a0a0a]">
           <span className="text-app-accent font-app-bold text-[24px] leading-none mb-1">{rounds}</span>
           <span className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest">Round(s) Queued</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {chips.map(c => (
              <button 
                key={c}
                onClick={() => setRounds(c)}
                className={`py-3 border font-app-mono text-[13px] transition-all ${
                  rounds === c 
                    ? 'bg-app-accent border-app-accent text-[#000] font-bold' 
                    : 'bg-transparent border-[#222] text-app-muted hover:border-[#444] hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
            <div className="flex items-center bg-[#111] border border-[#222]">
              <input 
                type="number" 
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                className="flex-1 bg-transparent px-2 py-3 font-app-mono text-[14px] text-white focus:outline-none text-center"
                min={1}
                max={50}
              />
              <div className="flex flex-col pr-1">
                <button 
                  onClick={increment}
                  className="text-app-muted hover:text-white transition-colors p-0.5"
                >
                  <ChevronUp size={12} />
                </button>
                <button 
                  onClick={decrement}
                  className="text-app-muted hover:text-white transition-colors p-0.5"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className="text-[11px] text-app-muted mt-4 font-app-mono italic leading-snug">
        Configure once. Your Agent will automatically re-enter until the queue is empty.
      </div>
    </div>
  );
}

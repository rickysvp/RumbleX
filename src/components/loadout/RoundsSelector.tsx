import React from 'react';

export function RoundsSelector({ rounds, setRounds, readOnly }: { rounds: number, setRounds: (r: number) => void, readOnly?: boolean }) {
  const chips = [1, 3, 5, 10];
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
          <div className="grid grid-cols-4 gap-2 mb-4">
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
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-[10px] text-app-muted uppercase font-app-bold">Custom:</span>
            </div>
            <input 
              type="number" 
              value={rounds}
              onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
              className="w-full bg-[#111] border border-[#222] pl-[60px] pr-4 py-3 font-app-mono text-[14px] text-white focus:outline-none focus:border-app-accent"
              min={1}
              max={50}
            />
          </div>
        </>
      )}
      
      <div className="text-[11px] text-app-muted mt-4 font-app-mono italic leading-snug">
        Configure once. Your Agent will automatically re-enter until the queue is empty.
      </div>
    </div>
  );
}

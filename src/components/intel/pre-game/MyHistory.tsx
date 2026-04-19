import React from 'react';
import { useGameStore } from '../../../store/gameStore';
import { useWalletStore } from '../../../store/walletStore';
import { mockWallet } from '../../../lib/mockWallet';

export function MyHistory() {
  const { status: walletStatus } = useWalletStore();
  const userHistory = useGameStore(state => state.userHistory || []);
  const userStats = useGameStore(state => state.userStats);
  const queueRemaining = useGameStore(state => state.userLoadout?.queueRemaining || 0);
  const currentRound = useGameStore(state => state.roundNumber);

  const isConnected = walletStatus === "connected";

  return (
    <div className="p-5 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-widest mb-5 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        My History
      </div>

      {!isConnected ? (
        <div className="py-8 px-4 border border-dashed border-[#222] bg-[#050505] flex flex-col items-center justify-center text-center">
          <div className="text-[10px] text-app-muted font-app-mono uppercase tracking-[2px] mb-4">Connection Required to view history</div>
          <button 
            onClick={mockWallet.connect}
            className="w-full bg-app-accent text-black font-app-bold text-[12px] py-3 uppercase tracking-widest hover:bg-white transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {/* Queued Rounds Visualizer */}
            {queueRemaining > 0 && Array.from({ length: Math.min(queueRemaining, 3) }).map((_, i) => (
               <div key={`queued-${i}`} className="grid grid-cols-[40px_60px_1fr_80px] gap-2 items-center py-1 opacity-50">
                 <div className="text-[11px] font-app-mono text-app-muted">#{currentRound + i + 1}</div>
                 <div className="text-[10px] font-app-bold tracking-wider text-[#666]">QUEUED</div>
                 <div className="text-[11px] font-app-mono text-right pr-2 text-[#666]">---</div>
                 <div className="text-right">
                   <span className="inline-block bg-[#111] border border-[#222] text-[#444] text-[8px] uppercase font-app-bold px-2 py-0.5 tracking-tight truncate w-full">
                     READY
                   </span>
                 </div>
               </div>
            ))}

            {userHistory.map((h) => (
              <div key={h.roundNumber} className="grid grid-cols-[40px_60px_1fr_80px] gap-2 items-center py-1">
                <div className="text-[11px] font-app-mono text-app-muted">#{h.roundNumber}</div>
                <div className={`text-[10px] font-app-bold tracking-wider uppercase ${h.result === 'win' ? 'text-app-accent' : 'text-[#FF4444]'}`}>{h.result}</div>
                <div className={`text-[11px] font-app-mono text-right pr-2 ${h.monDelta >= 0 ? 'text-app-accent' : 'text-[#FF4444]'}`}>
                  {h.monDelta > 0 ? '+' : ''}{h.monDelta.toFixed(1)} MON
                </div>
                <div className="text-right">
                  <span className="inline-block bg-[#111] border border-[#222] text-app-muted text-[8px] uppercase font-app-bold px-2 py-0.5 tracking-tight truncate w-full">
                    {h.skill ? h.skill.replace(/_/g, ' ') : 'NO SKILL'}
                  </span>
                </div>
              </div>
            ))}

            {userHistory.length === 0 && queueRemaining === 0 && (
               <div className="text-[10px] font-app-mono text-app-muted italic py-4">No recent activity.</div>
            )}
          </div>

          {userStats && (
            <div className="mt-6 flex justify-between items-center text-[10px] text-app-muted font-app-mono uppercase tracking-widest bg-[#050505] p-2 border border-[#1a1a1a]">
              <div>{userStats.wins}W / {userStats.games}G</div>
              <div className={userStats.netMon >= 0 ? 'text-app-accent' : 'text-[#FF4444]'}>
                Net: {userStats.netMon >= 0 ? '+' : ''}{userStats.netMon.toFixed(1)} MON
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

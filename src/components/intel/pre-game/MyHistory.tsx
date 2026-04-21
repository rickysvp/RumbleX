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
    <div className="p-4 border-b border-app-border">
      <div className="font-app-bold text-[14px] uppercase tracking-wide mb-3 flex items-center gap-2 before:content-[''] before:block before:w-2 before:h-2 before:bg-app-accent">
        My History
      </div>

      {!isConnected ? (
        <div className="py-6 px-4 border border-dashed border-[#222] bg-[#050505] flex flex-col items-center justify-center text-center">
          <div className="text-[10px] text-app-muted font-app-bold uppercase tracking-[2px] mb-3">Connection Required</div>
          <button 
            onClick={mockWallet.connect}
            className="w-full bg-app-accent text-black font-app-bold text-[11px] py-2 uppercase tracking-wide hover:bg-white transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
            {/* Queued Rounds Visualizer */}
            {queueRemaining > 0 && Array.from({ length: Math.min(queueRemaining, 3) }).map((_, i) => (
               <div key={`queued-${i}`} className="flex items-center justify-between py-1 opacity-50">
                 <div className="text-[10px] font-app-bold text-app-muted">#{currentRound + i + 1}</div>
                 <div className="text-[9px] font-app-bold tracking-wider text-[#666]">QUEUED</div>
                 <div className="text-[10px] font-app-bold text-right text-[#666]">---</div>
                 <div className="text-right">
                   <span className="inline-block bg-[#111] border border-[#222] text-[#444] text-[7px] uppercase font-app-bold px-1.5 py-0.5 tracking-tight">
                     READY
                   </span>
                 </div>
               </div>
            ))}

            {userHistory.slice(0, 5).map((h) => (
              <div key={h.roundNumber} className="flex items-center justify-between py-1">
                <div className="text-[10px] font-app-bold text-app-muted w-10">#{h.roundNumber}</div>
                <div className={`text-[9px] font-app-bold tracking-wider uppercase w-12 ${h.result === 'win' ? 'text-app-accent' : 'text-[#FF4444]'}`}>{h.result}</div>
                <div className={`text-[10px] font-app-bold text-right flex-1 ${h.monDelta >= 0 ? 'text-app-accent' : 'text-[#FF4444]'}`}>
                  {h.monDelta > 0 ? '+' : ''}{h.monDelta.toFixed(1)} MON
                </div>
              </div>
            ))}

            {userHistory.length === 0 && queueRemaining === 0 && (
               <div className="text-[10px] font-app-bold text-app-muted italic py-3">No recent activity.</div>
            )}
          </div>

          {userStats && (
            <div className="mt-3 flex justify-between items-center text-[9px] text-app-muted font-app-bold uppercase tracking-wide bg-[#050505] p-2 border border-[#1a1a1a]">
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

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LoadoutPanel } from '../loadout/LoadoutPanel';
import { useGameStore } from '../../store/gameStore';
import { useWalletStore } from '../../store/walletStore';
import { mockWallet } from '../../lib/mockWallet';
import { CheckCircle2, Layout, PlusCircle } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function EntryOpenStage() {
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const { roundNumber, timeRemaining, entryFee, prizePool, queueUserLoadout, userLoadout } = useGameStore();
  const { status: walletStatus } = useWalletStore();

  const isConnected = walletStatus === "connected";
  const isQueued = userLoadout.queued && userLoadout.queueRemaining > 0;

  let userView: 'queued' | 'connected' | 'disconnected' = 'disconnected';
  if (isQueued) userView = 'queued';
  else if (isConnected) userView = 'connected';

  const openLoadout = (readonly: boolean) => {
    setIsReadOnly(readonly);
    setIsLoadoutOpen(true);
  };

  const totalCost = (entryFee + (userLoadout.skill ? 1.5 : 0) + (userLoadout.item ? 1 : 0)) * (userLoadout.rounds || 1);

  return (
    <>
      <div className="h-full w-full flex flex-col justify-center p-4 sm:p-6 md:p-12 overflow-y-auto custom-scrollbar animate-[fadeIn_0.15s_ease-in-out_forwards]">

        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-16 z-10 w-full max-w-6xl mx-auto">

          {/* LEFT COLUMN: HERO TIMER */}
          <div className="flex flex-col justify-center items-center md:items-start flex-1 text-center md:text-left">
            <div className="text-white font-app-bold text-[12px] sm:text-[14px] uppercase tracking-[4px] sm:tracking-[6px] mb-3 sm:mb-5">
              ROUND #{roundNumber}
            </div>
            
            <div 
              className={`font-app-bold text-[48px] sm:text-[60px] md:text-[100px] leading-[0.85] tracking-[-0.05em] mb-4 sm:mb-6 drop-shadow-[0_0_30px_rgba(235,255,0,0.15)] ${
                timeRemaining <= 10 ? 'text-app-danger animate-pulse-urgent' : 'text-app-accent'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(timeRemaining)}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTION ZONE */}
          <div className="flex flex-col justify-center w-full md:w-[400px] shrink-0">
            
            {/* STATS HUD BOX */}
            <div className="bg-[#050505] border-2 border-app-border p-4 sm:p-6 mb-4 sm:mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-app-accent/5 to-transparent pointer-events-none" />
               
               <div className="grid grid-cols-2 gap-4 sm:gap-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[8px] sm:text-[9px] text-app-accent uppercase font-app-bold tracking-[2px] sm:tracking-[3px] mb-1 sm:mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-app-accent" /> Entry Fee
                    </span>
                    <span className="text-[22px] sm:text-[28px] font-app-bold text-white leading-none">{entryFee.toFixed(0)}<span className="text-[12px] sm:text-[14px] text-app-muted ml-1">MON</span></span>
                  </div>
                  <div className="flex flex-col border-l border-app-border pl-4 sm:pl-8">
                    <span className="text-[8px] sm:text-[9px] text-app-accent uppercase font-app-bold tracking-[2px] sm:tracking-[3px] mb-1 sm:mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-app-accent" /> Prize Pool
                    </span>
                    <span className="text-[22px] sm:text-[28px] font-app-bold text-white leading-none whitespace-nowrap">{prizePool.toFixed(0)}<span className="text-[12px] sm:text-[14px] text-app-muted ml-1">MON</span></span>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex flex-col gap-3">
              {userView === 'queued' ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-4 sm:p-5 flex items-center justify-center gap-2 sm:gap-3">
                    <CheckCircle2 size={20} className="sm:w-6 sm:h-6" />
                    <span className="font-app-bold text-[16px] sm:text-[20px] uppercase tracking-[3px] sm:tracking-[4px]">Ready to Play</span>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-app-border border border-app-border">
                    <div className="bg-[#050505] p-3 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">Rounds Queued</span>
                      <span className="text-[14px] text-white font-app-mono">{userLoadout.queueRemaining}</span>
                    </div>
                    <div className="bg-[#050505] p-3 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">Strategy</span>
                      <span className="text-[12px] text-white font-app-mono truncate max-w-full">{userLoadout.strategy.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => openLoadout(true)}
                    className="w-full bg-[#111] border border-app-border hover:border-white hover:bg-[#1a1a1a] text-white py-3 sm:py-4 text-[12px] sm:text-[13px] font-app-bold uppercase tracking-[2px] transition-all"
                  >
                    View Config
                  </button>
                </div>
              ) : userView === 'connected' ? (
                <button 
                  onClick={() => openLoadout(false)}
                  className="group relative bg-app-accent text-black font-app-bold text-[18px] sm:text-[20px] py-5 sm:py-6 px-8 sm:px-12 uppercase tracking-[2px] sm:tracking-[3px] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-[0_0_30px_rgba(235,255,0,0.3)]"
                >
                  <span className="relative z-10">Play to Win</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              ) : (
                <button 
                  onClick={mockWallet.connect}
                  className="group relative bg-app-accent text-black font-app-bold text-[16px] sm:text-[18px] py-5 sm:py-6 px-6 sm:px-8 uppercase tracking-[2px] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(235,255,0,0.3)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Connect Wallet
                  </span>
                </button>
              )}
              
            </div>
          </div>
        </div>

      </div>

      {isLoadoutOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.15s_ease-in-out_forwards] p-4">
          <div className="w-full max-w-6xl max-h-[90vh] bg-app-bg border border-app-border shadow-2xl overflow-hidden flex flex-col rounded-lg">
            <LoadoutPanel 
              roundNumber={roundNumber}
              readOnly={isReadOnly}
              onClose={() => setIsLoadoutOpen(false)}
              onConfirm={(config) => {
                setIsLoadoutOpen(false);
                queueUserLoadout(config);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

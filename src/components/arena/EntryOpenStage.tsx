import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LoadoutPanel } from '../loadout/LoadoutPanel';
import { useGameStore } from '../../store/gameStore';
import { useWalletStore } from '../../store/walletStore';
import { mockWallet } from '../../lib/mockWallet';
import { mockPass } from '../../lib/mockPass';
import { CheckCircle2, Layout, PlusCircle, ShieldAlert, Loader2, Wallet } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function EntryOpenStage() {
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  const { roundNumber, timeRemaining, entryFee, prizePool, queueUserLoadout, userLoadout } = useGameStore();
  const { status: walletStatus, hasRumbleXPass, passStatus, isMintingPass } = useWalletStore();

  const isConnected = walletStatus === "connected";
  const isQueued = userLoadout.queued && userLoadout.queueRemaining > 0;

  // Auto-check pass eligibility on connect
  useEffect(() => {
    if (isConnected && passStatus === "unknown") {
      mockPass.checkRumbleXPass();
    }
  }, [isConnected, passStatus]);

  let userView: 'queued' | 'disconnected' | 'checking_pass' | 'missing_pass' | 'eligible' = 'disconnected';
  if (isQueued) userView = 'queued';
  else if (!isConnected) userView = 'disconnected';
  else if (passStatus === 'unknown' || passStatus === 'checking') userView = 'checking_pass';
  else if (!hasRumbleXPass) userView = 'missing_pass';
  else userView = 'eligible';

  const openLoadout = (readonly: boolean) => {
    // Only allow if eligible or queued
    if (userView !== 'eligible' && userView !== 'queued' && !readonly) return;
    setIsReadOnly(readonly);
    setIsLoadoutOpen(true);
  };

  const totalCost = (entryFee + (userLoadout.skill ? 1.5 : 0) + (userLoadout.item ? 1 : 0)) * (userLoadout.rounds || 1);

  return (
    <>
      <div className="h-full w-full flex flex-col justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar animate-[fadeIn_0.15s_ease-in-out_forwards]">

        <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-8 z-10 w-full max-w-3xl mx-auto">

          {/* LEFT COLUMN: HERO TIMER */}
          <div className="flex flex-col justify-center items-center md:items-start flex-1 text-center md:text-left">
            <div className="text-white font-app-bold text-[10px] sm:text-[11px] uppercase tracking-[2px] sm:tracking-[3px] mb-1">
              ROUND #{roundNumber}
            </div>

            <div
              className={`font-app-bold text-[48px] sm:text-[56px] md:text-[72px] leading-[0.9] tracking-[-0.05em] drop-shadow-[0_0_20px_rgba(235,255,0,0.15)] ${
                timeRemaining <= 10 ? 'text-app-danger animate-pulse-urgent' : 'text-app-accent'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(timeRemaining)}
            </div>

          </div>

          {/* RIGHT COLUMN: ACTION ZONE */}
          <div className="flex flex-col justify-center w-full md:w-[280px] shrink-0">
            
            {/* STATS HUD BOX */}
            <div className="bg-[#050505] border border-app-border p-3 mb-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-app-accent/5 to-transparent pointer-events-none" />

               <div className="grid grid-cols-2 gap-3 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-app-accent uppercase font-app-bold tracking-[2px] mb-0.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-app-accent" /> Entry Fee
                    </span>
                    <span className="text-[20px] font-app-bold text-white leading-none">{entryFee.toFixed(0)}<span className="text-[10px] text-app-muted ml-1">MON</span></span>
                  </div>
                  <div className="flex flex-col border-l border-app-border pl-3">
                    <span className="text-[8px] text-app-accent uppercase font-app-bold tracking-[2px] mb-0.5 flex items-center gap-1">
                      <span className="w-1 h-1 bg-app-accent" /> Prize Pool
                    </span>
                    <span className="text-[20px] font-app-bold text-white leading-none whitespace-nowrap">{prizePool.toFixed(0)}<span className="text-[10px] text-app-muted ml-1">MON</span></span>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex flex-col gap-2">
              {userView === 'queued' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="bg-green-500/20 border border-green-500/40 text-green-400 p-2.5 sm:p-3 flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="font-app-bold text-[13px] sm:text-[14px] uppercase tracking-[2px]">Ready to Play</span>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-app-border border border-app-border">
                    <div className="bg-[#050505] p-2 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">Rounds Queued</span>
                      <span className="text-[12px] text-white font-app-mono">{userLoadout.queueRemaining}</span>
                    </div>
                    <div className="bg-[#050505] p-2 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">Strategy</span>
                      <span className="text-[10px] text-white font-app-mono truncate max-w-full">{userLoadout.strategy.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openLoadout(true)}
                    className="w-full bg-[#111] border border-app-border hover:border-white hover:bg-[#1a1a1a] text-white py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-app-bold uppercase tracking-[2px] transition-all"
                  >
                    View Config
                  </button>
                </div>
              ) : userView === 'disconnected' ? (
                <button
                  onClick={mockWallet.connect}
                  className="group relative bg-app-accent text-black font-app-bold text-[13px] sm:text-[14px] py-3 sm:py-4 px-4 sm:px-5 uppercase tracking-[2px] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(235,255,0,0.3)]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Wallet size={16} />
                    Connect Wallet
                  </span>
                </button>
              ) : userView === 'checking_pass' ? (
                <button
                  disabled
                  className="w-full bg-[#111] border border-app-border text-app-muted py-3 sm:py-4 text-[13px] sm:text-[14px] font-app-bold uppercase tracking-[2px] cursor-not-allowed flex flex-col items-center gap-1"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    Checking RumbleX Pass...
                  </div>
                  <span className="text-[8px] font-app-bold opacity-60 tracking-widest text-app-accent">Wallet connected. Verifying access.</span>
                </button>
              ) : userView === 'missing_pass' ? (
                <div className="flex flex-col gap-2">
                  {/* Requirement Info Panel */}
                  <div className="bg-app-accent/5 border border-app-accent/20 p-2 sm:p-2.5 animate-fadeIn">
                    <div className="text-app-accent font-app-bold text-[10px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <ShieldAlert size={10} /> RumbleX Pass Required
                    </div>
                    <p className="text-app-muted text-[9px] sm:text-[10px] leading-relaxed">
                      You need a RumbleX Pass NFT to register.
                    </p>
                  </div>

                  <button
                    onClick={() => mockPass.mintRumbleXPass()}
                    disabled={isMintingPass}
                    className="group relative bg-app-accent text-black font-app-bold text-[14px] sm:text-[16px] py-3 sm:py-4 px-5 sm:px-6 uppercase tracking-[2px] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-[0_0_15px_rgba(235,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isMintingPass ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Minting...
                        </>
                      ) : (
                        'Mint RumbleX Pass'
                      )}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openLoadout(false)}
                  className="group relative bg-app-accent text-black font-app-bold text-[14px] sm:text-[16px] py-3 sm:py-4 px-5 sm:px-6 uppercase tracking-[2px] transition-all hover:bg-white hover:scale-[1.02] active:scale-[0.98] overflow-hidden shadow-[0_0_15px_rgba(235,255,0,0.3)]"
                >
                  <span className="relative z-10">Play to Win</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
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

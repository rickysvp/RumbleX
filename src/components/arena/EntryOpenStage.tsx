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
  const isQueued = userLoadout.queued && userLoadout.queueRemaining >= 0;

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
      <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-12 overflow-y-auto custom-scrollbar animate-[fadeIn_0.15s_ease-in-out_forwards]">
        
        {/* HUD DECORATIONS (Corners) */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-app-accent/30 pointer-events-none" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-app-accent/30 pointer-events-none" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-app-accent/30 pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-app-accent/30 pointer-events-none" />

        {/* SYSTEM HEADER */}
        <div className="absolute top-6 left-12 flex items-center gap-4 opacity-50 z-20">
          <div className="w-1.5 h-1.5 rounded-full bg-app-accent animate-pulse" />
          <div className="font-app-mono text-[10px] uppercase tracking-[4px]">SYS.ROUND_{roundNumber.toString().padStart(3, '0')}</div>
          <div className="w-px h-3 bg-app-border mx-2" />
          <div className="font-app-mono text-[10px] uppercase tracking-[2px]">STATUS: OPEN_QUEUE</div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8 md:gap-16 z-10 w-full max-w-6xl mx-auto">
          
          {/* LEFT COLUMN: HERO TIMER */}
          <div className="flex flex-col justify-center items-center md:items-start flex-1 text-center md:text-left">
            <div className="text-app-muted font-app-bold text-[11px] uppercase tracking-[6px] mb-4 flex items-center gap-3">
              <span className="w-4 h-[1px] bg-app-muted" />
              ARENA LOCKDOWN
            </div>
            
            <div 
              className={`font-app-bold text-[60px] md:text-[100px] leading-[0.85] tracking-[-0.05em] mb-6 drop-shadow-[0_0_30px_rgba(235,255,0,0.15)] ${
                timeRemaining <= 10 ? 'text-app-danger animate-pulse-urgent' : 'text-app-accent'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(timeRemaining)}
            </div>

            <div className="flex items-center gap-6 mt-2">
               <div className="flex flex-col">
                  <span className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mb-1">DATA STORAGE</span>
                  <span className="font-app-mono text-[11px] text-white">MODIFIER: X1.2</span>
               </div>
               <div className="w-px h-6 bg-app-border" />
               <div className="flex flex-col">
                  <span className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mb-1">PROTOCOL</span>
                  <span className="font-app-mono text-[11px] text-white">V_0.8.4_STABLE</span>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION ZONE */}
          <div className="flex flex-col justify-center w-full md:w-[400px] shrink-0">
            
            {/* STATS HUD BOX */}
            <div className="bg-[#050505] border-2 border-app-border p-6 mb-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-app-accent/5 to-transparent pointer-events-none" />
               
               <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-app-accent uppercase font-app-bold tracking-[3px] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-app-accent" /> ENTRY_FEE
                    </span>
                    <span className="text-[28px] font-app-bold text-white leading-none">{entryFee.toFixed(0)}<span className="text-[14px] text-app-muted ml-1">MON</span></span>
                  </div>
                  <div className="flex flex-col border-l border-app-border pl-8">
                    <span className="text-[9px] text-app-accent uppercase font-app-bold tracking-[3px] mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-app-accent" /> PRIZE_POOL
                    </span>
                    <span className="text-[28px] font-app-bold text-white leading-none whitespace-nowrap">{prizePool.toFixed(0)}<span className="text-[14px] text-app-muted ml-1">MON</span></span>
                  </div>
               </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex flex-col gap-3">
              {userView === 'queued' ? (
                <div className="flex flex-col gap-3">
                  <div className="bg-app-accent text-black p-5 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(235,255,0,0.2)]">
                    <CheckCircle2 size={24} />
                    <span className="font-app-bold text-[20px] uppercase tracking-[6px]">AUTH_OK</span>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-app-border border border-app-border">
                    <div className="bg-[#050505] p-3 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">ROUNDS</span>
                      <span className="text-[14px] text-white font-app-mono">{userLoadout.queueRemaining + 1}</span>
                    </div>
                    <div className="bg-[#050505] p-3 flex flex-col items-center">
                      <span className="text-[8px] text-app-muted uppercase font-bold tracking-[2px]">STRATEGY</span>
                      <span className="text-[12px] text-white font-app-mono truncate max-w-full">{userLoadout.strategy.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => openLoadout(true)}
                    className="w-full bg-[#111] border border-app-border hover:border-white text-app-muted hover:text-white py-4 text-[11px] font-app-bold uppercase tracking-[4px] transition-all"
                  >
                    [ CONFIG_VIEW ]
                  </button>
                </div>
              ) : userView === 'connected' ? (
                <button 
                  onClick={() => openLoadout(false)}
                  className="group relative bg-app-accent text-black font-app-bold text-[18px] py-6 px-12 uppercase tracking-[6px] transition-all hover:bg-white overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-black" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-black" />
                  <span className="relative z-10">PLAY_INITIATE</span>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                </button>
              ) : (
                <button 
                  onClick={mockWallet.connect}
                  className="bg-[#111] border-2 border-app-accent/30 text-app-accent font-app-bold text-[14px] md:text-[16px] py-6 px-8 uppercase tracking-[3px] hover:bg-app-accent hover:text-black transition-all"
                >
                  CONNECT_IDENTITY_KEY
                </button>
              )}
              
              <div className="flex justify-between items-center px-2 opacity-30 mt-2">
                 <div className="font-app-mono text-[8px] tracking-widest uppercase">ENCRYPTED_SIGN_REQUIRED</div>
                 <div className="font-app-mono text-[8px] tracking-widest uppercase">REV: 02</div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER DISCLAIMER */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between items-end opacity-20 pointer-events-none font-app-mono">
          <div className="text-[9px] uppercase tracking-[2px] max-w-xs leading-loose">
            CHAMPION: 75% | RUNNER-UP: 10% | THIRD: 5% | SEASON_1: 5% | PROTOCOL_FEES: 5%
          </div>
          <div className="text-[12px] uppercase tracking-[8px] font-app-bold">RUMBLEX_CORP</div>
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

import React, { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { mockWallet } from '../../lib/mockWallet';
import { claimAll } from '../../lib/claimActions';
import { RefreshCcw, Copy, Check, LogOut } from 'lucide-react';

export function UserBlock() {
  const {
    status,
    address,
    monBalance,
    hasRumbleXPass,
    passStatus,
    error,
    isRefreshing,
    addressFull,
    claimableMon,
    isClaimingAll,
    dataError,
    isStale,
    dataSource,
  } = useWalletStore();
  const [copied, setCopied] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(monBalance);
  const [loadingBlocks, setLoadingBlocks] = useState('░░░');

  // Staggered loading blocks
  useEffect(() => {
    if (status !== 'connecting') return;
    const blocks = ['█░░', '░█░', '░░█'];
    let i = 0;
    const interval = setInterval(() => {
      setLoadingBlocks(blocks[i % 3]);
      i++;
    }, 250);
    return () => clearInterval(interval);
  }, [status]);

  // Balance interpolation
  useEffect(() => {
    if (displayBalance === monBalance) return;
    const duration = 600;
    const start = displayBalance;
    const end = monBalance;
    const startTime = performance.now();
    let rafId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVal = start + (end - start) * progress;
      setDisplayBalance(currentVal);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [monBalance]);

  const handleCopy = () => {
    if (addressFull) {
      navigator.clipboard.writeText(addressFull);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (status === "disconnected" || status === "error") {
      return (
        <div className="p-4 border-b border-app-border">
          <button 
            onClick={mockWallet.connect}
            className={`w-full font-app-bold py-4 text-[13px] uppercase tracking-widest transition-all ${
              status === "error" 
              ? 'bg-[#111] border border-app-danger/50 text-app-danger hover:bg-app-danger/10' 
              : 'bg-app-accent text-black hover:bg-white active:translate-x-[1px] active:translate-y-[1px]'
            }`}
          >
            {status === "error" ? "Retry Connection" : "Connect Wallet"}
          </button>
          {status === "error" && (
            <div className="mt-2 text-center text-[9px] font-app-mono text-app-danger uppercase tracking-widest opacity-70">
              Err: {error || "USER_REJECTED"}
            </div>
          )}
        </div>
      );
  }

  if (status === "connecting") {
    return (
      <div className="p-5 border-b border-app-border">
        <div className="w-full bg-[#111] border border-[#222] text-app-accent font-app-bold py-4 text-[13px] uppercase tracking-widest text-center flex items-center justify-center gap-4">
          <span className="animate-pulse">Connecting</span>
          <span className="font-app-mono tracking-[4px]">{loadingBlocks}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border-b border-app-border shrink-0 animate-[fadeIn_0.3s_ease-out]">
      {/* Row 1: Avatar + Handle */}
      <div className="flex items-center gap-4 mb-4">
         <div className="w-10 h-10 bg-[#1a1a1a] border border-[#333] flex items-center justify-center font-app-bold text-app-accent text-[16px] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
           P1
         </div>
         <div className="flex flex-col">
           <div className="font-app-bold tracking-tight text-white text-[16px] leading-none mb-1.5 flex items-center gap-2">
             PILOT_01
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
           </div>
           <div>
             <span className="inline-block bg-app-accent/10 text-app-accent text-[9px] uppercase font-app-bold px-2 py-1 tracking-widest border border-app-accent/20 leading-none">
               Rank: Elite
             </span>
           </div>
         </div>
      </div>
      
      {/* Row 2: Balance */}
      <div className="mb-4 bg-[#0a0a0a] border border-[#1a1a1a] p-3 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>MON Balance</span>
            {(isStale || dataSource === "chain") && (
              <span className="text-[8px] text-yellow-400 border border-yellow-500/30 px-1 py-0.5">STALE</span>
            )}
          </div>
          <button 
            onClick={mockWallet.refreshBalance}
            className={`transition-all ${isRefreshing ? 'animate-spin text-app-accent' : 'hover:text-white'}`}
          >
            <RefreshCcw size={10} />
          </button>
        </div>
        <div className="text-[20px] font-app-bold text-app-accent leading-none flex items-baseline gap-1">
          <span className="animate-val-update">{displayBalance.toFixed(1)}</span>
          <span className="text-[12px] opacity-60">MON</span>
        </div>
      </div>

      {/* Row 2.5: Claimable */}
      <div className="mb-4 bg-[#0a0a0a] border border-[#1a1a1a] p-3 shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="text-[9px] text-app-muted font-app-bold uppercase tracking-widest mb-1">
          Claimable MON
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[16px] font-app-bold text-app-accent leading-none">
            {claimableMon}
          </div>
          <button
            onClick={() => claimAll().catch(() => undefined)}
            disabled={isClaimingAll || Number(claimableMon) <= 0}
            className="bg-app-accent text-black text-[9px] uppercase font-app-bold px-2.5 py-1 tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            {isClaimingAll ? "Claiming..." : "Claim All"}
          </button>
        </div>
      </div>

      {/* Row 3: Wallet + Pass */}
      <div className="flex items-center justify-between mb-4">
         <div className="font-app-mono text-[11px] text-[#555] tracking-tight flex items-center gap-2">
            {address}
            <button onClick={handleCopy} className="text-[#333] hover:text-white transition-colors">
              {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
            </button>
         </div>
         <div className="flex items-center">
            {passStatus === "checking" ? (
              <span className="text-app-accent/50 text-[9px] uppercase font-app-bold tracking-wider animate-pulse">
                Checking Pass...
              </span>
            ) : hasRumbleXPass ? (
              <span className="bg-app-accent text-black text-[9px] uppercase font-app-bold px-2 py-0.5 tracking-wider shadow-[0_0_15px_rgba(217,255,0,0.15)]">
                RumbleX Pass
              </span>
            ) : (
              <span className="text-[#444] text-[9px] uppercase font-app-bold tracking-wider">
                Pass Required
              </span>
            )}
         </div>
      </div>

      {/* Row 4: Logout */}
      <button 
        onClick={mockWallet.disconnect}
        className="text-[9px] font-app-bold text-app-muted uppercase tracking-[2px] hover:text-app-danger transition-colors flex items-center gap-2 group"
      >
        <LogOut size={10} className="group-hover:translate-x-0.5 transition-transform" /> Disconnect Wallet
      </button>
      {dataError && (
        <div className="mt-2 text-[9px] font-app-mono text-app-danger uppercase tracking-wide">
          {dataError}
        </div>
      )}
    </div>
  );
}

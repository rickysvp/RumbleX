import React, { useState, useEffect, useRef } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { mockWallet } from '../../lib/mockWallet';
import { claimAll } from '../../lib/claimActions';
import { Wallet, Menu, Copy, Check, LogOut, RefreshCcw, ChevronDown } from 'lucide-react';

interface TopBarProps {
  onMenuOpen: () => void;
  showMenu?: boolean;
}

export function TopBar({ onMenuOpen, showMenu = true }: TopBarProps) {
  const {
    address,
    addressFull,
    monBalance,
    isRefreshing,
    hasRumbleXPass,
    status,
    claimableMon,
    isClaimingAll,
    isStale,
    dataSource,
  } = useWalletStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(monBalance);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isConnected = status === 'connected';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = () => {
    if (addressFull) {
      navigator.clipboard.writeText(addressFull);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDisconnect = () => {
    mockWallet.disconnect();
    setShowDropdown(false);
  };

  // Loading blocks for connecting state
  const [loadingBlocks, setLoadingBlocks] = useState('░░░');
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

  return (
    <header className="h-[64px] bg-[#0a0a0a] border-b border-app-border flex items-center justify-between px-4 shrink-0 z-50">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-3">
        {showMenu && (
          <button 
            onClick={onMenuOpen} 
            className="p-2 -ml-2 text-app-muted hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        <img src="/rumblex.png" alt="RumbleX" className="h-8 object-contain" />
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center gap-4" ref={dropdownRef}>
        {!isConnected ? (
          <button
            onClick={mockWallet.connect}
            disabled={status === 'connecting'}
            className={`flex items-center gap-2 px-4 py-2 font-app-bold text-[13px] uppercase tracking-wider transition-colors ${
              status === 'error'
                ? 'bg-[#111] border border-app-danger/50 text-app-danger hover:bg-app-danger/10'
                : status === 'connecting'
                ? 'bg-[#333] text-app-muted cursor-not-allowed'
                : 'bg-app-accent text-black hover:bg-white'
            }`}
          >
            <Wallet size={16} />
            <span className="hidden sm:inline">
              {status === 'error' ? 'Retry' : status === 'connecting' ? 'Connecting...' : 'Connect'}
            </span>
          </button>
        ) : (
          <>
            {/* Balance & Pass Display */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#111] border border-app-border px-3 py-1.5">
                <span className="text-[9px] text-app-muted uppercase tracking-wider">BALANCE</span>
                <span className="text-[15px] font-app-bold text-app-accent">{displayBalance.toFixed(1)}</span>
                <span className="text-[11px] text-app-accent opacity-60">MON</span>
                {(isStale || dataSource === "chain") && (
                  <span className="text-[8px] text-yellow-400 border border-yellow-500/30 px-1 py-0.5">STALE</span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-[#111] border border-app-border px-3 py-1.5">
                <span className="text-[9px] text-app-muted uppercase tracking-wider">CLAIMABLE</span>
                <span className="text-[14px] font-app-bold text-app-accent">{claimableMon}</span>
              </div>
              {hasRumbleXPass && (
                <span className="bg-app-accent text-black text-[10px] uppercase font-app-bold px-2.5 py-1 tracking-wider">
                  PASS
                </span>
              )}
            </div>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-app-border hover:border-white transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[13px] font-app-mono text-app-muted">
                {formatAddress(address || '')}
              </span>
              <ChevronDown size={16} className={`text-app-muted transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-[60px] right-4 w-[260px] bg-[#0a0a0a] border border-app-border shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-[100]">
                {/* Balance */}
                <div className="p-4 border-b border-app-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-app-muted uppercase tracking-widest">Balance</span>
                    <button
                      onClick={mockWallet.refreshBalance}
                      className={`transition-all ${isRefreshing ? 'animate-spin text-app-accent' : 'hover:text-white'}`}
                    >
                      <RefreshCcw size={10} />
                    </button>
                  </div>
                  <div className="text-[28px] font-app-bold text-app-accent leading-none flex items-baseline gap-1">
                    <span>{displayBalance.toFixed(1)}</span>
                    <span className="text-[12px] opacity-60">MON</span>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="p-4 border-b border-app-border">
                  <div className="text-[9px] text-app-muted uppercase tracking-widest mb-2">Wallet Address</div>
                  <div className="flex items-center gap-2 bg-[#111] p-2.5">
                    <span className="font-app-mono text-[11px] text-[#888] flex-1 truncate">
                      {addressFull}
                    </span>
                    <button onClick={handleCopy} className="text-[#555] hover:text-white transition-colors shrink-0">
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* RumbleX Pass Status */}
                <div className="p-4 border-b border-app-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-app-muted uppercase tracking-widest">RumbleX Pass</span>
                    {hasRumbleXPass ? (
                      <span className="bg-app-accent text-black text-[9px] uppercase font-app-bold px-2 py-0.5 tracking-wider">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[#444] text-[9px] uppercase font-app-bold tracking-wider">
                        INACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Claim */}
                <div className="p-4 border-b border-app-border">
                  <div className="text-[9px] text-app-muted uppercase tracking-widest mb-2">Claimable MON</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[18px] font-app-bold text-app-accent">{claimableMon}</span>
                    <button
                      onClick={() => claimAll().catch(() => undefined)}
                      disabled={isClaimingAll || Number(claimableMon) <= 0}
                      className="bg-app-accent text-black text-[9px] uppercase font-app-bold px-2 py-1 tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    >
                      {isClaimingAll ? "Claiming..." : "Claim All"}
                    </button>
                  </div>
                </div>

                {/* Disconnect */}
                <button
                  onClick={handleDisconnect}
                  className="w-full p-4 text-[10px] font-app-bold text-app-muted uppercase tracking-[2px] hover:text-app-danger hover:bg-[#111] transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut size={12} /> Disconnect
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
}

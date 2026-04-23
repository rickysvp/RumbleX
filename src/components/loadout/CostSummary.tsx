import React, { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { hasJoinedRoundLocally, selectCurrentLiveRound, useRoundStore } from '../../store/roundStore';
import { mockTransaction, TxState } from '../../lib/mockTransaction';
import { mockWallet } from '../../lib/mockWallet';
import { mockPass } from '../../lib/mockPass';
import { joinRound } from '../../lib/roundActions';
import { isLiveSummaryMode } from '../../config/dataMode';
import { CheckCircle2, Wallet, Loader2 } from 'lucide-react';

interface Props {
  rounds: number;
  entryFeePerRound: number;
  skillPrice: number;
  itemPrice: number;
  totalCost: number;
  startingMON: number;
  onConfirm: () => void;
  config: any;
  readOnly?: boolean;
}

export function CostSummary({ rounds, entryFeePerRound, skillPrice, itemPrice, totalCost, startingMON, onConfirm, config, readOnly }: Props) {
  const { status: walletStatus, monBalance, hasRumbleXPass, passStatus, isMintingPass, activeRoundId } = useWalletStore();
  const currentLiveRound = useRoundStore(selectCurrentLiveRound);
  const joinTxStatus = useRoundStore((state) => state.joinTxStatus);
  const joiningRoundId = useRoundStore((state) => state.joiningRoundId);
  const joinError = useRoundStore((state) => state.joinError);
  const joinErrorCode = useRoundStore((state) => state.joinErrorCode);
  const localJoin = useRoundStore((state) => hasJoinedRoundLocally(state, currentLiveRound?.roundId));
  const [tx, setTx] = useState<TxState>({ status: "idle", txHash: null, error: null });

  const liveMode = isLiveSummaryMode();
  const liveRoundFee = currentLiveRound?.entryFeeMon ?? 0;
  const requiredCost = liveMode ? liveRoundFee : totalCost;
  const canAfford = monBalance >= requiredCost;
  const isConnected = walletStatus === "connected";
  const alreadyJoined = Boolean(currentLiveRound && (activeRoundId === currentLiveRound.roundId || localJoin));
  const roundJoinable = Boolean(currentLiveRound?.isJoinable);
  const isJoiningCurrentRound =
    Boolean(currentLiveRound) && joiningRoundId === currentLiveRound.roundId &&
    (joinTxStatus === "awaiting_signature" || joinTxStatus === "pending");

  const handleAction = async () => {
    if (!isConnected) {
      mockWallet.connect();
      return;
    }

    if (!hasRumbleXPass) {
      mockPass.mintRumbleXPass();
      return;
    }

    if (liveMode) {
      if (!currentLiveRound?.roundId) return;
      try {
        await joinRound(currentLiveRound.roundId);
        onConfirm();
      } catch {
        // join error is already mapped into roundStore for UI feedback.
      }
      return;
    }

    if (canAfford) {
      mockTransaction.submit(config, totalCost, (state) => {
        setTx(state);
        if (state.status === "confirmed") {
          onConfirm();
        }
      });
    }
  };

  const getButtonContent = () => {
    // 1. Wallet Disconnected
    if (!isConnected) {
      return {
        label: "Connect Wallet",
        sub: "Tap to connect",
        style: "bg-[#111] border border-[#333] text-app-muted hover:text-white",
        disabled: false,
        icon: <Wallet size={16} />
      };
    }

    // 2. Pass Status Unknown/Checking
    if (passStatus === "unknown" || passStatus === "checking") {
      return {
        label: "Checking RumbleX Pass...",
        sub: "Verifying access",
        style: "bg-[#111] border border-[#333] text-app-muted",
        disabled: true,
        icon: <Loader2 size={16} className="animate-spin" />
      };
    }

    // 3 & 4. Missing Pass / Minting Pass
    if (!hasRumbleXPass) {
      if (isMintingPass) {
        return {
          label: "Minting...",
          sub: "Confirm in wallet",
          style: "bg-app-accent/20 border border-app-accent/40 text-app-accent",
          disabled: true,
          icon: <Loader2 size={16} className="animate-spin" />
        };
      }
      return {
        label: "Mint RumbleX Pass",
        sub: "1 MON temporary price",
        style: "bg-app-accent text-black hover:bg-white",
        disabled: false,
        icon: <PlusCircleIcon /> // Using a fallback for PlusCircle as it might not be imported yet
      };
    }

    if (liveMode) {
      if (!currentLiveRound) {
        return {
          label: "No Live Round",
          sub: "Try refresh shortly",
          style: "bg-[#111] border border-[#333] text-app-muted",
          disabled: true
        };
      }

      if (alreadyJoined) {
        return {
          label: "Already Joined",
          sub: `Round #${currentLiveRound.roundId}`,
          style: "bg-green-500/20 border border-green-500/40 text-green-500",
          disabled: true,
          icon: <CheckCircle2 size={16} />
        };
      }

      if (!roundJoinable) {
        return {
          label: "Round Not Joinable",
          sub: currentLiveRound.isFull ? "Room is full" : `State: ${currentLiveRound.state}`,
          style: "bg-red-500/10 border border-red-500/30 text-red-500",
          disabled: true
        };
      }

      if (isJoiningCurrentRound) {
        return {
          label: joinTxStatus === "awaiting_signature" ? "Check Wallet..." : "Joining...",
          sub: joinTxStatus === "awaiting_signature" ? "Sign to confirm" : `Round #${currentLiveRound.roundId}`,
          style: "bg-app-accent/20 border border-app-accent/40 text-app-accent animate-pulse",
          disabled: true,
          icon: <Loader2 size={16} className="animate-spin" />
        };
      }

      if (!canAfford) {
        return {
          label: "Insufficient Balance",
          sub: `Need ${requiredCost.toFixed(2)} MON`,
          style: "bg-red-500/10 border border-red-500/30 text-red-500",
          disabled: true
        };
      }

      return {
        label: `Join Round #${currentLiveRound.roundId}`,
        sub: `Pay ${requiredCost.toFixed(2)} MON`,
        style: "bg-app-accent text-black hover:bg-white",
        disabled: false
      };
    }

    // 5. Insufficient Balance for mock round queue
    if (!canAfford) {
      return {
        label: "Insufficient Balance",
        sub: `Need ${totalCost.toFixed(1)} MON`,
        style: "bg-red-500/10 border border-red-500/30 text-red-500",
        disabled: true
      };
    }

    // 6. Normal Transaction Flow
    switch (tx.status) {
      case "awaiting_signature":
        return {
          label: "Check Wallet...",
          sub: "Sign to confirm",
          style: "bg-app-accent/20 border border-app-accent/40 text-app-accent animate-pulse",
          disabled: true,
          icon: <Loader2 size={16} className="animate-spin" />
        };
      case "pending":
        return {
          label: "Processing...",
          sub: `TX: ${tx.txHash?.substring(0, 8)}...`,
          style: "bg-[#111] border border-app-accent/20 text-app-accent",
          disabled: true,
          icon: <Loader2 size={16} className="animate-spin" />
        };
      case "confirmed":
        return {
          label: "Confirmed!",
          sub: "Redirecting...",
          style: "bg-green-500/20 border border-green-500/40 text-green-500",
          disabled: true,
          icon: <CheckCircle2 size={16} />
        };
      case "failed":
        return {
          label: "Failed - Retry",
          sub: "Tap to try again",
          style: "bg-red-500 text-black",
          disabled: false
        };
      default:
        return {
          label: `Pay ${requiredCost.toFixed(1)} MON`,
          sub: `Queue ${rounds} Round${rounds > 1 ? 's' : ''}`,
          style: "bg-app-accent text-black hover:bg-white",
          disabled: false
        };
    }
  };

  // Helper for inner icon rendering
  const PlusCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  );

  const btn = getButtonContent();

  return (
    <div className="bg-[#0a0a0a] p-4 md:p-6 flex flex-col gap-4 z-10 w-full h-full">
      {/* 标题 */}
      <div className="text-[10px] text-app-muted uppercase font-app-bold mb-1 tracking-wide border-b border-[#222] pb-2 flex justify-between items-center">
        <span>Cost Breakdown</span>
        {isConnected && (
          <span className={`text-[9px] ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
             Balance: {monBalance.toFixed(1)} MON
          </span>
        )}
      </div>
      
      {/* 成本明细 */}
      <div className="space-y-1 text-[12px]">
        <div className="flex justify-between text-app-muted">
          <span>{liveMode ? 'Entry Fee' : `Entry Fee x${rounds}`}</span>
          <span className="text-white">{(liveMode ? liveRoundFee : (entryFeePerRound * rounds)).toFixed(2)}</span>
        </div>
        {!liveMode && skillPrice > 0 && (
          <div className="flex justify-between text-app-muted">
            <span>Skills</span>
            <span className="text-white">{(skillPrice * rounds).toFixed(2)}</span>
          </div>
        )}
        {!liveMode && itemPrice > 0 && (
          <div className="flex justify-between text-app-muted">
            <span>Items</span>
            <span className="text-white">{(itemPrice * rounds).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2 border-t border-[#333]">
          <span className="font-app-bold text-white">Total</span>
          <span className="text-[20px] font-app-bold text-app-accent">
            {requiredCost.toFixed(2)} <span className="text-[11px]">MON</span>
          </span>
        </div>
      </div>

      <div className="text-[9px] text-app-muted">
        {!hasRumbleXPass ? (
          <span className="text-app-accent font-bold">Pass required before queueing.</span>
        ) : liveMode ? (
          <span>Join checks are validated by API + on-chain state. Feed/history remain mock in hybrid mode.</span>
        ) : (
          <span>Start with {startingMON.toFixed(2)} MON · Season pool contribution applies per entry.</span>
        )}
      </div>

      {liveMode && joinError && (
        <div className="text-[9px] text-app-danger uppercase tracking-wide">
          {joinErrorCode ? `${joinErrorCode}: ` : ""}{joinError}
        </div>
      )}
      
      {/* 按钮 */}
      <div className="mt-auto pt-4">
         {readOnly ? (
           <div className="w-full py-4 border border-[#222] bg-[#111] flex flex-col items-center justify-center gap-1 opacity-80">
              <div className="text-app-muted text-[11px] uppercase tracking-wide">
                 PAID: <span className="text-white">{totalCost.toFixed(1)} MON</span>
              </div>
              <div className="text-app-accent/60 font-app-bold text-[9px] uppercase tracking-[2px]">LOCKED</div>
           </div>
         ) : (
            <button 
              onClick={handleAction}
              disabled={btn.disabled}
              className={`w-full font-app-bold text-[14px] md:text-[15px] py-4 px-4 uppercase tracking-[2px] transition-all flex flex-col items-center justify-center gap-1 ${btn.style} ${!btn.disabled && 'hover:scale-[1.01] active:scale-[0.99]'}`}
            >
              <div className="flex items-center gap-2">
                {btn.icon}
                <span>{btn.label}</span>
              </div>
              {btn.sub && (
                <span className="text-[9px] opacity-70 tracking-wide">
                  {btn.sub}
                </span>
              )}
            </button>
         )}
      </div>
    </div>
  );
}

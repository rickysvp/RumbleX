import React, { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { mockTransaction, TxState } from '../../lib/mockTransaction';
import { mockWallet } from '../../lib/mockWallet';
import { CheckCircle2, Wallet } from 'lucide-react';

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
  const { status: walletStatus, monBalance } = useWalletStore();
  const [tx, setTx] = useState<TxState>({ status: "idle", txHash: null, error: null });

  const canAfford = monBalance >= totalCost;
  const isConnected = walletStatus === "connected";

  const handleAction = () => {
    if (!isConnected) {
      mockWallet.connect();
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
    if (!isConnected) {
      return {
        label: "Connect Wallet",
        sub: "Tap to connect",
        style: "bg-[#111] border border-[#333] text-app-muted hover:text-white",
        disabled: false
      };
    }

    if (!canAfford) {
      return {
        label: "Insufficient Balance",
        sub: `Need ${totalCost.toFixed(1)} MON`,
        style: "bg-red-500/10 border border-red-500/30 text-red-500",
        disabled: true
      };
    }

    switch (tx.status) {
      case "awaiting_signature":
        return {
          label: "Check Wallet...",
          sub: "Sign to confirm",
          style: "bg-app-accent/20 border border-app-accent/40 text-app-accent animate-pulse",
          disabled: true,
          showSpinner: true
        };
      case "pending":
        return {
          label: "Processing...",
          sub: `TX: ${tx.txHash?.substring(0, 8)}...`,
          style: "bg-[#111] border border-app-accent/20 text-app-accent",
          disabled: true,
          showSpinner: true
        };
      case "confirmed":
        return {
          label: "Confirmed!",
          sub: "Redirecting...",
          style: "bg-green-500/20 border border-green-500/40 text-green-500",
          disabled: true,
          showCheck: true
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
          label: `Pay ${totalCost.toFixed(1)} MON`,
          sub: `Queue ${rounds} Round${rounds > 1 ? 's' : ''}`,
          style: "bg-app-accent text-black hover:bg-white",
          disabled: false
        };
    }
  };

  const btn = getButtonContent();

  return (
    <div className="bg-[#0a0a0a] border-t border-app-border p-4 md:p-6 flex flex-col gap-4 z-10 w-full">
      {/* 移动端简化版 */}
      <div className="md:hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] text-app-muted uppercase font-app-bold">Total</span>
          <span className="text-[20px] font-app-bold text-app-accent">
            {totalCost.toFixed(1)} <span className="text-[11px]">MON</span>
          </span>
        </div>
        
        {isConnected && (
          <div className="flex justify-between text-[9px] text-app-muted mb-3">
            <span>Wallet: {monBalance.toFixed(1)} MON</span>
            <span>{rounds} Round{rounds > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* 桌面版详细版 */}
      <div className="hidden md:block">
        <div className="text-[10px] text-app-muted uppercase font-app-bold mb-3 tracking-wide border-b border-[#222] pb-2 flex justify-between items-center">
          <span>Cost Breakdown</span>
          {isConnected && (
            <span className={`text-[9px] ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
               Balance: {monBalance.toFixed(1)} MON
            </span>
          )}
        </div>
        
        <div className="space-y-1 text-[12px] mb-4">
          <div className="flex justify-between text-app-muted">
            <span>Entry Fee x{rounds}</span>
            <span className="text-white">{(entryFeePerRound * rounds).toFixed(2)}</span>
          </div>
          {skillPrice > 0 && (
            <div className="flex justify-between text-app-muted">
              <span>Skills</span>
              <span className="text-white">{(skillPrice * rounds).toFixed(2)}</span>
            </div>
          )}
          {itemPrice > 0 && (
            <div className="flex justify-between text-app-muted">
              <span>Items</span>
              <span className="text-white">{(itemPrice * rounds).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[#333]">
            <span className="font-app-bold text-white">Total</span>
            <span className="text-[20px] font-app-bold text-app-accent">
              {totalCost.toFixed(2)} <span className="text-[11px]">MON</span>
            </span>
          </div>
        </div>

        <div className="text-[9px] text-app-muted mb-4">
          Start with {startingMON.toFixed(2)} MON · Platform 10% · Season 10%
        </div>
      </div>
      
      {/* 按钮 - 固定在底部 */}
      <div className="w-full sticky bottom-0">
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
               {btn.showSpinner && <span className="animate-pulse">●</span>}
               {btn.showCheck && <CheckCircle2 size={16} />}
               {!isConnected && <Wallet size={16} />}
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

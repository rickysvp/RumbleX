import React, { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { mockTransaction, TxState } from '../../lib/mockTransaction';
import { mockWallet } from '../../lib/mockWallet';
import { Loader2, AlertCircle, CheckCircle2, Wallet } from 'lucide-react';

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
          // Parent closure handles the actual UI transition/close
          onConfirm();
        }
      });
    }
  };

  const getButtonContent = () => {
    if (!isConnected) {
      return {
        label: "Connect Wallet First",
        sub: "Transaction requires active session",
        style: "bg-[#111] border border-[#333] text-app-muted hover:text-white",
        disabled: false
      };
    }

    if (!canAfford) {
      return {
        label: "Insufficient Balance",
        sub: `Need ${totalCost.toFixed(1)} MON · Have ${monBalance.toFixed(1)} MON`,
        style: "bg-red-500/10 border border-red-500/30 text-red-500",
        disabled: true
      };
    }

    switch (tx.status) {
      case "awaiting_signature":
        return {
          label: "Check Your Wallet...",
          sub: "Sign to confirm transaction",
          style: "bg-app-accent/20 border border-app-accent/40 text-app-accent animate-pulse",
          disabled: true,
          showSpinner: true
        };
      case "pending":
        return {
          label: "Broadcasting...",
          sub: `TX: ${tx.txHash?.substring(0, 12)}...`,
          style: "bg-[#111] border border-app-accent/20 text-app-accent",
          disabled: true,
          showSpinner: true
        };
      case "confirmed":
        return {
          label: "Confirmed!",
          sub: "Updating your round queue...",
          style: "bg-green-500/20 border border-green-500/40 text-green-500",
          disabled: true,
          showCheck: true
        };
      case "failed":
        return {
          label: "Transaction Failed",
          sub: `Err: ${tx.error} · Click to Retry`,
          style: "bg-red-500 text-black",
          disabled: false
        };
      default:
        return {
          label: `Pay & Queue ${rounds} Round(s)`,
          sub: `Total: ${totalCost.toFixed(1)} MON · Balance: ${monBalance.toFixed(1)} MON`,
          style: "bg-app-accent text-black hover:bg-white",
          disabled: false
        };
    }
  };

  const btn = getButtonContent();

  return (
    <div className="bg-[#0a0a0a] border-t border-app-border p-5 md:p-8 flex flex-col gap-6 z-10 w-full">
      <div className="w-full">
        <div className="text-[10px] text-app-muted uppercase font-app-bold mb-4 tracking-widest border-b border-[#222] pb-2 flex justify-between items-center">
          <span>Cost Breakdown</span>
          {isConnected && (
            <span className={`text-[9px] font-app-mono ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
               Wallet: {monBalance.toFixed(1)} MON Available
            </span>
          )}
        </div>
        <table className="w-full text-[13px] font-app-mono text-app-muted border-separate border-spacing-y-2">
          <tbody>
            <tr>
              <td>ROUNDS:</td>
              <td className="text-right text-white">{rounds}</td>
            </tr>
            <tr>
              <td>ENTRY FEE:</td>
              <td className="text-right text-white">{(entryFeePerRound * rounds).toFixed(2)}</td>
            </tr>
            <tr>
              <td>SKILLS:</td>
              <td className="text-right text-white">{(skillPrice * rounds).toFixed(2)}</td>
            </tr>
            <tr>
              <td>ITEMS:</td>
              <td className="text-right text-white">{(itemPrice * rounds).toFixed(2)}</td>
            </tr>
            <tr className="border-t border-[#333]">
              <td className="pt-4 font-app-bold text-white uppercase tracking-wider">Total</td>
              <td className="pt-4 text-right text-[24px] font-app-bold text-app-accent leading-none">
                {totalCost.toFixed(2)} <span className="text-[12px] ml-1">MON</span>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 p-3 bg-[#111] border border-[#222] rounded-sm">
          <div className="text-[10px] text-app-muted leading-relaxed font-app-mono uppercase">
            Start / Round: <span className="text-white">{startingMON.toFixed(2)} MON</span><br/>
            Incl: Platform 10% &middot; Season 10%
          </div>
        </div>
      </div>
      
      <div className="w-full">
         {readOnly ? (
           <div className="w-full py-5 border border-[#222] bg-[#111] flex flex-col items-center justify-center gap-1 opacity-80">
              <div className="text-app-muted font-app-mono text-[11px] uppercase tracking-widest leading-none">
                 PAID: <span className="text-white">{totalCost.toFixed(1)} MON</span>
              </div>
              <div className="text-app-accent/60 font-app-bold text-[9px] uppercase tracking-[3px] mt-1">LOCKED IN</div>
           </div>
         ) : (
           <button 
             onClick={handleAction}
             disabled={btn.disabled}
             className={`w-full font-app-bold text-[15px] py-[16px] px-4 uppercase tracking-[2px] transition-all flex flex-col items-center justify-center gap-1 ${btn.style} ${!btn.disabled && 'hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(235,255,0,0.1)]'}`}
           >
             <div className="flex items-center gap-3">
               {btn.showSpinner && <span className="animate-pulse">░░░</span>}
               {btn.showCheck && <CheckCircle2 size={18} />}
               {!isConnected && <Wallet size={18} />}
               <span>{btn.label}</span>
             </div>
             {btn.sub && (
               <span className="text-[9px] opacity-70 tracking-widest font-app-mono">
                 {btn.sub}
               </span>
             )}
           </button>
         )}
      </div>
    </div>
  );
}

import { useGameStore } from '../store/gameStore';
import { useWalletStore } from '../store/walletStore';
import { UserLoadout } from '../store/types';

export type TxStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export interface TxState {
  status: TxStatus;
  txHash: string | null;
  error: string | null;
}

/**
 * Mock transaction engine simulating the multi-stage lifecycle 
 * of an on-chain interaction.
 */
export const mockTransaction = {
  submit: async (loadoutConfig: Partial<UserLoadout>, totalCost: number, onUpdate: (state: TxState) => void) => {
    // 1. Awaiting Signature
    onUpdate({ status: "awaiting_signature", txHash: null, error: null });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Pending
    const mockHash = "0x" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    onUpdate({ status: "pending", txHash: mockHash, error: null });
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 3. Outcome (90% success)
    if (Math.random() < 0.9) {
      // Success logic
      const walletStore = useWalletStore.getState();
      const gameStore = useGameStore.getState();

      // Deduct balance
      walletStore.setBalance(walletStore.monBalance - totalCost);

      // Trigger Game Store Queue
      gameStore.queueUserLoadout(loadoutConfig);

      // Inject extra system feed event for TX confirmation
      gameStore.addFeedEvent({
        timestamp: 0,
        type: 'system',
        text: `★ TX CONFIRMED: ${mockHash.substring(0, 10)}... Queueing ${loadoutConfig.rounds} round(s).`,
        attacker: null, target: null, monAmount: totalCost, skillUsed: null, itemUsed: null
      });

      onUpdate({ status: "confirmed", txHash: mockHash, error: null });
      
      // Auto-reset after completion buffer
      await new Promise(resolve => setTimeout(resolve, 1000));
      onUpdate({ status: "idle", txHash: null, error: null });
    } else {
      // Failure logic
      const errors = ["INSUFFICIENT_GAS", "TRANSACTION_REVERTED", "RPC_ERROR"];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      onUpdate({ status: "failed", txHash: null, error: randomError });
    }
  }
};

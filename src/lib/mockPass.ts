import { useWalletStore } from '../store/walletStore';

export type MintTxStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export const mockPass = {
  /**
   * Simulates an on-chain check for the RumbleX Pass NFT.
   */
  checkRumbleXPass: async () => {
    const store = useWalletStore.getState();
    if (store.status !== "connected") return;

    store.setPassStatus("checking");

    // Random delay 800ms - 1200ms
    const delay = Math.floor(Math.random() * (1200 - 800 + 1)) + 800;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (store.hasRumbleXPass) {
      store.setPassStatus("owned");
    } else {
      store.setPassStatus("missing");
    }
  },

  /**
   * Simulates minting the RumbleX Pass NFT.
   * Cost: 1 MON.
   */
  mintRumbleXPass: async (onUpdate?: (status: MintTxStatus, txHash?: string | null) => void) => {
    const store = useWalletStore.getState();
    const MINT_COST = 1;

    if (store.status !== "connected") return;
    
    if (store.monBalance < MINT_COST) {
      onUpdate?.("failed", null);
      return;
    }

    store.setMintingPass(true);
    onUpdate?.("awaiting_signature");

    // Phase 1: Signature
    await new Promise(resolve => setTimeout(resolve, 1000));
    onUpdate?.("pending", "0x" + Math.random().toString(16).slice(2, 10) + "...");

    // Phase 2: Confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Finalize
    store.setBalance(store.monBalance - MINT_COST);
    store.setPassOwned(true);
    store.setMintingPass(false);
    onUpdate?.("confirmed");

    return "0x" + Math.random().toString(16).slice(2, 40);
  }
};

import { getApiErrorMessage } from "../api/format";
import { walletQueryKeys } from "../api/keys";
import { isMockMode } from "../config/dataMode";
import { queryClient } from "../query/client";
import { useWalletStore } from "../store/walletStore";
import { runPassMintFlow } from "./wallet/txFlows";

export type MintTxStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export const mockPass = {
  /**
   * Pass ownership check.
   * In live mode this triggers summary query refresh so source-of-truth is API/indexer.
   */
  checkRumbleXPass: async () => {
    const store = useWalletStore.getState();
    if (store.status !== "connected") return;

    store.setPassStatus("checking");

    if (isMockMode()) {
      const delay = Math.floor(Math.random() * (1200 - 800 + 1)) + 800;
      await new Promise((resolve) => setTimeout(resolve, delay));

      if (store.hasRumbleXPass) {
        store.setPassStatus("owned");
      } else {
        store.setPassStatus("missing");
      }
      return;
    }

    if (store.addressFull) {
      await queryClient.invalidateQueries({ queryKey: walletQueryKeys.meSummary(store.addressFull) });
      await queryClient.refetchQueries({ queryKey: walletQueryKeys.meSummary(store.addressFull), type: "active" });
    }
  },

  /**
   * Pass mint flow.
   * - mock mode: simulated
   * - hybrid/live mode: tx intent + wallet sendTransaction
   */
  mintRumbleXPass: async (onUpdate?: (status: MintTxStatus, txHash?: string | null) => void) => {
    const store = useWalletStore.getState();
    const MINT_COST = 1;

    if (store.status !== "connected") return;

    if (isMockMode()) {
      if (store.monBalance < MINT_COST) {
        onUpdate?.("failed", null);
        return;
      }

      store.setMintingPass(true);
      onUpdate?.("awaiting_signature");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onUpdate?.("pending", "0x" + Math.random().toString(16).slice(2, 10) + "...");
      await new Promise((resolve) => setTimeout(resolve, 2000));

      store.setBalance(store.monBalance - MINT_COST);
      store.setPassOwned(true);
      store.setMintingPass(false);
      onUpdate?.("confirmed");
      return "0x" + Math.random().toString(16).slice(2, 40);
    }

    if (!store.addressFull) {
      onUpdate?.("failed");
      return;
    }

    onUpdate?.("awaiting_signature");
    try {
      await runPassMintFlow(store.addressFull);
      onUpdate?.("confirmed");
    } catch (error) {
      store.setDataError(getApiErrorMessage(error));
      onUpdate?.("failed");
      throw error;
    }
  },
};

import { queryClient } from "../query/client";
import { walletQueryKeys } from "../api/keys";
import { normalizeMonNumber } from "../api/format";
import { isMockMode } from "../config/dataMode";
import { useWalletStore } from "../store/walletStore";
import { connectEvmWallet, readWalletBalance } from "./wallet/provider";

/**
 * Wallet adapter.
 * - mock mode: existing simulated behavior
 * - hybrid/live mode: EVM wallet + indexer API sync
 */
export const mockWallet = {
  connect: async () => {
    const store = useWalletStore.getState();

    store.setStatus("connecting");
    store.setError(null);

    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (Math.random() < 0.9) {
        store.setWallet("0x7a...9fE2", "0x7a3F6B4C2d8A1E9fE2", 12.4, false);
      } else {
        const errorType = Math.random() < 0.5 ? "USER_REJECTED" : "TIMEOUT";
        store.setError(errorType);
      }
      return;
    }

    try {
      const wallet = await connectEvmWallet();
      store.setWalletConnection(wallet.address, wallet.balance);
      store.setPassStatus("checking");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletQueryKeys.meSummary(wallet.address) }),
        queryClient.invalidateQueries({ queryKey: walletQueryKeys.meClaims(wallet.address) }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "WALLET_CONNECT_FAILED";
      store.setError(message);
    }
  },

  disconnect: () => {
    const addressFull = useWalletStore.getState().addressFull;
    if (addressFull) {
      queryClient.removeQueries({ queryKey: walletQueryKeys.meSummary(addressFull) });
      queryClient.removeQueries({ queryKey: walletQueryKeys.meClaims(addressFull) });
    }
    useWalletStore.getState().reset();
  },

  refreshBalance: async () => {
    const store = useWalletStore.getState();
    store.setRefreshing(true);

    if (isMockMode()) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      store.setRefreshing(false);
      return;
    }

    try {
      if (store.addressFull) {
        const latest = await readWalletBalance(store.addressFull);
        store.setBalance(normalizeMonNumber(latest));

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: walletQueryKeys.meSummary(store.addressFull) }),
          queryClient.invalidateQueries({ queryKey: walletQueryKeys.meClaims(store.addressFull) }),
        ]);
      }
    } finally {
      store.setRefreshing(false);
    }
  },
};

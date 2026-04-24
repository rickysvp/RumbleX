import { getApiErrorMessage } from "../api/format";
import { isMockMode } from "../config/dataMode";
import { useWalletStore } from "../store/walletStore";
import { runClaimAllFlow } from "./wallet/txFlows";

export async function claimAll() {
  const store = useWalletStore.getState();

  if (store.status !== "connected") {
    throw new Error("Wallet not connected");
  }

  if (isMockMode()) {
    if (!store.claimableMonNumber || store.claimableMonNumber <= 0) {
      store.setDataError("No claimable MON");
      return;
    }

    store.setClaimingAll(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const nextBalance = store.monBalance + store.claimableMonNumber;
    store.setBalance(nextBalance);
    useWalletStore.setState({
      claimableMon: "0",
      claimableMonNumber: 0,
      fallbackClaimableMon: "0",
      seasonRewardClaimableMon: "0",
      lastSyncedAt: new Date().toISOString(),
      dataSource: "mock",
      isPending: false,
      isConfirmed: true,
      isStale: false,
      sourceBlockNumber: null,
    });
    store.setClaimingAll(false);
    return;
  }

  if (!store.addressFull) {
    throw new Error("Wallet address missing");
  }

  try {
    await runClaimAllFlow(store.addressFull);
  } catch (error) {
    store.setDataError(getApiErrorMessage(error));
    throw error;
  }
}

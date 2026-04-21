import { useWalletStore } from '../store/walletStore';

/**
 * Mock wallet adapter simulating asynchronous connection flows.
 * Uses deterministic delays to mimic real wallet popups.
 */
export const mockWallet = {
  connect: async () => {
    const store = useWalletStore.getState();
    
    store.setStatus("connecting");
    store.setError(null);

    // Simulate wallet provider popup delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // 90% success rate, 10% random failure
    if (Math.random() < 0.9) {
      store.setWallet(
        "0x7a...9fE2",
        "0x7a3F6B4C2d8A1E9fE2",
        12.4, // Initial mock balance
        false  // Initial state: no RumbleX Pass (test eligibility gate)
      );
    } else {
      const errorType = Math.random() < 0.5 ? "USER_REJECTED" : "TIMEOUT";
      store.setError(errorType);
    }
  },

  disconnect: () => {
    useWalletStore.getState().reset();
  },

  refreshBalance: async () => {
    const store = useWalletStore.getState();
    
    store.setRefreshing(true);
    // Simulate on-chain rpc call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In mock, balance stays same unless tx happens
    store.setRefreshing(false);
  }
};

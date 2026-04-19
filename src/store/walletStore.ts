import { create } from 'zustand';

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  addressFull: string | null;
  monBalance: number;
  hasAlphaPass: boolean;
  error: string | null;
  isRefreshing: boolean;

  // Actions
  setStatus: (status: WalletStatus) => void;
  setWallet: (address: string, addressFull: string, balance: number, hasPass: boolean) => void;
  setBalance: (balance: number) => void;
  setError: (error: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  status: "disconnected",
  address: null,
  addressFull: null,
  monBalance: 0,
  hasAlphaPass: false,
  error: null,
  isRefreshing: false,

  setStatus: (status) => set({ status }),
  
  setWallet: (address, addressFull, monBalance, hasAlphaPass) => 
    set({ status: "connected", address, addressFull, monBalance, hasAlphaPass, error: null }),
  
  setBalance: (monBalance) => set({ monBalance }),
  
  setError: (error) => set({ status: "error", error }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  reset: () => set({ 
    status: "disconnected", 
    address: null, 
    addressFull: null, 
    monBalance: 0, 
    hasAlphaPass: false, 
    error: null 
  }),
}));

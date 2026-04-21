import { create } from 'zustand';

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
export type WalletPassStatus = "unknown" | "checking" | "missing" | "owned";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  addressFull: string | null;
  monBalance: number;
  hasRumbleXPass: boolean;
  passStatus: WalletPassStatus;
  isMintingPass: boolean;
  error: string | null;
  isRefreshing: boolean;

  // Actions
  setStatus: (status: WalletStatus) => void;
  setWallet: (address: string, addressFull: string, balance: number, hasPass: boolean) => void;
  setPassStatus: (status: WalletPassStatus) => void;
  setPassOwned: (owned: boolean) => void;
  setMintingPass: (isMinting: boolean) => void;
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
  hasRumbleXPass: false,
  passStatus: "unknown",
  isMintingPass: false,
  error: null,
  isRefreshing: false,

  setStatus: (status) => set({ status }),
  
  setWallet: (address, addressFull, monBalance, hasRumbleXPass) => 
    set({ 
      status: "connected", 
      address, 
      addressFull, 
      monBalance, 
      hasRumbleXPass, 
      passStatus: hasRumbleXPass ? "owned" : "unknown",
      error: null 
    }),
  
  setPassStatus: (passStatus) => set({ passStatus }),
  
  setPassOwned: (hasRumbleXPass) => set({ 
    hasRumbleXPass, 
    passStatus: hasRumbleXPass ? "owned" : "missing" 
  }),

  setMintingPass: (isMintingPass) => set({ isMintingPass }),

  setBalance: (monBalance) => set({ monBalance }),
  
  setError: (error) => set({ status: "error", error }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  reset: () => set({ 
    status: "disconnected", 
    address: null, 
    addressFull: null, 
    monBalance: 0, 
    hasRumbleXPass: false, 
    passStatus: "unknown",
    isMintingPass: false,
    error: null 
  }),
}));

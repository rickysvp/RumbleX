import { create } from "zustand";
import { normalizeMonNumber, normalizeMonString, formatAddressShort } from "../api/format";
import { ApiMeta, MeClaimsData, MeSummaryData } from "../api/types";

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";
export type WalletPassStatus = "unknown" | "checking" | "missing" | "owned";

type WalletDataSource = ApiMeta["source"] | "mock";

interface WalletState {
  status: WalletStatus;
  address: string | null;
  addressFull: string | null;

  walletBalance: string | null;
  monBalance: number;

  hasPass: boolean;
  hasRumbleXPass: boolean;
  passStatus: WalletPassStatus;

  claimableMon: string;
  claimableMonNumber: number;
  fallbackClaimableMon: string;
  seasonRewardClaimableMon: string;
  lockedInRounds: string | null;
  seasonEstimateMon: string | null;
  activeRoundId: number | null;

  isConnecting: boolean;
  isRefreshing: boolean;
  isMintingPass: boolean;
  isClaimingAll: boolean;

  error: string | null;
  dataError: string | null;
  lastSyncedAt: string | null;

  dataSource: WalletDataSource;
  isPending: boolean;
  isStale: boolean;

  setStatus: (status: WalletStatus) => void;
  setWallet: (address: string, addressFull: string, balance: number, hasPass: boolean) => void;
  setWalletConnection: (addressFull: string, walletBalanceRaw: string) => void;
  setPassStatus: (status: WalletPassStatus) => void;
  setPassOwned: (owned: boolean) => void;
  setMintingPass: (isMinting: boolean) => void;
  setClaimingAll: (isClaiming: boolean) => void;
  setBalance: (balance: number) => void;
  setError: (error: string | null) => void;
  setDataError: (error: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  applySummaryData: (summary: MeSummaryData, meta: ApiMeta) => void;
  applyClaimsData: (claims: MeClaimsData, meta: ApiMeta) => void;
  reset: () => void;
}

const initialState = {
  status: "disconnected" as WalletStatus,
  address: null,
  addressFull: null,
  walletBalance: null,
  monBalance: 0,
  hasPass: false,
  hasRumbleXPass: false,
  passStatus: "unknown" as WalletPassStatus,
  claimableMon: "0",
  claimableMonNumber: 0,
  fallbackClaimableMon: "0",
  seasonRewardClaimableMon: "0",
  lockedInRounds: null,
  seasonEstimateMon: null,
  activeRoundId: null,
  isConnecting: false,
  isRefreshing: false,
  isMintingPass: false,
  isClaimingAll: false,
  error: null,
  dataError: null,
  lastSyncedAt: null,
  dataSource: "mock" as WalletDataSource,
  isPending: false,
  isStale: false,
};

export const useWalletStore = create<WalletState>((set, get) => ({
  ...initialState,

  setStatus: (status) =>
    set({
      status,
      isConnecting: status === "connecting",
      ...(status !== "error" ? { error: null } : {}),
    }),

  setWallet: (address, addressFull, monBalance, hasPass) =>
    set({
      status: "connected",
      isConnecting: false,
      address,
      addressFull,
      walletBalance: String(monBalance),
      monBalance,
      hasPass,
      hasRumbleXPass: hasPass,
      passStatus: hasPass ? "owned" : "unknown",
      error: null,
    }),

  setWalletConnection: (addressFull, walletBalanceRaw) =>
    set({
      status: "connected",
      isConnecting: false,
      address: formatAddressShort(addressFull),
      addressFull,
      walletBalance: walletBalanceRaw,
      monBalance: normalizeMonNumber(walletBalanceRaw),
      hasPass: false,
      hasRumbleXPass: false,
      passStatus: "unknown",
      error: null,
    }),

  setPassStatus: (passStatus) => set({ passStatus }),

  setPassOwned: (hasPass) =>
    set({
      hasPass,
      hasRumbleXPass: hasPass,
      passStatus: hasPass ? "owned" : "missing",
    }),

  setMintingPass: (isMintingPass) => set({ isMintingPass }),

  setClaimingAll: (isClaimingAll) => set({ isClaimingAll }),

  setBalance: (monBalance) =>
    set({
      monBalance,
      walletBalance: String(monBalance),
    }),

  setError: (error) =>
    set({
      status: error ? "error" : get().status,
      isConnecting: false,
      error,
    }),

  setDataError: (dataError) => set({ dataError }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  applySummaryData: (summary, meta) =>
    set((state) => {
      const hasPass = Boolean(summary.hasPass);
      const claimableMon = normalizeMonString(summary.claimableMon);

      return {
        hasPass,
        hasRumbleXPass: hasPass,
        passStatus: hasPass ? "owned" : "missing",
        walletBalance: summary.walletBalance,
        monBalance:
          summary.walletBalance === null
            ? state.monBalance
            : normalizeMonNumber(summary.walletBalance),
        claimableMon,
        claimableMonNumber: normalizeMonNumber(summary.claimableMon),
        lockedInRounds:
          summary.lockedInRounds === null ? null : normalizeMonString(summary.lockedInRounds),
        seasonEstimateMon:
          summary.seasonEstimateMon === null ? null : normalizeMonString(summary.seasonEstimateMon),
        activeRoundId: summary.activeRoundId,
        lastSyncedAt: meta.lastSyncedAt,
        dataSource: meta.source,
        isPending: meta.isPending,
        isStale: meta.isStale,
      };
    }),

  applyClaimsData: (claims, meta) => {
    const fallback = claims.fallbackClaims
      .filter((item) => item.status === "unclaimed")
      .reduce((acc, item) => acc + normalizeMonNumber(item.amount), 0);

    const season = claims.seasonRewards
      .filter((item) => item.status === "unclaimed")
      .reduce((acc, item) => acc + normalizeMonNumber(item.amount), 0);

    set({
      claimableMon: normalizeMonString(claims.claimableTotal),
      claimableMonNumber: normalizeMonNumber(claims.claimableTotal),
      fallbackClaimableMon: normalizeMonString(fallback),
      seasonRewardClaimableMon: normalizeMonString(season),
      lastSyncedAt: meta.lastSyncedAt,
      dataSource: meta.source,
      isPending: meta.isPending,
      isStale: meta.isStale,
    });
  },

  reset: () => set({ ...initialState }),
}));

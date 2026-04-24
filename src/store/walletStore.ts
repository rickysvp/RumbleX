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

  claimableMon: string | null;
  claimableMonNumber: number | null;
  fallbackClaimableMon: string | null;
  seasonRewardClaimableMon: string | null;
  lockedInRounds: string | null;
  seasonEstimateMon: string | null;
  seasonAssignedRewardMon: string | null;
  seasonClaimedRewardMon: string | null;
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
  isConfirmed: boolean;
  isStale: boolean;
  sourceBlockNumber: number | null;

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
  claimableMon: null as string | null,
  claimableMonNumber: null as number | null,
  fallbackClaimableMon: null as string | null,
  seasonRewardClaimableMon: null as string | null,
  lockedInRounds: null,
  seasonEstimateMon: null,
  seasonAssignedRewardMon: null as string | null,
  seasonClaimedRewardMon: null as string | null,
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
  isConfirmed: false,
  isStale: false,
  sourceBlockNumber: null as number | null,
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
      const claimableMon =
        summary.claimableMon === null ? null : normalizeMonString(summary.claimableMon);
      const seasonEstimated =
        summary.seasonEstimatedRewardMon ?? summary.seasonEstimateMon;

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
        claimableMonNumber:
          summary.claimableMon === null ? null : normalizeMonNumber(summary.claimableMon),
        fallbackClaimableMon:
          summary.fallbackClaimableMon === null ? null : normalizeMonString(summary.fallbackClaimableMon),
        seasonRewardClaimableMon:
          summary.seasonClaimableMon === null ? null : normalizeMonString(summary.seasonClaimableMon),
        lockedInRounds:
          summary.lockedInRounds === null ? null : normalizeMonString(summary.lockedInRounds),
        seasonEstimateMon:
          seasonEstimated === null ? null : normalizeMonString(seasonEstimated),
        seasonAssignedRewardMon:
          summary.seasonAssignedRewardMon === null ? null : normalizeMonString(summary.seasonAssignedRewardMon),
        seasonClaimedRewardMon:
          summary.seasonClaimedRewardMon === null ? null : normalizeMonString(summary.seasonClaimedRewardMon),
        activeRoundId: summary.activeRoundId,
        lastSyncedAt: meta.lastSyncedAt,
        dataSource: meta.source,
        isPending: meta.isPending,
        isConfirmed: meta.isConfirmed,
        isStale: meta.isStale,
        sourceBlockNumber: meta.sourceBlockNumber,
      };
    }),

  applyClaimsData: (claims, meta) => {
    const fallbackDerived = claims.fallbackClaims
      .filter((item) => item.status === "unclaimed")
      .reduce((acc, item) => acc + normalizeMonNumber(item.amount), 0);

    const seasonDerived = claims.seasonRewards
      .filter((item) => item.status === "unclaimed")
      .reduce((acc, item) => acc + normalizeMonNumber(item.amount), 0);

    const claimableMon =
      claims.claimableTotal === null ? null : normalizeMonString(claims.claimableTotal);
    const fallback =
      claims.fallbackClaimableMon === null
        ? claims.claimableTotal === null
          ? null
          : normalizeMonString(fallbackDerived)
        : normalizeMonString(claims.fallbackClaimableMon);
    const season =
      claims.seasonClaimableMon === null
        ? claims.claimableTotal === null
          ? null
          : normalizeMonString(seasonDerived)
        : normalizeMonString(claims.seasonClaimableMon);

    set({
      claimableMon,
      claimableMonNumber:
        claims.claimableTotal === null ? null : normalizeMonNumber(claims.claimableTotal),
      fallbackClaimableMon: fallback,
      seasonRewardClaimableMon: season,
      seasonEstimateMon:
        claims.seasonEstimatedRewardMon === null
          ? null
          : normalizeMonString(claims.seasonEstimatedRewardMon),
      seasonAssignedRewardMon:
        claims.seasonAssignedRewardMon === null
          ? null
          : normalizeMonString(claims.seasonAssignedRewardMon),
      seasonClaimedRewardMon:
        claims.seasonClaimedRewardMon === null
          ? null
          : normalizeMonString(claims.seasonClaimedRewardMon),
      lastSyncedAt: meta.lastSyncedAt,
      dataSource: meta.source,
      isPending: meta.isPending,
      isConfirmed: meta.isConfirmed,
      isStale: meta.isStale,
      sourceBlockNumber: meta.sourceBlockNumber,
    });
  },

  reset: () => set({ ...initialState }),
}));

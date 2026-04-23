export interface ApiMeta {
  source: "indexer" | "chain" | "aggregated";
  isPending: boolean;
  isConfirmed: boolean;
  isStale: boolean;
  lastSyncedAt: string;
  sourceBlockNumber: number | null;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface MeSummaryData {
  address: string;
  hasPass: boolean;
  walletBalance: string | null;
  claimableMon: string;
  lockedInRounds: string | null;
  seasonEstimateMon: string | null;
  activeRoundId: number | null;
}

export interface ClaimRecordView {
  claimType: "fallback_round_payout" | "season_reward";
  sourceId: number;
  amount: string;
  status: "unclaimed" | "claimed";
  createdAt: string;
  claimedAt: string | null;
}

export interface MeClaimsData {
  claimableTotal: string;
  fallbackClaims: ClaimRecordView[];
  seasonRewards: ClaimRecordView[];
  lastUpdatedAt: string;
}

export interface TxIntentData {
  to: string;
  data: string;
  value: string;
}

export interface LiveRoundData {
  roundId: number;
  seasonId: number;
  state: "SignupOpen" | "SignupLocked" | "Live" | string;
  entryFee: string;
  joinedCount: number;
  maxPlayers: number;
  startTime: string | null;
  roomAddress: string;
}

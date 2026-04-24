export interface ApiMeta {
  source: "indexer" | "chain" | "aggregated";
  isPending: boolean;
  isConfirmed: boolean;
  isStale: boolean;
  lastSyncedAt: string | null;
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

export interface RecentRoundData {
  roundId: number;
  participants: number;
  survivors: number;
  volume: string;
  settledAt: string | null;
  resultHash: string;
}

export interface MeHistoryRowData {
  roundId: number;
  joinedAt: string | null;
  kills: number;
  survivalStatus: "survived" | "eliminated" | "unknown";
  payoutAmount: string;
  payoutStatus: "none" | "paid" | "claimable";
  settledAt: string | null;
}

export interface MeStatsData {
  totalRoundsPlayed: number;
  totalSurvivedRounds: number;
  totalKills: number;
  totalPaidOut: string;
  totalClaimed: string;
  currentClaimable: string;
  netMonDelta: string;
}

export interface SeasonCurrentData {
  seasonId: number;
  status: "Upcoming" | "Active" | "Ended" | "RewardsReady" | "Closed" | string;
  endsAt: string | null;
  prizePool: string;
  qualificationKillThreshold: number;
}

export interface SeasonRankRowData {
  playerAddress: string;
  displayName: string | null;
  totalKills: number;
  qualified: boolean;
  estimatedReward: string;
}

export interface RoundDetailParticipantData {
  roundId: number;
  playerAddress: string;
  kills: number;
  isSurvivor: boolean;
  payoutAmount: string;
}

export interface RoundDetailData {
  participants: RoundDetailParticipantData[];
}

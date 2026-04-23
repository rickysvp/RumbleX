export type ConfirmationStatus = "pending" | "confirmed";

export interface Provenance {
  sourceTxHash: string;
  sourceBlockNumber: number;
  sourceLogIndex: number;
  confirmationStatus: ConfirmationStatus;
  confirmedAt: string | null;
}

export interface SeasonModel extends Provenance {
  seasonId: number;
  status: "Upcoming" | "Active" | "Ended" | "RewardsReady" | "Closed";
  startTime: string | null;
  endTime: string | null;
  seasonVaultBalance: string;
  qualificationKillThreshold: number;
}

export interface PassStateModel extends Provenance {
  address: string;
  hasPass: boolean;
  passTokenId: number | null;
  checkedAt: string;
}

export interface RoundModel extends Provenance {
  roundId: number;
  seasonId: number;
  roomAddress: string;
  state:
    | "SignupOpen"
    | "SignupLocked"
    | "Live"
    | "SettlementPending"
    | "Settled"
    | "FallbackClaimOpen"
    | "Closed";
  entryFee: string;
  maxPlayers: number;
  participantCount: number;
  startTime: string | null;
  endTime: string | null;
  rulesetHash: string | null;
}

export type PayoutStatus = "none" | "paid" | "claimable";

export interface RoundParticipantModel extends Provenance {
  roundId: number;
  playerAddress: string;
  joinTime: string | null;
  kills: number;
  isSurvivor: boolean;
  isEliminated: boolean;
  payoutAmount: string;
  payoutStatus: PayoutStatus;
  finalHolding: string;
}

export interface RoundSettlementModel extends Provenance {
  roundId: number;
  resultHash: string;
  totalEntryCollected: string;
  protocolFeeAmount: string;
  seasonFeeAmount: string;
  playerPoolAmount: string;
  totalPaidOut: string;
  totalFallbackClaimable: string;
  settledAt: string | null;
}

export interface ClaimBalanceModel extends Provenance {
  playerAddress: string;
  claimableTotal: string;
  fallbackRoundAmount: string;
  seasonRewardAmount: string;
  updatedAt: string;
}

export interface PlayerSeasonStatsModel extends Provenance {
  seasonId: number;
  playerAddress: string;
  totalKills: number;
  qualified: boolean;
  estimatedReward: string;
  assignedReward: string;
  claimedSeasonReward: string;
}

export type ClaimType = "fallback_round_payout" | "season_reward";

export interface ClaimSourceRecordModel extends Provenance {
  claimKey: string;
  playerAddress: string;
  claimType: ClaimType;
  sourceId: number;
  amount: string;
  status: "unclaimed" | "claimed";
  createdAt: string | null;
  claimedAt: string | null;
}

export interface IndexerMeta {
  chainId: number;
  startBlock: number;
  latestIndexedBlock: number;
  indexerStatus: "idle" | "syncing" | "ready" | "error";
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface DatabaseState {
  meta: IndexerMeta;
  passStates: Record<string, PassStateModel>;
  seasons: Record<string, SeasonModel>;
  rounds: Record<string, RoundModel>;
  roundAddressToId: Record<string, number>;
  roundParticipants: Record<string, RoundParticipantModel>;
  roundSettlements: Record<string, RoundSettlementModel>;
  claimSourceRecords: Record<string, ClaimSourceRecordModel>;
  claimBalances: Record<string, ClaimBalanceModel>;
  playerSeasonStats: Record<string, PlayerSeasonStatsModel>;
}

export interface ApiMeta {
  source: "indexer" | "chain" | "aggregated";
  isPending: boolean;
  isConfirmed: boolean;
  isStale: boolean;
  lastSyncedAt: string | null;
  sourceBlockNumber: number | null;
}

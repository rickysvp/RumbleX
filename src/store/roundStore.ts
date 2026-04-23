import { create } from "zustand";
import { normalizeMonNumber } from "../api/format";
import { ApiMeta, LiveRoundData } from "../api/types";

export type RoundJoinTxStatus = "idle" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export interface LiveRoundView {
  roundId: number;
  seasonId: number;
  state: LiveRoundData["state"];
  entryFeeRaw: string;
  entryFeeMon: number;
  joinedCount: number;
  maxPlayers: number;
  startTime: string | null;
  roomAddress: string;
  volumeMon: number;
  isFull: boolean;
  isJoinable: boolean;
}

interface RoundState {
  liveRounds: LiveRoundView[];
  selectedRoundId: number | null;

  joinTxStatus: RoundJoinTxStatus;
  joiningRoundId: number | null;
  joinTxHash: string | null;
  joinErrorCode: string | null;
  joinError: string | null;

  locallyJoinedRoundIds: number[];

  dataSource: ApiMeta["source"] | "mock";
  isPending: boolean;
  isStale: boolean;
  lastSyncedAt: string | null;
  dataError: string | null;

  setSelectedRoundId: (roundId: number | null) => void;
  applyLiveRounds: (rows: LiveRoundData[], meta: ApiMeta, preferredRoundId?: number | null) => void;
  setDataError: (error: string | null) => void;
  setJoinAwaitingSignature: (roundId: number) => void;
  setJoinPending: (roundId: number, txHash: string) => void;
  setJoinConfirmed: (roundId: number, txHash: string) => void;
  setJoinFailed: (roundId: number | null, code: string | null, message: string) => void;
  clearJoinState: () => void;
}

const initialState = {
  liveRounds: [] as LiveRoundView[],
  selectedRoundId: null,
  joinTxStatus: "idle" as RoundJoinTxStatus,
  joiningRoundId: null,
  joinTxHash: null,
  joinErrorCode: null,
  joinError: null,
  locallyJoinedRoundIds: [] as number[],
  dataSource: "mock" as ApiMeta["source"] | "mock",
  isPending: false,
  isStale: false,
  lastSyncedAt: null,
  dataError: null,
};

function mapRound(row: LiveRoundData): LiveRoundView {
  const entryFeeMon = normalizeMonNumber(row.entryFee);
  const isFull = row.joinedCount >= row.maxPlayers;
  const isJoinable = row.state === "SignupOpen" && !isFull;

  return {
    roundId: row.roundId,
    seasonId: row.seasonId,
    state: row.state,
    entryFeeRaw: row.entryFee,
    entryFeeMon,
    joinedCount: row.joinedCount,
    maxPlayers: row.maxPlayers,
    startTime: row.startTime,
    roomAddress: row.roomAddress,
    volumeMon: entryFeeMon * row.joinedCount,
    isFull,
    isJoinable,
  };
}

function pickRoundId(rounds: LiveRoundView[], current: number | null, preferred: number | null | undefined): number | null {
  if (preferred && rounds.some((r) => r.roundId === preferred)) return preferred;
  if (current && rounds.some((r) => r.roundId === current)) return current;

  const firstJoinable = rounds.find((r) => r.isJoinable);
  if (firstJoinable) return firstJoinable.roundId;

  return rounds[0]?.roundId ?? null;
}

export const useRoundStore = create<RoundState>((set, get) => ({
  ...initialState,

  setSelectedRoundId: (selectedRoundId) => set({ selectedRoundId }),

  applyLiveRounds: (rows, meta, preferredRoundId) =>
    set((state) => {
      const mapped = rows.map(mapRound).sort((a, b) => b.roundId - a.roundId);
      const selectedRoundId = pickRoundId(mapped, state.selectedRoundId, preferredRoundId);

      return {
        liveRounds: mapped,
        selectedRoundId,
        dataSource: meta.source,
        isPending: meta.isPending,
        isStale: meta.isStale,
        lastSyncedAt: meta.lastSyncedAt,
      };
    }),

  setDataError: (dataError) => set({ dataError }),

  setJoinAwaitingSignature: (joiningRoundId) =>
    set({
      joinTxStatus: "awaiting_signature",
      joiningRoundId,
      joinTxHash: null,
      joinErrorCode: null,
      joinError: null,
    }),

  setJoinPending: (joiningRoundId, joinTxHash) =>
    set({
      joinTxStatus: "pending",
      joiningRoundId,
      joinTxHash,
      joinErrorCode: null,
      joinError: null,
    }),

  setJoinConfirmed: (joiningRoundId, joinTxHash) =>
    set((state) => ({
      joinTxStatus: "confirmed",
      joiningRoundId,
      joinTxHash,
      joinErrorCode: null,
      joinError: null,
      locallyJoinedRoundIds: state.locallyJoinedRoundIds.includes(joiningRoundId)
        ? state.locallyJoinedRoundIds
        : [...state.locallyJoinedRoundIds, joiningRoundId],
    })),

  setJoinFailed: (joiningRoundId, joinErrorCode, joinError) =>
    set({
      joinTxStatus: "failed",
      joiningRoundId,
      joinTxHash: null,
      joinErrorCode,
      joinError,
    }),

  clearJoinState: () =>
    set({
      joinTxStatus: "idle",
      joiningRoundId: null,
      joinTxHash: null,
      joinErrorCode: null,
      joinError: null,
    }),
}));

export function selectCurrentLiveRound(state: RoundState): LiveRoundView | null {
  if (state.liveRounds.length === 0) return null;
  return state.liveRounds.find((round) => round.roundId === state.selectedRoundId) ?? state.liveRounds[0] ?? null;
}

export function hasJoinedRoundLocally(state: RoundState, roundId: number | null | undefined): boolean {
  if (!roundId) return false;
  return state.locallyJoinedRoundIds.includes(roundId);
}

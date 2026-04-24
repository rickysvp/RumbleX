import { apiBaseUrl } from "../config/dataMode";
import {
  ApiEnvelope,
  ApiErrorPayload,
  ApiSuccessEnvelope,
  LiveRoundData,
  MeHistoryRowData,
  MeStatsData,
  MeClaimsData,
  MeSummaryData,
  RecentRoundData,
  RoundDetailData,
  SeasonCurrentData,
  SeasonRankRowData,
  TxIntentData,
} from "./types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiSuccessEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && payload.ok === false
      ? payload.error
      : ({ code: "BAD_RESPONSE", message: `HTTP ${response.status}` } as ApiErrorPayload);

    throw new ApiClientError(error.message, error.code, response.status);
  }

  return payload;
}

export const walletApi = {
  getMeSummary(address: string) {
    const q = encodeURIComponent(address);
    return request<MeSummaryData>(`/mesummary?address=${q}`);
  },

  getMeClaims(address: string) {
    const q = encodeURIComponent(address);
    return request<MeClaimsData>(`/meclaims?address=${q}`);
  },

  buildPassMintIntent(address: string) {
    return request<TxIntentData>(`/txpassmint-intent`, {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  buildClaimAllIntent(address: string) {
    return request<TxIntentData>(`/txclaimall-intent`, {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  getRoundsLive() {
    return request<LiveRoundData[]>(`/roundslive`);
  },

  getRoundsRecent(limit = 20) {
    return request<RecentRoundData[]>(`/roundsrecent?limit=${encodeURIComponent(String(limit))}`);
  },

  getRoundDetails(roundId: number) {
    return request<RoundDetailData>(`/rounds/${roundId}`);
  },

  getMeHistory(address: string) {
    const q = encodeURIComponent(address);
    return request<MeHistoryRowData[]>(`/mehistory?address=${q}`);
  },

  getMeStats(address: string) {
    const q = encodeURIComponent(address);
    return request<MeStatsData>(`/mestats?address=${q}`);
  },

  getSeasonCurrent() {
    return request<SeasonCurrentData>(`/season/current`);
  },

  getSeasonRank(seasonId: number) {
    return request<SeasonRankRowData[]>(`/season/${seasonId}/rank`);
  },

  buildRoundJoinIntent(address: string, roundId: number) {
    return request<TxIntentData>(`/txroundjoin-intent`, {
      method: "POST",
      body: JSON.stringify({ address, roundId }),
    });
  },
};

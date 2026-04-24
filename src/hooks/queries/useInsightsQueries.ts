import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../../api/client";
import { roundQueryKeys, seasonQueryKeys, walletQueryKeys } from "../../api/keys";
import { isLiveSummaryMode } from "../../config/dataMode";

const REFRESH_MS = 12_000;

export function useRoundsRecent(limit = 20) {
  const enabled = isLiveSummaryMode();

  return useQuery({
    queryKey: roundQueryKeys.recentRounds(limit),
    queryFn: () => walletApi.getRoundsRecent(limit),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

export function useRoundDetails(roundId: number | null) {
  const enabled = isLiveSummaryMode() && Number.isFinite(roundId);

  return useQuery({
    queryKey: roundId ? roundQueryKeys.roundDetails(roundId) : ["rounds", "details", "none"],
    queryFn: () => walletApi.getRoundDetails(roundId as number),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

export function useMeHistory(address: string | null) {
  const enabled = isLiveSummaryMode() && Boolean(address);

  return useQuery({
    queryKey: address ? walletQueryKeys.meHistory(address) : ["wallet", "meHistory", "disconnected"],
    queryFn: () => walletApi.getMeHistory(address as string),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

export function useMeStats(address: string | null) {
  const enabled = isLiveSummaryMode() && Boolean(address);

  return useQuery({
    queryKey: address ? walletQueryKeys.meStats(address) : ["wallet", "meStats", "disconnected"],
    queryFn: () => walletApi.getMeStats(address as string),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

export function useSeasonCurrent() {
  const enabled = isLiveSummaryMode();

  return useQuery({
    queryKey: seasonQueryKeys.current(),
    queryFn: () => walletApi.getSeasonCurrent(),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

export function useSeasonRank(seasonId: number | null) {
  const enabled = isLiveSummaryMode() && Number.isFinite(seasonId);

  return useQuery({
    queryKey: seasonQueryKeys.rank(seasonId),
    queryFn: () => walletApi.getSeasonRank(seasonId as number),
    enabled,
    refetchInterval: enabled ? REFRESH_MS : false,
  });
}

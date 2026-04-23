import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../../api/client";
import { walletQueryKeys } from "../../api/keys";
import { isLiveSummaryMode } from "../../config/dataMode";

const SUMMARY_REFETCH_MS = 12_000;
const CLAIMS_REFETCH_MS = 12_000;

export function useMeSummary(address: string | null) {
  const enabled = Boolean(address) && isLiveSummaryMode();

  return useQuery({
    queryKey: address ? walletQueryKeys.meSummary(address) : ["wallet", "meSummary", "disconnected"],
    queryFn: () => walletApi.getMeSummary(address as string),
    enabled,
    refetchInterval: enabled ? SUMMARY_REFETCH_MS : false,
  });
}

export function useMeClaims(address: string | null) {
  const enabled = Boolean(address) && isLiveSummaryMode();

  return useQuery({
    queryKey: address ? walletQueryKeys.meClaims(address) : ["wallet", "meClaims", "disconnected"],
    queryFn: () => walletApi.getMeClaims(address as string),
    enabled,
    refetchInterval: enabled ? CLAIMS_REFETCH_MS : false,
  });
}

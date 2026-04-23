import { useQuery } from "@tanstack/react-query";
import { walletApi } from "../../api/client";
import { roundQueryKeys } from "../../api/keys";
import { isLiveSummaryMode } from "../../config/dataMode";

const ROUNDS_REFETCH_MS = 10_000;

export function useLiveRounds() {
  const enabled = isLiveSummaryMode();

  return useQuery({
    queryKey: roundQueryKeys.liveRounds(),
    queryFn: () => walletApi.getRoundsLive(),
    enabled,
    refetchInterval: enabled ? ROUNDS_REFETCH_MS : false,
  });
}

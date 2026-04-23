import { useEffect } from "react";
import { getApiErrorMessage } from "../api/format";
import { isLiveSummaryMode } from "../config/dataMode";
import { useLiveRounds } from "./queries/useRoundQueries";
import { useRoundStore } from "../store/roundStore";
import { useWalletStore } from "../store/walletStore";

export function useRoundApiSync() {
  const applyLiveRounds = useRoundStore((state) => state.applyLiveRounds);
  const setDataError = useRoundStore((state) => state.setDataError);

  const activeRoundId = useWalletStore((state) => state.activeRoundId);
  const enabled = isLiveSummaryMode();

  const liveRoundsQuery = useLiveRounds();

  useEffect(() => {
    if (!enabled) {
      setDataError(null);
      return;
    }

    if (liveRoundsQuery.data?.ok) {
      applyLiveRounds(liveRoundsQuery.data.data, liveRoundsQuery.data.meta, activeRoundId);
    }
  }, [enabled, liveRoundsQuery.data, applyLiveRounds, activeRoundId, setDataError]);

  useEffect(() => {
    if (!enabled) {
      setDataError(null);
      return;
    }

    setDataError(liveRoundsQuery.error ? getApiErrorMessage(liveRoundsQuery.error) : null);
  }, [enabled, liveRoundsQuery.error, setDataError]);

  return { liveRoundsQuery };
}

import { useEffect } from "react";
import { getApiErrorMessage } from "../api/format";
import { isLiveSummaryMode } from "../config/dataMode";
import { useMeClaims, useMeSummary } from "./queries/useWalletQueries";
import { useWalletStore } from "../store/walletStore";

export function useWalletApiSync() {
  const status = useWalletStore((state) => state.status);
  const addressFull = useWalletStore((state) => state.addressFull);
  const applySummary = useWalletStore((state) => state.applySummaryData);
  const applyClaims = useWalletStore((state) => state.applyClaimsData);
  const setDataError = useWalletStore((state) => state.setDataError);

  const liveEnabled = isLiveSummaryMode() && status === "connected" && Boolean(addressFull);

  const summaryQuery = useMeSummary(liveEnabled ? addressFull : null);
  const claimsQuery = useMeClaims(liveEnabled ? addressFull : null);

  useEffect(() => {
    if (summaryQuery.data?.ok) {
      applySummary(summaryQuery.data.data, summaryQuery.data.meta);
    }
  }, [summaryQuery.data, applySummary]);

  useEffect(() => {
    if (claimsQuery.data?.ok) {
      applyClaims(claimsQuery.data.data, claimsQuery.data.meta);
    }
  }, [claimsQuery.data, applyClaims]);

  useEffect(() => {
    if (!liveEnabled) {
      setDataError(null);
      return;
    }

    const error = summaryQuery.error ?? claimsQuery.error;
    setDataError(error ? getApiErrorMessage(error) : null);
  }, [liveEnabled, summaryQuery.error, claimsQuery.error, setDataError]);

  return {
    summaryQuery,
    claimsQuery,
  };
}

import { ApiClientError, walletApi } from "../api/client";
import { getApiErrorMessage } from "../api/format";
import { roundQueryKeys, walletQueryKeys } from "../api/keys";
import { isMockMode } from "../config/dataMode";
import { queryClient } from "../query/client";
import { useRoundStore } from "../store/roundStore";
import { useWalletStore } from "../store/walletStore";
import { sendIntentTransaction } from "./wallet/provider";

const POLL_INTERVAL_MS = 2_500;
const MAX_POLLS = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function refetchSummary(addressFull: string) {
  await queryClient.invalidateQueries({ queryKey: walletQueryKeys.meSummary(addressFull) });
  return queryClient.fetchQuery({
    queryKey: walletQueryKeys.meSummary(addressFull),
    queryFn: () => walletApi.getMeSummary(addressFull),
    staleTime: 0,
  });
}

async function refetchLiveRounds() {
  await queryClient.invalidateQueries({ queryKey: roundQueryKeys.liveRounds() });
  return queryClient.fetchQuery({
    queryKey: roundQueryKeys.liveRounds(),
    queryFn: () => walletApi.getRoundsLive(),
    staleTime: 0,
  });
}

export async function joinRound(roundId: number) {
  const wallet = useWalletStore.getState();
  const round = useRoundStore.getState();

  if (wallet.status !== "connected") {
    throw new Error("Wallet not connected");
  }
  if (!wallet.addressFull) {
    throw new Error("Wallet address missing");
  }

  if (isMockMode()) {
    // Mock path stays unchanged for pure mock mode.
    return;
  }

  round.setJoinAwaitingSignature(roundId);

  try {
    const intentEnvelope = await walletApi.buildRoundJoinIntent(wallet.addressFull, roundId);
    const tx = await sendIntentTransaction(intentEnvelope.data);
    round.setJoinPending(roundId, tx.hash);

    await tx.wait();
    round.setJoinConfirmed(roundId, tx.hash);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.meSummary(wallet.addressFull) }),
      queryClient.invalidateQueries({ queryKey: walletQueryKeys.meClaims(wallet.addressFull) }),
      queryClient.invalidateQueries({ queryKey: roundQueryKeys.liveRounds() }),
    ]);

    for (let i = 0; i < MAX_POLLS; i += 1) {
      const [summary] = await Promise.all([refetchSummary(wallet.addressFull), refetchLiveRounds()]);
      if (summary.data.activeRoundId === roundId) break;
      await sleep(POLL_INTERVAL_MS);
    }

    await sleep(300);
    useRoundStore.getState().clearJoinState();
  } catch (error) {
    const code = error instanceof ApiClientError ? error.code : null;
    useRoundStore.getState().setJoinFailed(roundId, code, getApiErrorMessage(error));
    throw error;
  }
}

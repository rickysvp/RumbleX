import { walletApi } from "../../api/client";
import { walletQueryKeys } from "../../api/keys";
import { queryClient } from "../../query/client";
import { useWalletStore } from "../../store/walletStore";
import { sendIntentTransaction } from "./provider";

const POLL_INTERVAL_MS = 2_500;
const MAX_POLLS = 12;

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

async function refetchClaims(addressFull: string) {
  await queryClient.invalidateQueries({ queryKey: walletQueryKeys.meClaims(addressFull) });
  return queryClient.fetchQuery({
    queryKey: walletQueryKeys.meClaims(addressFull),
    queryFn: () => walletApi.getMeClaims(addressFull),
    staleTime: 0,
  });
}

export async function runPassMintFlow(addressFull: string) {
  const store = useWalletStore.getState();
  store.setMintingPass(true);
  store.setPassStatus("checking");
  store.setDataError(null);

  try {
    const intentEnvelope = await walletApi.buildPassMintIntent(addressFull);
    const tx = await sendIntentTransaction(intentEnvelope.data);

    await tx.wait();

    for (let i = 0; i < MAX_POLLS; i += 1) {
      const summary = await refetchSummary(addressFull);
      if (summary.data.hasPass) break;
      await sleep(POLL_INTERVAL_MS);
    }

    await refetchClaims(addressFull);
  } finally {
    useWalletStore.getState().setMintingPass(false);
  }
}

export async function runClaimAllFlow(addressFull: string) {
  const store = useWalletStore.getState();
  store.setClaimingAll(true);
  store.setDataError(null);

  try {
    const intentEnvelope = await walletApi.buildClaimAllIntent(addressFull);
    const tx = await sendIntentTransaction(intentEnvelope.data);

    await tx.wait();

    for (let i = 0; i < MAX_POLLS; i += 1) {
      const claims = await refetchClaims(addressFull);
      if (claims.data.claimableTotal === "0") break;
      await sleep(POLL_INTERVAL_MS);
    }

    await refetchSummary(addressFull);
  } finally {
    useWalletStore.getState().setClaimingAll(false);
  }
}

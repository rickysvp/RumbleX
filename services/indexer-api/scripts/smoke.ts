const baseUrl = (process.env.INDEXER_API_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");
const address = process.env.SMOKE_ADDRESS;

if (!address) {
  console.error("SMOKE_ADDRESS is required");
  process.exit(1);
}

const controlledErrorCodes = new Set([
  "INDEXER_UNAVAILABLE",
  "INDEXER_STALE",
  "CHAIN_READ_FAILED",
]);

function hasRawDecodeLeak(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("could not decode result data") ||
    message.includes("BAD_DATA") ||
    message.includes("CALL_EXCEPTION")
  );
}

function payloadHasRawDecodeLeak(payload: unknown): boolean {
  const serialized = JSON.stringify(payload ?? {});
  return (
    serialized.includes("could not decode result data") ||
    serialized.includes("BAD_DATA") ||
    serialized.includes("CALL_EXCEPTION")
  );
}

async function hit(path: string) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = String(payload?.error?.code ?? "");
    const message = String(payload?.error?.message ?? "");

    if (hasRawDecodeLeak(message) || payloadHasRawDecodeLeak(payload)) {
      throw new Error(`${path} leaked raw decode error: ${message}`);
    }

    if (!controlledErrorCodes.has(code)) {
      throw new Error(`${path} returned uncontrolled error code=${code} message=${message}`);
    }

    console.log(`[smoke] ${path} controlled degraded error: ${code}`);
    return;
  }

  if (!payload?.ok) {
    throw new Error(`${path} returned unexpected payload: ${JSON.stringify(payload)}`);
  }

  const message = String(payload?.error?.message ?? "");
  if (hasRawDecodeLeak(message) || payloadHasRawDecodeLeak(payload)) {
    throw new Error(`${path} leaked raw decode error in successful payload`);
  }

  if (path.startsWith("/mesummary")) {
    const data = payload.data ?? {};
    const required = ["address", "hasPass", "claimableMon", "lockedInRounds", "seasonEstimateMon", "activeRoundId"];
    for (const field of required) {
      if (!(field in data)) {
        throw new Error(`${path} missing required field: ${field}`);
      }
    }
  }

  if (path.startsWith("/meclaims")) {
    const data = payload.data ?? {};
    if (!("claimableTotal" in data)) {
      throw new Error(`${path} missing required field: claimableTotal`);
    }
  }

  console.log(`[smoke] ${path} ok`);
}

async function main() {
  await hit(`/mesummary?address=${encodeURIComponent(address)}`);
  await hit(`/meclaims?address=${encodeURIComponent(address)}`);
  console.log("[smoke] PASS");
}

main().catch((error) => {
  console.error("[smoke] FAIL", error);
  process.exit(1);
});

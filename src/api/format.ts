import { formatEther } from "ethers";
import { ApiClientError } from "./client";

export function normalizeMonString(value: string | number | null | undefined, precision = 4): string {
  if (value === null || value === undefined) return "0";

  const raw = String(value).trim();
  if (raw.length === 0) return "0";

  try {
    if (raw.includes(".")) {
      return Number(raw).toFixed(precision).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    }
    const asEther = formatEther(BigInt(raw));
    return Number(asEther).toFixed(precision).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
  } catch {
    const fallback = Number(raw);
    if (Number.isFinite(fallback)) {
      return fallback.toFixed(precision).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    }
    return "0";
  }
}

export function normalizeMonNumber(value: string | number | null | undefined): number {
  const normalized = Number(normalizeMonString(value, 6));
  return Number.isFinite(normalized) ? normalized : 0;
}

export function formatAddressShort(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    const byCode: Record<string, string> = {
      PASS_REQUIRED: "RumbleX Pass required",
      NOTHING_TO_CLAIM: "No claimable MON",
      TX_BUILD_FAILED: "Failed to build transaction",
      INDEXER_STALE: "Indexer data is stale",
      INDEXER_UNAVAILABLE: "Indexer unavailable",
      PASS_ALREADY_OWNED: "Pass already owned",
      ROUND_NOT_JOINABLE: "Round is not joinable",
      ALREADY_JOINED: "Already joined this round",
      CHAIN_READ_FAILED: "Chain read failed",
    };
    return byCode[error.code] ?? error.message;
  }

  if (error instanceof Error) return error.message;
  return "Request failed";
}

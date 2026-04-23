export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export function toBigInt(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (value && typeof value === "object" && "toString" in value) {
    return BigInt((value as { toString: () => string }).toString());
  }
  throw new Error(`Unable to cast value to bigint: ${String(value)}`);
}

export function bnToString(value: bigint): string {
  return value.toString();
}

export function sumWei(values: string[]): string {
  const total = values.reduce((acc, v) => acc + BigInt(v), 0n);
  return total.toString();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    return Number((value as { toString: () => string }).toString());
  }
  throw new Error(`Unable to parse number from value: ${String(value)}`);
}

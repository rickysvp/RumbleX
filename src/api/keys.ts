export const walletQueryKeys = {
  meSummary: (address: string) => ["wallet", "meSummary", address.toLowerCase()] as const,
  meClaims: (address: string) => ["wallet", "meClaims", address.toLowerCase()] as const,
  meHistory: (address: string) => ["wallet", "meHistory", address.toLowerCase()] as const,
  meStats: (address: string) => ["wallet", "meStats", address.toLowerCase()] as const,
};

export const roundQueryKeys = {
  liveRounds: () => ["rounds", "live"] as const,
  recentRounds: (limit: number) => ["rounds", "recent", limit] as const,
  roundDetails: (roundId: number) => ["rounds", "details", roundId] as const,
};

export const seasonQueryKeys = {
  current: () => ["season", "current"] as const,
  rank: (seasonId: number | null) => ["season", "rank", seasonId ?? "none"] as const,
};

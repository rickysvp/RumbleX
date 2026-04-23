export const walletQueryKeys = {
  meSummary: (address: string) => ["wallet", "meSummary", address.toLowerCase()] as const,
  meClaims: (address: string) => ["wallet", "meClaims", address.toLowerCase()] as const,
};

export const roundQueryKeys = {
  liveRounds: () => ["rounds", "live"] as const,
};

export type RoundPhase = "entry_open" | "live" | "concluded";

export type StrategyId = "go_loud" | "lay_low" | "chaos_mode";

export type SkillId = 
  | "one_tap" 
  | "bounty_rush" 
  | "no_u" 
  | "smoke_out" 
  | "play_dead" 
  | "miss_me";

export type ItemId = 
  | "uno_reverse" 
  | "back_off_horn" 
  | "act_natural" 
  | "slip_card" 
  | "decoy_dummy" 
  | "drama_bomb";

export interface Player {
  id: string;
  handle: string;
  isUser: boolean;
  status: "alive" | "eliminated" | "queued" | "spectating";
  mon: number;
  kills: number;
  eliminatedAt: number | null;
  eliminatedBy: string | null;
  skill: SkillId | null;
  item: ItemId | null;
  strategy: StrategyId;
}

export interface FeedEvent {
  id: string;
  timestamp: number;
  type: "elim" | "loot" | "ability" | "system" | "chat";
  text: string;
  attacker: string | null;
  target: string | null;
  monAmount: number | null;
  skillUsed: SkillId | null;
  itemUsed: ItemId | null;
}

export interface RoundResult {
  roundNumber: number;
  champion: string;
  championMon: number;
  payouts: { place: number; handle: string; mon: number; kills: number }[];
  totalVolume: number;
}

export interface SeasonEntry {
  handle: string;
  kills: number;
  qualified: boolean;
  estimatedPayout: number;
  isUser: boolean;
}

export interface UserLoadout {
  rounds: number;
  strategy: StrategyId;
  skill: SkillId | null;
  item: ItemId | null;
  queued: boolean;
  queueRemaining: number;
}

export interface UserHistoryEntry {
  roundNumber: number;
  result: "win" | "elim" | "queued";
  monDelta: number;
  skill: SkillId | null;
}

export interface UserStats {
  wins: number;
  games: number;
  netMon: number;
}

export interface GameState {
  // Round
  phase: RoundPhase;
  roundNumber: number;
  timeRemaining: number;
  entryFee: number;
  prizePool: number;

  // Players
  players: Player[];

  // Feed
  feedEvents: FeedEvent[];

  // Season
  seasonNumber: number;
  seasonEndsIn: number;
  seasonPool: number;
  leaderboard: SeasonEntry[];
  totalQualifiedKills: number;

  // Treasury
  protocolVault: number;
  totalRoundsPlayed: number;
  totalVolume: number;

  // Last round
  lastRoundResult: RoundResult | null;

  // User loadout
  userLoadout: UserLoadout;

  // User history
  userHistory: UserHistoryEntry[];
  userStats: UserStats;

  // Audit/UX Loop triggers
  recentChampions: string[];
  lastElimination: { attacker: string; target: string; mon: number; timestamp: number } | null;
}

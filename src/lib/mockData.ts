import { GameState } from '../store/types';

export const INITIAL_MOCK_STATE: GameState = {
  phase: "entry_open",
  roundNumber: 843,
  timeRemaining: 299,
  entryFee: 1,
  prizePool: 432,

  players: [
    { 
      id: 'p1', handle: "CryptoKnight", isUser: false, status: "queued", 
      mon: 0.8, kills: 0, skill: "one_tap", eliminatedAt: null, eliminatedBy: null,
      strategy: "go_loud", item: null 
    },
    { 
      id: 'p2', handle: "DegenBear25", isUser: false, status: "queued", 
      mon: 0.8, kills: 0, skill: null, eliminatedAt: null, eliminatedBy: null,
      strategy: "lay_low", item: null 
    },
    { 
      id: 'p3', handle: "VoidWalker", isUser: false, status: "queued", 
      mon: 0.8, kills: 0, skill: "bounty_rush", eliminatedAt: null, eliminatedBy: null,
      strategy: "go_loud", item: null 
    },
    // Mock for user until queued
    {
      id: 'user_pilot', handle: "PILOT_01", isUser: true, status: "spectating",
      mon: 0, kills: 0, skill: null, eliminatedAt: null, eliminatedBy: null,
      strategy: "chaos_mode", item: null
    }
  ],

  feedEvents: [
    {
      id: 'init_1', timestamp: 0, type: 'system', text: "ROUND #843 OPEN. ENTRY: 1 MON.",
      attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
    }
  ],

  leaderboard: [
    { handle: "CryptoKnight", kills: 847, qualified: true,  estimatedPayout: 312.4, isUser: false },
    { handle: "VoidWalker",   kills: 634, qualified: true,  estimatedPayout: 233.8, isUser: false },
    { handle: "DegenBear25",  kills: 521, qualified: true,  estimatedPayout: 192.1, isUser: false },
    { handle: "PILOT_01",     kills: 67,  qualified: false, estimatedPayout: 0,     isUser: true },
    { handle: "NullPointer",  kills: 412, qualified: true,  estimatedPayout: 151.9, isUser: false },
  ],
  totalQualifiedKills: 2414,

  lastRoundResult: {
    roundNumber: 842,
    champion: "CryptoKnight",
    championMon: 3.2,
    payouts: [
      { place: 1, handle: "CryptoKnight", mon: 2.40 },
      { place: 2, handle: "DegenBear25",  mon: 0.32 },
      { place: 3, handle: "VoidWalker",   mon: 0.16 },
    ],
    totalVolume: 43.2
  },

  userHistory: [
    { roundNumber: 843, result: "queued", monDelta: 0, skill: null },
    { roundNumber: 842, result: "win",    monDelta: 2.4, skill: "one_tap" },
    { roundNumber: 841, result: "elim",   monDelta: -1.0, skill: "smoke_out" },
    { roundNumber: 840, result: "win",    monDelta: 1.8, skill: "bounty_rush" },
    { roundNumber: 839, result: "elim",   monDelta: -1.0, skill: null },
  ],

  protocolVault: 1240,
  totalRoundsPlayed: 842,
  totalVolume: 12430,
  seasonNumber: 1,
  seasonEndsIn: 1231200,
  seasonPool: 847,

  userLoadout: {
    rounds: 1,
    strategy: "chaos_mode",
    skill: null,
    item: null,
    queued: false,
    queueRemaining: 0
  },
  userStats: {
    wins: 2,
    games: 5,
    netMon: 1.4
  }
};

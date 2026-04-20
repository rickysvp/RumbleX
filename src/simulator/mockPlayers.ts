import { Player, SkillId, ItemId, StrategyId } from '../store/types';

const HANDLES: string[] = [
  "CryptoKnight", "DegenBear25", "VoidWalker", "NullPointer", "Zero_Cool",
  "Neo_Drifter", "GhostByte", "Phantom_X", "Rogue99", "IronFist",
  "DarkPulse", "ByteHunter", "NeonReaper", "ShadowStack", "CyberWolf",
  "DataPhantom", "QuantumRogue", "BitStorm", "HexBlade", "NetRunner",
  "CodeBreaker", "PixelWraith", "GlitchMaster", "TokenGhost", "ChainReactor",
  "BlockViper", "HashDemon", "NodeSlayer", "CryptoSage", "MintWalker",
  "SoulCompiler", "RustOracle", "GasGuzzler", "WagmiKing", "HODL_Overlord",
  "RektSurvivor", "MEV_Hunter", "AlphaWhale", "DustCollector", "FloorSweeper",
  "LiquidityLord", "YieldFarmer", "StakeNinja", "BridgeBandit", "AirdropSniper",
  "GaslessGhost", "ValidatorX", "SlashRisk", "EpochRider", "SlotChamp"
];

const STRATEGIES: StrategyId[] = ["go_loud", "lay_low", "chaos_mode"];
const SKILLS: SkillId[] = ["one_tap", "bounty_rush", "no_u", "smoke_out", "play_dead", "miss_me"];
const ITEMS: ItemId[] = ["uno_reverse", "back_off_horn", "act_natural", "slip_card", "decoy_dummy", "drama_bomb"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMockPlayers(count: number, includeUser: boolean = true): Player[] {
  const players: Player[] = [];
  const usedHandles = new Set<string>();

  if (includeUser) {
    players.push({
      id: 'user_pilot',
      handle: 'PILOT_01',
      isUser: true,
      status: 'spectating',
      mon: 0,
      kills: 0,
      eliminatedAt: null,
      eliminatedBy: null,
      skill: null,
      item: null,
      strategy: 'chaos_mode'
    });
  }

  const npcCount = includeUser ? count - 1 : count;

  for (let i = 0; i < npcCount; i++) {
    let handle = HANDLES[i % HANDLES.length];
    if (usedHandles.has(handle)) {
      handle = `${handle}_${i}`;
    }
    usedHandles.add(handle);

    players.push({
      id: `p${i + 1}`,
      handle,
      isUser: false,
      status: 'queued',
      mon: 0.5 + Math.random() * 1.0,
      kills: 0,
      eliminatedAt: null,
      eliminatedBy: null,
      skill: Math.random() > 0.4 ? pick(SKILLS) : null,
      item: Math.random() > 0.6 ? pick(ITEMS) : null,
      strategy: pick(STRATEGIES)
    });
  }

  return players;
}

export function getHandlePool(): string[] {
  return [...HANDLES];
}

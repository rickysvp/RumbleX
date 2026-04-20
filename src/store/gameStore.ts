import { create } from 'zustand';
import { GameState, RoundPhase, Player, FeedEvent, UserLoadout, SkillId, ItemId, StrategyId, SeasonEntry } from './types';
import { INITIAL_MOCK_STATE } from '../lib/mockData';
import { narrativeEngine } from '../lib/narrativeEngine';
import { computeSeasonPayouts } from '../lib/seasonEngine';
import { SEASON_CONFIG } from '../lib/seasonConfig';

interface GameStore extends GameState {
  // Actions
  tickTimer: () => void;
  startRound: () => void;
  concludeRound: () => void;
  openNextRound: () => void;
  addFeedEvent: (event: Omit<FeedEvent, 'id'>) => void;
  playerEliminated: (killCreditId: string, targetId: string, monLooted: number, skillUsed?: SkillId | null, itemUsed?: ItemId | null) => void;
  queueUserLoadout: (loadout: Partial<UserLoadout>, txHash?: string) => void;
  concludeSeason: () => void;
}

const ROUND_DURATION = 600;
const INTERMISSION_DURATION = 90;
const ENTRY_DURATION = 300;

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_MOCK_STATE,

  tickTimer: () => {
    const { phase, timeRemaining, seasonEndsIn, startRound, concludeRound, openNextRound, concludeSeason } = get();
    
    // Check for season end
    if (seasonEndsIn <= 0) {
      concludeSeason();
    }

    if (timeRemaining <= 0) {
      if (phase === 'entry_open') startRound();
      else if (phase === 'live') concludeRound();
      else if (phase === 'concluded') openNextRound();
      return;
    }

    set({ timeRemaining: timeRemaining - 1 });
  },

  startRound: () => {
    set((state) => {
      const livePlayers = state.players.map(p => 
        p.status === 'queued' ? { ...p, status: 'alive' as const, mon: 1.0 } : p
      );
      
      const aliveCount = livePlayers.filter(p => p.status === 'alive').length;
      
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 0,
        type: 'system' as const,
        text: narrativeEngine.generateSystem('round_live', { round: state.roundNumber, count: aliveCount }),
        attacker: null,
        target: null,
        monAmount: null,
        skillUsed: null,
        itemUsed: null
      };

      return {
        phase: 'live' as const,
        timeRemaining: ROUND_DURATION,
        players: livePlayers,
        feedEvents: [...state.feedEvents, newEvent].slice(-200)
      };
    });
  },

  concludeRound: () => {
    set((state) => {
      const allParticipants = state.players.filter(p => p.status !== 'spectating');
      const elimList = state.players
        .filter(p => p.status === 'eliminated')
        .sort((a, b) => (b.eliminatedAt || 0) - (a.eliminatedAt || 0));
      
      const alivePlayers = state.players.filter(p => p.status === 'alive');
      const champion = alivePlayers.length > 0 
        ? alivePlayers.reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr))
        : elimList[0];

      if (!champion) return state; // Safety check

      const totalRoundMON = state.players.reduce((acc, p) => acc + p.mon, 0);
      const feeTotal = totalRoundMON * 0.1;
      const prizePool = totalRoundMON - feeTotal; // 10% total cuts (5% platform, 5% season)
      
      // Standings based on survival time and then mon
      const standings = [
        ...alivePlayers.sort((a, b) => b.mon - a.mon),
        ...elimList
      ];

      const roundSummary = {
        roundNumber: state.roundNumber,
        champion: champion.handle,
        championMon: prizePool * 0.75, // 75% share
        payouts: [
          { place: 1, handle: champion.handle, mon: prizePool * 0.75 },
          ...(standings[1] ? [{ place: 2, handle: standings[1].handle, mon: prizePool * 0.10 }] : []),
          ...(standings[2] ? [{ place: 3, handle: standings[2].handle, mon: prizePool * 0.05 }] : [])
        ],
        totalVolume: totalRoundMON
      };

      // Update user history if user was in round
      const user = state.players.find(p => p.isUser);
      let newUserHistory = state.userHistory;
      if (user && (user.status === 'alive' || user.status === 'eliminated')) {
        newUserHistory = [
          {
            roundNumber: state.roundNumber,
            result: (user.status === 'alive' ? 'win' : 'elim') as 'win' | 'elim',
            monDelta: user.status === 'alive'
              ? parseFloat((user.mon - state.entryFee).toFixed(2))
              : parseFloat((-state.entryFee).toFixed(2)),
            skill: user.skill
          },
          ...state.userHistory
        ].slice(0, 20);
      }

      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: ROUND_DURATION,
        type: 'system' as const,
        text: narrativeEngine.generateSystem('round_concluded', { 
            round: state.roundNumber, 
            champion: champion.handle, 
            mon: champion.mon.toFixed(1) 
        }),
        attacker: null,
        target: null,
        monAmount: null,
        skillUsed: null,
        itemUsed: null
      };

      // Handle queue remaining
      let newLoadout = { ...state.userLoadout };
      if (newLoadout.queueRemaining > 0) {
        newLoadout.queueRemaining -= 1;
        if (newLoadout.queueRemaining === 0) newLoadout.queued = false;
      }

      return {
        phase: 'concluded' as const,
        lastRoundResult: roundSummary,
        userHistory: newUserHistory,
        userStats: {
            wins: newUserHistory.filter(h => h.result === 'win').length,
            games: newUserHistory.length,
            netMon: newUserHistory.reduce((acc, h) => acc + h.monDelta, 0)
        },
        timeRemaining: INTERMISSION_DURATION,
        userLoadout: newLoadout,
        feedEvents: [...state.feedEvents, newEvent].slice(-200),
        protocolVault: state.protocolVault + (feeTotal * 0.5),
        seasonPool: state.seasonPool + (feeTotal * 0.5),
        recentChampions: [champion.handle, ...state.recentChampions].slice(0, 10),
        totalRoundsPlayed: state.totalRoundsPlayed + 1,
        totalVolume: state.totalVolume + totalRoundMON
      };
    });
  },

  openNextRound: () => {
    set((state) => {
      const nextRound = state.roundNumber + 1;
      
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 0,
        type: 'system' as const,
        text: narrativeEngine.generateSystem('round_open', { round: nextRound, fee: state.entryFee }),
        attacker: null,
        target: null,
        monAmount: null,
        skillUsed: null,
        itemUsed: null
      };

      // Handle Queue Persistence
      let newLoadout = { ...state.userLoadout };
      let userInNextRound = false;
      let extraEvents: any[] = [];

      if (newLoadout.queueRemaining > 0) {
        newLoadout.queueRemaining -= 1;
        newLoadout.queued = true;
        userInNextRound = true;

        extraEvents.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: 0,
          type: 'system' as const,
          text: `★ PILOT_01 auto-queued for ROUND #${nextRound}. ${newLoadout.queueRemaining} round(s) remaining.`,
          attacker: null, target: null, monAmount: null, 
          skillUsed: null, itemUsed: null
        });
      } else {
        newLoadout.queued = false;
        // Reset to strategy defaults if queue is empty
        newLoadout.rounds = 1;
      }

      // Reset players to spectating except those who should be auto-queued
      const freshPlayers = INITIAL_MOCK_STATE.players.map(p => {
        if (p.isUser) {
           return { 
              ...p, 
              status: userInNextRound ? 'queued' as const : 'spectating' as const,
              strategy: newLoadout.strategy,
              skill: newLoadout.skill,
              item: newLoadout.item
           };
        }
        return { ...p, status: 'queued' as const };
      });

      return {
        phase: 'entry_open' as const,
        roundNumber: nextRound,
        timeRemaining: ENTRY_DURATION,
        players: freshPlayers,
        userLoadout: newLoadout,
        feedEvents: [...state.feedEvents, ...extraEvents, newEvent].slice(-200)
      };
    });
  },

  addFeedEvent: (event) => {
    set((state) => ({
      feedEvents: [...state.feedEvents, { ...event, id: Math.random().toString(36).substr(2, 9) }].slice(-200)
    }));
  },

  playerEliminated: (killCreditId, targetId, monLooted, skillUsed, itemUsed) => {
    set((state) => {
      const attacker = state.players.find(p => p.id === killCreditId);
      const target = state.players.find(p => p.id === targetId);
      if (!attacker || !target) return state;

      // 1. Update round players
      const newPlayers = state.players.map(p => {
        if (p.id === targetId) return { 
            ...p, 
            status: 'eliminated' as const, 
            mon: 0, 
            eliminatedAt: ROUND_DURATION - state.timeRemaining,
            eliminatedBy: attacker.handle 
        };
        if (p.id === killCreditId) return { 
            ...p, 
            mon: p.mon + monLooted, 
            kills: p.kills + 1 
        };
        return p;
      });

      // 2. Update season leaderboard kills
      const newLeaderboard = state.leaderboard.map(e => {
        if (e.handle === attacker.handle) {
          return { ...e, kills: e.kills + 1 };
        }
        return e;
      });

      // 3. Recompute season payouts
      const { updatedLeaderboard, totalQualifiedKills } = computeSeasonPayouts(
        newLeaderboard,
        state.seasonPool,
        SEASON_CONFIG.SEASON_KILL_THRESHOLD
      );

      const newEvent: FeedEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: ROUND_DURATION - state.timeRemaining,
        type: 'elim',
        text: narrativeEngine.generateElim(attacker.handle, target.handle, monLooted),
        attacker: attacker.handle,
        target: target.handle,
        monAmount: monLooted,
        skillUsed: skillUsed || null,
        itemUsed: itemUsed || null
      };

      const newState = {
        players: newPlayers,
        leaderboard: updatedLeaderboard,
        totalQualifiedKills,
        feedEvents: [...state.feedEvents, newEvent].slice(-200),
        lastElimination: { 
          attacker: attacker.handle, 
          target: target.handle, 
          mon: monLooted, 
          timestamp: Date.now() 
        }
      };

      // Check for survivor auto-conclude
      const remaining = newPlayers.filter(p => p.status === 'alive').length;
      if (remaining <= 1 && state.phase === 'live') {
        setTimeout(() => get().concludeRound(), 10);
      }

      return newState;
    });
  },

  concludeSeason: () => {
    set((state) => {
      const finalResult = computeSeasonPayouts(
        state.leaderboard,
        state.seasonPool,
        SEASON_CONFIG.SEASON_KILL_THRESHOLD
      );

      const qualifiedCount = finalResult.updatedLeaderboard.filter(e => e.qualified).length;

      const finishEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 0,
        type: 'system' as const,
        text: `SEASON ${state.seasonNumber} CONCLUDED. ${qualifiedCount} PLAYERS QUALIFIED. ${state.seasonPool.toFixed(0)} MON AIRDROPPED.`,
        attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
      };

      return {
        seasonNumber: state.seasonNumber + 1,
        seasonPool: 0,
        seasonEndsIn: SEASON_CONFIG.SEASON_DURATION_DAYS * 86400,
        leaderboard: state.leaderboard.map(e => ({
          ...e,
          kills: 0,
          qualified: false,
          estimatedPayout: 0
        })),
        totalQualifiedKills: 0,
        feedEvents: [...state.feedEvents, finishEvent].slice(-200)
      };
    });
  },

  queueUserLoadout: (loadout, txHash?: string) => {
    set((state) => {
      // Defensive check (UI also gates this)
      const newLoadout = { ...state.userLoadout, ...loadout, queued: true };
      const totalCost = (state.entryFee + (loadout.skill ? 1.5 : 0) + (loadout.item ? 1 : 0)) * (loadout.rounds || 1);
      
      const newPlayers = state.players.map(p => 
        p.isUser ? { 
            ...p, 
            status: 'queued' as const, 
            strategy: loadout.strategy || p.strategy,
            skill: loadout.skill || p.skill,
            item: loadout.item || p.item
        } : p
      );

      const txSuffix = txHash ? ` TX: ${txHash.substring(0, 10)}...` : '';
      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: 0,
        type: 'system' as const,
        text: `★ PILOT_01 queued ${newLoadout.rounds} round(s) for ${totalCost.toFixed(1)} MON. Loadout locked.${txSuffix}`,
        attacker: null,
        target: null,
        monAmount: totalCost,
        skillUsed: loadout.skill || null,
        itemUsed: loadout.item || null
      };

      return {
        userLoadout: newLoadout,
        players: newPlayers,
        prizePool: state.prizePool + totalCost,
        feedEvents: [...state.feedEvents, newEvent].slice(-200)
      };
    });
  }
}));

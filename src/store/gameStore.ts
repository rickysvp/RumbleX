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
    const { phase, players, timeRemaining, seasonEndsIn, startRound, concludeRound, openNextRound, concludeSeason, addFeedEvent, roundNumber } = get();
    
    // Check for season end
    if (seasonEndsIn <= 0) {
      concludeSeason();
    }

    // Phase-specific broadcasts
    if (timeRemaining > 0) {
      if (phase === 'entry_open') {
        const checkpoints = [270, 240, 210, 180, 150, 120, 90, 60, 30, 10];
        if (checkpoints.includes(timeRemaining)) {
          addFeedEvent({
            timestamp: 0,
            type: 'system',
            text: narrativeEngine.generateSystem('entry_countdown', { time: timeRemaining, round: roundNumber }),
            attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
          });
        }
      } else if (phase === 'live') {
        // Every 60s, plus 30s and 10s warnings
        if (timeRemaining % 60 === 0 || timeRemaining === 30 || timeRemaining === 10) {
          const aliveCount = players.filter(p => p.status === 'alive').length;
          addFeedEvent({
            timestamp: ROUND_DURATION - timeRemaining,
            type: 'system',
            text: narrativeEngine.generateSystem('live_status', { count: aliveCount, time: timeRemaining }),
            attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
          });
        }

        // Every 120s: biggest stack or top frag update
        if (timeRemaining > 0 && timeRemaining % 120 === 0) {
          const alivePlayers = players.filter(p => p.status === 'alive');
          if (alivePlayers.length > 0) {
            const isTopFrag = Math.random() < 0.5;
            if (isTopFrag) {
              const topFrag = alivePlayers.reduce((prev, curr) => (prev.kills > curr.kills ? prev : curr));
              addFeedEvent({
                timestamp: ROUND_DURATION - timeRemaining,
                type: 'system',
                text: narrativeEngine.generateSystem('top_frag', { handle: topFrag.handle, kills: topFrag.kills, round: roundNumber }),
                attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
              });
            } else {
              const biggest = alivePlayers.reduce((prev, curr) => (prev.mon > curr.mon ? prev : curr));
              addFeedEvent({
                timestamp: ROUND_DURATION - timeRemaining,
                type: 'system',
                text: narrativeEngine.generateSystem('biggest_stack', { handle: biggest.handle, mon: biggest.mon.toFixed(1) }),
                attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
              });
            }
          }
        }
      }
    }

    // Auto-conclude if only 1 survivor left (and round is live)
    if (phase === 'live') {
      const remaining = players.filter(p => p.status === 'alive').length;
      if (remaining <= 1) {
        concludeRound();
        return;
      }
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
        p.status === 'queued' ? { ...p, status: 'alive' as const, mon: state.entryFee } : p
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
      const participants = state.players.filter(p => p.status !== 'spectating');
      const elimList = state.players.filter(p => p.status === 'eliminated');
      const alivePlayers = state.players.filter(p => p.status === 'alive');
      
      if (participants.length === 0) return { ...state, phase: 'concluded' as const, timeRemaining: INTERMISSION_DURATION };

      const totalVolume = state.players.reduce((acc, p) => acc + p.mon, 0);
      
      const survivors = alivePlayers
        .map(p => ({ handle: p.handle, mon: p.mon, kills: p.kills, isUser: p.isUser }))
        .sort((a, b) => b.mon - a.mon);

      const topFragPlayer = participants.length > 0 
        ? participants.reduce((prev, curr) => (prev.kills > curr.kills ? prev : curr))
        : null;
      
      const biggestStackPlayer = survivors.length > 0 ? survivors[0] : null;

      const roundResult = {
        roundNumber: state.roundNumber,
        survivors,
        topFrag: topFragPlayer ? { handle: topFragPlayer.handle, kills: topFragPlayer.kills } : null,
        biggestStack: biggestStackPlayer ? { handle: biggestStackPlayer.handle, mon: biggestStackPlayer.mon } : null,
        totalEliminations: elimList.length,
        totalVolume
      };

      // Update user history
      const user = state.players.find(p => p.isUser);
      let newUserHistory = state.userHistory;
      if (user && (user.status === 'alive' || user.status === 'eliminated')) {
        const roundCost = state.entryFee + (user.skill ? 1.5 : 0) + (user.item ? 1.0 : 0);
        newUserHistory = [
          {
            roundNumber: state.roundNumber,
            result: (user.status === 'alive' ? 'win' : 'elim') as 'win' | 'elim',
            monDelta: user.status === 'alive'
              ? parseFloat((user.mon - roundCost).toFixed(2))
              : parseFloat((-roundCost).toFixed(2)),
            skill: user.skill
          },
          ...state.userHistory
        ].slice(0, 20);
      }

      // Narrative broadcasts
      const endEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: ROUND_DURATION,
        type: 'system' as const,
        text: narrativeEngine.generateSystem('round_timeout', { round: state.roundNumber }),
        attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
      };

      const summaryEvent = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: ROUND_DURATION,
        type: 'system' as const,
        text: narrativeEngine.generateSystem('survivor_summary', { 
          list: survivors.map(s => `${s.handle} (${s.mon.toFixed(1)} MON)`).join(', ') || 'NONE'
        }),
        attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
      };

      let extraEvents = [endEvent, summaryEvent];
      if (topFragPlayer && topFragPlayer.kills > 0) {
        extraEvents.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: ROUND_DURATION,
          type: 'system' as const,
          text: narrativeEngine.generateSystem('top_frag', { handle: topFragPlayer.handle, kills: topFragPlayer.kills, round: state.roundNumber }),
          attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
        });
      }
      if (biggestStackPlayer) {
        extraEvents.push({
          id: Math.random().toString(36).substr(2, 9),
          timestamp: ROUND_DURATION,
          type: 'system' as const,
          text: narrativeEngine.generateSystem('biggest_stack', { handle: biggestStackPlayer.handle, mon: biggestStackPlayer.mon.toFixed(1) }),
          attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
        });
      }

      // Handle queue remaining
      let newLoadout = { ...state.userLoadout };
      if (newLoadout.queueRemaining > 0) {
        newLoadout.queueRemaining -= 1;
        if (newLoadout.queueRemaining === 0) newLoadout.queued = false;
      }

      return {
        phase: 'concluded' as const,
        lastRoundResult: roundResult,
        userHistory: newUserHistory,
        userStats: {
            wins: newUserHistory.filter(h => h.result === 'win').length,
            games: newUserHistory.length,
            netMon: newUserHistory.reduce((acc, h) => acc + h.monDelta, 0)
        },
        timeRemaining: INTERMISSION_DURATION,
        userLoadout: newLoadout,
        feedEvents: [...state.feedEvents, ...extraEvents].slice(-200),
        recentChampions: survivors.length > 0 ? [survivors[0].handle, ...state.recentChampions].slice(0, 10) : state.recentChampions,
        totalRoundsPlayed: state.totalRoundsPlayed + 1,
        totalVolume: state.totalVolume + totalVolume
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
      const rounds = loadout.rounds || 1;
      const newLoadout = { 
        ...state.userLoadout, 
        ...loadout, 
        queued: true, 
        queueRemaining: rounds 
      };
      const totalCost = (state.entryFee + (loadout.skill ? 1.5 : 0) + (loadout.item ? 1 : 0)) * rounds;
      
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

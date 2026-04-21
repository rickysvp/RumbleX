import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useDevStore } from '../store/devStore';
import { simulationEngine } from '../lib/simulationEngine';
import { narrativeEngine } from '../lib/narrativeEngine';

export function useSimulation() {
  const phase = useGameStore(state => state.phase);
  const simulationIntervalMs = useDevStore(state => state.simulationIntervalMs);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout when phase changes or speed changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (phase === 'entry_open') {
      const NPC_NAMES = [
        "VoidWalker", "CryptoKnight", "DegenBear25", "NullPointer", "EtherGhost",
        "BlockSlayer", "MoonShot", "SatoshiFan", "VitalikDrip", "GasGuzzler",
        "RugSeeker", "ApeKing", "DiamondHands", "PaperHands", "WhaleWatcher",
        "ScamLikely", "Bot01", "Bot02", "ShadowRunner", "NeonPulse"
      ];

      const CHAT_SAMPLES = [
        "anyone running smoke out?",
        "going loud this round",
        "last round was filthy",
        "whoever keeps running no_u is annoying",
        "let's get this mon",
        "stacks are looking real good",
        "who's the target this time?",
        "just optimized my loadout"
      ];

      const scheduleEntryActivity = () => {
        const delay = Math.floor(Math.random() * (45000 - 15000 + 1)) + 15000;
        
        timeoutRef.current = setTimeout(() => {
          const state = useGameStore.getState();
          if (state.phase === 'entry_open') {
            const isJoin = Math.random() < 0.6;
            const handle = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
            
            if (isJoin) {
              const count = state.players.filter(p => p.status === 'queued').length + 1;
              state.addFeedEvent({
                timestamp: Date.now(),
                type: 'system',
                text: narrativeEngine.generateSystem('player_join', { handle, count }),
                attacker: null, target: null, monAmount: null, skillUsed: null, itemUsed: null
              });
            } else {
              state.addFeedEvent({
                timestamp: Date.now(),
                type: 'chat',
                text: CHAT_SAMPLES[Math.floor(Math.random() * CHAT_SAMPLES.length)],
                attacker: handle,
                target: null, monAmount: null, skillUsed: null, itemUsed: null
              });
            }
            scheduleEntryActivity();
          }
        }, delay);
      };

      scheduleEntryActivity();
    } else if (phase === 'live') {
      const scheduleNextEvent = () => {
        // Use dev override if available, otherwise 8-15s random
        const delay = simulationIntervalMs !== null 
          ? simulationIntervalMs 
          : Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
        
        timeoutRef.current = setTimeout(() => {
          if (useGameStore.getState().phase === 'live') {
            simulationEngine.generateCombatEvent();
            scheduleNextEvent();
          }
        }, delay);
      };

      scheduleNextEvent();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [phase, simulationIntervalMs]);
}

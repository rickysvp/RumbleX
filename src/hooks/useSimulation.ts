import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { useDevStore } from '../store/devStore';
import { simulationEngine } from '../lib/simulationEngine';

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

    if (phase === 'live') {
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

import { useEffect } from 'react';
import { isMockMode } from '../config/dataMode';
import { useGameStore } from '../store/gameStore';

export function useGameTimer() {
  const tickTimer = useGameStore(state => state.tickTimer);
  const mockMode = isMockMode();

  useEffect(() => {
    if (!mockMode) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [mockMode, tickTimer]);
}

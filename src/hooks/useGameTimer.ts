import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export function useGameTimer() {
  const tickTimer = useGameStore(state => state.tickTimer);

  useEffect(() => {
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [tickTimer]);
}

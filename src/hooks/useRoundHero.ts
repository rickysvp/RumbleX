import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function useRoundHero() {
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const roundNumber   = useGameStore(s => s.roundNumber);
  const timeRemaining = useGameStore(s => s.timeRemaining);
  const prizePool     = useGameStore(s => s.prizePool);
  const entryFee      = useGameStore(s => s.entryFee);
  const phase         = useGameStore(s => s.phase);
  const userLoadout   = useGameStore(s => s.userLoadout);
  const players       = useGameStore(s => s.players);

  const alivePlayers = players.filter(p => p.status === 'alive');
  const totalInPlay  = players.reduce((acc, p) => acc + p.mon, 0);
  const killLeader   = alivePlayers.length > 0
    ? alivePlayers.reduce((prev, curr) =>
        prev.mon > curr.mon ? prev : curr)
    : null;

  return {
    roundNumber,
    timeRemaining,
    prizePool,
    entryFee,
    phase,
    userLoadout,
    alivePlayers,
    totalInPlay,
    killLeader,
    isLoadoutOpen,
    setIsLoadoutOpen,
  };
}

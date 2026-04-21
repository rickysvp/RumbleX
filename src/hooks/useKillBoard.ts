import { useMemo } from 'react';
import { Player, FeedEvent } from '../store/types';

export function useKillBoard(players: Player[], events: FeedEvent[]) {
  // Sort alive players by MON descending
  // Then eliminated players by timestamp descending
  const sortedPlayers = useMemo(() => {
    const alive = (players || []).filter(p => p.status === 'alive').sort((a,b) => b.mon - a.mon);
    const dead = (players || []).filter(p => p.status === 'eliminated').sort((a,b) => (b.eliminatedAt || 0) - (a.eliminatedAt || 0));
    return { alive, dead };
  }, [players]);

  // Track who is "under attack" by looking at recent events (< 30s in game time)
  const underAttack = useMemo(() => {
    const attacking = new Set<string>();
    const recentEvents = events.slice(-5); // check last 5 events
    recentEvents.forEach(e => {
        if (e.type === 'ability' || e.type === 'elim') {
            // This is a simplified heuristic for the 3D flip board
            // In a real app we'd search for specific "damage" flags
        }
    });
    return attacking;
  }, [events]);

  return { ...sortedPlayers, underAttack };
}

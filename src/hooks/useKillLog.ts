import { useMemo } from 'react';
import { FeedEvent } from '../store/types';

export function useKillLog(events: FeedEvent[]) {
  const filteredEvents = useMemo(() => {
    return [...events]
      .filter(e => e.type === 'elim')
      .reverse()
      .slice(0, 10);
  }, [events]);

  return filteredEvents;
}

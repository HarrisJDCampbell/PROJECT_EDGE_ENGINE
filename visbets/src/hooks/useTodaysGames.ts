/**
 * React Query hook for today's NBA games
 */

import { useQuery } from '@tanstack/react-query';
import { gamesApi, GameSummary } from '../services/api/gamesApi';
import { QUERY_CONFIG } from '../utils/constants';

export function useTodaysGames() {
  return useQuery<GameSummary[], Error>({
    queryKey: ['todaysGames'],
    queryFn: gamesApi.getTodaysGames,
    staleTime: QUERY_CONFIG.STALE_TIME.GAMES ?? 2 * 60 * 1000,
    retry: 2,
  });
}

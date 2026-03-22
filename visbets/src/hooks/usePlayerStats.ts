/**
 * React Query hook for fetching player recent game logs
 */

import { useQuery } from '@tanstack/react-query';
import { playersApi, PlayerLog } from '../services/api/playersApi';
import { QUERY_CONFIG } from '../utils/constants';

export function usePlayerStats(playerId: number, _season?: number) {
  return useQuery<PlayerLog[], Error>({
    queryKey: ['playerStats', playerId],
    queryFn: () => playersApi.getRecentLogs(playerId),
    staleTime: QUERY_CONFIG.STALE_TIME.PLAYER_STATS,
    enabled: !!playerId,
    retry: (failureCount, error) => {
      // Don't retry tier-gated 403s — show upgrade prompt instead of spinning
      if ((error as any)?.message === 'upgrade_required') return false;
      return failureCount < 2;
    },
  });
}

/**
 * React Query hook for fetching player props from backend
 */

import { useQuery } from '@tanstack/react-query';
import { playersApi, PlayerProjection } from '../services/api/playersApi';
import { QUERY_CONFIG } from '../utils/constants';

export function usePlayerProps(playerId: number) {
  return useQuery<PlayerProjection[], Error>({
    queryKey: ['playerProps', playerId],
    queryFn: () => playersApi.getProps(playerId),
    staleTime: QUERY_CONFIG.STALE_TIME.PLAYER_PROPS,
    enabled: !!playerId,
    retry: (failureCount, error) => {
      if (String(error).includes('upgrade_required')) return false;
      return failureCount < 2;
    },
  });
}

export function usePlayerPropsByStatType(stat: string, playerId: number) {
  const { data: allProps, ...rest } = usePlayerProps(playerId);
  const filtered = allProps?.filter((p) => p.stat === stat) ?? [];
  return { ...rest, data: filtered, totalCount: allProps?.length ?? 0, filteredCount: filtered.length };
}

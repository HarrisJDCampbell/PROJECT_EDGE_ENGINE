/**
 * React Query hook for fetching player details
 */

import { useQuery } from '@tanstack/react-query';
import { playersApi, PlayerInfo } from '../services/api/playersApi';
import { QUERY_CONFIG } from '../utils/constants';

export function usePlayer(playerId: number) {
  return useQuery<PlayerInfo, Error>({
    queryKey: ['player', playerId],
    queryFn: () => playersApi.getPlayer(playerId),
    staleTime: QUERY_CONFIG.STALE_TIME.PLAYER_INFO,
    enabled: !!playerId,
    retry: 2,
  });
}

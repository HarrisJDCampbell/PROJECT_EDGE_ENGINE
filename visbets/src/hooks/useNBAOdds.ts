/**
 * React Query hook for NBA odds
 */

import { useQuery } from '@tanstack/react-query';
import { oddsApi, OddsEvent } from '../services/api/oddsApi';
import { QUERY_CONFIG } from '../utils/constants';

export function useNBAOdds() {
  return useQuery<OddsEvent[], Error>({
    queryKey: ['nbaOdds'],
    queryFn: oddsApi.getNBAOdds,
    staleTime: QUERY_CONFIG.STALE_TIME.PLAYER_PROPS ?? 5 * 60 * 1000,
    retry: 2,
  });
}

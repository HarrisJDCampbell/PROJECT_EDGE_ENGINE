/**
 * usePlayerAnalysis
 * Fetches computed analytics from GET /api/players/:playerId/analysis.
 * Includes streak data, trajectory, volatility, splits, and line shopping.
 */

import { useQuery } from '@tanstack/react-query';
import { playersApi, PlayerAnalysis, AnalysisParams } from '../services/api/playersApi';
import { QUERY_CONFIG } from '../utils/constants';

const ANALYSIS_STALE_TIME = 5 * 60 * 1000;        // 5 minutes
const ANALYSIS_REFETCH_LIVE = 8 * 60 * 1000;       // 8 minutes when live

interface UsePlayerAnalysisOptions extends AnalysisParams {
  isLive?: boolean;
}

export function usePlayerAnalysis(
  playerId: number,
  options: UsePlayerAnalysisOptions
) {
  const { stat, line, bookmaker = 'fanduel', isLive = false } = options;

  return useQuery<PlayerAnalysis, Error>({
    queryKey: ['playerAnalysis', playerId, stat, line, bookmaker],
    queryFn: () => playersApi.getAnalysis(playerId, { stat, line, bookmaker }),
    staleTime: ANALYSIS_STALE_TIME,
    gcTime: QUERY_CONFIG.CACHE_TIME,
    refetchInterval: isLive ? ANALYSIS_REFETCH_LIVE : false,
    retry: QUERY_CONFIG.RETRY_COUNT,
    enabled: playerId > 0 && line >= 0,
  });
}

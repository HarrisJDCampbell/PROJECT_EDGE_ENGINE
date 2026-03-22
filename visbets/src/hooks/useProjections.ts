/**
 * useProjections
 * Fetches today's real projected props from the backend.
 * Stale time: 15 min (backend caches for 20 min; refresh on focus).
 * Returns projections + generatedAt for the data freshness indicator.
 */

import { useQuery } from '@tanstack/react-query';
import { projectionsApi, ProjectedProp, StatDisplay, TodaysProjectionsResponse } from '../services/api/projectionsApi';
import { useUserPreferences } from './useUserPreferences';

export type { ProjectedProp };

const STALE_MS = 15 * 60 * 1000; // 15 minutes

export function useProjections() {
  const { leftBook } = useUserPreferences();
  const query = useQuery<TodaysProjectionsResponse, Error>({
    queryKey: ['projections', 'today', leftBook],
    queryFn: () => projectionsApi.getTodaysProjections(leftBook),
    staleTime: STALE_MS,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15000),
  });

  return {
    ...query,
    data: query.data?.projections ?? [],
    generatedAt: query.data?.generatedAt ?? null,
    dataSource: (query.data as any)?.dataSource ?? null,
  };
}

/** Filter projections by stat display type */
export function useProjectionsByStat(stat: StatDisplay | 'PRA') {
  const query = useProjections();
  const filtered = (query.data ?? []).filter((p) => {
    if (stat === 'PRA') return ['PTS', 'REB', 'AST'].includes(p.statDisplay);
    return p.statDisplay === stat;
  });
  return { ...query, data: filtered, totalCount: filtered.length };
}

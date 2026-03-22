/**
 * usePlayerByName
 * Searches for a player by name using our backend /api/players/search,
 * which queries API-Sports. No Ball Don't Lie dependency.
 */

import { useQuery } from '@tanstack/react-query';
import { backendClient } from '../services/api/backendClient';

interface ApiSportsPlayerResult {
  id: number;
  firstname: string;
  lastname: string;
  score: number;
}

interface PlayerSearchResult {
  id: number;
  name: string;
  apiSportsId: number;
}

export function usePlayerByName(playerName: string) {
  return useQuery<PlayerSearchResult | null, Error>({
    queryKey: ['playerByName', playerName],
    queryFn: async () => {
      if (!playerName || playerName.length < 2) return null;
      try {
        const { data } = await backendClient.get<{
          query: string;
          results: ApiSportsPlayerResult[];
        }>('/api/players/search', { params: { name: playerName } });

        const best = data.results?.[0];
        if (!best) return null;
        return {
          id: best.id,
          name: `${best.firstname} ${best.lastname}`,
          apiSportsId: best.id,
        };
      } catch {
        return null;
      }
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: !!playerName && playerName.length >= 2,
    retry: 0,
  });
}

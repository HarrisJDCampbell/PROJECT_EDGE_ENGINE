/**
 * useBettingOdds / usePlayerBettingOdds
 * Fetches real multi-book prop lines from our backend /api/players/:id/props.
 * Completely replaces the old Ball Don't Lie implementation.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { backendClient } from '../services/api/backendClient';
import { OddsComparison, SportsbookOdds } from '../services/api/types';

// ── Backend response shape ─────────────────────────────────────────────────────

interface BackendPropLine {
  statDisplay: string;
  bookmaker: string;
  bookmakerTitle: string;
  line: number;
  overOdds: number | null;
  underOdds: number | null;
  isBestOver: boolean;
  isBestUnder: boolean;
}

interface BackendPropsResponse {
  playerId: number;
  playerName: string;
  teamName: string;
  opponent: string;
  gameTime: string;
  props: BackendPropLine[];
  count: number;
  message?: string;
}

// ── Conversion to OddsComparison ───────────────────────────────────────────────

function toOddsComparisons(
  data: BackendPropsResponse,
  statType?: string
): OddsComparison[] {
  const filtered = statType
    ? data.props.filter((p) => p.statDisplay.toUpperCase() === statType.toUpperCase())
    : data.props;

  if (filtered.length === 0) return [];

  // Group by statDisplay
  const byStats = new Map<string, BackendPropLine[]>();
  for (const p of filtered) {
    if (!byStats.has(p.statDisplay)) byStats.set(p.statDisplay, []);
    byStats.get(p.statDisplay)!.push(p);
  }

  const results: OddsComparison[] = [];
  for (const [stat, lines] of byStats.entries()) {
    const books: SportsbookOdds[] = lines.map((l) => ({
      sportsbook: l.bookmakerTitle,
      player_id: data.playerId,
      player_name: data.playerName,
      stat_type: stat,
      line: l.line,
      over_odds: l.overOdds ?? -110,
      under_odds: l.underOdds ?? -110,
      game_id: 0,
    }));

    const bestOver = lines
      .filter((l) => l.isBestOver)
      .map((l) => ({ sportsbook: l.bookmakerTitle, odds: l.overOdds ?? -110, line: l.line }))[0] ?? null;

    const bestUnder = lines
      .filter((l) => l.isBestUnder)
      .map((l) => ({ sportsbook: l.bookmakerTitle, odds: l.underOdds ?? -110, line: l.line }))[0] ?? null;

    results.push({
      player_id: data.playerId,
      player_name: data.playerName,
      stat_type: stat,
      game_id: 0,
      books,
      bestOver,
      bestUnder,
    });
  }

  return results;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

function usePlayerProps(playerId: number) {
  return useQuery<BackendPropsResponse, Error>({
    queryKey: ['playerBettingProps', playerId],
    queryFn: async () => {
      const { data } = await backendClient.get<BackendPropsResponse>(
        `/api/players/${playerId}/props`
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: playerId > 0,
  });
}

export function useBettingOdds(playerId: number) {
  const { data, isLoading, error, refetch } = usePlayerProps(playerId);

  const comparisons = useMemo(() => {
    if (!data) return [];
    return toOddsComparisons(data);
  }, [data]);

  return { data: comparisons, isLoading, error, refetch };
}

export function usePlayerBettingOdds(playerId: number, statType?: string, _gameId?: number) {
  const { data: raw, isLoading, error, refetch } = usePlayerProps(playerId);

  const playerOdds = useMemo(() => {
    if (!raw) return [];
    return toOddsComparisons(raw, statType);
  }, [raw, statType]);

  return {
    data: playerOdds,
    isLoading: playerId > 0 && isLoading,
    error,
    refetch,
  };
}

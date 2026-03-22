/**
 * useHistoricalMatchups
 * Fetches historical matchup data from backend /api/players/:id/logs.
 * Uses enriched logs (opponent_id, was_home_game, game_result) to filter vs opponent.
 * No Ball Don't Lie dependency.
 */

import { useQuery } from '@tanstack/react-query';
import { playersApi } from '../services/api/playersApi';

export interface MatchupGame {
  date: string;
  statValue: number;
  isHome: boolean;
  minutes: string;
  playerWon: boolean;
  game: { homeScore: number; awayScore: number };
}

export interface HistoricalMatchups {
  games: MatchupGame[];
  totalGames: number;
  avgVsOpponent: number;
  trend: 'improving' | 'declining' | 'stable';
}

function calculateTrend(games: MatchupGame[]): 'improving' | 'declining' | 'stable' {
  if (games.length < 2) return 'stable';
  const mid = Math.floor(games.length / 2);
  const recent = games.slice(0, mid);
  const older = games.slice(mid);
  const recentAvg = recent.reduce((s, g) => s + g.statValue, 0) / recent.length;
  const olderAvg = older.reduce((s, g) => s + g.statValue, 0) / older.length;
  const diff = recentAvg - olderAvg;
  if (diff > 2) return 'improving';
  if (diff < -2) return 'declining';
  return 'stable';
}

export function useHistoricalMatchups(
  playerId: number,
  opponentId: number | null,
  statKey: string,
  _existingGames?: any[],
  desiredGamesCount: number = 3
) {
  return useQuery<HistoricalMatchups, Error>({
    queryKey: ['historicalMatchups', playerId, opponentId, statKey],
    queryFn: async () => {
      if (!opponentId) {
        return { games: [], totalGames: 0, avgVsOpponent: 0, trend: 'stable' as const };
      }

      // Fetch enriched logs from backend (up to 30 games)
      const logs = await playersApi.getRecentLogs(playerId, 30);

      // Map statKey to log field
      const statFieldMap: Record<string, keyof typeof logs[0]> = {
        pts: 'points', points: 'points',
        reb: 'rebounds', totReb: 'rebounds', rebounds: 'rebounds',
        ast: 'assists', assists: 'assists',
        fg3m: 'threes', tpm: 'threes', threes: 'threes',
        stl: 'steals', steals: 'steals',
        blk: 'blocks', blocks: 'blocks',
      };
      const field = statFieldMap[statKey] ?? 'points';

      // Filter by opponent using opponent_name from enriched logs.
      // Normalize both sides to handle abbreviation/full-name mismatches.
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
      const opponentNorm = opponentId ? String(opponentId) : '';

      const filteredLogs = opponentNorm
        ? logs.filter((log) => {
            const logOpponent = normalize(log.opponent_name);
            // Match if the normalized opponent name contains the opponent identifier
            // or vice-versa (handles "LA Lakers" vs "Los Angeles Lakers" etc.)
            return logOpponent.includes(normalize(opponentNorm)) ||
                   normalize(opponentNorm).includes(logOpponent);
          })
        : logs;

      // Fall back to all logs if no opponent matches found (new team, trade, etc.)
      const sourceLogs = filteredLogs.length > 0 ? filteredLogs : logs;

      const matchupGames: MatchupGame[] = sourceLogs
        .map((log) => ({
          date: log.game_date,
          statValue: Number(log[field]) || 0,
          isHome: log.was_home_game,
          minutes: log.minutes,
          playerWon: log.game_result === 'W',
          game: { homeScore: 0, awayScore: 0 },
        }))
        .slice(0, desiredGamesCount);

      const avgVsOpponent =
        matchupGames.length > 0
          ? matchupGames.reduce((s, g) => s + g.statValue, 0) / matchupGames.length
          : 0;

      return {
        games: matchupGames,
        totalGames: matchupGames.length,
        avgVsOpponent,
        trend: calculateTrend(matchupGames),
      };
    },
    staleTime: 2 * 60 * 60 * 1000,
    enabled: !!playerId && playerId > 0,
    retry: 1,
  });
}

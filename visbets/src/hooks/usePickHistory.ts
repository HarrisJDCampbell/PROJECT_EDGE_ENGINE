import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export interface SavedPick {
  id: string;
  playerName: string;
  statType: string;
  line: number;
  direction: 'over' | 'under';
  gameDate: string;
  hit: boolean | null;
  actualValue: number | null;
}

export function usePickHistory(limit = 30) {
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery({
    queryKey: ['pick-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('saved_picks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        playerName: r.player_name,
        statType: r.stat_type,
        line: r.line,
        direction: r.direction,
        gameDate: r.game_date,
        hit: r.hit ?? null,
        actualValue: r.actual_value ?? null,
      })) as SavedPick[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWinRate(picks: SavedPick[]) {
  const resolved = picks.filter((p) => p.hit !== null);
  const wins = resolved.filter((p) => p.hit === true).length;
  return {
    total: picks.length,
    resolved: resolved.length,
    wins,
    winRate: resolved.length > 0 ? Math.round((wins / resolved.length) * 100) : null,
  };
}

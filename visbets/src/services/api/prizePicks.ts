/**
 * PrizePicks API Client
 * Fetches real NBA player props directly from PrizePicks
 * This gives us all 80+ players with props for the day
 */

import axios from 'axios';
import { PlayerProp } from './types';

const PRIZEPICKS_API_URL = 'https://api.prizepicks.com/projections';
const NBA_LEAGUE_ID = 7;

/**
 * PrizePicks API Response Types
 */
interface PrizePicksPlayer {
  id: string;
  type: 'new_player';
  attributes: {
    name?: string;
    display_name?: string;
    team?: string;
    team_name?: string;
    position?: string;
    image_url?: string;
    market?: string;
    league?: string;
  };
}

interface PrizePicksProjection {
  id: string;
  type: 'projection';
  attributes: {
    stat_type: string;
    stat_display_name?: string;
    line_score: number;
    description?: string;
    updated_at?: string;
    start_time?: string;
    status?: string;
    odds_type?: string;
    projection_type?: string;
  };
  relationships: {
    new_player?: {
      data: {
        id: string;
        type: string;
      } | null;
    };
    league?: {
      data: {
        id: string;
        type: string;
      };
    };
  };
}

interface PrizePicksResponse {
  data: PrizePicksProjection[];
  included: (PrizePicksPlayer | any)[];
}

/**
 * Map PrizePicks stat types to our internal format
 * Handles variations like "Points", "Points (Combo)", etc.
 */
function mapStatType(rawStatType: string): string | null {
  // Normalize the stat type
  const normalized = rawStatType.toLowerCase().trim();

  // Skip combo/special props for now - we want single-stat props
  if (normalized.includes('combo') || normalized.includes('goblin')) {
    return null;
  }

  // Map to our internal format
  if (normalized.includes('point') && !normalized.includes('+')) return 'PTS';
  if (normalized === 'rebounds' || normalized === 'rebs') return 'REB';
  if (normalized === 'assists' || normalized === 'asts') return 'AST';
  if (normalized.includes('3-pt') || normalized.includes('3pt') || normalized.includes('threes')) return '3PM';
  if (normalized === 'steals') return 'STL';
  if (normalized.includes('block')) return 'BLK';
  if (normalized.includes('turnover')) return 'TO';
  if (normalized === 'pts+rebs+asts' || normalized === 'pra') return 'PRA';
  if (normalized === 'pts+rebs' || normalized === 'pr') return 'PR';
  if (normalized === 'pts+asts' || normalized === 'pa') return 'PA';
  if (normalized === 'rebs+asts' || normalized === 'ra') return 'RA';

  // Skip fantasy, double-double, triple-double for now
  if (normalized.includes('fantasy') || normalized.includes('double')) {
    return null;
  }

  return null; // Skip unknown stat types
}

/**
 * Fetch NBA player props from PrizePicks
 */
export async function fetchPrizePicksProps(): Promise<PlayerProp[]> {
  try {
    const response = await axios.get<PrizePicksResponse>(PRIZEPICKS_API_URL, {
      params: { league_id: NBA_LEAGUE_ID },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    const props = parsePrizePicksResponse(response.data);
    return props;
  } catch (error) {
    if (__DEV__) console.error('[PrizePicks] Error fetching data:', error);
    throw error;
  }
}

/**
 * Parse PrizePicks API response into our PlayerProp format
 */
function parsePrizePicksResponse(response: PrizePicksResponse): PlayerProp[] {
  if (!response || !response.data || !response.included) {
    if (__DEV__) console.warn('[PrizePicks] Invalid response structure');
    return [];
  }

  // Build player ID to player info map
  const playerMap = new Map<string, PrizePicksPlayer['attributes'] & { id: string }>();

  for (const item of response.included) {
    if (item.type === 'new_player' && item.attributes) {
      playerMap.set(item.id, {
        ...item.attributes,
        id: item.id,
      });
    }
  }

  if (__DEV__) console.log(`[PrizePicks] Found ${playerMap.size} players in included data`);

  const props: PlayerProp[] = [];
  const today = new Date().toISOString();
  const seenKeys = new Set<string>(); // Dedupe same player + stat type

  for (const projection of response.data) {
    // IMPORTANT: Only use "standard" odds_type - these are the main PrizePicks lines
    // Skip "demon" (higher lines) and "goblin" (lower lines) which are variant bets
    const oddsType = projection.attributes.odds_type;
    if (oddsType !== 'standard') continue;

    // Get player ID from relationship
    const playerId = projection.relationships?.new_player?.data?.id;
    if (!playerId) continue;

    // Get player info
    const player = playerMap.get(playerId);
    if (!player) continue;

    // Get player name
    const playerName = player.name || player.display_name;
    if (!playerName) continue;

    // Map stat type (skip combos and unknowns)
    const rawStatType = projection.attributes.stat_type;
    const statType = mapStatType(rawStatType);
    if (!statType) continue;

    // Get line
    const line = projection.attributes.line_score;
    if (line === undefined || line === null || line <= 0) continue;

    // Dedupe: only keep first prop for each player + stat type combo
    const dedupeKey = `${playerName}-${statType}`;
    if (seenKeys.has(dedupeKey)) continue;
    seenKeys.add(dedupeKey);

    // Parse team and opponent from description (format: "NOP/IND" or "NOP")
    const description = projection.attributes.description || '';
    const teams = description.split('/').map(t => t.trim());
    const team = player.team || teams[0] || 'NBA';
    const opponent = teams.length > 1 ? teams[1] : (teams[0] !== team ? teams[0] : 'TBD');

    // Safely parse player ID - handle numeric strings, non-numeric strings, and edge cases
    // Using Number.isFinite to catch NaN, Infinity, and ensuring positive values
    const parsedPlayerId = parseInt(playerId, 10);
    const safePlayerId = Number.isFinite(parsedPlayerId) && parsedPlayerId > 0
      ? parsedPlayerId
      : hashStringToNumber(playerId);

    props.push({
      id: projection.id,
      player_id: safePlayerId,
      player_name: playerName,
      team: team,
      opponent: opponent || 'TBD',
      game_id: hashStringToNumber(projection.id),
      game_date: projection.attributes.start_time || today,
      stat_type: statType,
      line: line,
      over_odds: -110,
      under_odds: -110,
      sportsbook: 'PrizePicks',
      image_url: player.image_url || undefined,
    });
  }

  return props;
}

/**
 * Convert string ID to numeric ID for compatibility
 */
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Group props by stat type for filtering
 */
export function groupPropsByStatType(props: PlayerProp[]): Record<string, PlayerProp[]> {
  const grouped: Record<string, PlayerProp[]> = {};

  for (const prop of props) {
    const statType = prop.stat_type;
    if (!grouped[statType]) {
      grouped[statType] = [];
    }
    grouped[statType].push(prop);
  }

  return grouped;
}

/**
 * Get unique players from props
 */
export function getUniquePlayers(props: PlayerProp[]): { id: number; name: string; team: string }[] {
  const seen = new Set<number>();
  const players: { id: number; name: string; team: string }[] = [];

  for (const prop of props) {
    if (!seen.has(prop.player_id)) {
      seen.add(prop.player_id);
      players.push({
        id: prop.player_id,
        name: prop.player_name,
        team: prop.team,
      });
    }
  }

  return players;
}

/**
 * Get available stat types from props
 */
export function getAvailableStatTypes(props: PlayerProp[]): string[] {
  const statTypes = new Set<string>();

  for (const prop of props) {
    statTypes.add(prop.stat_type);
  }

  return Array.from(statTypes).sort();
}

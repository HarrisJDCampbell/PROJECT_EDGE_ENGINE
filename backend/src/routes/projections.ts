/**
 * Projections Routes
 *
 * GET /api/projections/today
 *   Returns all projected player props for today's NBA games.
 *   Requires STARTER tier.
 *
 * Pipeline:
 *   1. Fetch today's games from API-Sports
 *   2. Fetch today's NBA odds events from TheOddsAPI (for event IDs + team names)
 *   3. Match API-Sports games → TheOddsAPI events by team name
 *   4. For each matched game, fetch player props from TheOddsAPI
 *   5. Deduplicate props; pick best-available line (FanDuel > DraftKings > first)
 *   6. Resolve player names → API-Sports player IDs (cached 24 h)
 *   7. Fetch game logs for each resolved player (cached 2 h)
 *   8. Run buildEnhancedProjection() for each prop
 *   9. Return sorted flat list
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getUserTier } from '../middleware/subscriptionGate';
import type { AuthenticatedRequest } from '../middleware/auth';
import { logProjections } from '../services/projectionLogger';
import { redisGetJSON } from '../lib/redis';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { REDIS_KEYS } from '../jobs/oddsRefresh';
import {
  getGamesForDate, getUpcomingGamesNextDays, getTeamRecentGames,
  getGameBoxScore, getGameBoxScoreRaw, getTeamRecentCompletedGameIds, getPlayerGameLogsFromBoxScores,
  normalizePlayerName,
} from '../services/apiSports';
import { getNBAOdds, getNBAPlayerProps } from '../services/oddsApi';
import { buildEnhancedProjection, extractStatValue, ODDS_API_MARKET_MAP, type StatKey } from '../services/projections';
import { getOpponentDefFactor } from '../services/teamDefense';
import cache, { getOrFetch, TTL } from '../cache/gameCache';
import { resolveNBAPersonId, headshotUrl } from '../services/nbaPlayers';
import logger from '../lib/logger';
const router = Router();

// ── Last-good cache (survives short odds gaps between game batches) ────────────
let lastGoodProjections: ProjectedProp[] = [];
let lastGoodTimestamp: string = '';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProjectedProp {
  id: string;
  playerName: string;
  playerApiSportsId: number | null;
  teamName: string;
  opponent: string;
  isHome: boolean;
  gameTime: string;
  stat: StatKey;
  statDisplay: string;
  line: number;
  projection: number;
  stdDev: number;
  pOver: number;
  impliedPOver: number;
  edge: number;
  direction: 'over' | 'under';
  visbetsScore: number;
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  overOdds: number | null;
  underOdds: number | null;
  bookmaker: string | null;
  modelVersion: string;
  headshotUrl: string | null;
  bookLines: Record<string, number | null>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MODEL_VERSION = '2.0.0-ewma';

/** Strip common suffixes to normalize team names for matching */
function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|sc|united|city|county|town)\b/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Score how well two team names match (0 = no match, higher = better) */
function teamMatchScore(a: string, b: string): number {
  const na = normalizeForMatch(a);
  const nb = normalizeForMatch(b);
  if (na === nb) return 100;
  // Check if all words of the shorter name appear in the longer
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const [shorter, longer] = wordsA.length <= wordsB.length ? [wordsA, wordsB] : [wordsB, wordsA];
  const matches = shorter.filter((w) => w.length > 2 && longer.includes(w)).length;
  return (matches / shorter.length) * 80;
}

interface BestLine {
  line: number;
  overOdds: number | null;
  underOdds: number | null;
  bookmaker: string;
}

const DEFAULT_BOOK_ORDER = ['fanduel', 'draftkings', 'betmgm', 'caesars', 'espnbet'];

/** Pick the best available line across bookmakers for a given player+market.
 *  If preferredBook is supplied it gets priority, otherwise use DEFAULT_BOOK_ORDER. */
function pickBestLine(
  bookmakers: Array<{ key: string; markets: Array<{ key: string; outcomes: Array<{ name: string; description: string; price: number; point?: number }> }> }>,
  playerName: string,
  market: string,
  preferredBook?: string
): BestLine | null {
  const order = preferredBook
    ? [preferredBook, ...DEFAULT_BOOK_ORDER.filter((b) => b !== preferredBook)]
    : DEFAULT_BOOK_ORDER;

  const sorted = [...bookmakers].sort((a, b) => {
    const ai = order.indexOf(a.key);
    const bi = order.indexOf(b.key);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  for (const book of sorted) {
    const mkt = book.markets.find((m) => m.key === market);
    if (!mkt) continue;

    const playerOutcomes = mkt.outcomes.filter(
      (o) => o.description?.toLowerCase() === playerName.toLowerCase()
    );
    if (playerOutcomes.length < 2) continue;

    const over = playerOutcomes.find((o) => o.name === 'Over');
    const under = playerOutcomes.find((o) => o.name === 'Under');
    if (!over || over.point == null) continue;

    return {
      line: over.point,
      overOdds: over.price ?? null,
      underOdds: under?.price ?? null,
      bookmaker: book.key,
    };
  }
  return null;
}

// ── Core pipeline ─────────────────────────────────────────────────────────────

/**
 * Build projections from raw props using box-score game logs.
 * teamGameIdsMap: maps normalized player name → list of game IDs to search
 * (union of both teams' recent game IDs for the relevant game).
 */
async function buildProjectionsFromRawProps(
  rawProps: Array<{
    playerName: string;
    market: string;
    statKey: StatKey;
    line: BestLine;
    homeTeam: string;
    awayTeam: string;
    homeTeamId: number;
    awayTeamId: number;
    gameTime: string;
    bookLines?: Record<string, number | null>;
  }>,
  teamGameIdsMap: Map<string, number[]>  // gameKey → sorted game IDs
): Promise<ProjectedProp[]> {
  if (rawProps.length === 0) return [];

  // Fetch game logs for each unique player via box scores
  const uniqueNames = [...new Set(rawProps.map((p) => p.playerName))];
  const playerLogsMap = new Map<string, Awaited<ReturnType<typeof getPlayerGameLogsFromBoxScores>>>();

  // Pre-fetch all unique box scores + NBA player IDs (fills cache; deduplication prevents stampede)
  const allGameIds = [...new Set([...teamGameIdsMap.values()].flat())];
  await Promise.allSettled([
    ...allGameIds.map((id) => getGameBoxScoreRaw(id)),
    ...uniqueNames.map((n) => resolveNBAPersonId(n)),
  ]);

  // Now all per-player lookups hit cache
  await Promise.allSettled(
    uniqueNames.map(async (name) => {
      const gameKey = `${rawProps.find(r => r.playerName === name)?.homeTeam}:${rawProps.find(r => r.playerName === name)?.awayTeam}`;
      const gameIds = teamGameIdsMap.get(gameKey) ?? [];
      if (gameIds.length === 0) return;
      const logs = await getPlayerGameLogsFromBoxScores(name, gameIds);
      if (logs.length > 0) playerLogsMap.set(name, logs);
    })
  );

  // Pre-warm the by-name logs cache so the player detail endpoint can serve stats instantly
  for (const [name, logs] of playerLogsMap.entries()) {
    cache.set(`player-logs-by-name:${name.toLowerCase().trim()}`, logs, TTL.PLAYER_STATS);
  }

  // Build a player→teamId lookup from box score data so we know which team each player is on
  const playerTeamIdMap = new Map<string, number>();
  for (const [name, logs] of playerLogsMap.entries()) {
    if (logs.length > 0 && logs[0].team?.id) {
      playerTeamIdMap.set(name, logs[0].team.id);
    }
  }

  const results: ProjectedProp[] = [];
  for (const raw of rawProps) {
    const gameLogs = playerLogsMap.get(raw.playerName) ?? [];
    const sortedLogs = [...gameLogs].sort((a, b) => b.game.id - a.game.id);
    const playerId: number | null = sortedLogs.length > 0 ? sortedLogs[0].player.id : null;

    // Determine if player is on the home team using team ID from box scores
    const playerBoxScoreTeamId = playerTeamIdMap.get(raw.playerName);
    let isHome = false;
    let playerTeamName = '';
    let opponentName = raw.awayTeam;

    if (playerBoxScoreTeamId) {
      if (playerBoxScoreTeamId === raw.homeTeamId) {
        isHome = true;
        playerTeamName = raw.homeTeam;
        opponentName = raw.awayTeam;
      } else if (playerBoxScoreTeamId === raw.awayTeamId) {
        isHome = false;
        playerTeamName = raw.awayTeam;
        opponentName = raw.homeTeam;
      } else {
        // Team ID doesn't match either side (player was traded?) — fall back to name matching
        const homeScore = teamMatchScore(String(playerBoxScoreTeamId), raw.homeTeam);
        const awayScore = teamMatchScore(String(playerBoxScoreTeamId), raw.awayTeam);
        isHome = homeScore > awayScore;
        playerTeamName = isHome ? raw.homeTeam : raw.awayTeam;
        opponentName = isHome ? raw.awayTeam : raw.homeTeam;
      }
    } else {
      // No team info from box scores — best-effort: use away team as opponent
      opponentName = raw.awayTeam;
    }

    const opponentDefFactor = getOpponentDefFactor(opponentName, raw.statKey);

    const projection = buildEnhancedProjection({
      gameLogs: sortedLogs,
      line: raw.line.line,
      stat: raw.statKey,
      overOdds: raw.line.overOdds,
      underOdds: raw.line.underOdds,
      bookmaker: raw.line.bookmaker,
      opponentDefFactor,
      isHomeGame: isHome,
    });
    if (!projection) continue;

    const nbaPersonId = await resolveNBAPersonId(raw.playerName);
    results.push({
      id: `${raw.playerName}:${raw.market}`,
      playerName: raw.playerName,
      playerApiSportsId: playerId,
      teamName: playerTeamName,
      opponent: opponentName,
      isHome,
      gameTime: raw.gameTime,
      stat: raw.statKey,
      statDisplay: projection.statDisplay,
      line: projection.line,
      projection: projection.projection,
      stdDev: projection.stdDev,
      pOver: projection.pOver,
      impliedPOver: projection.impliedPOver,
      edge: projection.edge,
      direction: projection.direction,
      visbetsScore: projection.visbetsScore,
      confidence: projection.confidence,
      sampleSize: projection.sampleSize,
      overOdds: projection.overOdds,
      underOdds: projection.underOdds,
      bookmaker: projection.bookmaker,
      modelVersion: MODEL_VERSION,
      headshotUrl: nbaPersonId ? headshotUrl(nbaPersonId) : null,
      bookLines: raw.bookLines ?? {},
    });
  }

  results.sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge));
  return results;
}

/**
 * Mode A: Use TheOddsAPI player props as the player/line source.
 * Returns raw props list; empty if no odds available for upcoming games.
 */
async function runOddsBasedPipeline(preferredBook?: string): Promise<ProjectedProp[]> {
  const oddsEvents = await getNBAOdds();
  if (oddsEvents.length === 0) return [];

  const oddsDates = [...new Set(oddsEvents.map((e) => e.commence_time.split('T')[0]))];
  const gamesByDate = await Promise.all(oddsDates.map((d) => getGamesForDate(d)));
  const apiGames = gamesByDate.flat();
  if (apiGames.length === 0) return [];

  interface MatchedGame { oddsEventId: string; homeTeam: string; awayTeam: string; homeTeamId: number; awayTeamId: number; gameTime: string; }
  const matchedGames: MatchedGame[] = [];

  for (const apiGame of apiGames) {
    let bestEventId: string | null = null;
    let bestScore = 0;
    for (const oddsEvent of oddsEvents) {
      const homeScore = Math.max(
        teamMatchScore(apiGame.teams.home.name, oddsEvent.home_team),
        teamMatchScore(apiGame.teams.home.name, oddsEvent.away_team)
      );
      const awayScore = Math.max(
        teamMatchScore(apiGame.teams.away.name, oddsEvent.home_team),
        teamMatchScore(apiGame.teams.away.name, oddsEvent.away_team)
      );
      const score = homeScore + awayScore;
      if (score > bestScore && score > 100) { bestScore = score; bestEventId = oddsEvent.id; }
    }
    if (bestEventId) {
      const oddsEvent = oddsEvents.find((e) => e.id === bestEventId)!;
      matchedGames.push({ oddsEventId: bestEventId, homeTeam: oddsEvent.home_team, awayTeam: oddsEvent.away_team, homeTeamId: apiGame.teams.home.id, awayTeamId: apiGame.teams.away.id, gameTime: oddsEvent.commence_time });
    }
  }

  if (matchedGames.length === 0) return [];

  // For each matched game, pre-fetch recent game IDs for BOTH teams (for box score lookup)
  // We store them keyed by "homeTeam:awayTeam" so buildProjectionsFromRawProps can look them up
  const teamGameIdsMap = new Map<string, number[]>();
  await Promise.allSettled(
    matchedGames.map(async (game, i) => {
      const apiGame = apiGames.find((g) => {
        const hs = Math.max(teamMatchScore(g.teams.home.name, game.homeTeam), teamMatchScore(g.teams.home.name, game.awayTeam));
        const as_ = Math.max(teamMatchScore(g.teams.away.name, game.homeTeam), teamMatchScore(g.teams.away.name, game.awayTeam));
        return hs + as_ > 100;
      });
      if (!apiGame) return;

      const [homeIds, awayIds] = await Promise.all([
        getTeamRecentCompletedGameIds(apiGame.teams.home.id, 15),
        getTeamRecentCompletedGameIds(apiGame.teams.away.id, 15),
      ]);
      // Merge and deduplicate, keeping newest-first order
      const merged = [...new Set([...homeIds, ...awayIds])].sort((a, b) => b - a);
      teamGameIdsMap.set(`${game.homeTeam}:${game.awayTeam}`, merged);
    })
  );

  const propEventResults = await Promise.allSettled(matchedGames.map((g) => getNBAPlayerProps(g.oddsEventId)));

  interface RawProp { playerName: string; market: string; statKey: StatKey; line: BestLine; homeTeam: string; awayTeam: string; homeTeamId: number; awayTeamId: number; gameTime: string; bookLines: Record<string, number | null>; }
  const rawProps: RawProp[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < propEventResults.length; i++) {
    const result = propEventResults[i];
    if (result.status !== 'fulfilled' || !result.value) continue;
    const propsEvent = result.value;
    const game = matchedGames[i];

    const playersByMarket = new Map<string, Set<string>>();
    for (const book of propsEvent.bookmakers) {
      for (const mkt of book.markets) {
        if (!ODDS_API_MARKET_MAP[mkt.key]) continue;
        if (!playersByMarket.has(mkt.key)) playersByMarket.set(mkt.key, new Set());
        for (const outcome of mkt.outcomes) {
          if (outcome.description) playersByMarket.get(mkt.key)!.add(outcome.description);
        }
      }
    }

    for (const [market, players] of playersByMarket.entries()) {
      const statKey = ODDS_API_MARKET_MAP[market];
      if (!statKey) continue;
      for (const playerName of players) {
        const dedupeKey = `${playerName}:${market}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const bestLine = pickBestLine(propsEvent.bookmakers as any, playerName, market, preferredBook);
        if (!bestLine || bestLine.line <= 0) continue;
        // Extract per-book lines for all supported books
        const bookLines: Record<string, number | null> = {};
        for (const bookKey of DEFAULT_BOOK_ORDER) {
          const bl = pickBestLine(propsEvent.bookmakers as any, playerName, market, bookKey);
          bookLines[bookKey] = bl?.line ?? null;
        }
        rawProps.push({ playerName, market, statKey, line: bestLine, homeTeam: game.homeTeam, awayTeam: game.awayTeam, homeTeamId: game.homeTeamId, awayTeamId: game.awayTeamId, gameTime: game.gameTime, bookLines });
      }
    }
  }

  console.log(`[Projections] Odds pipeline: ${matchedGames.length} games matched, ${rawProps.length} raw props`);
  return buildProjectionsFromRawProps(rawProps, teamGameIdsMap);
}

/**
 * Mode B: Use API-Sports upcoming schedule + recent box scores to generate
 * VisBets-only projections when no sportsbook odds are available.
 * Uses the model's projected average as the line.
 */
async function runFallbackPipeline(): Promise<ProjectedProp[]> {
  console.log('[Projections] Running API-Sports fallback pipeline (no active odds)');

  const upcomingGames = await getUpcomingGamesNextDays(3);
  if (upcomingGames.length === 0) return [];

  const FALLBACK_MARKETS: Array<{ statKey: StatKey; market: string }> = [
    { statKey: 'points', market: 'player_points' },
    { statKey: 'totReb', market: 'player_rebounds' },
    { statKey: 'assists', market: 'player_assists' },
  ];

  const rawProps: Array<{ playerName: string; market: string; statKey: StatKey; line: BestLine; homeTeam: string; awayTeam: string; homeTeamId: number; awayTeamId: number; gameTime: string }> = [];
  const teamGameIdsMap = new Map<string, number[]>();
  const seen = new Set<string>();

  // For each upcoming game, get recent game IDs for both teams
  // then pull one box score to get the active roster
  for (const game of upcomingGames) {
    const homeIds = await getTeamRecentCompletedGameIds(game.teams.home.id, 15);
    const awayIds = await getTeamRecentCompletedGameIds(game.teams.away.id, 15);
    const allIds = [...new Set([...homeIds, ...awayIds])].sort((a, b) => b - a);
    const gameKey = `${game.teams.home.name}:${game.teams.away.name}`;
    teamGameIdsMap.set(gameKey, allIds);

    // Get active players from the most recent box score
    const latestGameId = allIds[0];
    if (!latestGameId) continue;

    const boxScore = await getGameBoxScore(latestGameId);
    const activePlayers = boxScore.filter((s) => {
      const mins = s.min ? parseFloat(s.min) : 0;
      return !isNaN(mins) && mins >= 15;
    });

    for (const playerStat of activePlayers) {
      const playerName = playerStat.player.name; // "Lastname Firstname" format from box score
      for (const { statKey, market } of FALLBACK_MARKETS) {
        const dedupeKey = `${playerName}:${statKey}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        // Use model avg as line — will be computed during projection build
        rawProps.push({
          playerName,
          market,
          statKey,
          line: { line: 0, overOdds: null, underOdds: null, bookmaker: 'visbets' },
          homeTeam: game.teams.home.name,
          awayTeam: game.teams.away.name,
          homeTeamId: game.teams.home.id,
          awayTeamId: game.teams.away.id,
          gameTime: game.date,
        });
      }
    }
  }

  // Compute actual lines from historical data before building
  // We need to fetch logs first to get the average
  const playerLogsCache = new Map<string, Awaited<ReturnType<typeof getPlayerGameLogsFromBoxScores>>>();
  for (const raw of rawProps) {
    const gameKey = `${raw.homeTeam}:${raw.awayTeam}`;
    const gameIds = teamGameIdsMap.get(gameKey) ?? [];
    if (!playerLogsCache.has(raw.playerName)) {
      const logs = await getPlayerGameLogsFromBoxScores(raw.playerName, gameIds);
      playerLogsCache.set(raw.playerName, logs);
    }
    const logs = playerLogsCache.get(raw.playerName) ?? [];
    const values = logs.slice(0, 10).map((g) => extractStatValue(g, raw.statKey)).filter((v): v is number => v !== null);
    if (values.length === 0) { raw.line.line = -1; continue; } // mark to skip
    raw.line.line = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 2) / 2;
  }

  const validProps = rawProps.filter((p) => p.line.line > 0);
  console.log(`[Projections] Fallback pipeline: ${validProps.length} props from ${upcomingGames.length} upcoming games`);
  return buildProjectionsFromRawProps(validProps, teamGameIdsMap);
}

/** Run Mode A (odds), fall through to Mode B (API-Sports fallback) if needed. */
async function runProjectionsPipeline(preferredBook?: string): Promise<ProjectedProp[]> {
  try {
    const oddsResult = await runOddsBasedPipeline(preferredBook);
    if (oddsResult.length > 0) return oddsResult;
  } catch (err: any) {
    console.warn('[Projections] Odds pipeline error:', err.message);
  }

  try {
    return await runFallbackPipeline();
  } catch (err: any) {
    console.warn('[Projections] Fallback pipeline error:', err.message);
    return [];
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

// GET /api/projections/debug — auth required, returns pipeline trace for diagnosis
router.get('/debug', requireAuth, async (req: Request, res: Response) => {
  try {
    const oddsEvents = await getNBAOdds();
    const oddsDates = [...new Set(oddsEvents.map((e) => e.commence_time.split('T')[0]))];
    const gamesByDate = await Promise.all(oddsDates.map((d) => getGamesForDate(d)));
    const apiGames = gamesByDate.flat();

    // Sample one event's props
    const sampleEventId = oddsEvents[0]?.id ?? null;
    const sampleProps = sampleEventId ? await getNBAPlayerProps(sampleEventId) : null;
    const samplePlayerCount = sampleProps
      ? [...new Set(sampleProps.bookmakers.flatMap((b) => b.markets.flatMap((m) => m.outcomes.map((o) => o.description).filter(Boolean))))].length
      : 0;

    res.json({
      oddsEventCount: oddsEvents.length,
      oddsDates,
      apiGamesCount: apiGames.length,
      apiGameSample: apiGames.slice(0, 3).map((g) => `${g.teams.home.name} vs ${g.teams.away.name} (${g.status.long})`),
      oddsSample: oddsEvents.slice(0, 3).map((e) => `${e.home_team} vs ${e.away_team} @ ${e.commence_time}`),
      sampleEventPlayerCount: samplePlayerCount,
      lastGoodProjectionCount: lastGoodProjections.length,
      lastGoodTimestamp,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projections/today — all authenticated users
// Free users get prop cards with analytics fields stripped (projection, edge, score, etc.)
// Priority: Redis (pre-computed by oddsRefresh job) → Supabase pre_computed_props → live pipeline
router.get(
  '/today',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Determine tier to strip analytics for free users
      const authReq = req as AuthenticatedRequest;
      const tier = authReq.userId ? await getUserTier(authReq.userId) : 'free';

      // Free daily unlocks: deterministically unlock ~5 props per day so
      // free users can see real VIS projections as a conversion incentive.
      // Uses a date-based hash so every free user sees the same unlocked set.
      const FREE_UNLOCKS_PER_DAY = 5;
      const dateSeed = (() => {
        const today = new Date().toISOString().split('T')[0];
        let h = 0;
        for (let i = 0; i < today.length; i++) { h = ((h << 5) - h) + today.charCodeAt(i); h |= 0; }
        return Math.abs(h);
      })();

      const stripForFree = (props: ProjectedProp[]): ProjectedProp[] => {
        if (tier !== 'free') return props;
        return props.map((p, idx) => {
          // Unlock a stable daily subset — same props for all free users
          const propHash = ((dateSeed + idx * 2654435761) >>> 0) % Math.max(props.length, 1);
          if (propHash < FREE_UNLOCKS_PER_DAY) return p; // keep full data

          return {
            ...p,
            projection: null as any,
            edge: null as any,
            visbetsScore: null as any,
            confidence: null as any,
            pOver: null as any,
            impliedPOver: null as any,
            direction: null as any,
            stdDev: null as any,
          };
        });
      };

      // ── Layer 1: Redis (sub-millisecond, set by oddsRefresh job every 30 min) ──
      // Redis stores rows in DB format (snake_case) — map to frontend contract (camelCase)
      const redisRaw = await redisGetJSON<Record<string, any>[]>(REDIS_KEYS.PROJECTIONS);
      const computedAt = await redisGetJSON<string>(REDIS_KEYS.COMPUTED_AT);

      if (redisRaw && redisRaw.length > 0) {
        const redisProjections: ProjectedProp[] = redisRaw.map((p) => ({
          id:                 `${p.player_name}:${p.stat}`,
          playerName:         p.player_name,
          playerApiSportsId:  p.player_id ?? null,
          teamName:           p.team_name ?? '',
          opponent:           p.opponent ?? '',
          isHome:             p.is_home ?? false,
          gameTime:           p.game_time ?? today,
          stat:               p.stat as StatKey,
          statDisplay:        p.stat_display,
          line:               Number(p.line),
          projection:         Number(p.projection),
          stdDev:             Number(p.std_dev ?? 0),
          pOver:              Number(p.p_over),
          impliedPOver:       Number(p.implied_p_over ?? 0.5),
          edge:               Number(p.edge ?? 0),
          direction:          p.direction as 'over' | 'under',
          visbetsScore:       Number(p.visbets_score),
          confidence:         p.confidence as 'low' | 'medium' | 'high',
          sampleSize:         Number(p.sample_size ?? 0),
          overOdds:           p.over_odds != null ? Number(p.over_odds) : null,
          underOdds:          p.under_odds != null ? Number(p.under_odds) : null,
          bookmaker:          p.bookmaker ?? null,
          modelVersion:       p.model_version ?? MODEL_VERSION,
          headshotUrl:        p.headshot_url ?? null,
          bookLines:          p.bookLines ?? {},
        }));
        return res.json({
          projections: stripForFree(redisProjections),
          count: redisProjections.length,
          modelVersion: MODEL_VERSION,
          generatedAt: computedAt ?? new Date().toISOString(),
          dataSource: 'redis',
        });
      }

      // ── Layer 2: Supabase pre_computed_props (fallback if Redis is cold) ──────
      const { data: dbProps } = await supabaseAdmin
        .from('pre_computed_props')
        .select('*')
        .eq('game_date', today)
        .order('visbets_score', { ascending: false });

      if (dbProps && dbProps.length > 0) {
        // Map DB shape → ProjectedProp (frontend contract)
        const projections: ProjectedProp[] = dbProps.map((p) => ({
          id:                 `${p.player_name}:${p.stat}`,
          playerName:         p.player_name,
          playerApiSportsId:  p.player_id ?? null,
          teamName:           p.team_name ?? '',
          opponent:           p.opponent ?? '',
          isHome:             p.is_home ?? false,
          gameTime:           p.game_time ?? today,
          stat:               p.stat as StatKey,
          statDisplay:        p.stat_display,
          line:               Number(p.line),
          projection:         Number(p.projection),
          stdDev:             Number(p.std_dev ?? 0),
          pOver:              Number(p.p_over),
          impliedPOver:       Number(p.implied_p_over ?? 0.5),
          edge:               Number(p.edge ?? 0),
          direction:          p.direction as 'over' | 'under',
          visbetsScore:       Number(p.visbets_score),
          confidence:         p.confidence as 'low' | 'medium' | 'high',
          sampleSize:         Number(p.sample_size ?? 0),
          overOdds:           p.over_odds != null ? Number(p.over_odds) : null,
          underOdds:          p.under_odds != null ? Number(p.under_odds) : null,
          bookmaker:          p.bookmaker ?? null,
          modelVersion:       p.model_version ?? MODEL_VERSION,
          headshotUrl:        p.headshot_url ?? null,
          bookLines:          (p as any).book_lines ?? {},
        }));

        return res.json({
          projections: stripForFree(projections),
          count: projections.length,
          modelVersion: MODEL_VERSION,
          generatedAt: typeof dbProps[0]?.computed_at === 'string'
            ? dbProps[0].computed_at
            : new Date().toISOString(),
          dataSource: 'db',
        });
      }

      // ── Layer 3: Live pipeline (first run, no data in DB yet) ────────────────
      const preferredBook = typeof req.query.bookmaker === 'string' ? req.query.bookmaker : undefined;
      const cacheKey = `projections:today:${today}:${preferredBook ?? 'default'}`;

      const projections = await getOrFetch<ProjectedProp[]>(
        cacheKey,
        20 * 60,
        async () => {
          const result = await runProjectionsPipeline(preferredBook);
          if (result.length > 0) {
            lastGoodProjections = result;
            lastGoodTimestamp = new Date().toISOString();
            logProjections(result).catch((err) =>
              console.warn('[Projections] Accuracy logging failed:', err.message)
            );
          }
          if (result.length === 0 && lastGoodProjections.length > 0) {
            return lastGoodProjections;
          }
          return result;
        }
      );

      res.json({
        projections: stripForFree(projections),
        count: projections.length,
        modelVersion: MODEL_VERSION,
        generatedAt: new Date().toISOString(),
        dataSource: 'live',
      });
    } catch (err: any) {
      logger.error('[Projections] today error:', err.message);
      if (lastGoodProjections.length > 0) {
        return res.json({
          projections: lastGoodProjections,
          count: lastGoodProjections.length,
          modelVersion: MODEL_VERSION,
          generatedAt: lastGoodTimestamp,
          dataSource: 'cached',
        });
      }
      res.status(500).json({ error: 'Failed to generate projections' });
    }
  }
);

export default router;

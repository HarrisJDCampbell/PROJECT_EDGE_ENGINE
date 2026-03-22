import {
  buildEnhancedProjection,
  extractStatValue,
  STAT_DISPLAY,
  ODDS_API_MARKET_MAP,
} from '../services/projections';
import type { ProjectionInputV2, StatKey, EnhancedProjection } from '../services/projections';
import type { ApiSportsPlayerStats } from '../services/apiSports';

// ── Helper: build a fake game log ────────────────────────────────────────────
function makeLog(points: number, totReb = 5, assists = 4, tpm = 2, min = '32:00', comment?: string): ApiSportsPlayerStats {
  return {
    points,
    totReb,
    assists,
    tpm,
    min,
    comment: comment ?? null,
    player: { id: 1, name: 'Test Player' },
    team: { id: 1, name: 'Test Team' },
    game: { id: 1 },
    pos: null,
    fgm: 8, fga: 16, fgp: '50', ftm: 4, fta: 5, ftp: '80',
    tpa: 5, tpp: '40',
    offReb: 1, defReb: 4,
    steals: 1, turnovers: 2, blocks: 0,
    pFouls: 2, plusMinus: '+5',
  } as unknown as ApiSportsPlayerStats;
}

function buildInput(overrides: Partial<ProjectionInputV2> = {}): ProjectionInputV2 {
  // 10 games averaging ~25 points
  const gameLogs = [28, 24, 26, 22, 30, 25, 27, 23, 26, 24].map((p) => makeLog(p));
  return {
    gameLogs,
    line: 24.5,
    stat: 'points' as StatKey,
    overOdds: -110,
    underOdds: -110,
    bookmaker: 'fanduel',
    ...overrides,
  };
}

// ── extractStatValue ─────────────────────────────────────────────────────────

describe('extractStatValue', () => {
  it('extracts points from a normal game', () => {
    expect(extractStatValue(makeLog(25), 'points')).toBe(25);
  });

  it('extracts rebounds', () => {
    expect(extractStatValue(makeLog(20, 10), 'totReb')).toBe(10);
  });

  it('extracts assists', () => {
    expect(extractStatValue(makeLog(20, 5, 8), 'assists')).toBe(8);
  });

  it('extracts threes', () => {
    expect(extractStatValue(makeLog(20, 5, 4, 5), 'tpm')).toBe(5);
  });

  it('returns null for DNP games', () => {
    expect(extractStatValue(makeLog(0, 0, 0, 0, '0:00', 'DNP - Rest'), 'points')).toBeNull();
  });

  it('returns null for low-minute games (<5 min)', () => {
    expect(extractStatValue(makeLog(2, 0, 0, 0, '3:00'), 'points')).toBeNull();
  });

  it('returns null for "Did Not Play" comment', () => {
    expect(extractStatValue(makeLog(0, 0, 0, 0, '0:00', 'Did Not Play'), 'points')).toBeNull();
  });

  it('returns null for inactive players', () => {
    expect(extractStatValue(makeLog(0, 0, 0, 0, '0:00', 'Inactive - Injury'), 'points')).toBeNull();
  });
});

// ── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('STAT_DISPLAY maps all stat keys', () => {
    expect(STAT_DISPLAY.points).toBe('PTS');
    expect(STAT_DISPLAY.totReb).toBe('REB');
    expect(STAT_DISPLAY.assists).toBe('AST');
    expect(STAT_DISPLAY.tpm).toBe('3PM');
  });

  it('ODDS_API_MARKET_MAP maps all markets', () => {
    expect(ODDS_API_MARKET_MAP.player_points).toBe('points');
    expect(ODDS_API_MARKET_MAP.player_rebounds).toBe('totReb');
    expect(ODDS_API_MARKET_MAP.player_assists).toBe('assists');
    expect(ODDS_API_MARKET_MAP.player_threes).toBe('tpm');
  });
});

// ── buildEnhancedProjection ──────────────────────────────────────────────────

describe('buildEnhancedProjection', () => {
  it('returns a valid projection for standard input', () => {
    const result = buildEnhancedProjection(buildInput());
    expect(result).not.toBeNull();
    expect(result!.stat).toBe('points');
    expect(result!.statDisplay).toBe('PTS');
    expect(result!.line).toBe(24.5);
    expect(result!.bookmaker).toBe('fanduel');
  });

  it('projection is close to the weighted mean (~25.5)', () => {
    const result = buildEnhancedProjection(buildInput())!;
    // EWMA with lambda=0.88 on [28,24,26,22,30,25,27,23,26,24] should be ~25-26
    expect(result.projection).toBeGreaterThan(23);
    expect(result.projection).toBeLessThan(28);
  });

  it('pOver is between 0 and 1', () => {
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.pOver).toBeGreaterThanOrEqual(0);
    expect(result.pOver).toBeLessThanOrEqual(1);
  });

  it('impliedPOver is 0.5 for -110/-110 line (no vig edge)', () => {
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.impliedPOver).toBe(0.5);
  });

  it('visbetsScore is 0-100', () => {
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.visbetsScore).toBeGreaterThanOrEqual(0);
    expect(result.visbetsScore).toBeLessThanOrEqual(100);
  });

  it('direction is over when projection > line', () => {
    // Projection ~25.5 vs line 24.5 → lean over
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.direction).toBe('over');
  });

  it('direction is under when projection < line', () => {
    // Set line way above projection
    const result = buildEnhancedProjection(buildInput({ line: 35 }))!;
    expect(result.direction).toBe('under');
  });

  it('returns null when no game logs', () => {
    const result = buildEnhancedProjection(buildInput({ gameLogs: [] }));
    expect(result).toBeNull();
  });

  it('returns null when all games are DNP', () => {
    const dnpLogs = [1, 2, 3].map(() => makeLog(0, 0, 0, 0, '0:00', 'DNP'));
    const result = buildEnhancedProjection(buildInput({ gameLogs: dnpLogs }));
    expect(result).toBeNull();
  });

  it('sampleSize is capped at 15', () => {
    const manyLogs = Array.from({ length: 25 }, (_, i) => makeLog(20 + i));
    const result = buildEnhancedProjection(buildInput({ gameLogs: manyLogs }))!;
    expect(result.sampleSize).toBe(15);
  });

  it('confidence is "high" for large edge with enough games', () => {
    // Huge mismatch: player averages ~40, line is 20
    const hotLogs = Array.from({ length: 12 }, () => makeLog(40));
    const result = buildEnhancedProjection(
      buildInput({ gameLogs: hotLogs, line: 20, overOdds: -110, underOdds: -110 })
    )!;
    expect(result.confidence).toBe('high');
  });

  it('applies road game penalty', () => {
    const homeResult = buildEnhancedProjection(buildInput({ isHomeGame: true }))!;
    const awayResult = buildEnhancedProjection(buildInput({ isHomeGame: false }))!;
    expect(awayResult.projection).toBeLessThan(homeResult.projection);
  });

  it('applies back-to-back penalty', () => {
    const restedResult = buildEnhancedProjection(buildInput({ daysRest: 2 }))!;
    const b2bResult = buildEnhancedProjection(buildInput({ daysRest: 0 }))!;
    expect(b2bResult.projection).toBeLessThan(restedResult.projection);
  });

  it('applies opponent defensive factor', () => {
    const neutralResult = buildEnhancedProjection(buildInput({ opponentDefFactor: 1.0 }))!;
    const weakDefResult = buildEnhancedProjection(buildInput({ opponentDefFactor: 1.1 }))!;
    const toughDefResult = buildEnhancedProjection(buildInput({ opponentDefFactor: 0.9 }))!;
    expect(weakDefResult.projection).toBeGreaterThan(neutralResult.projection);
    expect(toughDefResult.projection).toBeLessThan(neutralResult.projection);
  });

  it('handles missing odds gracefully (defaults to 0.5 implied)', () => {
    const result = buildEnhancedProjection(
      buildInput({ overOdds: null, underOdds: null })
    )!;
    expect(result.impliedPOver).toBe(0.5);
    expect(result.overOdds).toBeNull();
    expect(result.underOdds).toBeNull();
  });

  it('devigging works for skewed odds', () => {
    // Heavy favorite over: -200/+170
    const result = buildEnhancedProjection(
      buildInput({ overOdds: -200, underOdds: 170 })
    )!;
    // -200 implied = 66.7%, +170 implied = 37%. Devigged: ~64.3%
    expect(result.impliedPOver).toBeGreaterThan(0.6);
    expect(result.impliedPOver).toBeLessThan(0.7);
  });

  it('returns null with fewer than 5 valid game logs', () => {
    // Model requires >= 5 meaningful games to project reliably
    const result = buildEnhancedProjection(
      buildInput({ gameLogs: [makeLog(30)] })
    );
    expect(result).toBeNull();
  });

  it('stdDev is reasonable', () => {
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.stdDev).toBeGreaterThan(0);
    expect(result.stdDev).toBeLessThan(20); // shouldn't be absurd for ~25 avg
  });

  it('edge is positive when projection > line and odds are fair', () => {
    // Player averages ~25, line 24.5, -110/-110 → slight positive edge
    const result = buildEnhancedProjection(buildInput())!;
    expect(result.edge).toBeGreaterThan(0);
  });

  it('projection is non-negative', () => {
    // Even with harsh adjustments, projection should floor at 0
    // Requires >= 5 valid game logs for the model to produce a result
    const lowLogs = [makeLog(1), makeLog(0), makeLog(2), makeLog(1), makeLog(0)];
    const result = buildEnhancedProjection(
      buildInput({
        gameLogs: lowLogs,
        line: 0.5,
        opponentDefFactor: 0.5,
        isHomeGame: false,
        daysRest: 0,
      })
    )!;
    expect(result).not.toBeNull();
    expect(result.projection).toBeGreaterThanOrEqual(0);
  });
});

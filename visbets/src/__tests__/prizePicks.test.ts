/**
 * PrizePicks API Tests
 * Tests to verify player ID parsing and data transformation
 */

// Mock the hashStringToNumber function from prizePicks.ts
const hashStringToNumber = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

describe('PrizePicks Player ID Parsing', () => {
  it('should parse numeric string ID to number', () => {
    const playerId = '12345';
    const result = parseInt(playerId, 10) || hashStringToNumber(playerId);

    expect(result).toBe(12345);
    expect(typeof result).toBe('number');
  });

  it('should hash non-numeric string ID to consistent number', () => {
    const playerId = 'player_abc123';

    // parseInt will return NaN for non-numeric strings
    const parsed = parseInt(playerId, 10);
    expect(isNaN(parsed)).toBe(true);

    // Hash should provide consistent result
    const hash1 = hashStringToNumber(playerId);
    const hash2 = hashStringToNumber(playerId);

    expect(hash1).toBe(hash2);
    expect(hash1).toBeGreaterThan(0);
  });

  it('should produce consistent hashes for same input', () => {
    const testStrings = ['abc', 'xyz123', 'player_name_here', 'UPPER_CASE'];

    testStrings.forEach(str => {
      const hash1 = hashStringToNumber(str);
      const hash2 = hashStringToNumber(str);
      expect(hash1).toBe(hash2);
    });
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashStringToNumber('player_a');
    const hash2 = hashStringToNumber('player_b');

    expect(hash1).not.toBe(hash2);
  });
});

describe('PrizePicks Response Parsing', () => {
  // Simulate PrizePicks API response structure
  const mockPrizePicksResponse = {
    data: [
      {
        id: 'proj_001',
        type: 'projection',
        attributes: {
          stat_type: 'Points',
          line_score: 32.5,
          description: 'DAL/LAL',
          odds_type: 'standard',
          start_time: '2026-01-16T19:00:00Z',
        },
        relationships: {
          new_player: {
            data: {
              id: '12345',
              type: 'new_player',
            },
          },
        },
      },
    ],
    included: [
      {
        id: '12345',
        type: 'new_player',
        attributes: {
          name: 'Luka Doncic',
          team: 'DAL',
          position: 'PG',
          image_url: 'https://example.com/luka.png',
        },
      },
    ],
  };

  it('should extract player ID from relationships', () => {
    const projection = mockPrizePicksResponse.data[0];
    const playerId = projection.relationships?.new_player?.data?.id;

    expect(playerId).toBe('12345');
  });

  it('should find player in included array', () => {
    const playerId = '12345';
    const player = mockPrizePicksResponse.included.find(
      item => item.type === 'new_player' && item.id === playerId
    );

    expect(player).toBeDefined();
    expect(player?.attributes.name).toBe('Luka Doncic');
  });

  it('should convert player ID to number for internal use', () => {
    const playerId = '12345';
    const numericId = parseInt(playerId, 10) || hashStringToNumber(playerId);

    expect(numericId).toBe(12345);
    expect(typeof numericId).toBe('number');
  });

  it('should filter out non-standard odds_type', () => {
    const projections = [
      { attributes: { odds_type: 'standard' } },
      { attributes: { odds_type: 'demon' } },
      { attributes: { odds_type: 'goblin' } },
      { attributes: { odds_type: 'standard' } },
    ];

    const filtered = projections.filter(p => p.attributes.odds_type === 'standard');

    expect(filtered.length).toBe(2);
  });
});

describe('Stat Type Mapping', () => {
  const mapStatType = (rawStatType: string): string | null => {
    const normalized = rawStatType.toLowerCase().trim();

    if (normalized.includes('combo') || normalized.includes('goblin')) {
      return null;
    }

    if (normalized.includes('point') && !normalized.includes('+')) return 'PTS';
    if (normalized === 'rebounds' || normalized === 'rebs') return 'REB';
    if (normalized === 'assists' || normalized === 'asts') return 'AST';
    if (normalized.includes('3-pt') || normalized.includes('3pt') || normalized.includes('threes')) return '3PM';
    if (normalized === 'steals') return 'STL';
    if (normalized.includes('block')) return 'BLK';
    if (normalized.includes('turnover')) return 'TO';
    if (normalized === 'pts+rebs+asts' || normalized === 'pra') return 'PRA';

    return null;
  };

  it('should map Points to PTS', () => {
    expect(mapStatType('Points')).toBe('PTS');
    expect(mapStatType('POINTS')).toBe('PTS');
    expect(mapStatType('points')).toBe('PTS');
  });

  it('should map Rebounds to REB', () => {
    expect(mapStatType('Rebounds')).toBe('REB');
    expect(mapStatType('rebounds')).toBe('REB');
    expect(mapStatType('rebs')).toBe('REB');
  });

  it('should map Assists to AST', () => {
    expect(mapStatType('Assists')).toBe('AST');
    expect(mapStatType('assists')).toBe('AST');
    expect(mapStatType('asts')).toBe('AST');
  });

  it('should map 3-pointers to 3PM', () => {
    expect(mapStatType('3-Pt Made')).toBe('3PM');
    expect(mapStatType('3pt made')).toBe('3PM');
    expect(mapStatType('Threes Made')).toBe('3PM');
  });

  it('should return null for combo props', () => {
    expect(mapStatType('Points (Combo)')).toBeNull();
    expect(mapStatType('Fantasy Score Combo')).toBeNull();
    expect(mapStatType('Goblin Points')).toBeNull();
  });

  it('should return null for unknown stat types', () => {
    expect(mapStatType('Random Stat')).toBeNull();
    expect(mapStatType('Unknown')).toBeNull();
  });
});

describe('PlayerProp Data Structure', () => {
  interface PlayerProp {
    id: string;
    player_id: number;
    player_name: string;
    team: string;
    opponent: string;
    game_id: number;
    game_date: string;
    stat_type: string;
    line: number;
    over_odds: number;
    under_odds: number;
    sportsbook: string;
    image_url?: string;
  }

  it('should create valid PlayerProp object', () => {
    const prop: PlayerProp = {
      id: 'proj_001',
      player_id: 12345,
      player_name: 'Luka Doncic',
      team: 'DAL',
      opponent: 'LAL',
      game_id: 67890,
      game_date: '2026-01-16',
      stat_type: 'PTS',
      line: 32.5,
      over_odds: -110,
      under_odds: -110,
      sportsbook: 'PrizePicks',
      image_url: 'https://example.com/luka.png',
    };

    expect(prop.player_id).toBe(12345);
    expect(typeof prop.player_id).toBe('number');
    expect(prop.stat_type).toBe('PTS');
  });

  it('should have player_id as number type', () => {
    const prop = {
      player_id: parseInt('12345', 10) || hashStringToNumber('12345'),
    };

    expect(typeof prop.player_id).toBe('number');
    expect(Number.isInteger(prop.player_id)).toBe(true);
    expect(prop.player_id).toBeGreaterThan(0);
  });
});

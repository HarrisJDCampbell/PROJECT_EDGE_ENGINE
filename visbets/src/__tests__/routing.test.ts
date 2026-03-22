/**
 * Routing Tests
 * Tests to diagnose and verify player detail routing
 */

describe('Player ID Validation', () => {
  // Test the player ID conversion logic from PrizePicks
  const hashStringToNumber = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };

  it('should convert string IDs to valid numbers', () => {
    const testIds = ['123456', 'abc123', 'player_001', '999999'];

    testIds.forEach(id => {
      const parsed = parseInt(id, 10);
      const result = !isNaN(parsed) ? parsed : hashStringToNumber(id);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });
  });

  it('should handle numeric string IDs correctly', () => {
    const numericId = '12345678';
    const parsed = parseInt(numericId, 10);

    expect(parsed).toBe(12345678);
    expect(isNaN(parsed)).toBe(false);
  });

  it('should handle non-numeric string IDs with hash fallback', () => {
    const alphaId = 'player_abc_xyz';
    const parsed = parseInt(alphaId, 10);

    expect(isNaN(parsed)).toBe(true);

    const hashed = hashStringToNumber(alphaId);
    expect(typeof hashed).toBe('number');
    expect(hashed).toBeGreaterThan(0);
  });
});

describe('Navigation URL Construction', () => {
  it('should construct valid player route params', () => {
    const playerId = 12345;
    const statType = 'PTS';
    const gameId: number | undefined = 67890;

    const params: Record<string, string> = {
      id: String(playerId),
      market: statType,
    };
    if (gameId) {
      params.gameId = String(gameId);
    }

    expect(params.id).toBe('12345');
    expect(params.market).toBe('PTS');
    expect(params.gameId).toBe('67890');
  });

  it('should handle missing gameId', () => {
    const playerId = 12345;
    const statType = 'REB';
    const gameId: number | undefined = undefined;

    const params: Record<string, string | undefined> = {
      id: String(playerId),
      market: statType,
      gameId: gameId ? String(gameId) : undefined,
    };

    expect(params.id).toBe('12345');
    expect(params.market).toBe('REB');
    expect(params.gameId).toBeUndefined();
  });

  it('should convert player_id to string for routing', () => {
    const playerId = 1629029; // Luka Doncic's PrizePicks ID (example)
    const stringId = String(playerId);

    expect(stringId).toBe('1629029');
    expect(typeof stringId).toBe('string');
  });
});

describe('Route Matching', () => {
  it('should validate player route pattern', () => {
    const validRoutes = [
      '/player/123',
      '/player/12345678',
      '/player/1',
    ];

    const playerRoutePattern = /^\/player\/\d+$/;

    validRoutes.forEach(route => {
      expect(route).toMatch(playerRoutePattern);
    });
  });

  it('should validate player route with query params', () => {
    const routeWithParams = '/player/123?market=PTS&gameId=456';

    // Extract pathname
    const url = new URL(routeWithParams, 'http://localhost');
    expect(url.pathname).toBe('/player/123');
    expect(url.searchParams.get('market')).toBe('PTS');
    expect(url.searchParams.get('gameId')).toBe('456');
  });

  it('should extract id from dynamic route', () => {
    const pathname = '/player/12345678';
    const match = pathname.match(/^\/player\/(\d+)/);

    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('12345678');
  });
});

describe('Player ID from Props Data', () => {
  // Simulate the data structure from PrizePicks
  const mockPlayerProp = {
    id: 'projection_abc123',
    player_id: 1629029,
    player_name: 'Luka Doncic',
    team: 'DAL',
    opponent: 'LAL',
    game_id: 123456,
    game_date: '2026-01-16',
    stat_type: 'PTS',
    line: 32.5,
    over_odds: -110,
    under_odds: -110,
    sportsbook: 'PrizePicks',
  };

  it('should have valid numeric player_id', () => {
    expect(typeof mockPlayerProp.player_id).toBe('number');
    expect(mockPlayerProp.player_id).toBeGreaterThan(0);
    expect(Number.isInteger(mockPlayerProp.player_id)).toBe(true);
  });

  it('should be able to find player by id', () => {
    const allProps = [mockPlayerProp];
    const searchId = 1629029;

    const found = allProps.find(p => p.player_id === searchId);

    expect(found).toBeDefined();
    expect(found?.player_name).toBe('Luka Doncic');
  });

  it('should parse string id param to match numeric player_id', () => {
    const routeIdParam = '1629029'; // Comes as string from URL params
    const parsedId = parseInt(routeIdParam, 10);

    expect(parsedId).toBe(mockPlayerProp.player_id);
    expect(parsedId === mockPlayerProp.player_id).toBe(true);
  });
});

describe('Edge Cases', () => {
  it('should handle zero player_id', () => {
    const playerId = 0;
    const isValid = playerId && !isNaN(Number(playerId));

    expect(isValid).toBeFalsy(); // 0 is falsy, should fail validation
  });

  it('should handle NaN player_id', () => {
    const playerId = NaN;
    const isValid = playerId && !isNaN(Number(playerId));

    expect(isValid).toBeFalsy(); // NaN is falsy
  });

  it('should handle undefined player_id', () => {
    const playerId = undefined;
    const isValid = playerId && !isNaN(Number(playerId));

    expect(isValid).toBeFalsy(); // undefined is falsy
  });

  it('should handle empty string id param', () => {
    const idParam = '';
    const parsed = parseInt(idParam || '0', 10);

    expect(parsed).toBe(0);
  });

  it('should handle undefined id param', () => {
    const idParam: string | undefined = undefined;
    const parsed = parseInt(idParam || '0', 10);

    expect(parsed).toBe(0);
  });
});

describe('Expo Router Object Format', () => {
  it('should create valid navigation object', () => {
    const playerId = 1629029;
    const statType = 'PTS';
    const gameId: number | undefined = 123456;

    const params: Record<string, string> = {
      id: String(playerId),
      market: statType,
    };
    if (gameId) {
      params.gameId = String(gameId);
    }

    const navObject = {
      pathname: '/player/[id]',
      params,
    };

    expect(navObject.pathname).toBe('/player/[id]');
    expect(navObject.params.id).toBe('1629029');
    expect(navObject.params.market).toBe('PTS');
    expect(navObject.params.gameId).toBe('123456');
  });

  it('should handle params spreading correctly', () => {
    const gameId: number | undefined = 0; // Falsy value

    const params: Record<string, string | undefined> = {
      id: '123',
      market: 'PTS',
    };
    if (gameId) {
      params.gameId = String(gameId);
    }

    // gameId should NOT be included because 0 is falsy
    expect('gameId' in params).toBe(false);
  });

  it('should include gameId when truthy', () => {
    const gameId: number | undefined = 456;

    const params: Record<string, string> = {
      id: '123',
      market: 'PTS',
    };
    if (gameId) {
      params.gameId = String(gameId);
    }

    expect('gameId' in params).toBe(true);
    expect(params.gameId).toBe('456');
  });
});

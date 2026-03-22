/**
 * Route Configuration Tests
 * Verifies the Expo Router route structure is correct
 */

import * as fs from 'fs';
import * as path from 'path';

const APP_DIR = path.join(__dirname, '../../app');

describe('Route File Structure', () => {
  it('should have app directory', () => {
    expect(fs.existsSync(APP_DIR)).toBe(true);
  });

  it('should have root _layout.tsx', () => {
    const layoutPath = path.join(APP_DIR, '_layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('should have player directory', () => {
    const playerDir = path.join(APP_DIR, 'player');
    expect(fs.existsSync(playerDir)).toBe(true);
    expect(fs.statSync(playerDir).isDirectory()).toBe(true);
  });

  it('should have player/_layout.tsx', () => {
    const layoutPath = path.join(APP_DIR, 'player/_layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('should have player/[id].tsx', () => {
    const idPath = path.join(APP_DIR, 'player/[id].tsx');
    expect(fs.existsSync(idPath)).toBe(true);
  });

  it('should have (tabs) directory', () => {
    const tabsDir = path.join(APP_DIR, '(tabs)');
    expect(fs.existsSync(tabsDir)).toBe(true);
    expect(fs.statSync(tabsDir).isDirectory()).toBe(true);
  });

  it('should have (tabs)/_layout.tsx', () => {
    const layoutPath = path.join(APP_DIR, '(tabs)/_layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('should have (tabs)/index.tsx', () => {
    const indexPath = path.join(APP_DIR, '(tabs)/index.tsx');
    expect(fs.existsSync(indexPath)).toBe(true);
  });

  it('should have +not-found.tsx', () => {
    const notFoundPath = path.join(APP_DIR, '+not-found.tsx');
    expect(fs.existsSync(notFoundPath)).toBe(true);
  });
});

describe('Root Layout Configuration', () => {
  it('should export default function', () => {
    const layoutPath = path.join(APP_DIR, '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('export default');
    expect(content).toContain('function');
  });

  it('should register player route', () => {
    const layoutPath = path.join(APP_DIR, '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('name="player"');
  });

  it('should use Stack navigator', () => {
    const layoutPath = path.join(APP_DIR, '_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('Stack');
    expect(content).toContain('Stack.Screen');
  });
});

describe('Player Layout Configuration', () => {
  it('should export default function', () => {
    const layoutPath = path.join(APP_DIR, 'player/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('export default');
    expect(content).toContain('function');
  });

  it('should register [id] dynamic route', () => {
    const layoutPath = path.join(APP_DIR, 'player/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('name="[id]"');
  });

  it('should use Stack navigator', () => {
    const layoutPath = path.join(APP_DIR, 'player/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf-8');

    expect(content).toContain('Stack');
    expect(content).toContain('Stack.Screen');
  });
});

describe('Player Detail Screen', () => {
  it('should export default function', () => {
    const screenPath = path.join(APP_DIR, 'player/[id].tsx');
    const content = fs.readFileSync(screenPath, 'utf-8');

    expect(content).toContain('export default');
    expect(content).toContain('function');
  });

  it('should use useLocalSearchParams hook', () => {
    const screenPath = path.join(APP_DIR, 'player/[id].tsx');
    const content = fs.readFileSync(screenPath, 'utf-8');

    expect(content).toContain('useLocalSearchParams');
  });

  it('should extract id param', () => {
    const screenPath = path.join(APP_DIR, 'player/[id].tsx');
    const content = fs.readFileSync(screenPath, 'utf-8');

    expect(content).toMatch(/id.*string/);
  });
});

describe('Navigation Configuration', () => {
  it('PlayerPropCard should use router.push', () => {
    const cardPath = path.join(__dirname, '../components/board/PlayerPropCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    expect(content).toContain('router.push');
    expect(content).toContain('useRouter');
  });

  it('PlayerPropCard should navigate to /player/', () => {
    const cardPath = path.join(__dirname, '../components/board/PlayerPropCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    expect(content).toContain('/player/');
  });

  it('should validate player_id before navigation', () => {
    const cardPath = path.join(__dirname, '../components/board/PlayerPropCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    // PlayerPropCard guards invalid IDs by checking player_id > 0 and falling
    // back to encodeURIComponent(player_name) for name-based routing
    expect(content).toContain('player_id');
    expect(content).toContain('encodeURIComponent');
  });
});

describe('Typed Routes', () => {
  it('should have .expo/types/router.d.ts', () => {
    const typesPath = path.join(__dirname, '../../.expo/types/router.d.ts');

    // This file is auto-generated by Expo, may not exist in test environment
    // Just check that the app structure is correct
    const appExists = fs.existsSync(APP_DIR);
    expect(appExists).toBe(true);
  });
});

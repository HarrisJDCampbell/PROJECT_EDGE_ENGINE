/**
 * useUserPreferences
 * Reads sportsbook and sports preferences from the persisted onboarding store.
 * Firebase dependency removed — preferences are stored locally via AsyncStorage.
 */

import { useOnboardingStore } from '../stores/onboardingStore';
import { getSportsbookShortLabel } from './sportsbookHelpers';

export { getSportsbookName, getSportsbookShortLabel } from './sportsbookHelpers';

export interface UserPreferences {
  sportsbooks: string[];
  sports: string[];
}

const DEFAULT_SPORTSBOOKS = ['fanduel', 'draftkings'];
const DEFAULT_SPORTS = ['nba'];

/** @deprecated Use getSportsbookShortLabel from sportsbookHelpers instead */
export const shortLabel = getSportsbookShortLabel;

/** Fallback order for finding an available line when the preferred book has none. */
const BOOK_FALLBACK_ORDER = ['fanduel', 'draftkings', 'prizepicks', 'betmgm', 'underdog', 'caesars', 'espnbet'];

/**
 * Resolve a sportsbook line from bookLines, falling back to the first
 * available book if the preferred one has no data. Returns both the
 * line value and the label of the book the line actually came from.
 */
export function resolveBookLine(
  bookLines: Record<string, number | null> | undefined,
  preferredBook: string,
  preferredLabel: string,
): { line: number | undefined; label: string } {
  if (!bookLines) return { line: undefined, label: preferredLabel };

  // 1. Try the preferred book
  const preferredLine = bookLines[preferredBook];
  if (preferredLine != null) {
    return { line: preferredLine, label: preferredLabel };
  }

  // 2. Try the standard fallback order
  for (const book of BOOK_FALLBACK_ORDER) {
    if (book === preferredBook) continue;
    const line = bookLines[book];
    if (line != null) {
      return { line, label: shortLabel(book) };
    }
  }

  // 3. Last resort: try ANY key in bookLines (covers DFS platforms,
  //    regional books, or any source the backend provides)
  for (const [book, line] of Object.entries(bookLines)) {
    if (book === preferredBook) continue;
    if (line != null) {
      return { line, label: shortLabel(book) };
    }
  }

  return { line: undefined, label: preferredLabel };
}

export function useUserPreferences(): {
  sportsbooks: string[];
  sports: string[];
  isLoading: boolean;
  leftBook: string;
  rightBook: string;
  leftBookLabel: string;
  rightBookLabel: string;
} {
  const selectedSportsbooks = useOnboardingStore((s) => s.selectedSportsbooks);
  const selectedSports = useOnboardingStore((s) => s.selectedSports);

  const sportsbooks =
    selectedSportsbooks.length > 0 ? selectedSportsbooks : DEFAULT_SPORTSBOOKS;
  const sports = selectedSports.length > 0 ? selectedSports : DEFAULT_SPORTS;

  const leftBook = sportsbooks[0] ?? 'fanduel';
  const rightBook = sportsbooks[1] ?? 'draftkings';

  return {
    sportsbooks,
    sports,
    isLoading: false,
    leftBook,
    rightBook,
    leftBookLabel: shortLabel(leftBook),
    rightBookLabel: shortLabel(rightBook),
  };
}

// Keep named exports for any other consumers
export function useUserSportsbooks() {
  const sportsbooks = useOnboardingStore((s) => s.selectedSportsbooks);
  return { data: sportsbooks.length > 0 ? sportsbooks : DEFAULT_SPORTSBOOKS, isLoading: false };
}

export function useUserSports() {
  const sports = useOnboardingStore((s) => s.selectedSports);
  return { data: sports.length > 0 ? sports : DEFAULT_SPORTS, isLoading: false };
}

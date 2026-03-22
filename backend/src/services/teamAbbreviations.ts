/**
 * NBA Team Abbreviations
 * Maps full team names (as returned by API-Sports) to standard 3-letter codes.
 */

const TEAM_NAME_TO_ABBREV: Record<string, string> = {
  'Atlanta Hawks': 'ATL',
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL',
  'Denver Nuggets': 'DEN',
  'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW',
  'Houston Rockets': 'HOU',
  'Indiana Pacers': 'IND',
  'Los Angeles Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'LA Clippers': 'LAC',
  'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA',
  'Milwaukee Bucks': 'MIL',
  'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP',
  'New York Knicks': 'NYK',
  'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL',
  'Philadelphia 76ers': 'PHI',
  'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR',
  'Sacramento Kings': 'SAC',
  'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR',
  'Utah Jazz': 'UTA',
  'Washington Wizards': 'WAS',
};

/**
 * Get 3-letter abbreviation for an NBA team.
 * Tries exact match first, then case-insensitive partial match.
 * Falls back to first 3 characters uppercase.
 */
export function getTeamAbbreviation(fullName: string): string {
  if (!fullName) return '???';

  // Exact match
  if (TEAM_NAME_TO_ABBREV[fullName]) {
    return TEAM_NAME_TO_ABBREV[fullName];
  }

  // Case-insensitive match
  const lower = fullName.toLowerCase();
  for (const [name, abbrev] of Object.entries(TEAM_NAME_TO_ABBREV)) {
    if (name.toLowerCase() === lower) return abbrev;
  }

  // Partial match — check if the team city or mascot is in the name
  for (const [name, abbrev] of Object.entries(TEAM_NAME_TO_ABBREV)) {
    const words = name.toLowerCase().split(' ');
    const lastWord = words[words.length - 1]; // mascot
    if (lower.includes(lastWord) && lastWord.length > 3) return abbrev;
  }

  // Fallback
  return fullName.slice(0, 3).toUpperCase();
}

/**
 * API-Football client for fetching real player stats and league standings
 *
 * Uses RapidAPI (api-football-v1.p.rapidapi.com)
 * Rate limit: ~100 requests/day on free plan, 300/min on paid
 */

const API_FOOTBALL_BASE = 'https://api-football-v1.p.rapidapi.com/v3';

interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

// ---- Player Statistics Types ----

export interface PlayerStatistics {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: { date: string; place: string; country: string };
    nationality: string;
    height: string;
    weight: string;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
    };
    games: {
      appearences: number; // note: API typo "appearences"
      lineups: number;
      minutes: number;
      number: number | null;
      position: string;
      rating: string | null;
      captain: boolean;
    };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    passes: {
      total: number | null;
      key: number | null;
      accuracy: number | null;
    };
    tackles: {
      total: number | null;
      blocks: number | null;
      interceptions: number | null;
    };
    duels: {
      total: number | null;
      won: number | null;
    };
    dribbles: {
      attempts: number | null;
      success: number | null;
      past: number | null;
    };
    fouls: {
      drawn: number | null;
      committed: number | null;
    };
    cards: {
      yellow: number | null;
      yellowred: number | null;
      red: number | null;
    };
    penalty: {
      won: number | null;
      commited: number | null;
      scored: number | null;
      missed: number | null;
      saved: number | null;
    };
  }>;
}

// ---- League Standings Types ----

export interface LeagueStanding {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: Array<Array<{
      rank: number;
      team: {
        id: number;
        name: string;
        logo: string;
      };
      points: number;
      goalsDiff: number;
      group: string;
      form: string;
      status: string;
      description: string;
      all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: { for: number; against: number };
      };
    }>>;
  };
}

// ---- API Client ----

function getHeaders(): HeadersInit {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('[API-Football] API_FOOTBALL_KEY not set in environment');
  }

  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
  };
}

async function fetchAPI<T>(endpoint: string, params: Record<string, string | number>): Promise<T[]> {
  const url = new URL(`${API_FOOTBALL_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`[API-Football] HTTP ${response.status}: ${response.statusText} for ${endpoint}`);
  }

  const data: APIFootballResponse<T> = await response.json();

  // Check for API-level errors
  const errors = data.errors;
  if (errors && ((Array.isArray(errors) && errors.length > 0) || (!Array.isArray(errors) && Object.keys(errors).length > 0))) {
    console.warn(`[API-Football] API errors for ${endpoint}:`, errors);
  }

  return data.response;
}

/**
 * Fetch player statistics for a given season
 */
export async function fetchPlayerStats(
  playerId: number,
  season: number
): Promise<PlayerStatistics | null> {
  try {
    const results = await fetchAPI<PlayerStatistics>('/players', {
      id: playerId,
      season,
    });

    if (results.length === 0) {
      console.warn(`[API-Football] No stats found for player ${playerId} season ${season}`);
      return null;
    }

    return results[0];
  } catch (error) {
    console.error(`[API-Football] Error fetching player ${playerId}:`, error);
    return null;
  }
}

/**
 * Fetch league standings for a given season
 * Results are cached in-memory during a single cron run
 */
const standingsCache = new Map<string, LeagueStanding | null>();

export async function fetchLeagueStandings(
  leagueId: number,
  season: number
): Promise<LeagueStanding | null> {
  const cacheKey = `${leagueId}-${season}`;

  if (standingsCache.has(cacheKey)) {
    return standingsCache.get(cacheKey) ?? null;
  }

  try {
    const results = await fetchAPI<LeagueStanding>('/standings', {
      league: leagueId,
      season,
    });

    const standing = results.length > 0 ? results[0] : null;
    standingsCache.set(cacheKey, standing);
    return standing;
  } catch (error) {
    console.error(`[API-Football] Error fetching standings for league ${leagueId}:`, error);
    standingsCache.set(cacheKey, null);
    return null;
  }
}

/**
 * Find team's league position from standings data
 */
export function getTeamLeaguePosition(
  standings: LeagueStanding | null,
  teamName: string
): number | null {
  if (!standings?.league?.standings) return null;

  for (const group of standings.league.standings) {
    for (const entry of group) {
      // Fuzzy match: check if team name is contained in either direction
      if (
        entry.team.name.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(entry.team.name.toLowerCase())
      ) {
        return entry.rank;
      }
    }
  }

  return null;
}

/**
 * Get matchdays played so far in a league
 */
export function getLeagueMatchdaysPlayed(standings: LeagueStanding | null): number {
  if (!standings?.league?.standings?.[0]?.[0]) return 38; // default

  return standings.league.standings[0][0].all.played;
}

/**
 * Clear the standings cache (call at end of cron run)
 */
export function clearStandingsCache(): void {
  standingsCache.clear();
}

/**
 * Delay helper for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

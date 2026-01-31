/**
 * ESPN API Client for AFCON Statistics
 * Uses ESPN's undocumented but publicly accessible API endpoints
 */

import { unstable_cache } from 'next/cache';

export interface ESPNPlayer {
  id: string;
  displayName: string;
  shortName: string;
  flag?: {
    href: string;
    alt: string;
  };
  team?: {
    id: string;
    abbreviation: string;
    displayName: string;
    logo: string;
  };
  statistics: {
    name: string;
    displayValue: string;
    value: number;
  }[];
}

export interface ESPNCategory {
  name: string;
  displayName: string;
  leaders: ESPNPlayer[];
}

export interface AFCONScorer {
  rank: number;
  name: string;
  country: string;
  countryCode?: string;
  team?: string;
  teamLogo?: string;
  goals: number;
  assists: number;
  matches: number;
  minutesPlayed?: number;
}

/**
 * Internal function to fetch AFCON statistics from ESPN API
 * This is wrapped by unstable_cache for proper server-side caching
 */
async function _fetchAFCONStatisticsInternal(): Promise<{
  scorers: AFCONScorer[];
  assistLeaders: AFCONScorer[];
  lastUpdated: string;
}> {
  try {
    // Only log in development to avoid log spam in production
    if (process.env.NODE_ENV === 'development') {
      console.log('[ESPN API] Fetching AFCON statistics...');
    }

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/statistics',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AfriqueSports/1.0)',
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract goals category
    const goalsCategory = data.categories?.find(
      (cat: ESPNCategory) => cat.name === 'goals'
    );

    // Extract assists category
    const assistsCategory = data.categories?.find(
      (cat: ESPNCategory) => cat.name === 'assists'
    );

    // Parse scorers
    const scorers: AFCONScorer[] = goalsCategory?.leaders?.map((player: ESPNPlayer, index: number) => {
      const goals = player.statistics.find(s => s.name === 'goals')?.value || 0;
      const assists = player.statistics.find(s => s.name === 'assists')?.value || 0;
      const matches = player.statistics.find(s => s.name === 'appearances')?.value || 0;
      const minutesPlayed = player.statistics.find(s => s.name === 'minutesPlayed')?.value;

      return {
        rank: index + 1,
        name: player.displayName,
        country: player.flag?.alt || player.team?.displayName || 'Unknown',
        countryCode: player.flag?.alt,
        team: player.team?.displayName,
        teamLogo: player.team?.logo,
        goals,
        assists,
        matches,
        minutesPlayed,
      };
    }) || [];

    // Parse assist leaders
    const assistLeaders: AFCONScorer[] = assistsCategory?.leaders?.map((player: ESPNPlayer, index: number) => {
      const goals = player.statistics.find(s => s.name === 'goals')?.value || 0;
      const assists = player.statistics.find(s => s.name === 'assists')?.value || 0;
      const matches = player.statistics.find(s => s.name === 'appearances')?.value || 0;

      return {
        rank: index + 1,
        name: player.displayName,
        country: player.flag?.alt || player.team?.displayName || 'Unknown',
        countryCode: player.flag?.alt,
        team: player.team?.displayName,
        teamLogo: player.team?.logo,
        goals,
        assists,
        matches,
      };
    }) || [];

    return {
      scorers,
      assistLeaders,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ESPN API] Error fetching AFCON statistics:', errorMessage);

    // Return empty data on error
    return {
      scorers: [],
      assistLeaders: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Fetch AFCON statistics from ESPN API
 * Cached for 5 minutes using Next.js unstable_cache for proper server-side caching
 * This ensures the ESPN API is called at most once every 5 minutes, not on every request
 */
export const fetchAFCONStatistics = unstable_cache(
  _fetchAFCONStatisticsInternal,
  ['espn-afcon-statistics'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['espn', 'afcon-statistics'],
  }
);

/**
 * Internal function to fetch AFCON scoreboard
 */
async function _fetchAFCONScoreboardInternal() {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard'
    );

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ESPN API] Error fetching AFCON scoreboard:', error);
    return null;
  }
}

/**
 * Fetch AFCON scoreboard for current matches
 * Cached for 2 minutes using Next.js unstable_cache
 */
export const fetchAFCONScoreboard = unstable_cache(
  _fetchAFCONScoreboardInternal,
  ['espn-afcon-scoreboard'],
  {
    revalidate: 120, // Cache for 2 minutes during live matches
    tags: ['espn', 'afcon-scoreboard'],
  }
);

/**
 * Map country name to flag emoji
 */
export function getCountryFlag(countryName: string): string {
  const flagMap: Record<string, string> = {
    'Morocco': '🇲🇦',
    'Algeria': '🇩🇿',
    'Egypt': '🇪🇬',
    'Nigeria': '🇳🇬',
    'Senegal': '🇸🇳',
    'Tunisia': '🇹🇳',
    'Cameroon': '🇨🇲',
    'Ivory Coast': '🇨🇮',
    'Ghana': '🇬🇭',
    'Mali': '🇲🇱',
    'Burkina Faso': '🇧🇫',
    'Guinea': '🇬🇳',
    'South Africa': '🇿🇦',
    'Congo DR': '🇨🇩',
    'Equatorial Guinea': '🇬🇶',
    'Gabon': '🇬🇦',
    'Mozambique': '🇲🇿',
    'Angola': '🇦🇴',
    'Sudan': '🇸🇩',
    'Tanzania': '🇹🇿',
    'Zambia': '🇿🇲',
    'Uganda': '🇺🇬',
    'Cape Verde': '🇨🇻',
    'Mauritania': '🇲🇷',
  };

  return flagMap[countryName] || '🌍';
}

/**
 * Format player name for display
 */
export function formatPlayerName(name: string): string {
  // Handle common name formats from ESPN
  return name.trim();
}

/**
 * Get goals per match ratio
 */
export function getGoalsPerMatch(goals: number, matches: number): number {
  if (matches === 0) return 0;
  return Number((goals / matches).toFixed(2));
}

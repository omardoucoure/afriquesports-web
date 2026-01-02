/**
 * ESPN API Client for AFCON Statistics
 * Uses ESPN's undocumented but publicly accessible API endpoints
 */

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
 * Fetch AFCON statistics from ESPN API
 */
export async function fetchAFCONStatistics(): Promise<{
  scorers: AFCONScorer[];
  assistLeaders: AFCONScorer[];
  lastUpdated: string;
}> {
  try {
    console.log('[ESPN API] Fetching AFCON statistics...');

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/statistics',
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AfriqueS ports/1.0)',
        },
      }
    );

    clearTimeout(timeoutId);
    console.log('[ESPN API] Response status:', response.status);

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
    console.error('[ESPN API] ❌ Error fetching AFCON statistics:', errorMessage);
    console.error('[ESPN API] Full error:', error);

    // Return empty data on error
    return {
      scorers: [],
      assistLeaders: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Fetch AFCON scoreboard for current matches
 */
export async function fetchAFCONScoreboard() {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      {
        next: { revalidate: 60 }, // Cache for 1 minute during live matches
      }
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

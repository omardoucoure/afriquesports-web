/**
 * Tracked player pool for the African Ballon d'Or ranking
 *
 * Based on 2025 CAF nominees and strong contenders.
 * API-Football IDs are from api-football.com (via RapidAPI).
 *
 * Position categories for scoring:
 * - "Attacker": goals weighted heavily
 * - "Midfielder": balanced goals + assists + rating
 * - "Defender": defensive contributions + rating
 * - "Goalkeeper": clean sheets + rating
 */

export type PlayerPosition = 'Attacker' | 'Midfielder' | 'Defender' | 'Goalkeeper';

export interface TrackedPlayer {
  apiFootballId: number;
  name: string;
  nationality: string;
  countryCode: string;
  position: PlayerPosition;
  club: string;
  leagueId: number; // API-Football league ID for standings lookup
  /** Champions League stage reached (if applicable) */
  clStage?: string;
  /** National team stats (manual override — API-Football has limited NT data) */
  ntGoals?: number;
  ntAssists?: number;
  ntAppearances?: number;
}

/**
 * API-Football league IDs for the major European leagues
 */
export const LEAGUE_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  EREDIVISIE: 88,
  SUPER_LIG: 203,
  MLS: 253,
  PRIMEIRA_LIGA: 94,
} as const;

/**
 * Pool of ~20 tracked African players
 * IDs verified via API-Football search endpoint
 */
export const TRACKED_PLAYERS: TrackedPlayer[] = [
  {
    apiFootballId: 306,
    name: 'Mohamed Salah',
    nationality: 'Egypt',
    countryCode: 'EG',
    position: 'Attacker',
    club: 'Liverpool',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    clStage: 'quarter',
    ntGoals: 3,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 284,
    name: 'Achraf Hakimi',
    nationality: 'Morocco',
    countryCode: 'MA',
    position: 'Defender',
    club: 'PSG',
    leagueId: LEAGUE_IDS.LIGUE_1,
    clStage: 'semi',
    ntGoals: 1,
    ntAssists: 3,
    ntAppearances: 8,
  },
  {
    apiFootballId: 1100,
    name: 'Victor Osimhen',
    nationality: 'Nigeria',
    countryCode: 'NG',
    position: 'Attacker',
    club: 'Galatasaray',
    leagueId: LEAGUE_IDS.SUPER_LIG,
    ntGoals: 4,
    ntAssists: 1,
    ntAppearances: 7,
  },
  {
    apiFootballId: 874,
    name: 'Ademola Lookman',
    nationality: 'Nigeria',
    countryCode: 'NG',
    position: 'Attacker',
    club: 'Atalanta',
    leagueId: LEAGUE_IDS.SERIE_A,
    ntGoals: 2,
    ntAssists: 2,
    ntAppearances: 6,
  },
  {
    apiFootballId: 1584,
    name: 'Serhou Guirassy',
    nationality: 'Guinea',
    countryCode: 'GN',
    position: 'Attacker',
    club: 'Borussia Dortmund',
    leagueId: LEAGUE_IDS.BUNDESLIGA,
    clStage: 'group',
    ntGoals: 3,
    ntAssists: 0,
    ntAppearances: 5,
  },
  {
    apiFootballId: 19847,
    name: 'Bryan Mbeumo',
    nationality: 'Cameroon',
    countryCode: 'CM',
    position: 'Attacker',
    club: 'Brentford',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 2,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 22044,
    name: 'Yoane Wissa',
    nationality: 'DR Congo',
    countryCode: 'CD',
    position: 'Attacker',
    club: 'Brentford',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 1,
    ntAssists: 0,
    ntAppearances: 4,
  },
  {
    apiFootballId: 258735,
    name: 'Frank Anguissa',
    nationality: 'Cameroon',
    countryCode: 'CM',
    position: 'Midfielder',
    club: 'Napoli',
    leagueId: LEAGUE_IDS.SERIE_A,
    ntGoals: 1,
    ntAssists: 2,
    ntAppearances: 7,
  },
  {
    apiFootballId: 19168,
    name: 'Nicolas Jackson',
    nationality: 'Senegal',
    countryCode: 'SN',
    position: 'Attacker',
    club: 'Chelsea',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 3,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 296507,
    name: 'Omar Marmoush',
    nationality: 'Egypt',
    countryCode: 'EG',
    position: 'Attacker',
    club: 'Manchester City',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    clStage: 'r16',
    ntGoals: 2,
    ntAssists: 1,
    ntAppearances: 5,
  },
  {
    apiFootballId: 291606,
    name: 'Simon Adingra',
    nationality: 'Ivory Coast',
    countryCode: 'CI',
    position: 'Attacker',
    club: 'Brighton',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 2,
    ntAssists: 2,
    ntAppearances: 7,
  },
  {
    apiFootballId: 284324,
    name: 'Amad Diallo',
    nationality: 'Ivory Coast',
    countryCode: 'CI',
    position: 'Attacker',
    club: 'Manchester United',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 1,
    ntAssists: 1,
    ntAppearances: 5,
  },
  {
    apiFootballId: 20466,
    name: 'Ismaila Sarr',
    nationality: 'Senegal',
    countryCode: 'SN',
    position: 'Attacker',
    club: 'Crystal Palace',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 1,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 47380,
    name: 'Brahim Diaz',
    nationality: 'Morocco',
    countryCode: 'MA',
    position: 'Midfielder',
    club: 'Real Madrid',
    leagueId: LEAGUE_IDS.LA_LIGA,
    clStage: 'semi',
    ntGoals: 2,
    ntAssists: 3,
    ntAppearances: 7,
  },
  {
    apiFootballId: 284330,
    name: 'Pape Matar Sarr',
    nationality: 'Senegal',
    countryCode: 'SN',
    position: 'Midfielder',
    club: 'Tottenham',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 1,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 197454,
    name: 'Iliman Ndiaye',
    nationality: 'Senegal',
    countryCode: 'SN',
    position: 'Attacker',
    club: 'Everton',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 2,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 157997,
    name: 'Edmond Tapsoba',
    nationality: 'Burkina Faso',
    countryCode: 'BF',
    position: 'Defender',
    club: 'Bayer Leverkusen',
    leagueId: LEAGUE_IDS.BUNDESLIGA,
    clStage: 'r16',
    ntGoals: 0,
    ntAssists: 1,
    ntAppearances: 6,
  },
  {
    apiFootballId: 18907,
    name: 'Andre Onana',
    nationality: 'Cameroon',
    countryCode: 'CM',
    position: 'Goalkeeper',
    club: 'Manchester United',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 0,
    ntAssists: 0,
    ntAppearances: 6,
  },
  {
    apiFootballId: 22220,
    name: 'Denis Bouanga',
    nationality: 'Gabon',
    countryCode: 'GA',
    position: 'Attacker',
    club: 'LAFC',
    leagueId: LEAGUE_IDS.MLS,
    ntGoals: 2,
    ntAssists: 0,
    ntAppearances: 4,
  },
  {
    apiFootballId: 291464,
    name: 'Antoine Semenyo',
    nationality: 'Ghana',
    countryCode: 'GH',
    position: 'Attacker',
    club: 'Bournemouth',
    leagueId: LEAGUE_IDS.PREMIER_LEAGUE,
    ntGoals: 1,
    ntAssists: 1,
    ntAppearances: 5,
  },
];

/**
 * Current season for API-Football queries
 */
export const CURRENT_SEASON = 2024;

/**
 * Maximum matchdays estimate for consistency calculation.
 * Used as denominator for minutes_played ratio.
 */
export const ESTIMATED_LEAGUE_MATCHDAYS = 38;

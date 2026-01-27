/**
 * Ballon d'Or scoring algorithm
 *
 * Mirrors the real CAF African Player of the Year criteria:
 * - 4 equal voting groups: coaches, captains, technical experts, media
 * - Key factors: individual stats, club trophies, national team, consistency
 *
 * Total = Individual (35%) + Club Success (30%) + National Team (20%) + Consistency (15%)
 */

import type { PlayerPosition, TrackedPlayer } from '@/config/ballon-dor-players';
import { ESTIMATED_LEAGUE_MATCHDAYS } from '@/config/ballon-dor-players';

export interface PlayerRawStats {
  goals: number;
  assists: number;
  appearances: number;
  minutesPlayed: number;
  cleanSheets: number;
  rating: number; // e.g. 7.2
  leaguePosition: number | null;
  leagueMatchdaysPlayed: number;
}

export interface ScoredPlayer {
  player: TrackedPlayer;
  stats: PlayerRawStats;
  photo: string;
  teamLogo: string;
  leagueName: string;
  scores: {
    individual: number;
    clubSuccess: number;
    nationalTeam: number;
    consistency: number;
    total: number;
  };
  keyStat: {
    label: string;
    value: string;
  };
}

// ============================================================================
// Individual Performance (35%)
// Position-adjusted to avoid penalizing defenders
// ============================================================================

function scoreIndividual(
  position: PlayerPosition,
  stats: PlayerRawStats
): number {
  let raw = 0;
  const ratingBonus = Math.max(0, stats.rating - 6.0);

  switch (position) {
    case 'Attacker':
      raw = (stats.goals * 3.0) + (stats.assists * 2.0) + (ratingBonus * 12);
      break;
    case 'Midfielder':
      raw = (stats.goals * 4.0) + (stats.assists * 3.0) + (ratingBonus * 15);
      break;
    case 'Defender':
      raw = (stats.goals * 6.0) + (stats.assists * 4.0) + (ratingBonus * 22);
      break;
    case 'Goalkeeper':
      raw = (stats.cleanSheets * 4.0) + (ratingBonus * 28);
      break;
  }

  return Math.min(100, raw);
}

// ============================================================================
// Club Success (30%) — the decisive factor
// ============================================================================

function getClStageBonus(clStage?: string): number {
  if (!clStage) return 0;

  const bonuses: Record<string, number> = {
    winner: 100,
    finalist: 70,
    semi: 50,
    quarter: 35,
    r16: 20,
    group: 10,
  };

  return bonuses[clStage] ?? 0;
}

function scoreClubSuccess(
  leaguePosition: number | null,
  clStage?: string
): number {
  // League score: 1st = 100, 2nd = 95, etc.
  const leagueScore = leaguePosition
    ? Math.max(0, (21 - leaguePosition) * 5)
    : 0;

  const trophyBonus = getClStageBonus(clStage);

  // Domestic league: weighted 40%, CL/trophies: weighted 60%
  return (leagueScore * 0.4) + (Math.min(100, trophyBonus) * 0.6);
}

// ============================================================================
// National Team (20%)
// ============================================================================

function scoreNationalTeam(player: TrackedPlayer): number {
  const ntGoals = player.ntGoals ?? 0;
  const ntAssists = player.ntAssists ?? 0;
  const ntAppearances = player.ntAppearances ?? 0;

  const ntScore = (ntGoals * 5) + (ntAssists * 3) + (ntAppearances * 2);

  // No AFCON/WCQ bonuses for now (can be added when tournament data is known)
  return Math.min(100, ntScore);
}

// ============================================================================
// Consistency (15%)
// ============================================================================

function scoreConsistency(
  minutesPlayed: number,
  leagueMatchdaysPlayed: number
): number {
  const maxMinutes = (leagueMatchdaysPlayed || ESTIMATED_LEAGUE_MATCHDAYS) * 90;
  const minutesRatio = maxMinutes > 0 ? minutesPlayed / maxMinutes : 0;
  return Math.min(100, minutesRatio * 100);
}

// ============================================================================
// Key Stat Selection (for display in widget)
// ============================================================================

function getKeyStat(
  position: PlayerPosition,
  stats: PlayerRawStats
): { label: string; value: string } {
  switch (position) {
    case 'Attacker':
      return { label: 'goals', value: String(stats.goals) };
    case 'Midfielder':
      if (stats.goals >= stats.assists) {
        return { label: 'goals', value: String(stats.goals) };
      }
      return { label: 'assists', value: String(stats.assists) };
    case 'Defender':
      return { label: 'rating', value: stats.rating.toFixed(1) };
    case 'Goalkeeper':
      return { label: 'cleanSheets', value: String(stats.cleanSheets) };
  }
}

// ============================================================================
// Main Scoring Function
// ============================================================================

export function computeScore(
  player: TrackedPlayer,
  stats: PlayerRawStats,
  photo: string,
  teamLogo: string,
  leagueName: string
): ScoredPlayer {
  const individual = scoreIndividual(player.position, stats);
  const clubSuccess = scoreClubSuccess(stats.leaguePosition, player.clStage);
  const nationalTeam = scoreNationalTeam(player);
  const consistency = scoreConsistency(stats.minutesPlayed, stats.leagueMatchdaysPlayed);

  const total =
    individual * 0.35 +
    clubSuccess * 0.30 +
    nationalTeam * 0.20 +
    consistency * 0.15;

  return {
    player,
    stats,
    photo,
    teamLogo,
    leagueName,
    scores: {
      individual: Math.round(individual * 100) / 100,
      clubSuccess: Math.round(clubSuccess * 100) / 100,
      nationalTeam: Math.round(nationalTeam * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      total: Math.round(total * 100) / 100,
    },
    keyStat: getKeyStat(player.position, stats),
  };
}

/**
 * Rank an array of scored players by total score descending
 */
export function rankPlayers(players: ScoredPlayer[]): ScoredPlayer[] {
  return [...players].sort((a, b) => b.scores.total - a.scores.total);
}

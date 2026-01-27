/**
 * MySQL read/write layer for Ballon d'Or rankings
 *
 * Uses the same MySQL connection pool as the visits system (mysql-db.ts).
 * Data is written weekly by the cron job and read by the sidebar widget.
 */

import mysql from 'mysql2/promise';
import { unstable_cache } from 'next/cache';
import { getPool } from './mysql-db';

export interface BallonDorRanking {
  id: number;
  player_api_id: number;
  player_name: string;
  player_photo: string | null;
  nationality: string;
  country_code: string;
  position: string;
  team_name: string | null;
  team_logo: string | null;
  league_name: string | null;
  goals: number;
  assists: number;
  appearances: number;
  minutes_played: number;
  clean_sheets: number;
  player_rating: number | null;
  league_position: number | null;
  cl_stage: string | null;
  nt_goals: number;
  nt_assists: number;
  nt_appearances: number;
  total_score: number;
  score_individual: number;
  score_club_success: number;
  score_national_team: number;
  score_consistency: number;
  rank_position: number;
  key_stat_label: string | null;
  key_stat_value: string | null;
  season: string;
  computed_at: Date;
  updated_at: Date;
}

/**
 * Save rankings to MySQL (called by cron job)
 * Replaces all existing rows for the current season with fresh data.
 */
export async function saveRankings(
  rankings: Array<{
    playerApiId: number;
    playerName: string;
    playerPhoto: string | null;
    nationality: string;
    countryCode: string;
    position: string;
    teamName: string | null;
    teamLogo: string | null;
    leagueName: string | null;
    goals: number;
    assists: number;
    appearances: number;
    minutesPlayed: number;
    cleanSheets: number;
    playerRating: number | null;
    leaguePosition: number | null;
    clStage: string | null;
    ntGoals: number;
    ntAssists: number;
    ntAppearances: number;
    totalScore: number;
    scoreIndividual: number;
    scoreClubSuccess: number;
    scoreNationalTeam: number;
    scoreConsistency: number;
    rankPosition: number;
    keyStatLabel: string | null;
    keyStatValue: string | null;
    season: string;
  }>
): Promise<boolean> {
  const db = getPool();
  if (!db) {
    console.error('[BallonDor DB] No MySQL connection pool');
    return false;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Delete existing rankings for the season
    const season = rankings[0]?.season || '2024-2025';
    await connection.query(
      'DELETE FROM wp_afriquesports_ballon_dor WHERE season = ?',
      [season]
    );

    // Insert new rankings
    for (const r of rankings) {
      await connection.query(
        `INSERT INTO wp_afriquesports_ballon_dor (
          player_api_id, player_name, player_photo, nationality, country_code,
          position, team_name, team_logo, league_name,
          goals, assists, appearances, minutes_played, clean_sheets,
          player_rating, league_position, cl_stage,
          nt_goals, nt_assists, nt_appearances,
          total_score, score_individual, score_club_success, score_national_team, score_consistency,
          rank_position, key_stat_label, key_stat_value, season
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.playerApiId, r.playerName, r.playerPhoto, r.nationality, r.countryCode,
          r.position, r.teamName, r.teamLogo, r.leagueName,
          r.goals, r.assists, r.appearances, r.minutesPlayed, r.cleanSheets,
          r.playerRating, r.leaguePosition, r.clStage,
          r.ntGoals, r.ntAssists, r.ntAppearances,
          r.totalScore, r.scoreIndividual, r.scoreClubSuccess, r.scoreNationalTeam, r.scoreConsistency,
          r.rankPosition, r.keyStatLabel, r.keyStatValue, r.season,
        ]
      );
    }

    await connection.commit();
    console.log(`[BallonDor DB] Saved ${rankings.length} rankings for season ${season}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('[BallonDor DB] Error saving rankings:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Internal: fetch top N rankings from MySQL
 */
async function _getTopRankings(limit: number = 5): Promise<BallonDorRanking[]> {
  const db = getPool();
  if (!db) {
    console.log('[BallonDor DB] No MySQL connection');
    return [];
  }

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_afriquesports_ballon_dor
       ORDER BY rank_position ASC
       LIMIT ?`,
      [limit]
    );

    return rows as unknown as BallonDorRanking[];
  } catch (error) {
    console.error('[BallonDor DB] Error fetching rankings:', error);
    return [];
  }
}

/**
 * Cached version: revalidates every hour
 * Used by the sidebar widget for fast reads.
 */
export const getTopRankings = unstable_cache(
  async (limit: number = 5) => {
    return await _getTopRankings(limit);
  },
  ['ballon-dor-rankings'],
  {
    revalidate: 3600, // 1 hour
    tags: ['ballon-dor'],
  }
);

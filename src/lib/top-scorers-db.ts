/**
 * MySQL read/write layer for Top African Scorers
 *
 * Data is written daily by the cron job and read by the sidebar widget.
 * Uses the same MySQL connection pool as other systems (mysql-db.ts).
 */

import mysql from 'mysql2/promise';
import { unstable_cache } from 'next/cache';
import { getPool } from './mysql-db';

export interface TopScorerRow {
  id: number;
  player_api_id: number;
  player_name: string;
  player_photo: string | null;
  nationality: string;
  country_code: string;
  position: string;
  team_name: string;
  team_logo: string | null;
  league_name: string | null;
  club_goals: number;
  club_assists: number;
  club_appearances: number;
  nt_goals: number;
  nt_assists: number;
  total_goals: number;
  total_assists: number;
  rank_position: number;
  season: string;
  updated_at: Date;
}

export interface TopScorerInput {
  playerApiId: number;
  playerName: string;
  playerPhoto: string | null;
  nationality: string;
  countryCode: string;
  position: string;
  teamName: string;
  teamLogo: string | null;
  leagueName: string | null;
  clubGoals: number;
  clubAssists: number;
  clubAppearances: number;
  ntGoals: number;
  ntAssists: number;
  totalGoals: number;
  totalAssists: number;
  rankPosition: number;
  season: string;
}

/**
 * Ensure the table exists (auto-create on first use)
 */
async function ensureTable(connection: mysql.PoolConnection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS wp_afriquesports_top_scorers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      player_api_id INT NOT NULL,
      player_name VARCHAR(255) NOT NULL,
      player_photo VARCHAR(512),
      nationality VARCHAR(100) NOT NULL,
      country_code VARCHAR(10) NOT NULL,
      position VARCHAR(50) NOT NULL,
      team_name VARCHAR(255) NOT NULL,
      team_logo VARCHAR(512),
      league_name VARCHAR(255),
      club_goals INT DEFAULT 0,
      club_assists INT DEFAULT 0,
      club_appearances INT DEFAULT 0,
      nt_goals INT DEFAULT 0,
      nt_assists INT DEFAULT 0,
      total_goals INT DEFAULT 0,
      total_assists INT DEFAULT 0,
      rank_position INT NOT NULL,
      season VARCHAR(20) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_season (season),
      INDEX idx_rank (rank_position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

/**
 * Save top scorers to MySQL (called by daily cron job)
 * Replaces all existing rows for the current season.
 */
export async function saveTopScorers(scorers: TopScorerInput[]): Promise<boolean> {
  const db = getPool();
  if (!db) {
    console.error('[TopScorers DB] No MySQL connection pool');
    return false;
  }

  const connection = await db.getConnection();

  try {
    await ensureTable(connection);
    await connection.beginTransaction();

    // Delete existing data for the season
    const season = scorers[0]?.season || '2024-2025';
    await connection.query(
      'DELETE FROM wp_afriquesports_top_scorers WHERE season = ?',
      [season]
    );

    // Insert new data
    for (const s of scorers) {
      await connection.query(
        `INSERT INTO wp_afriquesports_top_scorers (
          player_api_id, player_name, player_photo, nationality, country_code,
          position, team_name, team_logo, league_name,
          club_goals, club_assists, club_appearances,
          nt_goals, nt_assists, total_goals, total_assists,
          rank_position, season
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.playerApiId, s.playerName, s.playerPhoto, s.nationality, s.countryCode,
          s.position, s.teamName, s.teamLogo, s.leagueName,
          s.clubGoals, s.clubAssists, s.clubAppearances,
          s.ntGoals, s.ntAssists, s.totalGoals, s.totalAssists,
          s.rankPosition, s.season,
        ]
      );
    }

    await connection.commit();
    console.log(`[TopScorers DB] Saved ${scorers.length} scorers for season ${season}`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('[TopScorers DB] Error saving scorers:', error);
    return false;
  } finally {
    connection.release();
  }
}

/**
 * Internal: fetch top N scorers from MySQL
 */
async function _getTopScorers(limit: number = 10): Promise<TopScorerRow[]> {
  const db = getPool();
  if (!db) {
    console.log('[TopScorers DB] No MySQL connection');
    return [];
  }

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_afriquesports_top_scorers
       ORDER BY rank_position ASC
       LIMIT ?`,
      [limit]
    );

    return rows as unknown as TopScorerRow[];
  } catch (error) {
    console.error('[TopScorers DB] Error fetching scorers:', error);
    return [];
  }
}

/**
 * Cached version: revalidates every hour
 * Used by the sidebar widget for fast reads.
 */
export const getTopScorers = unstable_cache(
  async (limit: number = 10) => {
    return await _getTopScorers(limit);
  },
  ['top-african-scorers'],
  {
    revalidate: 3600, // 1 hour
    tags: ['top-scorers'],
  }
);

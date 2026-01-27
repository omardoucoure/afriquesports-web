import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

// Get MySQL connection pool
function getPool(): mysql.Pool | null {
  if (pool) return pool;

  const config = {
    host: process.env.WORDPRESS_DB_HOST || 'localhost',
    user: process.env.WORDPRESS_DB_USER,
    password: process.env.WORDPRESS_DB_PASSWORD,
    database: process.env.WORDPRESS_DB_NAME || 'wordpress',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (!config.user || !config.password) {
    console.error('[MySQL Match DB] Missing WORDPRESS_DB_USER or WORDPRESS_DB_PASSWORD');
    return null;
  }

  try {
    pool = mysql.createPool(config);
    console.log('[MySQL Match DB] Connection pool created successfully');
    return pool;
  } catch (error) {
    console.error('[MySQL Match DB] Failed to create connection pool:', error);
    return null;
  }
}

// ============================================================================
// MATCH COMMENTARY
// ============================================================================

export interface MatchCommentary {
  id?: number;
  match_id: string;
  event_id: string;
  competition?: string;
  time: string;
  time_seconds: number;
  locale: string;
  text: string;
  type: string;
  team?: string;
  player_name?: string;
  player_image?: string;
  icon?: string;
  is_scoring?: boolean;
  confidence?: number;
  created_at?: Date;
}

export async function insertMatchCommentary(data: MatchCommentary): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `INSERT IGNORE INTO wp_match_commentary
        (match_id, event_id, competition, time, time_seconds, locale, text, type, team, player_name, player_image, icon, is_scoring, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.match_id,
        data.event_id,
        data.competition || 'CAN',
        data.time,
        data.time_seconds,
        data.locale,
        data.text,
        data.type,
        data.team,
        data.player_name,
        data.player_image,
        data.icon,
        data.is_scoring || false,
        data.confidence || 1.0,
      ]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error inserting match commentary:', error);
    return false;
  }
}

export async function getMatchCommentary(match_id: string, locale: string = 'fr'): Promise<MatchCommentary[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_commentary
       WHERE match_id = ? AND locale = ?
       ORDER BY time_seconds DESC, id DESC`,
      [match_id, locale]
    );
    return rows as MatchCommentary[];
  } catch (error) {
    console.error('[MySQL] Error fetching match commentary:', error);
    return [];
  }
}

// ============================================================================
// PRE-MATCH ANALYSIS
// ============================================================================

export interface PreMatchAnalysis {
  id?: number;
  match_id: string;
  competition?: string;
  locale: string;
  home_team: string;
  away_team: string;
  head_to_head?: string;
  recent_form?: string;
  key_players?: any;
  tactical_preview?: string;
  prediction?: string;
  home_formation?: string;
  away_formation?: string;
  home_lineup?: any;
  away_lineup?: any;
  home_substitutes?: any;
  away_substitutes?: any;
  confidence_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertPreMatchAnalysis(data: PreMatchAnalysis): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `INSERT INTO wp_match_prematch_analysis
        (match_id, competition, locale, home_team, away_team, head_to_head, recent_form, key_players, tactical_preview, prediction, home_formation, away_formation, home_lineup, away_lineup, home_substitutes, away_substitutes, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        head_to_head = VALUES(head_to_head),
        recent_form = VALUES(recent_form),
        key_players = VALUES(key_players),
        tactical_preview = VALUES(tactical_preview),
        prediction = VALUES(prediction),
        home_formation = VALUES(home_formation),
        away_formation = VALUES(away_formation),
        home_lineup = VALUES(home_lineup),
        away_lineup = VALUES(away_lineup),
        home_substitutes = VALUES(home_substitutes),
        away_substitutes = VALUES(away_substitutes),
        confidence_score = VALUES(confidence_score),
        updated_at = CURRENT_TIMESTAMP`,
      [
        data.match_id,
        data.competition || 'CAN',
        data.locale,
        data.home_team,
        data.away_team,
        data.head_to_head,
        data.recent_form,
        data.key_players ? JSON.stringify(data.key_players) : null,
        data.tactical_preview,
        data.prediction,
        data.home_formation,
        data.away_formation,
        data.home_lineup ? JSON.stringify(data.home_lineup) : null,
        data.away_lineup ? JSON.stringify(data.away_lineup) : null,
        data.home_substitutes ? JSON.stringify(data.home_substitutes) : null,
        data.away_substitutes ? JSON.stringify(data.away_substitutes) : null,
        data.confidence_score,
      ]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error upserting pre-match analysis:', error);
    return false;
  }
}

export async function getPreMatchAnalysis(match_id: string, locale: string = 'fr'): Promise<PreMatchAnalysis | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_prematch_analysis
       WHERE match_id = ? AND locale = ?`,
      [match_id, locale]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      key_players: row.key_players ? JSON.parse(row.key_players) : null,
      home_lineup: row.home_lineup ? JSON.parse(row.home_lineup) : null,
      away_lineup: row.away_lineup ? JSON.parse(row.away_lineup) : null,
      home_substitutes: row.home_substitutes ? JSON.parse(row.home_substitutes) : null,
      away_substitutes: row.away_substitutes ? JSON.parse(row.away_substitutes) : null,
    } as PreMatchAnalysis;
  } catch (error) {
    console.error('[MySQL] Error fetching pre-match analysis:', error);
    return null;
  }
}

// ============================================================================
// YOUTUBE STREAMS
// ============================================================================

export interface YouTubeStream {
  id?: number;
  match_id: string;
  competition?: string;
  youtube_url: string;
  video_id?: string;
  stream_title?: string;
  is_live?: boolean;
  viewer_count?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertYouTubeStream(data: YouTubeStream): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `INSERT INTO wp_match_youtube_streams
        (match_id, competition, youtube_url, video_id, stream_title, is_live, viewer_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        youtube_url = VALUES(youtube_url),
        video_id = VALUES(video_id),
        stream_title = VALUES(stream_title),
        is_live = VALUES(is_live),
        viewer_count = VALUES(viewer_count),
        updated_at = CURRENT_TIMESTAMP`,
      [
        data.match_id,
        data.competition || 'CAN',
        data.youtube_url,
        data.video_id,
        data.stream_title,
        data.is_live !== undefined ? data.is_live : true,
        data.viewer_count || 0,
      ]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error upserting YouTube stream:', error);
    return false;
  }
}

export async function getYouTubeStream(match_id: string): Promise<YouTubeStream | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_youtube_streams WHERE match_id = ?`,
      [match_id]
    );
    return rows.length > 0 ? (rows[0] as YouTubeStream) : null;
  } catch (error) {
    console.error('[MySQL] Error fetching YouTube stream:', error);
    return null;
  }
}

export async function deleteYouTubeStream(match_id: string): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `DELETE FROM wp_match_youtube_streams WHERE match_id = ?`,
      [match_id]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error deleting YouTube stream:', error);
    return false;
  }
}

// ============================================================================
// MATCH STATES
// ============================================================================

export interface MatchState {
  match_id: string;
  competition?: string;
  status: 'scheduled' | 'live' | 'completed';
  home_team?: string;
  away_team?: string;
  home_score?: number;
  away_score?: number;
  last_indexed_at?: Date | null;
  last_checked_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertMatchState(data: MatchState, shouldIndex: boolean = false): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    const lastIndexedUpdate = shouldIndex ? 'last_indexed_at = CURRENT_TIMESTAMP,' : '';

    await db.query(
      `INSERT INTO wp_match_states
        (match_id, competition, status, home_team, away_team, home_score, away_score, last_checked_at${shouldIndex ? ', last_indexed_at' : ''})
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP${shouldIndex ? ', CURRENT_TIMESTAMP' : ''})
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        home_team = VALUES(home_team),
        away_team = VALUES(away_team),
        home_score = VALUES(home_score),
        away_score = VALUES(away_score),
        ${lastIndexedUpdate}
        last_checked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP`,
      [
        data.match_id,
        data.competition || 'CAN',
        data.status,
        data.home_team,
        data.away_team,
        data.home_score || 0,
        data.away_score || 0,
      ]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error upserting match state:', error);
    return false;
  }
}

export async function getMatchState(match_id: string): Promise<MatchState | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_states WHERE match_id = ?`,
      [match_id]
    );
    return rows.length > 0 ? (rows[0] as MatchState) : null;
  } catch (error) {
    console.error('[MySQL] Error fetching match state:', error);
    return null;
  }
}

export async function getMatchesByStatus(status: string): Promise<MatchState[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_states WHERE status = ? ORDER BY last_checked_at ASC`,
      [status]
    );
    return rows as MatchState[];
  } catch (error) {
    console.error('[MySQL] Error fetching matches by status:', error);
    return [];
  }
}

export async function getAllMatchStates(): Promise<MatchState[]> {
  const db = getPool();
  if (!db) return [];

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_states ORDER BY last_checked_at DESC`
    );
    return rows as MatchState[];
  } catch (error) {
    console.error('[MySQL] Error fetching all match states:', error);
    return [];
  }
}

// ============================================================================
// MATCH REPORTS
// ============================================================================

export interface MatchReport {
  id?: number;
  match_id: string;
  competition?: string;
  locale: string;
  title: string;
  summary: string;
  key_moments?: any;
  player_ratings?: any;
  statistics?: any;
  analysis?: string;
  published_to_wp?: boolean;
  wp_post_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

export async function upsertMatchReport(data: MatchReport): Promise<boolean> {
  const db = getPool();
  if (!db) return false;

  try {
    await db.query(
      `INSERT INTO wp_match_reports
        (match_id, competition, locale, title, summary, key_moments, player_ratings, statistics, analysis, published_to_wp, wp_post_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        summary = VALUES(summary),
        key_moments = VALUES(key_moments),
        player_ratings = VALUES(player_ratings),
        statistics = VALUES(statistics),
        analysis = VALUES(analysis),
        published_to_wp = VALUES(published_to_wp),
        wp_post_id = VALUES(wp_post_id),
        updated_at = CURRENT_TIMESTAMP`,
      [
        data.match_id,
        data.competition || 'CAN',
        data.locale,
        data.title,
        data.summary,
        data.key_moments ? JSON.stringify(data.key_moments) : null,
        data.player_ratings ? JSON.stringify(data.player_ratings) : null,
        data.statistics ? JSON.stringify(data.statistics) : null,
        data.analysis,
        data.published_to_wp || false,
        data.wp_post_id,
      ]
    );
    return true;
  } catch (error) {
    console.error('[MySQL] Error upserting match report:', error);
    return false;
  }
}

export async function getMatchReport(match_id: string, locale: string = 'fr'): Promise<MatchReport | null> {
  const db = getPool();
  if (!db) return null;

  try {
    const [rows] = await db.query<mysql.RowDataPacket[]>(
      `SELECT * FROM wp_match_reports
       WHERE match_id = ? AND locale = ?`,
      [match_id, locale]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      ...row,
      key_moments: row.key_moments ? JSON.parse(row.key_moments) : null,
      player_ratings: row.player_ratings ? JSON.parse(row.player_ratings) : null,
      statistics: row.statistics ? JSON.parse(row.statistics) : null,
    } as MatchReport;
  } catch (error) {
    console.error('[MySQL] Error fetching match report:', error);
    return null;
  }
}

// ============================================================================
// GET ALL COMMENTED MATCHES
// ============================================================================

export interface CommentedMatchSummary {
  match_id: string;
  has_commentary: boolean;
  has_prematch: boolean;
  commentary_count: number;
  first_commented: string;
  home_team?: string;
  away_team?: string;
  competition?: string;
}

export async function getAllCommentedMatches(): Promise<CommentedMatchSummary[]> {
  const db = getPool();
  if (!db) {
    console.error('[MySQL] getAllCommentedMatches: No database connection');
    return [];
  }

  try {
    const matchMap = new Map<string, CommentedMatchSummary>();

    // Get matches with commentary
    try {
      const [commentaryRows] = await db.query<mysql.RowDataPacket[]>(
        `SELECT
          match_id,
          COUNT(*) as commentary_count,
          MIN(created_at) as first_commented
        FROM wp_match_commentary
        GROUP BY match_id`
      );

      console.log(`[MySQL] Found ${commentaryRows.length} matches with commentary`);

      for (const row of commentaryRows) {
        matchMap.set(row.match_id, {
          match_id: row.match_id,
          has_commentary: true,
          has_prematch: false,
          commentary_count: row.commentary_count,
          first_commented: row.first_commented,
        });
      }
    } catch (commentaryError) {
      console.error('[MySQL] Error querying commentary:', commentaryError);
    }

    // Get matches with pre-match analysis
    try {
      const [prematchRows] = await db.query<mysql.RowDataPacket[]>(
        `SELECT * FROM wp_match_prematch_analysis ORDER BY created_at DESC`
      );

      console.log(`[MySQL] Found ${prematchRows.length} pre-match rows`);

      // Group by match_id and use earliest created_at
      const prematchByMatch = new Map<string, { created_at: Date; home_team: string; away_team: string; competition: string }>();
      for (const row of prematchRows) {
        const existing = prematchByMatch.get(row.match_id);
        const rowDate = new Date(row.created_at);

        if (!existing || rowDate < existing.created_at) {
          prematchByMatch.set(row.match_id, {
            created_at: rowDate,
            home_team: row.home_team,
            away_team: row.away_team,
            competition: row.competition || 'CAN'
          });
        }
      }

      console.log(`[MySQL] Found ${prematchByMatch.size} unique matches with pre-match`);

      // Add to match map
      for (const [match_id, data] of prematchByMatch.entries()) {
        const existing = matchMap.get(match_id);
        if (existing) {
          existing.has_prematch = true;
          existing.home_team = data.home_team;
          existing.away_team = data.away_team;
          existing.competition = data.competition;
          // Use earlier date
          if (data.created_at < new Date(existing.first_commented)) {
            existing.first_commented = data.created_at.toISOString();
          }
        } else {
          matchMap.set(match_id, {
            match_id,
            has_commentary: false,
            has_prematch: true,
            commentary_count: 0,
            first_commented: data.created_at.toISOString(),
            home_team: data.home_team,
            away_team: data.away_team,
            competition: data.competition
          });
        }
      }
    } catch (prematchError) {
      console.error('[MySQL] Error querying pre-match:', prematchError);
    }

    const results = Array.from(matchMap.values());
    console.log(`[MySQL] getAllCommentedMatches returning ${results.length} total matches`);
    return results;
  } catch (error) {
    console.error('[MySQL] Error in getAllCommentedMatches:', error);
    return [];
  }
}

// Close pool (for graceful shutdown)
export async function closeMatchPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[MySQL Match DB] Connection pool closed');
  }
}

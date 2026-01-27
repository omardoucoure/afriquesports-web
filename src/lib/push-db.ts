/**
 * Push subscriptions database layer
 *
 * Uses the WordPress MySQL database (same as mysql-db.ts) for storing
 * Web Push subscriptions and notification history.
 */

import mysql from "mysql2/promise";
import { getPool } from "./mysql-db";

// Table names
const SUBSCRIPTIONS_TABLE = "as_push_subscriptions";
const NOTIFICATIONS_TABLE = "as_push_notifications";

// Track whether tables have been initialized
let tablesInitialized = false;

export interface PushSubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  language: string;
  country: string | null;
  topics: string[];
  source: string;
  created_at: number;
  last_used_at: number;
  is_active: boolean;
}

export interface NotificationHistoryEntry {
  id: number;
  notification_id: string | null;
  title: string;
  body: string;
  image_url: string | null;
  target_url: string | null;
  topic: string | null;
  sent_count: number;
  success_count: number;
  failure_count: number;
  receive_count: number;
  click_count: number;
  created_at: number;
}

/**
 * Ensure tables exist (runs once per process)
 */
async function ensureTables(): Promise<mysql.Pool | null> {
  const db = getPool();
  if (!db) {
    console.error("[push-db] No MySQL connection pool available");
    return null;
  }

  if (tablesInitialized) return db;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${SUBSCRIPTIONS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(500) NOT NULL UNIQUE,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(100) NOT NULL,
        user_agent TEXT,
        language VARCHAR(10) DEFAULT 'fr',
        country VARCHAR(5) DEFAULT NULL,
        topics JSON,
        source VARCHAR(50) DEFAULT 'web',
        created_at BIGINT NOT NULL,
        last_used_at BIGINT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        INDEX idx_endpoint (endpoint(255)),
        INDEX idx_active (is_active),
        INDEX idx_language (language),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${NOTIFICATIONS_TABLE} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        notification_id VARCHAR(100) UNIQUE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        image_url VARCHAR(500),
        target_url VARCHAR(500),
        topic VARCHAR(100),
        sent_count INT DEFAULT 0,
        success_count INT DEFAULT 0,
        failure_count INT DEFAULT 0,
        receive_count INT DEFAULT 0,
        click_count INT DEFAULT 0,
        created_at BIGINT DEFAULT (UNIX_TIMESTAMP() * 1000),
        INDEX idx_notification_id (notification_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    tablesInitialized = true;
    console.log("[push-db] Tables initialized");
  } catch (error) {
    console.error("[push-db] Error initializing tables:", error);
  }

  return db;
}

/**
 * Save or update a Web Push subscription
 */
export async function saveSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string,
  language?: string,
  topics?: string[],
  country?: string,
  source?: string
): Promise<boolean> {
  const db = await ensureTables();
  if (!db) return false;

  const now = Date.now();

  try {
    await db.execute(
      `INSERT INTO ${SUBSCRIPTIONS_TABLE} (endpoint, p256dh, auth, user_agent, language, country, topics, source, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         user_agent = VALUES(user_agent),
         language = VALUES(language),
         country = COALESCE(VALUES(country), country),
         topics = VALUES(topics),
         last_used_at = VALUES(last_used_at),
         is_active = 1`,
      [
        endpoint,
        p256dh,
        auth,
        userAgent || null,
        language || "fr",
        country || null,
        JSON.stringify(topics || []),
        source || "web",
        now,
        now,
      ]
    );
    return true;
  } catch (error) {
    console.error("[push-db] Error saving subscription:", error);
    return false;
  }
}

/**
 * Mark subscription as inactive by endpoint
 */
export async function removeSubscription(endpoint: string): Promise<boolean> {
  const db = await ensureTables();
  if (!db) return false;

  try {
    await db.execute(
      `UPDATE ${SUBSCRIPTIONS_TABLE} SET is_active = 0 WHERE endpoint = ?`,
      [endpoint]
    );
    return true;
  } catch (error) {
    console.error("[push-db] Error removing subscription:", error);
    return false;
  }
}

/**
 * Permanently delete invalid subscriptions by endpoint
 */
export async function deleteInvalidSubscriptions(
  endpoints: string[]
): Promise<number> {
  if (endpoints.length === 0) return 0;

  const db = await ensureTables();
  if (!db) return 0;

  try {
    const placeholders = endpoints.map(() => "?").join(",");
    const [result] = await db.execute(
      `DELETE FROM ${SUBSCRIPTIONS_TABLE} WHERE endpoint IN (${placeholders})`,
      endpoints
    );
    return (result as mysql.ResultSetHeader).affectedRows;
  } catch (error) {
    console.error("[push-db] Error deleting invalid subscriptions:", error);
    return 0;
  }
}

/**
 * Get all active Web Push subscriptions
 */
export async function getAllActiveSubscriptions(): Promise<
  Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>
> {
  const db = await ensureTables();
  if (!db) return [];

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT endpoint, p256dh, auth FROM ${SUBSCRIPTIONS_TABLE} WHERE is_active = 1`
    );
    return rows.map((r) => ({
      endpoint: r.endpoint,
      keys: { p256dh: r.p256dh, auth: r.auth },
    }));
  } catch (error) {
    console.error("[push-db] Error getting active subscriptions:", error);
    return [];
  }
}

/**
 * Get subscriptions filtered by language
 */
export async function getSubscriptionsByLanguage(
  language: string
): Promise<Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>> {
  const db = await ensureTables();
  if (!db) return [];

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT endpoint, p256dh, auth FROM ${SUBSCRIPTIONS_TABLE} WHERE is_active = 1 AND language = ?`,
      [language]
    );
    return rows.map((r) => ({
      endpoint: r.endpoint,
      keys: { p256dh: r.p256dh, auth: r.auth },
    }));
  } catch (error) {
    console.error("[push-db] Error getting subscriptions by language:", error);
    return [];
  }
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<{
  total: number;
  active: number;
  byLanguage: Record<string, number>;
  bySource: Record<string, number>;
  todayNew: number;
}> {
  const db = await ensureTables();
  if (!db) return { total: 0, active: 0, byLanguage: {}, bySource: {}, todayNew: 0 };

  try {
    const [totalRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${SUBSCRIPTIONS_TABLE}`
    );
    const [activeRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${SUBSCRIPTIONS_TABLE} WHERE is_active = 1`
    );
    const [langRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT language, COUNT(*) as count FROM ${SUBSCRIPTIONS_TABLE} WHERE is_active = 1 GROUP BY language`
    );
    const [sourceRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT source, COUNT(*) as count FROM ${SUBSCRIPTIONS_TABLE} WHERE is_active = 1 GROUP BY source`
    );

    // Today's new subscriptions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [todayRows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM ${SUBSCRIPTIONS_TABLE} WHERE created_at >= ?`,
      [todayStart.getTime()]
    );

    const byLanguage: Record<string, number> = {};
    for (const row of langRows) {
      byLanguage[row.language || "unknown"] = row.count;
    }

    const bySource: Record<string, number> = {};
    for (const row of sourceRows) {
      bySource[row.source || "unknown"] = row.count;
    }

    return {
      total: totalRows[0].count,
      active: activeRows[0].count,
      byLanguage,
      bySource,
      todayNew: todayRows[0].count,
    };
  } catch (error) {
    console.error("[push-db] Error getting stats:", error);
    return { total: 0, active: 0, byLanguage: {}, bySource: {}, todayNew: 0 };
  }
}

/**
 * Save notification to history
 */
export async function saveNotificationHistory(
  title: string,
  body: string,
  sentCount: number,
  successCount: number,
  failureCount: number,
  imageUrl?: string,
  targetUrl?: string,
  topic?: string,
  notificationId?: string
): Promise<{ id: number; notificationId: string }> {
  const db = await ensureTables();
  if (!db) return { id: 0, notificationId: "" };

  const finalNotificationId =
    notificationId ||
    `push_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = Date.now();

  try {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `INSERT INTO ${NOTIFICATIONS_TABLE} (notification_id, title, body, image_url, target_url, topic, sent_count, success_count, failure_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        finalNotificationId,
        title,
        body,
        imageUrl || null,
        targetUrl || null,
        topic || null,
        sentCount,
        successCount,
        failureCount,
        now,
      ]
    );
    return { id: result.insertId, notificationId: finalNotificationId };
  } catch (error) {
    console.error("[push-db] Error saving notification history:", error);
    return { id: 0, notificationId: "" };
  }
}

/**
 * Track notification receive event
 */
export async function trackNotificationReceive(
  notificationId: string
): Promise<boolean> {
  const db = await ensureTables();
  if (!db) return false;

  try {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `UPDATE ${NOTIFICATIONS_TABLE} SET receive_count = receive_count + 1 WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("[push-db] Error tracking receive:", error);
    return false;
  }
}

/**
 * Track notification click event
 */
export async function trackNotificationClick(
  notificationId: string
): Promise<boolean> {
  const db = await ensureTables();
  if (!db) return false;

  try {
    const [result] = await db.execute<mysql.ResultSetHeader>(
      `UPDATE ${NOTIFICATIONS_TABLE} SET click_count = click_count + 1 WHERE notification_id = ?`,
      [notificationId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("[push-db] Error tracking click:", error);
    return false;
  }
}

/**
 * Get notification history with pagination
 */
export async function getNotificationHistory(
  limit = 50,
  offset = 0
): Promise<NotificationHistoryEntry[]> {
  const db = await ensureTables();
  if (!db) return [];

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM ${NOTIFICATIONS_TABLE} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows as NotificationHistoryEntry[];
  } catch (error) {
    console.error("[push-db] Error getting notification history:", error);
    return [];
  }
}

/**
 * Get recent subscriptions for dashboard display
 */
export async function getRecentSubscriptions(
  limit = 20
): Promise<PushSubscriptionRow[]> {
  const db = await ensureTables();
  if (!db) return [];

  try {
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT * FROM ${SUBSCRIPTIONS_TABLE} ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );

    return rows.map((row) => ({
      id: row.id,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      user_agent: row.user_agent,
      language: row.language,
      country: row.country,
      topics:
        typeof row.topics === "string"
          ? JSON.parse(row.topics)
          : row.topics || [],
      source: row.source || "web",
      created_at: row.created_at,
      last_used_at: row.last_used_at,
      is_active: Boolean(row.is_active),
    }));
  } catch (error) {
    console.error("[push-db] Error getting recent subscriptions:", error);
    return [];
  }
}

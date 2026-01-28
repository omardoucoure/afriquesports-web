import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "success";
  message: string;
  source?: string;
}

// PM2 log file paths
const LOG_DIR = "/mnt/volume_nyc1_01/logs/nextjs";
const OUT_LOG = path.join(LOG_DIR, "afriquesports-web-out.log");
const ERROR_LOG = path.join(LOG_DIR, "afriquesports-web-error.log");

// Parse log level from message content
function detectLogLevel(message: string): LogEntry["level"] {
  const lower = message.toLowerCase();
  if (lower.includes("error") || lower.includes("failed") || lower.includes("exception")) {
    return "error";
  }
  if (lower.includes("warn") || lower.includes("warning") || lower.includes("slow")) {
    return "warn";
  }
  if (lower.includes("success") || lower.includes("✓") || lower.includes("completed")) {
    return "success";
  }
  if (lower.includes("debug") || lower.includes("[debug]")) {
    return "debug";
  }
  return "info";
}

// Parse source from log message
function detectSource(message: string): string {
  // Match patterns like [Push], [MySQL], [ESPN API], etc.
  const match = message.match(/\[([^\]]+)\]/);
  if (match) {
    return match[1].toLowerCase().replace(/\s+/g, "-");
  }

  // Detect by content
  if (message.includes("MySQL") || message.includes("query")) return "mysql";
  if (message.includes("push") || message.includes("notification")) return "push";
  if (message.includes("ESPN") || message.includes("AFCON")) return "espn-api";
  if (message.includes("sitemap")) return "sitemap";
  if (message.includes("revalidat")) return "cache";
  if (message.includes("translation") || message.includes("webhook")) return "webhook";

  return "server";
}

// Parse PM2 log line format: "ID|name | message"
function parseLogLine(line: string, id: number, isError: boolean): LogEntry | null {
  if (!line.trim()) return null;

  // PM2 format: "11|afrique | actual message"
  const pm2Match = line.match(/^\d+\|[^|]+\|\s*(.+)$/);
  const message = pm2Match ? pm2Match[1].trim() : line.trim();

  if (!message || message.length < 3) return null;

  // Skip noisy logs
  if (message.includes("at ignore-listed frames")) return null;
  if (message.startsWith("at ")) return null;

  return {
    id,
    timestamp: new Date().toISOString(), // PM2 logs don't have timestamps, use current
    level: isError ? "error" : detectLogLevel(message),
    message,
    source: detectSource(message),
  };
}

// Read last N lines from a file
async function readLastLines(filePath: string, maxLines: number): Promise<string[]> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    return lines.slice(-maxLines);
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") || "";
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    // Read both log files
    const [outLines, errorLines] = await Promise.all([
      readLastLines(OUT_LOG, 500),
      readLastLines(ERROR_LOG, 200),
    ]);

    // Parse log entries
    let logs: LogEntry[] = [];
    let idCounter = 1;

    // Add error logs first (they're usually more important)
    for (const line of errorLines.reverse()) {
      const entry = parseLogLine(line, idCounter++, true);
      if (entry) logs.push(entry);
    }

    // Add output logs
    for (const line of outLines.reverse()) {
      const entry = parseLogLine(line, idCounter++, false);
      if (entry) logs.push(entry);
    }

    // Remove duplicates by message
    const seen = new Set<string>();
    logs = logs.filter((log) => {
      if (seen.has(log.message)) return false;
      seen.add(log.message);
      return true;
    });

    // Apply filters
    if (level && level !== "all") {
      logs = logs.filter((log) => log.level === level);
    }

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter((log) => log.message.toLowerCase().includes(q));
    }

    // Limit results
    const totalCount = logs.length;
    logs = logs.slice(0, limit);

    return NextResponse.json({
      logs,
      totalCount,
      hasMore: totalCount > limit,
    });
  } catch (error) {
    console.error("Logs API error:", error);
    return NextResponse.json(
      { logs: [], totalCount: 0, hasMore: false, error: String(error) },
      { status: 500 }
    );
  }
}

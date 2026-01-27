"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Search,
  ChevronDown,
  RefreshCw,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug" | "success";
  message: string;
  meta?: Record<string, any>;
  source?: string;
}

interface LogsData {
  logs: LogEntry[];
  totalCount: number;
  hasMore: boolean;
}

const LOG_LEVELS = [
  { value: "all", label: "All Levels", icon: Info },
  { value: "info", label: "Info", icon: Info },
  { value: "warn", label: "Warning", icon: AlertTriangle },
  { value: "error", label: "Error", icon: XCircle },
  { value: "success", label: "Success", icon: CheckCircle },
  { value: "debug", label: "Debug", icon: AlertCircle },
];

function LogLevelBadge({ level }: { level: string }) {
  const icons = {
    info: Info,
    warn: AlertTriangle,
    error: XCircle,
    debug: AlertCircle,
    success: CheckCircle,
  };

  const Icon = icons[level as keyof typeof icons] || Info;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        level === "info" && "bg-blue-500/10 text-blue-400",
        level === "warn" && "bg-yellow-500/10 text-yellow-400",
        level === "error" && "bg-red-500/10 text-red-400",
        level === "debug" && "bg-purple-500/10 text-purple-400",
        level === "success" && "bg-green-500/10 text-green-400"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {level.toUpperCase()}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-lg border border-gray-800 p-4 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="h-6 w-20 bg-gray-800 rounded"></div>
              <div className="flex-1">
                <div className="h-5 w-3/4 bg-gray-800 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogsPage() {
  const [data, setData] = useState<LogsData>({ logs: [], totalCount: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const fetchLogs = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "50",
        level: levelFilter === "all" ? "" : levelFilter,
        search: searchQuery,
      });

      const response = await fetch(`/api/dashboard/logs?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, levelFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchLogs(1);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        level: levelFilter === "all" ? "" : levelFilter,
        search: searchQuery,
        export: "true",
      });

      const response = await fetch(`/api/dashboard/logs?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const filteredLogs = useMemo(() => {
    return data.logs;
  }, [data.logs]);

  if (loading && data.logs.length === 0) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to load logs</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => fetchLogs(page)}
            className="px-6 py-3 bg-[#9DFF20] text-black rounded-lg font-medium hover:bg-[#b4ff50] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Application Logs</h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.totalCount.toLocaleString()} total log entries
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9DFF20] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-3 bg-[#9DFF20] text-black rounded-lg font-medium hover:bg-[#b4ff50] transition-colors whitespace-nowrap"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span>Filters</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")}
            />
          </button>
        </div>

        {showFilters && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <p className="text-sm font-medium text-gray-300 mb-3">Log Level</p>
            <div className="flex flex-wrap gap-2">
              {LOG_LEVELS.map((level) => {
                const Icon = level.icon;
                return (
                  <button
                    key={level.value}
                    onClick={() => {
                      setLevelFilter(level.value);
                      setPage(1);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      levelFilter === level.value
                        ? "bg-[#9DFF20] text-black"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {level.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
          >
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
            >
              <div className="flex items-start gap-4">
                <LogLevelBadge level={log.level} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm break-words">{log.message}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                    {log.source && (
                      <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                        {log.source}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-gray-400 transition-transform flex-shrink-0",
                    expandedLog === log.id && "rotate-180"
                  )}
                />
              </div>
            </div>

            {expandedLog === log.id && log.meta && (
              <div className="border-t border-gray-800 bg-gray-950 p-4">
                <p className="text-xs font-medium text-gray-400 mb-2">Metadata</p>
                <pre className="text-xs text-gray-300 font-mono overflow-x-auto bg-black/30 p-3 rounded">
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No logs found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {data.logs.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              page === 1
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-700"
            )}
          >
            Previous
          </button>

          <span className="text-sm text-gray-400">Page {page}</span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.hasMore}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              !data.hasMore
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gray-800 text-white hover:bg-gray-700"
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

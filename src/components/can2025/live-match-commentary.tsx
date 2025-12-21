"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// Commentary event type
interface CommentaryEvent {
  id: number;
  match_id: string;
  event_id: string;
  time: string;
  time_seconds: number;
  locale: string;
  text: string;
  type: string;
  team?: string;
  player_name?: string;
  player_image?: string;
  icon: string;
  is_scoring: boolean;
  confidence: number;
  created_at: string;
}

interface LiveMatchCommentaryProps {
  matchId: string;
  locale?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export function LiveMatchCommentary({
  matchId,
  locale = "fr",
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
  className = "",
}: LiveMatchCommentaryProps) {
  const t = useTranslations("can2025");
  const [commentary, setCommentary] = useState<CommentaryEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Fetch commentary from API
  const fetchCommentary = async () => {
    try {
      const response = await fetch(
        `/api/can2025/live-commentary?match_id=${matchId}&locale=${locale}&limit=50`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch commentary: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCommentary(data.commentary);
        setIsLive(data.isLive);
        setLastUpdate(data.timestamp);
        setError(null);
      } else {
        throw new Error(data.error || "Failed to load commentary");
      }
    } catch (err) {
      console.error("[LiveMatchCommentary] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCommentary();
  }, [matchId, locale]);

  // Auto-refresh during live matches
  useEffect(() => {
    if (!autoRefresh || !isLive) return;

    const interval = setInterval(() => {
      fetchCommentary();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isLive, refreshInterval, matchId, locale]);

  // Get event type display color
  const getEventColor = (type: string, isScoring: boolean) => {
    if (isScoring) return "bg-green-50 border-green-500";

    switch (type) {
      case "goal":
        return "bg-green-50 border-green-500";
      case "yellow_card":
        return "bg-yellow-50 border-yellow-500";
      case "red_card":
        return "bg-red-50 border-red-500";
      case "substitution":
        return "bg-blue-50 border-blue-500";
      case "var":
        return "bg-purple-50 border-purple-500";
      default:
        return "bg-gray-50 border-gray-300";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#04453f]"></div>
          <span className="ml-3 text-gray-600">{t("loadingCommentary")}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600">{t("errorLoadingCommentary")}</p>
          <button
            onClick={fetchCommentary}
            className="mt-4 px-4 py-2 bg-[#04453f] text-white rounded hover:bg-[#022a27] transition-colors"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (commentary.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500">{t("noCommentaryYet")}</p>
          <p className="text-sm text-gray-400 mt-2">{t("checkBackDuringMatch")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">{t("liveCommentary")}</h2>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              {t("live")}
            </span>
          )}
        </div>

        {lastUpdate && (
          <span className="text-xs text-gray-400">
            {t("lastUpdate")}: {new Date(lastUpdate).toLocaleTimeString(locale)}
          </span>
        )}
      </div>

      {/* Commentary feed */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {commentary.map((event) => (
            <div
              key={event.id}
              className={`p-4 border-l-4 transition-colors hover:bg-gray-50 ${getEventColor(
                event.type,
                event.is_scoring
              )}`}
            >
              {/* Event header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{event.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#04453f]">{event.time}</span>
                      {event.player_name && (
                        <span className="text-sm font-medium text-gray-700">
                          {event.player_name}
                        </span>
                      )}
                    </div>
                    {event.team && (
                      <span className="text-xs text-gray-500">{event.team}</span>
                    )}
                  </div>
                </div>

                {/* Scoring badge */}
                {event.is_scoring && (
                  <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                    {t("goal")}
                  </span>
                )}
              </div>

              {/* Commentary text */}
              <p className="text-gray-800 leading-relaxed ml-9">{event.text}</p>

              {/* Confidence score (dev only) */}
              {process.env.NODE_ENV === "development" && event.confidence < 1.0 && (
                <div className="mt-2 ml-9">
                  <span className="text-xs text-gray-400">
                    AI Confidence: {(event.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          {t("aiGeneratedCommentary")} • {commentary.length} {t("events")}
        </p>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { fetchAFCONStatistics, getCountryFlag, getGoalsPerMatch } from "@/lib/espn-api";

interface AFCONScorersWidgetProps {
  title?: string;
  maxScorers?: number;
  showAssists?: boolean;
}

export async function AFCONScorersWidget({
  title,
  maxScorers = 5,
  showAssists = true,
}: AFCONScorersWidgetProps) {
  const tHome = await getTranslations("home");
  const tRankings = await getTranslations("rankings");
  const displayTitle = title || tRankings("afconTopScorers");

  // Fetch live data from ESPN API
  const { scorers, lastUpdated } = await fetchAFCONStatistics();

  // Handle empty data
  if (!scorers || scorers.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="title-section whitespace-nowrap">{displayTitle}</h3>
          <div
            className="flex-1 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
            }}
          />
        </div>
        <div className="bg-white rounded p-6 text-center">
          <p className="text-gray-500 text-sm">{tRankings("noDataAvailable")}</p>
        </div>
      </div>
    );
  }

  const displayScorers = scorers.slice(0, maxScorers);

  // Calculate time since update
  const updateTime = new Date(lastUpdated);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - updateTime.getTime()) / 60000);

  return (
    <div>
      {/* Header with gradient line */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="title-section whitespace-nowrap">{displayTitle}</h3>
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
          }}
        />
      </div>

      {/* Scorers list */}
      <div className="bg-white rounded overflow-hidden">
        {/* Live indicator */}
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">
              {tRankings("liveData")}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {minutesAgo === 0 ? tRankings("justNow") : `${minutesAgo}min ${tRankings("ago")}`}
          </span>
        </div>

        {/* Header row */}
        <div className="flex items-center px-4 py-2 bg-[#04453f] text-white text-xs font-bold">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">{tRankings("player")}</span>
          <span className="w-10 text-center">{tRankings("goals")}</span>
          {showAssists && (
            <span className="w-10 text-center hidden sm:block">{tRankings("assists")}</span>
          )}
        </div>

        {/* Scorers rows */}
        <div className="divide-y divide-gray-100">
          {displayScorers.map((scorer, index) => (
            <div
              key={`${scorer.name}-${index}`}
              className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              {/* Rank */}
              <span
                className={`w-8 text-center text-sm font-bold ${
                  index < 3 ? "text-[#04453f]" : "text-gray-500"
                }`}
              >
                {scorer.rank}
              </span>

              {/* Player info */}
              <div className="flex items-center flex-1 min-w-0 gap-2">
                {/* Country flag */}
                <div className="flex-shrink-0 text-2xl">
                  {getCountryFlag(scorer.country)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{scorer.name}</p>
                  <p className="text-xs text-gray-500 truncate">{scorer.country}</p>
                </div>
              </div>

              {/* Goals */}
              <span className="w-10 text-center text-sm font-bold text-[#04453f]">
                {scorer.goals}
              </span>

              {/* Assists */}
              {showAssists && (
                <span className="w-10 text-center text-sm text-gray-600 hidden sm:block">
                  {scorer.assists}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* View more link */}
        <a
          href="/classements/buteurs#afcon"
          className="block px-4 py-3 text-center text-sm font-bold text-[#04453f] hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          {tRankings("viewFull")} →
        </a>
      </div>

      {/* ESPN attribution */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          {tRankings("dataProvidedBy")} ESPN
        </p>
      </div>
    </div>
  );
}

export function AFCONScorersWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-40 bg-gray-200 rounded" />
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
          }}
        />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded overflow-hidden">
        <div className="h-9 bg-gray-200" />
        <div className="divide-y divide-gray-100">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center px-4 py-3">
              <div className="w-8 h-4 bg-gray-200 rounded" />
              <div className="flex items-center flex-1 gap-2 ml-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-10 h-4 bg-gray-200 rounded" />
              <div className="w-10 h-4 bg-gray-200 rounded ml-2 hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

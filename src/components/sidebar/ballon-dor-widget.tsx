import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getTopRankings, type BallonDorRanking } from "@/lib/ballon-dor-db";

interface BallonDorWidgetProps {
  maxPlayers?: number;
}

export async function BallonDorWidget({ maxPlayers = 5 }: BallonDorWidgetProps) {
  const t = await getTranslations("ballonDor");

  let rankings: BallonDorRanking[] = [];
  try {
    rankings = await getTopRankings(maxPlayers);
  } catch (error) {
    console.error("[BallonDorWidget] Error fetching rankings:", error);
  }

  if (!rankings || rankings.length === 0) {
    return (
      <div>
        {/* Header with gradient line */}
        <div className="flex items-center gap-3 mb-4">
          <h3 className="title-section whitespace-nowrap">{t("title")}</h3>
          <div
            className="flex-1 h-0.5"
            style={{
              background:
                "linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)",
            }}
          />
        </div>
        <div className="bg-white rounded p-4 text-center text-sm text-gray-500">
          {t("notAvailable")}
        </div>
      </div>
    );
  }

  const maxScore = rankings[0]?.total_score ?? 100;

  return (
    <div>
      {/* Header with gradient line */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="title-section whitespace-nowrap">{t("title")}</h3>
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)",
          }}
        />
      </div>

      {/* Rankings list */}
      <div className="bg-white rounded overflow-hidden">
        {/* Header row */}
        <div className="flex items-center px-4 py-2 bg-[#04453f] text-white text-xs font-bold">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">{t("player")}</span>
          <span className="w-16 text-center">{t("score")}</span>
        </div>

        {/* Player rows */}
        <div className="divide-y divide-gray-100">
          {rankings.map((ranking) => (
            <RankingRow
              key={ranking.player_api_id}
              ranking={ranking}
              maxScore={maxScore}
              t={t}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 text-center text-xs text-gray-400 border-t border-gray-100">
          {t("updatedWeekly")}
        </div>
      </div>
    </div>
  );
}

function RankingRow({
  ranking,
  maxScore,
  t,
}: {
  ranking: BallonDorRanking;
  maxScore: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const barWidth = maxScore > 0 ? (ranking.total_score / maxScore) * 100 : 0;

  // Country flag URL using flagcdn
  const flagUrl = `https://flagcdn.com/20x15/${ranking.country_code.toLowerCase()}.png`;

  // Format key stat label
  const keyStatLabel = ranking.key_stat_label
    ? t(`keyStat.${ranking.key_stat_label}`)
    : "";
  const keyStatDisplay = ranking.key_stat_value
    ? `${ranking.key_stat_value} ${keyStatLabel}`
    : "";

  return (
    <div className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* Rank */}
      <span
        className={`w-8 text-center text-sm font-bold flex-shrink-0 ${
          ranking.rank_position === 1
            ? "text-[#FFD700]"
            : ranking.rank_position === 2
            ? "text-[#C0C0C0]"
            : ranking.rank_position === 3
            ? "text-[#CD7F32]"
            : "text-gray-500"
        }`}
      >
        {ranking.rank_position}
      </span>

      {/* Player info */}
      <div className="flex items-center flex-1 min-w-0 gap-2">
        {/* Player photo */}
        <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
          {ranking.player_photo ? (
            <Image
              src={ranking.player_photo}
              alt={ranking.player_name}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
              {ranking.player_name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">
            {ranking.player_name}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            {/* Country flag */}
            <Image
              src={flagUrl}
              alt={ranking.nationality}
              width={14}
              height={10}
              className="flex-shrink-0"
              unoptimized
            />
            <span className="truncate">
              {ranking.team_name}
              {keyStatDisplay && (
                <span className="text-gray-400"> · {keyStatDisplay}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Score with bar */}
      <div className="w-16 flex-shrink-0 flex flex-col items-end gap-0.5">
        <span className="text-sm font-bold text-[#04453f]">
          {ranking.total_score.toFixed(1)}
        </span>
        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background:
                "linear-gradient(90deg, #FFD700 0%, #FFA500 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for Suspense fallback - DO NOT REMOVE
export function BallonDorWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-44 bg-gray-200 rounded" />
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)",
          }}
        />
      </div>
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
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-16 space-y-1">
                <div className="h-4 w-10 bg-gray-200 rounded ml-auto" />
                <div className="h-1 w-full bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

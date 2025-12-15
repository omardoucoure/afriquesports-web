import Image from "next/image";
import { fetchTopScorers, type TopScorerData } from "@/lib/football-api";

interface TopScorersWidgetProps {
  title?: string;
  maxScorers?: number;
}

export async function TopScorersWidget({
  title = "Top buteurs africains",
  maxScorers = 5,
}: TopScorersWidgetProps) {
  const scorers = await fetchTopScorers();
  const displayScorers = scorers.slice(0, maxScorers);

  if (!displayScorers.length) {
    return null;
  }

  return (
    <div>
      {/* Header with gradient line */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="title-section whitespace-nowrap">{title}</h3>
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
        {/* Header row */}
        <div className="flex items-center px-4 py-2 bg-[#04453f] text-white text-xs font-bold">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Joueur</span>
          <span className="w-10 text-center">Buts</span>
          <span className="w-10 text-center hidden sm:block">Passes</span>
        </div>

        {/* Scorers rows */}
        <div className="divide-y divide-gray-100">
          {displayScorers.map((scorer, index) => (
            <ScorerRow key={scorer.id} scorer={scorer} rank={index + 1} />
          ))}
        </div>

        {/* View more link */}
        <a
          href="/classements/buteurs"
          className="block px-4 py-3 text-center text-sm font-bold text-[#04453f] hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          Voir le classement complet →
        </a>
      </div>
    </div>
  );
}

function ScorerRow({ scorer, rank }: { scorer: TopScorerData; rank: number }) {
  return (
    <div className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
      {/* Rank */}
      <span
        className={`w-8 text-center text-sm font-bold ${
          rank <= 3 ? "text-[#04453f]" : "text-gray-500"
        }`}
      >
        {rank}
      </span>

      {/* Player info */}
      <div className="flex items-center flex-1 min-w-0 gap-2">
        {/* Player photo or flag */}
        <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
          {scorer.photo && !scorer.photo.includes("default") ? (
            <Image
              src={scorer.photo}
              alt={scorer.name}
              fill
              sizes="32px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
              {scorer.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{scorer.name}</p>
          <p className="text-xs text-gray-500 truncate">{scorer.nationality}</p>
        </div>
      </div>

      {/* Goals */}
      <span className="w-10 text-center text-sm font-bold text-[#04453f]">
        {scorer.goals}
      </span>

      {/* Assists */}
      <span className="w-10 text-center text-sm text-gray-600 hidden sm:block">
        {scorer.assists}
      </span>
    </div>
  );
}

export function TopScorersWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-36 bg-gray-200 rounded" />
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

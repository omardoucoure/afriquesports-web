import Image from "next/image";
import { getTranslations } from "next-intl/server";

export interface TopScorerData {
  id: number;
  name: string;
  photo: string;
  nationality: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  appearances: number;
}

/**
 * Real data for top African scorers in European leagues 2024-2025 season
 * Updated: December 2024
 */
const TOP_SCORERS: TopScorerData[] = [
  {
    id: 1,
    name: "Mohamed Salah",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png",
    nationality: "Égypte",
    team: "Liverpool",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t14.png",
    goals: 29,
    assists: 18,
    appearances: 29,
  },
  {
    id: 2,
    name: "Bryan Mbeumo",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p219847.png",
    nationality: "Cameroun",
    team: "Brentford",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
    goals: 20,
    assists: 7,
    appearances: 34,
  },
  {
    id: 3,
    name: "Yoane Wissa",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p222044.png",
    nationality: "RD Congo",
    team: "Brentford",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
    goals: 19,
    assists: 4,
    appearances: 32,
  },
  {
    id: 4,
    name: "Ademola Lookman",
    photo: "https://img.a.transfermarkt.technology/portrait/big/300073-1698673305.jpg",
    nationality: "Nigeria",
    team: "Atalanta",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/800.png",
    goals: 15,
    assists: 5,
    appearances: 30,
  },
  {
    id: 5,
    name: "Ismaïl Saibari",
    photo: "https://img.a.transfermarkt.technology/portrait/big/586434-1698587040.jpg",
    nationality: "Maroc",
    team: "PSV",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/383.png",
    goals: 11,
    assists: 11,
    appearances: 29,
  },
  {
    id: 6,
    name: "Antoine Semenyo",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p453628.png",
    nationality: "Ghana",
    team: "Bournemouth",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t91.png",
    goals: 11,
    assists: 6,
    appearances: 32,
  },
  {
    id: 7,
    name: "Iñaki Williams",
    photo: "https://img.a.transfermarkt.technology/portrait/big/205445-1661506800.jpg",
    nationality: "Ghana",
    team: "Athletic Bilbao",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/621.png",
    goals: 6,
    assists: 8,
    appearances: 34,
  },
  {
    id: 8,
    name: "Frank Anguissa",
    photo: "https://img.a.transfermarkt.technology/portrait/big/258735-1663946286.jpg",
    nationality: "Cameroun",
    team: "Napoli",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/6195.png",
    goals: 6,
    assists: 4,
    appearances: 30,
  },
];

interface TopScorersWidgetProps {
  title?: string;
  maxScorers?: number;
}

export async function TopScorersWidget({
  title,
  maxScorers = 5,
}: TopScorersWidgetProps) {
  const tHome = await getTranslations("home");
  const tRankings = await getTranslations("rankings");
  const displayTitle = title || tHome("topScorers");

  const displayScorers = TOP_SCORERS.slice(0, maxScorers);

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
        {/* Header row */}
        <div className="flex items-center px-4 py-2 bg-[#04453f] text-white text-xs font-bold">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">{tRankings("player")}</span>
          <span className="w-10 text-center">{tRankings("goals")}</span>
          <span className="w-10 text-center hidden sm:block">{tRankings("assists")}</span>
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
          {tRankings("viewFull")} →
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

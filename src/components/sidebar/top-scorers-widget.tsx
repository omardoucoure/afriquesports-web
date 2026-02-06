import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTopScorers, type TopScorerRow } from "@/lib/top-scorers-db";

export interface TopScorerData {
  id: number;
  name: string;
  photo: string;
  nationality: string;
  nationalityKey: string;
  team: string;
  teamLogo: string;
  goals: number;
  assists: number;
  appearances: number;
}

// Map nationality names to translation keys
const NATIONALITY_KEY_MAP: Record<string, string> = {
  'Egypt': 'egypt',
  'Nigeria': 'nigeria',
  'Morocco': 'morocco',
  'Cameroon': 'cameroon',
  'Senegal': 'senegal',
  'Ivory Coast': 'ivoryCoast',
  'Guinea': 'guinea',
  'DR Congo': 'drCongo',
  'Ghana': 'ghana',
  'Gabon': 'gabon',
  'Burkina Faso': 'burkinaFaso',
  'Algeria': 'algeria',
  'Mali': 'mali',
  'Tunisia': 'tunisia',
  'South Africa': 'southAfrica',
  'Angola': 'angola',
  'Zambia': 'zambia',
  'Zimbabwe': 'zimbabwe',
  'Tanzania': 'tanzania',
  'Mozambique': 'mozambique',
  'Comoros': 'comoros',
  'Mauritania': 'mauritania',
  'Gambia': 'gambia',
  'Cape Verde': 'capeVerde',
  'Sudan': 'sudan',
  'Uganda': 'uganda',
  'Equatorial Guinea': 'equatorialGuinea',
  'Benin': 'benin',
  'Botswana': 'botswana',
};

function getNationalityKey(nationality: string): string {
  return NATIONALITY_KEY_MAP[nationality] || nationality.toLowerCase();
}

/**
 * Convert a DB row to the display format
 */
function dbRowToScorer(row: TopScorerRow): TopScorerData {
  return {
    id: row.player_api_id,
    name: row.player_name,
    photo: row.player_photo || '',
    nationality: row.nationality,
    nationalityKey: getNationalityKey(row.nationality),
    team: row.team_name,
    teamLogo: row.team_logo || '',
    goals: row.total_goals,
    assists: row.total_assists,
    appearances: row.club_appearances,
  };
}

export function TopScorersWidgetSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-44 bg-gray-200 rounded" />
        <div className="flex-1 h-0.5 bg-gray-200" />
      </div>
      <div className="bg-white rounded overflow-hidden">
        <div className="h-9 bg-gray-200" />
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const tCountries = await getTranslations("countries");
  const displayTitle = title || tHome("topScorers");

  // Fetch from MySQL (cached for 1 hour)
  const dbRows = await getTopScorers(maxScorers);
  const displayScorers = dbRows.map(dbRowToScorer);

  // Handle empty data
  if (displayScorers.length === 0) {
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

  // Calculate time since last update
  const lastUpdated = dbRows[0]?.updated_at;
  const minutesAgo = lastUpdated
    ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 60000)
    : null;

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
        {/* Update indicator */}
        {minutesAgo !== null && (
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-green-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-green-700">
                {tRankings("liveData")}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {minutesAgo < 60
                ? `${minutesAgo}min ${tRankings("ago")}`
                : minutesAgo < 1440
                  ? `${Math.floor(minutesAgo / 60)}h ${tRankings("ago")}`
                  : `${Math.floor(minutesAgo / 1440)}j ${tRankings("ago")}`}
            </span>
          </div>
        )}

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
            <ScorerRow
              key={scorer.id}
              scorer={scorer}
              rank={index + 1}
              translatedNationality={tCountries(scorer.nationalityKey)}
            />
          ))}
        </div>

        {/* View more link */}
        <Link
          href="/classements/buteurs"
          className="block px-4 py-3 text-center text-sm font-bold text-[#04453f] hover:bg-gray-50 transition-colors border-t border-gray-100"
        >
          {tRankings("viewFull")} →
        </Link>
      </div>

      {/* Attribution */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          {tRankings("dataProvidedBy")} API-Football
        </p>
      </div>
    </div>
  );
}

function ScorerRow({ scorer, rank, translatedNationality }: { scorer: TopScorerData; rank: number; translatedNationality: string }) {
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
        {/* Player photo */}
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
          <p className="text-xs text-gray-500 truncate">
            {translatedNationality} · {scorer.team}
          </p>
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

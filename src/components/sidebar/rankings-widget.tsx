"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface TeamRanking {
  position: number;
  name: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  logo?: string;
}

interface RankingsWidgetProps {
  title?: string;
  competition?: string;
  teams: TeamRanking[];
  maxTeams?: number;
  showFullLink?: boolean;
}

export function RankingsWidget({
  title,
  competition = "Ligue 1",
  teams,
  maxTeams = 5,
  showFullLink = true,
}: RankingsWidgetProps) {
  const tRankings = useTranslations("rankings");
  const displayTitle = title || tRankings("title");
  const displayTeams = teams.slice(0, maxTeams);

  return (
    <div className="bg-white rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{displayTitle}</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {competition}
        </span>
      </div>

      {/* Rankings table */}
      <div className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="py-2 text-left font-medium">{tRankings("position")}</th>
              <th className="py-2 text-left font-medium">{tRankings("team")}</th>
              <th className="py-2 text-center font-medium">{tRankings("played")}</th>
              <th className="py-2 text-center font-medium">{tRankings("points")}</th>
            </tr>
          </thead>
          <tbody>
            {displayTeams.map((team) => (
              <tr
                key={team.position}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-2">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded ${
                      team.position <= 3
                        ? "bg-[#04453f] text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {team.position}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    {team.logo && (
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex-shrink-0">
                        {/* Team logo placeholder */}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 truncate">
                      {team.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-center text-gray-600">{team.played}</td>
                <td className="py-2 text-center font-semibold text-gray-900">
                  {team.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full standings link */}
      {showFullLink && (
        <Link
          href="/classements"
          className="block mt-4 text-center text-sm font-medium text-[#022a27] hover:text-[#04453f] transition-colors"
        >
          {tRankings("viewFull")} →
        </Link>
      )}
    </div>
  );
}


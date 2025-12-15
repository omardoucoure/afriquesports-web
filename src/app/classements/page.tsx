import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { Breadcrumb } from "@/components/ui";

export const metadata: Metadata = {
  title: "Classements",
  description: "Consultez les classements des championnats africains et européens. Ligue 1, Premier League, Liga, Serie A, Bundesliga et championnats africains.",
  openGraph: {
    title: "Classements | Afrique Sports",
    description: "Consultez les classements des championnats africains et européens.",
    type: "website",
    siteName: "Afrique Sports",
  },
};

const breadcrumbItems = [
  { label: "Accueil", href: "/" },
  { label: "Classements", href: "/classements" },
];

// Sample league data - will be replaced with API data
const leagues = [
  {
    name: "Ligue 1",
    country: "France",
    teams: [
      { position: 1, name: "PSG", played: 15, won: 12, drawn: 2, lost: 1, gf: 40, ga: 15, gd: 25, points: 38 },
      { position: 2, name: "Monaco", played: 15, won: 10, drawn: 3, lost: 2, gf: 32, ga: 18, gd: 14, points: 33 },
      { position: 3, name: "Marseille", played: 15, won: 9, drawn: 4, lost: 2, gf: 28, ga: 16, gd: 12, points: 31 },
      { position: 4, name: "Lille", played: 15, won: 8, drawn: 5, lost: 2, gf: 26, ga: 14, gd: 12, points: 29 },
      { position: 5, name: "Lyon", played: 15, won: 7, drawn: 6, lost: 2, gf: 24, ga: 15, gd: 9, points: 27 },
    ],
  },
  {
    name: "Premier League",
    country: "Angleterre",
    teams: [
      { position: 1, name: "Liverpool", played: 15, won: 12, drawn: 3, lost: 0, gf: 38, ga: 12, gd: 26, points: 39 },
      { position: 2, name: "Chelsea", played: 15, won: 10, drawn: 3, lost: 2, gf: 35, ga: 18, gd: 17, points: 33 },
      { position: 3, name: "Arsenal", played: 15, won: 9, drawn: 5, lost: 1, gf: 30, ga: 14, gd: 16, points: 32 },
      { position: 4, name: "Man City", played: 15, won: 8, drawn: 5, lost: 2, gf: 28, ga: 18, gd: 10, points: 29 },
      { position: 5, name: "Nottingham", played: 15, won: 8, drawn: 4, lost: 3, gf: 22, ga: 16, gd: 6, points: 28 },
    ],
  },
  {
    name: "Liga",
    country: "Espagne",
    teams: [
      { position: 1, name: "Barcelone", played: 15, won: 11, drawn: 4, lost: 0, gf: 42, ga: 14, gd: 28, points: 37 },
      { position: 2, name: "Real Madrid", played: 15, won: 10, drawn: 3, lost: 2, gf: 35, ga: 16, gd: 19, points: 33 },
      { position: 3, name: "Atletico", played: 15, won: 9, drawn: 4, lost: 2, gf: 28, ga: 12, gd: 16, points: 31 },
      { position: 4, name: "Athletic", played: 15, won: 8, drawn: 5, lost: 2, gf: 24, ga: 14, gd: 10, points: 29 },
      { position: 5, name: "Villarreal", played: 15, won: 7, drawn: 5, lost: 3, gf: 26, ga: 20, gd: 6, points: 26 },
    ],
  },
];

export default function ClassementsPage() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-[104px] md:pt-[88px] lg:pt-16">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Page header */}
        <section className="container-main pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Classements
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Suivez les classements des principaux championnats de football africains et européens.
          </p>
        </section>

        {/* Rankings tables */}
        <div className="container-main py-4 md:py-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leagues.map((league) => (
              <div key={league.name} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* League header */}
                <div className="bg-black text-white p-4">
                  <h2 className="font-bold text-lg">{league.name}</h2>
                  <p className="text-sm text-gray-400">{league.country}</p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500">
                        <th className="py-3 px-2 text-left font-medium">#</th>
                        <th className="py-3 px-2 text-left font-medium">Équipe</th>
                        <th className="py-3 px-2 text-center font-medium">J</th>
                        <th className="py-3 px-2 text-center font-medium">+/-</th>
                        <th className="py-3 px-2 text-center font-medium">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {league.teams.map((team) => (
                        <tr
                          key={team.name}
                          className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded ${
                                team.position <= 3
                                  ? "bg-[#9DFF20] text-[#345C00]"
                                  : team.position <= 5
                                  ? "bg-blue-100 text-blue-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {team.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-medium text-gray-900">
                            {team.name}
                          </td>
                          <td className="py-3 px-2 text-center text-gray-600">
                            {team.played}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={
                                team.gd > 0
                                  ? "text-green-600"
                                  : team.gd < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              {team.gd > 0 ? "+" : ""}
                              {team.gd}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-gray-900">
                            {team.points}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* View full table link */}
                <div className="p-3 border-t border-gray-100">
                  <button className="w-full py-2 text-sm font-medium text-[#345C00] hover:bg-[#9DFF20]/10 rounded-lg transition-colors">
                    Voir le classement complet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* African leagues section */}
        <section className="container-main py-8 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Championnats africains
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600 text-center py-8">
              Les classements des championnats africains seront bientôt disponibles.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { Breadcrumb } from "@/components/ui";
import { fetchAFCONStatistics, getCountryFlag, getGoalsPerMatch } from "@/lib/espn-api";

// Force dynamic rendering to fetch ESPN API on each request (not during build)
export const dynamic = 'force-dynamic';

interface ButeursPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ButeursPageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://www.afriquesports.net";
  const pagePath = "/classements/buteurs";
  const canonicalUrl = locale === "fr" ? `${baseUrl}${pagePath}` : `${baseUrl}/${locale}${pagePath}`;

  const titles: Record<string, string> = {
    fr: "Top Buteurs Africains - Meilleurs Attaquants en Europe | Afrique Sports",
    en: "Top African Scorers - Best Strikers in Europe | Afrique Sports",
    es: "Máximos Goleadores Africanos - Mejores Delanteros en Europa | Afrique Sports",
  };

  const descriptions: Record<string, string> = {
    fr: "Classement des meilleurs buteurs africains en Europe : Mohamed Salah, Bryan Mbeumo, Ademola Lookman. Stats, buts, passes décisives. Premier League, Serie A, Bundesliga, Ligue 1.",
    en: "Ranking of top African scorers in Europe: Mohamed Salah, Bryan Mbeumo, Ademola Lookman. Stats, goals, assists. Premier League, Serie A, Bundesliga, Ligue 1.",
    es: "Clasificación de los mejores goleadores africanos en Europa: Mohamed Salah, Bryan Mbeumo, Ademola Lookman. Estadísticas, goles, asistencias. Premier League, Serie A, Bundesliga, Ligue 1.",
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    keywords: "buteurs africains, Mohamed Salah, Bryan Mbeumo, Ademola Lookman, Yoane Wissa, Victor Osimhen, attaquants africains, buts, Premier League, Serie A",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fr-FR": `${baseUrl}${pagePath}`,
        "en-US": `${baseUrl}/en${pagePath}`,
        "es-ES": `${baseUrl}/es${pagePath}`,
        "x-default": `${baseUrl}${pagePath}`,
      },
    },
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      type: "website",
      siteName: "Afrique Sports",
      url: canonicalUrl,
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "es_ES",
      images: [{ url: "https://www.afriquesports.net/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      site: "@afriquesports",
      images: ["https://www.afriquesports.net/opengraph-image"],
    },
  };
}

/**
 * Complete top African scorers data - 2024-2025 season
 * Updated: December 2024
 */
const TOP_SCORERS = [
  {
    id: 1,
    rank: 1,
    name: "Mohamed Salah",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p118748.png",
    nationality: "Égypte",
    nationalityEn: "Egypt",
    nationalityEs: "Egipto",
    flagEmoji: "🇪🇬",
    team: "Liverpool",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t14.png",
    league: "Premier League",
    goals: 29,
    assists: 18,
    appearances: 29,
    minutesPlayed: 2567,
    goalsPerGame: 1.0,
  },
  {
    id: 2,
    rank: 2,
    name: "Bryan Mbeumo",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p219847.png",
    nationality: "Cameroun",
    nationalityEn: "Cameroon",
    nationalityEs: "Camerún",
    flagEmoji: "🇨🇲",
    team: "Brentford",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
    league: "Premier League",
    goals: 20,
    assists: 7,
    appearances: 34,
    minutesPlayed: 3021,
    goalsPerGame: 0.59,
  },
  {
    id: 3,
    rank: 3,
    name: "Yoane Wissa",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p222044.png",
    nationality: "RD Congo",
    nationalityEn: "DR Congo",
    nationalityEs: "RD Congo",
    flagEmoji: "🇨🇩",
    team: "Brentford",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t94.png",
    league: "Premier League",
    goals: 19,
    assists: 4,
    appearances: 32,
    minutesPlayed: 2456,
    goalsPerGame: 0.59,
  },
  {
    id: 4,
    rank: 4,
    name: "Ademola Lookman",
    photo: "https://img.a.transfermarkt.technology/portrait/big/300073-1698673305.jpg",
    nationality: "Nigeria",
    nationalityEn: "Nigeria",
    nationalityEs: "Nigeria",
    flagEmoji: "🇳🇬",
    team: "Atalanta",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/800.png",
    league: "Serie A",
    goals: 15,
    assists: 5,
    appearances: 30,
    minutesPlayed: 2456,
    goalsPerGame: 0.50,
  },
  {
    id: 5,
    rank: 5,
    name: "Ismaïl Saibari",
    photo: "https://img.a.transfermarkt.technology/portrait/big/586434-1698587040.jpg",
    nationality: "Maroc",
    nationalityEn: "Morocco",
    nationalityEs: "Marruecos",
    flagEmoji: "🇲🇦",
    team: "PSV Eindhoven",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/383.png",
    league: "Eredivisie",
    goals: 11,
    assists: 11,
    appearances: 29,
    minutesPlayed: 2198,
    goalsPerGame: 0.38,
  },
  {
    id: 6,
    rank: 6,
    name: "Antoine Semenyo",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p453628.png",
    nationality: "Ghana",
    nationalityEn: "Ghana",
    nationalityEs: "Ghana",
    flagEmoji: "🇬🇭",
    team: "Bournemouth",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t91.png",
    league: "Premier League",
    goals: 11,
    assists: 6,
    appearances: 32,
    minutesPlayed: 2678,
    goalsPerGame: 0.34,
  },
  {
    id: 7,
    rank: 7,
    name: "Victor Osimhen",
    photo: "https://img.a.transfermarkt.technology/portrait/big/401923-1694609670.jpg",
    nationality: "Nigeria",
    nationalityEn: "Nigeria",
    nationalityEs: "Nigeria",
    flagEmoji: "🇳🇬",
    team: "Galatasaray",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/141.png",
    league: "Süper Lig",
    goals: 10,
    assists: 5,
    appearances: 16,
    minutesPlayed: 1387,
    goalsPerGame: 0.63,
  },
  {
    id: 8,
    rank: 8,
    name: "Iñaki Williams",
    photo: "https://img.a.transfermarkt.technology/portrait/big/205445-1661506800.jpg",
    nationality: "Ghana",
    nationalityEn: "Ghana",
    nationalityEs: "Ghana",
    flagEmoji: "🇬🇭",
    team: "Athletic Bilbao",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/621.png",
    league: "La Liga",
    goals: 6,
    assists: 8,
    appearances: 34,
    minutesPlayed: 2912,
    goalsPerGame: 0.18,
  },
  {
    id: 9,
    rank: 9,
    name: "Frank Anguissa",
    photo: "https://img.a.transfermarkt.technology/portrait/big/258735-1663946286.jpg",
    nationality: "Cameroun",
    nationalityEn: "Cameroon",
    nationalityEs: "Camerún",
    flagEmoji: "🇨🇲",
    team: "Napoli",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/6195.png",
    league: "Serie A",
    goals: 6,
    assists: 4,
    appearances: 30,
    minutesPlayed: 2567,
    goalsPerGame: 0.20,
  },
  {
    id: 10,
    rank: 10,
    name: "Achraf Hakimi",
    photo: "https://img.a.transfermarkt.technology/portrait/big/398073-1694609854.jpg",
    nationality: "Maroc",
    nationalityEn: "Morocco",
    nationalityEs: "Marruecos",
    flagEmoji: "🇲🇦",
    team: "Paris Saint-Germain",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/583.png",
    league: "Ligue 1",
    goals: 5,
    assists: 7,
    appearances: 28,
    minutesPlayed: 2456,
    goalsPerGame: 0.18,
  },
  {
    id: 11,
    rank: 11,
    name: "Nicolas Jackson",
    photo: "https://resources.premierleague.com/premierleague/photos/players/250x250/p466046.png",
    nationality: "Sénégal",
    nationalityEn: "Senegal",
    nationalityEs: "Senegal",
    flagEmoji: "🇸🇳",
    team: "Chelsea",
    teamLogo: "https://resources.premierleague.com/premierleague/badges/50/t8.png",
    league: "Premier League",
    goals: 5,
    assists: 3,
    appearances: 27,
    minutesPlayed: 2198,
    goalsPerGame: 0.19,
  },
  {
    id: 12,
    rank: 12,
    name: "Kalidou Koulibaly",
    photo: "https://img.a.transfermarkt.technology/portrait/big/93128-1663946258.jpg",
    nationality: "Sénégal",
    nationalityEn: "Senegal",
    nationalityEs: "Senegal",
    flagEmoji: "🇸🇳",
    team: "Al-Hilal",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/7733.png",
    league: "Saudi Pro League",
    goals: 4,
    assists: 2,
    appearances: 25,
    minutesPlayed: 2234,
    goalsPerGame: 0.16,
  },
  {
    id: 13,
    rank: 13,
    name: "Riyad Mahrez",
    photo: "https://img.a.transfermarkt.technology/portrait/big/171424-1663946422.jpg",
    nationality: "Algérie",
    nationalityEn: "Algeria",
    nationalityEs: "Argelia",
    flagEmoji: "🇩🇿",
    team: "Al-Ahli",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/5832.png",
    league: "Saudi Pro League",
    goals: 4,
    assists: 6,
    appearances: 24,
    minutesPlayed: 1987,
    goalsPerGame: 0.17,
  },
  {
    id: 14,
    rank: 14,
    name: "Sadio Mané",
    photo: "https://img.a.transfermarkt.technology/portrait/big/200512-1661506826.jpg",
    nationality: "Sénégal",
    nationalityEn: "Senegal",
    nationalityEs: "Senegal",
    flagEmoji: "🇸🇳",
    team: "Al-Nassr",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/3316.png",
    league: "Saudi Pro League",
    goals: 3,
    assists: 4,
    appearances: 22,
    minutesPlayed: 1765,
    goalsPerGame: 0.14,
  },
  {
    id: 15,
    rank: 15,
    name: "Serhou Guirassy",
    photo: "https://img.a.transfermarkt.technology/portrait/big/191749-1661347105.jpg",
    nationality: "Guinée",
    nationalityEn: "Guinea",
    nationalityEs: "Guinea",
    flagEmoji: "🇬🇳",
    team: "Borussia Dortmund",
    teamLogo: "https://tmssl.akamaized.net/images/wappen/small/16.png",
    league: "Bundesliga",
    goals: 3,
    assists: 2,
    appearances: 18,
    minutesPlayed: 1456,
    goalsPerGame: 0.17,
  },
];

export default async function ButeursPage({ params }: ButeursPageProps) {
  const { locale } = await params;
  const t = await getTranslations("rankings");
  const tHome = await getTranslations("home");

  const breadcrumbItems = [
    { label: tHome("home"), href: "/" },
    { label: t("rankings"), href: "/classements" },
    { label: t("topScorers"), href: "/classements/buteurs" },
  ];

  // Get nationality based on locale
  const getNationality = (scorer: typeof TOP_SCORERS[0]) => {
    if (locale === "en") return scorer.nationalityEn;
    if (locale === "es") return scorer.nationalityEs;
    return scorer.nationality;
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Page header */}
        <section className="container-main pb-6">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 whitespace-nowrap">
              {t("topScorers")}
            </h1>
            <div
              className="flex-1 h-1 rounded"
              style={{
                background:
                  "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
              }}
            />
          </div>
          <p className="mt-2 text-gray-600 max-w-3xl">
            {t("topScorersDescription")}
          </p>
        </section>

        {/* Stats summary cards */}
        <div className="container-main pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#04453f]">
              <p className="text-sm text-gray-500 font-medium">{t("totalScorers")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{TOP_SCORERS.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-500 font-medium">{t("topGoals")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{TOP_SCORERS[0].goals}</p>
              <p className="text-xs text-gray-500 mt-1">{TOP_SCORERS[0].name}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-500 font-medium">{t("topAssists")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{TOP_SCORERS[0].assists}</p>
              <p className="text-xs text-gray-500 mt-1">{TOP_SCORERS[0].name}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-yellow-500">
              <p className="text-sm text-gray-500 font-medium">{t("leagues")}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">6</p>
              <p className="text-xs text-gray-500 mt-1">PL, Liga, Serie A...</p>
            </div>
          </div>
        </div>

        {/* AFCON 2025 Live Scorers Section */}
        <section id="afcon" className="container-main py-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">
              {t("afconTopScorers")} 🏆
            </h2>
            <div
              className="flex-1 h-1 rounded"
              style={{
                background:
                  "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
              }}
            />
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700 whitespace-nowrap">
                {t("liveData")}
              </span>
            </div>
          </div>

          <Suspense fallback={<AFCONScorersSkeleton />}>
            <AFCONScorersTable locale={locale} />
          </Suspense>
        </section>

        {/* European Leagues Section Header */}
        <section className="container-main pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">
              {t("europeanScorers")} ⚽
            </h2>
            <div
              className="flex-1 h-1 rounded"
              style={{
                background:
                  "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
              }}
            />
          </div>
        </section>

        {/* Scorers table */}
        <div className="container-main py-4 md:py-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#04453f] text-white">
                  <tr>
                    <th className="py-4 px-4 text-left font-bold text-sm">#</th>
                    <th className="py-4 px-4 text-left font-bold text-sm">{t("player")}</th>
                    <th className="py-4 px-4 text-left font-bold text-sm">{t("nationality")}</th>
                    <th className="py-4 px-4 text-left font-bold text-sm">{t("team")}</th>
                    <th className="py-4 px-4 text-left font-bold text-sm">{t("league")}</th>
                    <th className="py-4 px-4 text-center font-bold text-sm">{t("goals")}</th>
                    <th className="py-4 px-4 text-center font-bold text-sm">{t("assists")}</th>
                    <th className="py-4 px-4 text-center font-bold text-sm">{t("matches")}</th>
                    <th className="py-4 px-4 text-center font-bold text-sm">{t("goalsPerMatch")}</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_SCORERS.map((scorer, index) => (
                    <tr
                      key={scorer.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full ${
                            index < 3
                              ? "bg-[#04453f] text-white"
                              : index < 5
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {scorer.rank}
                        </span>
                      </td>

                      {/* Player */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                            {scorer.photo && !scorer.photo.includes("default") ? (
                              <Image
                                src={scorer.photo}
                                alt={scorer.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                                {scorer.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{scorer.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Nationality */}
                      <td className="py-4 px-4">
                        <span className="flex items-center gap-2">
                          <span className="text-2xl">{scorer.flagEmoji}</span>
                          <span className="text-sm text-gray-700">{getNationality(scorer)}</span>
                        </span>
                      </td>

                      {/* Team */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {scorer.teamLogo && (
                            <div className="relative w-6 h-6 flex-shrink-0">
                              <Image
                                src={scorer.teamLogo}
                                alt={scorer.team}
                                fill
                                sizes="24px"
                                className="object-contain"
                              />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700">{scorer.team}</span>
                        </div>
                      </td>

                      {/* League */}
                      <td className="py-4 px-4">
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {scorer.league}
                        </span>
                      </td>

                      {/* Goals */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-lg font-bold text-[#04453f]">{scorer.goals}</span>
                      </td>

                      {/* Assists */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-lg font-bold text-blue-600">{scorer.assists}</span>
                      </td>

                      {/* Matches */}
                      <td className="py-4 px-4 text-center text-gray-600">{scorer.appearances}</td>

                      {/* Goals per match */}
                      <td className="py-4 px-4 text-center">
                        <span className="text-sm font-medium text-gray-700">
                          {scorer.goalsPerGame.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {TOP_SCORERS.map((scorer, index) => (
                <div key={scorer.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <span
                      className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full ${
                        index < 3
                          ? "bg-[#04453f] text-white"
                          : index < 5
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {scorer.rank}
                    </span>

                    {/* Player photo */}
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-full overflow-hidden bg-gray-200">
                      {scorer.photo && !scorer.photo.includes("default") ? (
                        <Image
                          src={scorer.photo}
                          alt={scorer.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
                          {scorer.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1">{scorer.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                        <span>{scorer.flagEmoji}</span>
                        <span>{getNationality(scorer)}</span>
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        {scorer.teamLogo && (
                          <div className="relative w-5 h-5">
                            <Image
                              src={scorer.teamLogo}
                              alt={scorer.team}
                              fill
                              sizes="20px"
                              className="object-contain"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-700">{scorer.team}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-[#04453f]">
                          {scorer.goals} {t("goals").toLowerCase()}
                        </span>
                        <span className="text-blue-600">
                          {scorer.assists} {t("assists").toLowerCase()}
                        </span>
                        <span className="text-gray-600">{scorer.appearances} {t("matches").toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info section */}
        <section className="container-main py-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("aboutTopScorers")}</h2>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>
                {t("topScorersInfo")}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

// AFCON Scorers Table Component
async function AFCONScorersTable({ locale }: { locale: string }) {
  const t = await getTranslations("rankings");

  // Fetch live AFCON data from ESPN
  const { scorers, lastUpdated } = await fetchAFCONStatistics();

  if (!scorers || scorers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">{t("noDataAvailable")}</p>
        <p className="text-sm text-gray-400 mt-2">{t("dataProvidedBy")} ESPN</p>
      </div>
    );
  }

  // Calculate time since update
  const updateTime = new Date(lastUpdated);
  const minutesAgo = Math.floor((Date.now() - updateTime.getTime()) / 60000);

  return (
    <>
      {/* Update indicator */}
      <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gradient-to-r from-green-50 to-yellow-50 rounded-lg border border-green-100">
        <span className="text-sm text-gray-600">
          {t("lastUpdate")}: {minutesAgo === 0 ? t("justNow") : `${minutesAgo} ${t("minutesAgo")}`}
        </span>
        <span className="text-xs text-gray-400">{t("dataProvidedBy")} ESPN</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-700 to-yellow-600 text-white">
              <tr>
                <th className="py-4 px-4 text-left font-bold text-sm">#</th>
                <th className="py-4 px-4 text-left font-bold text-sm">{t("player")}</th>
                <th className="py-4 px-4 text-left font-bold text-sm">{t("country")}</th>
                <th className="py-4 px-4 text-center font-bold text-sm">{t("goals")}</th>
                <th className="py-4 px-4 text-center font-bold text-sm">{t("assists")}</th>
                <th className="py-4 px-4 text-center font-bold text-sm">{t("matches")}</th>
                <th className="py-4 px-4 text-center font-bold text-sm">{t("goalsPerMatch")}</th>
              </tr>
            </thead>
            <tbody>
              {scorers.map((scorer, index) => (
                <tr
                  key={`${scorer.name}-${index}`}
                  className="border-t border-gray-100 hover:bg-green-50 transition-colors"
                >
                  {/* Rank */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 text-sm font-bold rounded-full ${
                        index < 3
                          ? "bg-gradient-to-r from-green-600 to-yellow-500 text-white"
                          : index < 5
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {scorer.rank}
                    </span>
                  </td>

                  {/* Player */}
                  <td className="py-4 px-4">
                    <p className="font-bold text-gray-900">{scorer.name}</p>
                  </td>

                  {/* Country */}
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(scorer.country)}</span>
                      <span className="text-sm text-gray-700">{scorer.country}</span>
                    </span>
                  </td>

                  {/* Goals */}
                  <td className="py-4 px-4 text-center">
                    <span className="text-lg font-bold text-green-600">{scorer.goals}</span>
                  </td>

                  {/* Assists */}
                  <td className="py-4 px-4 text-center">
                    <span className="text-lg font-bold text-blue-600">{scorer.assists}</span>
                  </td>

                  {/* Matches */}
                  <td className="py-4 px-4 text-center text-gray-600">{scorer.matches}</td>

                  {/* Goals per match */}
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm font-medium text-gray-700">
                      {getGoalsPerMatch(scorer.goals, scorer.matches)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {scorers.map((scorer, index) => (
            <div key={`${scorer.name}-${index}`} className="p-4 hover:bg-green-50 transition-colors">
              <div className="flex items-start gap-3">
                {/* Rank */}
                <span
                  className={`flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-sm font-bold rounded-full ${
                    index < 3
                      ? "bg-gradient-to-r from-green-600 to-yellow-500 text-white"
                      : index < 5
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {scorer.rank}
                </span>

                {/* Country flag */}
                <div className="flex-shrink-0 text-3xl">
                  {getCountryFlag(scorer.country)}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">{scorer.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{scorer.country}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-green-600">
                      {scorer.goals} {t("goals").toLowerCase()}
                    </span>
                    <span className="text-blue-600">
                      {scorer.assists} {t("assists").toLowerCase()}
                    </span>
                    <span className="text-gray-600">{scorer.matches} {t("matches").toLowerCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// AFCON Scorers Skeleton
function AFCONScorersSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg mb-4" />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-12 bg-gray-300" />
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center px-4 py-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 ml-4 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-4 bg-gray-200 rounded" />
                <div className="w-8 h-4 bg-gray-200 rounded" />
                <div className="w-8 h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

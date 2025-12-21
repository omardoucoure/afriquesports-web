import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb } from "@/components/ui";
import { DataFetcher } from "@/lib/data-fetcher";
import { generateFaqJsonLd, generateSportsEventJsonLd, CATEGORY_KEYWORDS, SEO_KEYWORDS } from "@/lib/seo";

// ISR: Revalidate every 60 seconds for fresh content
export const revalidate = 60;

interface CAN2025PageProps {
  params: Promise<{ locale: string }>;
}

// Fetch CAN 2025 standings from API
async function fetchStandings() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/standings`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) throw new Error('Failed to fetch standings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching standings:', error);
    return null;
  }
}

// Fetch CAN 2025 teams from API
async function fetchTeams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/teams`, {
      next: { revalidate: 3600 }
    });
    if (!response.ok) throw new Error('Failed to fetch teams');
    return await response.json();
  } catch (error) {
    console.error('Error fetching teams:', error);
    return null;
  }
}

// Fetch CAN 2025 top scorers from API
async function fetchTopScorers() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/scorers`, {
      next: { revalidate: 300 }
    });
    if (!response.ok) throw new Error('Failed to fetch scorers');
    return await response.json();
  } catch (error) {
    console.error('Error fetching scorers:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CAN2025PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("can2025Page");
  const baseUrl = "https://www.afriquesports.net";
  const canonicalUrl = locale === "fr" ? `${baseUrl}/can-2025` : `${baseUrl}/${locale}/can-2025`;

  // Comprehensive keywords targeting GSC opportunities
  const keywords = [
    // High-value keywords from GSC
    "CAN 2025",
    "AFCON 2025",
    "liste Sénégal CAN 2025",
    "liste pape thiaw CAN 2025",
    "sélection Sénégal CAN 2025",
    "CAN 2025 Maroc",
    // Competition terms
    "Coupe d'Afrique des Nations 2025",
    "Africa Cup of Nations 2025",
    "calendrier CAN 2025",
    "groupes CAN 2025",
    "résultats CAN 2025",
    // Teams
    "équipe Sénégal CAN 2025",
    "équipe Maroc CAN 2025",
    "Lions de la Teranga",
    "Lions de l'Atlas",
    // Players
    "Mohamed Salah CAN 2025",
    "Victor Osimhen CAN 2025",
    "Achraf Hakimi CAN 2025",
    "Sadio Mané CAN 2025",
    ...CATEGORY_KEYWORDS["can-2025"],
    ...SEO_KEYWORDS.primary,
  ];

  const titles: Record<string, string> = {
    fr: "CAN 2025 Maroc - Liste Sénégal, Calendrier, Résultats, Groupes & Pronostics",
    en: "AFCON 2025 Morocco - Senegal Squad, Schedule, Results, Groups & Predictions",
    es: "CAN 2025 Marruecos - Lista Senegal, Calendario, Resultados, Grupos y Pronósticos",
  };

  const descriptions: Record<string, string> = {
    fr: "Suivez la CAN 2025 au Maroc : liste complète du Sénégal (Pape Thiaw), Maroc, Algérie, Nigeria. Calendrier des matchs, groupes, résultats en direct. Mohamed Salah, Victor Osimhen, Achraf Hakimi, Sadio Mané.",
    en: "Follow AFCON 2025 in Morocco: complete Senegal squad (Pape Thiaw), Morocco, Algeria, Nigeria. Match schedule, groups, live results. Mohamed Salah, Victor Osimhen, Achraf Hakimi, Sadio Mané.",
    es: "Sigue la CAN 2025 en Marruecos: lista completa de Senegal (Pape Thiaw), Marruecos, Argelia, Nigeria. Calendario, grupos, resultados. Mohamed Salah, Victor Osimhen, Achraf Hakimi, Sadio Mané.",
  };

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fr-FR": `${baseUrl}/can-2025`,
        "en-US": `${baseUrl}/en/can-2025`,
        "es-ES": `${baseUrl}/es/can-2025`,
        "x-default": `${baseUrl}/can-2025`,
      },
    },
    openGraph: {
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      url: canonicalUrl,
      type: "website",
      siteName: "Afrique Sports",
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "es_ES",
      images: [
        {
          url: "https://www.afriquesports.net/opengraph-image",
          width: 1200,
          height: 630,
          alt: "CAN 2025 Maroc - Coupe d'Afrique des Nations",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@afriquesports",
      creator: "@afriquesports",
      title: titles[locale] || titles.fr,
      description: descriptions[locale] || descriptions.fr,
      images: [{
        url: "https://www.afriquesports.net/opengraph-image",
        alt: "CAN 2025 - Coupe d'Afrique des Nations",
      }],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
  };
}

async function CAN2025Articles({ locale }: { locale: string }) {
  try {
    const articles = await DataFetcher.fetchPostsByCategory("can-2025", {
      per_page: "9",
      locale,
    });

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun article disponible pour le moment.</p>
        </div>
      );
    }

    return (
      <ArticleGrid
        articles={articles}
        columns={3}
        showCategory
        showDate
        priorityCount={6}
      />
    );
  } catch (error) {
    console.error("Error fetching CAN 2025 articles:", error);
    return <ArticleGridSkeleton count={9} />;
  }
}

export default async function CAN2025Page({ params }: CAN2025PageProps) {
  const { locale } = await params;
  const t = await getTranslations("can2025Page");
  const tNav = await getTranslations("nav");

  // Fetch data from APIs
  const [standingsData, teamsData, scorersData, scheduleData] = await Promise.all([
    fetchStandings(),
    fetchTeams(),
    fetchTopScorers(),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/schedule`, {
      next: { revalidate: 300 }
    }).then(res => res.json()).catch(() => null),
  ]);

  // Official CAN 2025 groups with team IDs from ESPN API
  const officialGroups = [
    {
      abbreviation: 'A',
      teams: ['Morocco', 'Mali', 'Zambia', 'Comoros']
    },
    {
      abbreviation: 'B',
      teams: ['Egypt', 'South Africa', 'Angola', 'Zimbabwe']
    },
    {
      abbreviation: 'C',
      teams: ['Nigeria', 'Tunisia', 'Uganda', 'Tanzania']
    },
    {
      abbreviation: 'D',
      teams: ['Senegal', 'DR Congo', 'Benin', 'Botswana']
    },
    {
      abbreviation: 'E',
      teams: ['Algeria', 'Burkina Faso', 'Equatorial Guinea', 'Sudan']
    },
    {
      abbreviation: 'F',
      teams: ['Ivory Coast', 'Cameroon', 'Gabon', 'Mozambique']
    }
  ];

  // Match teams from API with official groups
  const allTeams = teamsData?.sports?.[0]?.leagues?.[0]?.teams || [];
  const groupsData = officialGroups.map(group => {
    const groupTeams = group.teams.map(teamName => {
      const teamItem = allTeams.find((item: any) => {
        const team = item.team;
        const displayName = team?.displayName || team?.name || '';
        return displayName === teamName ||
               displayName.includes(teamName) ||
               teamName.includes(displayName);
      });
      return teamItem?.team;
    }).filter(Boolean);

    return {
      abbreviation: group.abbreviation,
      teams: groupTeams
    };
  });

  // Generate FAQ data for schema
  const faqs = [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
  ];

  // Generate JSON-LD schemas
  const faqJsonLd = generateFaqJsonLd(faqs);

  // Sports Event schema for CAN 2025
  const sportsEventJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Coupe d'Afrique des Nations 2025",
    alternateName: ["CAN 2025", "AFCON 2025", "Africa Cup of Nations 2025"],
    startDate: "2025-12-21",
    endDate: "2026-01-18",
    location: {
      "@type": "Place",
      name: "Morocco",
      address: {
        "@type": "PostalAddress",
        addressCountry: "MA",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "CAF - Confédération Africaine de Football",
      url: "https://www.cafonline.com",
    },
    competitor: [
      { "@type": "SportsTeam", name: "Maroc" },
      { "@type": "SportsTeam", name: "Sénégal" },
      { "@type": "SportsTeam", name: "Égypte" },
      { "@type": "SportsTeam", name: "Nigeria" },
      { "@type": "SportsTeam", name: "Algérie" },
      { "@type": "SportsTeam", name: "Côte d'Ivoire" },
      { "@type": "SportsTeam", name: "Cameroun" },
      { "@type": "SportsTeam", name: "Ghana" },
    ],
    description: "La 35e édition de la Coupe d'Afrique des Nations se déroule au Maroc du 21 décembre 2025 au 18 janvier 2026, avec 24 équipes participantes.",
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: "CAN 2025", href: "/can-2025" },
  ];

  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* SportsEvent Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sportsEventJsonLd) }}
      />

      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <div className="container-main py-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-[#022a27] via-[#04453f] to-[#4a8000] py-16 md:py-24 overflow-hidden">
          {/* Moroccan pattern overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'url(/images/can2025-pattern.png)',
              backgroundSize: 'auto 200%',
              backgroundRepeat: 'repeat',
              backgroundPosition: 'center',
            }}
          />

          <div className="container-main relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Tournament Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <svg className="w-5 h-5 text-[#9DFF20]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-bold text-sm uppercase tracking-wide">35ème édition</span>
              </div>

              {/* Main Title - H1 for SEO */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {locale === "fr" ? "CAN 2025 Maroc" : locale === "en" ? "AFCON 2025 Morocco" : "CAN 2025 Marruecos"}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-6">
                {locale === "fr" ? "Coupe d'Afrique des Nations" : locale === "en" ? "Africa Cup of Nations" : "Copa Africana de Naciones"}
              </p>

              {/* Tournament Info */}
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8 text-white/80">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">21 Déc 2025 - 18 Jan 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">{locale === "fr" ? "Maroc" : locale === "en" ? "Morocco" : "Marruecos"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-medium">24 {locale === "fr" ? "équipes" : locale === "en" ? "teams" : "equipos"}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-[#9DFF20] mb-1">6</div>
                  <div className="text-sm text-white/80">{locale === "fr" ? "Groupes" : locale === "en" ? "Groups" : "Grupos"}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-[#9DFF20] mb-1">52</div>
                  <div className="text-sm text-white/80">{locale === "fr" ? "Matchs" : locale === "en" ? "Matches" : "Partidos"}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-[#9DFF20] mb-1">6</div>
                  <div className="text-sm text-white/80">{locale === "fr" ? "Stades" : locale === "en" ? "Stadiums" : "Estadios"}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-[#9DFF20] mb-1">29</div>
                  <div className="text-sm text-white/80">{locale === "fr" ? "Jours" : locale === "en" ? "Days" : "Días"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 48h1440V0s-187.5 48-720 48S0 0 0 0v48z" fill="#F6F6F6"/>
            </svg>
          </div>
        </section>

        {/* Groups Section - targeting "groupes CAN 2025" */}
        <section id="groupes" className="container-main py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block px-4 py-2 bg-[#04453f]/10 rounded-full mb-4">
              <span className="text-[#04453f] font-bold text-sm uppercase tracking-wide">Groupes officiels</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("groups")}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t("groupsDescription")}
            </p>
          </div>

          {standingsData?.children?.length > 0 ? (
            // Show standings with points once tournament starts
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {standingsData.children.map((group: any, groupIdx: number) => {
                const groupName = group.name?.replace('Group ', '') || group.abbreviation || '';
                const standings = group.standings?.entries || [];
                const gradients = [
                  'from-emerald-600 to-teal-600',
                  'from-blue-600 to-cyan-600',
                  'from-purple-600 to-pink-600',
                  'from-orange-600 to-red-600',
                  'from-yellow-600 to-orange-600',
                  'from-indigo-600 to-blue-600'
                ];

                return (
                  <div key={group.id || groupName} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                    <div className={`bg-gradient-to-br ${gradients[groupIdx % 6]} px-6 py-4`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{groupName}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Groupe {groupName}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <ul className="space-y-1">
                        {standings.map((entry: any, idx: number) => (
                          <li key={entry.team?.id || idx} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 rounded-full">
                              {idx + 1}
                            </span>
                            {entry.team?.flagUrl && (
                              <div className="w-8 h-6 rounded overflow-hidden shadow-sm">
                                <Image
                                  src={entry.team.flagUrl}
                                  alt={entry.team.displayName || entry.team.name}
                                  width={32}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="font-semibold text-gray-900 flex-1">
                              {entry.team?.displayName || entry.team?.name}
                            </span>
                            <div className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-full">
                              <span className="text-xs font-bold text-gray-700">
                                {entry.stats?.find((s: any) => s.name === 'points')?.value || 0}
                              </span>
                              <span className="text-xs text-gray-500">pts</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : groupsData.length > 0 ? (
            // Show groups from schedule before tournament starts
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupsData.map((group: any, groupIdx: number) => {
                const gradients = [
                  'from-emerald-600 to-teal-600',
                  'from-blue-600 to-cyan-600',
                  'from-purple-600 to-pink-600',
                  'from-orange-600 to-red-600',
                  'from-yellow-600 to-orange-600',
                  'from-indigo-600 to-blue-600'
                ];

                return (
                  <div key={group.abbreviation} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                    <div className={`bg-gradient-to-br ${gradients[groupIdx % 6]} px-6 py-4`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{group.abbreviation}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Groupe {group.abbreviation}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <ul className="space-y-1">
                        {group.teams.map((team: any, idx: number) => (
                          <li key={team.id || idx} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-100 rounded-full">
                              {idx + 1}
                            </span>
                            {team.flagUrl && (
                              <div className="w-8 h-6 rounded overflow-hidden shadow-sm">
                                <Image
                                  src={team.flagUrl}
                                  alt={team.displayName || team.name}
                                  width={32}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="font-semibold text-gray-900 flex-1">
                              {team.displayName || team.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg">
                {locale === "fr" ? "Les groupes seront affichés prochainement." :
                 locale === "en" ? "Groups will be displayed soon." :
                 "Los grupos se mostrarán pronto."}
              </p>
            </div>
          )}
        </section>

        {/* Scheduled Matches Section */}
        <section id="calendrier" className="bg-white py-12 md:py-16">
          <div className="container-main">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-block px-4 py-2 bg-[#9DFF20]/20 rounded-full mb-4">
                <span className="text-[#04453f] font-bold text-sm uppercase tracking-wide">Programme complet</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {locale === "fr" ? "Calendrier des matchs" : locale === "en" ? "Match schedule" : "Calendario de partidos"}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {locale === "fr" ? "Tous les matchs de la CAN 2025 avec horaires et stades" : locale === "en" ? "All CAN 2025 matches with schedules and venues" : "Todos los partidos con horarios y estadios"}
              </p>
            </div>

            {scheduleData?.events?.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                {scheduleData.events.slice(0, 12).map((event: any) => {
                  const competition = event.competitions?.[0];
                  const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home')?.team;
                  const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away')?.team;
                  const matchDate = new Date(event.date);
                  const status = competition?.status;

                  return (
                    <div key={event.id} className="bg-white rounded-2xl p-4 md:p-6 border-2 border-gray-100 hover:border-[#9DFF20] hover:shadow-lg transition-all">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        {/* Date & Time */}
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-semibold text-gray-600">
                              {matchDate.toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "es-ES", {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <span className="text-lg font-black text-gray-900">
                            {matchDate.toLocaleTimeString(locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "es-ES", {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Teams */}
                        <div className="space-y-3">
                          {/* Home Team */}
                          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-3 flex-1">
                              {homeTeam?.flagUrl && (
                                <div className="w-12 h-9 rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-gray-200">
                                  <Image
                                    src={homeTeam.flagUrl}
                                    alt={homeTeam.displayName || homeTeam.name}
                                    width={48}
                                    height={36}
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <span className="font-bold text-gray-900 text-base">{homeTeam?.displayName || homeTeam?.name}</span>
                            </div>
                            {status?.type?.completed && (
                              <span className="text-2xl font-black text-gray-900 min-w-[2rem] text-right">
                                {competition?.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'}
                              </span>
                            )}
                          </div>

                          {/* VS Badge */}
                          <div className="flex items-center justify-center">
                            <span className="px-4 py-1.5 bg-gradient-to-r from-[#04453f] to-[#345C00] text-white text-xs font-bold rounded-full uppercase tracking-wide">
                              VS
                            </span>
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-3 flex-1">
                              {awayTeam?.flagUrl && (
                                <div className="w-12 h-9 rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-gray-200">
                                  <Image
                                    src={awayTeam.flagUrl}
                                    alt={awayTeam.displayName || awayTeam.name}
                                    width={48}
                                    height={36}
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <span className="font-bold text-gray-900 text-base">{awayTeam?.displayName || awayTeam?.name}</span>
                            </div>
                            {status?.type?.completed && (
                              <span className="text-2xl font-black text-gray-900 min-w-[2rem] text-right">
                                {competition?.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Venue */}
                        {event.venue?.displayName && (
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600">{event.venue.displayName}</span>
                          </div>
                        )}
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center gap-6">
                        {/* Date & Time */}
                        <div className="flex flex-col items-center justify-center min-w-[100px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                          <span className="text-xs font-bold text-gray-500 uppercase mb-1">
                            {matchDate.toLocaleDateString(locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "es-ES", {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-xl font-black text-gray-900">
                            {matchDate.toLocaleTimeString(locale === "fr" ? "fr-FR" : locale === "en" ? "en-US" : "es-ES", {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Teams Container */}
                        <div className="flex-1 flex items-center justify-between gap-6">
                          {/* Home Team */}
                          <div className="flex items-center gap-4 flex-1 justify-end">
                            <span className="font-bold text-gray-900 text-lg text-right">{homeTeam?.displayName || homeTeam?.name}</span>
                            {homeTeam?.flagUrl && (
                              <div className="w-14 h-10 rounded-lg overflow-hidden shadow-md border-2 border-gray-200">
                                <Image
                                  src={homeTeam.flagUrl}
                                  alt={homeTeam.displayName || homeTeam.name}
                                  width={56}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* VS or Score */}
                          <div className="flex items-center justify-center min-w-[120px]">
                            {status?.type?.completed ? (
                              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-xl">
                                <span className="text-3xl font-black text-white">{competition?.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'}</span>
                                <span className="text-2xl font-black text-white/50">-</span>
                                <span className="text-3xl font-black text-white">{competition?.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'}</span>
                              </div>
                            ) : (
                              <span className="px-6 py-3 bg-gradient-to-r from-[#04453f] to-[#345C00] text-white text-sm font-bold rounded-xl uppercase tracking-wider">VS</span>
                            )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-4 flex-1">
                            {awayTeam?.flagUrl && (
                              <div className="w-14 h-10 rounded-lg overflow-hidden shadow-md border-2 border-gray-200">
                                <Image
                                  src={awayTeam.flagUrl}
                                  alt={awayTeam.displayName || awayTeam.name}
                                  width={56}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <span className="font-bold text-gray-900 text-lg">{awayTeam?.displayName || awayTeam?.name}</span>
                          </div>
                        </div>

                        {/* Venue */}
                        {event.venue?.displayName && (
                          <div className="flex items-center gap-2 min-w-[180px] bg-gray-50 rounded-xl px-4 py-3">
                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate font-medium">{event.venue.displayName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-lg text-gray-500 font-medium">
                  {locale === "fr" ? "Le calendrier sera disponible prochainement." :
                   locale === "en" ? "Schedule will be available soon." :
                   "El calendario estará disponible pronto."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Key Players Section - targeting player name keywords */}
        <section id="joueurs" className="container-main py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block px-4 py-2 bg-orange-100 rounded-full mb-4">
              <span className="text-orange-700 font-bold text-sm uppercase tracking-wide">⭐ Stars du tournoi</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("keyPlayers.title")}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {locale === "fr" ? "Les meilleurs buteurs et joueurs clés de la CAN 2025" : locale === "en" ? "Top scorers and key players of AFCON 2025" : "Máximos goleadores y jugadores clave de la CAN 2025"}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {scorersData?.categories?.[0]?.leaders?.slice(0, 12).map((leader: any) => {
              const athlete = leader.athlete;
              const playerName = athlete?.displayName || athlete?.fullName || athlete?.name || '';
              const teamName = athlete?.team?.displayName || athlete?.team?.name || '';
              const stats = leader.value || leader.displayValue || '0';

              return (
                <div key={athlete?.id || playerName} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  {athlete?.headshot?.href ? (
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={athlete.headshot.href}
                        alt={playerName}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#04453f] to-[#4a8000] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {playerName.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1">{playerName}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {athlete?.team?.flagUrl && (
                      <Image
                        src={athlete.team.flagUrl}
                        alt={teamName}
                        width={16}
                        height={12}
                        className="rounded"
                      />
                    )}
                    <p className="text-xs text-[#04453f] font-medium">{teamName}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats} {locale === "fr" ? "buts" : locale === "en" ? "goals" : "goles"}</p>
                </div>
              );
            })}
          </div>

          {(!scorersData || !scorersData.categories?.length) && (
            <div className="text-center py-8">
              <p className="text-gray-500">{scorersData?.message || locale === "fr" ? "Les données seront disponibles une fois le tournoi commencé." : locale === "en" ? "Data will be available once the tournament starts." : "Los datos estarán disponibles una vez que comience el torneo."}</p>
            </div>
          )}
        </section>

        {/* Latest News Section */}
        <section id="actualites" className="bg-white py-12 md:py-16">
          <div className="container-main">
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-block px-4 py-2 bg-blue-100 rounded-full mb-4">
                <span className="text-blue-700 font-bold text-sm uppercase tracking-wide">📰 Dernières infos</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {t("latestNews")}
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {locale === "fr" ? "Toute l'actualité de la CAN 2025 : listes, transferts, matchs et analyses" : locale === "en" ? "All AFCON 2025 news: squads, transfers, matches and analysis" : "Todas las noticias: listas, fichajes, partidos y análisis"}
              </p>
            </div>

            <Suspense fallback={<ArticleGridSkeleton count={9} />}>
              <CAN2025Articles locale={locale} />
            </Suspense>

            <div className="text-center mt-8">
              <Link
                href="/category/can-2025"
                className="inline-block px-8 py-3 bg-[#04453f] text-white font-bold hover:bg-[#022a27] transition-colors rounded-lg"
              >
                {t("seeAllArticles")}
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section - for featured snippets */}
        <section id="faq" className="container-main py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-4">
              <span className="text-purple-700 font-bold text-sm uppercase tracking-wide">❓ Questions fréquentes</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t("faq.title")}
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {locale === "fr" ? "Tout ce que vous devez savoir sur la CAN 2025" : locale === "en" ? "Everything you need to know about AFCON 2025" : "Todo lo que necesitas saber sobre la CAN 2025"}
            </p>
          </div>

          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border-2 border-gray-100 hover:border-[#9DFF20]"
                open={idx === 0}
              >
                <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer font-bold text-gray-900 hover:text-[#04453f] transition-colors">
                  <span className="pr-4">{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 w-8 h-8 bg-[#04453f]/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#04453f] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 md:px-6 pb-5 md:pb-6 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Tournament Favorites Section */}
        <section className="bg-gradient-to-r from-[#022a27] to-[#04453f] py-12 md:py-16">
          <div className="container-main">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                {t("favorites")}
              </h2>
              <p className="text-base md:text-lg text-white/80">{t("favoritesDescription")}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
              {[
                { name: "Maroc", reason: locale === "fr" ? "Pays hôte" : locale === "en" ? "Host country" : "País anfitrión", odds: "3.50" },
                { name: "Sénégal", reason: locale === "fr" ? "Champion 2022" : locale === "en" ? "2022 Champion" : "Campeón 2022", odds: "5.00" },
                { name: "Égypte", reason: locale === "fr" ? "7x Champion" : locale === "en" ? "7x Champion" : "7 veces campeón", odds: "6.00" },
                { name: "Nigeria", reason: locale === "fr" ? "Super Eagles" : "Super Eagles", odds: "5.50" },
                { name: "Côte d'Ivoire", reason: locale === "fr" ? "Champion 2023" : locale === "en" ? "2023 Champion" : "Campeón 2023", odds: "7.00" },
              ].map((team) => (
                <div key={team.name} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center hover:bg-white/20 transition-colors">
                  <h3 className="font-bold text-white text-lg mb-1">{team.name}</h3>
                  <p className="text-white/70 text-sm">{team.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

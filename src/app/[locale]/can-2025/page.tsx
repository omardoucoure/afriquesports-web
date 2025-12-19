import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
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

// CAN 2025 Groups data
const CAN_2025_GROUPS = {
  A: ["Maroc", "Mali", "Zambie", "Comores"],
  B: ["Égypte", "Afrique du Sud", "Angola", "Zimbabwe"],
  C: ["Nigeria", "Tunisie", "Ouganda", "Tanzanie"],
  D: ["Sénégal", "RD Congo", "Bénin", "Botswana"],
  E: ["Algérie", "Burkina Faso", "Guinée équatoriale", "Soudan"],
  F: ["Côte d'Ivoire", "Cameroun", "Gabon", "Mozambique"],
};

// Team data with flags and key players
const TEAM_DATA: Record<string, { flag: string; keyPlayers: string[]; nickname: string }> = {
  senegal: {
    flag: "sn",
    keyPlayers: ["Sadio Mané", "Nicolas Jackson", "Édouard Mendy", "Kalidou Koulibaly", "Ismaïla Sarr"],
    nickname: "Lions de la Teranga",
  },
  morocco: {
    flag: "ma",
    keyPlayers: ["Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri", "Sofyan Amrabat", "Bono"],
    nickname: "Lions de l'Atlas",
  },
  algeria: {
    flag: "dz",
    keyPlayers: ["Riyad Mahrez", "Ismaël Bennacer", "Saïd Benrahma", "Youcef Atal"],
    nickname: "Les Fennecs",
  },
  nigeria: {
    flag: "ng",
    keyPlayers: ["Victor Osimhen", "Ademola Lookman", "Mohammed Kudus", "Wilfred Ndidi", "William Troost-Ekong"],
    nickname: "Super Eagles",
  },
  egypt: {
    flag: "eg",
    keyPlayers: ["Mohamed Salah", "Omar Marmoush", "Mohamed Elneny", "Ahmed Hegazi"],
    nickname: "Les Pharaons",
  },
  ivoryCoast: {
    flag: "ci",
    keyPlayers: ["Sébastien Haller", "Franck Kessié", "Simon Adingra", "Serge Aurier"],
    nickname: "Les Éléphants",
  },
  cameroon: {
    flag: "cm",
    keyPlayers: ["André-Frank Zambo Anguissa", "Karl Toko Ekambi", "Vincent Aboubakar", "Eric Maxim Choupo-Moting"],
    nickname: "Lions Indomptables",
  },
  ghana: {
    flag: "gh",
    keyPlayers: ["Mohammed Kudus", "Thomas Partey", "Jordan Ayew", "Inaki Williams"],
    nickname: "Black Stars",
  },
};

// Key players to watch
const KEY_PLAYERS = [
  { name: "Mohamed Salah", team: "Égypte", club: "Liverpool", image: "/players/salah.jpg", position: "Ailier droit" },
  { name: "Victor Osimhen", team: "Nigeria", club: "Galatasaray", image: "/players/osimhen.jpg", position: "Attaquant" },
  { name: "Achraf Hakimi", team: "Maroc", club: "PSG", image: "/players/hakimi.jpg", position: "Arrière droit" },
  { name: "Sadio Mané", team: "Sénégal", club: "Al-Nassr", image: "/players/mane.jpg", position: "Ailier gauche" },
  { name: "Nicolas Jackson", team: "Sénégal", club: "Chelsea", image: "/players/jackson.jpg", position: "Attaquant" },
  { name: "Ademola Lookman", team: "Nigeria", club: "Atalanta", image: "/players/lookman.jpg", position: "Ailier" },
];

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

async function CAN2025Articles() {
  const locale = await getLocale();

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
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Hero Section with CAN 2025 branding */}
        <section className="bg-gradient-to-r from-[#022a27] via-[#04453f] to-[#4a8000] py-8 md:py-12">
          <div className="container-main">
            <div className="text-center md:text-left">
              <span className="inline-block px-4 py-1 bg-white/10 text-white text-sm font-bold uppercase mb-4 rounded-full">
                {t("subtitle")}
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
                {t("title")}
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl">
                {t("dates")}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">&#127942;</span>
                  <span>{t("host")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">&#9917;</span>
                  <span>{t("teams")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">&#127967;</span>
                  <span>{t("stadiums")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Groups Section - targeting "groupes CAN 2025" */}
        <section className="container-main py-8 md:py-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
              {t("groups")}
            </h2>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>
          <p className="text-gray-600 mb-8">{t("groupsDescription")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Object.entries(CAN_2025_GROUPS).map(([group, teams]) => (
              <div key={group} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <h3 className="text-lg font-bold text-[#04453f] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#04453f] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {group}
                  </span>
                  Groupe {group}
                </h3>
                <ul className="space-y-2">
                  {teams.map((team, idx) => (
                    <li key={team} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-500 w-4">{idx + 1}</span>
                      <span className="font-medium text-gray-900">{team}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Team Lists Section - targeting "liste Sénégal CAN 2025" */}
        <section className="bg-white py-8 md:py-12">
          <div className="container-main">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
                {t("teamLists")}
              </h2>
              <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
            </div>
            <p className="text-gray-600 mb-8">{t("teamListsDescription")}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {Object.entries(TEAM_DATA).map(([key, data]) => (
                <Link
                  key={key}
                  href={`/category/afrique/${key}`}
                  className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 md:p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-[#04453f]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex items-center justify-center text-2xl">
                      {/* Flag emoji based on country code */}
                      {data.flag === "sn" && "&#127480;&#127475;"}
                      {data.flag === "ma" && "&#127474;&#127462;"}
                      {data.flag === "dz" && "&#127465;&#127487;"}
                      {data.flag === "ng" && "&#127475;&#127468;"}
                      {data.flag === "eg" && "&#127466;&#127468;"}
                      {data.flag === "ci" && "&#127464;&#127470;"}
                      {data.flag === "cm" && "&#127464;&#127474;"}
                      {data.flag === "gh" && "&#127468;&#127469;"}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-[#04453f] transition-colors">
                        {t(`teams.${key}`)}
                      </h3>
                      <p className="text-xs text-gray-500">{data.nickname}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                      {locale === "fr" ? "Joueurs clés" : locale === "en" ? "Key players" : "Jugadores clave"}
                    </p>
                    {data.keyPlayers.slice(0, 3).map((player) => (
                      <p key={player} className="text-sm text-gray-700">{player}</p>
                    ))}
                    <p className="text-xs text-[#04453f] font-medium mt-2">
                      {t("viewList")} &rarr;
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Key Players Section - targeting player name keywords */}
        <section className="container-main py-8 md:py-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
              {t("keyPlayers.title")}
            </h2>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {KEY_PLAYERS.map((player) => (
              <div key={player.name} className="bg-white rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#04453f] to-[#4a8000] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {player.name.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900 text-sm md:text-base">{player.name}</h3>
                <p className="text-xs text-[#04453f] font-medium">{player.team}</p>
                <p className="text-xs text-gray-500">{player.club}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest News Section */}
        <section className="bg-white py-8 md:py-12">
          <div className="container-main">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
                {t("latestNews")}
              </h2>
              <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
            </div>

            <Suspense fallback={<ArticleGridSkeleton count={9} />}>
              <CAN2025Articles />
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
        <section className="container-main py-8 md:py-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 whitespace-nowrap">
              {t("faq.title")}
            </h2>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group bg-white rounded-lg shadow-sm"
                open={idx === 0}
              >
                <summary className="flex items-center justify-between p-4 md:p-6 cursor-pointer font-bold text-gray-900 hover:text-[#04453f]">
                  <span>{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 text-[#04453f] group-open:rotate-180 transition-transform">
                    &#9660;
                  </span>
                </summary>
                <div className="px-4 md:px-6 pb-4 md:pb-6 text-gray-700">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Tournament Favorites Section */}
        <section className="bg-gradient-to-r from-[#022a27] to-[#04453f] py-8 md:py-12">
          <div className="container-main">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                {t("favorites")}
              </h2>
              <p className="text-white/80">{t("favoritesDescription")}</p>
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

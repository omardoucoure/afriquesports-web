import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import {
  HeroSection,
  HeroSectionSkeleton,
  ArticleCardHorizontalSkeleton,
  RankingSection,
  RankingSectionSkeleton,
  LoadMoreArticles,
} from "@/components/articles";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget, TopScorersWidget, TopScorersWidgetSkeleton, type TrendingArticle } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";
import { getTrendingPostsByRange } from "@/lib/db";
import { generateWebsiteJsonLd, generateFaqJsonLd, getPageKeywords } from "@/lib/seo";

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://www.afriquesports.net";
  const canonicalUrl = locale === "fr" ? baseUrl : `${baseUrl}/${locale}`;

  const titles: Record<string, string> = {
    fr: "Afrique Sports - Actualités Football Africain | CAN 2025, Mercato, Résultats en Direct",
    en: "Afrique Sports - African Football News | AFCON 2025, Transfers, Live Results",
    es: "Afrique Sports - Noticias Fútbol Africano | CAN 2025, Fichajes, Resultados en Vivo",
  };

  const descriptions: Record<string, string> = {
    fr: "Toute l'actualité du football africain : CAN 2025 au Maroc, mercato, résultats, classements. Mohamed Salah, Victor Osimhen, Achraf Hakimi. Sénégal, Maroc, Algérie, Nigeria, Cameroun.",
    en: "All African football news: AFCON 2025 in Morocco, transfers, results, standings. Mohamed Salah, Victor Osimhen, Achraf Hakimi. Senegal, Morocco, Algeria, Nigeria, Cameroon.",
    es: "Todas las noticias del fútbol africano: CAN 2025 en Marruecos, fichajes, resultados, clasificaciones. Mohamed Salah, Victor Osimhen, Achraf Hakimi. Senegal, Marruecos, Argelia, Nigeria.",
  };

  const keywords = getPageKeywords("home");

  return {
    title: titles[locale] || titles.fr,
    description: descriptions[locale] || descriptions.fr,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fr-FR": baseUrl,
        "en-US": `${baseUrl}/en`,
        "es-ES": `${baseUrl}/es`,
        "x-default": baseUrl,
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
          alt: "Afrique Sports - Football Africain CAN 2025",
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
        alt: "Afrique Sports - Football Africain",
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

// FAQ data for homepage - helps with featured snippets
const homepageFaqs = [
  {
    question: "Quand commence la CAN 2025 ?",
    answer: "La Coupe d'Afrique des Nations 2025 se déroule au Maroc du 21 décembre 2025 au 18 janvier 2026. Le match d'ouverture oppose le Maroc aux Comores au Stade Prince Moulay Abdellah de Rabat.",
  },
  {
    question: "Qui sont les favoris de la CAN 2025 ?",
    answer: "Les favoris de la CAN 2025 sont le Maroc (pays hôte et meilleure équipe africaine au classement FIFA), l'Égypte (7 fois champion), le Sénégal (champion 2022), le Nigeria et la Côte d'Ivoire (champion 2023).",
  },
  {
    question: "Quels sont les meilleurs joueurs africains en 2025 ?",
    answer: "Les meilleurs joueurs africains en 2025 sont Mohamed Salah (Égypte/Liverpool), Victor Osimhen (Nigeria), Achraf Hakimi (Maroc/PSG), Sadio Mané (Sénégal), Nicolas Jackson (Sénégal/Chelsea) et Ademola Lookman (Nigeria).",
  },
  {
    question: "Où regarder les matchs de la CAN 2025 ?",
    answer: "La CAN 2025 est diffusée sur beIN Sports, Canal+ Afrique, et les chaînes nationales des pays participants. Suivez les résultats en direct sur Afrique Sports.",
  },
];

async function HeroArticlesSection() {
  const t = await getTranslations("home");
  const tArticle = await getTranslations("article");
  const locale = await getLocale();

  try {
    // Fetch featured post from "article-du-jour" category and latest posts
    const [featuredPosts, latestPosts] = await Promise.all([
      DataFetcher.fetchPosts({ per_page: "1", categories: "30615", locale }), // article-du-jour category
      DataFetcher.fetchPosts({ per_page: "5", locale }),
    ]);

    // Use article-du-jour post if available, otherwise use the first latest post
    const featuredArticle = featuredPosts?.[0] || latestPosts?.[0];

    // Filter out the featured article from latest posts to avoid duplication
    const filteredPosts = latestPosts?.filter(
      (post) => post.id !== featuredArticle?.id
    ) || [];

    if (!featuredArticle || filteredPosts.length < 4) {
      return <HeroSectionSkeleton />;
    }

    return (
      <HeroSection
        featuredArticle={featuredArticle}
        leftArticles={[filteredPosts[0], filteredPosts[1]]}
        rightArticles={[filteredPosts[2], filteredPosts[3]]}
        translations={{
          trending: t("trending"),
          latest: t("latest"),
          by: tArticle("by"),
        }}
      />
    );
  } catch (error) {
    console.error('[HeroArticlesSection] Error fetching articles:', error);
    return <HeroSectionSkeleton />;
  }
}

async function LatestArticlesSection() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  try {
    const articles = await DataFetcher.fetchPosts({ per_page: "20", offset: "5", locale });

    if (!articles || articles.length === 0) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <ArticleCardHorizontalSkeleton key={i} />
          ))}
        </div>
      );
    }

    return (
      <LoadMoreArticles
        initialArticles={articles}
        initialOffset={5}
        perPage={20}
        loadMoreText={t("loadMore")}
        loadingText={t("loading")}
        noMoreText={t("noMoreArticles")}
      />
    );
  } catch (error) {
    console.error('[LatestArticlesSection] Error fetching articles:', error);
    return (
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <ArticleCardHorizontalSkeleton key={i} />
        ))}
      </div>
    );
  }
}

async function RankingArticlesSection() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  try {
    // Fetch posts from classement/ranking category
    const articles = await DataFetcher.fetchPostsByCategory("classement", { per_page: "3", locale });

    if (!articles || articles.length < 3) {
      // Fallback: fetch from another related category or just use latest
      const fallbackArticles = await DataFetcher.fetchPosts({ per_page: "3", locale });
      return (
        <RankingSection
          articles={fallbackArticles || []}
          title={t("rankings")}
          seeMoreText={t("seeMore")}
        />
      );
    }

    return (
      <RankingSection
        articles={articles}
        title={t("rankings")}
        seeMoreText={t("seeMore")}
      />
    );
  } catch (error) {
    console.error('[RankingArticlesSection] Error fetching articles:', error);
    return <RankingSectionSkeleton />;
  }
}

async function MostReadSection() {
  const locale = await getLocale();

  try {
    // Fetch trending posts directly from database (last 7 days)
    const trending = await getTrendingPostsByRange(7, 5);

    if (trending && trending.length > 0) {
      // Transform trending data to match article format for MostReadWidget
      const trendingArticles = trending.map((item) => ({
        id: parseInt(item.post_id as string),
        slug: item.post_slug,
        title: { rendered: item.post_title },
        _embedded: item.post_image ? {
          'wp:featuredmedia': [{ source_url: item.post_image }]
        } : undefined,
        link: `https://www.afriquesports.net/${item.post_category || 'football'}/${item.post_slug}`,
        viewCount: item.total_count || item.count,
      }));

      return <MostReadWidget articles={trendingArticles} />;
    }
  } catch (error) {
    console.error('Error fetching trending posts:', error);
  }

  // Fallback to latest posts if trending is empty or fails
  const articles = await DataFetcher.fetchPosts({ per_page: "5", locale });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");

  // Generate JSON-LD schemas for homepage
  const websiteJsonLd = generateWebsiteJsonLd(locale);
  const faqJsonLd = generateFaqJsonLd(homepageFaqs);

  return (
    <>
      {/* WebSite Schema with SearchAction */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      {/* FAQ Schema for featured snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20 lg:pb-0">
        {/* Hero section with featured article */}
        <section className="container-main py-4 md:py-6">
          <Suspense fallback={<HeroSectionSkeleton />}>
            <HeroArticlesSection />
          </Suspense>
        </section>

        {/* Ranking section */}
        <Suspense fallback={<RankingSectionSkeleton />}>
          <RankingArticlesSection />
        </Suspense>

        {/* Main content with sidebar */}
        <div className="container-main py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Articles list */}
            <div className="flex-1">
              {/* Section header with gradient line */}
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-extrabold text-gray-900 whitespace-nowrap">
                  {t("latestArticles")}
                </h2>
                <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
              </div>

              <Suspense
                fallback={
                  <div className="space-y-4">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <ArticleCardHorizontalSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                <LatestArticlesSection />
              </Suspense>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-[340px] flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                {/* Most read */}
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <MostReadSection />
                </Suspense>

                {/* Top African Scorers in Europe */}
                <Suspense fallback={<TopScorersWidgetSkeleton />}>
                  <TopScorersWidget title={t("topScorers")} />
                </Suspense>

                {/* Key players */}
                <PlayersWidget />
              </div>
            </aside>
          </div>
        </div>

        {/* Most read section - mobile only */}
        <section className="lg:hidden container-main py-6 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-extrabold text-gray-900 whitespace-nowrap">
              {t("mostRead")}
            </h2>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>
          <Suspense fallback={<MostReadWidgetSkeleton />}>
            <MostReadSection />
          </Suspense>
        </section>

        {/* CAN 2025 section */}
        <section className="container-main py-6 md:py-8">
          <div className="bg-gradient-to-r from-[#022a27] to-[#4a8000] p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-[#04453f] text-white text-xs font-bold uppercase mb-3">
                  CAN 2025
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {t("can2025Title")}
                </h2>
                <p className="mt-2 text-white/80 max-w-xl">
                  {t("can2025Description")}
                </p>
              </div>
              <a
                href="/category/can-2025"
                className="flex-shrink-0 px-6 py-3 bg-[#04453f] text-white font-bold hover:bg-white hover:text-[#04453f] transition-colors"
              >
                {t("can2025Button")}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

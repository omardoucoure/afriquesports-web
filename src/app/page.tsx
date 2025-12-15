import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import {
  HeroSection,
  HeroSectionSkeleton,
  ArticleCardHorizontal,
  ArticleCardHorizontalSkeleton,
  RankingSection,
  RankingSectionSkeleton,
} from "@/components/articles";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget, TopScorersWidget, TopScorersWidgetSkeleton } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";

// ISR: Revalidate homepage every 60 seconds
export const revalidate = 60;

async function HeroArticlesSection() {
  const t = await getTranslations("home");
  const tArticle = await getTranslations("article");

  // Fetch featured post from "article-du-jour" category and latest posts
  const [featuredPosts, latestPosts] = await Promise.all([
    DataFetcher.fetchPosts({ per_page: "1", categories: "30615" }), // article-du-jour category
    DataFetcher.fetchPosts({ per_page: "5" }),
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
}

async function LatestArticlesSection() {
  const articles = await DataFetcher.fetchPosts({ per_page: "20", offset: "5" });

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
    <div className="space-y-4">
      {articles.map((article, index) => (
        <ArticleCardHorizontal
          key={article.id}
          article={article}
          priority={index < 3}
        />
      ))}
    </div>
  );
}

async function RankingArticlesSection() {
  const t = await getTranslations("home");

  // Fetch posts from classement/ranking category
  const articles = await DataFetcher.fetchPostsByCategory("classement", { per_page: "3" });

  if (!articles || articles.length < 3) {
    // Fallback: fetch from another related category or just use latest
    const fallbackArticles = await DataFetcher.fetchPosts({ per_page: "3" });
    return (
      <RankingSection
        articles={fallbackArticles}
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
}

async function MostReadSection() {
  const articles = await DataFetcher.fetchPosts({ per_page: "5" });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-[72px] md:pt-[88px] lg:pt-16 pb-20 lg:pb-0">
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

              {/* Load more button */}
              <div className="mt-8 text-center">
                <a
                  href="/category/actualites"
                  className="inline-block px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
                >
                  {t("seeMoreArticles")}
                </a>
              </div>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
              {/* Most read */}
              <Suspense fallback={<MostReadWidgetSkeleton />}>
                <MostReadSection />
              </Suspense>

              {/* Top African Scorers in Europe */}
              <Suspense fallback={<TopScorersWidgetSkeleton />}>
                <TopScorersWidget title="Top buteurs africains" />
              </Suspense>

              {/* Key players */}
              <PlayersWidget />
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

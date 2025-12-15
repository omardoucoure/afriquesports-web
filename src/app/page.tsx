import { Suspense } from "react";
import { Header, Footer } from "@/components/layout";
import { FeaturedArticle, FeaturedArticleSkeleton, ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget, RankingsWidget } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";

// Sample rankings data (will be replaced with API data)
const sampleRankings = [
  { position: 1, name: "PSG", points: 40, played: 15, won: 12, drawn: 4, lost: 0 },
  { position: 2, name: "Monaco", points: 33, played: 15, won: 10, drawn: 3, lost: 2 },
  { position: 3, name: "Marseille", points: 31, played: 15, won: 9, drawn: 4, lost: 2 },
  { position: 4, name: "Lille", points: 28, played: 15, won: 8, drawn: 4, lost: 3 },
  { position: 5, name: "Lyon", points: 26, played: 15, won: 7, drawn: 5, lost: 3 },
];

async function FeaturedSection() {
  const articles = await DataFetcher.fetchPosts({ per_page: "1" });

  if (!articles || articles.length === 0) {
    return <FeaturedArticleSkeleton />;
  }

  return <FeaturedArticle article={articles[0]} />;
}

async function LatestArticlesSection() {
  const articles = await DataFetcher.fetchPosts({ per_page: "9", offset: "1" });

  if (!articles || articles.length === 0) {
    return <ArticleGridSkeleton count={9} />;
  }

  return (
    <ArticleGrid
      articles={articles}
      columns={3}
      showCategory
      showDate
      priorityCount={3}
    />
  );
}

async function MostReadSection() {
  // For now, fetch latest articles - will be replaced with popular posts API
  const articles = await DataFetcher.fetchPosts({ per_page: "5" });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default function Home() {
  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-[104px] md:pt-[88px] lg:pt-16">
        {/* Featured article hero */}
        <section className="container-main py-4 md:py-6">
          <Suspense fallback={<FeaturedArticleSkeleton />}>
            <FeaturedSection />
          </Suspense>
        </section>

        {/* Main content with sidebar */}
        <div className="container-main py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Articles grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Dernières actualités
                </h2>
              </div>

              <Suspense fallback={<ArticleGridSkeleton count={9} />}>
                <LatestArticlesSection />
              </Suspense>

              {/* Load more button */}
              <div className="mt-8 text-center">
                <button className="px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors">
                  Voir plus d&apos;articles
                </button>
              </div>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
              {/* Most read */}
              <Suspense fallback={<MostReadWidgetSkeleton />}>
                <MostReadSection />
              </Suspense>

              {/* Rankings */}
              <RankingsWidget
                title="Classement"
                competition="Ligue 1"
                teams={sampleRankings}
              />

              {/* Key players */}
              <PlayersWidget />
            </aside>
          </div>
        </div>

        {/* Most read section - mobile only */}
        <section className="lg:hidden container-main py-6 border-t border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Les plus lus
          </h2>
          <Suspense fallback={<MostReadWidgetSkeleton />}>
            <MostReadSection />
          </Suspense>
        </section>

        {/* CAN 2025 section */}
        <section className="container-main py-6 md:py-8">
          <div className="bg-gradient-to-r from-[#345C00] to-[#4a8000] rounded-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-[#9DFF20] text-[#345C00] text-xs font-bold uppercase rounded mb-3">
                  CAN 2025
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Coupe d&apos;Afrique des Nations 2025
                </h2>
                <p className="mt-2 text-white/80 max-w-xl">
                  Suivez toute l&apos;actualité de la CAN 2025 au Maroc. Résultats, classements,
                  compositions d&apos;équipes et analyses.
                </p>
              </div>
              <a
                href="/category/can-2025"
                className="flex-shrink-0 px-6 py-3 bg-[#9DFF20] text-[#345C00] font-bold rounded-lg hover:bg-white transition-colors"
              >
                Voir les articles CAN 2025
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

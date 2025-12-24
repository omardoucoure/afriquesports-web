import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, Pagination } from "@/components/ui";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";
import { getTrendingPostsByRange } from "@/lib/mysql-db";

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ArticlesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: ArticlesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://www.afriquesports.net";
  const pagePath = "/articles";
  const canonicalUrl = locale === "fr" ? `${baseUrl}${pagePath}` : `${baseUrl}/${locale}${pagePath}`;

  return {
    title: "Tous les articles",
    description: "Retrouvez tous les articles d'actualité football africain sur Afrique Sports.",
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
      title: "Tous les articles | Afrique Sports",
      description: "Retrouvez tous les articles d'actualité football africain sur Afrique Sports.",
      type: "website",
      siteName: "Afrique Sports",
      url: canonicalUrl,
      images: [{ url: "https://www.afriquesports.net/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Tous les articles | Afrique Sports",
      description: "Retrouvez tous les articles d'actualité football africain sur Afrique Sports.",
      images: ["https://www.afriquesports.net/opengraph-image"],
    },
  };
}

async function ArticlesList({ page }: { page: number }) {
  const perPage = 20;
  const offset = (page - 1) * perPage;

  try {
    const articles = await DataFetcher.fetchPosts({
      per_page: perPage.toString(),
      offset: offset.toString(),
    });

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun article trouvé.</p>
        </div>
      );
    }

    // Estimate total pages based on whether we got a full page
    const hasMore = articles.length === perPage;
    // For a news site with many articles, we can estimate higher
    const estimatedTotalPages = hasMore ? Math.max(page + 5, 10) : page;

    return (
      <>
        <ArticleGrid
          articles={articles}
          columns={3}
          showCategory
          showDate
          priorityCount={page === 1 ? 6 : 0}
        />

        <div className="mt-8">
          <Pagination
            currentPage={page}
            totalPages={estimatedTotalPages}
            basePath="/articles"
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching articles:", error);
    return <ArticleGridSkeleton count={20} />;
  }
}

async function SidebarMostRead({ locale }: { locale: string }) {
  const t = await getTranslations("home");

  try {
    // Fetch trending posts directly from database (last 7 days, limit 5) filtered by locale
    const trending = await getTrendingPostsByRange(7, 5, locale);

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
        viewCount: Number(item.total_count || item.count || 0),
        author: item.post_author || 'Afrique Sports',
      }));

      return <MostReadWidget articles={trendingArticles} title={t("mostRead")} />;
    }
  } catch (error) {
    console.error('[SidebarMostRead] Error fetching trending posts:', error);
  }

  // Fallback: Show latest articles WITHOUT view counts
  const articles = await DataFetcher.fetchPosts({ per_page: "5", locale });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} title={t("mostRead")} />;
}

export default async function ArticlesPage({ params, searchParams }: ArticlesPageProps) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;
  const t = await getTranslations("home");

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Tous les articles", href: "/articles" },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20 lg:pb-0">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-main py-3 sm:py-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Page header */}
        <section className="container-main py-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("latestArticles")}
            </h1>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>
          <p className="text-gray-600">
            Retrouvez toutes les dernières actualités du football africain
          </p>
        </section>

        {/* Main content with sidebar */}
        <div className="container-main pb-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Articles grid */}
            <div className="flex-1">
              <Suspense fallback={<ArticleGridSkeleton count={20} />}>
                <ArticlesList page={currentPage} />
              </Suspense>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
              <div className="sticky top-20">
                {/* Most read */}
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead locale={locale} />
                </Suspense>

                {/* Key players */}
                <div className="mt-6">
                  <PlayersWidget />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

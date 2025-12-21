import { Suspense } from "react";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, Pagination } from "@/components/ui";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";
import { getTrendingPostsByRange } from "@/lib/supabase-db";
import { getTranslations } from "next-intl/server";

// ISR: Revalidate mercato page every 60 seconds
export const revalidate = 60;

interface MercatoPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: MercatoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = "https://www.afriquesports.net";
  const pagePath = "/mercato";
  const canonicalUrl = locale === "fr" ? `${baseUrl}${pagePath}` : `${baseUrl}/${locale}${pagePath}`;

  return {
    title: "Mercato",
    description: "Les dernières rumeurs et transferts du mercato africain et européen. Indiscrétions, officialisations et analyses des mouvements de joueurs.",
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
      title: "Mercato | Afrique Sports",
      description: "Les dernières rumeurs et transferts du mercato africain et européen.",
      type: "website",
      siteName: "Afrique Sports",
      url: canonicalUrl,
      images: [{ url: "https://www.afriquesports.net/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Mercato | Afrique Sports",
      description: "Les dernières rumeurs et transferts du mercato africain et européen.",
      images: ["https://www.afriquesports.net/opengraph-image"],
    },
  };
}

const breadcrumbItems = [
  { label: "Accueil", href: "/" },
  { label: "Mercato", href: "/mercato" },
];

async function MercatoArticles({ page }: { page: number }) {
  const perPage = 12;
  const offset = (page - 1) * perPage;

  try {
    const articles = await DataFetcher.fetchPostsByCategory("mercato", {
      per_page: perPage.toString(),
      offset: offset.toString(),
    });

    if (!articles || articles.length === 0) {
      // Fallback to latest posts if mercato category doesn't exist
      const latestArticles = await DataFetcher.fetchPosts({
        per_page: perPage.toString(),
        offset: offset.toString(),
      });

      if (!latestArticles || latestArticles.length === 0) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun article disponible pour le moment.</p>
          </div>
        );
      }

      return (
        <ArticleGrid
          articles={latestArticles}
          columns={3}
          showCategory
          showDate
          priorityCount={page === 1 ? 6 : 0}
        />
      );
    }

    const hasMore = articles.length === perPage;
    const estimatedTotalPages = hasMore ? page + 1 : page;

    return (
      <>
        <ArticleGrid
          articles={articles}
          columns={3}
          showCategory
          showDate
          priorityCount={page === 1 ? 6 : 0}
        />

        {(page > 1 || hasMore) && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={estimatedTotalPages}
              basePath="/mercato"
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Error fetching mercato articles:", error);
    return <ArticleGridSkeleton count={12} />;
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

export default async function MercatoPage({ params, searchParams }: MercatoPageProps) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Mercato
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Les dernières rumeurs et transferts du mercato africain et européen.
            Indiscrétions, officialisations et analyses des mouvements de joueurs.
          </p>
        </section>

        {/* Main content with sidebar */}
        <div className="container-main py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Articles grid */}
            <div className="flex-1">
              <Suspense fallback={<ArticleGridSkeleton count={12} />}>
                <MercatoArticles page={currentPage} />
              </Suspense>
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead locale={locale} />
                </Suspense>
                <PlayersWidget />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

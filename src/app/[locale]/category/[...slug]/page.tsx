import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, Pagination } from "@/components/ui";
import { generateBreadcrumbItems } from "@/components/ui/breadcrumb-utils";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";

// ISR: Revalidate category pages every 60 seconds
export const revalidate = 60;

// Category display names and descriptions
const categoryMeta: Record<string, { title: string; description: string }> = {
  afrique: {
    title: "Football Africain",
    description: "Toute l'actualité du football africain : CAN, championnats nationaux, sélections et transferts des joueurs africains.",
  },
  europe: {
    title: "Football Européen",
    description: "L'actualité du football européen : Ligue des Champions, Premier League, Liga, Serie A, Bundesliga et Ligue 1.",
  },
  "can-2025": {
    title: "CAN 2025",
    description: "Suivez toute l'actualité de la Coupe d'Afrique des Nations 2025 au Maroc : résultats, classements, calendrier et analyses.",
  },
  mercato: {
    title: "Mercato",
    description: "Les dernières rumeurs et transferts du mercato : indiscrétions, officialisations et analyses des mouvements de joueurs.",
  },
  youtube: {
    title: "Vidéos",
    description: "Les meilleures vidéos de football africain : résumés de matchs, interviews, analyses tactiques et moments forts.",
  },
  // Country subcategories
  senegal: {
    title: "Football Sénégalais",
    description: "L'actualité du football sénégalais : Lions de la Teranga, Ligue 1 sénégalaise et joueurs sénégalais à l'étranger.",
  },
  cameroun: {
    title: "Football Camerounais",
    description: "L'actualité du football camerounais : Lions Indomptables, Elite One et joueurs camerounais à l'étranger.",
  },
  "cote-divoire": {
    title: "Football Ivoirien",
    description: "L'actualité du football ivoirien : Éléphants, Ligue 1 ivoirienne et joueurs ivoiriens à l'étranger.",
  },
  algerie: {
    title: "Football Algérien",
    description: "L'actualité du football algérien : Fennecs, Ligue 1 algérienne et joueurs algériens à l'étranger.",
  },
  maroc: {
    title: "Football Marocain",
    description: "L'actualité du football marocain : Lions de l'Atlas, Botola Pro et joueurs marocains à l'étranger.",
  },
  rdc: {
    title: "Football Congolais",
    description: "L'actualité du football de la RDC : Léopards, Linafoot et joueurs congolais à l'étranger.",
  },
  nigeria: {
    title: "Football Nigérian",
    description: "L'actualité du football nigérian : Super Eagles, NPFL et joueurs nigérians à l'étranger.",
  },
};

interface CategoryPageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categorySlug = slug[slug.length - 1];
  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    description: `Actualités ${categorySlug} - Afrique Sports`,
  };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: `${meta.title} | Afrique Sports`,
      description: meta.description,
      type: "website",
      siteName: "Afrique Sports",
      images: [{ url: "https://www.afriquesports.net/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | Afrique Sports`,
      description: meta.description,
      images: ["https://www.afriquesports.net/opengraph-image"],
    },
  };
}

async function CategoryArticles({
  categorySlug,
  page,
}: {
  categorySlug: string;
  page: number;
}) {
  const perPage = 12;
  const offset = (page - 1) * perPage;
  const locale = await getLocale();
  const tArticle = await getTranslations("article");

  try {
    const articles = await DataFetcher.fetchPostsByCategory(categorySlug, {
      per_page: perPage.toString(),
      offset: offset.toString(),
      locale,
    });

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">{tArticle("noArticles")}</p>
        </div>
      );
    }

    // Estimate total pages (WordPress API doesn't return total in body, so we estimate)
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
              basePath={`/category/${categorySlug}`}
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Error fetching category articles:", error);
    return <ArticleGridSkeleton count={12} />;
  }
}

async function SidebarMostRead() {
  const locale = await getLocale();
  const articles = await DataFetcher.fetchPosts({ per_page: "5", locale });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Get translations
  const tNav = await getTranslations("nav");
  const tCategories = await getTranslations("categories");
  const tCountries = await getTranslations("countries");

  if (!slug || slug.length === 0) {
    notFound();
  }

  // Build the category slug from the path segments
  const categorySlug = slug[slug.length - 1];
  const fullPath = `/category/${slug.join("/")}`;

  // Get category metadata
  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    description: `Actualités ${categorySlug}`,
  };

  // Generate breadcrumb items with translations
  const breadcrumbItems = generateBreadcrumbItems(fullPath, undefined, {
    tNav: (key) => tNav(key),
    tCategories: (key) => tCategories(key),
    tCountries: (key) => tCountries(key),
  });

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-[104px] md:pt-[88px] lg:pt-16">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Category header */}
        <section className="container-main pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {meta.title}
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            {meta.description}
          </p>
        </section>

        {/* Main content with sidebar */}
        <div className="container-main py-4 md:py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Articles grid */}
            <div className="flex-1">
              <Suspense fallback={<ArticleGridSkeleton count={12} />}>
                <CategoryArticles categorySlug={categorySlug} page={currentPage} />
              </Suspense>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                {/* Most read */}
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead />
                </Suspense>

                {/* Key players */}
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

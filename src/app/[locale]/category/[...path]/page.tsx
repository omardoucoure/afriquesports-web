import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, Pagination } from "@/components/ui";
import { generateBreadcrumbItems } from "@/components/ui/breadcrumb-utils";
import { MostReadWidget, MostReadWidgetSkeleton } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";
import { getTrendingPostsByRange } from "@/lib/mysql-db";
import { CATEGORY_KEYWORDS, SEO_KEYWORDS } from "@/lib/seo";

// ISR: Revalidate category pages every 60 seconds
export const revalidate = 60;

// Category display names, descriptions, and SEO-optimized titles
// Optimized for higher CTR with power words, current year, and action-oriented language
const categoryMeta: Record<string, { title: string; seoTitle: string; description: string }> = {
  afrique: {
    title: "Football Africain",
    seoTitle: "Football Africain 2025 : Actu CAN, Résultats en Direct & Transferts",
    description: "Dernières nouvelles du football africain : CAN 2025 au Maroc, résultats en direct, transferts chocs. Mohamed Salah, Osimhen, Hakimi. Mises à jour quotidiennes.",
  },
  europe: {
    title: "Joueurs Africains en Europe",
    seoTitle: "Joueurs Africains en Europe 2024/25 : Stats, Buts & Performances",
    description: "Performances des africains en Europe : Salah domine la Premier League, Hakimi brille au PSG, Osimhen en feu. Stats, buts, classements buteurs mis à jour.",
  },
  "can-2025": {
    title: "CAN 2025",
    seoTitle: "CAN 2025 Maroc : Calendrier Complet, Groupes & Résultats en Direct",
    description: "Toute la CAN 2025 en direct : calendrier officiel des 52 matchs, groupes, résultats live, compositions. Maroc vs Sénégal, Nigeria, Égypte. Commencez à suivre !",
  },
  mercato: {
    title: "Mercato Africain",
    seoTitle: "Mercato 2025 : Transferts Africains, Rumeurs Exclusives & Officiels",
    description: "Mercato africain en direct : dernières rumeurs Osimhen, transferts officialisés, indiscrétions exclusives. Alertes transferts mises à jour chaque heure.",
  },
  youtube: {
    title: "Vidéos Football Africain",
    seoTitle: "Vidéos Foot Africain : Résumés Matchs, Interviews & Best-Of",
    description: "Vidéos exclusives : résumés CAN 2025, interviews stars africaines, best-of buts Salah, Osimhen, Hakimi. Nouvelles vidéos chaque jour.",
  },
  // Country subcategories - targeting "liste [pays] can 2025" keywords
  senegal: {
    title: "Football Sénégalais",
    seoTitle: "Équipe Sénégal CAN 2025 : Liste des 23 Joueurs, Effectif Complet",
    description: "Liste officielle Sénégal CAN 2025 par Pape Thiaw : Sadio Mané, Nicolas Jackson, Mendy, Koulibaly. Effectif complet des Lions de la Teranga.",
  },
  cameroun: {
    title: "Football Camerounais",
    seoTitle: "Équipe Cameroun CAN 2025 : Liste Joueurs, Effectif Lions Indomptables",
    description: "Liste Cameroun CAN 2025 : Anguissa, Choupo-Moting, Onana. Effectif complet des Lions Indomptables, parcours et pronostics.",
  },
  "cote-divoire": {
    title: "Football Ivoirien",
    seoTitle: "Côte d'Ivoire CAN 2025 : Éléphants Champions Défendent leur Titre",
    description: "Côte d'Ivoire CAN 2025 : champions en titre, liste Haller, Kessié, Adingra. Les Éléphants visent le doublé historique au Maroc.",
  },
  algerie: {
    title: "Football Algérien",
    seoTitle: "Algérie CAN 2025 : Liste Fennecs, Mahrez, Bennacer & Effectif",
    description: "Liste Algérie CAN 2025 : Mahrez, Bennacer, Benrahma. Effectif complet des Fennecs, groupe de qualifications, parcours.",
  },
  maroc: {
    title: "Football Marocain",
    seoTitle: "Maroc CAN 2025 : Pays Hôte, Liste Lions de l'Atlas, Favoris #1",
    description: "Maroc favori CAN 2025 à domicile : Hakimi, Ziyech, En-Nesyri. Liste complète Lions de l'Atlas, calendrier matchs à domicile.",
  },
  rdc: {
    title: "Football Congolais",
    seoTitle: "RD Congo CAN 2025 : Liste Léopards, Mbemba & Effectif Complet",
    description: "Liste RD Congo CAN 2025 : Chancel Mbemba et les Léopards. Effectif complet, groupe, parcours qualifications.",
  },
  nigeria: {
    title: "Football Nigérian",
    seoTitle: "Nigeria CAN 2025 : Liste Super Eagles, Osimhen, Lookman, Kudus",
    description: "Liste Nigeria CAN 2025 : Osimhen, Lookman (Ballon d'Or Africain), Kudus. Super Eagles parmi les grands favoris.",
  },
  egypte: {
    title: "Football Égyptien",
    seoTitle: "Égypte CAN 2025 : Salah Vise 8e Titre, Liste Pharaons Complète",
    description: "Mohamed Salah mène l'Égypte CAN 2025 : Pharaons 7x champions visent le record. Liste complète, groupe, parcours.",
  },
  ghana: {
    title: "Football Ghanéen",
    seoTitle: "Ghana CAN 2025 : Liste Black Stars, Kudus, Partey & Effectif",
    description: "Liste Ghana CAN 2025 : Mohammed Kudus, Thomas Partey. Effectif complet Black Stars, groupe, analyses.",
  },
  // Additional categories for high-traffic keywords
  mali: {
    title: "Football Malien",
    seoTitle: "Mali CAN 2025 : Liste Aigles, Groupe A avec Maroc, Pronostics",
    description: "Liste Mali CAN 2025 : Les Aigles dans le groupe A du pays hôte. Effectif complet, chances de qualification.",
  },
  tunisie: {
    title: "Football Tunisien",
    seoTitle: "Tunisie CAN 2025 : Liste Aigles de Carthage, Effectif & Groupe",
    description: "Liste Tunisie CAN 2025 : Aigles de Carthage visent la qualification. Effectif complet, groupe, parcours.",
  },
};

interface CategoryPageProps {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { locale, path } = await params;
  const { page } = await searchParams;
  const categorySlug = path[path.length - 1];
  const categoryPath = `/category/${path.join("/")}`;
  const currentPage = parseInt(page || "1", 10);

  const meta = categoryMeta[categorySlug] || {
    title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " "),
    seoTitle: `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1).replace(/-/g, " ")} | Afrique Sports`,
    description: `Actualités ${categorySlug} - Toute l'actualité du football africain sur Afrique Sports.`,
  };

  // Get category-specific keywords
  const categoryKeywords = CATEGORY_KEYWORDS[categorySlug] || CATEGORY_KEYWORDS.afrique || [];
  const keywords = [...categoryKeywords, ...SEO_KEYWORDS.primary.slice(0, 3)];

  // Build canonical URL based on locale and page
  const baseUrl = "https://www.afriquesports.net";
  const localePrefix = locale === "fr" ? "" : `/${locale}`;
  const pageQuery = currentPage > 1 ? `?page=${currentPage}` : "";
  const canonicalUrl = `${baseUrl}${localePrefix}${categoryPath}${pageQuery}`;

  // Use SEO title for search results, display title for OG
  const pageTitle = currentPage > 1 ? `${meta.seoTitle} - Page ${currentPage}` : meta.seoTitle;

  return {
    title: pageTitle,
    description: meta.description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "fr-FR": `${baseUrl}${categoryPath}${pageQuery}`,
        "en-US": `${baseUrl}/en${categoryPath}${pageQuery}`,
        "es-ES": `${baseUrl}/es${categoryPath}${pageQuery}`,
        "ar-SA": `${baseUrl}/ar${categoryPath}${pageQuery}`,
        "x-default": `${baseUrl}${categoryPath}${pageQuery}`,
      },
    },
    openGraph: {
      title: pageTitle,
      description: meta.description,
      type: "website",
      siteName: "Afrique Sports",
      url: canonicalUrl,
      locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : locale === "ar" ? "ar_SA" : "es_ES",
      images: [{
        url: "https://www.afriquesports.net/opengraph-image",
        width: 1200,
        height: 630,
        alt: meta.title,
        type: "image/png",
      }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@afriquesports",
      creator: "@afriquesports",
      title: pageTitle,
      description: meta.description,
      images: [{
        url: "https://www.afriquesports.net/opengraph-image",
        alt: meta.title,
      }],
    },
    robots: {
      index: currentPage === 1, // Only index first page of pagination
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
      googleBot: {
        index: currentPage === 1,
        follow: true,
        "max-image-preview": "large",
        "max-video-preview": -1,
        "max-snippet": -1,
      },
    },
  };
}

async function CategoryArticles({
  categorySlug,
  page,
  locale,
}: {
  categorySlug: string;
  page: number;
  locale: string;
}) {
  const perPage = 12;
  const offset = (page - 1) * perPage;
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
        category: item.post_category || 'football', // Category slug for URL generation
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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { locale, path } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  // Get translations
  const tNav = await getTranslations("nav");
  const tCategories = await getTranslations("categories");
  const tCountries = await getTranslations("countries");

  if (!path || path.length === 0) {
    notFound();
  }

  // Build the category slug from the path segments
  const categorySlug = path[path.length - 1];
  const fullPath = `/category/${path.join("/")}`;

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

      <main className="min-h-screen bg-[#F6F6F6] pt-header">
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
                <CategoryArticles categorySlug={categorySlug} page={currentPage} locale={locale} />
              </Suspense>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20 space-y-6">
                {/* Most read */}
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead locale={locale} />
                </Suspense>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

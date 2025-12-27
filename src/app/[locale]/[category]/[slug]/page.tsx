import { Suspense } from "react";
import { notFound } from "next/navigation";
import Script from "next/script";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton, ArticleContent } from "@/components/articles";
import { ArticleFeaturedImage } from "@/components/articles/article-featured-image";
import { ShareButtons } from "@/components/articles/share-buttons-dynamic";
import { Breadcrumb } from "@/components/ui";
import { generateBreadcrumbItems } from "@/components/ui/breadcrumb-utils";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { CommentSection } from "@/components/comments/comment-section-dynamic";
import { VisitTracker } from "@/components/tracking";
import { InArticleAd, SidebarAd } from "@/components/ads";
import { ADSENSE_CONFIG } from "@/lib/ad-config";
import { DataFetcher } from "@/lib/data-fetcher";
import { getTrendingPostsByRange } from "@/lib/mysql-db";
import {
  formatDate,
  getRelativeDate,
  getFeaturedImageUrl,
  getAuthorName,
  getReadingTime,
  stripHtml,
  getCategoryLabel,
} from "@/lib/utils";
import { CATEGORY_KEYWORDS, SEO_KEYWORDS } from "@/lib/seo";

// CRITICAL: Next.js 16 proxy.ts forces dynamic rendering
// Cannot use ISR (revalidate) or auto rendering - causes DYNAMIC_SERVER_USAGE error
// Must use force-dynamic, but we enable caching via Vercel edge with Cache-Control headers
// This achieves ISR-like performance (5min edge cache) without ISR
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store'; // Prevent Next.js from overriding our cache headers

// Enable dynamic params - all article pages generated on-demand
// This avoids build-time WordPress API calls that cause Cloudflare 522 errors
export const dynamicParams = true;

// Skip static generation at build time - generate all pages on-demand
// Pages are cached with ISR (60s revalidation) after first request
export async function generateStaticParams() {
  // Return empty array to skip pre-generation
  // All article pages will be generated on first request with ISR caching
  return [];
}

interface ArticlePageProps {
  params: Promise<{ locale: string; category: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { locale, category, slug } = await params;

  try {
    let article = await DataFetcher.fetchPostBySlug(slug, locale);

    // Fallback to French if article not found in requested locale
    if (!article && locale !== "fr") {
      article = await DataFetcher.fetchPostBySlug(slug, "fr");
    }

    if (!article) {
      return {
        title: "Article non trouvé",
        description: "L'article demandé n'existe pas.",
      };
    }

    const title = stripHtml(article.title.rendered);
    const description = stripHtml(article.excerpt.rendered).slice(0, 160);
    const imageUrl = getFeaturedImageUrl(article, "full");
    const baseUrl = "https://www.afriquesports.net";

    // Use original WordPress image for og:image (no optimization needed)
    // Social media crawlers download once and cache forever, so no need for Next.js optimization
    // This saves ~180K image transformations/month on Vercel
    const ogImageUrl = imageUrl || `${baseUrl}/opengraph-image`;

    // Determine image type from original URL (before optimization)
    const imageExtension = imageUrl?.toLowerCase().split('.').pop()?.split('?')[0];
    const ogImageType = imageExtension === 'png' ? 'image/png'
      : imageExtension === 'webp' ? 'image/webp'
      : 'image/jpeg';

    // Build canonical URL based on locale
    const articlePath = `/${category}/${slug}`;
    const canonicalUrl = locale === "fr"
      ? `${baseUrl}${articlePath}`
      : `${baseUrl}/${locale}${articlePath}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          "fr-FR": `${baseUrl}${articlePath}`,
          "en-US": `${baseUrl}/en${articlePath}`,
          "es-ES": `${baseUrl}/es${articlePath}`,
          "x-default": `${baseUrl}${articlePath}`,
        },
      },
      openGraph: {
        title,
        description,
        type: "article",
        siteName: "Afrique Sports",
        publishedTime: article.date,
        modifiedTime: article.modified,
        url: canonicalUrl,
        locale: locale === "fr" ? "fr_FR" : locale === "en" ? "en_US" : "es_ES",
        images: [{
          url: ogImageUrl,
          width: 1200,
          height: 630,
          type: ogImageType,
          alt: title,
        }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [{ url: ogImageUrl, alt: title }],
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
      other: {
        "article:published_time": article.date,
        "article:modified_time": article.modified,
        "article:section": category,
      },
    };
  } catch {
    return {
      title: "Article",
      description: "Afrique Sports - Actualités football africain",
    };
  }
}

// JSON-LD structured data for the article - enhanced with full properties
function ArticleJsonLd({
  title,
  description,
  articleBody,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  articleUrl,
  category,
  keywords,
}: {
  title: string;
  description: string;
  articleBody: string;
  imageUrl: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  articleUrl: string;
  category: string;
  keywords: string[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${articleUrl}#article`,
    headline: title,
    description,
    articleBody: articleBody.slice(0, 5000), // Truncate for schema
    image: {
      "@type": "ImageObject",
      url: imageUrl,
      width: 1200,
      height: 630,
    },
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
      url: `https://www.afriquesports.net/author/${authorName.toLowerCase().replace(/\s+/g, "-")}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Afrique Sports",
      url: "https://www.afriquesports.net",
      logo: {
        "@type": "ImageObject",
        url: "https://www.afriquesports.net/logo.jpg",
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: category,
    keywords: keywords.join(", "),
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    copyrightHolder: {
      "@type": "Organization",
      name: "Afrique Sports",
    },
    copyrightYear: new Date(datePublished).getFullYear(),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

async function RelatedArticles({ categorySlug, locale }: { categorySlug: string; locale: string }) {
  const tArticle = await getTranslations("article");

  try {
    const articles = await DataFetcher.fetchPostsByCategory(categorySlug, {
      per_page: "3",
      locale,
    });

    if (!articles || articles.length === 0) {
      return null;
    }

    return (
      <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
            {tArticle("relatedArticles")}
          </h2>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <ArticleGrid articles={articles} columns={3} showCategory showDate />
      </section>
    );
  } catch {
    return null;
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, category, slug } = await params;

  // Get translations
  const tNav = await getTranslations("nav");
  const tCategories = await getTranslations("categories");
  const tCountries = await getTranslations("countries");

  // Fetch the article - try requested locale first, fallback to French if not found
  let article;
  let actualLocale = locale;

  try {
    article = await DataFetcher.fetchPostBySlug(slug, locale);

    // If article not found in requested locale and locale is not French, try French fallback
    if (!article && locale !== "fr") {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Article not found in ${locale}, trying French fallback...`);
      }
      article = await DataFetcher.fetchPostBySlug(slug, "fr");
      if (article) {
        actualLocale = "fr";
      }
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    notFound();
  }

  if (!article) {
    notFound();
  }

  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered);
  const articleBody = stripHtml(article.content.rendered);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const categoryLabel = getCategoryLabel(article);
  const readingTime = getReadingTime(article.content.rendered);
  const articleUrl = `https://www.afriquesports.net/${category}/${slug}`;

  // Get category-specific keywords for schema
  const categoryKeywords = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS.afrique || [];
  const articleKeywords = [...categoryKeywords, ...SEO_KEYWORDS.primary.slice(0, 3)];

  // Generate breadcrumb items with translations
  const breadcrumbItems = generateBreadcrumbItems(`/${category}/${slug}`, title, {
    tNav: (key) => tNav(key),
    tCategories: (key) => tCategories(key),
    tCountries: (key) => tCountries(key),
  });

  return (
    <>
      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4765538302983367"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <ArticleJsonLd
        title={title}
        description={description}
        articleBody={articleBody}
        imageUrl={imageUrl}
        datePublished={article.date}
        dateModified={article.modified}
        authorName={authorName}
        articleUrl={articleUrl}
        category={categoryLabel}
        keywords={articleKeywords}
      />

      <Header />

      {/* Track visit */}
      <VisitTracker
        postId={article.id.toString()}
        postSlug={slug}
        postTitle={title}
        postImage={imageUrl}
        postAuthor={authorName}
        postCategory={category}
        postSource="afriquesports"
      />

      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20 lg:pb-0">
        {/* Breadcrumb with better mobile padding */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-main py-3 sm:py-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <article className="container-main py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Article card container */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-visible">
                {/* Article header and content */}
                <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-visible">
                  {/* Category badge */}
                  <span className="inline-block px-3 py-1.5 bg-[#04453f] text-white text-xs font-bold uppercase rounded-full mb-4">
                    {categoryLabel}
                  </span>

                  {/* Title - larger and more impactful */}
                  <h1
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-4"
                    dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                  />

                  {/* Meta info - more compact on mobile */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500 mb-6">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium text-gray-700">{authorName}</span>
                    </span>
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <time dateTime={article.date}>{formatDate(article.date)}</time>
                    </span>
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {readingTime}
                    </span>
                  </div>

                  {/* Ad #1 - Top In-Article Ad - Highest RPM position */}
                  <InArticleAd adSlot={ADSENSE_CONFIG.AD_SLOTS.ARTICLE_TOP} position="top" />

                  {/* Featured image - Only rendered on desktop for LCP optimization */}
                  {imageUrl && imageUrl !== "/images/placeholder.svg" && (
                    <ArticleFeaturedImage imageUrl={imageUrl} title={title} priority />
                  )}

                  {/* Social share buttons */}
                  <div className="pb-4 mb-4 border-b border-gray-100">
                    <ShareButtons url={articleUrl} title={title} />
                  </div>

                  {/* Ad #2 - Middle In-Article Ad - Good RPM position */}
                  <InArticleAd adSlot={ADSENSE_CONFIG.AD_SLOTS.ARTICLE_MIDDLE} position="middle" />

                  {/* Article content with enhanced embed handling */}
                  <div className="mt-6 overflow-visible">
                    <ArticleContent content={article.content.rendered} />
                  </div>

                  {/* Ad #3 - Bottom In-Article Ad - Standard RPM position */}
                  <InArticleAd adSlot={ADSENSE_CONFIG.AD_SLOTS.ARTICLE_BOTTOM} position="bottom" />

                  {/* Bottom share buttons for mobile */}
                  <div className="mt-8 pt-6 border-t border-gray-200 lg:hidden">
                    <ShareButtons url={articleUrl} title={title} />
                  </div>
                </div>
              </div>

              {/* Comment section */}
              <div className="mt-6 sm:mt-8">
                <CommentSection articleId={article.id.toString()} locale={locale} />
              </div>

              {/* Related articles */}
              <div className="mt-6 sm:mt-8">
                <Suspense fallback={<ArticleGridSkeleton count={3} />}>
                  <RelatedArticles categorySlug={category} locale={locale} />
                </Suspense>
              </div>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
              {/* Sidebar Ad - Sticky - Desktop high-value position */}
              <SidebarAd adSlot={ADSENSE_CONFIG.AD_SLOTS.SIDEBAR_STICKY} sticky={true} />

              {/* Most read */}
              <div className="sticky top-20">
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead locale={locale} />
                </Suspense>

                <div className="mt-6">
                  <PlayersWidget />
                </div>
              </div>
            </aside>
          </div>
        </article>

        {/* Mobile most read section */}
        <section className="lg:hidden container-main pb-6">
          <Suspense fallback={<MostReadWidgetSkeleton />}>
            <SidebarMostRead locale={locale} />
          </Suspense>
        </section>
      </main>

      {/* Twitter/X embed script */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
      />

      {/* Instagram embed script */}
      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
      />

      <Footer />
    </>
  );
}

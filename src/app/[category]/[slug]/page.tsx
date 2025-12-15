import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, generateBreadcrumbItems } from "@/components/ui";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { DataFetcher } from "@/lib/data-fetcher";
import {
  formatDate,
  getRelativeDate,
  getFeaturedImageUrl,
  getAuthorName,
  getReadingTime,
  stripHtml,
  getCategoryLabel,
} from "@/lib/utils";

interface ArticlePageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await DataFetcher.fetchPostBySlug(slug);

    if (!article) {
      return {
        title: "Article non trouvé",
        description: "L'article demandé n'existe pas.",
      };
    }

    const title = stripHtml(article.title.rendered);
    const description = stripHtml(article.excerpt.rendered).slice(0, 160);
    const imageUrl = getFeaturedImageUrl(article, "full");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        siteName: "Afrique Sports",
        publishedTime: article.date,
        modifiedTime: article.modified,
        images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      robots: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    };
  } catch {
    return {
      title: "Article",
      description: "Afrique Sports - Actualités football africain",
    };
  }
}

// JSON-LD structured data for the article
function ArticleJsonLd({
  title,
  description,
  imageUrl,
  datePublished,
  dateModified,
  authorName,
  articleUrl,
}: {
  title: string;
  description: string;
  imageUrl: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  articleUrl: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description,
    image: imageUrl,
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Afrique Sports",
      logo: {
        "@type": "ImageObject",
        url: "https://www.afriquesports.net/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

async function RelatedArticles({ categorySlug }: { categorySlug: string }) {
  try {
    const articles = await DataFetcher.fetchPostsByCategory(categorySlug, {
      per_page: "3",
    });

    if (!articles || articles.length === 0) {
      return null;
    }

    return (
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Articles similaires
        </h2>
        <ArticleGrid articles={articles} columns={3} showCategory showDate />
      </section>
    );
  } catch {
    return null;
  }
}

async function SidebarMostRead() {
  const articles = await DataFetcher.fetchPosts({ per_page: "5" });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category, slug } = await params;

  // Fetch the article
  let article;
  try {
    article = await DataFetcher.fetchPostBySlug(slug);
  } catch (error) {
    console.error("Error fetching article:", error);
    notFound();
  }

  if (!article) {
    notFound();
  }

  const title = stripHtml(article.title.rendered);
  const description = stripHtml(article.excerpt.rendered);
  const imageUrl = getFeaturedImageUrl(article, "full");
  const authorName = getAuthorName(article);
  const categoryLabel = getCategoryLabel(article);
  const readingTime = getReadingTime(article.content.rendered);
  const articleUrl = `https://www.afriquesports.net/${category}/${slug}`;

  // Generate breadcrumb items
  const breadcrumbItems = generateBreadcrumbItems(`/${category}/${slug}`, title);

  return (
    <>
      <ArticleJsonLd
        title={title}
        description={description}
        imageUrl={imageUrl}
        datePublished={article.date}
        dateModified={article.modified}
        authorName={authorName}
        articleUrl={articleUrl}
      />

      <Header />

      <main className="min-h-screen bg-white pt-[104px] md:pt-[88px] lg:pt-16">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <article className="container-main pb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 max-w-4xl">
              {/* Category badge */}
              <span className="inline-block px-3 py-1 bg-[#9DFF20] text-[#345C00] text-xs font-bold uppercase rounded mb-4">
                {categoryLabel}
              </span>

              {/* Title */}
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight"
                dangerouslySetInnerHTML={{ __html: article.title.rendered }}
              />

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {authorName}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {readingTime}
                </span>
              </div>

              {/* Featured image */}
              {imageUrl && imageUrl !== "/images/placeholder.jpg" && (
                <div className="relative aspect-video mt-6 rounded-xl overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Social share buttons */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-500">Partager :</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center bg-[#1877F2] text-white rounded-full hover:opacity-80 transition-opacity"
                  aria-label="Partager sur Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center bg-black text-white rounded-full hover:opacity-80 transition-opacity"
                  aria-label="Partager sur X"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(title + " " + articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center bg-[#25D366] text-white rounded-full hover:opacity-80 transition-opacity"
                  aria-label="Partager sur WhatsApp"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <button
                  onClick={() => navigator.clipboard?.writeText(articleUrl)}
                  className="w-9 h-9 flex items-center justify-center bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors"
                  aria-label="Copier le lien"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              {/* Article content */}
              <div
                className="prose prose-lg max-w-none mt-8
                  prose-headings:text-gray-900 prose-headings:font-bold
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-[#345C00] prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:mx-auto
                  prose-blockquote:border-l-[#9DFF20] prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
                  prose-strong:text-gray-900
                  prose-ul:list-disc prose-ol:list-decimal"
                dangerouslySetInnerHTML={{ __html: article.content.rendered }}
              />

              {/* Related articles */}
              <Suspense fallback={<ArticleGridSkeleton count={3} />}>
                <RelatedArticles categorySlug={category} />
              </Suspense>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
              {/* Most read */}
              <div className="sticky top-20">
                <Suspense fallback={<MostReadWidgetSkeleton />}>
                  <SidebarMostRead />
                </Suspense>

                <div className="mt-6">
                  <PlayersWidget />
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

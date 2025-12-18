import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton, ShareButtons, ArticleContent } from "@/components/articles";
import { Breadcrumb, generateBreadcrumbItems } from "@/components/ui";
import { MostReadWidget, MostReadWidgetSkeleton, PlayersWidget } from "@/components/sidebar";
import { CommentSection } from "@/components/comments";
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

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// Pre-generate popular articles at build time
export async function generateStaticParams() {
  try {
    // Fetch the latest 50 articles to pre-generate
    const articles = await DataFetcher.fetchPosts({ per_page: "50" });

    if (!articles || articles.length === 0) {
      return [];
    }

    return articles.map((article) => {
      // Extract category slug from the article link
      const linkParts = article.link.replace("https://www.afriquesports.net/", "").split("/");
      const category = linkParts[0] || "football";

      return {
        category,
        slug: article.slug,
      };
    });
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

interface ArticlePageProps {
  params: Promise<{ locale: string; category: string; slug: string }>;
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
      <section className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 whitespace-nowrap">
            Articles similaires
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

async function SidebarMostRead() {
  const articles = await DataFetcher.fetchPosts({ per_page: "5" });

  if (!articles || articles.length === 0) {
    return <MostReadWidgetSkeleton />;
  }

  return <MostReadWidget articles={articles} />;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, category, slug } = await params;

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

      <main className="min-h-screen bg-[#F6F6F6] pt-[72px] md:pt-[88px] lg:pt-16 pb-20 lg:pb-0">
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
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4"
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

                  {/* Featured image - with padding and rounded corners */}
                  {imageUrl && imageUrl !== "/images/placeholder.jpg" && (
                    <div className="relative w-full aspect-[16/9] mb-6 rounded-lg sm:rounded-xl overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 800px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  )}

                  {/* Social share buttons */}
                  <div className="pb-4 mb-4 border-b border-gray-100">
                    <ShareButtons url={articleUrl} title={title} />
                  </div>

                  {/* Article content with enhanced embed handling */}
                  <div className="mt-6 overflow-visible">
                    <ArticleContent content={article.content.rendered} />
                  </div>

                  {/* Bottom share buttons for mobile */}
                  <div className="mt-8 pt-6 border-t border-gray-200 lg:hidden">
                    <p className="text-sm font-medium text-gray-600 mb-3">Partager cet article</p>
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
                  <RelatedArticles categorySlug={category} />
                </Suspense>
              </div>
            </div>

            {/* Sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
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

        {/* Mobile most read section */}
        <section className="lg:hidden container-main pb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-extrabold text-gray-900 whitespace-nowrap">
              Les plus lus
            </h2>
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>
          <Suspense fallback={<MostReadWidgetSkeleton />}>
            <SidebarMostRead />
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

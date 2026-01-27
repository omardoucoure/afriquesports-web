"use client";

import Image from "next/image";
import Link from "next/link";
import { getArticleUrl, getFeaturedImageUrl, getAuthorName, stripHtml } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";
import type { WordPressPost } from "@/lib/data-fetcher";

// Simplified article type for trending posts from our database
export interface TrendingArticle {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
  category?: string; // Category slug for URL generation
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
  viewCount?: number;
  author?: string;
}

interface MostReadWidgetProps {
  title?: string;
  articles: WordPressPost[] | TrendingArticle[];
  maxArticles?: number;
}

// Format view count for display
function formatViewCount(count: number | undefined): string | null {
  if (!count || count <= 0) {
    return null;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

// Fire/trending icon for view counts
function TrendingIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
  );
}

// Eye icon for view counts
function ViewIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
  );
}

export function MostReadWidget({
  title,
  articles,
  maxArticles = 3,
}: MostReadWidgetProps) {
  const { trackWidgetClick } = useAnalytics();
  const displayArticles = articles.slice(0, maxArticles);

  if (!displayArticles.length) {
    return null;
  }

  const displayTitle = title || "Les Plus Lus";

  const handleArticleClick = (article: WordPressPost | TrendingArticle, position: number) => {
    const articleTitle = stripHtml(article.title.rendered);
    trackWidgetClick({
      widgetType: 'most_read',
      itemId: article.id.toString(),
      itemTitle: articleTitle,
      position: position + 1,
      widgetLocation: 'sidebar',
    });
  };

  // Extract article data regardless of type
  const getArticleData = (article: WordPressPost | TrendingArticle) => {
    const isFullPost = 'date' in article;
    return {
      url: isFullPost
        ? getArticleUrl(article as WordPressPost)
        : `/${(article as TrendingArticle).category || 'football'}/${article.slug}`,
      imageUrl: isFullPost
        ? getFeaturedImageUrl(article as WordPressPost, "medium_large")
        : (article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/images/placeholder.svg'),
      authorName: isFullPost
        ? getAuthorName(article as WordPressPost)
        : ((article as TrendingArticle).author || 'Afrique Sports'),
      title: stripHtml(article.title.rendered),
      viewCount: 'viewCount' in article ? formatViewCount(article.viewCount) : null,
      rawViewCount: 'viewCount' in article ? (article.viewCount || 0) : 0,
    };
  };

  const firstArticle = displayArticles[0];
  const firstData = getArticleData(firstArticle);
  const remainingArticles = displayArticles.slice(1);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h3 className="title-section whitespace-nowrap">{displayTitle}</h3>
        <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
      </div>

      {/* #1 Article - Featured mini-hero card */}
      <Link
        href={firstData.url}
        className="block group mb-3"
        onClick={() => handleArticleClick(firstArticle, 0)}
      >
        <div className="relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
          <div className="relative aspect-[16/10] overflow-hidden">
            <Image
              src={firstData.imageUrl}
              alt={firstData.title}
              fill
              sizes="(max-width: 768px) 100vw, 340px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              quality={85}
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

            {/* Rank badge - top left */}
            <div className="absolute top-3 left-3">
              <div className="w-8 h-8 rounded-lg bg-[#9DFF20] flex items-center justify-center shadow-lg">
                <span className="text-sm font-black text-[#04453f]">1</span>
              </div>
            </div>

            {/* View count badge - top right */}
            {firstData.viewCount && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md">
                  <TrendingIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-gray-900">{firstData.viewCount}</span>
                </div>
              </div>
            )}

            {/* Content - bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h4
                className="font-bold text-[15px] leading-snug text-white line-clamp-2 mb-2 drop-shadow-sm"
                dangerouslySetInnerHTML={{ __html: firstArticle.title.rendered }}
              />
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="font-medium">{firstData.authorName}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* #2, #3 Articles - Compact horizontal cards */}
      <div className="space-y-2">
        {remainingArticles.map((article, index) => {
          const data = getArticleData(article);
          const rank = index + 2;

          return (
            <Link
              key={article.id}
              href={data.url}
              className="block group"
              onClick={() => handleArticleClick(article, index + 1)}
            >
              <div className="flex items-stretch gap-3 bg-white rounded-xl overflow-hidden p-2.5 hover:bg-gray-50 transition-all duration-200 border border-gray-100 hover:border-gray-200 hover:shadow-sm">
                {/* Rank number */}
                <div className="flex items-center justify-center flex-shrink-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    rank === 2 ? 'bg-gray-100 text-gray-700' : 'bg-[#04453f]/10 text-[#04453f]'
                  }`}>
                    <span className="text-sm font-black">{rank}</span>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="relative w-[72px] h-[54px] flex-shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={data.imageUrl}
                    alt={data.title}
                    fill
                    sizes="72px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    quality={75}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4
                    className="font-semibold text-[13px] leading-snug text-gray-900 group-hover:text-[#04453f] transition-colors line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                  />
                  {/* View count + author */}
                  <div className="flex items-center gap-2 mt-1">
                    {data.viewCount && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <ViewIcon className="w-3 h-3" />
                        <span className="text-[11px] font-semibold">{data.viewCount}</span>
                      </div>
                    )}
                    {data.viewCount && (
                      <span className="text-gray-300 text-[10px]">•</span>
                    )}
                    <span className="text-[11px] text-gray-500 truncate">{data.authorName}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


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
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
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

  // Only use translation hook if no title prop is provided
  const displayTitle = title || "Les Plus Lus";

  // Handle widget click tracking
  const handleArticleClick = (article: WordPressPost | TrendingArticle, position: number) => {
    const articleTitle = stripHtml(article.title.rendered);

    trackWidgetClick({
      widgetType: 'most_read',
      itemId: article.id.toString(),
      itemTitle: articleTitle,
      position: position + 1, // 1-indexed position
      widgetLocation: 'sidebar',
    });
  };

  return (
    <div>
      {/* Header with gradient line - outside container */}
      <div className="flex items-center gap-3 mb-5">
        <h3 className="title-section whitespace-nowrap">{displayTitle}</h3>
        <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
      </div>

      {/* Articles list - vertical card layout with better image ratios */}
      <div className="space-y-3">
        {displayArticles.map((article, index) => {
          // Check if it's a full WordPressPost or a simplified TrendingArticle
          const isFullPost = 'date' in article;
          const articleUrl = isFullPost
            ? getArticleUrl(article as WordPressPost)
            : `/${(article as TrendingArticle).category || 'football'}/${article.slug}`;
          const imageUrl = isFullPost
            ? getFeaturedImageUrl(article as WordPressPost, "medium")
            : (article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/images/placeholder.svg');
          const authorName = isFullPost
            ? getAuthorName(article as WordPressPost)
            : ((article as TrendingArticle).author || 'Afrique Sports');
          const articleTitle = stripHtml(article.title.rendered);
          // Only show view count for TrendingArticle (not WordPressPost)
          const viewCount = 'viewCount' in article ? formatViewCount(article.viewCount) : null;

          return (
            <Link
              key={article.id}
              href={articleUrl}
              className="block group"
              onClick={() => handleArticleClick(article, index)}
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                {/* Image with rank badge overlay */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={articleTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 340px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {/* Rank badge - modern pill style */}
                  <div className="absolute top-2 left-2">
                    <div className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-sm shadow-lg backdrop-blur-sm ${
                      index === 0 ? 'bg-gradient-to-r from-[#9DFF20] to-[#7DD31F] text-[#04453f]' :
                      index === 1 ? 'bg-white/90 text-gray-800' :
                      'bg-[#04453f]/90 text-white'
                    }`}>
                      <span className="text-xs">#{index + 1}</span>
                    </div>
                  </div>

                  {/* View count badge - top right */}
                  {viewCount && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-white">{viewCount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Title */}
                  <h4
                    className="font-bold text-sm leading-snug text-gray-900 group-hover:text-[#04453f] transition-colors line-clamp-2 mb-2"
                    dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                  />

                  {/* Author */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#04453f] to-[#345C00] flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-600 truncate">{authorName}</span>
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

// Skeleton for loading state
export function MostReadWidgetSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-6 w-28 bg-gray-200 rounded" />
        <div className="flex-1 h-0.5 bg-gray-200" />
      </div>
      {/* Vertical cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            {/* Image skeleton */}
            <div className="aspect-[16/10] bg-gray-200" />
            {/* Content skeleton */}
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-4 h-4 bg-gray-200 rounded-full" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

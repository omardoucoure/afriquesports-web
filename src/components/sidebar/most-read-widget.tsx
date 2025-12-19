"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getArticleUrl, getFeaturedImageUrl, getAuthorName, stripHtml } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

// Simplified article type for trending posts from our database
export interface TrendingArticle {
  id: number;
  slug: string;
  title: { rendered: string };
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
  viewCount?: number;
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
  maxArticles = 5,
}: MostReadWidgetProps) {
  const tHome = useTranslations("home");
  const displayTitle = title || tHome("mostRead");
  const displayArticles = articles.slice(0, maxArticles);

  if (!displayArticles.length) {
    return null;
  }

  return (
    <div>
      {/* Header with gradient line - outside container */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="title-section whitespace-nowrap">{displayTitle}</h3>
        <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
      </div>

      {/* Articles list - inside white container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {displayArticles.map((article, index) => {
          // Check if it's a full WordPressPost or a simplified TrendingArticle
          const isFullPost = 'date' in article;
          const articleUrl = isFullPost
            ? getArticleUrl(article as WordPressPost)
            : `/${(article as TrendingArticle).link?.split('/').slice(-2, -1)[0] || 'football'}/${article.slug}`;
          const imageUrl = isFullPost
            ? getFeaturedImageUrl(article as WordPressPost, "medium")
            : (article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/images/placeholder.jpg');
          const authorName = isFullPost ? getAuthorName(article as WordPressPost) : 'Afrique Sports';
          const articleTitle = stripHtml(article.title.rendered);

          return (
            <div
              key={article.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${index !== displayArticles.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Link href={articleUrl} className="group block">
                <div className="flex gap-3">
                  {/* Rank badge */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-md ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800' :
                      index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white' :
                      'bg-[#04453f] text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content and image */}
                  <div className="flex-1 min-w-0">
                    {/* Image */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden mb-2 rounded-lg shadow-sm">
                      <Image
                        src={imageUrl}
                        alt={articleTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Title */}
                    <h4
                      className="title-card text-sm font-bold leading-snug group-hover:text-[#04453f] transition-colors line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                    />

                    {/* Views count */}
                    {formatViewCount((article as TrendingArticle).viewCount) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-medium">{formatViewCount((article as TrendingArticle).viewCount)} {tHome("views")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function MostReadWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton - outside container */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-28 bg-gray-200 rounded" />
        <div className="flex-1 h-0.5 bg-gray-200" />
      </div>
      {/* Content skeleton - inside white container */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`p-4 ${i !== count - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="w-full aspect-[16/10] bg-gray-200 rounded-lg mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const tHome = useTranslations("home");
  const tArticle = useTranslations("article");
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
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {displayArticles.map((article, index) => {
          // Check if it's a full WordPressPost or a simplified TrendingArticle
          const isFullPost = 'date' in article;
          const articleUrl = isFullPost
            ? getArticleUrl(article as WordPressPost)
            : `/${(article as TrendingArticle).link?.split('/').slice(-2, -1)[0] || 'football'}/${article.slug}`;
          const imageUrl = isFullPost
            ? getFeaturedImageUrl(article as WordPressPost, "medium")
            : (article._embedded?.['wp:featuredmedia']?.[0]?.source_url || '/images/placeholder.jpg');
          const authorName = isFullPost
            ? getAuthorName(article as WordPressPost)
            : ((article as TrendingArticle).author || 'Afrique Sports');
          const articleTitle = stripHtml(article.title.rendered);
          const viewCount = formatViewCount((article as TrendingArticle).viewCount);

          return (
            <div
              key={article.id}
              className={`relative group ${index !== displayArticles.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <Link href={articleUrl} className="block">
                {/* Rank badge - positioned absolutely */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-lg backdrop-blur-sm ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 text-white' :
                    index === 1 ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 text-gray-800' :
                    'bg-gradient-to-br from-orange-200 via-orange-300 to-orange-400 text-white'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Image */}
                <div className="relative w-full aspect-[16/9] overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={articleTitle}
                    fill
                    sizes="(max-width: 768px) 100vw, 340px"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* View count badge */}
                  {viewCount && (
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#04453f]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-bold text-gray-800">{viewCount}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h4
                    className="font-bold text-base leading-tight text-gray-900 group-hover:text-[#04453f] transition-colors line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                  />

                  {/* Author info */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#04453f] to-[#345C00] flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-700">{authorName}</span>
                    </div>
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
export function MostReadWidgetSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton - outside container */}
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-28 bg-gray-200 rounded" />
        <div className="flex-1 h-0.5 bg-gray-200" />
      </div>
      {/* Content skeleton - inside white container */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`relative ${i !== count - 1 ? 'border-b border-gray-100' : ''}`}>
            <div className="w-full aspect-[16/9] bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-full" />
              <div className="h-5 bg-gray-200 rounded w-4/5" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full" />
                <div className="h-4 bg-gray-200 rounded w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

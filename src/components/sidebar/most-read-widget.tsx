"use client";

import Image from "next/image";
import Link from "next/link";
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
  title = "Les plus lus",
  articles,
  maxArticles = 5,
}: MostReadWidgetProps) {
  const displayArticles = articles.slice(0, maxArticles);

  if (!displayArticles.length) {
    return null;
  }

  return (
    <div>
      {/* Header with gradient line - outside container */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="title-section whitespace-nowrap">{title}</h3>
        <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
      </div>

      {/* Articles list - inside white container */}
      <div className="bg-white rounded overflow-hidden divide-y divide-gray-100">
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
            <div key={article.id} className="px-5 py-4">
              <div className="flex gap-4">
                {/* Large rank number */}
                <span className="text-4xl font-bold text-[#04453f] w-8 flex-shrink-0">
                  {index + 1}
                </span>

                {/* Content and image */}
                <div className="flex-1 min-w-0">
                  <Link href={articleUrl} className="group block">
                    {/* Image */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden mb-3">
                      <Image
                        src={imageUrl}
                        alt={articleTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Title */}
                    <h4
                      className="title-card text-sm leading-snug group-hover:text-[#04453f] transition-colors"
                      dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                    />
                  </Link>

                  {/* Author and views */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      <span className="text-[#04453f] font-medium">{authorName}</span>
                    </p>
                    {formatViewCount((article as TrendingArticle).viewCount) && (
                      <span className="text-sm text-gray-500 font-medium">
                        {formatViewCount((article as TrendingArticle).viewCount)} vues
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
      <div className="bg-white rounded overflow-hidden divide-y divide-gray-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex gap-4">
              <div className="w-8 h-10 bg-gray-200 rounded flex-shrink-0" />
              <div className="flex-1">
                <div className="w-full aspect-[16/10] bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="h-3 bg-gray-200 rounded w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

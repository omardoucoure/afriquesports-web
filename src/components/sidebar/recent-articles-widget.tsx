"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate, getFeaturedImageUrl, getArticleUrl } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

interface RecentArticlesWidgetProps {
  title?: string;
  articles: WordPressPost[];
  maxArticles?: number;
  locale?: string;
}

export function RecentArticlesWidget({
  title = "Articles récents",
  articles,
  maxArticles = 5,
  locale = "fr",
}: RecentArticlesWidgetProps) {
  const displayArticles = articles.slice(0, maxArticles);

  if (!displayArticles.length) {
    return null;
  }

  return (
    <div className="bg-white rounded p-4">
      {/* Header */}
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>

      {/* Articles list */}
      <div className="space-y-4">
        {displayArticles.map((article, index) => {
          const imageUrl = getFeaturedImageUrl(article, "thumbnail");
          const articleUrl = getArticleUrl(article);
          const formattedDate = formatDate(article.date, locale);

          return (
            <Link
              key={article.id}
              href={articleUrl}
              className="flex gap-3 group"
            >
              {/* Number or image */}
              {imageUrl ? (
                <div className="relative w-20 h-14 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={imageUrl}
                    alt={article.title.rendered}
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#04453f] rounded-full">
                  <span className="text-[#022a27] font-bold text-sm">
                    {index + 1}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#022a27] transition-colors"
                  dangerouslySetInnerHTML={{ __html: article.title.rendered }}
                />
                <time className="block mt-1 text-xs text-gray-500">
                  {formattedDate}
                </time>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function RecentArticlesWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded p-4 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-20 h-14 bg-gray-200 rounded flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

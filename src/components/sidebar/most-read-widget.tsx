"use client";

import Link from "next/link";
import { getArticleUrl } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

interface MostReadWidgetProps {
  title?: string;
  articles: WordPressPost[];
  maxArticles?: number;
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      {/* Header */}
      <h3 className="font-bold text-gray-900 mb-4">{title}</h3>

      {/* Articles list with numbers */}
      <div className="space-y-3">
        {displayArticles.map((article, index) => {
          const articleUrl = getArticleUrl(article);

          return (
            <Link
              key={article.id}
              href={articleUrl}
              className="flex items-start gap-3 group"
            >
              {/* Rank number */}
              <span
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                  index === 0
                    ? "bg-[#9DFF20] text-[#345C00]"
                    : index === 1
                    ? "bg-gray-800 text-white"
                    : index === 2
                    ? "bg-gray-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index + 1}
              </span>

              {/* Title */}
              <h4
                className="flex-1 text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-[#345C00] transition-colors pt-1"
                dangerouslySetInnerHTML={{ __html: article.title.rendered }}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Skeleton for loading state
export function MostReadWidgetSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="h-5 w-28 bg-gray-200 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 pt-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-1" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

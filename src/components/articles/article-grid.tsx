"use client";

import { useTranslations } from "next-intl";
import { ArticleCard } from "./article-card";
import type { WordPressPost } from "@/lib/data-fetcher";

interface ArticleGridProps {
  articles: WordPressPost[];
  columns?: 1 | 2 | 3 | 4;
  showExcerpt?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  priorityCount?: number;
  locale?: string;
}

export function ArticleGrid({
  articles,
  columns = 3,
  showExcerpt = false,
  showDate = true,
  showCategory = true,
  priorityCount = 3,
  locale = "fr",
}: ArticleGridProps) {
  const tArticle = useTranslations("article");
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{tArticle("noArticles")}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4 md:gap-6`}>
      {articles.map((article, index) => (
        <ArticleCard
          key={article.id}
          article={article}
          priority={index < priorityCount}
          showExcerpt={showExcerpt}
          showDate={showDate}
          showCategory={showCategory}
          locale={locale}
        />
      ))}
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg overflow-hidden">
          <div className="aspect-video bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-full bg-gray-200 rounded" />
            <div className="h-5 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

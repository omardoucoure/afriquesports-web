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

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArticleCard } from "./article-card";
import { ArticleCardHorizontal, ArticleCardHorizontalSkeleton } from "./article-card-horizontal";
import type { WPPost } from "@/lib/data-fetcher";

interface LoadMoreArticlesProps {
  initialArticles: WPPost[];
  initialOffset: number;
  perPage?: number;
  loadMoreText?: string;
  loadingText?: string;
  noMoreText?: string;
}

export function LoadMoreArticles({
  initialArticles,
  initialOffset,
  perPage = 20,
  loadMoreText,
  loadingText,
  noMoreText,
}: LoadMoreArticlesProps) {
  const tHome = useTranslations("home");
  const displayLoadMore = loadMoreText || tHome("loadMore");
  const displayLoading = loadingText || tHome("loading");
  const displayNoMore = noMoreText || tHome("noMoreArticles");
  const [articles, setArticles] = useState<WPPost[]>(initialArticles);
  const [offset, setOffset] = useState(initialOffset + initialArticles.length);
  const [hasMore, setHasMore] = useState(initialArticles.length === perPage);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    try {
      // Fetch more articles from our API route
      const response = await fetch(
        `/api/posts?per_page=${perPage}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch articles");
      }

      const newArticles: WPPost[] = await response.json();

      startTransition(() => {
        if (newArticles.length > 0) {
          setArticles((prev) => [...prev, ...newArticles]);
          setOffset((prev) => prev + newArticles.length);
          setHasMore(newArticles.length === perPage);
        } else {
          setHasMore(false);
        }
      });
    } catch (error) {
      console.error("Error loading more articles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Vertical list with horizontal cards - both mobile and desktop */}
      <div className="space-y-4">
        {articles.map((article, index) => (
          <ArticleCardHorizontal
            key={article.id}
            article={article}
            priority={index < 3}
          />
        ))}

        {/* Loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <ArticleCardHorizontalSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Load more button */}
      <div className="mt-8 text-center">
        {hasMore ? (
          <button
            onClick={loadMore}
            disabled={isLoading || isPending}
            className="inline-block px-8 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isPending ? displayLoading : displayLoadMore}
          </button>
        ) : (
          <p className="text-gray-500 text-sm">{displayNoMore}</p>
        )}
      </div>
    </div>
  );
}

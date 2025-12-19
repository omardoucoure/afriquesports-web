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
      {/* Mobile: Vertical list with horizontal cards */}
      <div className="lg:hidden space-y-4">
        {articles.map((article, index) => (
          <ArticleCardHorizontal
            key={article.id}
            article={article}
            priority={index < 3}
          />
        ))}

        {/* Mobile loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <ArticleCardHorizontalSkeleton key={`skeleton-mobile-${i}`} />
            ))}
          </>
        )}
      </div>

      {/* Desktop: Grid layout with vertical cards */}
      <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="default"
            priority={index < 6}
          />
        ))}

        {/* Desktop loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={`skeleton-desktop-${i}`} className="bg-white rounded overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
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

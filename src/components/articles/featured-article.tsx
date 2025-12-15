"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDate, getFeaturedImageUrl, getCategoryLabel, getArticleUrl } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

interface FeaturedArticleProps {
  article: WordPressPost;
  locale?: string;
}

export function FeaturedArticle({ article, locale = "fr" }: FeaturedArticleProps) {
  const imageUrl = getFeaturedImageUrl(article, "full");
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = getArticleUrl(article);
  const formattedDate = formatDate(article.date, locale);

  return (
    <article className="group relative rounded-xl overflow-hidden">
      <Link href={articleUrl} className="block">
        {/* Background image */}
        <div className="relative aspect-[16/9] md:aspect-[21/9]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title.rendered}
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          {/* Category badge */}
          {categoryLabel && (
            <span className="inline-block px-3 py-1 bg-[#9DFF20] text-[#345C00] text-xs font-bold uppercase tracking-wider rounded mb-3">
              {categoryLabel}
            </span>
          )}

          {/* Title */}
          <h2
            className="text-xl md:text-3xl lg:text-4xl font-bold text-white line-clamp-3 group-hover:text-[#9DFF20] transition-colors"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />

          {/* Excerpt - hidden on mobile */}
          {article.excerpt && (
            <p
              className="hidden md:block mt-3 text-base text-gray-200 line-clamp-2 max-w-3xl"
              dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
            />
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-4">
            <time className="text-sm text-gray-300">{formattedDate}</time>
            <span className="text-[#9DFF20] text-sm font-medium group-hover:underline">
              Lire l&apos;article →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// Featured article skeleton for loading states
export function FeaturedArticleSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-[16/9] md:aspect-[21/9] bg-gray-300" />
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
        <div className="h-6 w-24 bg-gray-400 rounded mb-3" />
        <div className="h-8 md:h-12 w-3/4 bg-gray-400 rounded mb-2" />
        <div className="hidden md:block h-4 w-1/2 bg-gray-400 rounded" />
        <div className="h-4 w-32 bg-gray-400 rounded mt-4" />
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate, getFeaturedImageUrl, getCategoryLabel, getArticleUrl } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

interface ArticleCardProps {
  article: WordPressPost;
  variant?: "default" | "compact" | "horizontal";
  priority?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  locale?: string;
}

export function ArticleCard({
  article,
  variant = "default",
  priority = false,
  showExcerpt = false,
  showDate = true,
  showCategory = true,
  locale = "fr",
}: ArticleCardProps) {
  const tCommon = useTranslations("common");
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = getArticleUrl(article);
  const formattedDate = formatDate(article.date, locale);

  // Default vertical card
  if (variant === "default") {
    return (
      <article className="group bg-white rounded overflow-hidden">
        <Link href={articleUrl} className="block">
          {/* Image */}
          <div className="relative aspect-video overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={article.title.rendered}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{tCommon("noImage")}</span>
              </div>
            )}

            {/* Category badge */}
            {showCategory && categoryLabel && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-[#04453f] text-white text-xs font-semibold rounded">
                {categoryLabel}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3
              className="title-card group-hover:text-[#022a27] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />

            {showExcerpt && article.excerpt && (
              <p
                className="mt-2 text-sm text-gray-600 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
              />
            )}

            {showDate && (
              <time className="block mt-3 text-xs text-gray-500">{formattedDate}</time>
            )}
          </div>
        </Link>
      </article>
    );
  }

  // Compact card (smaller, for sidebar)
  if (variant === "compact") {
    return (
      <article className="group flex gap-3">
        <Link href={articleUrl} className="flex-shrink-0">
          <div className="relative w-20 h-20 rounded overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={article.title.rendered}
                fill
                sizes="80px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200" />
            )}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={articleUrl}>
            <h4
              className="title-card text-sm group-hover:text-[#022a27] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />
          </Link>
          {showDate && (
            <time className="block mt-1 text-xs text-gray-500">{formattedDate}</time>
          )}
        </div>
      </article>
    );
  }

  // Horizontal card (image left, content right)
  if (variant === "horizontal") {
    return (
      <article className="group bg-white rounded overflow-hidden">
        <Link href={articleUrl} className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="relative sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={article.title.rendered}
                fill
                sizes="(max-width: 640px) 100vw, 40vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{tCommon("noImage")}</span>
              </div>
            )}

            {/* Category badge */}
            {showCategory && categoryLabel && (
              <span className="absolute top-3 left-3 px-2 py-1 bg-[#04453f] text-white text-xs font-semibold rounded">
                {categoryLabel}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
            <h3
              className="title-article text-lg group-hover:text-[#022a27]"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />

            {showExcerpt && article.excerpt && (
              <p
                className="mt-2 text-sm text-gray-600 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
              />
            )}

            {showDate && (
              <time className="block mt-3 text-xs text-gray-500">{formattedDate}</time>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return null;
}

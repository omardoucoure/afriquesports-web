"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate, getFeaturedImageUrl, getCategoryLabel, getArticleUrl, getAuthorName } from "@/lib/utils";
import { useAnalytics } from "@/hooks/use-analytics";
import { useIsDesktop } from "@/hooks/use-media-query";
import type { WordPressPost } from "@/lib/data-fetcher";

interface ArticleCardProps {
  article: WordPressPost;
  variant?: "default" | "compact" | "horizontal";
  priority?: boolean;
  showExcerpt?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  locale?: string;
  position?: number;
  section?: "hero" | "latest" | "featured" | "related" | "most-read" | "category" | "search";
}

export function ArticleCard({
  article,
  variant = "default",
  priority = false,
  showExcerpt = false,
  showDate = true,
  showCategory = true,
  locale = "fr",
  position = 0,
  section = "latest",
}: ArticleCardProps) {
  const tCommon = useTranslations("common");
  const { trackArticleClick } = useAnalytics();
  const isDesktop = useIsDesktop();
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categoryLabel = getCategoryLabel(article);
  const articleUrl = getArticleUrl(article);
  const formattedDate = formatDate(article.date, locale);
  const authorName = getAuthorName(article);

  // Track article click
  const handleClick = () => {
    trackArticleClick({
      articleId: article.id.toString(),
      articleTitle: article.title.rendered.replace(/<[^>]*>/g, ''), // Strip HTML tags
      articleCategory: categoryLabel || 'uncategorized',
      variant,
      position,
      section,
    });
  };

  // Default vertical card
  if (variant === "default") {
    return (
      <article className="group bg-white rounded overflow-hidden">
        <Link href={articleUrl} className="block" onClick={handleClick}>
          {/* Image - Only rendered on desktop for LCP optimization */}
          {isDesktop && (
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
          )}

          {/* Content */}
          <div className="p-4">
            {/* Mobile-only category badge (when image not shown) */}
            {!isDesktop && showCategory && categoryLabel && (
              <span className="inline-block mb-2 px-2 py-1 bg-[#04453f] text-white text-xs font-semibold rounded">
                {categoryLabel}
              </span>
            )}

            <h3
              className="title-card group-hover:text-[#022a27] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />

            {/* Meta: author and date */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">{authorName}</span>
              {showDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <time dateTime={article.date}>{formattedDate}</time>
                </>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Compact card (smaller, for sidebar)
  if (variant === "compact") {
    return (
      <article className="group flex gap-3">
        <Link href={articleUrl} className="flex-shrink-0" onClick={handleClick}>
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
          <Link href={articleUrl} onClick={handleClick}>
            <h4
              className="title-card text-sm group-hover:text-[#022a27] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />
          </Link>
          {/* Meta: author and date */}
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium truncate">{authorName}</span>
            {showDate && (
              <>
                <span className="text-gray-300">•</span>
                <time dateTime={article.date} className="whitespace-nowrap">{formattedDate}</time>
              </>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Horizontal card (image left, content right)
  if (variant === "horizontal") {
    return (
      <article className="group bg-white rounded overflow-hidden">
        <Link href={articleUrl} className="flex flex-col sm:flex-row" onClick={handleClick}>
          {/* Image - Only rendered on desktop for LCP optimization */}
          {isDesktop && (
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
          )}

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
            {/* Mobile-only category badge (when image not shown) */}
            {!isDesktop && showCategory && categoryLabel && (
              <span className="inline-block mb-2 px-2 py-1 bg-[#04453f] text-white text-xs font-semibold rounded">
                {categoryLabel}
              </span>
            )}

            <h3
              className="title-article text-lg group-hover:text-[#022a27]"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />

            {/* Meta: author and date */}
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">{authorName}</span>
              {showDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <time dateTime={article.date}>{formattedDate}</time>
                </>
              )}
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return null;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate, getFeaturedImageUrl, getCategoryLabel, getArticleUrl } from "@/lib/utils";
import type { WordPressPost } from "@/lib/data-fetcher";

interface FeaturedArticleProps {
  article: WordPressPost;
  locale?: string;
}

export function FeaturedArticle({ article, locale = "fr" }: FeaturedArticleProps) {
  const tCommon = useTranslations("common");
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
            <span className="inline-block px-3 py-1 bg-[#04453f] text-white text-xs font-bold uppercase tracking-wider rounded mb-3">
              {categoryLabel}
            </span>
          )}

          {/* Title */}
          <h2
            className="title-main text-white text-xl md:text-3xl lg:text-4xl line-clamp-3 group-hover:text-[#04453f] transition-colors"
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
            <span className="text-[#04453f] text-sm font-medium group-hover:underline">
              {tCommon("readMore")} →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}


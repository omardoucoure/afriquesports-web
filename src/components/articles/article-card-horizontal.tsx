import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { WordPressPost } from "@/lib/data-fetcher";
import {
  formatDate,
  getFeaturedImageUrl,
  getArticleUrl,
  getAuthorName,
  getCategoryName,
  stripHtml,
} from "@/lib/utils";

interface ArticleCardHorizontalProps {
  article: WordPressPost;
  priority?: boolean;
  locale?: string;
}

export function ArticleCardHorizontal({
  article,
  priority = false,
  locale = "fr",
}: ArticleCardHorizontalProps) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);
  const title = stripHtml(article.title.rendered);
  const authorName = getAuthorName(article);

  return (
    <article className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100">
      <Link href={articleUrl} className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Thumbnail */}
        <div className="relative w-[100px] h-[75px] sm:w-[140px] sm:h-[100px] md:w-[180px] md:h-[120px] flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100px, (max-width: 768px) 140px, 180px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            quality={85}
            priority={priority}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category badge with background */}
          <div className="mb-1.5">
            <span className="inline-block px-2 py-0.5 text-[10px] sm:text-xs font-bold text-white bg-[#04453f] uppercase tracking-wide rounded">
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h3
            className="title-article text-sm sm:text-base md:text-lg group-hover:text-[#04453f] transition-colors"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />

          {/* Excerpt */}
          {article.excerpt?.rendered && (
            <p
              className="mt-1 text-xs sm:text-sm text-gray-500 line-clamp-1 sm:line-clamp-2"
              dangerouslySetInnerHTML={{ __html: article.excerpt.rendered }}
            />
          )}

          {/* Meta */}
          <div className="mt-auto pt-1.5 sm:pt-2 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <span className="font-medium text-gray-700 truncate">{authorName}</span>
            <span className="text-gray-300 hidden sm:inline">•</span>
            <time dateTime={article.date} className="whitespace-nowrap hidden sm:inline">{formatDate(article.date)}</time>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ArticleCardHorizontalSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg overflow-hidden border border-transparent">
      <div className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="w-[100px] h-[75px] sm:w-[140px] sm:h-[100px] md:w-[180px] md:h-[120px] flex-shrink-0 bg-gray-200 rounded-lg" />
        <div className="flex flex-col flex-1 min-w-0">
          <div className="h-5 w-16 bg-gray-200 rounded mb-1.5" />
          <div className="h-4 w-full bg-gray-200 rounded mb-1" />
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="mt-auto flex items-center gap-2">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded hidden sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

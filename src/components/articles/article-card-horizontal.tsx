import Image from "next/image";
import Link from "next/link";
import type { WordPressPost } from "@/lib/data-fetcher";
import {
  formatDate,
  getFeaturedImageUrl,
  getAuthorName,
  getCategorySlug,
  getCategoryName,
  stripHtml,
} from "@/lib/utils";

interface ArticleCardHorizontalProps {
  article: WordPressPost;
  priority?: boolean;
}

export function ArticleCardHorizontal({
  article,
  priority = false,
}: ArticleCardHorizontalProps) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;
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
          {/* Category */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9DFF20] flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-bold text-[#04453f] uppercase tracking-wide">
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h3
            className="title-article text-sm sm:text-base md:text-lg group-hover:text-[#04453f] transition-colors"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />

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
    <div className="bg-white rounded-lg overflow-hidden p-3 sm:p-4 animate-pulse">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-[100px] h-[75px] sm:w-[140px] sm:h-[100px] md:w-[180px] md:h-[120px] bg-gray-200 flex-shrink-0 rounded-lg" />
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
            <div className="h-2.5 bg-gray-200 rounded w-16" />
          </div>
          {/* Title */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-full mb-1" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3" />
          {/* Meta */}
          <div className="mt-auto pt-1 sm:pt-2 flex items-center gap-2 sm:gap-3">
            <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-20" />
            <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-1 hidden sm:block" />
            <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-24 hidden sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

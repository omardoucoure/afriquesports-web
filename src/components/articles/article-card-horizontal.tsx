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
    <article className="bg-white rounded overflow-hidden">
      <Link href={articleUrl} className="flex gap-3 sm:gap-4 p-3 sm:p-4">
        {/* Thumbnail - responsive sizes */}
        <div className="relative w-[100px] h-[75px] sm:w-[140px] sm:h-[100px] md:w-[180px] md:h-[120px] flex-shrink-0 overflow-hidden rounded">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100px, (max-width: 768px) 140px, 180px"
            className="object-cover"
            priority={priority}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category above title */}
          <span className="text-[10px] sm:text-xs font-bold text-[#04453f] uppercase mb-1">
            {categoryName}
          </span>

          <h3
            className="title-article text-sm sm:text-base md:text-lg"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />

          {/* Meta */}
          <div className="mt-auto pt-1 sm:pt-2 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
            <span className="font-medium truncate">{authorName}</span>
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
    <div className="bg-white rounded overflow-hidden p-3 sm:p-4 animate-pulse">
      <div className="flex gap-3 sm:gap-4">
        <div className="w-[100px] h-[75px] sm:w-[140px] sm:h-[100px] md:w-[180px] md:h-[120px] bg-gray-200 flex-shrink-0 rounded" />
        <div className="flex flex-col flex-1 min-w-0">
          {/* Category placeholder */}
          <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 mb-2" />
          {/* Title placeholder */}
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-full mb-1" />
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-2 sm:mb-3" />
          {/* Excerpt placeholder */}
          <div className="h-4 bg-gray-200 rounded w-full mb-1 hidden md:block" />
          <div className="h-4 bg-gray-200 rounded w-2/3 hidden md:block" />
          {/* Meta placeholder */}
          <div className="mt-auto pt-1 sm:pt-2 flex items-center gap-2 sm:gap-3">
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-24 sm:w-20" />
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-1 hidden sm:block" />
            <div className="h-2 sm:h-3 bg-gray-200 rounded w-20 sm:w-24 hidden sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from "next/image";
import Link from "next/link";
import { useIsDesktop } from "@/hooks/use-media-query";
import type { WordPressPost } from "@/lib/data-fetcher";
import {
  formatDate,
  getFeaturedImageUrl,
  getCategorySlug,
  getCategoryName,
  stripHtml,
} from "@/lib/utils";

interface HeroSectionProps {
  featuredArticle: WordPressPost;
  leftArticles: WordPressPost[];
  rightArticles: WordPressPost[];
  translations: {
    trending: string;
    latest: string;
    by: string;
  };
}

// Flash Feed Card - List format with timestamp
function FlashFeedCard({ article }: { article: WordPressPost }) {
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;

  // Format time as HH:MM
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <article className="group border-b border-gray-100 last:border-0">
      <Link href={articleUrl} className="flex gap-2.5 items-start hover:bg-gray-50 px-3 py-2.5 transition-all duration-200">
        <time className="text-xs font-bold text-gray-700 flex-shrink-0 pt-0.5 min-w-[38px]">
          {formatTime(article.date)}
        </time>
        <div className="flex-1 min-w-0">
          <h3
            className="text-xs leading-snug text-gray-900 group-hover:text-[#04453f] transition-colors line-clamp-2 font-medium"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />
        </div>
      </Link>
    </article>
  );
}

// Trending Card - Image + number format
function TrendingCard({
  article,
  index,
  priority = false,
  isDesktop = true,
}: {
  article: WordPressPost;
  index: number;
  priority?: boolean;
  isDesktop?: boolean;
}) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;

  const title = stripHtml(article.title.rendered);

  return (
    <article className="group">
      <Link href={articleUrl} className="block" aria-label={title}>
        {/* Image - Only rendered on desktop for LCP optimization */}
        {isDesktop && (
          <div className="relative aspect-[16/10] overflow-hidden mb-2 rounded-lg">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              quality={85}
              priority={priority}
            />
          </div>
        )}
      </Link>
      <div className="flex gap-3">
        <span className="text-4xl font-bold text-[#04453f]">{index}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
            <span className="font-medium text-[#04453f] uppercase">{categoryName}</span>
            <span className="text-gray-500">/</span>
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </div>
          <Link href={articleUrl}>
            <h3
              className="title-card text-sm group-hover:text-[#04453f] transition-colors"
              dangerouslySetInnerHTML={{ __html: article.title.rendered }}
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedHeroCard({
  article,
  byLabel,
  isDesktop = true,
}: {
  article: WordPressPost;
  byLabel: string;
  isDesktop?: boolean;
}) {
  const imageUrl = getFeaturedImageUrl(article, "full");
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;

  return (
    <article className="relative h-full min-h-[400px] lg:min-h-[480px] overflow-hidden group bg-black rounded-lg">
      <Link href={articleUrl} className="block h-full">
        {isDesktop && (
          <Image
            src={imageUrl}
            alt={stripHtml(article.title.rendered)}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            quality={85}
            priority
          />
        )}
        {/* Gradient overlay - stronger dark gradient at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
          {/* Category and date */}
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="font-bold text-[#9DFF20] uppercase">{categoryName}</span>
            <span className="text-white/80">/</span>
            <time dateTime={article.date} className="text-white/80">
              {formatDate(article.date)}
            </time>
          </div>

          {/* Title only */}
          <h2
            className="title-main text-white text-2xl md:text-3xl lg:text-4xl"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />
        </div>
      </Link>
    </article>
  );
}

function SideArticleCard({
  article,
  byLabel,
}: {
  article: WordPressPost;
  byLabel: string;
}) {
  const imageUrl = getFeaturedImageUrl(article, "thumbnail");
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;
  const title = stripHtml(article.title.rendered);

  return (
    <article className="flex gap-3 group">
      <Link href={articleUrl} className="flex-shrink-0" aria-label={title}>
        <div className="relative w-20 h-20 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="80px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            quality={75}
          />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
          <span className="font-medium text-[#04453f] uppercase">{categoryName}</span>
          <span className="text-gray-500">/</span>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
        <Link href={articleUrl}>
          <h3
            className="title-card text-sm group-hover:text-[#04453f] transition-colors"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />
        </Link>
      </div>
    </article>
  );
}

export function HeroSection({
  featuredArticle,
  leftArticles,
  rightArticles,
  translations,
}: HeroSectionProps) {
  const isDesktop = useIsDesktop();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[480px]">
      {/* Left column - Afrique Sports TV */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#04453f] text-white text-xs font-bold px-3 py-1 relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }}>
            {translations.latest}
          </span>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="flex-1 flex flex-col justify-between gap-4">
          {leftArticles.slice(0, 2).map((article, index) => (
            <TrendingCard
              key={article.id}
              article={article}
              index={index + 1}
              priority={index === 0}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      </div>

      {/* Center - Featured article - Hidden on mobile for LCP optimization */}
      <div className="hidden lg:flex lg:col-span-6 lg:flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#04453f] text-white text-xs font-bold px-3 py-1 relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }}>
            À LA UNE
          </span>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="flex-1">
          <FeaturedHeroCard article={featuredArticle} byLabel={translations.by} isDesktop={isDesktop} />
        </div>
      </div>

      {/* Right column - Fil Actu (Flash Feed) */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#04453f] text-white text-xs font-bold px-3 py-1 relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }}>
            {translations.trending}
          </span>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {rightArticles.map((article) => (
            <FlashFeedCard key={article.id} article={article} />
          ))}
        </div>
      </div>

      {/* Mobile: Show TV articles only */}
      <div className="lg:hidden mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#04453f] text-white text-xs font-bold px-3 py-1 relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }}>
            {translations.latest}
          </span>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {leftArticles.slice(0, 2).map((article, index) => (
            <TrendingCard
              key={article.id}
              article={article}
              index={index + 1}
              priority={false}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HeroSectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:min-h-[480px]">
      {/* Left column skeleton - matches FlashFeedCard */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gray-200 h-6 w-24 animate-pulse relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }} />
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-3 py-2 animate-pulse">
              <div className="w-10 h-4 bg-gray-200 rounded flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center skeleton */}
      <div className="lg:col-span-6">
        <div className="hidden lg:flex items-center gap-2 mb-4">
          <div className="bg-gray-200 h-6 w-24 animate-pulse relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }} />
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="relative h-[400px] lg:h-[480px] bg-gray-200 animate-pulse">
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 space-y-3">
            <div className="h-4 bg-gray-300 w-1/4" />
            <div className="h-8 bg-gray-300 w-3/4" />
            <div className="h-8 bg-gray-300 w-1/2" />
          </div>
        </div>
      </div>

      {/* Right column skeleton - matches TrendingCard */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-gray-200 h-6 w-20 animate-pulse relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }} />
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="flex-1 flex flex-col justify-between gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[16/10] bg-gray-200 mb-2" />
              <div className="flex gap-3">
                <div className="w-8 h-10 bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 w-2/3" />
                  <div className="h-4 bg-gray-200 w-full" />
                  <div className="h-4 bg-gray-200 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile skeleton */}
      <div className="lg:hidden space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gray-200 h-6 w-24 animate-pulse relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }} />
            <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 mb-2" />
                <div className="flex gap-3">
                  <div className="w-8 h-10 bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 w-2/3" />
                    <div className="h-4 bg-gray-200 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

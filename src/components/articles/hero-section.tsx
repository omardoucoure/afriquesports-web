import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { WordPressPost } from "@/lib/data-fetcher";
import {
  formatDate,
  getFeaturedImageUrl,
  getArticleUrl,
  getCategoryName,
  stripHtml,
} from "@/lib/utils";

interface HeroSectionProps {
  featuredArticle: WordPressPost;
  leftArticles: WordPressPost[];
  rightArticles: WordPressPost[];
  locale?: string;
  translations: {
    trending: string;
    latest: string;
    by: string;
    spotlight: string;
  };
}

// Flash Feed Card - List format with timestamp
function FlashFeedCard({ article, locale = "fr" }: { article: WordPressPost; locale?: string }) {
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);

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
  locale = "fr",
}: {
  article: WordPressPost;
  index: number;
  priority?: boolean;
  isDesktop?: boolean;
  locale?: string;
}) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);

  const title = stripHtml(article.title.rendered);

  return (
    <article className="group">
      <Link href={articleUrl} className="block" aria-label={title}>
        {/* Image - Always render, parent container handles visibility */}
        <div className="relative aspect-[16/10] overflow-hidden mb-2 rounded-lg">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            quality={75}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        </div>
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
  locale = "fr",
}: {
  article: WordPressPost;
  byLabel: string;
  isDesktop?: boolean;
  locale?: string;
}) {
  const imageUrl = getFeaturedImageUrl(article, "full");
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);

  return (
    <article className="relative h-full min-h-[400px] lg:min-h-[480px] overflow-hidden group bg-black rounded-lg">
      <Link href={articleUrl} className="block h-full">
        {/* Image - LCP element, optimized for fast loading */}
        <Image
          src={imageUrl}
          alt={stripHtml(article.title.rendered)}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
          quality={75}
          priority
          fetchPriority="high"
        />
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
  locale = "fr",
}: {
  article: WordPressPost;
  byLabel: string;
  locale?: string;
}) {
  const imageUrl = getFeaturedImageUrl(article, "thumbnail");
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);
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
  locale = "fr",
  translations,
}: HeroSectionProps) {
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
              isDesktop={true}
              locale={locale}
            />
          ))}
        </div>
      </div>

      {/* Center - Featured article - Hidden on mobile for LCP optimization */}
      <div className="hidden lg:flex lg:col-span-6 lg:flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#04453f] text-white text-xs font-bold px-3 py-1 relative" style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%)' }}>
            {translations.spotlight}
          </span>
          <div className="flex-1 h-0.5" style={{ background: 'linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)' }} />
        </div>
        <div className="flex-1">
          <FeaturedHeroCard article={featuredArticle} byLabel={translations.by} isDesktop={true} locale={locale} />
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
            <FlashFeedCard key={article.id} article={article} locale={locale} />
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
              isDesktop={false}
              locale={locale}
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
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex-1 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="hidden lg:flex lg:col-span-6 lg:flex-col">
        <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
        <div className="flex-1 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="hidden lg:flex lg:flex-col lg:col-span-3">
        <div className="h-6 w-24 bg-gray-200 rounded mb-4" />
        <div className="flex-1 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

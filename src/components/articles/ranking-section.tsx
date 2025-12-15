import Image from "next/image";
import Link from "next/link";
import type { WordPressPost } from "@/lib/data-fetcher";
import {
  formatDate,
  getFeaturedImageUrl,
  getCategorySlug,
  getCategoryName,
  stripHtml,
} from "@/lib/utils";

interface RankingSectionProps {
  articles: WordPressPost[];
  title: string;
  seeMoreText: string;
}

function RankingCard({ article }: { article: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categorySlug = getCategorySlug(article);
  const categoryName = getCategoryName(article);
  const articleUrl = `/${categorySlug}/${article.slug}`;

  return (
    <article className="bg-white rounded overflow-hidden group">
      <Link href={articleUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageUrl}
            alt={stripHtml(article.title.rendered)}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Category badge */}
          <span className="absolute top-3 left-3 px-2 py-1 bg-[#9DFF20] text-[#022a27] text-xs font-bold uppercase">
            {categoryName}
          </span>
        </div>
        <div className="p-4">
          <h3
            className="title-card text-base group-hover:text-[#04453f] transition-colors"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function RankingSection({ articles, title, seeMoreText }: RankingSectionProps) {
  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="container-main py-4 md:py-6">
      {/* Section header with gradient line */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="title-section whitespace-nowrap">{title}</h2>
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
          }}
        />
        <Link
          href="/classements"
          className="text-sm font-bold text-[#04453f] hover:underline whitespace-nowrap"
        >
          {seeMoreText} &rarr;
        </Link>
      </div>

      {/* Simple 3-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {articles.slice(0, 3).map((article) => (
          <RankingCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}

export function RankingSectionSkeleton() {
  return (
    <section className="container-main py-4 md:py-6">
      {/* Section header skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
        <div
          className="flex-1 h-0.5"
          style={{
            background:
              "linear-gradient(90deg, rgba(9,121,28,1) 0%, rgba(219,217,97,1) 37%, rgba(255,0,0,1) 88%)",
          }}
        />
        <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
      </div>

      {/* 3-column skeleton grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded overflow-hidden animate-pulse">
            <div className="aspect-[16/10] bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-full bg-gray-200 rounded" />
              <div className="h-5 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

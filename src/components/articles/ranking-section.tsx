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

interface RankingSectionProps {
  articles: WordPressPost[];
  title: string;
  seeMoreText: string;
}

function RankingCard({ article }: { article: WordPressPost }) {
  const imageUrl = getFeaturedImageUrl(article, "medium_large");
  const categoryName = getCategoryName(article);
  const articleUrl = getArticleUrl(article);

  return (
    <article className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
      <Link href={articleUrl} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageUrl}
            alt={stripHtml(article.title.rendered)}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Category badge */}
          <span className="absolute top-2 left-2 px-2.5 py-1 bg-[#04453f] text-white text-xs font-bold uppercase rounded shadow-md">
            {categoryName}
          </span>
        </div>
        <div className="p-3">
          <h3
            className="title-card text-base font-bold group-hover:text-[#04453f] transition-colors line-clamp-2 mb-2"
            dangerouslySetInnerHTML={{ __html: article.title.rendered }}
          />
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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
    <section className="container-main py-3 md:py-4">
      {/* Section header with gradient line */}
      <div className="flex items-center gap-3 mb-4">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 3).map((article) => (
          <RankingCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}


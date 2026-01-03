import { Suspense } from "react";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { ArticleGrid, ArticleGridSkeleton } from "@/components/articles";
import { Breadcrumb, Pagination } from "@/components/ui";
import { DataFetcher } from "@/lib/data-fetcher";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || "";

  return {
    title: query ? `Recherche : ${query}` : "Recherche",
    description: query
      ? `Résultats de recherche pour "${query}" sur Afrique Sports`
      : "Recherchez des articles sur Afrique Sports",
    robots: {
      index: false,
      follow: true,
    },
  };
}

const breadcrumbItems = [
  { label: "Accueil", href: "/" },
  { label: "Recherche", href: "/search" },
];

async function SearchResults({
  query,
  page,
}: {
  query: string;
  page: number;
}) {
  if (!query) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Que recherchez-vous ?
        </h2>
        <p className="text-gray-500">
          Utilisez la barre de recherche pour trouver des articles.
        </p>
      </div>
    );
  }

  const perPage = 12;
  const offset = (page - 1) * perPage;

  try {
    const articles = await DataFetcher.searchPosts(query, {
      per_page: perPage.toString(),
      offset: offset.toString(),
    });

    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Aucun résultat trouvé
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Nous n&apos;avons trouvé aucun article correspondant à &quot;{query}&quot;.
            Essayez avec d&apos;autres mots-clés.
          </p>
        </div>
      );
    }

    const hasMore = articles.length === perPage;
    const estimatedTotalPages = hasMore ? page + 1 : page;

    return (
      <>
        <p className="text-gray-600 mb-6">
          {articles.length} résultat{articles.length > 1 ? "s" : ""} pour &quot;{query}&quot;
        </p>

        <ArticleGrid
          articles={articles}
          columns={3}
          showCategory
          showDate
          showExcerpt
          priorityCount={page === 1 ? 6 : 0}
        />

        {(page > 1 || hasMore) && (
          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={estimatedTotalPages}
              basePath={`/search?q=${encodeURIComponent(query)}`}
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Error searching articles:", error);
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Une erreur s&apos;est produite lors de la recherche. Veuillez réessayer.
        </p>
      </div>
    );
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageParam } = await searchParams;
  const query = q || "";
  const currentPage = pageParam ? parseInt(pageParam, 10) : 1;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header">
        {/* Breadcrumb */}
        <div className="container-main py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Search header */}
        <section className="container-main pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {query ? `Recherche : ${query}` : "Recherche"}
          </h1>
        </section>

        {/* Search form */}
        <section className="container-main pb-6">
          <form action="/search" method="GET" className="max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Rechercher un article, un joueur, une équipe..."
                  autoComplete="off"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04453f] focus:border-transparent outline-none transition-shadow"
                />
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-[#04453f] text-white font-bold rounded-lg hover:bg-[#8de619] transition-colors"
              >
                Rechercher
              </button>
            </div>
          </form>

          {/* Popular searches */}
          {!query && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-500 mb-3">
                Recherches populaires
              </p>
              <div className="flex flex-wrap gap-2">
                {["CAN 2025", "Sadio Mané", "Mohamed Salah", "Mercato", "Sénégal", "Maroc"].map(
                  (term) => (
                    <a
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-[#04453f] hover:text-[#022a27] hover:border-transparent transition-colors"
                    >
                      {term}
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </section>

        {/* Search results */}
        <div className="container-main py-6">
          <Suspense fallback={<ArticleGridSkeleton count={12} />}>
            <SearchResults query={query} page={currentPage} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

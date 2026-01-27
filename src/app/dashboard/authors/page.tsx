"use client";

import { useEffect, useState, useMemo } from "react";
import { Users, TrendingUp, FileText, Search, X } from "lucide-react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { cn } from "@/lib/utils";

interface AuthorData {
  summary: {
    totalAuthors: number;
    totalArticles: number;
    avgArticlesPerAuthor: number;
  };
  authors: Array<{
    id: number;
    name: string;
    slug: string;
    avatar?: string;
    articleCount: number;
    visitors: number;
    pageviews: number;
    avgDuration: number;
    bounceRate: number;
    topArticles: Array<{
      title: string;
      url: string;
      visitors: number;
    }>;
  }>;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-800 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthorsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [data, setData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<AuthorData["authors"][0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/analytics/authors?period=${dateRange}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const filteredAuthors = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data.authors;
    return data.authors.filter((author) =>
      author.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <X className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to load author data</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-[#9DFF20] text-black rounded-lg font-medium hover:bg-[#b4ff50] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Author Analytics</h1>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Authors</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {data.summary.totalAuthors}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <Users className="h-6 w-6 text-[#9DFF20]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Articles</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {data.summary.totalArticles.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <FileText className="h-6 w-6 text-[#9DFF20]" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Articles/Author</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {data.summary.avgArticlesPerAuthor.toFixed(1)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <TrendingUp className="h-6 w-6 text-[#9DFF20]" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search authors..."
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9DFF20] focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-6">
          {filteredAuthors.map((author) => (
            <div
              key={author.id}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#9DFF20] to-[#345C00] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{author.name}</h3>
                  <p className="text-sm text-gray-500">
                    {author.articleCount} article{author.articleCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAuthor(author)}
                  className="px-4 py-2 bg-[#9DFF20] text-black rounded-lg text-sm font-medium hover:bg-[#b4ff50] transition-colors"
                >
                  View Details
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {author.visitors.toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Page Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {author.pageviews.toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Avg. Duration</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(author.avgDuration)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Bounce Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {author.bounceRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredAuthors.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No authors found</h3>
              <p className="text-gray-500">Try adjusting your search query</p>
            </div>
          )}
        </div>
      </div>

      {selectedAuthor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#9DFF20] to-[#345C00] flex items-center justify-center text-white text-lg font-bold">
                  {selectedAuthor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedAuthor.name}</h2>
                  <p className="text-sm text-gray-400">
                    {selectedAuthor.articleCount} article
                    {selectedAuthor.articleCount !== 1 ? "s" : ""} published
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAuthor(null)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Unique Visitors</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedAuthor.visitors.toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Page Views</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedAuthor.pageviews.toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Avg. Duration</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(selectedAuthor.avgDuration)}
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Bounce Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedAuthor.bounceRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">Top Articles</h3>
              <div className="space-y-3">
                {selectedAuthor.topArticles.map((article, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#9DFF20] font-medium line-clamp-2"
                        >
                          {article.title}
                        </a>
                        <p className="text-sm text-gray-400 mt-1">{article.url}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">
                          {article.visitors.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">visitors</p>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedAuthor.topArticles.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No article data available for this period</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

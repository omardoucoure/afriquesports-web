"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  TrendingUp,
  FileText,
  Search,
  X,
  Eye,
  BarChart3,
  Trophy,
  Medal,
  Crown,
} from "lucide-react";
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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
        <Crown className="h-4 w-4 text-yellow-400" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300/20">
        <Medal className="h-4 w-4 text-gray-300" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20">
        <Medal className="h-4 w-4 text-orange-400" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800">
      <span className="text-xs font-bold text-gray-400">{rank}</span>
    </div>
  );
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

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-800 rounded mb-4"></div>
        <div className="h-48 bg-gray-800 rounded"></div>
      </div>

      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-900 rounded-xl border border-gray-800 p-4 animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-gray-800"></div>
              <div className="flex-1">
                <div className="h-5 w-40 bg-gray-800 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-800 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal bar chart for author comparison
function AuthorComparisonChart({
  authors,
  metric,
}: {
  authors: AuthorData["authors"];
  metric: "visitors" | "articleCount" | "pageviews";
}) {
  const top = authors.slice(0, 10);
  const maxValue = Math.max(...top.map((a) => a[metric]), 1);

  const metricLabel =
    metric === "visitors"
      ? "Visitors"
      : metric === "articleCount"
        ? "Articles"
        : "Page views";

  const barColor =
    metric === "visitors"
      ? "bg-[#9DFF20]"
      : metric === "articleCount"
        ? "bg-blue-500"
        : "bg-purple-500";

  return (
    <div className="space-y-2.5">
      {top.map((author, index) => {
        const value = author[metric];
        const widthPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={author.id} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-5 text-right shrink-0">
              {index + 1}
            </span>
            <span className="text-sm text-white w-28 sm:w-36 truncate shrink-0">
              {author.name}
            </span>
            <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-300">
                {formatNumber(value)}
              </span>
            </div>
          </div>
        );
      })}
      {top.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No data available
        </p>
      )}
    </div>
  );
}

export default function AuthorsPage() {
  const [dateRange, setDateRange] = useState("2d");
  const [data, setData] = useState<AuthorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<
    AuthorData["authors"][0] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chartMetric, setChartMetric] = useState<
    "visitors" | "articleCount" | "pageviews"
  >("visitors");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/analytics/authors?period=${dateRange}`
      );

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

  // Compute totals for the period
  const totalVisitors = useMemo(() => {
    if (!data) return 0;
    return data.authors.reduce((sum, a) => sum + a.visitors, 0);
  }, [data]);

  const totalPageviews = useMemo(() => {
    if (!data) return 0;
    return data.authors.reduce((sum, a) => sum + a.pageviews, 0);
  }, [data]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <X className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Failed to load author data
          </h2>
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
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-[#9DFF20]" />
            <h1 className="text-2xl font-bold">Author ranking</h1>
          </div>
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Authors</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold">
              {data.summary.totalAuthors}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <FileText className="h-4 w-4 text-blue-400" />
              <span className="text-xs uppercase tracking-wider">Articles</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-400">
              {data.summary.totalArticles.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Eye className="h-4 w-4 text-[#9DFF20]" />
              <span className="text-xs uppercase tracking-wider">Visitors</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#9DFF20]">
              {formatNumber(totalVisitors)}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <span className="text-xs uppercase tracking-wider">
                Page views
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-purple-400">
              {formatNumber(totalPageviews)}
            </p>
          </div>
        </div>

        {/* Comparison chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[#9DFF20]" />
              Author comparison
            </h2>
            <div className="flex gap-2">
              {(
                [
                  { key: "visitors", label: "Visitors" },
                  { key: "articleCount", label: "Articles" },
                  { key: "pageviews", label: "Page views" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setChartMetric(m.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    chartMetric === m.key
                      ? "bg-[#9DFF20] text-black"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <AuthorComparisonChart
            authors={data.authors}
            metric={chartMetric}
          />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search authors..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
            />
          </div>
        </div>

        {/* Author ranking list */}
        <div className="space-y-3">
          {filteredAuthors.map((author, index) => {
            const rank = data.authors.indexOf(author) + 1;
            return (
              <div
                key={author.id}
                onClick={() => setSelectedAuthor(author)}
                className={cn(
                  "bg-gray-900 rounded-xl border p-4 cursor-pointer transition-all hover:bg-gray-800/80",
                  rank === 1
                    ? "border-yellow-500/30"
                    : rank === 2
                      ? "border-gray-400/20"
                      : rank === 3
                        ? "border-orange-500/20"
                        : "border-gray-800"
                )}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Rank */}
                  <RankBadge rank={rank} />

                  {/* Avatar */}
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#9DFF20] to-[#345C00] flex items-center justify-center text-white text-sm sm:text-base font-bold flex-shrink-0">
                    {author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>

                  {/* Name + posts */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                      {author.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {author.articleCount} article
                      {author.articleCount !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-500">Page views</p>
                      <p className="text-sm font-semibold text-purple-400">
                        {formatNumber(author.pageviews)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Visitors</p>
                      <p className="text-sm sm:text-base font-bold text-[#9DFF20]">
                        {formatNumber(author.visitors)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredAuthors.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                No authors found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search query
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selectedAuthor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <RankBadge rank={data.authors.indexOf(selectedAuthor) + 1} />
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#9DFF20] to-[#345C00] flex items-center justify-center text-white text-base sm:text-lg font-bold">
                  {selectedAuthor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {selectedAuthor.name}
                  </h2>
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

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 mb-1">Articles</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400">
                    {selectedAuthor.articleCount}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 mb-1">Visitors</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#9DFF20]">
                    {formatNumber(selectedAuthor.visitors)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 mb-1">Page views</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-400">
                    {formatNumber(selectedAuthor.pageviews)}
                  </p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Views / article
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {selectedAuthor.articleCount > 0
                      ? formatNumber(
                          Math.round(
                            selectedAuthor.visitors /
                              selectedAuthor.articleCount
                          )
                        )
                      : "0"}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4">
                Top articles
              </h3>
              <div className="space-y-3">
                {selectedAuthor.topArticles.map((article, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-3 sm:p-4 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-xs text-gray-500 font-mono mt-1 shrink-0">
                          {index + 1}.
                        </span>
                        <div className="min-w-0">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-white hover:text-[#9DFF20] font-medium line-clamp-2"
                          >
                            {article.title}
                          </a>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-xl font-bold text-[#9DFF20]">
                          {formatNumber(article.visitors)}
                        </p>
                        <p className="text-xs text-gray-500">visitors</p>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedAuthor.topArticles.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">
                      No article data available for this period
                    </p>
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

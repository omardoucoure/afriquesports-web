"use client";

import { useEffect, useState } from "react";
import {
  Search,
  TrendingUp,
  FileText,
  AlertCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { cn } from "@/lib/utils";

interface SEOData {
  googleSearchConsole: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
    clicksChange?: number;
    impressionsChange?: number;
    ctrChange?: number;
    positionChange?: number;
  };
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  indexing: {
    indexed: number;
    notIndexed: number;
    excluded: number;
    errors: number;
  };
  sitemaps: Array<{
    url: string;
    status: "success" | "error" | "pending";
    lastSubmitted: string;
    urlsSubmitted: number;
    urlsIndexed: number;
  }>;
  coreWebVitals: {
    goodUrls: number;
    needsImprovement: number;
    poorUrls: number;
  };
}

interface ChangeIndicatorProps {
  value?: number;
  format?: "percentage" | "number" | "position";
}

function ChangeIndicator({ value, format = "percentage" }: ChangeIndicatorProps) {
  if (value === undefined || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
        <span>-</span>
      </span>
    );
  }

  const isPositive = format === "position" ? value < 0 : value > 0;
  const colorClass = isPositive ? "text-green-400" : "text-red-400";

  let formattedValue = "";
  if (format === "percentage") {
    formattedValue = `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  } else if (format === "position") {
    formattedValue = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  } else {
    formattedValue = `${value > 0 ? "+" : ""}${Math.abs(value).toLocaleString()}`;
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colorClass)}>
      {formattedValue}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
        <div className="h-10 w-40 bg-gray-800 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SEOPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [data, setData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/seo?period=${dateRange}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Transform API response to match SEOData interface
      const transformed: SEOData = {
        googleSearchConsole: {
          clicks: result.overview?.clicks || 0,
          impressions: result.overview?.impressions || 0,
          ctr: result.overview?.avgCtr || 0,
          avgPosition: result.overview?.avgPosition || 0,
          clicksChange: result.overview?.clicksChange,
          impressionsChange: result.overview?.impressionsChange,
          ctrChange: result.overview?.ctrChange,
          positionChange: result.overview?.positionChange,
        },
        topQueries: (result.topKeywords || []).map(
          (item: { keyword: string; clicks: number; impressions: number; ctr: number; position: number }) => ({
            query: item.keyword,
            clicks: item.clicks,
            impressions: item.impressions,
            ctr: item.ctr,
            position: item.position,
          })
        ),
        topPages: result.topPages || [],
        indexing: result.indexing || {
          indexed: 0,
          notIndexed: 0,
          excluded: 0,
          errors: 0,
        },
        sitemaps: result.sitemaps || [],
        coreWebVitals: result.coreWebVitals || {
          goodUrls: 0,
          needsImprovement: 0,
          poorUrls: 0,
        },
      };

      setData(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Failed to load SEO data</h2>
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
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">SEO Performance</h1>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.googleSearchConsole.clicks.toLocaleString()}
              </p>
              <div className="mt-1">
                <ChangeIndicator
                  value={data.googleSearchConsole.clicksChange}
                  format="number"
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <Search className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Impressions</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.googleSearchConsole.impressions.toLocaleString()}
              </p>
              <div className="mt-1">
                <ChangeIndicator
                  value={data.googleSearchConsole.impressionsChange}
                  format="number"
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <TrendingUp className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average CTR</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.googleSearchConsole.ctr.toFixed(1)}%
              </p>
              <div className="mt-1">
                <ChangeIndicator
                  value={data.googleSearchConsole.ctrChange}
                  format="percentage"
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <FileText className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Position</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.googleSearchConsole.avgPosition.toFixed(1)}
              </p>
              <div className="mt-1">
                <ChangeIndicator
                  value={data.googleSearchConsole.positionChange}
                  format="position"
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <MapPin className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Search Queries</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Query</th>
                    <th className="pb-3 font-medium text-right">Clicks</th>
                    <th className="pb-3 font-medium text-right">CTR</th>
                    <th className="pb-3 font-medium text-right">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries.slice(0, 10).map((query, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-900 max-w-xs truncate">{query.query}</td>
                      <td className="py-3 text-gray-900 text-right font-medium">
                        {query.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {query.ctr.toFixed(1)}%
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {query.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Pages</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Page</th>
                    <th className="pb-3 font-medium text-right">Clicks</th>
                    <th className="pb-3 font-medium text-right">CTR</th>
                    <th className="pb-3 font-medium text-right">Pos.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.slice(0, 10).map((page, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-900 max-w-xs truncate">
                        <a
                          href={`https://www.afriquesports.net${page.page}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#9DFF20] flex items-center gap-1"
                        >
                          {page.page}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 text-gray-900 text-right font-medium">
                        {page.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {page.ctr.toFixed(1)}%
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {page.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {(data.indexing.indexed > 0 || data.indexing.notIndexed > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Indexing Status</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-900">Indexed</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {data.indexing.indexed.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-gray-900">Not Indexed</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {data.indexing.notIndexed.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-900">Excluded</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {data.indexing.excluded.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-gray-900">Errors</span>
                </div>
                <span className="text-gray-900 font-semibold">
                  {data.indexing.errors.toLocaleString()}
                </span>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">Total URLs</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {(
                      data.indexing.indexed +
                      data.indexing.notIndexed +
                      data.indexing.excluded +
                      data.indexing.errors
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(data.coreWebVitals.goodUrls > 0 || data.coreWebVitals.needsImprovement > 0 || data.coreWebVitals.poorUrls > 0) && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Core Web Vitals</h2>
              </div>
              <div className="p-6 space-y-4">
                {(() => {
                  const total = data.coreWebVitals.goodUrls + data.coreWebVitals.needsImprovement + data.coreWebVitals.poorUrls;
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-green-500"></div>
                          <span className="text-gray-900">Good URLs</span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          {data.coreWebVitals.goodUrls.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${total > 0 ? (data.coreWebVitals.goodUrls / total) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                          <span className="text-gray-900">Needs Improvement</span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          {data.coreWebVitals.needsImprovement.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${total > 0 ? (data.coreWebVitals.needsImprovement / total) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-red-500"></div>
                          <span className="text-gray-900">Poor URLs</span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          {data.coreWebVitals.poorUrls.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${total > 0 ? (data.coreWebVitals.poorUrls / total) * 100 : 0}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {data.sitemaps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sitemaps</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3 font-medium">Sitemap URL</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Submitted</th>
                    <th className="pb-3 font-medium text-right">Indexed</th>
                    <th className="pb-3 font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sitemaps.map((sitemap, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-900 max-w-xs truncate">
                        <a
                          href={sitemap.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#9DFF20] flex items-center gap-1"
                        >
                          {sitemap.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            sitemap.status === "success" &&
                              "bg-green-100 text-green-700",
                            sitemap.status === "error" && "bg-red-100 text-red-700",
                            sitemap.status === "pending" && "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {sitemap.status === "success" && <CheckCircle className="h-3 w-3" />}
                          {sitemap.status === "error" && <XCircle className="h-3 w-3" />}
                          {sitemap.status === "pending" && <RefreshCw className="h-3 w-3" />}
                          {sitemap.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {sitemap.urlsSubmitted.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-900 text-right">
                        {sitemap.urlsIndexed.toLocaleString()}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(sitemap.lastSubmitted).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

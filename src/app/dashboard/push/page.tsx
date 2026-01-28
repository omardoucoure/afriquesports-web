"use client";

const PUSH_API_KEY = process.env.NEXT_PUBLIC_PUSH_API_KEY || "";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  MousePointerClick,
  Eye,
  Globe,
  Clock,
  Search,
  Newspaper,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface NotificationHistoryEntry {
  id: number;
  notification_id: string | null;
  title: string;
  body: string;
  image_url: string | null;
  target_url: string | null;
  topic: string | null;
  sent_count: number;
  success_count: number;
  failure_count: number;
  receive_count: number;
  click_count: number;
  created_at: number;
}

interface SubscriptionStats {
  total: number;
  active: number;
  byLanguage: Record<string, number>;
  bySource: Record<string, number>;
  todayNew: number;
}

interface SendResult {
  success: boolean;
  sentCount?: number;
  successCount?: number;
  failureCount?: number;
  invalidSubscriptionsRemoved?: number;
  testMode?: boolean;
  error?: string;
}

interface WordPressPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  date: string;
  link: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string }>;
    "wp:term"?: Array<Array<{ slug: string; name: string }>>;
  };
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatTime(timestamp);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function formatPostDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function PushPage() {
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [history, setHistory] = useState<NotificationHistoryEntry[]>([]);
  const [recentPosts, setRecentPosts] = useState<WordPressPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [language, setLanguage] = useState("all");
  const [testMode, setTestMode] = useState(false);

  // Search state
  const [historySearch, setHistorySearch] = useState("");
  const [postsSearch, setPostsSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/push/send", {
        headers: PUSH_API_KEY ? { "x-api-key": PUSH_API_KEY } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching push data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecentPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/posts?per_page=20&locale=fr");
      if (response.ok) {
        const posts = await response.json();
        setRecentPosts(Array.isArray(posts) ? posts : []);
      }
    } catch (error) {
      console.error("Error fetching recent posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchRecentPosts();
  }, [fetchData, fetchRecentPosts]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setSendResult({ success: false, error: "Title and body are required" });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(PUSH_API_KEY ? { "x-api-key": PUSH_API_KEY } : {}),
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
          targetUrl: targetUrl.trim() || undefined,
          language,
          testMode,
        }),
      });

      const result = await response.json();
      setSendResult(result);

      if (result.success && !testMode) {
        setTitle("");
        setBody("");
        setImageUrl("");
        setTargetUrl("");
        fetchData();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      setSendResult({ success: false, error: "Failed to send notification" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectPost = (post: WordPressPost) => {
    const postTitle = stripHtml(post.title.rendered);
    const postExcerpt = stripHtml(post.excerpt.rendered).slice(0, 150);
    const featuredImage =
      post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || "";
    const categorySlug =
      post._embedded?.["wp:term"]?.[0]?.[0]?.slug || "football";
    const articleUrl = `https://www.afriquesports.net/${categorySlug}/${post.slug}`;

    setTitle(postTitle);
    setBody(postExcerpt || postTitle);
    setImageUrl(featuredImage);
    setTargetUrl(articleUrl);

    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtered lists
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const query = historySearch.toLowerCase();
    return history.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.body.toLowerCase().includes(query)
    );
  }, [history, historySearch]);

  const filteredPosts = useMemo(() => {
    if (!postsSearch.trim()) return recentPosts;
    const query = postsSearch.toLowerCase();
    return recentPosts.filter((p) =>
      stripHtml(p.title.rendered).toLowerCase().includes(query)
    );
  }, [recentPosts, postsSearch]);

  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-[#9DFF20]" />
          <div>
            <h1 className="text-2xl font-bold">Push notifications</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {stats ? `${stats.active} active subscribers` : "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsLoading(true);
            fetchData();
            setIsLoadingPosts(true);
            fetchRecentPosts();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Total</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold">{stats?.total ?? "-"}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs uppercase tracking-wider">Active</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-400">
            {stats?.active ?? "-"}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Bell className="h-4 w-4 text-blue-400" />
            <span className="text-xs uppercase tracking-wider">Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-400">
            {stats?.todayNew ?? "-"}
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Globe className="h-4 w-4 text-purple-400" />
            <span className="text-xs uppercase tracking-wider">Languages</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {stats?.byLanguage &&
              Object.entries(stats.byLanguage).map(([lang, count]) => (
                <span
                  key={lang}
                  className="text-xs bg-gray-800 px-2 py-0.5 rounded"
                >
                  {lang.toUpperCase()}: {count}
                </span>
              ))}
            {!stats?.byLanguage && <span className="text-gray-500">-</span>}
          </div>
        </div>
      </div>

      {/* Result toast */}
      {sendResult && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
            sendResult.success
              ? "bg-green-900/50 text-green-300 border border-green-800"
              : "bg-red-900/50 text-red-300 border border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {sendResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="text-sm">
              {sendResult.success
                ? `Sent to ${sendResult.successCount}/${sendResult.sentCount} subscribers${sendResult.testMode ? " (test mode)" : ""}${sendResult.invalidSubscriptionsRemoved ? ` · ${sendResult.invalidSubscriptionsRemoved} expired removed` : ""}`
                : sendResult.error}
            </span>
          </div>
          <button
            onClick={() => setSendResult(null)}
            className="text-gray-400 hover:text-gray-200"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main content: form + history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Send form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-[#9DFF20]" />
            Send notification
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Breaking news title"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Message *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message"
                rows={3}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50 resize-none"
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Target URL
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://www.afriquesports.net/..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
                >
                  <option value="all">All languages</option>
                  <option value="fr">French only</option>
                  <option value="en">English only</option>
                  <option value="es">Spanish only</option>
                  <option value="ar">Arabic only</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-800 text-[#9DFF20] focus:ring-[#9DFF20]/50"
                  />
                  <span className="text-sm text-gray-400">
                    Test mode (5 max)
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSending || !title.trim() || !body.trim()}
              className={`w-full py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isSending || !title.trim() || !body.trim()
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-[#9DFF20] text-[#345C00] hover:bg-[#8BE01C]"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Notification history */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#9DFF20]" />
              Notification history
            </h2>
            {history.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                {history.length} sent
              </span>
            )}
          </div>

          {/* History search */}
          {history.length > 3 && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search notifications..."
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-10 w-10 mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">
                No notifications sent yet
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No results found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredHistory.map((n) => (
                <div
                  key={n.id}
                  className="bg-gray-800 rounded-lg p-3 border border-gray-700/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {n.body}
                      </p>
                    </div>
                    {n.topic && n.topic !== "all" && (
                      <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded uppercase shrink-0">
                        {n.topic}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      {n.success_count}/{n.sent_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {n.receive_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" />
                      {n.click_count}
                    </span>
                    <span className="ml-auto text-gray-600">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>

                  {n.target_url && (
                    <a
                      href={n.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#9DFF20]/60 hover:text-[#9DFF20] mt-1 block truncate"
                    >
                      {n.target_url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent posts section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-[#9DFF20]" />
            Recent articles
            <span className="text-xs text-gray-500 font-normal ml-1">
              Click to pre-fill notification
            </span>
          </h2>

          {/* Posts search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={postsSearch}
              onChange={(e) => setPostsSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#9DFF20]/50 focus:border-[#9DFF20]/50"
            />
          </div>
        </div>

        {isLoadingPosts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">
            <Newspaper className="h-10 w-10 mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">
              {postsSearch ? "No articles found" : "No recent articles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPosts.map((post) => {
              const postTitle = stripHtml(post.title.rendered);
              const postExcerpt = stripHtml(post.excerpt.rendered).slice(
                0,
                100
              );
              const featuredImage =
                post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              const categoryName =
                post._embedded?.["wp:term"]?.[0]?.[0]?.name || "";

              return (
                <button
                  key={post.id}
                  onClick={() => handleSelectPost(post)}
                  className="bg-gray-800 rounded-lg border border-gray-700/50 hover:border-[#9DFF20]/30 hover:bg-gray-750 transition-all text-left group p-3 flex gap-3"
                >
                  {/* Thumbnail */}
                  {featuredImage && (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-gray-700">
                      <img
                        src={featuredImage}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#9DFF20] transition-colors">
                      {postTitle}
                    </p>
                    {postExcerpt && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {postExcerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {categoryName && (
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded uppercase">
                          {categoryName}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {formatPostDate(post.date)}
                      </span>
                      <ArrowRight className="h-3 w-3 text-gray-600 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

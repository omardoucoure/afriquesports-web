"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  FileText,
  MousePointerClick,
  ExternalLink,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Radio,
} from "lucide-react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { cn } from "@/lib/utils";

/* ─── Platform Filter ─── */
interface PlatformFilterProps {
  value: string;
  onChange: (value: string) => void;
}

function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const platforms = [
    { label: "All", value: "all", icon: Globe },
    { label: "Desktop", value: "desktop", icon: Monitor },
    { label: "Mobile", value: "mobile", icon: Smartphone },
    { label: "Tablet", value: "tablet", icon: Tablet },
    { label: "TV", value: "tv", icon: Tv },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isActive = value === platform.value;
        return (
          <button
            key={platform.value}
            onClick={() => onChange(platform.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Helpers ─── */
function countryCodeToFlag(code: string): string {
  if (code === "unknown") return "\u{1F30D}";
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function TrafficSourceIcon({ source }: { source: string }) {
  const lowerSource = source.toLowerCase();

  if (lowerSource.includes("google")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }
  if (lowerSource.includes("facebook") || lowerSource.includes("fb.com")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (lowerSource.includes("youtube")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (lowerSource.includes("twitter") || lowerSource.includes("t.co")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#fff">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (lowerSource.includes("instagram")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="url(#ig-grad)">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FD5949" />
            <stop offset="50%" stopColor="#D6249F" />
            <stop offset="100%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }
  if (lowerSource.includes("linkedin")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  if (lowerSource.includes("whatsapp")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }
  if (lowerSource.includes("tiktok")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#fff">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  }
  if (lowerSource.includes("reddit")) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF4500">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }

  return (
    <div className="h-4 w-4 rounded-full bg-gradient-to-br from-[#9DFF20]/40 to-[#9DFF20]/10 flex items-center justify-center text-white text-[8px] font-bold">
      {source.charAt(0).toUpperCase()}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ─── Types ─── */
interface AnalyticsData {
  summary: {
    visitors: number;
    visitorsChange?: number;
    pageviews: number;
    pageviewsChange?: number;
    avgDuration: number;
    avgDurationChange?: number;
    bounceRate: number;
    bounceRateChange?: number;
  };
  realtimeUsers: number;
  timeseries: Array<{ date: string; visitors: number; isHourly?: boolean }>;
  topPages: Array<{ page: string; visitors: number; change?: number }>;
  countries: Array<{ country: string; code: string; visitors: number; change?: number }>;
  devices: Array<{ device: string; visitors: number; percentage: number }>;
  sources: Array<{ source: string; visitors: number; change?: number }>;
  events: Array<{ event: string; count: number; change?: number }>;
  referrers: Array<{ referrer: string; visitors: number; change?: number }>;
}

/* ─── Change Indicator ─── */
interface ChangeIndicatorProps {
  value?: number;
  format?: "percentage" | "number" | "duration";
}

function ChangeIndicator({ value, format = "percentage" }: ChangeIndicatorProps) {
  if (value === undefined || value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-white/25 text-[11px] font-medium">
        <Minus className="h-3 w-3" />
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

  let formattedValue = "";
  if (format === "percentage") {
    formattedValue = `${Math.abs(value).toFixed(1)}%`;
  } else if (format === "duration") {
    formattedValue = formatDuration(Math.abs(value));
  } else {
    formattedValue = Math.abs(value).toLocaleString();
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md",
        isPositive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"
      )}
    >
      <Icon className="h-3 w-3" />
      {formattedValue}
    </span>
  );
}

/* ─── Tab Button ─── */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200",
        active
          ? "bg-[#9DFF20] text-[#0A0A0F]"
          : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
      )}
    >
      {children}
    </button>
  );
}

/* ─── Skeletons ─── */
function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-20 bg-white/[0.06] rounded-md mb-3" />
          <div className="h-7 w-28 bg-white/[0.06] rounded-md mb-3" />
          <div className="h-5 w-16 bg-white/[0.06] rounded-md" />
        </div>
        <div className="h-10 w-10 bg-white/[0.04] rounded-xl" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] p-6 animate-pulse">
      <div className="h-5 w-44 bg-white/[0.06] rounded-md mb-6" />
      <div className="h-[220px] bg-white/[0.03] rounded-xl" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] animate-pulse">
      <div className="p-5 border-b border-white/[0.06]">
        <div className="h-5 w-36 bg-white/[0.06] rounded-md" />
      </div>
      <div className="p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-3.5 w-1/3 bg-white/[0.04] rounded-md" />
            <div className="h-3.5 w-16 bg-white/[0.04] rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-white/[0.06] rounded-lg animate-pulse" />
        <div className="h-9 w-48 bg-white/[0.06] rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <TableSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Error State ─── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <X className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-1.5">Failed to load analytics</h2>
        <p className="text-white/40 text-sm mb-5 max-w-sm">{message}</p>
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-[#9DFF20] text-[#0A0A0F] rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(157,255,32,0.25)] transition-all duration-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

/* ─── Full Screen Modal ─── */
function FullScreenModal({
  title,
  isOpen,
  onClose,
  children,
  searchValue,
  onSearchChange,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F]">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.06]">
          <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-5 w-5 text-white/40" />
          </button>
        </div>

        {onSearchChange && (
          <div className="p-5 sm:p-6 border-b border-white/[0.06]">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#9DFF20]/40 focus:border-[#9DFF20]/30 transition-all"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function StatsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [platform, setPlatform] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pages" | "countries" | "events" | "referrers">("pages");
  const [expandedModal, setExpandedModal] = useState<"pages" | "countries" | "events" | "referrers" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [realtimeUsers, setRealtimeUsers] = useState<number>(0);
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRealtimeUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/analytics?period=24h&platform=${platform}`);
      if (response.ok) {
        const result = await response.json();
        setRealtimeUsers(result.realtime?.activeUsers || 0);
      }
    } catch {
      // Silently fail
    }
  }, [platform]);

  useEffect(() => {
    realtimeIntervalRef.current = setInterval(fetchRealtimeUsers, 30000);
    return () => {
      if (realtimeIntervalRef.current) clearInterval(realtimeIntervalRef.current);
    };
  }, [fetchRealtimeUsers]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/analytics?period=${dateRange}&platform=${platform}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setRealtimeUsers(result.realtime?.activeUsers || 0);

      const transformed: AnalyticsData = {
        summary: {
          visitors: result.overview?.visitors || 0,
          visitorsChange: result.overview?.visitorsChange,
          pageviews: result.overview?.pageViews || 0,
          pageviewsChange: result.overview?.pageViewsChange,
          avgDuration: result.overview?.avgSessionDuration || 0,
          bounceRate: result.overview?.bounceRate || 0,
          bounceRateChange: result.overview?.bounceRateChange,
        },
        realtimeUsers: result.realtime?.activeUsers || 0,
        timeseries: (result.trafficByDate || []).map(
          (item: { date: string; visitors: number; isHourly?: boolean }) => ({
            date: item.date,
            visitors: item.visitors,
            isHourly: item.isHourly,
          })
        ),
        topPages: (result.topPages || []).map((item: { path: string; visitors: number }) => ({
          page: item.path,
          visitors: item.visitors,
        })),
        countries: (result.countries || []).map(
          (item: { country: string; countryCode: string; visitors: number }) => ({
            country: item.country,
            code: item.countryCode,
            visitors: item.visitors,
          })
        ),
        devices: (result.devices || []).map(
          (item: { device: string; visitors: number; percentage: number }) => ({
            device: item.device,
            visitors: item.visitors,
            percentage: item.percentage,
          })
        ),
        sources: (result.referrers || []).map((item: { source: string; visitors: number }) => ({
          source: item.source,
          visitors: item.visitors,
        })),
        events: (result.events || []).map((item: { eventName: string; count: number }) => ({
          event: item.eventName,
          count: item.count,
        })),
        referrers: (result.referrers || []).map((item: { source: string; visitors: number }) => ({
          referrer: item.source,
          visitors: item.visitors,
        })),
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
  }, [dateRange, platform]);

  const filteredPages = useMemo(() => {
    if (!data?.topPages || !searchQuery) return data?.topPages || [];
    return data.topPages.filter((p) => p.page.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data?.topPages, searchQuery]);

  const filteredCountries = useMemo(() => {
    if (!data?.countries || !searchQuery) return data?.countries || [];
    return data.countries.filter((c) => c.country.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data?.countries, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!data?.events || !searchQuery) return data?.events || [];
    return data.events.filter((e) => e.event.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data?.events, searchQuery]);

  const filteredReferrers = useMemo(() => {
    if (!data?.referrers || !searchQuery) return data?.referrers || [];
    return data.referrers.filter((r) => r.referrer.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data?.referrers, searchQuery]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No data available" onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-white tracking-tight">Analytics</h1>
          {realtimeUsers > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span className="text-[12px] font-bold text-emerald-400 tabular-nums">
                {realtimeUsers}
              </span>
              <span className="text-[10px] text-emerald-400/60 hidden sm:inline font-medium">
                online
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PlatformFilter value={platform} onChange={setPlatform} />
          <DateFilter value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative group overflow-hidden rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.1]">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-[#9DFF20]/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Unique visitors</p>
              <p className="mt-2 text-[28px] font-bold text-white leading-none tabular-nums">{data.summary.visitors.toLocaleString()}</p>
              <div className="mt-2.5"><ChangeIndicator value={data.summary.visitorsChange} /></div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#9DFF20]/[0.08]">
              <Users className="h-5 w-5 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.1]">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-blue-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Page views</p>
              <p className="mt-2 text-[28px] font-bold text-white leading-none tabular-nums">{data.summary.pageviews.toLocaleString()}</p>
              <div className="mt-2.5"><ChangeIndicator value={data.summary.pageviewsChange} /></div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/[0.08]">
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.1]">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-amber-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Avg. duration</p>
              <p className="mt-2 text-[28px] font-bold text-white leading-none tabular-nums">{formatDuration(data.summary.avgDuration)}</p>
              <div className="mt-2.5"><ChangeIndicator value={data.summary.avgDurationChange} format="duration" /></div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/[0.08]">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="relative group overflow-hidden rounded-2xl bg-[#13131A] border border-white/[0.06] p-5 transition-all duration-300 hover:border-white/[0.1]">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl bg-purple-500/5" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[12px] font-medium text-white/40 uppercase tracking-wider">Bounce rate</p>
              <p className="mt-2 text-[28px] font-bold text-white leading-none tabular-nums">{data.summary.bounceRate.toFixed(1)}%</p>
              <div className="mt-2.5"><ChangeIndicator value={data.summary.bounceRateChange} /></div>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/[0.08]">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] p-6">
        <h2 className="text-[15px] font-semibold text-white mb-5">Visitors over time</h2>
        <AnalyticsChart data={data.timeseries} />
      </div>

      {/* Tabbed Data */}
      <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <TabButton active={activeTab === "pages"} onClick={() => setActiveTab("pages")}>Top pages</TabButton>
            <TabButton active={activeTab === "countries"} onClick={() => setActiveTab("countries")}>Countries</TabButton>
            <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>Events</TabButton>
            <TabButton active={activeTab === "referrers"} onClick={() => setActiveTab("referrers")}>Referrers</TabButton>
          </div>
          <button
            onClick={() => setExpandedModal(activeTab)}
            className="text-[12px] text-[#9DFF20]/70 hover:text-[#9DFF20] font-semibold flex items-center gap-1 transition-colors"
          >
            View all
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>

        <div className="p-5">
          {activeTab === "pages" && (
            <div className="space-y-2">
              {data.topPages.slice(0, 10).map((page, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-white/20 w-5 text-right tabular-nums">{index + 1}</span>
                    <FileText className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                    <span className="text-white/70 truncate text-[13px]">{page.page}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {page.change !== undefined && <ChangeIndicator value={page.change} />}
                    <span className="text-white font-bold text-[13px] tabular-nums">{page.visitors.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "countries" && (
            <div className="space-y-2">
              {data.countries.slice(0, 10).map((country, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[10px] font-bold text-white/20 w-5 text-right tabular-nums">{index + 1}</span>
                    <span className="text-lg leading-none">{countryCodeToFlag(country.code)}</span>
                    <span className="text-white/70 text-[13px]">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {country.change !== undefined && <ChangeIndicator value={country.change} />}
                    <span className="text-white font-bold text-[13px] tabular-nums">{country.visitors.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-2">
              {data.events.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[10px] font-bold text-white/20 w-5 text-right tabular-nums">{index + 1}</span>
                    <MousePointerClick className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                    <span className="text-white/70 text-[13px]">{event.event}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {event.change !== undefined && <ChangeIndicator value={event.change} />}
                    <span className="text-white font-bold text-[13px] tabular-nums">{event.count.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "referrers" && (
            <div className="space-y-2">
              {data.referrers.slice(0, 10).map((ref, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-white/20 w-5 text-right tabular-nums">{index + 1}</span>
                    <TrafficSourceIcon source={ref.referrer} />
                    <span className="text-white/70 truncate text-[13px]">{ref.referrer}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {ref.change !== undefined && <ChangeIndicator value={ref.change} />}
                    <span className="text-white font-bold text-[13px] tabular-nums">{ref.visitors.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Devices */}
        <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-[15px] font-semibold text-white">Devices</h2>
          </div>
          <div className="p-5 space-y-4">
            {data.devices.map((device, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-[13px] font-medium">{device.device}</span>
                  <span className="text-white/30 text-[12px] font-semibold tabular-nums">{device.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/[0.04] rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${device.percentage}%`,
                      background: index === 0 ? "#9DFF20" : index === 1 ? "#60A5FA" : "#A78BFA",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="rounded-2xl bg-[#13131A] border border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-white/[0.06]">
            <h2 className="text-[15px] font-semibold text-white">Top traffic sources</h2>
          </div>
          <div className="p-5 space-y-2">
            {data.sources.slice(0, 5).map((source, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <TrafficSourceIcon source={source.source} />
                  <span className="text-white/60 text-[13px]">{source.source}</span>
                </div>
                <div className="flex items-center gap-3">
                  {source.change !== undefined && <ChangeIndicator value={source.change} />}
                  <span className="text-white font-bold text-[13px] tabular-nums">{source.visitors.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(["pages", "countries", "events", "referrers"] as const).map((tab) => (
        <FullScreenModal
          key={tab}
          title={tab === "pages" ? "All pages" : tab === "countries" ? "All countries" : tab === "events" ? "All events" : "All referrers"}
          isOpen={expandedModal === tab}
          onClose={() => { setExpandedModal(null); setSearchQuery(""); }}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        >
          <div className="space-y-1.5">
            {(tab === "pages" ? filteredPages : tab === "countries" ? filteredCountries : tab === "events" ? filteredEvents.map((e) => ({ page: e.event, visitors: e.count, change: e.change })) : filteredReferrers.map((r) => ({ page: r.referrer, visitors: r.visitors, change: r.change }))).map(
              (item: { page?: string; country?: string; code?: string; event?: string; referrer?: string; visitors: number; count?: number; change?: number }, index: number) => {
                const label = (item as { page?: string }).page || (item as { country?: string }).country || (item as { event?: string }).event || (item as { referrer?: string }).referrer || "";
                const val = item.visitors || (item as { count?: number }).count || 0;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-white/20 w-6 text-right tabular-nums">{index + 1}</span>
                      {tab === "countries" && (item as { code?: string }).code && (
                        <span className="text-lg">{countryCodeToFlag((item as { code: string }).code)}</span>
                      )}
                      {tab === "referrers" && <TrafficSourceIcon source={label} />}
                      {tab === "pages" && <FileText className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />}
                      {tab === "events" && <MousePointerClick className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />}
                      <span className="text-white/70 truncate text-[13px]">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {item.change !== undefined && <ChangeIndicator value={item.change} />}
                      <span className="text-white font-bold text-[13px] tabular-nums">{val.toLocaleString()}</span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </FullScreenModal>
      ))}
    </div>
  );
}

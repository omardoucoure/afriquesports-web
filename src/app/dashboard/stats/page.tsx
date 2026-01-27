"use client";

import { useEffect, useState, useMemo } from "react";
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
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
} from "lucide-react";
import { DateFilter } from "@/components/dashboard/date-filter";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { cn } from "@/lib/utils";

interface PlatformFilterProps {
  value: string;
  onChange: (value: string) => void;
}

function PlatformFilter({ value, onChange }: PlatformFilterProps) {
  const platforms = [
    { label: "All devices", value: "all", icon: Globe },
    { label: "Desktop", value: "desktop", icon: Monitor },
    { label: "Mobile", value: "mobile", icon: Smartphone },
    { label: "Tablet", value: "tablet", icon: Tablet },
    { label: "TV", value: "tv", icon: Tv },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {platforms.map((platform) => {
        const Icon = platform.icon;
        const isActive = value === platform.value;
        return (
          <button
            key={platform.value}
            onClick={() => onChange(platform.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-[#9DFF20] text-black"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function countryCodeToFlag(code: string): string {
  if (code === "unknown") return "🌍";
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
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
    );
  }

  if (lowerSource.includes("facebook") || lowerSource.includes("fb.com")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (lowerSource.includes("pinterest")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#E60023">
        <path d="M12 0a12 12 0 0 0-4.37 23.17c-.1-.92-.19-2.31 0-3.31l1.44-6.1s-.37-.74-.37-1.82c0-1.71 1-3 2.23-3 1 0 1.56.78 1.56 1.7 0 1-.68 2.6-1 4-.3 1.23.62 2.24 1.83 2.24 2.2 0 3.88-2.32 3.88-5.66 0-3-2.14-5-5.21-5-3.55 0-5.63 2.66-5.63 5.41 0 1.07.41 2.22.93 2.85a.3.3 0 0 1 .07.29l-.34 1.43c-.05.23-.18.28-.42.17-1.56-.73-2.54-3-2.54-4.84 0-3.92 2.85-7.53 8.21-7.53 4.31 0 7.66 3.07 7.66 7.18 0 4.28-2.7 7.73-6.44 7.73-1.26 0-2.44-.65-2.84-1.42l-.77 2.95c-.28 1.07-1 2.41-1.5 3.23A12 12 0 1 0 12 0z" />
      </svg>
    );
  }

  if (lowerSource.includes("instagram")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
        <defs>
          <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FD5949" />
            <stop offset="50%" stopColor="#D6249F" />
            <stop offset="100%" stopColor="#285AEB" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    );
  }

  if (lowerSource.includes("youtube")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (lowerSource.includes("twitter") || lowerSource.includes("t.co")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1DA1F2">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    );
  }

  if (lowerSource.includes("linkedin")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }

  if (lowerSource.includes("bing")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#008373">
        <path d="M5.71 3.67v11.63l4.38 2.61 5.63-3.16-2.26-1.28-2.46 1.38v-4.5l5.63-2.61L21 10.26v5.37l-9.33 5.37-5.95-3.54V3.67z" />
      </svg>
    );
  }

  if (lowerSource.includes("ecosia")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#60B515" />
        <path
          d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
          fill="white"
        />
      </svg>
    );
  }

  if (lowerSource.includes("yahoo")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#6001D2">
        <path d="M12.005 0C5.395 0 .05 5.345.05 11.955c0 6.61 5.345 11.955 11.955 11.955s11.955-5.345 11.955-11.955C23.96 5.345 18.615 0 12.005 0zm5.483 18.44h-3.24l-2.31-6.46-2.31 6.46H6.41l4.89-13.65h1.42l4.76 13.65z" />
      </svg>
    );
  }

  if (lowerSource.includes("duckduckgo")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#DE5833">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 23C5.925 23 1 18.075 1 12S5.925 1 12 1s11 4.925 11 11-4.925 11-11 11zm5.5-11c0 3.038-2.462 5.5-5.5 5.5S6.5 15.038 6.5 12 8.962 6.5 12 6.5s5.5 2.462 5.5 5.5z" />
      </svg>
    );
  }

  if (lowerSource.includes("qwant")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0z"
          fill="#5476F0"
        />
        <path
          d="M8 8h8v8H8z"
          fill="white"
        />
      </svg>
    );
  }

  if (lowerSource.includes("lilo")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#65C882" />
        <path d="M8 7h8v10H8z" fill="white" />
      </svg>
    );
  }

  if (lowerSource.includes("copilot") || lowerSource.includes("bing.com/chat")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="copilot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0078D4" />
            <stop offset="100%" stopColor="#00BCF2" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#copilot-gradient)" />
        <path
          d="M12 6l3 3-3 3-3-3 3-3zm0 6l3 3-3 3-3-3 3-3z"
          fill="white"
        />
      </svg>
    );
  }

  if (lowerSource.includes("reddit")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FF4500">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    );
  }

  if (lowerSource.includes("whatsapp")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#25D366">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  }

  if (lowerSource.includes("tiktok")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
          fill="#000000"
        />
      </svg>
    );
  }

  if (lowerSource.includes("telegram") || lowerSource.includes("t.me")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0088cc">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    );
  }

  if (lowerSource.includes("brave")) {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#FB542B">
        <path d="M12 0L1.608 4.538v7.27C1.608 17.552 6.424 22.82 12 24c5.576-1.18 10.392-6.448 10.392-12.192v-7.27L12 0zm5.892 13.746l-5.892 5.892-5.892-5.892V7.854l5.892-5.892 5.892 5.892v5.892z" />
      </svg>
    );
  }

  return (
    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
      {source.charAt(0).toUpperCase()}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

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
  timeseries: Array<{ date: string; visitors: number }>;
  topPages: Array<{ page: string; visitors: number; change?: number }>;
  countries: Array<{ country: string; code: string; visitors: number; change?: number }>;
  devices: Array<{ device: string; visitors: number; percentage: number }>;
  sources: Array<{ source: string; visitors: number; change?: number }>;
  events: Array<{ event: string; count: number; change?: number }>;
  referrers: Array<{ referrer: string; visitors: number; change?: number }>;
}

interface ChangeIndicatorProps {
  value?: number;
  format?: "percentage" | "number" | "duration";
}

function ChangeIndicator({ value, format = "percentage" }: ChangeIndicatorProps) {
  if (value === undefined || value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
        <Minus className="h-3 w-3" />
        <span>No change</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const colorClass = isPositive ? "text-green-400" : "text-red-400";

  let formattedValue = "";
  if (format === "percentage") {
    formattedValue = `${Math.abs(value).toFixed(1)}%`;
  } else if (format === "duration") {
    formattedValue = formatDuration(Math.abs(value));
  } else {
    formattedValue = Math.abs(value).toLocaleString();
  }

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", colorClass)}>
      <Icon className="h-3 w-3" />
      <span>{formattedValue}</span>
    </span>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-[#9DFF20] text-black"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      )}
    >
      {children}
    </button>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-lg"></div>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
      <div className="h-48 bg-gray-100 rounded"></div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
      </div>
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
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

      <div className="mb-6 flex flex-wrap gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="mb-6">
        <ChartSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <TableSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="bg-red-500/10 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <X className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Failed to load analytics</h2>
        <p className="text-gray-400 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-[#9DFF20] text-black rounded-lg font-medium hover:bg-[#b4ff50] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

interface FullScreenModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

function FullScreenModal({
  title,
  isOpen,
  onClose,
  children,
  searchValue,
  onSearchChange,
}: FullScreenModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {onSearchChange && (
          <div className="p-4 sm:p-6 border-b border-gray-800">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9DFF20] focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [platform, setPlatform] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pages" | "countries" | "events" | "referrers">(
    "pages"
  );
  const [expandedModal, setExpandedModal] = useState<
    "pages" | "countries" | "events" | "referrers" | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/analytics?period=${dateRange}&platform=${platform}`
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
  }, [dateRange, platform]);

  const filteredPages = useMemo(() => {
    if (!data?.topPages || !searchQuery) return data?.topPages || [];
    return data.topPages.filter((page) =>
      page.page.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.topPages, searchQuery]);

  const filteredCountries = useMemo(() => {
    if (!data?.countries || !searchQuery) return data?.countries || [];
    return data.countries.filter((country) =>
      country.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.countries, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!data?.events || !searchQuery) return data?.events || [];
    return data.events.filter((event) =>
      event.event.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.events, searchQuery]);

  const filteredReferrers = useMemo(() => {
    if (!data?.referrers || !searchQuery) return data?.referrers || [];
    return data.referrers.filter((ref) =>
      ref.referrer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.referrers, searchQuery]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No data available" onRetry={fetchData} />;

  return (
    <div className="min-h-screen bg-gray-950 text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <DateFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="mb-6">
        <PlatformFilter value={platform} onChange={setPlatform} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Unique Visitors</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.summary.visitors.toLocaleString()}
              </p>
              <div className="mt-1">
                <ChangeIndicator value={data.summary.visitorsChange} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <Users className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Page Views</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.summary.pageviews.toLocaleString()}
              </p>
              <div className="mt-1">
                <ChangeIndicator value={data.summary.pageviewsChange} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <Eye className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {formatDuration(data.summary.avgDuration)}
              </p>
              <div className="mt-1">
                <ChangeIndicator
                  value={data.summary.avgDurationChange}
                  format="duration"
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <Clock className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Bounce Rate</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">
                {data.summary.bounceRate.toFixed(1)}%
              </p>
              <div className="mt-1">
                <ChangeIndicator value={data.summary.bounceRateChange} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <TrendingUp className="h-6 w-6 text-[#9DFF20]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visitors over time</h2>
        <AnalyticsChart data={data.timeseries} />
      </div>

      <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <TabButton active={activeTab === "pages"} onClick={() => setActiveTab("pages")}>
              Top Pages
            </TabButton>
            <TabButton active={activeTab === "countries"} onClick={() => setActiveTab("countries")}>
              Countries
            </TabButton>
            <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>
              Events
            </TabButton>
            <TabButton active={activeTab === "referrers"} onClick={() => setActiveTab("referrers")}>
              Referrers
            </TabButton>
          </div>
          <button
            onClick={() => setExpandedModal(activeTab)}
            className="text-sm text-[#9DFF20] hover:text-[#b4ff50] font-medium flex items-center gap-1"
          >
            View all
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {activeTab === "pages" && (
            <div className="space-y-4">
              {data.topPages.slice(0, 10).map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 truncate text-sm">{page.page}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {page.change !== undefined && (
                      <ChangeIndicator value={page.change} />
                    )}
                    <span className="text-gray-900 font-semibold">
                      {page.visitors.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "countries" && (
            <div className="space-y-4">
              {data.countries.slice(0, 10).map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{countryCodeToFlag(country.code)}</span>
                    <span className="text-gray-900 text-sm">{country.country}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {country.change !== undefined && (
                      <ChangeIndicator value={country.change} />
                    )}
                    <span className="text-gray-900 font-semibold">
                      {country.visitors.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-4">
              {data.events.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <MousePointerClick className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-900 text-sm">{event.event}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {event.change !== undefined && (
                      <ChangeIndicator value={event.change} />
                    )}
                    <span className="text-gray-900 font-semibold">
                      {event.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "referrers" && (
            <div className="space-y-4">
              {data.referrers.slice(0, 10).map((ref, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <TrafficSourceIcon source={ref.referrer} />
                    <span className="text-gray-900 truncate text-sm">{ref.referrer}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {ref.change !== undefined && (
                      <ChangeIndicator value={ref.change} />
                    )}
                    <span className="text-gray-900 font-semibold">
                      {ref.visitors.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Devices</h2>
          </div>
          <div className="p-6 space-y-4">
            {data.devices.map((device, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900 text-sm font-medium">{device.device}</span>
                  <span className="text-gray-500 text-sm">{device.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#9DFF20] h-2 rounded-full transition-all"
                    style={{ width: `${device.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Traffic Sources</h2>
          </div>
          <div className="p-6 space-y-4">
            {data.sources.slice(0, 5).map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <TrafficSourceIcon source={source.source} />
                  <span className="text-gray-900 text-sm">{source.source}</span>
                </div>
                <div className="flex items-center gap-4">
                  {source.change !== undefined && (
                    <ChangeIndicator value={source.change} />
                  )}
                  <span className="text-gray-900 font-semibold">
                    {source.visitors.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FullScreenModal
        title="All Pages"
        isOpen={expandedModal === "pages"}
        onClose={() => {
          setExpandedModal(null);
          setSearchQuery("");
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="space-y-3">
          {filteredPages.map((page, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-white truncate text-sm">{page.page}</span>
              </div>
              <div className="flex items-center gap-4">
                {page.change !== undefined && (
                  <ChangeIndicator value={page.change} />
                )}
                <span className="text-white font-semibold">
                  {page.visitors.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FullScreenModal>

      <FullScreenModal
        title="All Countries"
        isOpen={expandedModal === "countries"}
        onClose={() => {
          setExpandedModal(null);
          setSearchQuery("");
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="space-y-3">
          {filteredCountries.map((country, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{countryCodeToFlag(country.code)}</span>
                <span className="text-white text-sm">{country.country}</span>
              </div>
              <div className="flex items-center gap-4">
                {country.change !== undefined && (
                  <ChangeIndicator value={country.change} />
                )}
                <span className="text-white font-semibold">
                  {country.visitors.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FullScreenModal>

      <FullScreenModal
        title="All Events"
        isOpen={expandedModal === "events"}
        onClose={() => {
          setExpandedModal(null);
          setSearchQuery("");
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="space-y-3">
          {filteredEvents.map((event, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <MousePointerClick className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-white text-sm">{event.event}</span>
              </div>
              <div className="flex items-center gap-4">
                {event.change !== undefined && (
                  <ChangeIndicator value={event.change} />
                )}
                <span className="text-white font-semibold">
                  {event.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FullScreenModal>

      <FullScreenModal
        title="All Referrers"
        isOpen={expandedModal === "referrers"}
        onClose={() => {
          setExpandedModal(null);
          setSearchQuery("");
        }}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <div className="space-y-3">
          {filteredReferrers.map((ref, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <TrafficSourceIcon source={ref.referrer} />
                <span className="text-white truncate text-sm">{ref.referrer}</span>
              </div>
              <div className="flex items-center gap-4">
                {ref.change !== undefined && (
                  <ChangeIndicator value={ref.change} />
                )}
                <span className="text-white font-semibold">
                  {ref.visitors.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </FullScreenModal>
    </div>
  );
}

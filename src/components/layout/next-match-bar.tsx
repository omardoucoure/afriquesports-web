"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Inline SVG icons
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Mock data for the next CAN 2025 match
const MOCK_NEXT_MATCH = {
  id: "can2025-match-1",
  competition: "CAN 2025",
  stage: "groupStage", // groupStage, roundOf16, quarterFinals, semiFinals, final
  group: "A",
  homeTeam: {
    name: "Morocco",
    nameKey: "morocco",
    code: "MAR",
    flag: "https://flagcdn.com/w80/ma.png",
  },
  awayTeam: {
    name: "Mali",
    nameKey: "mali",
    code: "MLI",
    flag: "https://flagcdn.com/w80/ml.png",
  },
  date: "2025-01-14T20:00:00Z",
  venue: "Stade Mohammed V",
  city: "Casablanca",
  isLive: false,
  matchUrl: "/match-en-direct",
};

interface NextMatchBarProps {
  className?: string;
}

export function NextMatchBar({ className = "" }: NextMatchBarProps) {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(true);

  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get team name from translations or fallback
  const getTeamName = (nameKey: string, fallback: string) => {
    try {
      return t(`nextMatch.teams.${nameKey}`);
    } catch {
      return fallback;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      id="next-match-bar"
      className={`bg-gradient-to-r from-red-900 via-red-700 to-red-900 text-white shadow-lg ${className}`}
    >
      <div className="relative">
        <div className="container-main relative z-10">
          <div className="flex items-center justify-center py-2 px-3 md:px-0 gap-3">
            {/* CAN 2025 Badge */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <div className="hidden sm:flex items-center gap-2 bg-white text-red-600 px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wide">
                <span className="text-sm">⚽</span>
                <span>CAN 2025</span>
              </div>
              <span className="sm:hidden bg-white text-red-600 px-2 py-0.5 rounded-md text-xs font-extrabold">
                ⚽ CAN
              </span>
            </div>

            {/* Teams Section */}
            <div className="flex items-center gap-2 md:gap-3 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              {/* Home Team */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="relative w-6 h-5 md:w-7 md:h-6 overflow-hidden rounded border border-white/20">
                  <Image
                    src={MOCK_NEXT_MATCH.homeTeam.flag}
                    alt={MOCK_NEXT_MATCH.homeTeam.name}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
                <span className="text-xs md:text-sm font-extrabold hidden sm:inline text-white drop-shadow-lg">
                  {getTeamName(MOCK_NEXT_MATCH.homeTeam.nameKey, MOCK_NEXT_MATCH.homeTeam.name)}
                </span>
                <span className="text-xs font-extrabold sm:hidden text-white drop-shadow-lg">
                  {MOCK_NEXT_MATCH.homeTeam.code}
                </span>
              </div>

              {/* VS Badge */}
              <div className="flex-shrink-0 bg-white text-red-600 px-2 py-1 rounded-md text-xs font-extrabold">
                VS
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="relative w-6 h-5 md:w-7 md:h-6 overflow-hidden rounded border border-white/20">
                  <Image
                    src={MOCK_NEXT_MATCH.awayTeam.flag}
                    alt={MOCK_NEXT_MATCH.awayTeam.name}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                </div>
                <span className="text-xs md:text-sm font-extrabold hidden sm:inline text-white drop-shadow-lg">
                  {getTeamName(MOCK_NEXT_MATCH.awayTeam.nameKey, MOCK_NEXT_MATCH.awayTeam.name)}
                </span>
                <span className="text-xs font-extrabold sm:hidden text-white drop-shadow-lg">
                  {MOCK_NEXT_MATCH.awayTeam.code}
                </span>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden md:block w-px h-6 bg-white/30" />

            {/* Date */}
            <div className="hidden md:flex items-center gap-2 text-xs text-white font-bold">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-md">
                <CalendarIcon className="w-4 h-4 text-white" />
                <span>{formatDate(MOCK_NEXT_MATCH.date)}</span>
              </div>
            </div>

            {/* Watch Match Button */}
            <Link
              href={MOCK_NEXT_MATCH.matchUrl}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white hover:bg-white/90 text-red-600 font-bold px-3 py-1 rounded-md transition-all hover:scale-105"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="hidden sm:inline text-xs">{t("nextMatch.watchLive")}</span>
              <span className="sm:hidden text-xs">▶</span>
            </Link>

            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-md transition-all hover:scale-110"
              aria-label={t("common.close")}
            >
              <CloseIcon className="w-5 h-5 text-white/90 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

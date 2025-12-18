"use client";

import { useState, useEffect } from "react";
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
  matchUrl: "/category/can-2025",
};

interface NextMatchBarProps {
  className?: string;
}

export function NextMatchBar({ className = "" }: NextMatchBarProps) {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate countdown
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const matchDate = new Date(MOCK_NEXT_MATCH.date).getTime();
      const difference = matchDate - now;

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
    <div className={`bg-gradient-to-r from-[#022a27] via-[#04453f] to-[#022a27] text-white ${className}`}>
      {/* Moroccan pattern overlay for CAN 2025 branding */}
      <div className="relative">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/images/can2025-pattern.png)',
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center',
          }}
        />

        <div className="container-main relative z-10">
          <div className="flex items-center justify-between py-2 px-2 md:px-0">
            {/* Mobile: Simplified view */}
            <Link
              href={MOCK_NEXT_MATCH.matchUrl}
              className="flex-1 flex items-center gap-2 md:gap-4 hover:opacity-90 transition-opacity"
            >
              {/* CAN 2025 Badge */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-1 bg-[#9DFF20] text-[#022a27] px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wide">
                  <span>CAN 2025</span>
                </div>
                <span className="sm:hidden bg-[#9DFF20] text-[#022a27] px-1.5 py-0.5 rounded text-[10px] font-bold">
                  CAN
                </span>
              </div>

              {/* Next Match Label - Desktop only */}
              <div className="hidden lg:flex items-center gap-1 text-white/70 text-xs">
                <CalendarIcon className="w-3 h-3" />
                <span>{t("nextMatch.label")}</span>
              </div>

              {/* Teams Section */}
              <div className="flex items-center gap-2 md:gap-3">
                {/* Home Team */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="relative w-5 h-4 md:w-6 md:h-5 overflow-hidden rounded-sm shadow-sm">
                    <Image
                      src={MOCK_NEXT_MATCH.homeTeam.flag}
                      alt={MOCK_NEXT_MATCH.homeTeam.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="text-xs md:text-sm font-semibold hidden sm:inline">
                    {getTeamName(MOCK_NEXT_MATCH.homeTeam.nameKey, MOCK_NEXT_MATCH.homeTeam.name)}
                  </span>
                  <span className="text-xs font-semibold sm:hidden">
                    {MOCK_NEXT_MATCH.homeTeam.code}
                  </span>
                </div>

                {/* VS Badge */}
                <div className="flex-shrink-0 bg-white/10 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] md:text-xs font-bold text-[#9DFF20]">
                  VS
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="relative w-5 h-4 md:w-6 md:h-5 overflow-hidden rounded-sm shadow-sm">
                    <Image
                      src={MOCK_NEXT_MATCH.awayTeam.flag}
                      alt={MOCK_NEXT_MATCH.awayTeam.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                  <span className="text-xs md:text-sm font-semibold hidden sm:inline">
                    {getTeamName(MOCK_NEXT_MATCH.awayTeam.nameKey, MOCK_NEXT_MATCH.awayTeam.name)}
                  </span>
                  <span className="text-xs font-semibold sm:hidden">
                    {MOCK_NEXT_MATCH.awayTeam.code}
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden md:block w-px h-4 bg-white/20" />

              {/* Date & Time */}
              <div className="hidden md:flex items-center gap-3 text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{formatDate(MOCK_NEXT_MATCH.date)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{formatTime(MOCK_NEXT_MATCH.date)}</span>
                </div>
              </div>

              {/* Countdown - Desktop */}
              <div className="hidden lg:flex items-center gap-1 ml-auto mr-4">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-[10px]">
                  <span className="font-mono font-bold text-[#9DFF20]">{countdown.days}</span>
                  <span className="text-white/60">{t("nextMatch.countdown.days")}</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-[10px]">
                  <span className="font-mono font-bold text-[#9DFF20]">{countdown.hours}</span>
                  <span className="text-white/60">{t("nextMatch.countdown.hours")}</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-[10px]">
                  <span className="font-mono font-bold text-[#9DFF20]">{countdown.minutes}</span>
                  <span className="text-white/60">{t("nextMatch.countdown.min")}</span>
                </div>
              </div>
            </Link>

            {/* Mobile: Time only */}
            <div className="flex md:hidden items-center gap-2 text-[10px] text-white/80 mr-2">
              <span>{formatTime(MOCK_NEXT_MATCH.date)}</span>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              aria-label={t("common.close")}
            >
              <CloseIcon className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

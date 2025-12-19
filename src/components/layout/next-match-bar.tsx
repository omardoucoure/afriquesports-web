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

interface NextMatch {
  hasMatch: boolean;
  id?: string;
  competition?: string;
  homeTeam?: {
    name: string;
    code: string;
    flag: string;
  };
  awayTeam?: {
    name: string;
    code: string;
    flag: string;
  };
  date?: string;
  venue?: string;
  city?: string;
  isLive?: boolean;
  message?: string;
}

interface NextMatchBarProps {
  className?: string;
}

// Map ESPN team names to translation keys
const getTeamTranslationKey = (teamName: string): string => {
  const mapping: Record<string, string> = {
    'Morocco': 'morocco',
    'Mali': 'mali',
    'Zambia': 'zambia',
    'Comoros': 'comoros',
    'Egypt': 'egypt',
    'South Africa': 'southAfrica',
    'Angola': 'angola',
    'Zimbabwe': 'zimbabwe',
    'Senegal': 'senegal',
    'Cameroon': 'cameroon',
    'DR Congo': 'drCongo',
    'Guinea': 'guinea',
    'Tunisia': 'tunisia',
    'Tanzania': 'tanzania',
    'Mauritania': 'mauritania',
    'Gambia': 'gambia',
    'Ivory Coast': 'ivoryCoast',
    'Gabon': 'gabon',
    'Equatorial Guinea': 'equatorialGuinea',
    'Mozambique': 'mozambique',
    'Nigeria': 'nigeria',
    'Ghana': 'ghana',
    'Benin': 'benin',
    'Botswana': 'botswana',
    'Algeria': 'algeria',
    'Burkina Faso': 'burkinaFaso',
    'Cape Verde': 'capeVerde',
    'Sudan': 'sudan',
    'Uganda': 'uganda',
  };
  return mapping[teamName] || teamName.toLowerCase();
};

export function NextMatchBar({ className = "" }: NextMatchBarProps) {
  const t = useTranslations();
  const [isVisible, setIsVisible] = useState(true);
  const [matchData, setMatchData] = useState<NextMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNextMatch() {
      try {
        const response = await fetch('/api/can2025/next-match');
        const data = await response.json();
        setMatchData(data);
      } catch (error) {
        console.error('Error fetching next match:', error);
        setMatchData({ hasMatch: false });
      } finally {
        setIsLoading(false);
      }
    }

    fetchNextMatch();
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

  // Don't show if not visible, loading, or no match data
  if (!isVisible || isLoading || !matchData?.hasMatch) return null;

  return (
    <div
      id="next-match-bar"
      className={`bg-gradient-to-r from-red-900 via-red-700 to-red-900 text-white shadow-lg ${className}`}
    >
      <div className="relative">
        <div className="container-main relative z-10">
          <div className="flex items-center justify-between py-3 px-3 md:px-0 gap-4">
            {/* CAN 2025 Badge - Left */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <span className="hidden sm:inline text-sm md:text-base font-extrabold text-white uppercase tracking-wide drop-shadow-lg">
                ⚽ CAN 2025
              </span>
              <span className="sm:hidden text-sm font-extrabold text-white drop-shadow-lg">
                ⚽ CAN
              </span>
            </div>

            {/* Match Info Section - Center */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
              {/* Teams Section */}
              <div className="flex items-center gap-3 md:gap-4">
                {/* Home Team */}
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative w-8 h-6 md:w-10 md:h-8 overflow-hidden rounded-md border-2 border-white/30 shadow-lg">
                    <Image
                      src={matchData.homeTeam?.flag || ''}
                      alt={matchData.homeTeam?.name || ''}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="text-sm md:text-base font-extrabold text-white drop-shadow-lg uppercase">
                    {t(`nextMatch.teams.${getTeamTranslationKey(matchData.homeTeam?.name || '')}`)}
                  </span>
                </div>

                {/* VS Badge */}
                <div className="flex-shrink-0 bg-white text-red-600 px-3 py-1.5 rounded-lg text-sm font-extrabold shadow-md">
                  VS
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-2 md:gap-3">
                  <span className="text-sm md:text-base font-extrabold text-white drop-shadow-lg uppercase">
                    {t(`nextMatch.teams.${getTeamTranslationKey(matchData.awayTeam?.name || '')}`)}
                  </span>
                  <div className="relative w-8 h-6 md:w-10 md:h-8 overflow-hidden rounded-md border-2 border-white/30 shadow-lg">
                    <Image
                      src={matchData.awayTeam?.flag || ''}
                      alt={matchData.awayTeam?.name || ''}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                </div>
              </div>

              {/* Match Details - Date & Time */}
              {matchData.date && (
                <div className="hidden md:flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-white/90" />
                    <span className="text-xs font-bold text-white/90">
                      {formatDate(matchData.date)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-white/30" />
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-white/90" />
                    <span className="text-xs font-bold text-white/90">
                      {formatTime(matchData.date)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Watch Button & Close */}
            <div className="flex items-center gap-2">
              {/* Watch Match Button */}
              <Link
                href="/can-2025"
                className="flex-shrink-0 flex items-center gap-2 bg-white hover:bg-white/95 text-red-600 font-extrabold px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="hidden sm:inline text-xs uppercase tracking-wide">{t("nextMatch.watchLive")}</span>
              </Link>

              {/* Close Button */}
              <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
                aria-label={t("common.close")}
              >
                <CloseIcon className="w-5 h-5 text-white/90 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

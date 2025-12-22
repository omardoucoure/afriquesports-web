"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

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
  isFinished?: boolean;
  homeScore?: number;
  awayScore?: number;
  statusDetail?: string;
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
  const locale = useLocale();
  const [isVisible, setIsVisible] = useState(true);
  const [matchData, setMatchData] = useState<NextMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Get localized commentary page URL
  const getCommentaryUrl = () => {
    const urls: Record<string, string> = {
      'fr': '/match-en-direct',
      'en': '/live-match',
      'es': '/partido-en-vivo',
    };
    return urls[locale] || '/match-en-direct';
  };

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (!isMounted) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR', {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    if (!isMounted) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'fr-FR', {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate time until match starts
  const getTimeUntilMatch = (dateString: string) => {
    if (!isMounted) return '';
    const now = new Date();
    const matchDate = new Date(dateString);
    const diff = matchDate.getTime() - now.getTime();

    if (diff < 0) return '';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 24) {
      if (hours === 0) {
        return t('nextMatch.startsInMinutes', { minutes });
      }
      return t('nextMatch.startsIn', { hours, minutes });
    }

    const days = Math.floor(hours / 24);
    return t('nextMatch.startsInDays', { days });
  };

  // Don't show if not visible, loading, or no match data
  if (!isVisible || isLoading || !matchData?.hasMatch) return null;

  // Determine background color based on match state (solid colors with subtle gradient)
  const getBackgroundClass = () => {
    if (matchData.isLive) {
      return 'bg-gradient-to-r from-green-700 to-green-600'; // Green for live
    }
    if (matchData.isFinished) {
      return 'bg-gradient-to-r from-gray-800 to-gray-700'; // Gray for finished
    }
    return 'bg-gradient-to-r from-red-700 to-red-600'; // Red for upcoming
  };

  return (
    <div
      id="next-match-bar"
      className={`${getBackgroundClass()} text-white shadow-lg ${className}`}
    >
      <div className="relative">
        <div className="container-main relative z-10">
          {/* Mobile Layout - Two rows */}
          <div className="lg:hidden py-3 px-3">
            {/* Row 1: Teams and Scores */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
                {/* Home Team */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative w-10 h-8 overflow-hidden rounded border-2 border-white/40 shadow-lg flex-shrink-0">
                    <Image
                      src={matchData.homeTeam?.flag || ''}
                      alt={matchData.homeTeam?.name || ''}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <span className="text-sm font-bold text-white drop-shadow-lg truncate">
                    {t(`nextMatch.teams.${getTeamTranslationKey(matchData.homeTeam?.name || '')}`)}
                  </span>
                </div>

                {/* Score Display */}
                {(matchData.isLive || matchData.isFinished) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <span className="text-2xl font-black text-white">{matchData.homeScore}</span>
                    <span className="text-white/60 font-bold">-</span>
                    <span className="text-2xl font-black text-white">{matchData.awayScore}</span>
                  </div>
                )}

                {/* VS Badge for upcoming */}
                {!matchData.isLive && !matchData.isFinished && (
                  <div className="px-3 py-1 bg-white/20 rounded-lg backdrop-blur-sm">
                    <span className="text-xs font-bold text-white">VS</span>
                  </div>
                )}

                {/* Away Team */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-white drop-shadow-lg truncate">
                    {t(`nextMatch.teams.${getTeamTranslationKey(matchData.awayTeam?.name || '')}`)}
                  </span>
                  <div className="relative w-10 h-8 overflow-hidden rounded border-2 border-white/40 shadow-lg flex-shrink-0">
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
            </div>

            {/* Row 2: Match Info and CTA */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-white/90 flex-1 min-w-0">
                {/* Live Status or Date/Time */}
                {matchData.isLive && matchData.statusDetail && (
                  <div className="flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="font-bold text-white">{matchData.statusDetail}</span>
                  </div>
                )}
                {matchData.isFinished && (
                  <div className="bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
                    <span className="font-bold text-white">{t('nextMatch.finished')}</span>
                  </div>
                )}
                {!matchData.isLive && !matchData.isFinished && matchData.date && (
                  <>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatDate(matchData.date)}</span>
                    </div>
                    <span className="text-white/50">•</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatTime(matchData.date)}</span>
                    </div>
                  </>
                )}
                {/* Venue */}
                {matchData.city && (
                  <>
                    <span className="text-white/50">•</span>
                    <span className="truncate">📍 {matchData.city}</span>
                  </>
                )}
              </div>

              {/* Watch Button */}
              <Link
                href={getCommentaryUrl()}
                className="flex items-center gap-1.5 bg-white hover:bg-white/95 text-red-600 font-bold px-3 py-1.5 rounded-lg transition-all shadow-md flex-shrink-0"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-xs uppercase tracking-tight whitespace-nowrap">
                  {matchData.isLive ? t("nextMatch.watchNow") : t("nextMatch.followMatch")}
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden lg:flex items-center justify-between py-4 px-0 gap-6">
            {/* Left: Competition + Match Info */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white/80 uppercase tracking-wide">
                  ⚽ CAN 2025
                </span>
                {/* Date/Time or Live Status */}
                {matchData.isLive && matchData.statusDetail && (
                  <div className="flex items-center gap-2 bg-white/20 px-2 py-1 rounded backdrop-blur-sm w-fit">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-white font-bold">{matchData.statusDetail}</span>
                  </div>
                )}
                {matchData.isFinished && (
                  <span className="text-xs text-white/80 font-medium bg-white/20 px-2 py-1 rounded backdrop-blur-sm w-fit">
                    {t('nextMatch.finished')}
                  </span>
                )}
                {!matchData.isLive && !matchData.isFinished && matchData.date && (
                  <div className="flex items-center gap-2 text-xs text-white/90">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatDate(matchData.date)}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatTime(matchData.date)}</span>
                    </div>
                    {/* Countdown */}
                    {getTimeUntilMatch(matchData.date) && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-yellow-300">{getTimeUntilMatch(matchData.date)}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Teams and Score */}
            <div className="flex items-center gap-6">
              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-10 overflow-hidden rounded-md border-2 border-white/40 shadow-lg">
                  <Image
                    src={matchData.homeTeam?.flag || ''}
                    alt={matchData.homeTeam?.name || ''}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <span className="text-lg font-bold text-white drop-shadow-lg min-w-[120px]">
                  {t(`nextMatch.teams.${getTeamTranslationKey(matchData.homeTeam?.name || '')}`)}
                </span>
              </div>

              {/* Score Display */}
              {(matchData.isLive || matchData.isFinished) && (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <span className="text-3xl font-black text-white">{matchData.homeScore}</span>
                  <span className="text-xl text-white/60 font-bold">-</span>
                  <span className="text-3xl font-black text-white">{matchData.awayScore}</span>
                </div>
              )}

              {/* VS Badge for upcoming */}
              {!matchData.isLive && !matchData.isFinished && (
                <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <span className="text-sm font-bold text-white">VS</span>
                </div>
              )}

              {/* Away Team */}
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-white drop-shadow-lg min-w-[120px] text-right">
                  {t(`nextMatch.teams.${getTeamTranslationKey(matchData.awayTeam?.name || '')}`)}
                </span>
                <div className="relative w-12 h-10 overflow-hidden rounded-md border-2 border-white/40 shadow-lg">
                  <Image
                    src={matchData.awayTeam?.flag || ''}
                    alt={matchData.awayTeam?.name || ''}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              </div>
            </div>

            {/* Right: Venue + CTA */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Venue */}
              {(matchData.venue || matchData.city) && (
                <div className="flex flex-col gap-0.5 text-right">
                  {matchData.venue && (
                    <span className="text-xs text-white/90 font-medium">
                      📍 {matchData.venue}
                    </span>
                  )}
                  {matchData.city && (
                    <span className="text-xs text-white/70">
                      {matchData.city}
                    </span>
                  )}
                </div>
              )}

              {/* Watch Button */}
              <Link
                href={getCommentaryUrl()}
                className="flex items-center gap-2 bg-white hover:bg-white/95 text-red-600 font-bold px-5 py-2.5 rounded-lg transition-all hover:scale-105 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-sm uppercase tracking-wide whitespace-nowrap">
                  {matchData.isLive ? t("nextMatch.watchNow") : t("nextMatch.followMatch")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

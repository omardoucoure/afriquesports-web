'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';
import useSWR from 'swr';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MatchData } from '@/lib/match-schema';
import { useTranslations } from 'next-intl';
import { CompositionTab } from './tabs/CompositionTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { VideoTab } from './tabs/VideoTab';

interface MatchPageClientProps {
  initialMatchData: MatchData;
  matchDataRaw: any;
  commentary: any[];
  preMatchAnalysis: any;
  locale: string;
  matchId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MatchPageClient({
  initialMatchData,
  matchDataRaw,
  commentary: initialCommentary,
  preMatchAnalysis,
  locale,
  matchId
}: MatchPageClientProps) {
  const t = useTranslations('can2025.match');
  const tEvents = useTranslations('can2025.match.eventTypes');
  const [viewers, setViewers] = useState(0); // Initialize with 0 to prevent hydration error
  const [activeTab, setActiveTab] = useState<'stats' | 'lineup' | 'video'>('video'); // Default to video tab
  const [homeLogoError, setHomeLogoError] = useState(false);
  const [awayLogoError, setAwayLogoError] = useState(false);

  const competition = matchDataRaw.header.competitions[0];
  const homeTeam = competition.competitors[0];
  const awayTeam = competition.competitors[1];
  const status = matchDataRaw.header.status;
  const venue = competition.venue;

  const isLive = status?.type?.state === 'in';
  const isCompleted = status?.type?.completed || false;

  // Initialize viewer count on client side only (prevents hydration error)
  useEffect(() => {
    setViewers(Math.floor(Math.random() * 5000) + 1000);
  }, []);

  // Poll for updates every 15 seconds for all matches
  const { data: liveData } = useSWR(
    `/api/match-live-update?id=${matchId}&locale=${locale}`,
    fetcher,
    {
      refreshInterval: 15000,
      fallbackData: { match: initialMatchData, commentary: initialCommentary },
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      revalidateOnMount: true, // Always fetch fresh data on mount
      revalidateIfStale: true,
      dedupingInterval: 5000 // Prevent duplicate requests within 5 seconds
    }
  );

  // Use only real commentary data from API or database
  const currentCommentary = (liveData?.commentary && liveData.commentary.length > 0)
    ? liveData.commentary
    : (initialCommentary && initialCommentary.length > 0)
    ? initialCommentary
    : [];

  // Extract goal scorers from commentary with time
  const homeTeamName = homeTeam.team.displayName;
  const awayTeamName = awayTeam.team.displayName;

  const goalScorers = {
    home: currentCommentary
      .filter((event: any) => event.is_scoring && (
        event.team === homeTeamName ||
        event.team === 'home' ||
        event.team?.toLowerCase() === homeTeamName.toLowerCase()
      ))
      .map((event: any) => ({
        name: event.player_name,
        time: event.time?.replace("'", '') || ''
      }))
      .filter((g: any) => g.name),
    away: currentCommentary
      .filter((event: any) => event.is_scoring && (
        event.team === awayTeamName ||
        event.team === 'away' ||
        event.team?.toLowerCase() === awayTeamName.toLowerCase()
      ))
      .map((event: any) => ({
        name: event.player_name,
        time: event.time?.replace("'", '') || ''
      }))
      .filter((g: any) => g.name)
  };

  // Get match stage/round from competition
  const matchStage = competition.type?.abbreviation ||
                     competition.note ||
                     (matchId === '732177' ? 'QUART DE FINALE' : '');

  // Simulate viewer count changes for live matches
  useEffect(() => {
    if (!isLive || viewers === 0) return; // Wait until viewers is initialized

    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 200) - 100;
        return Math.max(100, prev + change);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [isLive, viewers]);

  const tabs = [
    { id: 'stats' as const, labelKey: 'statistics', icon: '📊' },
    { id: 'lineup' as const, labelKey: 'lineups', icon: '👥' },
    { id: 'video' as const, labelKey: 'videos', icon: '🎥' },
  ];

  return (
    <>
      {/* Google AdSense */}
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4765538302983367"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 pb-8">
        {/* Main Content Area: Commentary + Sidebar */}
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content: Hero + Live Commentary (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Match Banner */}
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            {/* Premium gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a3d1a] via-[#2d5a2d] to-[#1a4d2e]"></div>

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>

            <div className="relative p-5 sm:p-6 md:p-8">
              {/* Top Bar: Stage + Live Status */}
              <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
                {matchStage && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20">
                    <span className="text-sm sm:text-base">🏆</span>
                    <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                      {matchStage}
                    </span>
                  </div>
                )}
                {isLive && (
                  <div className="flex items-center gap-2 bg-red-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg shadow-red-600/40">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold uppercase text-white tracking-wider">
                      {status?.displayClock || 'EN DIRECT'}
                    </span>
                  </div>
                )}
                {isCompleted && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <span className="text-xs sm:text-sm font-bold text-white uppercase">
                      {t('finished')}
                    </span>
                  </div>
                )}
              </div>

              {/* Main Score Area */}
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Home Team */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="relative mb-2 sm:mb-3">
                    {homeTeam.team.logos?.[0]?.href && !homeLogoError ? (
                      <img
                        src={homeTeam.team.logos[0].href}
                        alt={homeTeam.team.displayName}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
                        onError={() => setHomeLogoError(true)}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                        {(homeTeam.team.abbreviation || homeTeam.team.displayName.slice(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 drop-shadow-md">
                    {homeTeam.team.displayName}
                  </h2>
                  {goalScorers.home.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {goalScorers.home.map((g: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white/95 text-gray-800 text-xs sm:text-sm px-2 py-0.5 rounded-full font-medium shadow-sm">
                          ⚽ {g.name} <span className="text-gray-500">{g.time}'</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-6">
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl tabular-nums">
                    {homeTeam.score || '0'}
                  </span>
                  <span className="text-3xl sm:text-4xl font-light text-white/40">-</span>
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white drop-shadow-2xl tabular-nums">
                    {awayTeam.score || '0'}
                  </span>
                </div>

                {/* Away Team */}
                <div className="flex-1 flex flex-col items-center text-center">
                  <div className="relative mb-2 sm:mb-3">
                    {awayTeam.team.logos?.[0]?.href && !awayLogoError ? (
                      <img
                        src={awayTeam.team.logos[0].href}
                        alt={awayTeam.team.displayName}
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
                        onError={() => setAwayLogoError(true)}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                        {(awayTeam.team.abbreviation || awayTeam.team.displayName.slice(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1 drop-shadow-md">
                    {awayTeam.team.displayName}
                  </h2>
                  {goalScorers.away.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {goalScorers.away.map((g: any, i: number) => (
                        <span key={i} className="inline-flex items-center gap-1 bg-white/95 text-gray-800 text-xs sm:text-sm px-2 py-0.5 rounded-full font-medium shadow-sm">
                          ⚽ {g.name} <span className="text-gray-500">{g.time}'</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Info Bar */}
              <div className="mt-5 sm:mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {/* Venue */}
                {venue && (
                  <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">{venue.fullName}</span>
                    {venue.address?.city && (
                      <span className="text-white/50">• {venue.address.city}</span>
                    )}
                  </div>
                )}

                {/* Date (for non-live) */}
                {!isLive && !isCompleted && matchDataRaw.header.date && !isNaN(new Date(matchDataRaw.header.date).getTime()) && (
                  <div className="flex items-center gap-2 text-white/80 text-xs sm:text-sm">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                    <time className="font-medium">
                      {new Date(matchDataRaw.header.date).toLocaleDateString(locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                )}

                {/* Viewers (for live) */}
              {isLive ? (
                <div className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/80" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-semibold">{viewers.toLocaleString()}</span>
                  <span className="text-white/60">spectateurs</span>
                </div>
              ) : (
                matchDataRaw.header.date && !isNaN(new Date(matchDataRaw.header.date).getTime()) && (
                  <time className="text-white/80 text-xs sm:text-sm font-medium">
                    {new Date(matchDataRaw.header.date).toLocaleDateString(locale, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                )
              )}
            </div>
          </div>
          </div>

          {/* Live Commentary Section */}
          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 flex flex-wrap items-center gap-2">
              <span>⚽ {t('liveCommentary')}</span>
              {currentCommentary && currentCommentary.length > 0 && (
                <span className="text-xs sm:text-sm font-normal text-gray-500">
                  ({currentCommentary.length} {t('events')})
                </span>
              )}
            </h2>

            {/* Commentary Feed - Mobile Optimized */}
            {currentCommentary && currentCommentary.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {currentCommentary.map((event: any) => (
                  <div
                    key={event.id}
                    className={`flex gap-2.5 sm:gap-3 md:gap-4 p-3 sm:p-4 rounded-xl transition-all active:scale-[0.98] lg:hover:shadow-lg ${
                      event.is_scoring
                        ? 'bg-gradient-to-br from-green-100 via-emerald-50 to-green-100 border-2 border-green-400 shadow-lg shadow-green-200/50'
                        : event.type === 'redCard'
                        ? 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500'
                        : event.type === 'yellowCard'
                        ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-l-4 border-yellow-500'
                        : event.type === 'varCheck'
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500'
                        : event.type === 'substitution'
                        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-l-4 border-indigo-500'
                        : event.type === 'penaltyAwarded' || event.type === 'penaltyMissed'
                        ? 'bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-500'
                        : 'bg-gray-50 border-l-4 border-gray-300'
                    } touch-manipulation`}
                  >
                    <span className={`flex-shrink-0 leading-none ${event.is_scoring ? 'text-3xl sm:text-4xl animate-pulse' : 'text-xl sm:text-2xl'}`}>
                      {event.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2">
                        <span className={`font-bold text-base sm:text-lg whitespace-nowrap ${event.is_scoring ? 'text-green-700' : 'text-primary-dark'}`}>
                          {event.time}
                        </span>
                        <span className={`text-[10px] sm:text-xs uppercase font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                          event.is_scoring
                            ? 'bg-green-600 text-white'
                            : 'text-gray-500 bg-white'
                        }`}>
                          {tEvents(event.type)}
                        </span>
                        {event.is_scoring && (
                          <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-green-600 to-emerald-600 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full whitespace-nowrap shadow-md">
                            ⚽ {tEvents('goalBadge')}
                          </span>
                        )}
                      </div>
                      <div className={`text-sm sm:text-base leading-relaxed prose prose-sm max-w-none ${event.is_scoring ? 'text-gray-900 font-semibold' : 'text-gray-900'}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {event.text}
                        </ReactMarkdown>
                      </div>
                      {event.tweet && (
                        <div className="mt-2 p-2 sm:p-3 bg-white/80 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-2">
                            <span className="text-sm flex-shrink-0">🐦</span>
                            <p className="text-xs sm:text-sm text-gray-600 italic">{event.tweet}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">⚽</div>
                <p className="text-gray-500 text-base sm:text-lg px-4">
                  {isLive ? t('waitingForCommentary') : t('noDataYet')}
                </p>
              </div>
            )}
          </div>

          {/* Pre-match Analysis / Post-match Report (below commentary on mobile) */}
          {!isLive && !isCompleted && preMatchAnalysis && (
            <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 shadow-sm border border-gray-100 mt-4 sm:mt-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                📊 {t('preMatchAnalysis')}
                <span className="text-xs font-normal text-white bg-primary px-2 py-0.5 rounded-full">AI</span>
              </h3>
              <div className="space-y-4 text-sm sm:text-base">
                {preMatchAnalysis.head_to_head && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      🔄 Face-à-face
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{preMatchAnalysis.head_to_head}</p>
                  </div>
                )}
                {preMatchAnalysis.recent_form && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      📈 Forme récente
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{preMatchAnalysis.recent_form}</p>
                  </div>
                )}
                {preMatchAnalysis.key_players && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      ⭐ Joueurs clés
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{preMatchAnalysis.key_players}</p>
                  </div>
                )}
                {preMatchAnalysis.tactical_preview && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      🎯 Aperçu tactique
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{preMatchAnalysis.tactical_preview}</p>
                  </div>
                )}
                {preMatchAnalysis.prediction && (
                  <div className="bg-gradient-to-r from-primary/5 to-primary-dark/5 p-3 sm:p-4 rounded-lg border-l-4 border-primary">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                      🔮 Prédiction
                    </h4>
                    <p className="text-gray-900 font-medium leading-relaxed">{preMatchAnalysis.prediction}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isCompleted && matchDataRaw.recap && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                📝 {t('matchReport')}
              </h3>
              <div className="prose max-w-none text-gray-700">
                <p>{matchDataRaw.recap.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Tabs for Stats, Lineup, Videos (1/3 width on desktop) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:sticky lg:top-20">
            {/* Tab Navigation - Mobile Optimized */}
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 sm:py-3 text-xs font-medium transition-all touch-manipulation active:scale-95 ${
                    activeTab === tab.id
                      ? 'text-primary-dark bg-primary/5 border-b-2 border-primary-dark'
                      : 'text-gray-600 active:bg-gray-100 lg:hover:text-gray-900 lg:hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{tab.icon}</span>
                  <span className="text-[10px] sm:text-xs">{t(tab.labelKey)}</span>
                </button>
              ))}
            </div>

            {/* Tab Content - Mobile Optimized */}
            <div className="p-3 sm:p-4 max-h-[600px] sm:max-h-[800px] overflow-y-auto overscroll-contain">
              {activeTab === 'stats' && <StatisticsTab matchData={matchDataRaw} />}
              {activeTab === 'lineup' && <CompositionTab matchData={matchDataRaw} />}
              {activeTab === 'video' && <VideoTab matchData={matchDataRaw} />}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

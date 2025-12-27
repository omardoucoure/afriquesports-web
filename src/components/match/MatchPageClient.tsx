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
      revalidateOnReconnect: true
    }
  );

  // Use only real commentary data from API or database
  const currentCommentary = (liveData?.commentary && liveData.commentary.length > 0)
    ? liveData.commentary
    : (initialCommentary && initialCommentary.length > 0)
    ? initialCommentary
    : [];

  // Extract goal scorers from commentary
  const goalScorers = {
    home: currentCommentary
      .filter((event: any) => event.is_scoring && event.team === 'home')
      .map((event: any) => event.player_name)
      .filter(Boolean),
    away: currentCommentary
      .filter((event: any) => event.is_scoring && event.team === 'away')
      .map((event: any) => event.player_name)
      .filter(Boolean)
  };

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
          <div className="relative overflow-hidden rounded-xl shadow-lg">
            {/* Premium gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-dark via-[#2d5a00] to-primary-dark"></div>

            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>

            <div className="relative p-4 sm:p-5 md:p-6">
              {/* Main Content Row */}
              <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-8">
                {/* Home Team */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>
                    {homeTeam.team.logos?.[0]?.href && !homeLogoError ? (
                      <img
                        src={homeTeam.team.logos[0].href}
                        alt={homeTeam.team.displayName}
                        className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                        onError={() => setHomeLogoError(true)}
                      />
                    ) : (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl">
                        {(homeTeam.team.abbreviation || homeTeam.team.displayName.slice(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-white truncate drop-shadow-md">
                      {homeTeam.team.displayName}
                    </h1>
                    {goalScorers.home.length > 0 && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs sm:text-sm text-primary/90">⚽</span>
                        <span className="text-[10px] sm:text-xs text-white/90 truncate font-medium">
                          {goalScorers.home.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Score Section */}
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 px-3 sm:px-6">
                  {/* Status Row */}
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <>
                        <div className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-red-600 rounded-full shadow-lg">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold uppercase text-white tracking-wider">EN DIRECT</span>
                        </div>
                        {status?.displayClock && (
                          <span className="text-xs sm:text-sm font-bold text-white bg-white/10 px-2 py-1 rounded-md">
                            {status.displayClock}
                          </span>
                        )}
                      </>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm text-[10px] sm:text-xs font-semibold rounded-full text-white border border-white/20">
                        {t('finished')}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                        <span className="text-xs sm:text-sm">🏆</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-white">
                          {competition.name || 'CAN 2025'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Score Display */}
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-2xl tabular-nums">
                      {homeTeam.score || '0'}
                    </span>
                    <div className="flex flex-col items-center">
                      <span className="text-xl sm:text-2xl font-light text-white/70">—</span>
                    </div>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-2xl tabular-nums">
                      {awayTeam.score || '0'}
                    </span>
                  </div>

                  {/* Competition Badge (when not live) */}
                  {!isLive && (
                    <div className="flex items-center gap-1 text-white/80">
                      <span className="text-[10px] sm:text-xs font-medium">
                        {competition.name || 'CAN 2025'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0 justify-end">
                  <div className="flex-1 min-w-0 text-right">
                    <h1 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-white truncate drop-shadow-md">
                      {awayTeam.team.displayName}
                    </h1>
                    {goalScorers.away.length > 0 && (
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <span className="text-[10px] sm:text-xs text-white/90 truncate font-medium">
                          {goalScorers.away.join(', ')}
                        </span>
                        <span className="text-xs sm:text-sm text-primary/90">⚽</span>
                      </div>
                    )}
                  </div>
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-md"></div>
                    {awayTeam.team.logos?.[0]?.href && !awayLogoError ? (
                      <img
                        src={awayTeam.team.logos[0].href}
                        alt={awayTeam.team.displayName}
                        className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                        onError={() => setAwayLogoError(true)}
                      />
                    ) : (
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl md:text-2xl">
                        {(awayTeam.team.abbreviation || awayTeam.team.displayName.slice(0, 3)).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Bottom Info Bar */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20 flex flex-wrap items-center justify-center sm:justify-between gap-3 sm:gap-4">
              {/* Venue */}
              {venue && (
                <div className="flex items-center gap-1.5 text-white/80 text-xs sm:text-sm">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-primary/80" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                  </svg>
                  <span className="font-medium">{venue.fullName}</span>
                  {venue.address?.city && (
                    <span className="text-white/60">• {venue.address.city}</span>
                  )}
                </div>
              )}

              {/* Viewers or Date */}
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

'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { MatchData } from '@/lib/match-schema';
import { useTranslations } from 'next-intl';

interface MatchPageClientProps {
  initialMatchData: MatchData;
  matchDataRaw: any;
  commentary: any[];
  locale: string;
  matchId: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function MatchPageClient({
  initialMatchData,
  matchDataRaw,
  commentary: initialCommentary,
  locale,
  matchId
}: MatchPageClientProps) {
  const t = useTranslations();
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 5000) + 1000);

  const competition = matchDataRaw.header.competitions[0];
  const homeTeam = competition.competitors[0];
  const awayTeam = competition.competitors[1];
  const status = matchDataRaw.header.status;
  const venue = competition.venue;

  const isLive = status?.type?.state === 'in';
  const isCompleted = status?.type?.completed || false;

  // Poll for updates every 15 seconds during live matches
  const { data: liveData } = useSWR(
    isLive ? `/api/match-live-update?id=${matchId}&locale=${locale}` : null,
    fetcher,
    {
      refreshInterval: 15000, // 15 seconds
      fallbackData: { match: initialMatchData, commentary: initialCommentary }
    }
  );

  const currentCommentary = liveData?.commentary || initialCommentary;

  // Simulate viewer count changes for live matches
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.floor(Math.random() * 200) - 100;
        return Math.max(100, prev + change);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Match Header with Score */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <time className="text-sm text-gray-500">
              {new Date(matchDataRaw.header.date).toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </time>

            {isLive && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  <span className="text-xs font-bold uppercase">{t('match.live')}</span>
                </div>
                <span className="text-xs text-gray-500">
                  👁️ {viewers.toLocaleString()} {t('match.viewers')}
                </span>
              </div>
            )}

            {isCompleted && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {t('can2025.results.finished')}
              </span>
            )}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-between gap-8">
            {/* Home Team */}
            <div className="flex flex-col items-center flex-1">
              <img
                src={homeTeam.team.logo}
                alt={homeTeam.team.displayName}
                className="w-20 h-20 mb-3"
              />
              <h1 className="text-xl font-bold text-gray-900 text-center">
                {homeTeam.team.displayName}
              </h1>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-gray-900">
                  {homeTeam.score || '0'}
                </span>
                <span className="text-3xl font-medium text-gray-400">-</span>
                <span className="text-5xl font-bold text-gray-900">
                  {awayTeam.score || '0'}
                </span>
              </div>
              {isLive && status?.displayClock && (
                <span className="mt-2 text-sm font-medium text-primary-dark">
                  {status.displayClock}
                </span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              <img
                src={awayTeam.team.logo}
                alt={awayTeam.team.displayName}
                className="w-20 h-20 mb-3"
              />
              <h1 className="text-xl font-bold text-gray-900 text-center">
                {awayTeam.team.displayName}
              </h1>
            </div>
          </div>

          {/* Match Info */}
          {venue && (
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-600">
                🏟️ {venue.fullName} - {venue.address?.city || 'Morocco'}
              </p>
            </div>
          )}
        </div>

        {/* Live Commentary */}
        {currentCommentary && currentCommentary.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⚽ {t('can2025.match.liveCommentary')}
              <span className="text-sm font-normal text-gray-500">
                ({currentCommentary.length} {t('can2025.match.events')})
              </span>
            </h3>

            <div className="space-y-3">
              {currentCommentary.map((event: any) => (
                <div
                  key={event.id}
                  className={`flex gap-3 p-3 rounded-lg ${
                    event.is_scoring
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{event.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-primary-dark">
                        {event.time}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">
                        {event.type}
                      </span>
                    </div>
                    <p className="text-gray-900">{event.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pre-match Analysis (if available and upcoming) */}
        {!isLive && !isCompleted && matchDataRaw.analysis && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 {t('can2025.match.preMatchAnalysis')}
            </h3>
            <div className="prose max-w-none">
              <p className="text-gray-700">{matchDataRaw.analysis.preview}</p>
            </div>
          </section>
        )}

        {/* Post-match Report (if available and completed) */}
        {isCompleted && matchDataRaw.recap && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 {t('can2025.match.matchReport')}
            </h3>
            <div className="prose max-w-none">
              <p className="text-gray-700">{matchDataRaw.recap.description}</p>
            </div>
          </section>
        )}

        {/* No Commentary Available */}
        {!currentCommentary || currentCommentary.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">
              {isLive
                ? t('can2025.match.waitingForCommentary')
                : t('can2025.match.noDataYet')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { useTranslations } from 'next-intl';

interface Match {
  match_id: string;
  home_team: string;
  away_team: string;
  home_score: string;
  away_score: string;
  status: string;
  date: string;
  competition: string;
  has_commentary: boolean;
  has_prematch: boolean;
  commentary_count: number;
  first_commented: string;
}

export default function MatchesPage() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('matchesPage');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const response = await fetch('/api/matches/commented');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        setMatches(data.matches || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status.includes('PROGRESS') || status.includes('In Progress')) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          {t('live')}
        </span>
      );
    }
    if (status.includes('FINAL') || status.includes('Final')) {
      return (
        <span className="px-2 py-1 bg-gray-500 text-white text-xs font-bold rounded">
          {t('finished')}
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded">
        {t('scheduled')}
      </span>
    );
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#F6F6F6] pt-header pb-20 lg:pb-0">
        <div className="container-main py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-[#04453f]/10 rounded-full mb-4">
              <span className="text-[#04453f] font-bold text-sm uppercase tracking-wide">
                {t('badge')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04453f]"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 font-semibold">{t('error')}: {error}</p>
            </div>
          )}

          {/* Matches Grid */}
          {!loading && !error && matches.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-500 text-lg">{t('noMatches')}</p>
            </div>
          )}

          {!loading && !error && matches.length > 0 && (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {t('totalMatches')}: <span className="font-bold text-gray-900">{matches.length}</span>
              </div>

              <div className="space-y-4">
                {matches.map((match) => (
                  <Link
                    key={match.match_id}
                    href={`/can-2025/match/${match.match_id}`}
                    className="block bg-white rounded-xl p-4 md:p-6 border-2 border-gray-100 hover:border-[#9DFF20] hover:shadow-lg transition-all"
                  >
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                        {getStatusBadge(match.status)}
                        <span className="text-xs text-gray-500">
                          {new Date(match.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{match.home_team}</span>
                          <span className="text-2xl font-bold text-gray-900">{match.home_score}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{match.away_team}</span>
                          <span className="text-2xl font-bold text-gray-900">{match.away_score}</span>
                        </div>
                      </div>

                      {/* Commentary Info */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {match.has_prematch && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            {t('preMatch')}
                          </span>
                        )}
                        {match.has_commentary && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                            {match.commentary_count} {t('comments')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-6">
                      {/* Date */}
                      <div className="flex flex-col items-center justify-center min-w-[100px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                        <span className="text-xs font-bold text-gray-500 uppercase mb-1">
                          {new Date(match.date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {new Date(match.date).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Teams */}
                      <div className="flex-1 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1 justify-end">
                          <span className="font-bold text-gray-900 text-lg">{match.home_team}</span>
                        </div>

                        <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-xl min-w-[120px] justify-center">
                          <span className="text-3xl font-bold text-white">{match.home_score}</span>
                          <span className="text-2xl font-bold text-white/50">-</span>
                          <span className="text-3xl font-bold text-white">{match.away_score}</span>
                        </div>

                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-bold text-gray-900 text-lg">{match.away_team}</span>
                        </div>
                      </div>

                      {/* Status & Commentary Info */}
                      <div className="flex flex-col items-end gap-2 min-w-[150px]">
                        {getStatusBadge(match.status)}
                        <div className="flex items-center gap-2">
                          {match.has_prematch && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {t('preMatch')}
                            </span>
                          )}
                          {match.has_commentary && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                              {match.commentary_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

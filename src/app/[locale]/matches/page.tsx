import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Header, Footer } from '@/components/layout';

// Revalidate every 60 seconds for fresh match data
export const revalidate = 60;

interface ESPNMatch {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
    displayClock?: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      team: {
        id: string;
        displayName: string;
        abbreviation: string;
        logo?: string;
      };
      score: string;
      homeAway: 'home' | 'away';
    }>;
    venue?: {
      fullName: string;
    };
  }>;
}

async function fetchAFCONMatches(): Promise<ESPNMatch[]> {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      {
        next: { revalidate: 60 },
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('ESPN API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching AFCON matches:', error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('matchesPage');

  return {
    title: `${t('title')} | Afrique Sports`,
    description: t('description'),
  };
}

async function MatchesList({ locale }: { locale: string }) {
  const t = await getTranslations('matchesPage');
  const matches = await fetchAFCONMatches();

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500 text-lg">{t('noMatches')}</p>
      </div>
    );
  }

  // Separate matches by status
  const liveMatches = matches.filter((m) => m.status.type.state === 'in');
  const completedMatches = matches.filter((m) => m.status.type.completed);
  const upcomingMatches = matches.filter((m) => m.status.type.state === 'pre');

  const allMatchesSorted = [...liveMatches, ...upcomingMatches, ...completedMatches];

  const getStatusBadge = (match: ESPNMatch) => {
    const { type } = match.status;

    if (type.state === 'in') {
      return (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {t('live')}
          </span>
          {match.status.displayClock && (
            <span className="text-xs text-gray-500">{match.status.displayClock}</span>
          )}
        </div>
      );
    }

    if (type.completed) {
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
      <div className="mb-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            {t('totalMatches')}: <span className="font-bold text-gray-900">{matches.length}</span>
          </span>
          {liveMatches.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {liveMatches.length} {t('live')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {allMatchesSorted.map((match) => {
          const competition = match.competitions[0];
          const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
          const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

          if (!homeTeam || !awayTeam) return null;

          const matchDate = new Date(match.date);

          return (
            <Link
              key={match.id}
              href={`/can-2025/match/${match.id}`}
              className="block bg-white rounded-xl p-4 md:p-6 border-2 border-gray-100 hover:border-[#9DFF20] hover:shadow-lg transition-all"
            >
              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  {getStatusBadge(match)}
                  <span className="text-xs text-gray-500">
                    {matchDate.toLocaleDateString(
                      locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    )}
                  </span>
                </div>

                {/* Teams */}
                <div className="space-y-3">
                  {/* Home Team */}
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3 flex-1">
                      {homeTeam.team.logo && (
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={homeTeam.team.logo}
                            alt={homeTeam.team.displayName}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span className="font-bold text-gray-900 text-base">
                        {homeTeam.team.displayName}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-right">
                      {homeTeam.score || '0'}
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-3 flex-1">
                      {awayTeam.team.logo && (
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={awayTeam.team.logo}
                            alt={awayTeam.team.displayName}
                            width={32}
                            height={32}
                            className="object-contain"
                          />
                        </div>
                      )}
                      <span className="font-bold text-gray-900 text-base">
                        {awayTeam.team.displayName}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-right">
                      {awayTeam.score || '0'}
                    </span>
                  </div>
                </div>

                {/* Venue */}
                {competition.venue?.fullName && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{competition.venue.fullName}</span>
                  </div>
                )}
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-center gap-6">
                {/* Date & Time */}
                <div className="flex flex-col items-center justify-center min-w-[100px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <span className="text-xs font-bold text-gray-500 uppercase mb-1">
                    {matchDate.toLocaleDateString(
                      locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {matchDate.toLocaleTimeString(
                      locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      }
                    )}
                  </span>
                </div>

                {/* Teams Container */}
                <div className="flex-1 flex items-center justify-between gap-6">
                  {/* Home Team */}
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="font-bold text-gray-900 text-lg">
                      {homeTeam.team.displayName}
                    </span>
                    {homeTeam.team.logo && (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={homeTeam.team.logo}
                          alt={homeTeam.team.displayName}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-xl min-w-[120px] justify-center">
                    <span className="text-3xl font-bold text-white">{homeTeam.score || '0'}</span>
                    <span className="text-2xl font-bold text-white/50">-</span>
                    <span className="text-3xl font-bold text-white">{awayTeam.score || '0'}</span>
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center gap-4 flex-1">
                    {awayTeam.team.logo && (
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={awayTeam.team.logo}
                          alt={awayTeam.team.displayName}
                          width={40}
                          height={40}
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="font-bold text-gray-900 text-lg">
                      {awayTeam.team.displayName}
                    </span>
                  </div>
                </div>

                {/* Status & Venue */}
                <div className="flex flex-col items-end gap-2 min-w-[180px]">
                  {getStatusBadge(match)}
                  {competition.venue?.fullName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg
                        className="w-4 h-4 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate max-w-[150px]">{competition.venue.fullName}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-6">
            <div className="w-[100px] h-[80px] bg-gray-200 rounded-xl"></div>
            <div className="flex-1 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="w-[120px] h-[60px] bg-gray-200 rounded-xl"></div>
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-gray-200 rounded"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="w-[180px] h-[60px] bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function MatchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('matchesPage');

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

          {/* Matches List */}
          <Suspense fallback={<LoadingSkeleton />}>
            <MatchesList locale={locale} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}

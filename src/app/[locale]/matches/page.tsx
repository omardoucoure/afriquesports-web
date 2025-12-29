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
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('noMatches')}</h3>
        <p className="text-gray-500">Revenez plus tard pour voir les prochains matchs</p>
      </div>
    );
  }

  // Separate matches by status
  const liveMatches = matches.filter((m) => m.status.type.state === 'in');
  const completedMatches = matches.filter((m) => m.status.type.completed);
  const upcomingMatches = matches.filter((m) => m.status.type.state === 'pre');

  const getStatusBadge = (match: ESPNMatch, size: 'sm' | 'lg' = 'sm') => {
    const { type } = match.status;

    if (type.state === 'in') {
      return (
        <div className={`flex items-center ${size === 'lg' ? 'gap-3' : 'gap-2'}`}>
          <span className={`flex items-center gap-2 ${size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} bg-red-500 text-white font-bold rounded-full shadow-lg`}>
            <span className={`${size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'} bg-white rounded-full animate-pulse`}></span>
            {t('live')}
          </span>
          {match.status.displayClock && (
            <span className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-semibold text-gray-600`}>
              {match.status.displayClock}
            </span>
          )}
        </div>
      );
    }

    if (type.completed) {
      return (
        <span className={`${size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} bg-gray-600 text-white font-bold rounded-full`}>
          {t('finished')}
        </span>
      );
    }

    return (
      <span className={`${size === 'lg' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} bg-[#04453f] text-white font-bold rounded-full`}>
        {t('scheduled')}
      </span>
    );
  };

  const renderMatchCard = (match: ESPNMatch, isLive = false) => {
    const competition = match.competitions[0];
    const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
    const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return null;

    const matchDate = new Date(match.date);

    return (
      <Link
        key={match.id}
        href={`/can-2025/match/${match.id}`}
        className={`block group ${
          isLive
            ? 'bg-gradient-to-br from-red-50 via-white to-orange-50 border-2 border-red-200'
            : 'bg-white border-2 border-gray-100'
        } rounded-2xl p-5 md:p-6 hover:border-[#9DFF20] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] transform`}
      >
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            {getStatusBadge(match, 'lg')}
            <div className="text-right">
              <div className="text-xs font-medium text-gray-500">
                {matchDate.toLocaleDateString(
                  locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                  {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  }
                )}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {matchDate.toLocaleTimeString(
                  locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}
              </div>
            </div>
          </div>

          {/* Teams - Stacked Horizontal Layout */}
          <div className="space-y-4">
            {/* Home Team */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {homeTeam.team.logo && (
                  <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0 border-2 border-gray-100">
                    <Image
                      src={homeTeam.team.logo}
                      alt={homeTeam.team.displayName}
                      width={48}
                      height={48}
                      className="object-contain p-1"
                    />
                  </div>
                )}
                <span className="font-bold text-gray-900 text-lg truncate">
                  {homeTeam.team.displayName}
                </span>
              </div>
              <span className="text-4xl font-bold text-gray-900 min-w-[3rem] text-right">
                {homeTeam.score || '-'}
              </span>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full"></div>
              <span className="px-4 text-xs font-bold text-gray-400">VS</span>
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full"></div>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {awayTeam.team.logo && (
                  <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center flex-shrink-0 border-2 border-gray-100">
                    <Image
                      src={awayTeam.team.logo}
                      alt={awayTeam.team.displayName}
                      width={48}
                      height={48}
                      className="object-contain p-1"
                    />
                  </div>
                )}
                <span className="font-bold text-gray-900 text-lg truncate">
                  {awayTeam.team.displayName}
                </span>
              </div>
              <span className="text-4xl font-bold text-gray-900 min-w-[3rem] text-right">
                {awayTeam.score || '-'}
              </span>
            </div>
          </div>

          {/* Venue */}
          {competition.venue?.fullName && (
            <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
              <svg
                className="w-5 h-5 text-[#04453f] flex-shrink-0"
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
              <span className="text-sm font-medium text-gray-700">{competition.venue.fullName}</span>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-8">
          {/* Date & Time */}
          <div className="flex flex-col items-center justify-center min-w-[120px] bg-gradient-to-br from-[#04453f]/5 to-[#345C00]/5 rounded-2xl p-5 border border-gray-200">
            <span className="text-xs font-bold text-[#04453f] uppercase tracking-wide mb-2">
              {matchDate.toLocaleDateString(
                locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }
              )}
            </span>
            <span className="text-2xl font-bold text-gray-900">
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
          <div className="flex-1 flex items-center justify-between gap-8">
            {/* Home Team */}
            <div className="flex items-center gap-5 flex-1 justify-end">
              <span className="font-bold text-gray-900 text-xl truncate">
                {homeTeam.team.displayName}
              </span>
              {homeTeam.team.logo && (
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-100 group-hover:scale-110 transition-transform">
                  <Image
                    src={homeTeam.team.logo}
                    alt={homeTeam.team.displayName}
                    width={56}
                    height={56}
                    className="object-contain p-2"
                  />
                </div>
              )}
            </div>

            {/* Score */}
            <div className="flex items-center gap-4 px-8 py-4 bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-2xl min-w-[160px] justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">{homeTeam.score || '-'}</span>
              <span className="text-3xl font-bold text-white/40">:</span>
              <span className="text-4xl font-bold text-white">{awayTeam.score || '-'}</span>
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-5 flex-1">
              {awayTeam.team.logo && (
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center flex-shrink-0 border-2 border-gray-100 group-hover:scale-110 transition-transform">
                  <Image
                    src={awayTeam.team.logo}
                    alt={awayTeam.team.displayName}
                    width={56}
                    height={56}
                    className="object-contain p-2"
                  />
                </div>
              )}
              <span className="font-bold text-gray-900 text-xl truncate">
                {awayTeam.team.displayName}
              </span>
            </div>
          </div>

          {/* Status & Venue */}
          <div className="flex flex-col items-end gap-3 min-w-[200px]">
            {getStatusBadge(match, 'lg')}
            {competition.venue?.fullName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 flex-shrink-0 text-[#04453f]"
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
                <span className="truncate max-w-[160px] font-medium">{competition.venue.fullName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Stats Summary Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#04453f] to-[#345C00] rounded-2xl p-5 text-white shadow-lg">
          <div className="text-3xl md:text-4xl font-bold mb-1">{matches.length}</div>
          <div className="text-sm md:text-base opacity-90">Total matchs</div>
        </div>
        {liveMatches.length > 0 && (
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-3xl md:text-4xl font-bold">{liveMatches.length}</div>
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <div className="text-sm md:text-base opacity-90">En direct</div>
          </div>
        )}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-3xl md:text-4xl font-bold mb-1">{upcomingMatches.length}</div>
          <div className="text-sm md:text-base opacity-90">À venir</div>
        </div>
        <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="text-3xl md:text-4xl font-bold mb-1">{completedMatches.length}</div>
          <div className="text-sm md:text-base opacity-90">Terminés</div>
        </div>
      </div>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <h2 className="text-lg md:text-xl font-bold text-white">En direct maintenant</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-red-200 to-transparent"></div>
          </div>
          <div className="space-y-5">
            {liveMatches.map((match) => renderMatchCard(match, true))}
          </div>
        </div>
      )}

      {/* Upcoming Matches Section */}
      {upcomingMatches.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-full shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-white">Prochains matchs</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#04453f]/20 to-transparent"></div>
          </div>
          <div className="space-y-5">
            {upcomingMatches.map((match) => renderMatchCard(match, false))}
          </div>
        </div>
      )}

      {/* Completed Matches Section */}
      {completedMatches.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg md:text-xl font-bold text-white">Résultats récents</h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>
          <div className="space-y-5">
            {completedMatches.map((match) => renderMatchCard(match, false))}
          </div>
        </div>
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-2xl p-5 h-24"></div>
        ))}
      </div>

      {/* Match Cards Skeleton */}
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-5 md:p-6 border-2 border-gray-100">
            {/* Mobile Skeleton */}
            <div className="md:hidden space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="h-8 w-20 bg-gray-200 rounded-full"></div>
                <div className="space-y-1">
                  <div className="h-3 w-16 bg-gray-200 rounded ml-auto"></div>
                  <div className="h-5 w-12 bg-gray-200 rounded ml-auto"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 w-12 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <div className="h-4 w-full max-w-xs bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Desktop Skeleton */}
            <div className="hidden md:flex items-center gap-8">
              <div className="w-[120px] h-24 bg-gray-200 rounded-2xl"></div>
              <div className="flex-1 flex items-center justify-between gap-8">
                <div className="flex items-center gap-5 flex-1 justify-end">
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="w-[160px] h-16 bg-gray-200 rounded-2xl"></div>
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-[200px] space-y-2">
                <div className="h-8 w-24 bg-gray-200 rounded-full ml-auto"></div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
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

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-[#F6F6F6] pt-header pb-20 lg:pb-0">
        <div className="container-main py-6 md:py-10">
          {/* Page Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#04453f]/10 to-[#345C00]/10 rounded-full mb-6 border border-[#04453f]/20">
              <svg className="w-5 h-5 text-[#04453f]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" />
              </svg>
              <span className="text-[#04453f] font-bold text-sm md:text-base uppercase tracking-wide">
                {t('badge')}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 bg-gradient-to-r from-gray-900 via-[#04453f] to-gray-900 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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

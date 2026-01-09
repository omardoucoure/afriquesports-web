import { Suspense, cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Header, Footer } from '@/components/layout';

// Revalidate every 5 minutes for match data (reduces cold starts)
// During live matches, client-side polling handles updates
export const revalidate = 300;

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

// Wrap with React cache() to deduplicate requests within same render
const fetchAFCONMatches = cache(async (): Promise<ESPNMatch[]> => {
  try {
    // Fetch today's and tomorrow's matches in parallel for better performance
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0].replace(/-/g, '');

    const [todayResponse, tomorrowResponse] = await Promise.all([
      fetch(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
        {
          next: { revalidate: 300 }, // 5 minutes cache (cost optimized)
          headers: { 'Accept': 'application/json' },
        }
      ),
      fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard?dates=${tomorrowDate}`,
        {
          next: { revalidate: 300 }, // 5 minutes cache
          headers: { 'Accept': 'application/json' },
        }
      ),
    ]);

    let allMatches: ESPNMatch[] = [];

    if (todayResponse.ok) {
      const todayData = await todayResponse.json();
      allMatches = todayData.events || [];
    } else {
      console.error('ESPN API error (today):', todayResponse.status);
    }

    if (tomorrowResponse.ok) {
      const tomorrowData = await tomorrowResponse.json();
      const tomorrowMatches = tomorrowData.events || [];
      allMatches = [...allMatches, ...tomorrowMatches];
    }

    return allMatches;
  } catch (error) {
    console.error('Error fetching AFCON matches:', error);
    return [];
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations('matchesPage');

  const title = `${t('title')} | Afrique Sports`;
  const description = t('description');
  const baseUrl = 'https://www.afriquesports.net';
  const currentUrl = `${baseUrl}/${locale}/matches`;

  return {
    title,
    description,
    keywords: [
      'AFCON 2025',
      'Africa Cup of Nations',
      'CAN 2025',
      'live matches',
      'football results',
      'African football',
      'live commentary',
      'AI commentary',
      'match schedule',
      'upcoming matches',
    ].join(', '),
    authors: [{ name: 'Afrique Sports' }],
    creator: 'Afrique Sports',
    publisher: 'Afrique Sports',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        'fr': `${baseUrl}/fr/matches`,
        'en': `${baseUrl}/en/matches`,
        'es': `${baseUrl}/es/matches`,
        'ar': `${baseUrl}/ar/matches`,
      },
    },
    openGraph: {
      title,
      description,
      url: currentUrl,
      siteName: 'Afrique Sports',
      locale: locale === 'fr' ? 'fr_FR' : locale === 'en' ? 'en_US' : locale === 'es' ? 'es_ES' : 'ar_AR',
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og-matches.jpg`,
          width: 1200,
          height: 630,
          alt: 'AFCON 2025 Matches - Live Results & Commentary',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@afriquesports',
      creator: '@afriquesports',
      images: [`${baseUrl}/og-matches.jpg`],
    },
    verification: {
      google: 'your-google-verification-code',
    },
    category: 'Sports',
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

  // Separate matches by status (avoids hydration issues from date calculations)
  const liveMatches = matches.filter((m) => m.status.type.state === 'in');
  const completedMatches = matches.filter((m) => m.status.type.completed);
  const upcomingMatches = matches.filter((m) => m.status.type.state === 'pre');

  // Find next match by date (for when there are no scheduled matches)
  const now = Date.now();
  const futureMatches = matches.filter((m) => new Date(m.date).getTime() > now);
  const nextMatch = futureMatches.length > 0
    ? [futureMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]]
    : [];

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
        } rounded-xl p-4 md:p-4 hover:border-[#9DFF20] hover:shadow-lg transition-all duration-300 hover:scale-[1.01] transform`}
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
              {match.status.type.state !== 'pre' && (
                <span className="text-4xl font-bold text-gray-900 min-w-[3rem] text-right">
                  {homeTeam.score || '-'}
                </span>
              )}
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
              {match.status.type.state !== 'pre' && (
                <span className="text-4xl font-bold text-gray-900 min-w-[3rem] text-right">
                  {awayTeam.score || '-'}
                </span>
              )}
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

        {/* Desktop Layout - Compact */}
        <div className="hidden md:flex items-center gap-4">
          {/* Date & Time */}
          <div className="flex items-center justify-center w-[70px] h-[44px] bg-gradient-to-br from-[#04453f]/5 to-[#345C00]/5 rounded-lg border border-gray-200 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-900">
              {matchDate.toLocaleTimeString(
                locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              )}
            </span>
          </div>

          {/* Home Team */}
          <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
            <span className="font-semibold text-gray-900 text-xs truncate text-right">
              {homeTeam.team.displayName}
            </span>
            {homeTeam.team.logo && (
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                <Image
                  src={homeTeam.team.logo}
                  alt={homeTeam.team.displayName}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            )}
          </div>

          {/* Score or VS indicator */}
          {match.status.type.state === 'pre' ? (
            <div className="flex items-center justify-center w-[90px] h-[44px] bg-gradient-to-r from-[#04453f]/10 to-[#345C00]/10 rounded-lg border-2 border-[#04453f]/20 flex-shrink-0">
              <span className="text-sm font-bold text-[#04453f]">VS</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 w-[90px] h-[44px] bg-gradient-to-r from-[#04453f] to-[#345C00] rounded-lg shadow-sm flex-shrink-0">
              <span className="text-lg font-bold text-white tabular-nums">{homeTeam.score || '0'}</span>
              <span className="text-sm font-bold text-white/40">:</span>
              <span className="text-lg font-bold text-white tabular-nums">{awayTeam.score || '0'}</span>
            </div>
          )}

          {/* Away Team */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {awayTeam.team.logo && (
              <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                <Image
                  src={awayTeam.team.logo}
                  alt={awayTeam.team.displayName}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
            )}
            <span className="font-semibold text-gray-900 text-xs truncate">
              {awayTeam.team.displayName}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-end w-[100px] flex-shrink-0">
            {getStatusBadge(match, 'sm')}
          </div>
        </div>
      </Link>
    );
  };

  const renderSection = (title: string, icon: React.ReactNode, matchList: ESPNMatch[], colorClasses: string, id?: string) => {
    if (matchList.length === 0) return null;

    return (
      <div className="mb-8" id={id}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-2 px-4 py-2 ${colorClasses} rounded-full shadow-md`}>
            {icon}
            <h2 className="text-base md:text-lg font-bold text-white">{title}</h2>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {matchList.map((match) => renderMatchCard(match, match.status.type.state === 'in'))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Live Matches Section */}
      {renderSection(
        'En direct maintenant',
        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>,
        liveMatches,
        'bg-gradient-to-r from-red-500 to-red-600'
      )}

      {/* Next Match Section - Always show if there's a future match */}
      {nextMatch.length > 0 && upcomingMatches.length === 0 && liveMatches.length === 0 && renderSection(
        "Prochain match",
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>,
        nextMatch,
        'bg-gradient-to-r from-blue-500 to-blue-600'
      )}

      {/* Upcoming Matches Section */}
      {renderSection(
        "Prochains matchs",
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>,
        upcomingMatches,
        'bg-gradient-to-r from-[#04453f] to-[#345C00]'
      )}

      {/* Completed Matches Section */}
      {renderSection(
        'Résultats',
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>,
        completedMatches,
        'bg-gradient-to-r from-gray-600 to-gray-700'
      )}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Match Cards Skeleton - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border-2 border-gray-100">
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

            {/* Desktop Skeleton - Compact */}
            <div className="hidden md:flex items-center gap-4">
              <div className="w-[70px] h-[44px] bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
              </div>
              <div className="w-[90px] h-[44px] bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </div>
              <div className="w-[100px] flex items-center justify-end flex-shrink-0">
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
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
  const matches = await fetchAFCONMatches();

  // Generate structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AFCON 2025 Matches',
    description: 'Live match results and upcoming fixtures for Africa Cup of Nations 2025',
    numberOfItems: matches.length,
    itemListElement: matches.map((match, index) => {
      const competition = match.competitions[0];
      const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
      const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

      return {
        '@type': 'SportsEvent',
        position: index + 1,
        name: match.name,
        description: `${homeTeam?.team.displayName} vs ${awayTeam?.team.displayName}`,
        startDate: match.date,
        eventStatus: match.status.type.completed
          ? 'https://schema.org/EventScheduled'
          : match.status.type.state === 'in'
          ? 'https://schema.org/EventLive'
          : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: competition.venue?.fullName || 'TBD',
        },
        competitor: [
          {
            '@type': 'SportsTeam',
            name: homeTeam?.team.displayName,
          },
          {
            '@type': 'SportsTeam',
            name: awayTeam?.team.displayName,
          },
        ],
        ...(match.status.type.completed && {
          homeTeam: {
            '@type': 'SportsTeam',
            name: homeTeam?.team.displayName,
          },
          awayTeam: {
            '@type': 'SportsTeam',
            name: awayTeam?.team.displayName,
          },
          homeScore: homeTeam?.score,
          awayScore: awayTeam?.score,
        }),
      };
    }),
  };

  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://www.afriquesports.net',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Matches',
        item: `https://www.afriquesports.net/${locale}/matches`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />

      <Header />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-[#F6F6F6] pt-header pb-20 lg:pb-0">
        <div className="container-main py-6 md:py-10">

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

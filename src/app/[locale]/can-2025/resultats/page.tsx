import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type Match = {
  id: string;
  date: string;
  name: string;
  shortName: string;
  status: {
    type: {
      state: string; // 'pre', 'in', 'post'
      completed: boolean;
    };
  };
  competitions: Array<{
    competitors: Array<{
      team: {
        displayName: string;
        abbreviation: string;
        logo: string;
      };
      score: string;
      homeAway: 'home' | 'away';
    }>;
  }>;
};

async function getMatches(): Promise<Match[]> {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      { next: { revalidate: 60 } } // Cache for 1 minute
    );

    if (!response.ok) {
      console.error('ESPN API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale });

  return {
    title: `${t('can2025.results.title')} | Afrique Sports`,
    description: t('can2025.results.description'),
  };
}

export default async function ResultsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale });
  const allMatches = await getMatches();

  // Separate matches by status
  const completedMatches = allMatches.filter(
    (m) => m.status.type.completed
  );
  const liveMatches = allMatches.filter(
    (m) => m.status.type.state === 'in'
  );
  const upcomingMatches = allMatches.filter(
    (m) => m.status.type.state === 'pre'
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const MatchCard = ({ match }: { match: Match }) => {
    const competition = match.competitions[0];
    const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
    const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

    if (!homeTeam || !awayTeam) return null;

    const isCompleted = match.status.type.completed;
    const isLive = match.status.type.state === 'in';

    return (
      <Link
        href={`/${locale}/can-2025/matches/${match.id}`}
        className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-3">
          <time className="text-xs text-gray-500">
            {formatDate(match.date)}
          </time>
          {isLive && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              LIVE
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-medium text-gray-500">
              {t('can2025.results.finished')}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={homeTeam.team.logo}
              alt={homeTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 line-clamp-1">
                {homeTeam.team.displayName}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center gap-2 px-4">
            {isCompleted || isLive ? (
              <>
                <span className="text-2xl font-bold text-gray-900">
                  {homeTeam.score}
                </span>
                <span className="text-xl font-medium text-gray-400">-</span>
                <span className="text-2xl font-bold text-gray-900">
                  {awayTeam.score}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-gray-500">vs</span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 flex-row-reverse">
            <img
              src={awayTeam.team.logo}
              alt={awayTeam.team.displayName}
              className="w-10 h-10 object-contain"
            />
            <div className="flex-1 text-right">
              <p className="font-medium text-gray-900 line-clamp-1">
                {awayTeam.team.displayName}
              </p>
            </div>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-primary-dark font-medium">
              {t('can2025.results.viewFullReport')} →
            </p>
          </div>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('can2025.results.title')}
          </h1>
          <p className="text-gray-600">
            {t('can2025.results.subtitle')}
          </p>
        </div>

        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              {t('can2025.results.liveNow')}
            </h2>
            <div className="space-y-3">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('can2025.results.completed')}
            </h2>
            <div className="space-y-3">
              {completedMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('can2025.results.upcoming')}
            </h2>
            <div className="space-y-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {allMatches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {t('can2025.results.noMatches')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

type MatchHistory = {
  match_id: string;
  locale: string;
  pre_match: {
    head_to_head: string;
    recent_form: string;
    key_players: string;
    tactical_preview: string;
    prediction: string;
  } | null;
  live_commentary: Array<{
    id: number;
    time: string;
    text: string;
    type: string;
    icon: string;
    is_scoring: boolean;
    video_url?: string;
    image_url?: string;
  }>;
  post_match_report: {
    title: string;
    summary: string;
    key_moments: Array<{
      minute: string;
      event: string;
      description: string;
    }>;
    analysis: string;
  } | null;
  has_pre_match: boolean;
  has_live_commentary: boolean;
  has_post_match_report: boolean;
  total_events: number;
};

async function getMatchHistory(
  matchId: string,
  locale: string
): Promise<MatchHistory | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/match-history?match_id=${matchId}&locale=${locale}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      console.error('Match history API error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching match history:', error);
    return null;
  }
}

async function getMatchInfo(matchId: string) {
  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data.header || null;
  } catch (error) {
    console.error('Error fetching match info:', error);
    return null;
  }
}

export async function generateMetadata({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}): Promise<Metadata> {
  const matchInfo = await getMatchInfo(id);

  if (!matchInfo) {
    return {
      title: 'Match Not Found | Afrique Sports',
    };
  }

  const homeTeam = matchInfo.competitions[0].competitors[0].team.displayName;
  const awayTeam = matchInfo.competitions[0].competitors[1].team.displayName;

  return {
    title: `${homeTeam} vs ${awayTeam} - CAN 2025 | Afrique Sports`,
    description: `Complete match coverage, analysis, and statistics for ${homeTeam} vs ${awayTeam} at CAN 2025.`,
  };
}

export default async function MatchDetailPage({
  params: { id, locale },
}: {
  params: { id: string; locale: string };
}) {
  // 301 Redirect to new unified URL pattern
  redirect(`/${locale}/can-2025/match/${id}`);

  const competition = matchInfo.competitions[0];
  const homeTeam = competition.competitors[0];
  const awayTeam = competition.competitors[1];
  const isCompleted = matchInfo.status.type.completed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Match Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <time className="text-sm text-gray-500">
              {new Date(matchInfo.date).toLocaleDateString(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </time>
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
              <h2 className="text-xl font-bold text-gray-900 text-center">
                {homeTeam.team.displayName}
              </h2>
            </div>

            {/* Score */}
            <div className="flex items-center gap-4">
              <span className="text-5xl font-bold text-gray-900">
                {homeTeam.score || '0'}
              </span>
              <span className="text-3xl font-medium text-gray-400">-</span>
              <span className="text-5xl font-bold text-gray-900">
                {awayTeam.score || '0'}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center flex-1">
              <img
                src={awayTeam.team.logo}
                alt={awayTeam.team.displayName}
                className="w-20 h-20 mb-3"
              />
              <h2 className="text-xl font-bold text-gray-900 text-center">
                {awayTeam.team.displayName}
              </h2>
            </div>
          </div>
        </div>

        {/* Pre-Match Analysis */}
        {matchHistory?.has_pre_match && matchHistory.pre_match && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 {t('can2025.match.preMatchAnalysis')}
            </h3>

            <div className="space-y-6">
              {matchHistory.pre_match.head_to_head && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.headToHead')}
                  </h4>
                  <p className="text-gray-700">
                    {matchHistory.pre_match.head_to_head}
                  </p>
                </div>
              )}

              {matchHistory.pre_match.recent_form && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.recentForm')}
                  </h4>
                  <p className="text-gray-700">
                    {matchHistory.pre_match.recent_form}
                  </p>
                </div>
              )}

              {matchHistory.pre_match.key_players && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.keyPlayers')}
                  </h4>
                  <p className="text-gray-700">
                    {matchHistory.pre_match.key_players}
                  </p>
                </div>
              )}

              {matchHistory.pre_match.tactical_preview && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.tacticalPreview')}
                  </h4>
                  <p className="text-gray-700">
                    {matchHistory.pre_match.tactical_preview}
                  </p>
                </div>
              )}

              {matchHistory.pre_match.prediction && (
                <div className="bg-primary/5 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.prediction')}
                  </h4>
                  <p className="text-gray-700">
                    {matchHistory.pre_match.prediction}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Post-Match Report */}
        {matchHistory?.has_post_match_report && matchHistory.post_match_report && (
          <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 {t('can2025.match.matchReport')}
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  {matchHistory.post_match_report.title}
                </h4>
                <div className="prose max-w-none text-gray-700">
                  {matchHistory.post_match_report.summary}
                </div>
              </div>

              {matchHistory.post_match_report.key_moments && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {t('can2025.match.keyMoments')}
                  </h4>
                  <div className="space-y-3">
                    {matchHistory.post_match_report.key_moments.map(
                      (moment, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="font-bold text-primary-dark min-w-[50px]">
                            {moment.minute}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {moment.event}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {moment.description}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {matchHistory.post_match_report.analysis && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {t('can2025.match.analysis')}
                  </h4>
                  <div className="prose max-w-none text-gray-700">
                    {matchHistory.post_match_report.analysis}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Live Commentary */}
        {matchHistory?.has_live_commentary && (
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              ⚽ {t('can2025.match.liveCommentary')}
              <span className="text-sm font-normal text-gray-500">
                ({matchHistory.total_events} {t('can2025.match.events')})
              </span>
            </h3>

            <div className="space-y-3">
              {matchHistory.live_commentary.map((event) => (
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

                    {/* Goal Video/Image */}
                    {event.video_url && (
                      <div className="mt-2">
                        <iframe
                          src={event.video_url}
                          className="w-full aspect-video rounded"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {!event.video_url && event.image_url && (
                      <div className="mt-2">
                        <img
                          src={event.image_url}
                          alt="Goal"
                          className="w-full rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Data */}
        {!matchHistory?.has_pre_match &&
          !matchHistory?.has_live_commentary &&
          !matchHistory?.has_post_match_report && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500">
                {t('can2025.match.noDataYet')}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}

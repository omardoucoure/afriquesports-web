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
      { next: { revalidate: 120 } } // 2 minutes (cost optimized)
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
      { next: { revalidate: 120 } } // 2 minutes (cost optimized)
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
}

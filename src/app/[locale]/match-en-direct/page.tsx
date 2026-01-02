import { redirect } from 'next/navigation';

/**
 * Legacy Match En Direct Page
 * Redirects to the latest CAN 2025 match (live or upcoming)
 */

async function getLatestMatch() {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      { next: { revalidate: 120 } } // 2 minutes (cost optimized)
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const matches = data.events || [];

    if (matches.length === 0) {
      return null;
    }

    // Prioritize: Live match > Upcoming match (soonest) > Latest match
    const liveMatch = matches.find((m: any) => m.status?.type?.state === 'in');
    if (liveMatch) {
      return liveMatch.id;
    }

    // Find upcoming match (not completed, closest to now)
    const now = new Date();
    const upcomingMatches = matches
      .filter((m: any) => !m.status?.type?.completed)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return Math.abs(dateA.getTime() - now.getTime()) - Math.abs(dateB.getTime() - now.getTime());
      });

    if (upcomingMatches.length > 0) {
      return upcomingMatches[0].id;
    }

    // Fallback to most recent match
    return matches[0].id;
  } catch (error) {
    console.error('Error fetching latest match:', error);
    return null;
  }
}

export default async function MatchEnDirectPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const matchId = await getLatestMatch();

  if (matchId) {
    // Redirect to new unified match page
    redirect(`/${locale}/can-2025/match/${matchId}`);
  }

  // Fallback: redirect to CAN 2025 main page
  redirect(`/${locale}/can-2025`);
}

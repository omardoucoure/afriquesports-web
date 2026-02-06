import { NextResponse } from 'next/server';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.champions';

// Helper to get team logo from ESPN data, with fallback
function getTeamLogo(team: any): string {
  return team?.logo || team?.logos?.[0]?.href || '';
}

// Helper to add no-cache headers (prevent Cloudflare caching)
function jsonResponse(data: any, status?: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'CDN-Cache-Control': 'no-store',
      'Cloudflare-CDN-Cache-Control': 'no-store',
      'Surrogate-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Tell Cloudflare to bypass cache entirely
      'CF-Cache-Status': 'BYPASS',
    },
  });
}

function buildMatchResponse(event: any, isLive: boolean, isFinished: boolean) {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
  const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');
  const homeTeam = homeCompetitor?.team;
  const awayTeam = awayCompetitor?.team;

  const result: any = {
    hasMatch: true,
    id: event.id,
    competition: 'CAF Champions League',
    homeTeam: {
      name: homeTeam?.displayName || homeTeam?.name || '',
      code: homeTeam?.abbreviation || '',
      flag: getTeamLogo(homeTeam),
    },
    awayTeam: {
      name: awayTeam?.displayName || awayTeam?.name || '',
      code: awayTeam?.abbreviation || '',
      flag: getTeamLogo(awayTeam),
    },
    date: event.date,
    venue: competition.venue?.fullName || competition.venue?.displayName || event.venue?.fullName || '',
    city: competition.venue?.address?.city || event.venue?.address?.city || '',
    isLive,
    isFinished,
  };

  if (isLive || isFinished) {
    result.homeScore = parseInt(homeCompetitor?.score || '0');
    result.awayScore = parseInt(awayCompetitor?.score || '0');
    result.statusDetail = competition.status?.type?.detail || (isLive ? 'LIVE' : 'FT');
  }

  return result;
}

export async function GET() {
  try {
    // Always fetch fresh data
    const response = await fetch(`${ESPN_API_BASE}/scoreboard`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();

    // PRIORITY 1: Find any LIVE match (status='in')
    const liveMatches = data.events?.filter((event: any) => {
      const status = event.competitions?.[0]?.status?.type?.state;
      return status === 'in';
    });

    if (liveMatches && liveMatches.length > 0) {
      return jsonResponse(buildMatchResponse(liveMatches[0], true, false));
    }

    // PRIORITY 2: Find the next upcoming match (status='pre' and date is in the future)
    const now = new Date();
    const upcomingMatches = data.events?.filter((event: any) => {
      const matchDate = new Date(event.date);
      const status = event.competitions?.[0]?.status?.type?.state;
      return matchDate > now && status === 'pre';
    }).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    if (upcomingMatches && upcomingMatches.length > 0) {
      return jsonResponse(buildMatchResponse(upcomingMatches[0], false, false));
    }

    // PRIORITY 3: Show most recent finished match (when no live or upcoming matches)
    const finishedMatches = data.events?.filter((event: any) => {
      const status = event.competitions?.[0]?.status?.type?.state;
      return status === 'post';
    }).sort((a: any, b: any) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (finishedMatches && finishedMatches.length > 0) {
      return jsonResponse(buildMatchResponse(finishedMatches[0], false, true));
    }

    // No matches found at all
    return jsonResponse({
      hasMatch: false,
      message: 'No matches available'
    });
  } catch (error) {
    console.error('Error fetching next match from ESPN:', error);
    return jsonResponse(
      {
        hasMatch: false,
        error: 'Failed to fetch next match data'
      },
      500
    );
  }
}

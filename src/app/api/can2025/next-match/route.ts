import { NextResponse } from 'next/server';

// Force dynamic rendering - disable all caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations';

// Map team names to country codes for flags
const TEAM_TO_FLAG: Record<string, string> = {
  'Morocco': 'ma',
  'Senegal': 'sn',
  'Egypt': 'eg',
  'Algeria': 'dz',
  'Tunisia': 'tn',
  'Nigeria': 'ng',
  'Cameroon': 'cm',
  'Ghana': 'gh',
  'Ivory Coast': 'ci',
  'Mali': 'ml',
  'Burkina Faso': 'bf',
  'South Africa': 'za',
  'DR Congo': 'cd',
  'Congo DR': 'cd',
  'Guinea': 'gn',
  'Zambia': 'zm',
  'Cape Verde': 'cv',
  'Gabon': 'ga',
  'Mauritania': 'mr',
  'Equatorial Guinea': 'gq',
  'Angola': 'ao',
  'Mozambique': 'mz',
  'Benin': 'bj',
  'Tanzania': 'tz',
  'Zimbabwe': 'zw',
  'Uganda': 'ug',
  'Comoros': 'km',
  'Sudan': 'sd',
  'Botswana': 'bw',
};

function getCountryCode(teamName: string): string {
  if (TEAM_TO_FLAG[teamName]) {
    return TEAM_TO_FLAG[teamName];
  }

  for (const [key, value] of Object.entries(TEAM_TO_FLAG)) {
    if (teamName.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(teamName.toLowerCase())) {
      return value;
    }
  }

  return 'xx';
}

// Helper to add no-cache headers (prevent Cloudflare caching)
function jsonResponse(data: any, status?: number) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      'CDN-Cache-Control': 'no-store',
      'Cloudflare-CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'Surrogate-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Tell Cloudflare to bypass cache entirely
      'CF-Cache-Status': 'BYPASS',
    },
  });
}

export async function GET() {
  try {
    // No cache for live match updates - always fetch fresh data
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
      const liveMatch = liveMatches[0];
      const competition = liveMatch.competitions[0];
      const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');
      const homeTeam = homeCompetitor?.team;
      const awayTeam = awayCompetitor?.team;

      // Get current score
      const homeScore = homeCompetitor?.score || 0;
      const awayScore = awayCompetitor?.score || 0;

      // Get clock/period info
      const statusDetail = competition.status?.type?.detail || 'LIVE';

      return jsonResponse({
        hasMatch: true,
        id: liveMatch.id,
        competition: 'CAN 2025',
        homeTeam: {
          name: homeTeam?.displayName || homeTeam?.name || '',
          code: homeTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(homeTeam?.displayName || '')}.png`,
        },
        awayTeam: {
          name: awayTeam?.displayName || awayTeam?.name || '',
          code: awayTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(awayTeam?.displayName || '')}.png`,
        },
        date: liveMatch.date,
        venue: liveMatch.venue?.fullName || liveMatch.venue?.displayName || '',
        city: liveMatch.venue?.address?.city || '',
        isLive: true,
        homeScore,
        awayScore,
        statusDetail,
      });
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
      const nextMatch = upcomingMatches[0];
      const competition = nextMatch.competitions[0];
      const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')?.team;
      const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')?.team;

      return jsonResponse({
        hasMatch: true,
        id: nextMatch.id,
        competition: 'CAN 2025',
        homeTeam: {
          name: homeTeam?.displayName || homeTeam?.name || '',
          code: homeTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(homeTeam?.displayName || '')}.png`,
        },
        awayTeam: {
          name: awayTeam?.displayName || awayTeam?.name || '',
          code: awayTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(awayTeam?.displayName || '')}.png`,
        },
        date: nextMatch.date,
        venue: nextMatch.venue?.fullName || nextMatch.venue?.displayName || '',
        city: nextMatch.venue?.address?.city || '',
        isLive: false,
      });
    }

    // PRIORITY 3: Show most recent finished match (when no live or upcoming matches)
    const finishedMatches = data.events?.filter((event: any) => {
      const status = event.competitions?.[0]?.status?.type?.state;
      return status === 'post';
    }).sort((a: any, b: any) => {
      // Sort by date descending (most recent first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    if (finishedMatches && finishedMatches.length > 0) {
      const recentMatch = finishedMatches[0];
      const competition = recentMatch.competitions[0];
      const homeCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'home');
      const awayCompetitor = competition.competitors?.find((c: any) => c.homeAway === 'away');
      const homeTeam = homeCompetitor?.team;
      const awayTeam = awayCompetitor?.team;

      return jsonResponse({
        hasMatch: true,
        id: recentMatch.id,
        competition: 'CAN 2025',
        homeTeam: {
          name: homeTeam?.displayName || homeTeam?.name || '',
          code: homeTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(homeTeam?.displayName || '')}.png`,
        },
        awayTeam: {
          name: awayTeam?.displayName || awayTeam?.name || '',
          code: awayTeam?.abbreviation || '',
          flag: `https://flagcdn.com/w80/${getCountryCode(awayTeam?.displayName || '')}.png`,
        },
        date: recentMatch.date,
        venue: recentMatch.venue?.fullName || recentMatch.venue?.displayName || '',
        city: recentMatch.venue?.address?.city || '',
        isLive: false,
        isFinished: true,
        homeScore: parseInt(homeCompetitor?.score || '0'),
        awayScore: parseInt(awayCompetitor?.score || '0'),
        statusDetail: competition.status?.type?.detail || 'Terminé',
      });
    }

    // No matches found at all
    return jsonResponse({
      hasMatch: false,
      message: 'No matches available'
    });
  } catch (error) {
    console.error('Error fetching next CAN 2025 match:', error);
    return jsonResponse(
      {
        hasMatch: false,
        error: 'Failed to fetch next match data'
      },
      500
    );
  }
}

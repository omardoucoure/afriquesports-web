import { NextResponse } from 'next/server';

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

export async function GET() {
  try {
    const response = await fetch(`${ESPN_API_BASE}/scoreboard`, {
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();

    // Find the next upcoming match (status is pre and date is in the future)
    const now = new Date();
    const upcomingMatches = data.events?.filter((event: any) => {
      const matchDate = new Date(event.date);
      const status = event.competitions?.[0]?.status?.type?.state;
      return matchDate > now && status === 'pre';
    }).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    if (!upcomingMatches || upcomingMatches.length === 0) {
      return NextResponse.json({
        hasMatch: false,
        message: 'No upcoming matches available'
      });
    }

    const nextMatch = upcomingMatches[0];
    const competition = nextMatch.competitions[0];
    const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home')?.team;
    const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away')?.team;

    // Transform the data
    const matchData = {
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
      isLive: competition.status?.type?.state === 'in',
    };

    return NextResponse.json(matchData);
  } catch (error) {
    console.error('Error fetching next CAN 2025 match:', error);
    return NextResponse.json(
      {
        hasMatch: false,
        error: 'Failed to fetch next match data'
      },
      { status: 500 }
    );
  }
}

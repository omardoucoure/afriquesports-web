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
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to include flag URLs
    if (data.events) {
      data.events = data.events.map((event: any) => {
        if (event.competitions?.[0]?.competitors) {
          event.competitions[0].competitors = event.competitions[0].competitors.map((competitor: any) => {
            const teamName = competitor.team?.displayName || competitor.team?.name || '';
            const countryCode = getCountryCode(teamName);

            return {
              ...competitor,
              team: {
                ...competitor.team,
                flagUrl: `https://flagcdn.com/w80/${countryCode}.png`,
                flagUrlLarge: `https://flagcdn.com/w160/${countryCode}.png`,
                countryCode,
              }
            };
          });
        }
        return event;
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching CAN 2025 schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule data' },
      { status: 500 }
    );
  }
}

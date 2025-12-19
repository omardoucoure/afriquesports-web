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
    // Try to fetch statistics/leaders from ESPN
    const response = await fetch(`${ESPN_API_BASE}/leaders`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();

    // Add flag URLs to scorers
    if (data.categories) {
      data.categories = data.categories.map((category: any) => {
        if (category.leaders) {
          category.leaders = category.leaders.map((leader: any) => {
            if (leader.athlete) {
              const teamName = leader.athlete.team?.displayName || '';
              const countryCode = getCountryCode(teamName);

              return {
                ...leader,
                athlete: {
                  ...leader.athlete,
                  team: {
                    ...leader.athlete.team,
                    flagUrl: `https://flagcdn.com/w80/${countryCode}.png`,
                    flagUrlLarge: `https://flagcdn.com/w160/${countryCode}.png`,
                    countryCode,
                  }
                }
              };
            }
            return leader;
          });
        }
        return category;
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching CAN 2025 top scorers:', error);

    // If ESPN API doesn't have leaders endpoint, return mock structure
    return NextResponse.json(
      {
        error: 'Top scorers data not yet available',
        message: 'Tournament has not started yet. Data will be available once matches begin.',
        categories: []
      },
      { status: 200 }
    );
  }
}

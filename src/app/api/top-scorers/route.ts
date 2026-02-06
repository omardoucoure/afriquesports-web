/**
 * GET /api/top-scorers
 *
 * Returns cached top African scorers data from MySQL.
 * Data is updated daily by the cron job.
 */

import { NextResponse } from 'next/server';
import { getTopScorers } from '@/lib/top-scorers-db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

    const scorers = await getTopScorers(limit);

    return NextResponse.json({
      success: true,
      count: scorers.length,
      scorers: scorers.map((s) => ({
        rank: s.rank_position,
        name: s.player_name,
        photo: s.player_photo,
        nationality: s.nationality,
        countryCode: s.country_code,
        position: s.position,
        team: s.team_name,
        teamLogo: s.team_logo,
        league: s.league_name,
        clubGoals: s.club_goals,
        clubAssists: s.club_assists,
        clubAppearances: s.club_appearances,
        ntGoals: s.nt_goals,
        ntAssists: s.nt_assists,
        totalGoals: s.total_goals,
        totalAssists: s.total_assists,
      })),
      lastUpdated: scorers[0]?.updated_at || null,
    });
  } catch (error: any) {
    console.error('[TopScorers API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top scorers' },
      { status: 500 }
    );
  }
}

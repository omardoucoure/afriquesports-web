/**
 * Daily Cron Endpoint: Top African Scorers Update
 *
 * Schedule: Once daily at 06:00 UTC
 * Trigger: External cron service (cron-job.org) or manual curl
 *
 * What it does:
 * 1. Fetches real stats for ~20 tracked African players from API-Football
 * 2. Combines club goals + national team goals from config
 * 3. Ranks by total goals descending
 * 4. Saves the rankings to MySQL for the widget to read
 *
 * curl -X POST https://afriquesports.net/api/cron/top-scorers-update \
 *   -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextResponse } from 'next/server';
import { TRACKED_PLAYERS, CURRENT_SEASON } from '@/config/ballon-dor-players';
import { fetchPlayerStats, delay } from '@/lib/api-football';
import { saveTopScorers, type TopScorerInput } from '@/lib/top-scorers-db';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes max

export async function POST(request: Request) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[TopScorers Cron] Starting daily update...');

    const results: TopScorerInput[] = [];
    const errors: string[] = [];

    // Fetch stats for each tracked player
    for (const player of TRACKED_PLAYERS) {
      try {
        console.log(`[TopScorers Cron] Fetching stats for ${player.name}...`);

        const playerData = await fetchPlayerStats(player.apiFootballId, CURRENT_SEASON);

        if (!playerData || !playerData.statistics || playerData.statistics.length === 0) {
          errors.push(`No stats for ${player.name} (ID: ${player.apiFootballId})`);
          continue;
        }

        // Sum goals/assists across all leagues (some players play in multiple competitions)
        let clubGoals = 0;
        let clubAssists = 0;
        let clubAppearances = 0;
        let primaryTeam = '';
        let primaryTeamLogo = '';
        let primaryLeague = '';

        for (const stat of playerData.statistics) {
          clubGoals += stat.goals.total ?? 0;
          clubAssists += stat.goals.assists ?? 0;
          clubAppearances += stat.games.appearences ?? 0;

          // Use the first stat line as the primary team/league
          if (!primaryTeam) {
            primaryTeam = stat.team.name;
            primaryTeamLogo = stat.team.logo;
            primaryLeague = stat.league.name;
          }
        }

        // National team goals from config (manual data)
        const ntGoals = player.ntGoals ?? 0;
        const ntAssists = player.ntAssists ?? 0;

        const totalGoals = clubGoals + ntGoals;
        const totalAssists = clubAssists + ntAssists;

        results.push({
          playerApiId: player.apiFootballId,
          playerName: playerData.player.name,
          playerPhoto: playerData.player.photo,
          nationality: player.nationality,
          countryCode: player.countryCode,
          position: player.position,
          teamName: primaryTeam,
          teamLogo: primaryTeamLogo,
          leagueName: primaryLeague,
          clubGoals,
          clubAssists,
          clubAppearances,
          ntGoals,
          ntAssists,
          totalGoals,
          totalAssists,
          rankPosition: 0, // will be set after sorting
          season: `${CURRENT_SEASON}-${CURRENT_SEASON + 1}`,
        });

        console.log(`[TopScorers Cron] ${player.name}: club=${clubGoals}G/${clubAssists}A + NT=${ntGoals}G/${ntAssists}A = ${totalGoals}G total`);

        // Rate limiting: 1.5s between requests
        await delay(1500);
      } catch (playerError: any) {
        errors.push(`Error for ${player.name}: ${playerError.message}`);
        console.error(`[TopScorers Cron] Error for ${player.name}:`, playerError);
      }
    }

    // Sort by total goals descending, then by total assists as tiebreaker
    results.sort((a, b) => {
      if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
      return b.totalAssists - a.totalAssists;
    });

    // Assign rank positions
    results.forEach((r, i) => {
      r.rankPosition = i + 1;
    });

    // Only save if we have enough data
    if (results.length < 5) {
      console.error(`[TopScorers Cron] Only ${results.length} players processed, need at least 5.`);
      return NextResponse.json({
        success: false,
        message: `Only ${results.length} players processed (need >= 5). Rankings not updated.`,
        errors,
      }, { status: 500 });
    }

    // Save to MySQL
    const saved = await saveTopScorers(results);

    if (!saved) {
      return NextResponse.json({
        success: false,
        message: 'Failed to save top scorers to MySQL',
        errors,
      }, { status: 500 });
    }

    // Log top 10
    const top10 = results.slice(0, 10);
    console.log('[TopScorers Cron] Top 10:');
    top10.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.playerName} (${p.countryCode}) - ${p.totalGoals}G ${p.totalAssists}A (club: ${p.clubGoals}G, NT: ${p.ntGoals}G)`);
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalPlayers: TRACKED_PLAYERS.length,
      processedPlayers: results.length,
      top10: top10.map((p, i) => ({
        rank: i + 1,
        name: p.playerName,
        country: p.countryCode,
        club: p.teamName,
        totalGoals: p.totalGoals,
        clubGoals: p.clubGoals,
        ntGoals: p.ntGoals,
        assists: p.totalAssists,
      })),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[TopScorers Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Top scorers update failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

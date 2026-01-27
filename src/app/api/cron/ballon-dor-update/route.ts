/**
 * Weekly Cron Endpoint: Ballon d'Or Ranking Update
 *
 * Schedule: Every Monday at 06:00 UTC
 * Trigger: External cron service (cron-job.org) or manual curl
 *
 * What it does:
 * 1. Fetches real stats for ~20 tracked African players from API-Football
 * 2. Fetches league standings for position data
 * 3. Computes Ballon d'Or scores using the CAF-mirrored algorithm
 * 4. Saves the top rankings to MySQL
 *
 * curl -X POST https://afriquesports.net/api/cron/ballon-dor-update \
 *   -H "Authorization: Bearer $CRON_SECRET"
 */

import { NextResponse } from 'next/server';
import { TRACKED_PLAYERS, CURRENT_SEASON } from '@/config/ballon-dor-players';
import {
  fetchPlayerStats,
  fetchLeagueStandings,
  getTeamLeaguePosition,
  getLeagueMatchdaysPlayed,
  clearStandingsCache,
  delay,
} from '@/lib/api-football';
import { computeScore, rankPlayers, type ScoredPlayer } from '@/lib/ballon-dor-scoring';
import { saveRankings } from '@/lib/ballon-dor-db';

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

    console.log('[BallonDor Cron] Starting weekly ranking update...');

    const scoredPlayers: ScoredPlayer[] = [];
    const errors: string[] = [];

    // Process each player
    for (const player of TRACKED_PLAYERS) {
      try {
        console.log(`[BallonDor Cron] Fetching stats for ${player.name}...`);

        // Fetch player stats from API-Football
        const playerData = await fetchPlayerStats(player.apiFootballId, CURRENT_SEASON);

        if (!playerData || !playerData.statistics || playerData.statistics.length === 0) {
          errors.push(`No stats for ${player.name} (ID: ${player.apiFootballId})`);
          continue;
        }

        // Use the first (primary league) stat line
        const stat = playerData.statistics[0];

        // Fetch league standings for this player's league
        const standings = await fetchLeagueStandings(player.leagueId, CURRENT_SEASON);

        // Get team's league position
        const leaguePosition = getTeamLeaguePosition(standings, stat.team.name);
        const matchdaysPlayed = getLeagueMatchdaysPlayed(standings);

        // Build raw stats object
        const rawStats = {
          goals: stat.goals.total ?? 0,
          assists: stat.goals.assists ?? 0,
          appearances: stat.games.appearences ?? 0,
          minutesPlayed: stat.games.minutes ?? 0,
          cleanSheets: stat.goals.conceded === 0
            ? (stat.games.lineups ?? 0) // approximate clean sheets for GK
            : 0,
          rating: parseFloat(stat.games.rating ?? '0') || 0,
          leaguePosition,
          leagueMatchdaysPlayed: matchdaysPlayed,
        };

        // For goalkeepers, calculate clean sheets differently
        // API-Football provides goals.conceded per season, not clean sheets directly
        // Clean sheets = appearances where conceded == 0 (approximation)
        if (player.position === 'Goalkeeper' && stat.goals.conceded !== null) {
          // Rough approximation: clean_sheets ~ appearances * (1 - conceded/appearances)
          // Better: check if saves data gives us a better estimate
          const conceded = stat.goals.conceded ?? 0;
          const apps = stat.games.appearences ?? 1;
          // Average conceded per game
          const avgConceded = conceded / Math.max(apps, 1);
          // Estimate: if avg < 1, they likely have some clean sheets
          rawStats.cleanSheets = Math.round(apps * Math.max(0, 1 - avgConceded));
        }

        // Compute the Ballon d'Or score
        const scored = computeScore(
          player,
          rawStats,
          playerData.player.photo,
          stat.team.logo,
          stat.league.name
        );

        scoredPlayers.push(scored);
        console.log(`[BallonDor Cron] ${player.name}: score=${scored.scores.total.toFixed(1)} (ind=${scored.scores.individual.toFixed(1)}, club=${scored.scores.clubSuccess.toFixed(1)}, nt=${scored.scores.nationalTeam.toFixed(1)}, cons=${scored.scores.consistency.toFixed(1)})`);

        // Rate limiting: 1.5s between requests
        await delay(1500);
      } catch (playerError: any) {
        errors.push(`Error for ${player.name}: ${playerError.message}`);
        console.error(`[BallonDor Cron] Error for ${player.name}:`, playerError);
      }
    }

    // Clear standings cache after all players processed
    clearStandingsCache();

    // Only save if we have enough data (at least 5 players)
    if (scoredPlayers.length < 5) {
      console.error(`[BallonDor Cron] Only ${scoredPlayers.length} players processed, need at least 5. NOT overwriting rankings.`);
      return NextResponse.json({
        success: false,
        message: `Only ${scoredPlayers.length} players processed (need >= 5). Rankings not updated.`,
        errors,
      }, { status: 500 });
    }

    // Rank and save
    const ranked = rankPlayers(scoredPlayers);

    const rankingsToSave = ranked.map((sp, index) => ({
      playerApiId: sp.player.apiFootballId,
      playerName: sp.player.name,
      playerPhoto: sp.photo,
      nationality: sp.player.nationality,
      countryCode: sp.player.countryCode,
      position: sp.player.position,
      teamName: sp.player.club,
      teamLogo: sp.teamLogo,
      leagueName: sp.leagueName,
      goals: sp.stats.goals,
      assists: sp.stats.assists,
      appearances: sp.stats.appearances,
      minutesPlayed: sp.stats.minutesPlayed,
      cleanSheets: sp.stats.cleanSheets,
      playerRating: sp.stats.rating,
      leaguePosition: sp.stats.leaguePosition,
      clStage: sp.player.clStage ?? null,
      ntGoals: sp.player.ntGoals ?? 0,
      ntAssists: sp.player.ntAssists ?? 0,
      ntAppearances: sp.player.ntAppearances ?? 0,
      totalScore: sp.scores.total,
      scoreIndividual: sp.scores.individual,
      scoreClubSuccess: sp.scores.clubSuccess,
      scoreNationalTeam: sp.scores.nationalTeam,
      scoreConsistency: sp.scores.consistency,
      rankPosition: index + 1,
      keyStatLabel: sp.keyStat.label,
      keyStatValue: sp.keyStat.value,
      season: '2024-2025',
    }));

    const saved = await saveRankings(rankingsToSave);

    if (!saved) {
      return NextResponse.json({
        success: false,
        message: 'Failed to save rankings to MySQL',
        errors,
      }, { status: 500 });
    }

    // Log top 5 results
    const top5 = ranked.slice(0, 5);
    console.log('[BallonDor Cron] Top 5:');
    top5.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.player.name} (${p.player.countryCode}) - ${p.scores.total.toFixed(1)} pts - ${p.keyStat.value} ${p.keyStat.label}`);
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalPlayers: TRACKED_PLAYERS.length,
      processedPlayers: scoredPlayers.length,
      savedRankings: rankingsToSave.length,
      top5: top5.map((p, i) => ({
        rank: i + 1,
        name: p.player.name,
        country: p.player.countryCode,
        club: p.player.club,
        score: p.scores.total,
        keyStat: `${p.keyStat.value} ${p.keyStat.label}`,
      })),
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[BallonDor Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Ballon d\'Or update failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

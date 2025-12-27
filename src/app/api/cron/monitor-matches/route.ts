import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getGoogleIndexingAPI } from '@/lib/google-indexing';
import { getAllMatchStates, upsertMatchState, type MatchState as MySQLMatchState } from '@/lib/mysql-match-db';

/**
 * Automatic Match Monitoring Cron Job
 *
 * Schedule: Every 1 minute during match days
 *
 * What it does:
 * 1. Fetches all CAN 2025 matches from ESPN API
 * 2. Compares with stored match states in MySQL
 * 3. Detects changes:
 *    - Status change (scheduled → live → completed)
 *    - Score updates
 * 4. Automatically triggers:
 *    - Google Indexing API notification
 *    - Page revalidation
 * 5. Updates stored states
 *
 * No manual intervention required!
 */

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute max (reduced from 300s to save costs)

interface MatchState {
  match_id: string;
  status: 'scheduled' | 'live' | 'completed';
  home_team?: string;
  away_team?: string;
  home_score: number;
  away_score: number;
  last_indexed_at?: Date | null;
  last_checked_at?: Date;
}

async function getStoredMatchStates(): Promise<Map<string, MatchState>> {
  const states = await getAllMatchStates();
  const statesMap = new Map<string, MatchState>();
  states.forEach(state => {
    statesMap.set(state.match_id, {
      match_id: state.match_id,
      status: state.status,
      home_team: state.home_team,
      away_team: state.away_team,
      home_score: state.home_score || 0,
      away_score: state.away_score || 0,
      last_indexed_at: state.last_indexed_at,
      last_checked_at: state.last_checked_at,
    });
  });
  return statesMap;
}

async function updateMatchState(matchId: string, state: Partial<MatchState>, shouldIndex: boolean = false) {
  await upsertMatchState({
    match_id: matchId,
    status: state.status || 'scheduled',
    home_team: state.home_team,
    away_team: state.away_team,
    home_score: state.home_score || 0,
    away_score: state.away_score || 0,
  }, shouldIndex);
}

function getMatchStatus(espnMatch: any): 'scheduled' | 'live' | 'completed' {
  const status = espnMatch.status?.type;
  if (status?.completed) return 'completed';
  if (status?.state === 'in') return 'live';
  return 'scheduled';
}

export async function GET(request: Request) {
  try {
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Starting automatic match monitoring...');

    // Fetch all CAN 2025 matches from ESPN
    const espnResponse = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      { cache: 'no-store' }
    );

    if (!espnResponse.ok) {
      throw new Error(`ESPN API error: ${espnResponse.status}`);
    }

    const espnData = await espnResponse.json();
    const matches = espnData.events || [];

    // Get stored match states
    const storedStates = await getStoredMatchStates();

    // Initialize tracking
    const changes = [];
    const indexingAPI = getGoogleIndexingAPI();
    let indexedCount = 0;
    let revalidatedCount = 0;

    // Check each match for changes
    for (const match of matches) {
      const matchId = match.id;
      const currentStatus = getMatchStatus(match);
      const competition = match.competitions?.[0];
      const homeScore = parseInt(competition?.competitors?.[0]?.score) || 0;
      const awayScore = parseInt(competition?.competitors?.[1]?.score) || 0;

      const storedState = storedStates.get(matchId);

      // Detect changes
      let hasChanged = false;
      let changeType = '';

      if (!storedState) {
        // New match detected
        hasChanged = true;
        changeType = 'new_match';
      } else {
        // Check for status change
        if (storedState.status !== currentStatus) {
          hasChanged = true;
          changeType = `status_change_${storedState.status}_to_${currentStatus}`;
        }
        // Check for score change (only for live/completed matches)
        else if (
          (currentStatus === 'live' || currentStatus === 'completed') &&
          (storedState.home_score !== homeScore || storedState.away_score !== awayScore)
        ) {
          hasChanged = true;
          changeType = 'score_update';
        }
      }

      // If changed, trigger automatic actions
      if (hasChanged) {
        console.log(`📢 Change detected for match ${matchId}: ${changeType}`);

        changes.push({
          matchId,
          changeType,
          oldStatus: storedState?.status || 'none',
          newStatus: currentStatus,
          oldScore: storedState ? `${storedState.home_score}-${storedState.away_score}` : 'none',
          newScore: `${homeScore}-${awayScore}`
        });

        // 1. Notify Google Indexing API (automatic!)
        const indexingSuccess = await indexingAPI.notifyMatchAllLocales(matchId);
        if (indexingSuccess) {
          indexedCount++;
          console.log(`✅ Google Indexing API notified for match ${matchId}`);
        }

        // 2. Revalidate match pages for all locales (automatic!)
        const locales = ['fr', 'en', 'es', 'ar'];
        for (const locale of locales) {
          try {
            revalidatePath(`/${locale}/can-2025/match/${matchId}`);
            revalidatedCount++;
          } catch (error) {
            console.error(`Error revalidating ${locale}:`, error);
          }
        }

        // 3. Update stored state (mark as indexed)
        await updateMatchState(matchId, {
          status: currentStatus,
          home_score: homeScore,
          away_score: awayScore,
        }, true); // shouldIndex = true

        // Rate limiting: pause between API calls
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // No change, just update last_checked_at
        await updateMatchState(matchId, {
          status: currentStatus,
          home_score: homeScore,
          away_score: awayScore
        });
      }
    }

    console.log(`✅ Monitoring complete: ${changes.length} changes detected`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalMatches: matches.length,
      changesDetected: changes.length,
      indexed: indexedCount,
      revalidated: revalidatedCount,
      changes: changes,
      message: changes.length > 0
        ? `Automatically indexed ${indexedCount} match updates!`
        : 'No changes detected, all matches up to date'
    });
  } catch (error: any) {
    console.error('❌ Match monitoring error:', error);
    return NextResponse.json(
      {
        error: 'Match monitoring failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

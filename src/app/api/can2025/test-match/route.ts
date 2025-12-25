import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Match Endpoint - Brazil vs France 2006 World Cup Quarter-Final
 *
 * This endpoint simulates a live CAN 2025 match to test the autonomous agent's ability to:
 * 1. Detect the match automatically
 * 2. Research match details from the web
 * 3. Generate 50+ French commentaries autonomously
 * 4. Save commentaries to Supabase
 *
 * The autonomous agent checks this endpoint every 60 seconds.
 * When it detects a "live" match, it will autonomously process it.
 *
 * Format: ESPN API compatible
 */

export async function GET(request: NextRequest) {
  const now = new Date();
  const matchStart = new Date(now.getTime() - 45 * 60 * 1000); // Started 45 minutes ago

  return NextResponse.json({
    events: [
      {
        id: 'test-brazil-france-2006',
        uid: 's:600~l:2030~e:test-brazil-france-2006',
        date: matchStart.toISOString(),
        name: 'Brazil vs France',
        shortName: 'BRA vs FRA',
        season: {
          year: 2006,
          displayName: '2006 FIFA World Cup'
        },
        competitions: [
          {
            id: 'test-brazil-france-2006',
            uid: 's:600~l:2030~e:test-brazil-france-2006~c:test-brazil-france-2006',
            date: matchStart.toISOString(),
            attendance: 48000,
            type: {
              id: '1',
              abbreviation: 'QF'
            },
            timeValid: true,
            neutralSite: true,
            conferenceCompetition: false,
            playByPlayAvailable: false,
            recent: false,
            venue: {
              id: '2624',
              fullName: 'Waldstadion',
              address: {
                city: 'Frankfurt',
                country: 'Germany'
              }
            },
            competitors: [
              {
                id: 'test-brazil',
                uid: 's:600~t:test-brazil',
                type: 'team',
                order: 0,
                homeAway: 'home',
                team: {
                  id: 'test-brazil',
                  uid: 's:600~t:test-brazil',
                  location: 'Brazil',
                  name: 'Brazil',
                  abbreviation: 'BRA',
                  displayName: 'Brazil',
                  shortDisplayName: 'Brazil',
                  color: '009c3b',
                  alternateColor: 'fede00',
                  isActive: true,
                  logos: [
                    {
                      href: 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
                      width: 500,
                      height: 500,
                      alt: '',
                      rel: ['full', 'default']
                    }
                  ]
                },
                score: '0',
                statistics: []
              },
              {
                id: 'test-france',
                uid: 's:600~t:test-france',
                type: 'team',
                order: 1,
                homeAway: 'away',
                team: {
                  id: 'test-france',
                  uid: 's:600~t:test-france',
                  location: 'France',
                  name: 'France',
                  abbreviation: 'FRA',
                  displayName: 'France',
                  shortDisplayName: 'France',
                  color: '0055a4',
                  alternateColor: 'ffffff',
                  isActive: true,
                  logos: [
                    {
                      href: 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png',
                      width: 500,
                      height: 500,
                      alt: '',
                      rel: ['full', 'default']
                    }
                  ]
                },
                score: '1',
                statistics: []
              }
            ],
            notes: [],
            status: {
              clock: 45 * 60, // 45 minutes played (in seconds)
              displayClock: "45'",
              period: 1,
              type: {
                id: '2',
                name: 'STATUS_IN_PROGRESS',
                state: 'in', // CRITICAL: This makes it "live"
                completed: false,
                description: 'In Progress',
                detail: "45'",
                shortDetail: "45'"
              }
            },
            broadcasts: [],
            format: {
              regulation: {
                periods: 2
              }
            },
            tickets: [],
            startDate: matchStart.toISOString(),
            geoBroadcasts: [],
            odds: []
          }
        ],
        links: [
          {
            language: 'en-US',
            rel: ['summary', 'desktop', 'event'],
            href: 'https://www.afriquesports.net/can-2025/test-brazil-france-2006',
            text: 'Match Summary',
            shortText: 'Summary',
            isExternal: false,
            isPremium: false
          }
        ],
        status: {
          clock: 45 * 60,
          displayClock: "45'",
          period: 1,
          type: {
            id: '2',
            name: 'STATUS_IN_PROGRESS',
            state: 'in',
            completed: false,
            description: 'In Progress',
            detail: "45'",
            shortDetail: "45'"
          }
        }
      }
    ],
    leagues: [
      {
        id: '2030',
        uid: 's:600~l:2030',
        name: 'FIFA World Cup',
        abbreviation: 'WC',
        slug: 'fifa.world',
        isTournament: true
      }
    ],
    season: {
      year: 2006,
      displayName: '2006 FIFA World Cup'
    }
  });
}

/**
 * POST endpoint to control match state
 * Use this to simulate match progression
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, minute, score } = body;

    // This can be enhanced to store match state in Redis/Memory
    // For now, just acknowledge the request

    return NextResponse.json({
      success: true,
      message: `Match state updated: ${action}`,
      data: {
        action,
        minute,
        score,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request', message: error.message },
      { status: 400 }
    );
  }
}

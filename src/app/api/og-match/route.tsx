import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Dynamic OG Image Generation for Match Pages
 * Generates 1200x630 images with team logos, scores, and live status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');
    const locale = searchParams.get('locale') || 'fr';

    if (!matchId) {
      return new Response('Match ID required', { status: 400 });
    }

    // Fetch match data from ESPN
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`
    );

    if (!response.ok) {
      return new Response('Match not found', { status: 404 });
    }

    const data = await response.json();

    // Validate data structure
    if (!data?.header?.competitions?.[0]) {
      return new Response('Invalid match data', { status: 500 });
    }

    const competition = data.header.competitions[0];
    const homeTeam = competition.competitors?.[0];
    const awayTeam = competition.competitors?.[1];

    if (!homeTeam || !awayTeam) {
      return new Response('Invalid competitor data', { status: 500 });
    }

    const status = data.header.status;
    const isLive = status?.type?.state === 'in';
    const homeScore = homeTeam.score || 0;
    const awayScore = awayTeam.score || 0;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F6F6F6',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative'
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '200px',
              background: 'linear-gradient(135deg, #345C00 0%, #9DFF20 100%)',
              opacity: 0.1
            }}
          />

          {/* Live Badge */}
          {isLive && (
            <div
              style={{
                position: 'absolute',
                top: 30,
                right: 40,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#EF4444',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '30px',
                fontSize: 20,
                fontWeight: 'bold',
                gap: '8px'
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'white',
                  borderRadius: '50%'
                }}
              />
              LIVE
            </div>
          )}

          {/* Tournament Title */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#345C00',
              marginBottom: 40
            }}
          >
            CAN 2025 - AFCON 2025
          </div>

          {/* Match Container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '90%',
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {/* Home Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1
              }}
            >
              <img
                src={homeTeam.team.logo}
                alt={homeTeam.team.displayName}
                width="120"
                height="120"
                style={{
                  marginBottom: '20px'
                }}
              />
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#303030',
                  textAlign: 'center'
                }}
              >
                {homeTeam.team.displayName}
              </div>
            </div>

            {/* Score */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0 60px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '30px'
                }}
              >
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 'bold',
                    color: '#303030'
                  }}
                >
                  {homeScore}
                </span>
                <span
                  style={{
                    fontSize: 64,
                    fontWeight: 'normal',
                    color: '#666666'
                  }}
                >
                  -
                </span>
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 'bold',
                    color: '#303030'
                  }}
                >
                  {awayScore}
                </span>
              </div>
              {isLive && status.displayClock && (
                <div
                  style={{
                    marginTop: '16px',
                    fontSize: 24,
                    color: '#345C00',
                    fontWeight: 'bold'
                  }}
                >
                  {status.displayClock}
                </div>
              )}
            </div>

            {/* Away Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1
              }}
            >
              <img
                src={awayTeam.team.logo}
                alt={awayTeam.team.displayName}
                width="120"
                height="120"
                style={{
                  marginBottom: '20px'
                }}
              />
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: '#303030',
                  textAlign: 'center'
                }}
              >
                {awayTeam.team.displayName}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#303030'
              }}
            >
              AFRIQUE SPORTS
            </div>
            <div
              style={{
                fontSize: 20,
                color: '#666666'
              }}
            >
              www.afriquesports.net
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}

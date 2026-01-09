import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Static CAN 2025 OG Image - No external API calls
 * Works reliably as a fallback for match pages
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const home = searchParams.get('home') || 'Team A';
  const away = searchParams.get('away') || 'Team B';
  const score = searchParams.get('score'); // format: "1-0"
  const live = searchParams.get('live') === 'true';
  const time = searchParams.get('time') || '';

  const [homeScore, awayScore] = score ? score.split('-') : ['0', '0'];

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
          background: 'linear-gradient(135deg, #04453f 0%, #065f57 50%, #087a6f 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative'
        }}
      >
        {/* CAN 2025 Badge */}
        <div
          style={{
            position: 'absolute',
            top: 30,
            left: 40,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#9DFF20'
            }}
          >
            🏆 CAN 2025
          </div>
        </div>

        {/* Live Badge */}
        {live && (
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
            LIVE {time && `• ${time}`}
          </div>
        )}

        {/* Match Container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '90%',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '50px 40px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            marginTop: 20
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
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#04453f',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <span style={{ fontSize: 48 }}>🦁</span>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#303030',
                textAlign: 'center'
              }}
            >
              {home}
            </div>
          </div>

          {/* Score */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              margin: '0 40px'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}
            >
              <span
                style={{
                  fontSize: 80,
                  fontWeight: 'bold',
                  color: '#303030'
                }}
              >
                {homeScore}
              </span>
              <span
                style={{
                  fontSize: 50,
                  fontWeight: 'normal',
                  color: '#666666'
                }}
              >
                -
              </span>
              <span
                style={{
                  fontSize: 80,
                  fontWeight: 'bold',
                  color: '#303030'
                }}
              >
                {awayScore}
              </span>
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: 18,
                color: '#04453f',
                fontWeight: 'bold'
              }}
            >
              {live ? 'EN DIRECT' : 'QUART DE FINALE'}
            </div>
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
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#04453f',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <span style={{ fontSize: 48 }}>🦅</span>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                color: '#303030',
                textAlign: 'center'
              }}
            >
              {away}
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
              color: '#9DFF20'
            }}
          >
            AFRIQUE SPORTS
          </div>
          <div
            style={{
              fontSize: 18,
              color: 'rgba(255,255,255,0.8)'
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
}

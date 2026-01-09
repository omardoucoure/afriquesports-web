import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Premium OG Image for Special Matches (Mali vs Senegal)
 * Features star players with dynamic score and live status
 */

// Star players data
const MATCH_PLAYERS: Record<string, { home: PlayerInfo[]; away: PlayerInfo[] }> = {
  '732177': {
    // Mali vs Senegal
    home: [
      { name: 'Amadou Haidara', position: 'Milieu', club: 'RB Leipzig', number: '8', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/220717.png&w=350&h=254' },
      { name: 'Yves Bissouma', position: 'Milieu', club: 'Tottenham', number: '6', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/213106.png&w=350&h=254' },
    ],
    away: [
      { name: 'Sadio Mané', position: 'Attaquant', club: 'Al-Nassr', number: '10', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/175949.png&w=350&h=254' },
      { name: 'Kalidou Koulibaly', position: 'Défenseur', club: 'Al-Hilal', number: '3', image: 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/167481.png&w=350&h=254' },
    ],
  },
};

interface PlayerInfo {
  name: string;
  position: string;
  club: string;
  number: string;
  image: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('id') || '732177';
  const home = searchParams.get('home') || 'Mali';
  const away = searchParams.get('away') || 'Senegal';
  const score = searchParams.get('score') || '0-0';
  const live = searchParams.get('live') === 'true';
  const time = searchParams.get('time') || '';
  const stage = searchParams.get('stage') || 'QUART DE FINALE';

  const [homeScore, awayScore] = score.split('-');
  const players = MATCH_PLAYERS[matchId] || MATCH_PLAYERS['732177'];

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0a2e0a 0%, #1a472a 30%, #0d3d0d 70%, #051505 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(157,255,32,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(157,255,32,0.08) 0%, transparent 50%)',
          }}
        />

        {/* Top Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 40px',
            borderBottom: '1px solid rgba(157,255,32,0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 'bold', color: '#9DFF20' }}>🏆</span>
            <span style={{ fontSize: 22, fontWeight: 'bold', color: '#9DFF20' }}>CAN 2025</span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginLeft: '8px' }}>{stage}</span>
          </div>

          {live && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#EF4444',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: 18,
                fontWeight: 'bold',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                }}
              />
              EN DIRECT {time && `• ${time}`}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            padding: '20px 40px',
            gap: '20px',
          }}
        >
          {/* Home Team Side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
            }}
          >
            {/* Team Name */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {home}
            </div>

            {/* Players */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
              }}
            >
              {players.home.map((player, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    width: '140px',
                  }}
                >
                  <img
                    src={player.image}
                    width="80"
                    height="80"
                    style={{
                      borderRadius: '50%',
                      border: '3px solid #9DFF20',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: 'white',
                      marginTop: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {player.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9DFF20',
                      marginTop: '2px',
                    }}
                  >
                    {player.club}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Center */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '200px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                padding: '20px 40px',
                borderRadius: '20px',
                border: '2px solid rgba(157,255,32,0.3)',
              }}
            >
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {homeScore}
              </span>
              <span
                style={{
                  fontSize: 40,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                -
              </span>
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {awayScore}
              </span>
            </div>
            <div
              style={{
                marginTop: '12px',
                fontSize: 16,
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 'bold',
              }}
            >
              VS
            </div>
          </div>

          {/* Away Team Side */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: 1,
            }}
          >
            {/* Team Name */}
            <div
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {away}
            </div>

            {/* Players */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
              }}
            >
              {players.away.map((player, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    width: '140px',
                  }}
                >
                  <img
                    src={player.image}
                    width="80"
                    height="80"
                    style={{
                      borderRadius: '50%',
                      border: '3px solid #9DFF20',
                      objectFit: 'cover',
                    }}
                  />
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 'bold',
                      color: 'white',
                      marginTop: '8px',
                      textAlign: 'center',
                    }}
                  >
                    {player.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9DFF20',
                      marginTop: '2px',
                    }}
                  >
                    {player.club}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 40px',
            borderTop: '1px solid rgba(157,255,32,0.2)',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 'bold', color: '#9DFF20' }}>AFRIQUE SPORTS</span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            www.afriquesports.net
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

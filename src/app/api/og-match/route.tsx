import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Legacy OG Image endpoint - generates simple image without ESPN API
 * Kept for backwards compatibility with cached URLs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('id');

  if (!matchId) {
    return new Response('Match ID required', { status: 400 });
  }

  // Generate a simple CAN 2025 OG image without external API calls
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
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 'bold', color: '#9DFF20', marginBottom: 20 }}>
          🏆 CAN 2025
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '40px 60px',
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 'bold', color: '#303030' }}>0</span>
          <span style={{ fontSize: 48, color: '#666666', margin: '0 30px' }}>-</span>
          <span style={{ fontSize: 72, fontWeight: 'bold', color: '#303030' }}>0</span>
        </div>
        <div style={{ fontSize: 24, color: '#9DFF20', marginTop: 30, fontWeight: 'bold' }}>
          AFRIQUE SPORTS
        </div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', marginTop: 10 }}>
          www.afriquesports.net
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

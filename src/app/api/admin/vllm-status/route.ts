import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token-' + Date.now();
const VLLM_ENDPOINT = 'http://194.68.245.75:22165/v1';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.substring(7);
  return token === ADMIN_TOKEN;
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if vLLM is running by querying the models endpoint
    const response = await fetch(`${VLLM_ENDPOINT}/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const model = data.data?.[0]?.id || 'Unknown';

      return NextResponse.json({
        running: true,
        endpoint: VLLM_ENDPOINT,
        model
      });
    }

    return NextResponse.json({
      running: false,
      endpoint: VLLM_ENDPOINT
    });
  } catch (error: any) {
    return NextResponse.json({
      running: false,
      endpoint: VLLM_ENDPOINT,
      error: error.message
    });
  }
}

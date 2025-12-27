import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token-' + Date.now();
const VLLM_ENDPOINT = process.env.VLLM_ENDPOINT || 'https://qbjo7w9adplhia-8000.proxy.runpod.net/v1';
const VLLM_API_KEY = process.env.VLLM_API_KEY || 'sk-1234';

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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VLLM_API_KEY}`
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

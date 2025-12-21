import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CAN 2025 AI Agent Webhook
 *
 * This endpoint receives notifications from the AI agent when new content is published:
 * - Live match commentary
 * - Instant match reports
 * - Match predictions
 * - Trending players updates
 *
 * It triggers ISR revalidation to update the /can-2025 page and related pages.
 *
 * Usage:
 * POST /api/can2025/webhook
 * Headers:
 *   x-webhook-secret: your-secret-key
 * Body: {
 *   type: "commentary" | "report" | "prediction" | "trending_players",
 *   match_id: "401638475",
 *   locale: "fr",
 *   action: "publish" | "update"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[CAN 2025 Webhook] AI_AGENT_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedSecret) {
      console.error('[CAN 2025 Webhook] Unauthorized webhook attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, match_id, locale, action } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400 }
      );
    }

    const revalidatedPaths: string[] = [];

    // Always revalidate main CAN 2025 page
    const can2025Path = '/can-2025';
    revalidatePath(can2025Path);
    revalidatedPaths.push(can2025Path);

    // Revalidate all locale versions
    revalidatePath(`/fr${can2025Path}`);
    revalidatePath(`/en${can2025Path}`);
    revalidatePath(`/es${can2025Path}`);
    revalidatePath(`/ar${can2025Path}`);
    revalidatedPaths.push(
      `/fr${can2025Path}`,
      `/en${can2025Path}`,
      `/es${can2025Path}`,
      `/ar${can2025Path}`
    );

    // Type-specific revalidation
    switch (type) {
      case 'commentary':
        // Live commentary update - revalidate match page if it exists
        if (match_id) {
          const matchPath = `/can-2025/matches/${match_id}`;
          revalidatePath(matchPath);
          revalidatedPaths.push(matchPath);

          // Revalidate locale versions
          revalidatePath(`/fr${matchPath}`);
          revalidatePath(`/en${matchPath}`);
          revalidatePath(`/es${matchPath}`);
          revalidatePath(`/ar${matchPath}`);
          revalidatedPaths.push(
            `/fr${matchPath}`,
            `/en${matchPath}`,
            `/es${matchPath}`,
            `/ar${matchPath}`
          );
        }
        break;

      case 'report':
        // Match report published - revalidate match page and homepage
        if (match_id) {
          const matchPath = `/can-2025/matches/${match_id}`;
          revalidatePath(matchPath);
          revalidatedPaths.push(matchPath);

          // Revalidate locale versions
          revalidatePath(`/fr${matchPath}`);
          revalidatePath(`/en${matchPath}`);
          revalidatePath(`/es${matchPath}`);
          revalidatePath(`/ar${matchPath}`);
          revalidatedPaths.push(
            `/fr${matchPath}`,
            `/en${matchPath}`,
            `/es${matchPath}`,
            `/ar${matchPath}`
          );
        }

        // Revalidate homepage (latest reports section)
        revalidatePath('/');
        revalidatePath('/fr');
        revalidatePath('/en');
        revalidatePath('/es');
        revalidatedPaths.push('/', '/fr', '/en', '/es');
        break;

      case 'prediction':
        // Match prediction published - revalidate match page
        if (match_id) {
          const matchPath = `/can-2025/matches/${match_id}`;
          const predictionPath = `/can-2025/predictions/${match_id}`;

          revalidatePath(matchPath);
          revalidatePath(predictionPath);
          revalidatedPaths.push(matchPath, predictionPath);

          // Revalidate locale versions
          [matchPath, predictionPath].forEach((path) => {
            revalidatePath(`/fr${path}`);
            revalidatePath(`/en${path}`);
            revalidatePath(`/es${path}`);
            revalidatePath(`/ar${path}`);
            revalidatedPaths.push(
              `/fr${path}`,
              `/en${path}`,
              `/es${path}`,
              `/ar${path}`
            );
          });
        }
        break;

      case 'trending_players':
        // Trending players updated - revalidate CAN 2025 page and homepage
        revalidatePath('/');
        revalidatePath('/fr');
        revalidatePath('/en');
        revalidatePath('/es');
        revalidatedPaths.push('/', '/fr', '/en', '/es');
        break;

      default:
        console.warn('[CAN 2025 Webhook] Unknown type:', type);
    }

    console.log('[CAN 2025 Webhook] ✅ Revalidated paths:', {
      type,
      match_id,
      locale,
      action,
      paths: revalidatedPaths
    });

    return NextResponse.json({
      success: true,
      revalidated: true,
      type,
      paths: revalidatedPaths,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[CAN 2025 Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'CAN 2025 webhook endpoint is active. Use POST with proper credentials.',
    usage: {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'your-webhook-secret'
      },
      body: {
        type: 'commentary | report | prediction | trending_players',
        match_id: '401638475',
        locale: 'fr',
        action: 'publish | update'
      }
    }
  });
}

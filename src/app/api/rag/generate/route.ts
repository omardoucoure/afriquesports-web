/**
 * RAG Content Generation API
 *
 * POST /api/rag/generate
 * Generates content using RAG pipeline
 *
 * Authentication: Bearer token (ADMIN_TOKEN env var)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ContentGenerator } from '@/lib/rag/generator';
import { GenerationRequest } from '@/lib/rag/types';

// Disable static optimization - this is a dynamic API route
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const authHeader = request.headers.get('Authorization');
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      console.error('[RAG Generate] ADMIN_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      console.warn('[RAG Generate] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: GenerationRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 3. Validate request
    const validation = validateGenerationRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('[RAG Generate] Received request:', {
      contentType: body.contentType,
      locale: body.locale,
      params: Object.keys(body.params),
    });

    // 4. Generate content
    const generator = new ContentGenerator();
    const result = await generator.generate(body);

    // 5. Return result
    if (result.success) {
      console.log('[RAG Generate] ✓ Generation successful:', {
        contentLength: result.content?.length || 0,
        duration: result.metadata?.durationMs,
      });

      return NextResponse.json(result);
    } else {
      console.error('[RAG Generate] ✗ Generation failed:', result.error);

      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('[RAG Generate] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Validate generation request
 */
function validateGenerationRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  // Check required fields
  if (!body.contentType) {
    return { valid: false, error: 'contentType is required' };
  }

  if (!body.locale) {
    return { valid: false, error: 'locale is required' };
  }

  if (!body.params) {
    return { valid: false, error: 'params is required' };
  }

  // Validate content type
  const validContentTypes = ['match-preview', 'match-report', 'news-article', 'player-profile', 'ranking'];
  if (!validContentTypes.includes(body.contentType)) {
    return {
      valid: false,
      error: `contentType must be one of: ${validContentTypes.join(', ')}`,
    };
  }

  // Validate locale
  const validLocales = ['fr', 'en', 'es', 'ar'];
  if (!validLocales.includes(body.locale)) {
    return {
      valid: false,
      error: `locale must be one of: ${validLocales.join(', ')}`,
    };
  }

  // Validate params based on content type
  switch (body.contentType) {
    case 'match-preview':
      if (!body.params.homeTeam || !body.params.awayTeam) {
        return {
          valid: false,
          error: 'match-preview requires homeTeam and awayTeam params',
        };
      }
      if (!body.params.competition) {
        return {
          valid: false,
          error: 'match-preview requires competition param',
        };
      }
      if (!body.params.matchDate) {
        return {
          valid: false,
          error: 'match-preview requires matchDate param',
        };
      }
      break;

    case 'match-report':
      if (!body.params.homeTeam || !body.params.awayTeam) {
        return {
          valid: false,
          error: 'match-report requires homeTeam and awayTeam params',
        };
      }
      if (!body.params.score) {
        return {
          valid: false,
          error: 'match-report requires score param',
        };
      }
      if (!body.params.competition) {
        return {
          valid: false,
          error: 'match-report requires competition param',
        };
      }
      break;

    case 'news-article':
      if (!body.params.topic) {
        return {
          valid: false,
          error: 'news-article requires topic param',
        };
      }
      break;

    case 'player-profile':
      if (!body.params.playerName) {
        return {
          valid: false,
          error: 'player-profile requires playerName param',
        };
      }
      if (!body.params.team) {
        return {
          valid: false,
          error: 'player-profile requires team param',
        };
      }
      break;

    case 'ranking':
      if (!body.params.topic) {
        return {
          valid: false,
          error: 'ranking requires topic param',
        };
      }
      if (!body.params.criteria) {
        return {
          valid: false,
          error: 'ranking requires criteria param',
        };
      }
      break;
  }

  return { valid: true };
}

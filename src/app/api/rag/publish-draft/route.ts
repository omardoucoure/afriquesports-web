/**
 * WordPress Draft Publishing API
 *
 * POST /api/rag/publish-draft
 * Publishes generated content as a WordPress draft
 *
 * Authentication: Bearer token (ADMIN_TOKEN env var)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  WordPressDraftRequest,
  WordPressDraftResponse,
  Locale,
  ContentType,
} from '@/lib/rag/types';

// Disable static optimization - this is a dynamic API route
export const dynamic = 'force-dynamic';

// WordPress API base URLs
const WORDPRESS_API_BASES: Record<Locale, string> = {
  fr: 'https://cms.realdemadrid.com/afriquesports',
  en: 'https://cms.realdemadrid.com/afriquesports-en',
  es: 'https://cms.realdemadrid.com/afriquesports-es',
  ar: 'https://cms.realdemadrid.com/afriquesports-ar',
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const authHeader = request.headers.get('Authorization');
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      console.error('[RAG Publish] ADMIN_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      console.warn('[RAG Publish] Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Check WordPress credentials
    const wpUsername = process.env.WP_COMMENT_USERNAME;
    const wpPassword = process.env.WP_COMMENT_APP_PASSWORD;

    if (!wpUsername || !wpPassword) {
      console.error('[RAG Publish] WordPress credentials not configured');
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    // 3. Parse request body
    let body: WordPressDraftRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 4. Validate request
    const validation = validatePublishRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    console.log('[RAG Publish] Publishing draft:', {
      title: body.title,
      locale: body.locale,
      contentLength: body.content.length,
    });

    // 5. Get WordPress API URL
    const baseUrl = WORDPRESS_API_BASES[body.locale];
    const apiUrl = `${baseUrl}/wp-json/wp/v2/posts`;

    // 6. Prepare WordPress post data
    const wpAuth = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');

    const postData: any = {
      title: body.title,
      content: body.content,
      status: 'draft', // ALWAYS DRAFT - manual review required
      categories: body.categories || [],
      tags: body.tags || [],
    };

    // Add custom metadata if provided
    if (body.metadata) {
      postData.meta = {
        _rag_generated: true,
        _rag_content_type: body.metadata.contentType,
        _rag_model: body.metadata.model || 'qwen2.5:14b',
        _rag_generated_at: body.metadata.generatedAt || new Date().toISOString(),
      };
    }

    // 7. Create WordPress draft
    const wpResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${wpAuth}`,
      },
      body: JSON.stringify(postData),
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('[RAG Publish] WordPress API error:', {
        status: wpResponse.status,
        statusText: wpResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: `WordPress API error: ${wpResponse.status} ${wpResponse.statusText}`,
        },
        { status: wpResponse.status }
      );
    }

    const post = await wpResponse.json();

    console.log('[RAG Publish] ✓ Draft created:', {
      postId: post.id,
      link: post.link,
    });

    // 8. Return success response
    const result: WordPressDraftResponse = {
      success: true,
      postId: post.id,
      editLink: post.link.replace('/preview=true', '').replace(baseUrl, `${baseUrl}/wp-admin/post.php?post=${post.id}&action=edit`),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[RAG Publish] Unexpected error:', error);

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
 * Validate publish request
 */
function validatePublishRequest(body: any): {
  valid: boolean;
  error?: string;
} {
  if (!body.title || typeof body.title !== 'string') {
    return { valid: false, error: 'title is required and must be a string' };
  }

  if (!body.content || typeof body.content !== 'string') {
    return { valid: false, error: 'content is required and must be a string' };
  }

  if (!body.locale) {
    return { valid: false, error: 'locale is required' };
  }

  const validLocales: Locale[] = ['fr', 'en', 'es', 'ar'];
  if (!validLocales.includes(body.locale)) {
    return {
      valid: false,
      error: `locale must be one of: ${validLocales.join(', ')}`,
    };
  }

  if (body.categories && !Array.isArray(body.categories)) {
    return { valid: false, error: 'categories must be an array' };
  }

  if (body.tags && !Array.isArray(body.tags)) {
    return { valid: false, error: 'tags must be an array' };
  }

  return { valid: true };
}

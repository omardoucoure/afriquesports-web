import { NextRequest, NextResponse } from "next/server"

// WordPress authentication credentials
// Create these in WordPress: Users -> Your Profile -> Application Passwords
const WP_USERNAME = process.env.WP_COMMENT_USERNAME || "admin"
const WP_APP_PASSWORD = process.env.WP_COMMENT_APP_PASSWORD || ""

// Get base URL based on locale
function getWordPressBaseUrl(locale: string = 'fr') {
  const baseUrls: Record<string, string> = {
    fr: 'https://cms.realdemadrid.com/afriquesports',
    en: 'https://cms.realdemadrid.com/afriquesports/en',
    es: 'https://cms.realdemadrid.com/afriquesports/es',
  }
  return baseUrls[locale] || baseUrls.fr
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, authorName, authorEmail, authorPhotoUrl, content, parent, locale = 'fr' } = body

    // Validate required fields
    if (!articleId || !authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const baseUrl = getWordPressBaseUrl(locale)

    // Create Basic Auth header
    const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')

    // Post comment to WordPress with authentication
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        post: parseInt(articleId),
        author_name: authorName,
        author_email: authorEmail,
        author_url: authorPhotoUrl || '', // Store Google photo URL in author_url field
        content: content,
        status: 'approved', // Auto-approve authenticated users
        ...(parent && { parent: parseInt(parent) })
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress comment creation failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to create comment', details: errorText },
        { status: response.status }
      )
    }

    const comment = await response.json()
    return NextResponse.json(comment)

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')
    const locale = searchParams.get('locale') || 'fr'

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      )
    }

    const baseUrl = getWordPressBaseUrl(locale)

    // Create Basic Auth header
    const auth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64')

    // Delete comment from WordPress
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${auth}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('WordPress comment deletion failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to delete comment', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Fetch comments for an article
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('post')

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Always use French base URL for comments - all posts are stored in main site
    // The /en/ and /es/ paths often return HTML instead of JSON
    const baseUrl = 'https://cms.realdemadrid.com/afriquesports'
    // Add cache buster to prevent WordPress caching
    const cacheBuster = `_=${Date.now()}`
    const wpUrl = `${baseUrl}/wp-json/wp/v2/comments?post=${articleId}&per_page=100&order=desc&orderby=date&${cacheBuster}`

    console.log('[Comments API] Fetching from:', wpUrl)

    // Fetch comments from WordPress (no auth needed for reading)
    const response = await fetch(wpUrl, {
      cache: 'no-store', // Disable Next.js cache to get fresh comments
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Afrique Sports Website/1.0',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    })

    console.log('[Comments API] WordPress response status:', response.status)

    // Check content-type to ensure we're getting JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      console.error(`[Comments API] Unexpected content-type: ${contentType}, returning empty comments`)
      return NextResponse.json([])
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Comments API] WordPress comment fetch failed: \n${errorText}`)

      // Handle specific WordPress errors gracefully
      try {
        const errorJson = JSON.parse(errorText)
        // If post is not readable (private, draft, or password protected), return empty comments
        if (errorJson.code === 'rest_cannot_read_post' || errorJson.code === 'rest_post_invalid_id') {
          console.log(`[Comments API] Post ${articleId} is not publicly accessible, returning empty comments`)
          return NextResponse.json([])
        }
      } catch {
        // Not JSON error, continue with original error handling
      }

      return NextResponse.json(
        { error: 'Failed to fetch comments', details: errorText },
        { status: response.status }
      )
    }

    const comments = await response.json()
    console.log('[Comments API] Comments received:', comments.length)
    return NextResponse.json(comments)

  } catch (error) {
    console.error('[Comments API] Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

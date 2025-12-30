import { NextResponse } from 'next/server';

/**
 * Video Sitemap
 * Lists all videos for better Google video search indexing
 *
 * Based on Google's video sitemap specification:
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps
 */

export const runtime = 'edge';
export const revalidate = 86400; // Revalidate daily (videos don't change as often)

const SITE_URL = 'https://www.afriquesports.net';
const POSTS_PER_PAGE = 1000;
const WORDPRESS_API_URL = process.env.WORDPRESS_API_URL || 'https://cms.realdemadrid.com/afriquesports/wp-json/wp/v2';

interface VideoPost {
  id: number;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
  categories: number[];
  acf?: {
    video_url?: string;
    youtube_video_id?: string;
  };
  featured_media_url?: string;
}

function extractVideoUrl(content: string): string | null {
  // Extract YouTube embed
  const youtubeMatch = content.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Extract self-hosted MP4
  const mp4Match = content.match(/(https?:\/\/[^\s"]+\.mp4)/);
  if (mp4Match) {
    return mp4Match[1];
  }

  return null;
}

function getVideoType(videoUrl: string): string {
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    return 'youtube';
  }
  return 'self_hosted';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export async function GET() {
  try {
    // Fetch recent posts with videos (last 1000 posts should cover most video content)
    const response = await fetch(
      `${WORDPRESS_API_URL}/posts?per_page=${POSTS_PER_PAGE}&_embed&orderby=modified&order=desc`,
      {
        headers: {
          'User-Agent': 'afriquesports-sitemap/1.0',
        },
        next: { revalidate: 86400 }, // Cache for 24 hours
      }
    );

    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`);
    }

    const posts: VideoPost[] = await response.json();

    // Filter posts that have videos
    const videoPosts: Array<{
      url: string;
      title: string;
      description: string;
      videoUrl: string;
      thumbnailUrl: string;
      uploadDate: string;
      videoType: string;
    }> = [];

    for (const post of posts) {
      // Check ACF fields first
      let videoUrl = post.acf?.video_url || null;

      if (!videoUrl && post.acf?.youtube_video_id) {
        videoUrl = `https://www.youtube.com/embed/${post.acf.youtube_video_id}`;
      }

      // If no ACF video, try to extract from content
      if (!videoUrl) {
        // We'd need the content here, but it's not in the initial fetch
        // For now, we'll rely on ACF fields
        // In a future optimization, we could fetch full post content
        continue;
      }

      if (videoUrl) {
        videoPosts.push({
          url: post.link,
          title: stripHtml(post.title.rendered),
          description: stripHtml(post.excerpt.rendered || ''),
          videoUrl: videoUrl,
          thumbnailUrl: post.featured_media_url || '',
          uploadDate: post.date,
          videoType: getVideoType(videoUrl),
        });
      }
    }

    // Build video sitemap XML
    const videoEntries = videoPosts
      .map((video) => {
        return `  <url>
    <loc>${escapeXml(video.url)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl || SITE_URL + '/opengraph-image.png')}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description || video.title)}</video:description>
      ${video.videoType === 'youtube' ? `<video:player_loc>${escapeXml(video.videoUrl)}</video:player_loc>` : `<video:content_loc>${escapeXml(video.videoUrl)}</video:content_loc>`}
      <video:publication_date>${new Date(video.uploadDate).toISOString()}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:requires_subscription>no</video:requires_subscription>
    </video:video>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videoEntries}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=172800',
        'CDN-Cache-Control': 'public, max-age=86400',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('[video-sitemap] Error generating sitemap:', error);

    // Return empty sitemap on error (better than 500)
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
</urlset>`;

    return new NextResponse(emptyXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  }
}

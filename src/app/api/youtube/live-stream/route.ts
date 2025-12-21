import { NextResponse } from 'next/server';

const AFRIQUESPORTS_CHANNEL_ID = 'UCxXuJlzCPbxp-JKOiGNVvmQ'; // Replace with actual channel ID
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET() {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('YouTube API key not configured');
      return NextResponse.json({
        isLive: false,
        message: 'YouTube API not configured'
      });
    }

    // Search for live videos from the Afrique Sports channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${AFRIQUESPORTS_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(searchUrl, {
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }

    const data = await response.json();

    // Check if there's a live stream
    if (data.items && data.items.length > 0) {
      const liveVideo = data.items[0];

      return NextResponse.json({
        isLive: true,
        videoId: liveVideo.id.videoId,
        title: liveVideo.snippet.title,
        thumbnail: liveVideo.snippet.thumbnails.medium.url,
        channelUrl: `https://www.youtube.com/@afriquesports/streams`
      });
    }

    // No live stream found
    return NextResponse.json({
      isLive: false,
      message: 'No live stream currently active',
      channelUrl: `https://www.youtube.com/@afriquesports/streams`
    });

  } catch (error) {
    console.error('Error fetching YouTube live stream:', error);

    // Return a fallback response
    return NextResponse.json({
      isLive: false,
      error: 'Failed to check live stream status',
      channelUrl: `https://www.youtube.com/@afriquesports/streams`
    });
  }
}

"use client";

import React, { useState, useEffect } from 'react';

interface YouTubeLiveStreamProps {
  channelId?: string;
  channelUrl?: string;
}

export function YouTubeLiveStream({ channelId, channelUrl = "https://www.youtube.com/@afriquesports/streams" }: YouTubeLiveStreamProps) {
  const [isLive, setIsLive] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  // For production, you would fetch the live stream ID from YouTube API
  // For now, we'll show the channel's live page
  useEffect(() => {
    // TODO: Implement YouTube Data API v3 to check for live streams
    // Example: GET https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=YOUR_CHANNEL_ID&eventType=live&type=video&key=YOUR_API_KEY

    // For now, we'll embed the channel's streams page
    setIsLive(true);
  }, [channelId]);

  if (!isLive) {
    return (
      <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Aucun direct en cours</h3>
          <p className="text-gray-400 text-sm">Le stream démarrera avant le match</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
      <div className="aspect-video relative">
        <iframe
          src={`https://www.youtube.com/embed/live_stream?channel=UCYourChannelID&autoplay=1&mute=0`}
          title="Afrique Sports Live Stream"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Stream info bar */}
      <div className="bg-gray-900 px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-white text-sm font-semibold">EN DIRECT</span>
        </div>
        <div className="flex-1"></div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Ouvrir sur YouTube →
        </a>
      </div>
    </div>
  );
}

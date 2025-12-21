"use client";

import React, { useState, useEffect } from 'react';

interface YouTubeLiveStreamProps {
  channelId?: string;
  channelUrl?: string;
}

interface LiveStreamData {
  isLive: boolean;
  videoId?: string;
  title?: string;
  thumbnail?: string;
  channelUrl?: string;
  message?: string;
}

export function YouTubeLiveStream({ channelId, channelUrl = "https://www.youtube.com/@afriquesports/streams" }: YouTubeLiveStreamProps) {
  const [isLive, setIsLive] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streamTitle, setStreamTitle] = useState<string>('');

  useEffect(() => {
    async function checkLiveStream() {
      try {
        const response = await fetch('/api/youtube/live-stream');
        const data: LiveStreamData = await response.json();

        setIsLive(data.isLive);
        setVideoId(data.videoId || null);
        setStreamTitle(data.title || '');
      } catch (error) {
        console.error('Failed to check live stream:', error);
        setIsLive(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkLiveStream();

    // Refresh every 60 seconds to detect new live streams
    const interval = setInterval(checkLiveStream, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm">Recherche du stream en direct...</p>
        </div>
      </div>
    );
  }

  // Show no stream message
  if (!isLive || !videoId) {
    return (
      <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
            </svg>
          </div>
          <h3 className="text-white font-semibold mb-2">Aucun direct en cours</h3>
          <p className="text-gray-400 text-sm mb-4">Le stream démarrera avant le match</p>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Voir la chaîne YouTube →
          </a>
        </div>
      </div>
    );
  }

  // Show live stream
  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
      <div className="aspect-video relative">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
          title={streamTitle || "Afrique Sports Live Stream"}
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
        {streamTitle && (
          <span className="text-gray-300 text-sm flex-1 truncate">{streamTitle}</span>
        )}
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white text-sm transition-colors flex-shrink-0"
        >
          Ouvrir sur YouTube →
        </a>
      </div>
    </div>
  );
}

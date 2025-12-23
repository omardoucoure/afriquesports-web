'use client';

import { useTranslations } from 'next-intl';

interface VideoTabProps {
  matchData: any;
}

export function VideoTab({ matchData }: VideoTabProps) {
  const t = useTranslations('can2025.match');

  const videos = matchData.videos || [];
  const highlights = matchData.highlights || [];

  const hasVideos = videos.length > 0 || highlights.length > 0;

  if (!hasVideos) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎥</div>
        <p className="text-gray-500 text-sm">{t('noVideosAvailable')}</p>
        <p className="text-gray-400 text-xs mt-1">{t('videosAvailableAfterMatch')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            {t('highlights')}
          </h4>
          {highlights.map((highlight: any, index: number) => (
            <div
              key={index}
              className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group cursor-pointer"
            >
              <img
                src={highlight.thumbnail || '/images/video-placeholder.jpg'}
                alt={highlight.headline || t('matchHighlight')}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-primary-dark ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs font-medium line-clamp-2">
                  {highlight.headline || t('matchHighlight')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Additional Videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            {t('videos')}
          </h4>
          {videos.map((video: any, index: number) => (
            <div
              key={index}
              className="flex gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="relative w-20 h-14 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                <img
                  src={video.thumbnail || '/images/video-placeholder.jpg'}
                  alt={video.headline}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-dark ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 text-xs line-clamp-2 mb-0.5">
                  {video.headline}
                </h5>
                {video.description && (
                  <p className="text-xs text-gray-600 line-clamp-1">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

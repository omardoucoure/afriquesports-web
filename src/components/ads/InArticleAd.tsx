'use client';

import { useEffect } from 'react';

interface InArticleAdProps {
  adSlot: string;
  position?: 'top' | 'middle' | 'bottom';
}

export default function InArticleAd({ adSlot, position = 'middle' }: InArticleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`my-6 sm:my-8 ${position === 'top' ? 'mb-8' : position === 'bottom' ? 'mt-8' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
        <div className="text-xs text-gray-500 text-center mb-2 sm:mb-3 uppercase tracking-wide">Publicité</div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client="ca-pub-4765538302983367"
          data-ad-slot={adSlot}
        ></ins>
      </div>
    </div>
  );
}

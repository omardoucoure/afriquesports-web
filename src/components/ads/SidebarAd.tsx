'use client';

import { useEffect } from 'react';

interface SidebarAdProps {
  adSlot: string;
  sticky?: boolean;
}

export default function SidebarAd({ adSlot, sticky = false }: SidebarAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <div className={`hidden lg:block ${sticky ? 'sticky top-20' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
        <div className="text-xs text-gray-500 text-center mb-3 uppercase tracking-wide">Publicité</div>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minWidth: '250px', minHeight: '600px' }}
          data-ad-client="ca-pub-4765538302983367"
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
}

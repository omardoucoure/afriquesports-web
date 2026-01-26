'use client';

/**
 * InArticleAd component - DISABLED
 * Ads are now managed by Journey/Grow via ScriptWrapper
 */

interface InArticleAdProps {
  adSlot: string;
  position?: 'top' | 'middle' | 'bottom';
}

export default function InArticleAd({ adSlot, position = 'middle' }: InArticleAdProps) {
  // AdSense disabled - Journey/Grow manages ads
  return null;
}

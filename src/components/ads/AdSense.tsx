'use client';

/**
 * AdSense component - DISABLED
 * Ads are now managed by Journey/Grow via ScriptWrapper
 */

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = {},
}: AdSenseProps) {
  // AdSense disabled - Journey/Grow manages ads
  return null;
}

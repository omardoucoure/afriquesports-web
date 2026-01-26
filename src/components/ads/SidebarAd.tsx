'use client';

/**
 * SidebarAd component - DISABLED
 * Ads are now managed by Journey/Grow via ScriptWrapper
 */

interface SidebarAdProps {
  adSlot: string;
  sticky?: boolean;
}

export default function SidebarAd({ adSlot, sticky = false }: SidebarAdProps) {
  // AdSense disabled - Journey/Grow manages ads
  return null;
}

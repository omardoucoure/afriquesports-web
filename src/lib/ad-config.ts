/**
 * Google AdSense Configuration - Afrique Sports
 *
 * Ad units configured from existing AdSense account:
 * - Article Top: "Grosse baniere" (Display)
 * - Article Middle: "In article AS Sports" (In-article)
 * - Article Bottom: "Le long" (Display)
 * - Sidebar: "Afrique Sports Long" (Display)
 *
 * Updated: December 25, 2024
 */

export const ADSENSE_CONFIG = {
  // Your AdSense publisher ID
  CLIENT_ID: 'ca-pub-4765538302983367',

  // Ad slot IDs - Using existing Afrique Sports ad units
  AD_SLOTS: {
    // Top in-article ad - Highest RPM position (above content)
    // AdSense Unit: "Grosse baniere" (Display)
    ARTICLE_TOP: '5662618775',

    // Middle in-article ad - Good RPM position (middle of content)
    // AdSense Unit: "In article AS Sports" (In-article format - optimized for content)
    ARTICLE_MIDDLE: '1161079715',

    // Bottom in-article ad - Standard RPM position (end of content)
    // AdSense Unit: "Le long" (Display)
    ARTICLE_BOTTOM: '7473300649',

    // Sidebar ad - Desktop only, high-value position
    // AdSense Unit: "Afrique Sports Long" (Display)
    SIDEBAR_STICKY: '6118232665',
  },

  // Enable Auto ads for additional revenue (10-15% increase)
  AUTO_ADS_ENABLED: true,

  // Enable anchor ads (sticky bottom mobile ad)
  ANCHOR_ADS_ENABLED: true,

  // Enable vignette ads (full-page interstitial on mobile)
  VIGNETTE_ADS_ENABLED: true,
} as const;

export type AdSlotPosition = keyof typeof ADSENSE_CONFIG.AD_SLOTS;

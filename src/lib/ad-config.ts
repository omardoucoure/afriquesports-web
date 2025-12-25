/**
 * Google AdSense Configuration
 *
 * IMPORTANT: Update these slot IDs in your AdSense dashboard
 *
 * How to create ad units:
 * 1. Go to https://www.google.com/adsense
 * 2. Click "Ads" → "By ad unit" → "Display ads"
 * 3. Create 4 separate ad units with these names:
 *    - Article Top In-Content (Responsive)
 *    - Article Middle In-Content (In-article format)
 *    - Article Bottom In-Content (In-article format)
 *    - Sidebar Sticky Desktop (300x600 or responsive)
 * 4. Copy each ad unit's data-ad-slot value
 * 5. Replace the placeholder IDs below with your actual slot IDs
 */

export const ADSENSE_CONFIG = {
  // Your AdSense publisher ID
  CLIENT_ID: 'ca-pub-4765538302983367',

  // Ad slot IDs - REPLACE THESE with your actual slot IDs from AdSense
  AD_SLOTS: {
    // Top in-article ad - Highest RPM position (above content)
    ARTICLE_TOP: '2345678901',  // REPLACE: Create "Article Top In-Content" ad unit

    // Middle in-article ad - Good RPM position (middle of content)
    ARTICLE_MIDDLE: '3456789012',  // REPLACE: Create "Article Middle In-Content" ad unit

    // Bottom in-article ad - Standard RPM position (end of content)
    ARTICLE_BOTTOM: '4567890123',  // REPLACE: Create "Article Bottom In-Content" ad unit

    // Sidebar ad - Desktop only, high-value position
    SIDEBAR_STICKY: '5678901234',  // REPLACE: Create "Sidebar Sticky Desktop" ad unit
  },

  // Enable Auto ads for additional revenue (10-15% increase)
  AUTO_ADS_ENABLED: true,

  // Enable anchor ads (sticky bottom mobile ad)
  ANCHOR_ADS_ENABLED: true,

  // Enable vignette ads (full-page interstitial on mobile)
  VIGNETTE_ADS_ENABLED: true,
} as const;

export type AdSlotPosition = keyof typeof ADSENSE_CONFIG.AD_SLOTS;

/**
 * Crawler Detection Utilities
 *
 * Detects if the request is from a search engine crawler
 * Used to show/hide images for SEO vs performance optimization
 */

/**
 * Check if user agent is a crawler/bot
 */
export function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;

  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /rogerbot/i, // Moz
    /linkedinbot/i,
    /embedly/i,
    /quora link preview/i,
    /showyoubot/i,
    /outbrain/i,
    /pinterest\/0\./i,
    /developers\.google\.com\/\+\/web\/snippet/i,
    /slackbot/i,
    /vkshare/i,
    /w3c_validator/i,
    /redditbot/i,
    /applebot/i,
    /whatsapp/i,
    /flipboard/i,
    /tumblr/i,
    /bitlybot/i,
    /skypeuripreview/i,
    /nuzzel/i,
    /discordbot/i,
    /google page speed/i,
    /lighthouse/i,
  ];

  return crawlerPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Server-side crawler detection from headers
 */
export function isCrawlerRequest(headers: Headers): boolean {
  const userAgent = headers.get('user-agent') || '';
  return isCrawler(userAgent);
}

/**
 * Client-side crawler detection
 */
export function isCrawlerClient(): boolean {
  if (typeof window === 'undefined') return false;
  return isCrawler(navigator.userAgent);
}

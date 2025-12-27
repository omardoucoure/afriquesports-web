/**
 * Utility functions for match URL generation and parsing
 * Converts URLs from /match/732152 to /match/senegal-vs-congo-dr-732152
 */

/**
 * Slugify team name for URL-safe format
 * Example: "Senegal" → "senegal", "Congo DR" → "congo-dr"
 */
export function slugifyTeamName(teamName: string): string {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate match URL slug from team names and match ID
 * Example: generateMatchSlug("Senegal", "Congo DR", "732152") → "senegal-vs-congo-dr-732152"
 */
export function generateMatchSlug(homeTeam: string, awayTeam: string, matchId: string | number): string {
  const homeSlug = slugifyTeamName(homeTeam);
  const awaySlug = slugifyTeamName(awayTeam);
  return `${homeSlug}-vs-${awaySlug}-${matchId}`;
}

/**
 * Extract match ID from slug
 * Example: "senegal-vs-congo-dr-732152" → "732152"
 */
export function extractMatchIdFromSlug(slug: string): string {
  // Match ID is always the last segment after the final hyphen
  // Handle both old format (just ID) and new format (team-vs-team-ID)

  // If slug is just a number, return it (backward compatibility)
  if (/^\d+$/.test(slug)) {
    return slug;
  }

  // Extract the last segment (should be the match ID)
  const segments = slug.split('-');
  const lastSegment = segments[segments.length - 1];

  // Verify it's a valid match ID (numeric)
  if (/^\d+$/.test(lastSegment)) {
    return lastSegment;
  }

  // Fallback: return the original slug (shouldn't happen with valid URLs)
  return slug;
}

/**
 * Generate full match URL path
 * Example: "/can-2025/match/senegal-vs-congo-dr-732152"
 */
export function generateMatchPath(homeTeam: string, awayTeam: string, matchId: string | number, locale?: string): string {
  const slug = generateMatchSlug(homeTeam, awayTeam, matchId);
  const basePath = `/can-2025/match/${slug}`;

  // Add locale prefix if not French (French is at root)
  if (locale && locale !== 'fr') {
    return `/${locale}${basePath}`;
  }

  return basePath;
}

/**
 * Generate full match URL (with domain)
 */
export function generateMatchUrl(homeTeam: string, awayTeam: string, matchId: string | number, locale: string = 'fr'): string {
  const SITE_URL = 'https://www.afriquesports.net';
  const path = generateMatchPath(homeTeam, awayTeam, matchId, locale);
  return `${SITE_URL}${path}`;
}

/**
 * Check if slug is old format (just numeric ID)
 */
export function isOldFormatSlug(slug: string): boolean {
  return /^\d+$/.test(slug);
}

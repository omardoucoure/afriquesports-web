/**
 * Server-side instrumentation for Next.js
 * Client-side PostHog tracking is handled by PostHogProvider component
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

/**
 * This function is called when the server starts
 * PostHog client tracking is handled in PostHogProvider.tsx
 */
export function register() {
  // Server-side instrumentation can be added here if needed
  // Client-side PostHog is initialized in PostHogProvider component
}

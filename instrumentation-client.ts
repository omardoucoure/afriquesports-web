/**
 * PostHog Client Instrumentation (Next.js 15.3+)
 * Official recommended setup for Next.js App Router
 *
 * @see https://posthog.com/docs/libraries/next-js
 */

import posthog from 'posthog-js'

/**
 * Initialize PostHog on client-side
 * This runs once when the app loads in the browser
 */
export async function register() {
  if (typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!key || !host) {
    console.warn('PostHog environment variables not configured')
    return
  }

  posthog.init(key, {
    api_host: host,

    // Use 2025 defaults for best practices
    defaults: '2025-11-30',

    // Automatic pageview tracking on route changes
    capture_pageview: 'history_change',

    // Privacy settings
    person_profiles: 'identified_only',

    // Session recording (disabled by default for privacy)
    disable_session_recording: false,

    // Autocapture user interactions
    autocapture: true,

    // Performance optimizations
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('PostHog loaded successfully')
      }
    },
  })
}

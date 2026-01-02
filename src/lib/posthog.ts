import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window !== 'undefined') {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (!key || !host) {
      console.warn('PostHog environment variables not configured')
      return
    }

    posthog.init(key, {
      api_host: host,
      person_profiles: 'identified_only',
      // Respect user privacy and GDPR compliance
      capture_pageview: false, // We'll manually capture pageviews
      capture_pageleave: true,
      // Disable session recording by default for privacy
      disable_session_recording: false,
      // Enable autocapture for better insights
      autocapture: true,
      // Advanced privacy settings
      mask_all_text: false,
      mask_all_element_attributes: false,
      // Completely disable feature flags to prevent 401 errors
      advanced_disable_feature_flags: true,
      advanced_disable_feature_flags_on_first_load: true,
      advanced_disable_decide: true,
      // Disable surveys and other features that require /decide endpoint
      disable_surveys: true,
      // Performance optimizations
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PostHog loaded successfully')
        }
      },
      // Don't call /decide endpoint at all
      bootstrap: {
        distinctID: undefined,
        isIdentifiedID: false,
        featureFlags: {},
      },
    })
  }
}

export { posthog }

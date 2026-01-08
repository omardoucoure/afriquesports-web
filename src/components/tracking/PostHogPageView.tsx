'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * PostHogPageView - Tracks SPA navigation pageviews
 *
 * Initial pageview is handled by PostHog's capture_pageview:true in layout.tsx
 * This component tracks subsequent client-side navigation (SPA transitions)
 */
export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip first render - initial pageview handled by PostHog automatically
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Track SPA navigation pageviews
    if (typeof window !== 'undefined' && window.posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      window.posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return null
}

// Note: Window.posthog type is declared in article-analytics-tracker.tsx

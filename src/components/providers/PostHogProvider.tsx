'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * PostHogProvider - Tracks SPA navigation pageviews
 *
 * Note: PostHog is initialized via inline script in layout.tsx with capture_pageview:true
 * This component only handles client-side navigation (SPA transitions)
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track pageview on client-side navigation (SPA)
    // Initial pageview is handled by PostHog's capture_pageview:true
    if (!pathname) return

    // Skip first render (initial pageview handled by PostHog automatically)
    const isInitialLoad = !window.__posthog_initial_tracked
    if (isInitialLoad) {
      window.__posthog_initial_tracked = true
      return
    }

    // Track SPA navigation
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

  return <>{children}</>
}

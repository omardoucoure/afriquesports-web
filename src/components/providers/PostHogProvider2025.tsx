/**
 * PostHog Provider (2025 Pattern)
 * Official recommended setup for Next.js 16+ App Router
 *
 * This is a simplified version that works with instrumentation-client.ts
 *
 * @see https://posthog.com/docs/libraries/next-js
 */

'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track pageviews on route changes
    // Note: With capture_pageview: 'history_change', this is automatic
    // But we keep this for custom properties like UTM parameters
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      // Custom pageview tracking with additional properties
      posthog.capture('$pageview', {
        $current_url: url,
        // Add custom properties if needed
        // locale: pathname.split('/')[1],
      })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}

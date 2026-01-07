'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track pageview when route changes
    if (typeof window !== 'undefined') {
      // PostHog snippet creates a queue, so we can call capture immediately
      // even if the library hasn't loaded yet
      const trackPageview = () => {
        if (window.posthog) {
          let url = window.origin + pathname
          if (searchParams && searchParams.toString()) {
            url = url + `?${searchParams.toString()}`
          }

          window.posthog.capture('$pageview', {
            $current_url: url,
          })
        }
      }

      // If PostHog is already loaded, track immediately
      if ((window.posthog as any)?.__loaded) {
        trackPageview()
      } else {
        // Otherwise, wait for it to load
        const checkLoaded = setInterval(() => {
          if ((window.posthog as any)?.__loaded) {
            clearInterval(checkLoaded)
            trackPageview()
          }
        }, 100)

        // Clear interval after 10 seconds to prevent memory leak
        setTimeout(() => clearInterval(checkLoaded), 10000)
      }
    }
  }, [pathname, searchParams])

  return null
}

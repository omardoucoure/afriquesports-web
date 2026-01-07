'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    console.log('[PostHogProvider] useEffect called - setting up deferred init');
    // Defer PostHog initialization until user interaction or 3 seconds
    // This improves INP by reducing initial JavaScript execution
    let hasInitialized = false

    const initializePostHog = () => {
      console.log('[PostHogProvider] initializePostHog triggered, hasInitialized:', hasInitialized);
      if (hasInitialized) return
      hasInitialized = true

      initPostHog()
      setIsLoaded(true)
      console.log('[PostHogProvider] PostHog initialization complete, isLoaded set to true');
    }

    // Initialize after 3 seconds
    const timeout = setTimeout(initializePostHog, 3000)

    // Or initialize on first user interaction (whichever comes first)
    const events = ['scroll', 'mousemove', 'touchstart', 'click']
    const onInteraction = () => {
      clearTimeout(timeout)
      initializePostHog()
      events.forEach(event =>
        document.removeEventListener(event, onInteraction)
      )
    }

    events.forEach(event =>
      document.addEventListener(event, onInteraction, { once: true, passive: true })
    )

    return () => {
      clearTimeout(timeout)
      events.forEach(event =>
        document.removeEventListener(event, onInteraction)
      )
    }
  }, [])

  useEffect(() => {
    // Track pageviews only after PostHog is loaded
    if (!isLoaded || !pathname) return

    let url = window.origin + pathname
    if (searchParams && searchParams.toString()) {
      url = url + `?${searchParams.toString()}`
    }

    posthog.capture('$pageview', {
      $current_url: url,
    })
  }, [pathname, searchParams, isLoaded])

  return <>{children}</>
}

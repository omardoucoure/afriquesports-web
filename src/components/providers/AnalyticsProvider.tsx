/**
 * Analytics Provider Component
 *
 * Initializes the analytics manager and registers all providers
 * Enables automatic tracking (scroll, session, engagement)
 */

'use client'

import { useEffect, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { getAnalyticsManager } from '@/lib/analytics'
import { PostHogProvider } from '@/lib/analytics/providers/posthog-provider'
import { GoogleAnalyticsProvider } from '@/lib/analytics/providers/google-analytics-provider'
import { VercelAnalyticsProvider } from '@/lib/analytics/providers/vercel-provider'
import { ConsentManager } from '@/lib/analytics/utils/consent'

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const locale = useLocale()

  useEffect(() => {
    // Get analytics manager instance
    const manager = getAnalyticsManager()

    // Initialize manager
    manager.init({ locale, autoEnrichment: true })

    // Register all providers
    manager.registerProvider('posthog', new PostHogProvider())
    manager.registerProvider('ga4', new GoogleAnalyticsProvider())
    manager.registerProvider('vercel', new VercelAnalyticsProvider())

    // Set initial consent
    const hasConsent = ConsentManager.hasConsent()
    manager.setConsent(hasConsent)

    // Listen for consent changes
    const unsubscribe = ConsentManager.onChange((status) => {
      manager.setConsent(status === 'accepted')
    })

    // Log initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AnalyticsProvider] Initialized', {
        locale,
        providers: manager.getProviders(),
        consent: hasConsent,
      })
    }

    // Cleanup
    return () => {
      unsubscribe()
    }
  }, [locale])

  return <>{children}</>
}

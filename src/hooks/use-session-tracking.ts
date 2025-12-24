/**
 * Hook for automatic session duration tracking
 */

'use client'

import { useEffect, useRef } from 'react'
import { getAnalyticsManager } from '@/lib/analytics'
import { SessionTracker } from '@/lib/analytics/trackers/session-tracker'

export function useSessionTracking() {
  const trackerRef = useRef<SessionTracker | null>(null)

  useEffect(() => {
    const manager = getAnalyticsManager()
    const tracker = new SessionTracker(manager)

    trackerRef.current = tracker
    tracker.start()

    return () => {
      tracker.stop()
    }
  }, [])

  return {
    tracker: trackerRef.current,
    getActiveTime: () => trackerRef.current?.getActiveTime() || 0,
  }
}

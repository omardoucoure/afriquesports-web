/**
 * Hook for automatic scroll depth tracking
 */

'use client'

import { useEffect, useRef } from 'react'
import { getAnalyticsManager } from '@/lib/analytics'
import { ScrollTracker } from '@/lib/analytics/trackers/scroll-tracker'

export function useScrollTracking() {
  const trackerRef = useRef<ScrollTracker | null>(null)

  useEffect(() => {
    const manager = getAnalyticsManager()
    const tracker = new ScrollTracker(manager)

    trackerRef.current = tracker
    tracker.start()

    return () => {
      tracker.stop()
    }
  }, [])

  return {
    tracker: trackerRef.current,
    getTrackedMilestones: () => trackerRef.current?.getTrackedMilestones() || [],
  }
}

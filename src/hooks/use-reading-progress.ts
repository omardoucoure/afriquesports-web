/**
 * Hook for automatic reading progress tracking on article pages
 */

'use client'

import { useEffect, useRef, RefObject } from 'react'
import { getAnalyticsManager } from '@/lib/analytics'
import { ReadingTracker } from '@/lib/analytics/trackers/reading-tracker'
import type { ReadingTrackerConfig } from '@/lib/analytics/trackers/reading-tracker'

export function useReadingProgress(
  contentRef: RefObject<HTMLElement>,
  config: Omit<ReadingTrackerConfig, 'contentElement'>
) {
  const trackerRef = useRef<ReadingTracker | null>(null)

  useEffect(() => {
    if (!contentRef.current) return

    const manager = getAnalyticsManager()
    const tracker = new ReadingTracker(manager, {
      ...config,
      contentElement: contentRef.current,
    })

    trackerRef.current = tracker
    tracker.start()

    return () => {
      tracker.stop()
    }
  }, [config.articleId, config.articleTitle, contentRef])

  return {
    tracker: trackerRef.current,
    getTimeSpent: () => trackerRef.current?.getTimeSpent() || 0,
    getTrackedMilestones: () => trackerRef.current?.getTrackedMilestones() || [],
  }
}

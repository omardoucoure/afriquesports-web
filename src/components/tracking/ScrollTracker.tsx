/**
 * Scroll Tracker Component
 *
 * Client component that automatically tracks scroll depth
 */

'use client'

import { useScrollTracking } from '@/hooks/use-scroll-tracking'

export function ScrollTracker() {
  useScrollTracking()

  // This component doesn't render anything
  return null
}

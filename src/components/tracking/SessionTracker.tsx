/**
 * Session Tracker Component
 *
 * Client component that automatically tracks session duration
 */

'use client'

import { useSessionTracking } from '@/hooks/use-session-tracking'

export function SessionTracker() {
  useSessionTracking()

  // This component doesn't render anything
  return null
}

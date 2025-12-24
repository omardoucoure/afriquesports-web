/**
 * Reading Progress Tracker Component
 *
 * Client component for tracking reading progress on article pages
 */

'use client'

import { useRef, ReactNode } from 'react'
import { useReadingProgress } from '@/hooks/use-reading-progress'

interface ReadingProgressTrackerProps {
  articleId: string
  articleTitle: string
  articleCategory?: string
  children: ReactNode
}

export function ReadingProgressTracker({
  articleId,
  articleTitle,
  articleCategory,
  children,
}: ReadingProgressTrackerProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useReadingProgress(contentRef as React.RefObject<HTMLElement>, {
    articleId,
    articleTitle,
    articleCategory,
  })

  return <div ref={contentRef}>{children}</div>
}

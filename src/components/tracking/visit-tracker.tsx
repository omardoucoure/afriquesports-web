"use client";

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

interface VisitTrackerProps {
  postId: string;
  postSlug: string;
  postTitle: string;
  postImage?: string;
  postAuthor?: string;
  postCategory?: string;
  postSource?: string;
}

/**
 * Visit tracker with async batching
 *
 * Uses fire-and-forget approach with keepalive to ensure the
 * request completes even if the user navigates away.
 *
 * The backend queues visits and processes them in batches,
 * reducing database load by 60-100x.
 */
export function VisitTracker({
  postId,
  postSlug,
  postTitle,
  postImage,
  postAuthor,
  postCategory,
  postSource = 'afriquesports',
}: VisitTrackerProps) {
  const locale = useLocale();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Fire-and-forget with keepalive
    // keepalive: true ensures request completes even if user navigates away
    // We don't await the response - it's truly async
    fetch('/api/visits/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId,
        postSlug,
        postTitle,
        postImage,
        postAuthor,
        postCategory,
        postSource,
        postLocale: locale,
      }),
      keepalive: true, // Ensures request completes even if page unloads
    }).catch(() => {
      // Silently ignore errors - tracking is non-critical
      // No console.error to avoid noise in production
    });
  }, [postId, postSlug, postTitle, postImage, postAuthor, postCategory, postSource, locale]);

  return null;
}

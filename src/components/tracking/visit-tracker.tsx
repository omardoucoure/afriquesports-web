"use client";

import { useEffect, useRef } from 'react';

interface VisitTrackerProps {
  postId: string;
  postSlug: string;
  postTitle: string;
  postImage?: string;
  postAuthor?: string;
  postCategory?: string;
  postSource?: string;
}

export function VisitTracker({
  postId,
  postSlug,
  postTitle,
  postImage,
  postAuthor,
  postCategory,
  postSource = 'afriquesports',
}: VisitTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    const recordVisit = async () => {
      try {
        await fetch('/api/visits/record', {
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
          }),
        });
      } catch (error) {
        // Silently fail - don't break the page if tracking fails
        console.error('Failed to record visit:', error);
      }
    };

    recordVisit();
  }, [postId, postSlug, postTitle, postImage, postAuthor, postCategory, postSource]);

  return null;
}

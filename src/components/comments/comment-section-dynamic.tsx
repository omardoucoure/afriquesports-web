"use client";

import dynamic from "next/dynamic";

// Code splitting: Lazy load CommentSection to reduce initial bundle
// CommentSection includes auth, form validation, and heavy UI components
// Most users don't scroll to comments immediately, so we can defer loading
// This saves ~40-50KB from initial bundle
export const CommentSection = dynamic(
  () => import("./comment-section").then(mod => ({ default: mod.CommentSection })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 animate-pulse rounded" />
          <div className="h-20 bg-gray-100 animate-pulse rounded" />
          <div className="h-20 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    ),
  }
);

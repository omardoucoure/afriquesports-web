"use client";

import dynamic from "next/dynamic";

// Code splitting: Lazy load ShareButtons to reduce initial bundle
// ShareButtons includes social media SDKs and analytics tracking
// Loading it dynamically saves ~20-30KB from initial bundle
export const ShareButtons = dynamic(
  () => import("./share-buttons").then(mod => ({ default: mod.ShareButtons })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-full" />
      </div>
    ),
  }
);

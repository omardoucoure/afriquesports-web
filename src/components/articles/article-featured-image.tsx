/**
 * Article Featured Image - Client Component
 *
 * Optimized for Google Discover eligibility while maintaining good LCP
 * - Desktop: Priority loading (eager)
 * - Mobile: Lazy loading (still visible for Discover)
 */

'use client';

import Image from "next/image";
import { useIsDesktop } from "@/hooks/use-media-query";

interface ArticleFeaturedImageProps {
  imageUrl: string;
  title: string;
  priority?: boolean;
}

export function ArticleFeaturedImage({
  imageUrl,
  title,
  priority = true,
}: ArticleFeaturedImageProps) {
  const isDesktop = useIsDesktop();

  // Conditional loading: priority on desktop, lazy on mobile
  // This enables Google Discover while maintaining good LCP (~3s vs 2.5s - acceptable trade-off)
  return (
    <div className="relative w-full aspect-[16/9] mb-6 rounded-lg sm:rounded-xl overflow-hidden">
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 1200px"
        className="object-cover"
        priority={priority && isDesktop} // Only priority on desktop
        loading={isDesktop ? "eager" : "lazy"} // Lazy load on mobile
      />
    </div>
  );
}

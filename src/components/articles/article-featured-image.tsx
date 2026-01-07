/**
 * Article Featured Image - Client Component
 *
 * Optimized for Google Discover eligibility while maintaining good LCP
 * - Desktop: Priority loading (eager)
 * - Mobile: Lazy loading (still visible for Discover)
 * - CDN error handling: Shows placeholder on image load failures
 */

'use client';

import { useIsDesktop } from "@/hooks/use-media-query";
import { ImageWithFallback } from "@/components/ui";

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
    <div className="relative w-full mb-6 rounded-lg sm:rounded-xl overflow-hidden">
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        width={1200}
        height={800}
        sizes="(max-width: 768px) 100vw, 1200px"
        className="w-full h-auto"
        quality={90} // High quality for featured image
        priority={priority && isDesktop} // Only priority on desktop
        loading={isDesktop ? "eager" : "lazy"} // Lazy load on mobile
        showPlaceholderOnError={true}
      />
    </div>
  );
}

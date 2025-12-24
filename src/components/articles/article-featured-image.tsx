/**
 * Article Featured Image - Client Component
 *
 * Conditionally renders featured image only on desktop
 * Prevents image from loading on mobile for better LCP
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

  // Don't render image on mobile - huge LCP improvement
  if (!isDesktop) {
    return null;
  }

  return (
    <div className="relative w-full aspect-[16/9] mb-6 rounded-lg sm:rounded-xl overflow-hidden">
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 800px"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}

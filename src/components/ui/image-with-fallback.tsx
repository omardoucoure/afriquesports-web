/**
 * ImageWithFallback - Next.js Image with error handling
 *
 * Handles CDN failures gracefully by:
 * - Catching 404/403 errors from image CDNs
 * - Showing a placeholder on error
 * - Retrying once before giving up
 *
 * Usage: Drop-in replacement for next/image with automatic fallback
 */

'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';

// Default placeholder SVG (inline to avoid another network request)
const DEFAULT_PLACEHOLDER = '/images/placeholder.svg';

// Placeholder component for failed images
function ImagePlaceholder({
  width,
  height,
  className,
  alt,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
  alt?: string;
}) {
  return (
    <div
      className={`bg-gray-200 flex items-center justify-center ${className || ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      role="img"
      aria-label={alt || 'Image placeholder'}
    >
      <svg
        className="w-12 h-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
  );
}

interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  showPlaceholderOnError?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_PLACEHOLDER,
  showPlaceholderOnError = true,
  className,
  width,
  height,
  fill,
  ...props
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleError = useCallback(() => {
    // Try fallback image first
    if (retryCount === 0 && fallbackSrc && imgSrc !== fallbackSrc) {
      setRetryCount(1);
      setImgSrc(fallbackSrc);
      return;
    }

    // If fallback also fails, show placeholder
    setHasError(true);
    console.warn(`[ImageWithFallback] Failed to load image: ${src}`);
  }, [src, fallbackSrc, imgSrc, retryCount]);

  // Show placeholder if image failed to load
  if (hasError && showPlaceholderOnError) {
    // For fill mode, render placeholder differently
    if (fill) {
      return (
        <div className={`absolute inset-0 ${className || ''}`}>
          <ImagePlaceholder
            width="100%"
            height="100%"
            className="w-full h-full"
            alt={alt}
          />
        </div>
      );
    }

    return (
      <ImagePlaceholder
        width={width}
        height={height}
        className={className}
        alt={alt}
      />
    );
  }

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      className={className}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      onError={handleError}
    />
  );
}

export default ImageWithFallback;

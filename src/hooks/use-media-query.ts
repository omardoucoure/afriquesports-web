/**
 * Media Query Hook for Responsive Conditional Rendering
 *
 * Prevents images from loading on mobile by not rendering them in DOM
 * Better for LCP performance than CSS hiding
 */

'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  // Return false during SSR to avoid hydration mismatch
  // This means mobile-first: no images until client-side JS confirms desktop
  return mounted ? matches : false;
}

/**
 * Hook to check if viewport is desktop (>= 768px)
 * Used to conditionally render images only on desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}

/**
 * Hook to check if viewport is mobile (< 768px)
 */
export function useIsMobile(): boolean {
  const isDesktop = useIsDesktop();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? !isDesktop : true; // Assume mobile during SSR
}

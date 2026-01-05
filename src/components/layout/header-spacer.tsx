"use client";

import { usePathname } from "next/navigation";

/**
 * Header Spacer Component
 *
 * Provides consistent spacing below the fixed header + next-match bar
 * to prevent content overlap across all pages.
 *
 * Height breakdown:
 * - Header: ~70px (desktop) / ~60px (mobile)
 * - Next Match Bar: ~70px (desktop) / ~90px (mobile, two rows)
 * - Total: ~140px (desktop) / ~150px (mobile)
 */
export function HeaderSpacer() {
  const pathname = usePathname();

  // Hide spacer on match pages where layout is different
  const isMatchPage = pathname.includes('/match/') ||
                      pathname.includes('/match-en-direct') ||
                      pathname.includes('/live-match') ||
                      pathname.includes('/partido-en-vivo');

  if (isMatchPage) {
    return null;
  }

  return (
    <div
      className="h-[150px] md:h-[140px]"
      aria-hidden="true"
    />
  );
}

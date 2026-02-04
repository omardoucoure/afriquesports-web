/**
 * Actirise Provider Component
 *
 * Initializes Actirise SDK with page-specific variables
 * Handles page type tracking and custom variables for better ad targeting
 *
 * Page types:
 * - home: Homepage
 * - article: Article detail pages (ALL articles including CAN 2025, etc.)
 * - category: Category listing pages
 * - static: Static pages (contact, privacy, etc.)
 *
 * Custom variables:
 * - custom1: Category slug (e.g., "afrique", "mercato", "europe", "can-2025")
 * - custom2: Locale (fr, en, es)
 * - custom3: Tags (comma-separated)
 * - custom4: Author name
 * - custom5: Special section (e.g., "can-2025", "youtube", "tv")
 */

'use client'

import { useEffect, useLayoutEffect, ReactNode, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface ActiriseProviderProps {
  children: ReactNode
  locale: string
  pageType?: 'home' | 'article' | 'category' | 'static'
  category?: string
  tags?: string[]
  author?: string
  specialSection?: string
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    _hbdbrk: Array<[string, any]>
  }
}

/**
 * Auto-detect page type from pathname
 * All article pages (including CAN 2025, etc.) return 'article' as page_type
 * Category context is passed via custom variables (custom1 for category, custom5 for special section)
 */
function detectPageType(pathname: string): 'home' | 'article' | 'category' | 'static' {
  // Remove locale prefix (e.g., /en/, /es/)
  const path = pathname.replace(/^\/(en|es|fr|ar)\//, '/')

  // Homepage
  if (path === '/' || path === '') {
    return 'home'
  }

  // Static pages
  if (path.match(/^\/(contact|confidentialite|privacy|live|stories)/)) {
    return 'static'
  }

  // Category pages: /category/* or single-segment paths (e.g., /afrique, /can-2025, /europe)
  if (path.startsWith('/category/') || path.match(/^\/[^/]+\/?$/)) {
    return 'category'
  }

  // Article pages: two-segment paths (e.g., /afrique/article-slug, /can-2025/article-slug)
  // All articles use 'article' as page_type regardless of category
  if (path.match(/^\/[^/]+\/[^/]+/)) {
    return 'article'
  }

  return 'home'
}

/**
 * Extract category from pathname
 */
function extractCategory(pathname: string): string | undefined {
  // Remove locale prefix
  const path = pathname.replace(/^\/(en|es|fr|ar)\//, '/')

  // Match category in URL (e.g., /afrique/article-slug -> afrique)
  const categoryMatch = path.match(/^\/([^/]+)/)
  if (categoryMatch && categoryMatch[1]) {
    return categoryMatch[1]
  }

  return undefined
}

export function ActiriseProvider({
  children,
  locale,
  pageType,
  category,
  tags,
  author,
  specialSection,
}: ActiriseProviderProps) {
  const pathname = usePathname()
  const lastPathRef = useRef<string>('')
  const isInitialMount = useRef(true)

  // Use useLayoutEffect to run synchronously before paint
  // This ensures variables are set before Actirise SDK processes the page
  useLayoutEffect(() => {
    // Skip if this is not a browser environment
    if (typeof window === 'undefined') return

    // Initialize _hbdbrk if not already done
    window._hbdbrk = window._hbdbrk || []

    // Auto-detect page type if not provided
    const detectedPageType = pageType || detectPageType(pathname)
    const detectedCategory = category || extractCategory(pathname)

    // Build custom variables object
    const customVars: Record<string, any> = {
      page_type: detectedPageType,
    }

    // Add custom1: Category slug
    if (detectedCategory) {
      customVars.custom1 = detectedCategory
    }

    // Add custom2: Locale
    customVars.custom2 = locale

    // Add custom3: Tags (comma-separated, max 3 tags)
    if (tags && tags.length > 0) {
      customVars.custom3 = tags.slice(0, 3).join(',')
    }

    // Add custom4: Author name
    if (author) {
      customVars.custom4 = author
    }

    // Add custom5: Special section
    if (specialSection) {
      customVars.custom5 = specialSection
    }

    // Only push variables if pathname changed or initial mount
    // This prevents duplicate pushes that cause ad flickering
    if (lastPathRef.current !== pathname || isInitialMount.current) {
      // Push variables to Actirise SDK
      window._hbdbrk.push(['_vars', customVars])

      // Update refs
      lastPathRef.current = pathname
      isInitialMount.current = false

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[ActiriseProvider] Variables pushed', {
          pathname,
          detectedPageType,
          detectedCategory,
          vars: customVars,
        })
      }
    }
  }, [pathname, locale, pageType, category, tags, author, specialSection])

  return <>{children}</>
}

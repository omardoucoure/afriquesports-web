/**
 * Actirise Provider Component
 *
 * Initializes Actirise SDK with page-specific variables
 * Handles page type tracking and custom variables for better ad targeting
 *
 * Page types:
 * - home: Homepage
 * - article: Article detail pages
 * - category: Category listing pages
 * - can-2025: AFCON 2025 special pages
 * - static: Static pages (contact, privacy, etc.)
 *
 * Custom variables:
 * - custom1: Category slug (e.g., "afrique", "mercato", "europe")
 * - custom2: Locale (fr, en, es)
 * - custom3: Tags (comma-separated)
 * - custom4: Author name
 * - custom5: Special section (e.g., "can-2025", "youtube", "tv")
 */

'use client'

import { useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface ActiriseProviderProps {
  children: ReactNode
  locale: string
  pageType?: 'home' | 'article' | 'category' | 'can-2025' | 'static'
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
 */
function detectPageType(pathname: string): 'home' | 'article' | 'category' | 'can-2025' | 'static' {
  // Remove locale prefix (e.g., /en/, /es/)
  const path = pathname.replace(/^\/(en|es|fr)\//, '/')

  // Homepage
  if (path === '/' || path === '') {
    return 'home'
  }

  // CAN 2025 pages
  if (path.startsWith('/can-2025')) {
    return 'can-2025'
  }

  // Static pages
  if (path.match(/^\/(contact|confidentialite|privacy|live|stories)/)) {
    return 'static'
  }

  // Category pages (e.g., /category/...)
  if (path.startsWith('/category/') || path.match(/^\/(afrique|europe|mercato|football|autres|ballon-dor|coupe-du-monde)\/?$/)) {
    return 'category'
  }

  // Article pages (e.g., /afrique/article-slug)
  if (path.match(/\/[^/]+\/[^/]+/)) {
    return 'article'
  }

  return 'home'
}

/**
 * Extract category from pathname
 */
function extractCategory(pathname: string): string | undefined {
  // Remove locale prefix
  const path = pathname.replace(/^\/(en|es|fr)\//, '/')

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

  useEffect(() => {
    // Initialize _hbdbrk if not already done
    if (typeof window !== 'undefined') {
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

      // Push variables to Actirise SDK
      window._hbdbrk.push(['_vars', customVars])

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[ActiriseProvider] Initialized', {
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

/**
 * Cookie consent integration
 *
 * Integrates with existing cookie-consent.tsx component
 * Reads consent status from localStorage
 */

const CONSENT_KEY = 'cookie-consent'

export type ConsentStatus = 'accepted' | 'declined' | null

export class ConsentManager {
  private static listeners: Set<(status: ConsentStatus) => void> = new Set()

  /**
   * Get current consent status from localStorage
   */
  static getConsent(): ConsentStatus {
    if (typeof window === 'undefined') return null

    try {
      const consent = localStorage.getItem(CONSENT_KEY)
      if (consent === 'accepted') return 'accepted'
      if (consent === 'declined') return 'declined'
      return null
    } catch (error) {
      console.warn('[Analytics] Failed to read consent:', error)
      return null
    }
  }

  /**
   * Check if analytics consent is granted
   * Default to true unless explicitly declined (opt-out model for analytics)
   */
  static hasConsent(): boolean {
    const consent = this.getConsent()
    // Allow analytics unless user explicitly declined
    return consent !== 'declined'
  }

  /**
   * Set consent status
   */
  static setConsent(status: ConsentStatus): void {
    if (typeof window === 'undefined') return

    try {
      if (status === null) {
        localStorage.removeItem(CONSENT_KEY)
      } else {
        localStorage.setItem(CONSENT_KEY, status)
      }

      // Notify listeners
      this.notifyListeners(status)
    } catch (error) {
      console.error('[Analytics] Failed to set consent:', error)
    }
  }

  /**
   * Subscribe to consent changes
   */
  static onChange(callback: (status: ConsentStatus) => void): () => void {
    this.listeners.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback)
    }
  }

  /**
   * Notify all listeners of consent change
   */
  private static notifyListeners(status: ConsentStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('[Analytics] Consent listener error:', error)
      }
    })
  }

  /**
   * Listen for localStorage changes (cross-tab sync)
   */
  static startListening(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('storage', (event) => {
      if (event.key === CONSENT_KEY) {
        const newStatus = event.newValue as ConsentStatus
        this.notifyListeners(newStatus)
      }
    })
  }
}

/**
 * React hook for consent status
 */
export function useConsent() {
  if (typeof window === 'undefined') {
    return {
      consent: null,
      hasConsent: false,
      setConsent: () => {},
    }
  }

  const [consent, setConsentState] = React.useState<ConsentStatus>(ConsentManager.getConsent())

  React.useEffect(() => {
    // Subscribe to consent changes
    const unsubscribe = ConsentManager.onChange((status) => {
      setConsentState(status)
    })

    return unsubscribe
  }, [])

  const setConsent = React.useCallback((status: ConsentStatus) => {
    ConsentManager.setConsent(status)
  }, [])

  return {
    consent,
    hasConsent: consent === 'accepted',
    setConsent,
  }
}

// React import for the hook
import React from 'react'

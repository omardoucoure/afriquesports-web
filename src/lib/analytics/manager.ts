/**
 * Analytics Manager - Core singleton
 *
 * Coordinates all analytics providers and handles:
 * - Multi-provider support (PostHog, GA4, Vercel)
 * - Event batching and queuing
 * - Consent management
 * - Session tracking
 * - Automatic event enrichment
 */

import type { AnalyticsProvider } from './providers/base'
import type { EventProperties, PageProperties, UserTraits } from './events'
import { validateEventProperties, isValidEvent, AnalyticsEventName } from './events'
import { EventQueue } from './utils/queue'
import { SessionManager } from './utils/session'
import { ConsentManager } from './utils/consent'
import { getCampaignData, storeCampaignAttribution } from './utils/utm'

export class AnalyticsManager {
  private static instance: AnalyticsManager | null = null

  private providers: Map<string, AnalyticsProvider> = new Map()
  private eventQueue: EventQueue
  private isInitialized: boolean = false
  private locale: string = 'fr'
  private autoEnrichment: boolean = true

  private constructor() {
    this.eventQueue = new EventQueue()
    this.setupFlushHandler()
    this.initSession()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): AnalyticsManager {
    if (!this.instance) {
      this.instance = new AnalyticsManager()
    }
    return this.instance
  }

  /**
   * Initialize the manager
   */
  init(config?: { locale?: string; autoEnrichment?: boolean }): void {
    if (this.isInitialized) {
      return
    }

    if (config?.locale) {
      this.locale = config.locale
    }

    if (config?.autoEnrichment !== undefined) {
      this.autoEnrichment = config.autoEnrichment
    }

    // Start listening for consent changes
    ConsentManager.startListening()

    // Store campaign attribution for Facebook page tracking
    storeCampaignAttribution()

    this.isInitialized = true

    const campaignData = getCampaignData()
    this.log('Analytics Manager initialized', {
      locale: this.locale,
      providers: Array.from(this.providers.keys()),
      campaign: campaignData,
    })
  }

  /**
   * Register an analytics provider
   */
  registerProvider(name: string, provider: AnalyticsProvider): void {
    this.providers.set(name, provider)

    // Initialize provider if it has init method
    if (provider.init) {
      provider.init()
    }

    this.log('Provider registered:', name)
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(name: string): void {
    const provider = this.providers.get(name)

    if (provider?.destroy) {
      provider.destroy()
    }

    this.providers.delete(name)

    this.log('Provider unregistered:', name)
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties: Partial<EventProperties> = {}): void {
    // Check consent
    if (!ConsentManager.hasConsent()) {
      this.log('Consent not granted, skipping track')
      return
    }

    // Validate event name
    if (!isValidEvent(eventName)) {
      this.error('Invalid event name:', eventName)
      return
    }

    // Enrich properties
    const enrichedProps = this.enrichProperties(properties)

    // Validate properties
    const validation = validateEventProperties(eventName as AnalyticsEventName, enrichedProps)
    if (!validation.valid) {
      this.error('Invalid event properties:', validation.errors)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Analytics] Event validation failed:', eventName, validation.errors)
      }
    }

    // Add to queue
    this.eventQueue.add(eventName, enrichedProps)

    this.log('Event tracked:', eventName, enrichedProps)
  }

  /**
   * Track a page view
   */
  page(pageName: string, properties: Partial<PageProperties> = {}): void {
    if (!ConsentManager.hasConsent()) {
      this.log('Consent not granted, skipping page')
      return
    }

    const enrichedProps = this.enrichProperties(properties as any)

    // Send to all providers immediately (not queued)
    this.providers.forEach(provider => {
      if (provider.isEnabled()) {
        provider.page(pageName, enrichedProps as any)
      }
    })

    // Increment page view count
    SessionManager.incrementPageView()

    this.log('Page tracked:', pageName, enrichedProps)
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits?: UserTraits): void {
    if (!ConsentManager.hasConsent()) {
      this.log('Consent not granted, skipping identify')
      return
    }

    this.providers.forEach(provider => {
      if (provider.isEnabled()) {
        provider.identify(userId, traits)
      }
    })

    this.log('User identified:', userId, traits)
  }

  /**
   * Reset user identity
   */
  reset(): void {
    this.providers.forEach(provider => {
      if (provider.isEnabled()) {
        provider.reset()
      }
    })

    // Clear session
    SessionManager.clearSession()
    SessionManager.initSession()

    this.log('User reset')
  }

  /**
   * Set consent status
   */
  setConsent(granted: boolean): void {
    const status = granted ? 'accepted' : 'declined'
    ConsentManager.setConsent(status)

    this.log('Consent updated:', status)
  }

  /**
   * Check if consent is granted
   */
  hasConsent(): boolean {
    return ConsentManager.hasConsent()
  }

  /**
   * Set locale for event enrichment
   */
  setLocale(locale: string): void {
    this.locale = locale
    this.log('Locale updated:', locale)
  }

  /**
   * Get current locale
   */
  getLocale(): string {
    return this.locale
  }

  /**
   * Get session data
   */
  getSessionData() {
    return SessionManager.getSessionData()
  }

  /**
   * Enable/disable event batching
   */
  setBatching(enabled: boolean): void {
    this.eventQueue.setEnabled(enabled)
    this.log('Batching', enabled ? 'enabled' : 'disabled')
  }

  /**
   * Flush all queued events immediately
   */
  flush(): void {
    this.eventQueue.flush()
  }

  /**
   * Get queue status (for debugging)
   */
  getQueueStatus() {
    return {
      size: this.eventQueue.getQueueSize(),
      queue: this.eventQueue.getQueue(),
    }
  }

  /**
   * Get list of registered providers
   */
  getProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}

    this.providers.forEach((provider, name) => {
      status[name] = provider.isEnabled()
    })

    return status
  }

  /**
   * Destroy the manager (cleanup)
   */
  destroy(): void {
    // Destroy all providers
    this.providers.forEach(provider => {
      if (provider.destroy) {
        provider.destroy()
      }
    })

    // Destroy queue
    this.eventQueue.destroy()

    // Clear session
    SessionManager.clearSession()

    this.providers.clear()
    this.isInitialized = false

    this.log('Analytics Manager destroyed')
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Enrich event properties with automatic data
   */
  private enrichProperties(properties: Partial<EventProperties>): Partial<EventProperties> {
    if (!this.autoEnrichment) {
      return properties
    }

    const enriched: Partial<EventProperties> = {
      ...properties,
    }

    // Add locale if not present
    if (!enriched.locale) {
      enriched.locale = this.locale
    }

    // Add page path if not present
    if (!enriched.page_path && typeof window !== 'undefined') {
      enriched.page_path = window.location.pathname
    }

    // Add referrer if not present
    if (!enriched.referrer && typeof document !== 'undefined') {
      enriched.referrer = document.referrer
    }

    // Add timestamp if not present
    if (!enriched.timestamp) {
      enriched.timestamp = Date.now()
    }

    // Add session ID if not present
    if (!enriched.session_id) {
      enriched.session_id = SessionManager.getSessionId()
    }

    // Add user agent if not present
    if (!enriched.user_agent && typeof navigator !== 'undefined') {
      enriched.user_agent = navigator.userAgent
    }

    // Add campaign data (UTM parameters for Facebook page tracking)
    const campaignData = getCampaignData()
    if (campaignData) {
      const { source: utmSource, medium, campaign, content, facebook_page } = campaignData;
      (enriched as any).utm_source = utmSource;
      (enriched as any).utm_medium = medium;
      (enriched as any).utm_campaign = campaign;

      if (content) {
        (enriched as any).utm_content = content;
      }

      if (facebook_page) {
        (enriched as any).facebook_page = facebook_page;
      }
    }

    return enriched
  }

  /**
   * Initialize session
   */
  private initSession(): void {
    SessionManager.initSession()
  }

  /**
   * Setup flush handler for event queue
   */
  private setupFlushHandler(): void {
    this.eventQueue.onFlush((events) => {
      // Send all events to all providers
      events.forEach(({ eventName, properties }) => {
        this.providers.forEach(provider => {
          if (provider.isEnabled()) {
            provider.track(eventName, properties)
          }
        })
      })
    })
  }

  /**
   * Log to console in development mode
   */
  private log(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', message, ...args)
    }
  }

  /**
   * Log error
   */
  private error(message: string, ...args: any[]): void {
    console.error('[Analytics]', message, ...args)
  }
}

// Export singleton instance getter
export const getAnalyticsManager = () => AnalyticsManager.getInstance()

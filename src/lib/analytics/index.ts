/**
 * Analytics library - Main export
 */

// Core
export { AnalyticsManager, getAnalyticsManager } from './manager'

// Events
export * from './events'

// Providers
export type { AnalyticsProvider } from './providers/base'
export { BaseProvider } from './providers/base'
export { PostHogProvider } from './providers/posthog-provider'
export { GoogleAnalyticsProvider } from './providers/google-analytics-provider'

// Utils
export { ConsentManager, useConsent } from './utils/consent'
export type { ConsentStatus } from './utils/consent'
export { SessionManager } from './utils/session'
export type { SessionData } from './utils/session'
export { EventQueue, debounce, throttle } from './utils/queue'
export type { QueuedEvent, FlushCallback } from './utils/queue'
export {
  getUTMParameters,
  getCampaignData,
  generateFacebookUTMLink,
  getFacebookPageSource,
  isFromFacebookPage,
} from './utils/utm'
export type { UTMParameters, CampaignData } from './utils/utm'

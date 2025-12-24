/**
 * UTM Parameter Tracking
 *
 * Track which Facebook page (or other campaign source) traffic comes from
 */

export interface UTMParameters {
  utm_source?: string      // e.g., 'facebook', 'twitter'
  utm_medium?: string      // e.g., 'social', 'email'
  utm_campaign?: string    // e.g., 'page_main', 'page_can2025', 'page_mercato'
  utm_content?: string     // e.g., 'post_123'
  utm_term?: string        // e.g., 'sadio-mane'
}

export interface CampaignData {
  source: string           // Where traffic came from
  medium: string           // Type of traffic
  campaign: string         // Campaign identifier (e.g., which Facebook page)
  content?: string         // Specific content/post
  term?: string            // Keywords
  facebook_page?: string   // Identified Facebook page name
}

/**
 * Extract UTM parameters from current URL
 */
export function getUTMParameters(): UTMParameters {
  if (typeof window === 'undefined') {
    return {}
  }

  const params = new URLSearchParams(window.location.search)

  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  }
}

/**
 * Get campaign data including Facebook page identification
 */
export function getCampaignData(): CampaignData | null {
  const utm = getUTMParameters()

  // No UTM parameters found
  if (!utm.utm_source && !utm.utm_campaign) {
    return null
  }

  const campaignData: CampaignData = {
    source: utm.utm_source || 'direct',
    medium: utm.utm_medium || 'none',
    campaign: utm.utm_campaign || 'none',
    content: utm.utm_content,
    term: utm.utm_term,
  }

  // Identify which Facebook page based on campaign name
  if (utm.utm_source === 'facebook' && utm.utm_campaign) {
    campaignData.facebook_page = identifyFacebookPage(utm.utm_campaign)
  }

  return campaignData
}

/**
 * Identify Facebook page from campaign parameter
 */
function identifyFacebookPage(campaign: string): string {
  const pageMap: Record<string, string> = {
    'page_main': 'Main Afrique Sports',
    'page_can2025': 'CAN 2025',
    'page_mercato': 'Mercato',
    'main': 'Main Afrique Sports',
    'can': 'CAN 2025',
    'mercato': 'Mercato',
  }

  const normalized = campaign.toLowerCase()
  return pageMap[normalized] || campaign
}

/**
 * Generate UTM link for a specific Facebook page
 */
export function generateFacebookUTMLink(
  url: string,
  facebookPage: 'main' | 'can2025' | 'mercato',
  postId?: string
): string {
  const baseUrl = url.includes('?') ? url : url + '?'
  const separator = url.includes('?') ? '&' : ''

  const campaignMap = {
    main: 'page_main',
    can2025: 'page_can2025',
    mercato: 'page_mercato',
  }

  const params = new URLSearchParams({
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: campaignMap[facebookPage],
  })

  if (postId) {
    params.set('utm_content', `post_${postId}`)
  }

  return `${baseUrl}${separator}${params.toString()}`
}

/**
 * Store campaign data in sessionStorage for attribution
 */
export function storeCampaignAttribution(): void {
  if (typeof window === 'undefined') {
    return
  }

  const campaignData = getCampaignData()

  if (campaignData) {
    try {
      sessionStorage.setItem('campaign_attribution', JSON.stringify(campaignData))
      sessionStorage.setItem('campaign_timestamp', Date.now().toString())
    } catch (error) {
      console.warn('Failed to store campaign attribution:', error)
    }
  }
}

/**
 * Get stored campaign attribution (for conversion tracking)
 */
export function getCampaignAttribution(): CampaignData | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = sessionStorage.getItem('campaign_attribution')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to get campaign attribution:', error)
  }

  return null
}

/**
 * Check if user came from a specific Facebook page
 */
export function isFromFacebookPage(pageName: 'main' | 'can2025' | 'mercato'): boolean {
  const campaign = getCampaignData()

  if (!campaign || campaign.source !== 'facebook') {
    return false
  }

  const campaignMap = {
    main: 'page_main',
    can2025: 'page_can2025',
    mercato: 'page_mercato',
  }

  return campaign.campaign === campaignMap[pageName]
}

/**
 * Get Facebook page source name (human-readable)
 */
export function getFacebookPageSource(): string | null {
  const campaign = getCampaignData()

  if (campaign?.source === 'facebook' && campaign.facebook_page) {
    return campaign.facebook_page
  }

  return null
}

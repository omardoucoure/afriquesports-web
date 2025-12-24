/**
 * Main analytics hook for component-level tracking
 *
 * Provides convenient methods for tracking all event types
 */

'use client'

import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import { getAnalyticsManager } from '@/lib/analytics'
import { AnalyticsEventName } from '@/lib/analytics/events'
import type {
  ArticleClickCardEvent,
  SocialShareEvent,
  NavigationClickEvent,
  SearchOpenEvent,
  SearchSubmitEvent,
  SearchClickPopularTermEvent,
  SearchClickResultEvent,
  WidgetClickEvent,
  ContentLoadMoreEvent,
  ContentPaginationEvent,
  MatchTabSwitchEvent,
  MatchBannerClickEvent,
  MatchBannerImpressionEvent,
  LiveMatchEngagementEvent,
  SharePlatform,
  WidgetType,
} from '@/lib/analytics/events'

export function useAnalytics() {
  const locale = useLocale()
  const manager = getAnalyticsManager()

  // Set locale in manager
  if (manager.getLocale() !== locale) {
    manager.setLocale(locale)
  }

  /**
   * Generic track method
   */
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    manager.track(eventName, properties)
  }, [manager])

  /**
   * Track article card click
   */
  const trackArticleClick = useCallback((params: {
    articleId: string
    articleTitle: string
    articleCategory: string
    variant?: 'default' | 'compact' | 'horizontal'
    position?: number
    section?: 'hero' | 'latest' | 'featured' | 'related' | 'most-read' | 'category' | 'search'
  }) => {
    const properties: Partial<ArticleClickCardEvent> = {
      article_id: params.articleId,
      article_title: params.articleTitle,
      article_category: params.articleCategory,
      card_variant: params.variant || 'default',
      position_in_list: params.position || 0,
      section: params.section || 'latest',
    }

    manager.track(AnalyticsEventName.ARTICLE_CLICK_CARD, properties)
  }, [manager])

  /**
   * Track social share
   */
  const trackSocialShare = useCallback((params: {
    articleId: string
    articleTitle: string
    platform: SharePlatform
    shareUrl?: string
  }) => {
    const properties: Partial<SocialShareEvent> = {
      article_id: params.articleId,
      article_title: params.articleTitle,
      platform: params.platform,
      share_url: params.shareUrl || window.location.href,
    }

    // Use specific event name based on platform
    const eventMap: Record<SharePlatform, AnalyticsEventName> = {
      facebook: AnalyticsEventName.SOCIAL_SHARE_FACEBOOK,
      twitter: AnalyticsEventName.SOCIAL_SHARE_TWITTER,
      whatsapp: AnalyticsEventName.SOCIAL_SHARE_WHATSAPP,
      telegram: AnalyticsEventName.SOCIAL_SHARE_TELEGRAM,
      copy: AnalyticsEventName.SOCIAL_COPY_LINK,
    }

    manager.track(eventMap[params.platform], properties)
  }, [manager])

  /**
   * Track navigation click
   */
  const trackNavigation = useCallback((params: {
    targetType: 'category' | 'subcategory' | 'breadcrumb' | 'logo' | 'menu_item' | 'footer_link'
    linkText: string
    linkUrl: string
    category?: string
    subcategory?: string
  }) => {
    const properties: Partial<NavigationClickEvent> = {
      target_type: params.targetType,
      link_text: params.linkText,
      link_url: params.linkUrl,
      category: params.category,
      subcategory: params.subcategory,
    }

    // Use specific event name based on target type
    const eventMap: Record<string, AnalyticsEventName> = {
      category: AnalyticsEventName.NAVIGATION_CLICK_CATEGORY,
      breadcrumb: AnalyticsEventName.NAVIGATION_CLICK_BREADCRUMB,
      logo: AnalyticsEventName.NAVIGATION_CLICK_LOGO,
    }

    const eventName = eventMap[params.targetType] || AnalyticsEventName.NAVIGATION_CLICK_CATEGORY

    manager.track(eventName, properties)
  }, [manager])

  /**
   * Track search modal open
   */
  const trackSearchOpen = useCallback((source: 'header' | 'mobile_nav' | 'keyboard_shortcut' = 'header') => {
    const properties: Partial<SearchOpenEvent> = {
      source,
    }

    manager.track(AnalyticsEventName.SEARCH_OPEN_MODAL, properties)
  }, [manager])

  /**
   * Track search query submit
   */
  const trackSearchSubmit = useCallback((params: {
    query: string
    resultsCount: number
    source?: 'modal' | 'page'
  }) => {
    const properties: Partial<SearchSubmitEvent> = {
      query: params.query,
      results_count: params.resultsCount,
      source: params.source || 'modal',
    }

    manager.track(AnalyticsEventName.SEARCH_SUBMIT_QUERY, properties)
  }, [manager])

  /**
   * Track popular search term click
   */
  const trackSearchPopularTerm = useCallback((params: {
    term: string
    position: number
  }) => {
    const properties: Partial<SearchClickPopularTermEvent> = {
      term: params.term,
      term_position: params.position,
    }

    manager.track(AnalyticsEventName.SEARCH_CLICK_POPULAR_TERM, properties)
  }, [manager])

  /**
   * Track search result click
   */
  const trackSearchResultClick = useCallback((params: {
    query: string
    resultArticleId: string
    position: number
    totalResults: number
  }) => {
    const properties: Partial<SearchClickResultEvent> = {
      query: params.query,
      result_article_id: params.resultArticleId,
      result_position: params.position,
      total_results: params.totalResults,
    }

    manager.track(AnalyticsEventName.SEARCH_CLICK_RESULT, properties)
  }, [manager])

  /**
   * Track widget click
   */
  const trackWidgetClick = useCallback((params: {
    widgetType: WidgetType
    itemId: string
    itemTitle: string
    position: number
    widgetLocation?: 'sidebar' | 'homepage' | 'article_page'
  }) => {
    const properties: Partial<WidgetClickEvent> = {
      widget_type: params.widgetType,
      item_id: params.itemId,
      item_title: params.itemTitle,
      position: params.position,
      widget_location: params.widgetLocation || 'sidebar',
    }

    // Use specific event name based on widget type
    const eventMap: Record<WidgetType, AnalyticsEventName> = {
      most_read: AnalyticsEventName.WIDGET_CLICK_MOST_READ,
      top_scorers: AnalyticsEventName.WIDGET_CLICK_TOP_SCORER,
      players: AnalyticsEventName.WIDGET_CLICK_PLAYER,
      rankings: AnalyticsEventName.WIDGET_CLICK_RANKING,
      recent_articles: AnalyticsEventName.WIDGET_CLICK_MOST_READ, // fallback
    }

    manager.track(eventMap[params.widgetType], properties)
  }, [manager])

  /**
   * Track load more button click
   */
  const trackLoadMore = useCallback((params: {
    offset: number
    perPage: number
    category?: string
    totalLoaded: number
  }) => {
    const properties: Partial<ContentLoadMoreEvent> = {
      offset: params.offset,
      per_page: params.perPage,
      category: params.category,
      total_loaded: params.totalLoaded,
    }

    manager.track(AnalyticsEventName.CONTENT_LOAD_MORE, properties)
  }, [manager])

  /**
   * Track pagination navigation
   */
  const trackPagination = useCallback((params: {
    action: 'next' | 'previous' | 'goto_page'
    fromPage: number
    toPage: number
    category?: string
  }) => {
    const properties: Partial<ContentPaginationEvent> = {
      action: params.action,
      from_page: params.fromPage,
      to_page: params.toPage,
      category: params.category,
    }

    const eventName = params.action === 'next'
      ? AnalyticsEventName.CONTENT_PAGINATION_NEXT
      : AnalyticsEventName.CONTENT_PAGINATION_PREVIOUS

    manager.track(eventName, properties)
  }, [manager])

  /**
   * Track match tab switch
   */
  const trackMatchTabSwitch = useCallback((params: {
    matchId: string
    fromTab: 'video' | 'stats' | 'lineup' | 'commentary'
    toTab: 'video' | 'stats' | 'lineup' | 'commentary'
  }) => {
    const properties: Partial<MatchTabSwitchEvent> = {
      match_id: params.matchId,
      from_tab: params.fromTab,
      to_tab: params.toTab,
    }

    manager.track(AnalyticsEventName.MATCH_TAB_SWITCH, properties)
  }, [manager])

  /**
   * Track next match banner click
   */
  const trackMatchBannerClick = useCallback((params: {
    matchId: string
    homeTeam: string
    awayTeam: string
    matchTime: string
    bannerLocation?: 'top_bar' | 'homepage' | 'sidebar'
  }) => {
    const properties: Partial<MatchBannerClickEvent> = {
      match_id: params.matchId,
      home_team: params.homeTeam,
      away_team: params.awayTeam,
      match_time: params.matchTime,
      banner_location: params.bannerLocation || 'top_bar',
    }

    manager.track(AnalyticsEventName.MATCH_BANNER_CLICK, properties)
  }, [manager])

  /**
   * Track next match banner impression
   */
  const trackMatchBannerImpression = useCallback((params: {
    matchId: string
    homeTeam: string
    awayTeam: string
    matchTime: string
    bannerLocation?: 'top_bar' | 'homepage' | 'sidebar'
  }) => {
    const properties: Partial<MatchBannerImpressionEvent> = {
      match_id: params.matchId,
      home_team: params.homeTeam,
      away_team: params.awayTeam,
      match_time: params.matchTime,
      banner_location: params.bannerLocation || 'top_bar',
    }

    manager.track(AnalyticsEventName.MATCH_BANNER_IMPRESSION, properties)
  }, [manager])

  /**
   * Track live match engagement
   */
  const trackLiveMatchEngagement = useCallback((params: {
    matchId: string
    engagementType: 'commentary_scroll' | 'stats_view' | 'lineup_view' | 'score_update' | 'live_indicator_view'
    timeOnPageSeconds: number
    isLive: boolean
  }) => {
    const properties: Partial<LiveMatchEngagementEvent> = {
      match_id: params.matchId,
      engagement_type: params.engagementType,
      time_on_page_seconds: params.timeOnPageSeconds,
      is_live: params.isLive,
    }

    manager.track(AnalyticsEventName.LIVE_MATCH_ENGAGEMENT, properties)
  }, [manager])

  /**
   * Track language switch
   */
  const trackLanguageSwitch = useCallback((params: {
    fromLocale: string
    toLocale: string
  }) => {
    manager.track(AnalyticsEventName.NAVIGATION_SWITCH_LANGUAGE, {
      from_locale: params.fromLocale,
      to_locale: params.toLocale,
    })
  }, [manager])

  return {
    // Generic track
    track,

    // Article tracking
    trackArticleClick,

    // Social sharing
    trackSocialShare,

    // Navigation
    trackNavigation,
    trackLanguageSwitch,

    // Search
    trackSearchOpen,
    trackSearchSubmit,
    trackSearchPopularTerm,
    trackSearchResultClick,

    // Widgets
    trackWidgetClick,

    // Content discovery
    trackLoadMore,
    trackPagination,

    // Match pages
    trackMatchTabSwitch,
    trackMatchBannerClick,
    trackMatchBannerImpression,
    trackLiveMatchEngagement,

    // Manager access
    manager,
  }
}

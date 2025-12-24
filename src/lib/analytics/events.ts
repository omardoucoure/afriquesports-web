/**
 * Type-safe analytics event definitions
 *
 * Event Naming Convention: Category_Action_Target
 * Examples: Article_Click_Card, Social_Share_Facebook, Navigation_Click_Category
 */

// ============================================================================
// Base Event Properties (attached to all events)
// ============================================================================

export interface BaseEventProperties {
  locale: string
  page_path: string
  referrer?: string
  timestamp: number
  session_id: string
  user_agent?: string
}

// ============================================================================
// Article Events
// ============================================================================

export interface ArticleViewEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  article_category: string
  article_author?: string
  article_publish_date?: string
}

export interface ArticleReadProgressEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  progress_percentage: 25 | 50 | 75 | 100
  time_spent_seconds: number
}

export interface ArticleReadStartEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  dwell_time_seconds: number
}

export interface ArticleTimeSpentEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  total_time_seconds: number
  active_time_seconds: number
  scroll_depth_percentage: number
}

export interface ArticleClickCardEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  article_category: string
  card_variant: 'default' | 'compact' | 'horizontal'
  position_in_list: number
  section: 'hero' | 'latest' | 'featured' | 'related' | 'most-read' | 'category' | 'search'
}

export interface ArticleClickRelatedEvent extends BaseEventProperties {
  source_article_id: string
  target_article_id: string
  target_article_title: string
  position: number
}

// ============================================================================
// Social Share Events
// ============================================================================

export type SharePlatform = 'facebook' | 'twitter' | 'whatsapp' | 'telegram' | 'copy'

export interface SocialShareEvent extends BaseEventProperties {
  article_id: string
  article_title: string
  platform: SharePlatform
  share_url: string
}

// ============================================================================
// Navigation Events
// ============================================================================

export interface NavigationClickEvent extends BaseEventProperties {
  target_type: 'category' | 'subcategory' | 'breadcrumb' | 'logo' | 'menu_item' | 'footer_link'
  link_text: string
  link_url: string
  category?: string
  subcategory?: string
}

export interface NavigationMenuEvent extends BaseEventProperties {
  action: 'open' | 'close'
  menu_type: 'mobile' | 'desktop_dropdown'
}

export interface NavigationLanguageSwitchEvent extends BaseEventProperties {
  from_locale: string
  to_locale: string
}

// ============================================================================
// Search Events
// ============================================================================

export interface SearchOpenEvent extends BaseEventProperties {
  source: 'header' | 'mobile_nav' | 'keyboard_shortcut'
}

export interface SearchSubmitEvent extends BaseEventProperties {
  query: string
  results_count: number
  source: 'modal' | 'page'
}

export interface SearchClickResultEvent extends BaseEventProperties {
  query: string
  result_article_id: string
  result_position: number
  total_results: number
}

export interface SearchClickPopularTermEvent extends BaseEventProperties {
  term: string
  term_position: number
}

export interface SearchNoResultsEvent extends BaseEventProperties {
  query: string
}

// ============================================================================
// Widget Events
// ============================================================================

export type WidgetType = 'most_read' | 'top_scorers' | 'players' | 'rankings' | 'recent_articles'

export interface WidgetClickEvent extends BaseEventProperties {
  widget_type: WidgetType
  item_id: string
  item_title: string
  position: number
  widget_location: 'sidebar' | 'homepage' | 'article_page'
}

export interface WidgetImpressionEvent extends BaseEventProperties {
  widget_type: WidgetType
  widget_location: 'sidebar' | 'homepage' | 'article_page'
  items_count: number
}

// ============================================================================
// Content Discovery Events
// ============================================================================

export interface ContentLoadMoreEvent extends BaseEventProperties {
  offset: number
  per_page: number
  category?: string
  total_loaded: number
}

export interface ContentPaginationEvent extends BaseEventProperties {
  action: 'next' | 'previous' | 'goto_page'
  from_page: number
  to_page: number
  category?: string
}

export interface ContentFilterEvent extends BaseEventProperties {
  filter_type: 'category' | 'country' | 'date' | 'sort'
  filter_value: string
  results_count: number
}

// ============================================================================
// Engagement Metrics (Automatic)
// ============================================================================

export interface EngagementScrollDepthEvent extends BaseEventProperties {
  depth_percentage: 25 | 50 | 75 | 100
  max_scroll_pixels: number
  page_height_pixels: number
}

export interface EngagementSessionDurationEvent extends BaseEventProperties {
  duration_seconds: number
  pages_viewed: number
  active_time_seconds: number
}

export interface EngagementPageActiveTimeEvent extends BaseEventProperties {
  active_time_seconds: number
  total_time_seconds: number
  visibility_changes: number
}

export interface EngagementRageClickEvent extends BaseEventProperties {
  element_selector: string
  click_count: number
  time_window_ms: number
}

export interface EngagementDeadClickEvent extends BaseEventProperties {
  element_selector: string
  element_text: string
}

// ============================================================================
// User Events
// ============================================================================

export interface UserCommentSubmitEvent extends BaseEventProperties {
  article_id: string
  comment_length: number
  is_reply: boolean
  parent_comment_id?: string
}

export interface UserCommentReplyEvent extends BaseEventProperties {
  article_id: string
  parent_comment_id: string
  comment_length: number
}

export interface UserPollVoteEvent extends BaseEventProperties {
  poll_id: string
  poll_question: string
  option_id: string
  option_text: string
}

export interface UserNewsletterSignupEvent extends BaseEventProperties {
  source: 'footer' | 'popup' | 'article_inline'
  email_domain?: string
}

export interface UserConsentEvent extends BaseEventProperties {
  action: 'accept' | 'decline' | 'update'
  analytics_storage: 'granted' | 'denied'
}

// ============================================================================
// Match Events (CAN 2025, Live Matches)
// ============================================================================

export interface MatchViewPageEvent extends BaseEventProperties {
  match_id: string
  home_team: string
  away_team: string
  match_status: 'upcoming' | 'live' | 'completed'
}

export interface MatchTabSwitchEvent extends BaseEventProperties {
  match_id: string
  from_tab: 'video' | 'stats' | 'lineup' | 'commentary'
  to_tab: 'video' | 'stats' | 'lineup' | 'commentary'
}

export interface MatchVideoPlayEvent extends BaseEventProperties {
  match_id: string
  video_id: string
  video_type: 'highlight' | 'full_match' | 'interview'
}

export interface MatchCommentaryViewEvent extends BaseEventProperties {
  match_id: string
  scroll_depth_percentage: number
  events_viewed: number
}

export interface MatchBannerClickEvent extends BaseEventProperties {
  match_id: string
  home_team: string
  away_team: string
  match_time: string
  banner_location: 'top_bar' | 'homepage' | 'sidebar'
}

export interface MatchBannerImpressionEvent extends BaseEventProperties {
  match_id: string
  home_team: string
  away_team: string
  match_time: string
  banner_location: 'top_bar' | 'homepage' | 'sidebar'
}

export interface LiveMatchEngagementEvent extends BaseEventProperties {
  match_id: string
  engagement_type: 'commentary_scroll' | 'stats_view' | 'lineup_view' | 'score_update' | 'live_indicator_view'
  time_on_page_seconds: number
  is_live: boolean
}

// ============================================================================
// Ad Events
// ============================================================================

export type AdPlacement = 'top' | 'in_article_top' | 'in_article_middle' | 'in_article_bottom' | 'sidebar' | 'footer'

export interface AdImpressionEvent extends BaseEventProperties {
  ad_placement: AdPlacement
  ad_id?: string
  article_id?: string
}

export interface AdClickEvent extends BaseEventProperties {
  ad_placement: AdPlacement
  ad_id?: string
  article_id?: string
  click_url?: string
}

// ============================================================================
// Error Events
// ============================================================================

export interface ErrorEvent extends BaseEventProperties {
  error_type: 'javascript' | 'network' | '404' | '500' | 'api'
  error_message: string
  error_stack?: string
  component_name?: string
}

// ============================================================================
// Event Properties Union Type
// ============================================================================

export type EventProperties =
  | BaseEventProperties
  | ArticleViewEvent
  | ArticleReadProgressEvent
  | ArticleReadStartEvent
  | ArticleTimeSpentEvent
  | ArticleClickCardEvent
  | ArticleClickRelatedEvent
  | SocialShareEvent
  | NavigationClickEvent
  | NavigationMenuEvent
  | NavigationLanguageSwitchEvent
  | SearchOpenEvent
  | SearchSubmitEvent
  | SearchClickResultEvent
  | SearchClickPopularTermEvent
  | SearchNoResultsEvent
  | WidgetClickEvent
  | WidgetImpressionEvent
  | ContentLoadMoreEvent
  | ContentPaginationEvent
  | ContentFilterEvent
  | EngagementScrollDepthEvent
  | EngagementSessionDurationEvent
  | EngagementPageActiveTimeEvent
  | EngagementRageClickEvent
  | EngagementDeadClickEvent
  | UserCommentSubmitEvent
  | UserCommentReplyEvent
  | UserPollVoteEvent
  | UserNewsletterSignupEvent
  | UserConsentEvent
  | MatchViewPageEvent
  | MatchTabSwitchEvent
  | MatchVideoPlayEvent
  | MatchCommentaryViewEvent
  | MatchBannerClickEvent
  | MatchBannerImpressionEvent
  | LiveMatchEngagementEvent
  | AdImpressionEvent
  | AdClickEvent
  | ErrorEvent

// ============================================================================
// Event Names Enum
// ============================================================================

export enum AnalyticsEventName {
  // Article Events
  ARTICLE_VIEW_PAGE = 'Article_View_Page',
  ARTICLE_READ_START = 'Article_Read_Start',
  ARTICLE_READ_PROGRESS_25 = 'Article_Read_Progress_25',
  ARTICLE_READ_PROGRESS_50 = 'Article_Read_Progress_50',
  ARTICLE_READ_PROGRESS_75 = 'Article_Read_Progress_75',
  ARTICLE_READ_PROGRESS_100 = 'Article_Read_Progress_100',
  ARTICLE_TIME_SPENT = 'Article_Time_Spent',
  ARTICLE_CLICK_CARD = 'Article_Click_Card',
  ARTICLE_CLICK_RELATED = 'Article_Click_Related',

  // Social Share Events
  SOCIAL_SHARE_FACEBOOK = 'Social_Share_Facebook',
  SOCIAL_SHARE_TWITTER = 'Social_Share_Twitter',
  SOCIAL_SHARE_WHATSAPP = 'Social_Share_WhatsApp',
  SOCIAL_SHARE_TELEGRAM = 'Social_Share_Telegram',
  SOCIAL_COPY_LINK = 'Social_Copy_Link',

  // Navigation Events
  NAVIGATION_CLICK_CATEGORY = 'Navigation_Click_Category',
  NAVIGATION_CLICK_BREADCRUMB = 'Navigation_Click_Breadcrumb',
  NAVIGATION_CLICK_LOGO = 'Navigation_Click_Logo',
  NAVIGATION_OPEN_MENU = 'Navigation_Open_Menu',
  NAVIGATION_CLOSE_MENU = 'Navigation_Close_Menu',
  NAVIGATION_SWITCH_LANGUAGE = 'Navigation_Switch_Language',

  // Search Events
  SEARCH_OPEN_MODAL = 'Search_Open_Modal',
  SEARCH_SUBMIT_QUERY = 'Search_Submit_Query',
  SEARCH_CLICK_RESULT = 'Search_Click_Result',
  SEARCH_CLICK_POPULAR_TERM = 'Search_Click_Popular_Term',
  SEARCH_NO_RESULTS = 'Search_No_Results',

  // Widget Events
  WIDGET_CLICK_MOST_READ = 'Widget_Click_MostRead',
  WIDGET_CLICK_TOP_SCORER = 'Widget_Click_TopScorer',
  WIDGET_CLICK_PLAYER = 'Widget_Click_Player',
  WIDGET_CLICK_RANKING = 'Widget_Click_Ranking',
  WIDGET_IMPRESSION = 'Widget_Impression',

  // Content Discovery Events
  CONTENT_LOAD_MORE = 'Content_Load_More',
  CONTENT_PAGINATION_NEXT = 'Content_Pagination_Next',
  CONTENT_PAGINATION_PREVIOUS = 'Content_Pagination_Previous',
  CONTENT_FILTER_APPLY = 'Content_Filter_Apply',

  // Engagement Metrics
  ENGAGEMENT_SCROLL_DEPTH = 'Engagement_Scroll_Depth',
  ENGAGEMENT_SESSION_DURATION = 'Engagement_Session_Duration',
  ENGAGEMENT_PAGE_ACTIVE_TIME = 'Engagement_Page_Active_Time',
  ENGAGEMENT_RAGE_CLICK = 'Engagement_Rage_Click',
  ENGAGEMENT_DEAD_CLICK = 'Engagement_Dead_Click',

  // User Events
  USER_COMMENT_SUBMIT = 'User_Comment_Submit',
  USER_COMMENT_REPLY = 'User_Comment_Reply',
  USER_POLL_VOTE = 'User_Poll_Vote',
  USER_NEWSLETTER_SIGNUP = 'User_Newsletter_Signup',
  USER_CONSENT_UPDATE = 'User_Consent_Update',

  // Match Events
  MATCH_VIEW_PAGE = 'Match_View_Page',
  MATCH_TAB_SWITCH = 'Match_Tab_Switch',
  MATCH_VIDEO_PLAY = 'Match_Video_Play',
  MATCH_COMMENTARY_VIEW = 'Match_Commentary_View',
  MATCH_BANNER_CLICK = 'Match_Banner_Click',
  MATCH_BANNER_IMPRESSION = 'Match_Banner_Impression',
  LIVE_MATCH_ENGAGEMENT = 'Live_Match_Engagement',

  // Ad Events
  AD_IMPRESSION = 'Ad_Impression',
  AD_CLICK = 'Ad_Click',

  // Error Events
  ERROR_OCCURRED = 'Error_Occurred',
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PageProperties {
  page_title: string
  page_category?: string
  page_type?: 'homepage' | 'article' | 'category' | 'search' | 'match' | 'static'
}

export interface UserTraits {
  user_id?: string
  email?: string
  name?: string
  locale?: string
  signup_date?: string
  subscription_status?: string
  [key: string]: any
}

// ============================================================================
// Event Validation
// ============================================================================

export function isValidEvent(eventName: string): boolean {
  return Object.values(AnalyticsEventName).includes(eventName as AnalyticsEventName)
}

export function validateEventProperties(
  eventName: AnalyticsEventName,
  properties: Partial<EventProperties>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required base properties
  if (!properties.locale) errors.push('Missing required property: locale')
  if (!properties.page_path) errors.push('Missing required property: page_path')
  if (!properties.timestamp) errors.push('Missing required property: timestamp')
  if (!properties.session_id) errors.push('Missing required property: session_id')

  // Event-specific validation
  if (eventName.startsWith('Article_')) {
    if (!(properties as any).article_id) {
      errors.push('Missing required property for article event: article_id')
    }
  }

  if (eventName.startsWith('Social_')) {
    if (!(properties as any).platform) {
      errors.push('Missing required property for social event: platform')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

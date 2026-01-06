/**
 * RAG System Types - Shared interfaces for content generation
 */

/**
 * Content types supported by the RAG system
 */
export type ContentType = 'match-preview' | 'match-report' | 'news-article' | 'player-profile' | 'ranking';

/**
 * Supported locales
 */
export type Locale = 'fr' | 'en' | 'es' | 'ar';

/**
 * Data source types
 */
export type SourceType = 'wordpress' | 'espn' | 'mysql' | 'trending';

/**
 * Context item - single piece of information retrieved from a data source
 */
export interface ContextItem {
  id: string;
  source: SourceType;
  content: string;
  metadata: Record<string, any>;
  relevanceScore?: number;
  tokenCount?: number;
}

/**
 * Retrieval query - parameters for fetching context
 */
export interface RetrievalQuery {
  contentType: ContentType;
  locale: Locale;
  params: Record<string, any>;
  keywords?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Context source interface - all retrievers must implement this
 */
export interface ContextSource {
  name: string;
  fetch(query: RetrievalQuery): Promise<ContextItem[]>;
  relevanceScorer(item: ContextItem, query: RetrievalQuery): number;
  tokenEstimator(item: ContextItem): number;
}

/**
 * Generation request - input for content generation
 */
export interface GenerationRequest {
  contentType: ContentType;
  locale: Locale;
  params: MatchPreviewParams | MatchReportParams | NewsArticleParams | PlayerProfileParams | RankingParams;
  title?: string;
  categories?: number[];
}

/**
 * Match preview parameters
 */
export interface MatchPreviewParams {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchDate: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

/**
 * Match report parameters
 */
export interface MatchReportParams {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  score: string;
  matchDate: string;
  matchId?: string;
}

/**
 * News article parameters
 */
export interface NewsArticleParams {
  topic: string;
  keywords: string[];
  region?: string;
}

/**
 * Player profile parameters
 */
export interface PlayerProfileParams {
  playerName: string;
  team: string;
  position?: string;
  nationality?: string;
}

/**
 * Ranking parameters
 */
export interface RankingParams {
  topic: string;
  criteria: string;
  count?: number;
  region?: string;
  timeframe?: string;
}

/**
 * Generation result - output from content generation
 */
export interface GenerationResult {
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
  metadata?: {
    contextItemsUsed: number;
    totalTokensContext: number;
    generationTokens: number;
    durationMs: number;
    tokensPerSecond: number;
    sources: SourceType[];
  };
}

/**
 * Prompt template structure
 */
export interface PromptTemplate {
  systemPrompt: string | ((locale: Locale) => string);
  userPromptTemplate: (
    context: ContextItem[],
    params: any,
    locale: Locale
  ) => string;
  maxTokens: number;
  temperature: number;
}

/**
 * WordPress draft publish request
 */
export interface WordPressDraftRequest {
  title: string;
  content: string;
  locale: Locale;
  categories?: number[];
  tags?: number[];
  metadata?: {
    contentType: ContentType;
    generatedAt: string;
    model: string;
  };
}

/**
 * WordPress draft publish response
 */
export interface WordPressDraftResponse {
  success: boolean;
  postId?: number;
  editLink?: string;
  error?: string;
}

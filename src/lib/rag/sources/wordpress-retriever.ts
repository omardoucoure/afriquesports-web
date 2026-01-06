/**
 * WordPress Context Retriever - Fetches relevant articles from WordPress CMS
 *
 * Retrieves articles based on keywords, categories, and recency
 * Sources: 100,000+ articles across 4 locales (FR/EN/ES/AR)
 */

import { DataFetcher, WordPressPost } from '@/lib/data-fetcher';
import {
  ContextSource,
  ContextItem,
  RetrievalQuery,
  ContentType,
} from '../types';

export class WordPressRetriever implements ContextSource {
  name = 'wordpress';

  /**
   * Fetch relevant WordPress articles for context
   */
  async fetch(query: RetrievalQuery): Promise<ContextItem[]> {
    try {
      const keywords = this.extractKeywords(query);
      const searchTerm = keywords.join(' ');

      // Fetch recent posts with search term
      const posts = await DataFetcher.searchPosts(
        searchTerm,
        {
          locale: query.locale,
          per_page: '20',
        }
      );

      console.log(`[WordPressRetriever] Search term: "${searchTerm}"`);
      console.log(`[WordPressRetriever] Fetched ${posts.length} posts from WordPress`);

      // Convert WordPress posts to context items
      const contextItems: ContextItem[] = posts.map((post) => ({
        id: `wp-${post.id}`,
        source: 'wordpress' as const,
        content: this.extractContent(post),
        metadata: {
          title: post.title.rendered,
          date: post.date,
          categories: post.categories,
          tags: post.tags,
          link: post.link,
        },
      }));

      // Score and sort by relevance
      const scoredItems = contextItems.map((item) => ({
        ...item,
        relevanceScore: this.relevanceScorer(item, query),
        tokenCount: this.tokenEstimator(item),
      }));

      // Sort by relevance (descending)
      scoredItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      return scoredItems;
    } catch (error) {
      console.error('[WordPressRetriever] Error fetching articles:', error);
      return [];
    }
  }

  /**
   * Extract keywords from query parameters
   */
  private extractKeywords(query: RetrievalQuery): string[] {
    const keywords: string[] = query.keywords || [];

    // Add content-type specific keywords
    switch (query.contentType) {
      case 'match-preview':
        if (query.params.homeTeam) keywords.push(query.params.homeTeam);
        if (query.params.awayTeam) keywords.push(query.params.awayTeam);
        if (query.params.competition) keywords.push(query.params.competition);
        keywords.push('avant-match', 'preview', 'pronostic', 'match');
        break;

      case 'match-report':
        if (query.params.homeTeam) keywords.push(query.params.homeTeam);
        if (query.params.awayTeam) keywords.push(query.params.awayTeam);
        if (query.params.competition) keywords.push(query.params.competition);
        keywords.push('résumé', 'report', 'match', 'score');
        break;

      case 'news-article':
        if (query.params.topic) keywords.push(query.params.topic);
        if (query.params.keywords) keywords.push(...query.params.keywords);
        break;

      case 'player-profile':
        if (query.params.playerName) keywords.push(query.params.playerName);
        if (query.params.team) keywords.push(query.params.team);
        keywords.push('joueur', 'player', 'profil', 'stats');
        break;

      case 'ranking':
        // For rankings, prefer timeframe over topic keywords (more likely to match)
        if (query.params.timeframe) {
          keywords.push(query.params.timeframe);
        } else if (query.params.topic) {
          // Fallback: use first 2-3 meaningful words from topic
          const topicWords = query.params.topic.split(' ');
          const meaningfulWords = topicWords.filter(word => word.length > 3);
          keywords.push(...meaningfulWords.slice(0, 2));
        }
        if (query.params.region && query.params.region !== 'Afrique') {
          // Only add region if it's specific (not generic "Afrique")
          keywords.push(query.params.region);
        }
        break;
    }

    // Remove duplicates and empty strings
    return [...new Set(keywords.filter(Boolean))];
  }

  /**
   * Extract text content from WordPress post
   */
  private extractContent(post: WordPressPost): string {
    const title = post.title.rendered;

    // For RAG context, use shorter excerpts to fit more articles within token budget
    // Get first 250 characters of content (without HTML)
    const content = post.content.rendered
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 250);

    return `${title}\n${content}`;
  }

  /**
   * Calculate relevance score (0-100)
   * Higher score = more relevant to the query
   */
  relevanceScorer(item: ContextItem, query: RetrievalQuery): number {
    let score = 0;

    // Recency scoring (40 points max)
    const postDate = new Date(item.metadata.date);
    const daysSincePost = Math.floor(
      (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePost <= 1) score += 40;
    else if (daysSincePost <= 7) score += 30;
    else if (daysSincePost <= 30) score += 20;
    else if (daysSincePost <= 90) score += 10;
    else score += 5;

    // Keyword matching (40 points max)
    const keywords = this.extractKeywords(query);
    const contentLower = item.content.toLowerCase();

    let matchCount = 0;
    for (const keyword of keywords) {
      if (contentLower.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;
    score += Math.floor(matchRatio * 40);

    // Title match bonus (20 points max)
    const titleLower = item.metadata.title.toLowerCase();
    let titleMatches = 0;
    for (const keyword of keywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        titleMatches++;
      }
    }

    if (titleMatches > 0) {
      score += Math.min(titleMatches * 10, 20);
    }

    return Math.min(score, 100);
  }

  /**
   * Estimate token count for context item
   * Rough estimation: 1 token ≈ 4 characters
   */
  tokenEstimator(item: ContextItem): number {
    const contentLength = item.content.length;
    return Math.ceil(contentLength / 4);
  }
}

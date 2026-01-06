/**
 * Trending Articles Context Retriever - Fetches popular articles based on view counts
 *
 * Sources: Visit tracking database (wp_afriquesports_visits)
 * Data: Most-viewed articles in the last 7 days
 */

import { getTrendingPostsByRange, TrendingPost } from '@/lib/mysql-db';
import { DataFetcher, WordPressPost } from '@/lib/data-fetcher';
import {
  ContextSource,
  ContextItem,
  RetrievalQuery,
} from '../types';

export class TrendingRetriever implements ContextSource {
  name = 'trending';

  /**
   * Fetch trending articles for context
   */
  async fetch(query: RetrievalQuery): Promise<ContextItem[]> {
    try {
      // Fetch top 10 trending posts from last 7 days
      const trendingPosts = await getTrendingPostsByRange(7, 10, query.locale);

      if (trendingPosts.length === 0) {
        return [];
      }

      // Convert trending posts to context items
      const contextItems: ContextItem[] = await this.convertToContextItems(
        trendingPosts,
        query
      );

      // Score and add token estimates
      const scoredItems = contextItems.map((item) => ({
        ...item,
        relevanceScore: this.relevanceScorer(item, query),
        tokenCount: this.tokenEstimator(item),
      }));

      // Sort by relevance (descending)
      scoredItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      return scoredItems;
    } catch (error) {
      console.error('[TrendingRetriever] Error fetching trending articles:', error);
      return [];
    }
  }

  /**
   * Convert trending posts to context items with content
   */
  private async convertToContextItems(
    trendingPosts: TrendingPost[],
    query: RetrievalQuery
  ): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    // Fetch full post content for top 5 trending posts
    const topPosts = trendingPosts.slice(0, 5);

    for (const trendingPost of topPosts) {
      try {
        // Fetch full post from WordPress
        const post = await this.fetchPostById(trendingPost.post_id, query.locale);

        if (post) {
          const content = this.extractContent(post, trendingPost);
          contextItems.push({
            id: `trending-${trendingPost.post_id}`,
            source: 'trending',
            content,
            metadata: {
              postId: trendingPost.post_id,
              title: trendingPost.post_title,
              views: trendingPost.total_count,
              slug: trendingPost.post_slug,
              category: trendingPost.post_category,
            },
          });
        }
      } catch (error) {
        console.error(`[TrendingRetriever] Error fetching post ${trendingPost.post_id}:`, error);
        // Continue with next post
      }
    }

    return contextItems;
  }

  /**
   * Fetch WordPress post by ID
   */
  private async fetchPostById(postId: string, locale: string): Promise<WordPressPost | null> {
    try {
      const posts = await DataFetcher.getPosts({
        locale,
        perPage: 1,
        include: [parseInt(postId)],
      });

      return posts.length > 0 ? posts[0] : null;
    } catch (error) {
      console.error(`[TrendingRetriever] Error fetching post ${postId}:`, error);
      return null;
    }
  }

  /**
   * Extract text content from WordPress post and trending metadata
   */
  private extractContent(post: WordPressPost, trending: TrendingPost): string {
    const title = post.title.rendered;
    const views = trending.total_count;

    const excerpt = post.excerpt.rendered
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .trim();

    // Get first 400 characters of content (without HTML)
    const content = post.content.rendered
      .replace(/<[^>]+>/g, ' ') // Strip HTML tags
      .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .slice(0, 400);

    let text = `TRENDING ARTICLE (${views} views)\n\n`;
    text += `${title}\n\n`;
    text += `${excerpt}\n\n`;
    text += `${content}`;

    return text;
  }

  /**
   * Calculate relevance score (0-100)
   * Trending articles are relevant for understanding current topics
   */
  relevanceScorer(item: ContextItem, query: RetrievalQuery): number {
    const views = item.metadata.views || 0;

    // Base score from view count (logarithmic scale)
    // 1000 views = 40 points, 10000 views = 60 points, 100000 views = 80 points
    let score = Math.min(Math.log10(views) * 20, 80);

    // Keyword matching bonus (20 points max)
    if (query.keywords && query.keywords.length > 0) {
      const contentLower = item.content.toLowerCase();
      let matchCount = 0;

      for (const keyword of query.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      const matchRatio = matchCount / query.keywords.length;
      score += Math.floor(matchRatio * 20);
    }

    // Content type relevance
    if (query.contentType === 'news-article') {
      // Trending articles are highly relevant for news
      score += 10;
    } else if (query.contentType === 'match-preview' || query.contentType === 'match-report') {
      // Check if trending article is about the same teams
      const homeTeam = query.params.homeTeam?.toLowerCase();
      const awayTeam = query.params.awayTeam?.toLowerCase();
      const titleLower = item.metadata.title.toLowerCase();

      if (homeTeam && titleLower.includes(homeTeam)) {
        score += 15;
      }
      if (awayTeam && titleLower.includes(awayTeam)) {
        score += 15;
      }
    } else if (query.contentType === 'player-profile') {
      // Check if trending article is about the same player
      const playerName = query.params.playerName?.toLowerCase();
      const titleLower = item.metadata.title.toLowerCase();

      if (playerName && titleLower.includes(playerName)) {
        score += 20;
      }
    } else if (query.contentType === 'ranking') {
      // Trending articles provide context for rankings
      const topic = query.params.topic?.toLowerCase();
      const titleLower = item.metadata.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      // Check if trending article relates to ranking topic
      if (topic) {
        const topicWords = topic.split(' ');
        let matchCount = 0;
        for (const word of topicWords) {
          if (word.length > 3 && (titleLower.includes(word) || contentLower.includes(word))) {
            matchCount++;
          }
        }
        if (matchCount > 0) {
          score += Math.min(matchCount * 5, 15);
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Estimate token count for context item
   */
  tokenEstimator(item: ContextItem): number {
    const contentLength = item.content.length;
    return Math.ceil(contentLength / 4);
  }
}

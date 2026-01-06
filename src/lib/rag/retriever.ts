/**
 * Context Retriever - Orchestrates context retrieval from multiple sources
 *
 * Responsibilities:
 * 1. Fetch context from all sources in parallel
 * 2. Score and rank context items by relevance
 * 3. Select items within token budget
 * 4. Return optimal context for generation
 */

import {
  ContextSource,
  ContextItem,
  RetrievalQuery,
} from './types';
import { WordPressRetriever } from './sources/wordpress-retriever';
import { ESPNRetriever } from './sources/espn-retriever';
import { MySQLRetriever } from './sources/mysql-retriever';
import { TrendingRetriever } from './sources/trending-retriever';

export class ContextRetriever {
  private sources: ContextSource[];

  constructor() {
    // Initialize all context sources
    this.sources = [
      new WordPressRetriever(),
      new ESPNRetriever(),
      new MySQLRetriever(),
      new TrendingRetriever(),
    ];
  }

  /**
   * Retrieve context from all sources and select best items within token budget
   *
   * @param query - Retrieval query with content type, locale, and parameters
   * @param tokenBudget - Maximum tokens allowed for context (default: 4000)
   * @returns Array of context items sorted by relevance
   */
  async retrieve(
    query: RetrievalQuery,
    tokenBudget: number = 4000
  ): Promise<ContextItem[]> {
    console.log('[ContextRetriever] Starting retrieval:', {
      contentType: query.contentType,
      locale: query.locale,
      tokenBudget,
    });

    try {
      // Fetch from all sources in parallel
      const startTime = Date.now();
      const results = await Promise.allSettled(
        this.sources.map((source) => this.fetchFromSource(source, query))
      );

      const fetchDuration = Date.now() - startTime;
      console.log(`[ContextRetriever] Fetched from ${this.sources.length} sources in ${fetchDuration}ms`);

      // Collect all successful results
      const allItems: ContextItem[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const items = result.value;
          allItems.push(...items);
          console.log(`[ContextRetriever] ${this.sources[index].name}: ${items.length} items`);
        } else {
          console.error(`[ContextRetriever] ${this.sources[index].name} failed:`, result.reason);
        }
      });

      if (allItems.length === 0) {
        console.warn('[ContextRetriever] No context items retrieved');
        return [];
      }

      // Sort by relevance score (descending)
      allItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      console.log(`[ContextRetriever] Total items retrieved: ${allItems.length}`);
      console.log(
        '[ContextRetriever] Top 5 relevance scores:',
        allItems.slice(0, 5).map((item) => ({
          source: item.source,
          score: item.relevanceScore,
          tokens: item.tokenCount,
        }))
      );

      // Select items within token budget
      const selectedItems = this.selectWithinBudget(allItems, tokenBudget);

      const totalTokens = selectedItems.reduce((sum, item) => sum + (item.tokenCount || 0), 0);
      console.log('[ContextRetriever] Selected items:', {
        count: selectedItems.length,
        totalTokens,
        budget: tokenBudget,
        utilization: `${Math.round((totalTokens / tokenBudget) * 100)}%`,
      });

      return selectedItems;
    } catch (error) {
      console.error('[ContextRetriever] Error during retrieval:', error);
      return [];
    }
  }

  /**
   * Fetch context from a single source with error handling
   */
  private async fetchFromSource(
    source: ContextSource,
    query: RetrievalQuery
  ): Promise<ContextItem[]> {
    try {
      const items = await source.fetch(query);
      return items;
    } catch (error) {
      console.error(`[ContextRetriever] Error fetching from ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Select context items within token budget using greedy algorithm
   * Prioritizes high-relevance items first
   */
  private selectWithinBudget(
    items: ContextItem[],
    budget: number
  ): ContextItem[] {
    const selected: ContextItem[] = [];
    let tokensUsed = 0;

    // Greedy selection: pick highest relevance items that fit
    for (const item of items) {
      const itemTokens = item.tokenCount || 0;

      // Check if adding this item would exceed budget
      if (tokensUsed + itemTokens <= budget) {
        selected.push(item);
        tokensUsed += itemTokens;
      } else {
        // Budget exceeded - check if we should stop or try smaller items
        const remainingBudget = budget - tokensUsed;

        // If remaining budget is less than 100 tokens, stop
        if (remainingBudget < 100) {
          break;
        }

        // Otherwise, continue checking for smaller items
      }
    }

    return selected;
  }

  /**
   * Get summary statistics about retrieved context
   */
  getStatistics(items: ContextItem[]): {
    totalItems: number;
    totalTokens: number;
    sourceBreakdown: Record<string, number>;
    avgRelevanceScore: number;
  } {
    const totalItems = items.length;
    const totalTokens = items.reduce((sum, item) => sum + (item.tokenCount || 0), 0);
    const totalRelevance = items.reduce((sum, item) => sum + (item.relevanceScore || 0), 0);

    const sourceBreakdown: Record<string, number> = {};
    items.forEach((item) => {
      sourceBreakdown[item.source] = (sourceBreakdown[item.source] || 0) + 1;
    });

    return {
      totalItems,
      totalTokens,
      sourceBreakdown,
      avgRelevanceScore: totalItems > 0 ? totalRelevance / totalItems : 0,
    };
  }
}

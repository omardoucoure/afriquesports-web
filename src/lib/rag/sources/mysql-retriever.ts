/**
 * MySQL Database Context Retriever - Fetches match data from MySQL database
 *
 * Sources: MySQL database with match commentary, pre-match analysis, and match reports
 * Tables: wp_match_commentary, wp_match_prematch_analysis
 */

import {
  getMatchCommentary,
  getPreMatchAnalysis,
  MatchCommentary,
  PreMatchAnalysis,
} from '@/lib/mysql-match-db';
import {
  ContextSource,
  ContextItem,
  RetrievalQuery,
} from '../types';

export class MySQLRetriever implements ContextSource {
  name = 'mysql';

  /**
   * Fetch relevant match data from MySQL database
   */
  async fetch(query: RetrievalQuery): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    try {
      // Fetch based on content type
      switch (query.contentType) {
        case 'match-preview':
          await this.fetchPreMatchContext(query, contextItems);
          break;

        case 'match-report':
          await this.fetchMatchReportContext(query, contextItems);
          break;

        case 'player-profile':
        case 'news-article':
        case 'ranking':
          // Less relevant for these types, but can provide supporting data
          break;
      }

      // Score and add token estimates
      const scoredItems = contextItems.map((item) => ({
        ...item,
        relevanceScore: this.relevanceScorer(item, query),
        tokenCount: this.tokenEstimator(item),
      }));

      return scoredItems;
    } catch (error) {
      console.error('[MySQLRetriever] Error fetching MySQL data:', error);
      return [];
    }
  }

  /**
   * Fetch pre-match analysis context
   */
  private async fetchPreMatchContext(
    query: RetrievalQuery,
    contextItems: ContextItem[]
  ): Promise<void> {
    const matchId = query.params.matchId;

    if (!matchId) {
      console.warn('[MySQLRetriever] No matchId provided for pre-match context');
      return;
    }

    try {
      const analysis = await getPreMatchAnalysis(matchId, query.locale);

      if (analysis) {
        const analysisContext = this.formatPreMatchAnalysis(analysis);
        contextItems.push({
          id: `mysql-prematch-${matchId}`,
          source: 'mysql',
          content: analysisContext,
          metadata: {
            type: 'pre-match-analysis',
            matchId,
            homeTeam: analysis.home_team,
            awayTeam: analysis.away_team,
          },
        });
      }
    } catch (error) {
      console.error('[MySQLRetriever] Error fetching pre-match analysis:', error);
    }
  }

  /**
   * Fetch match report context (commentary)
   */
  private async fetchMatchReportContext(
    query: RetrievalQuery,
    contextItems: ContextItem[]
  ): Promise<void> {
    const matchId = query.params.matchId;

    if (!matchId) {
      console.warn('[MySQLRetriever] No matchId provided for match report context');
      return;
    }

    try {
      const commentary = await getMatchCommentary(matchId, query.locale);

      if (commentary.length > 0) {
        // Get key events (goals, cards, substitutions)
        const keyEvents = commentary.filter(
          (c) => c.is_scoring || c.type === 'goal' || c.type === 'card' || c.type === 'substitution'
        );

        // Also get general commentary (top 10)
        const generalCommentary = commentary.slice(0, 10);

        // Combine and format
        const allCommentary = [...new Set([...keyEvents, ...generalCommentary])];
        const commentaryContext = this.formatMatchCommentary(allCommentary);

        contextItems.push({
          id: `mysql-commentary-${matchId}`,
          source: 'mysql',
          content: commentaryContext,
          metadata: {
            type: 'match-commentary',
            matchId,
            eventCount: commentary.length,
          },
        });
      }
    } catch (error) {
      console.error('[MySQLRetriever] Error fetching match commentary:', error);
    }
  }

  /**
   * Format pre-match analysis as readable text
   */
  private formatPreMatchAnalysis(analysis: PreMatchAnalysis): string {
    let text = `Pre-Match Analysis: ${analysis.home_team} vs ${analysis.away_team}\n\n`;

    if (analysis.head_to_head) {
      text += `Head-to-Head:\n${analysis.head_to_head}\n\n`;
    }

    if (analysis.recent_form) {
      text += `Recent Form:\n${analysis.recent_form}\n\n`;
    }

    if (analysis.tactical_preview) {
      text += `Tactical Preview:\n${analysis.tactical_preview}\n\n`;
    }

    if (analysis.key_players) {
      text += `Key Players:\n`;
      if (typeof analysis.key_players === 'object') {
        text += JSON.stringify(analysis.key_players, null, 2);
      } else {
        text += analysis.key_players;
      }
      text += '\n\n';
    }

    if (analysis.prediction) {
      text += `Prediction:\n${analysis.prediction}\n\n`;
    }

    if (analysis.home_formation && analysis.away_formation) {
      text += `Formations: ${analysis.home_formation} vs ${analysis.away_formation}\n`;
    }

    return text.trim();
  }

  /**
   * Format match commentary as readable text
   */
  private formatMatchCommentary(commentary: MatchCommentary[]): string {
    let text = 'Match Commentary:\n\n';

    // Sort by time (descending - most recent first)
    const sortedCommentary = [...commentary].sort(
      (a, b) => b.time_seconds - a.time_seconds
    );

    for (const event of sortedCommentary) {
      text += `[${event.time}] `;

      if (event.player_name) {
        text += `${event.player_name} `;
      }

      if (event.team) {
        text += `(${event.team}) `;
      }

      text += `- ${event.text}`;

      if (event.is_scoring) {
        text += ' ⚽';
      }

      text += '\n';
    }

    return text.trim();
  }

  /**
   * Calculate relevance score (0-100)
   * MySQL data is highly relevant for match-specific content
   */
  relevanceScorer(item: ContextItem, query: RetrievalQuery): number {
    // Pre-match analysis is crucial for match previews
    if (
      query.contentType === 'match-preview' &&
      item.metadata.type === 'pre-match-analysis'
    ) {
      return 100;
    }

    // Commentary is crucial for match reports
    if (
      query.contentType === 'match-report' &&
      item.metadata.type === 'match-commentary'
    ) {
      return 100;
    }

    // Default score for other cases
    return 50;
  }

  /**
   * Estimate token count for context item
   */
  tokenEstimator(item: ContextItem): number {
    const contentLength = item.content.length;
    return Math.ceil(contentLength / 4);
  }
}

/**
 * ESPN API Context Retriever - Fetches live match data and statistics
 *
 * Sources: ESPN public API for AFCON and other competitions
 * Data: Live scores, standings, player statistics, match events
 */

import {
  fetchAFCONStatistics,
  fetchAFCONScoreboard,
  AFCONScorer,
} from '@/lib/espn-api';
import {
  ContextSource,
  ContextItem,
  RetrievalQuery,
} from '../types';

export class ESPNRetriever implements ContextSource {
  name = 'espn';

  /**
   * Fetch relevant ESPN data for context
   */
  async fetch(query: RetrievalQuery): Promise<ContextItem[]> {
    const contextItems: ContextItem[] = [];

    try {
      // Fetch based on content type
      switch (query.contentType) {
        case 'match-preview':
        case 'match-report':
          await this.fetchMatchContext(query, contextItems);
          break;

        case 'player-profile':
          await this.fetchPlayerContext(query, contextItems);
          break;

        case 'news-article':
          // General news may include recent stats as context
          await this.fetchGeneralContext(query, contextItems);
          break;

        case 'ranking':
          // Rankings may benefit from recent stats and standings
          await this.fetchGeneralContext(query, contextItems);
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
      console.error('[ESPNRetriever] Error fetching ESPN data:', error);
      return [];
    }
  }

  /**
   * Fetch match-related context (scoreboard, standings)
   */
  private async fetchMatchContext(
    query: RetrievalQuery,
    contextItems: ContextItem[]
  ): Promise<void> {
    try {
      // Fetch scoreboard for live/recent matches
      const scoreboard = await fetchAFCONScoreboard();

      if (scoreboard?.events) {
        const relevantMatches = this.filterRelevantMatches(
          scoreboard.events,
          query
        );

        for (const match of relevantMatches) {
          const matchContext = this.formatMatchData(match);
          contextItems.push({
            id: `espn-match-${match.id}`,
            source: 'espn',
            content: matchContext,
            metadata: {
              type: 'match',
              matchId: match.id,
              status: match.status?.type?.description || 'unknown',
            },
          });
        }
      }

      // Fetch top scorers for context
      const stats = await fetchAFCONStatistics();
      if (stats.scorers.length > 0) {
        const scorersContext = this.formatScorersData(stats.scorers.slice(0, 5));
        contextItems.push({
          id: 'espn-top-scorers',
          source: 'espn',
          content: scorersContext,
          metadata: {
            type: 'statistics',
            category: 'scorers',
          },
        });
      }
    } catch (error) {
      console.error('[ESPNRetriever] Error fetching match context:', error);
    }
  }

  /**
   * Fetch player-related context (statistics, performance)
   */
  private async fetchPlayerContext(
    query: RetrievalQuery,
    contextItems: ContextItem[]
  ): Promise<void> {
    try {
      const stats = await fetchAFCONStatistics();
      const playerName = query.params.playerName?.toLowerCase();

      // Find player in scorers
      const playerStats = stats.scorers.find(
        (scorer) => scorer.name.toLowerCase().includes(playerName)
      );

      if (playerStats) {
        const playerContext = this.formatPlayerData(playerStats);
        contextItems.push({
          id: `espn-player-${playerStats.name}`,
          source: 'espn',
          content: playerContext,
          metadata: {
            type: 'player',
            playerName: playerStats.name,
            team: playerStats.team,
          },
        });
      }

      // Also check assist leaders
      const assistPlayer = stats.assistLeaders.find(
        (scorer) => scorer.name.toLowerCase().includes(playerName)
      );

      if (assistPlayer && assistPlayer.name !== playerStats?.name) {
        const assistContext = this.formatPlayerData(assistPlayer);
        contextItems.push({
          id: `espn-player-assists-${assistPlayer.name}`,
          source: 'espn',
          content: assistContext,
          metadata: {
            type: 'player',
            playerName: assistPlayer.name,
            team: assistPlayer.team,
          },
        });
      }
    } catch (error) {
      console.error('[ESPNRetriever] Error fetching player context:', error);
    }
  }

  /**
   * Fetch general context (recent standings, top performers)
   */
  private async fetchGeneralContext(
    query: RetrievalQuery,
    contextItems: ContextItem[]
  ): Promise<void> {
    try {
      const stats = await fetchAFCONStatistics();

      // Top 3 scorers
      if (stats.scorers.length > 0) {
        const scorersContext = this.formatScorersData(stats.scorers.slice(0, 3));
        contextItems.push({
          id: 'espn-general-scorers',
          source: 'espn',
          content: scorersContext,
          metadata: {
            type: 'statistics',
            category: 'top-scorers',
          },
        });
      }
    } catch (error) {
      console.error('[ESPNRetriever] Error fetching general context:', error);
    }
  }

  /**
   * Filter matches relevant to the query
   */
  private filterRelevantMatches(events: any[], query: RetrievalQuery): any[] {
    const homeTeam = query.params.homeTeam?.toLowerCase();
    const awayTeam = query.params.awayTeam?.toLowerCase();

    if (!homeTeam && !awayTeam) {
      return events.slice(0, 3); // Return recent matches
    }

    return events.filter((event) => {
      const competitors = event.competitions?.[0]?.competitors || [];
      const teamNames = competitors.map((c: any) =>
        c.team?.displayName?.toLowerCase()
      );

      return (
        teamNames.some((name: string) => name?.includes(homeTeam)) ||
        teamNames.some((name: string) => name?.includes(awayTeam))
      );
    });
  }

  /**
   * Format match data as readable text
   */
  private formatMatchData(match: any): string {
    const competition = match.competitions?.[0];
    const competitors = competition?.competitors || [];
    const status = match.status?.type?.description || 'Scheduled';

    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

    const homeScore = homeTeam?.score || '0';
    const awayScore = awayTeam?.score || '0';
    const homeName = homeTeam?.team?.displayName || 'Unknown';
    const awayName = awayTeam?.team?.displayName || 'Unknown';

    let text = `Match: ${homeName} vs ${awayName}\n`;
    text += `Score: ${homeScore} - ${awayScore}\n`;
    text += `Status: ${status}\n`;

    if (match.date) {
      text += `Date: ${new Date(match.date).toLocaleString()}\n`;
    }

    return text;
  }

  /**
   * Format scorers data as readable text
   */
  private formatScorersData(scorers: AFCONScorer[]): string {
    let text = 'Top Scorers:\n\n';

    for (const scorer of scorers) {
      text += `${scorer.rank}. ${scorer.name} (${scorer.country})\n`;
      text += `   Goals: ${scorer.goals} | Assists: ${scorer.assists} | Matches: ${scorer.matches}\n`;
      if (scorer.team) {
        text += `   Team: ${scorer.team}\n`;
      }
      text += '\n';
    }

    return text;
  }

  /**
   * Format player data as readable text
   */
  private formatPlayerData(player: AFCONScorer): string {
    let text = `Player: ${player.name}\n`;
    text += `Country: ${player.country}\n`;
    if (player.team) {
      text += `Team: ${player.team}\n`;
    }
    text += `Goals: ${player.goals}\n`;
    text += `Assists: ${player.assists}\n`;
    text += `Matches Played: ${player.matches}\n`;
    if (player.minutesPlayed) {
      text += `Minutes Played: ${player.minutesPlayed}\n`;
    }

    return text;
  }

  /**
   * Calculate relevance score (0-100)
   * ESPN data is always highly relevant for match-related content
   */
  relevanceScorer(item: ContextItem, query: RetrievalQuery): number {
    // ESPN data is highly relevant for match content
    if (query.contentType === 'match-preview' || query.contentType === 'match-report') {
      return 100;
    }

    // Player profiles benefit from ESPN stats
    if (query.contentType === 'player-profile') {
      return 90;
    }

    // General news may use ESPN stats as supporting data
    return 70;
  }

  /**
   * Estimate token count for context item
   */
  tokenEstimator(item: ContextItem): number {
    const contentLength = item.content.length;
    return Math.ceil(contentLength / 4);
  }
}

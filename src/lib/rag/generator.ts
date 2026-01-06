/**
 * Content Generator - Main RAG pipeline for content generation
 *
 * Pipeline:
 * 1. Health check Ollama
 * 2. Retrieve context from all sources
 * 3. Build prompt
 * 4. Generate content
 * 5. Post-process
 * 6. Return result with metadata
 */

import { OllamaClient } from './ollama-client';
import { ContextRetriever } from './retriever';
import { buildPrompt } from './prompts';
import {
  GenerationRequest,
  GenerationResult,
  RetrievalQuery,
} from './types';

export class ContentGenerator {
  private ollama: OllamaClient;
  private retriever: ContextRetriever;

  constructor() {
    this.ollama = new OllamaClient();
    this.retriever = new ContextRetriever();
  }

  /**
   * Generate content using RAG pipeline
   */
  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      console.log('[ContentGenerator] Starting generation:', {
        contentType: request.contentType,
        locale: request.locale,
      });

      // Step 1: Health check
      console.log('[ContentGenerator] Checking Ollama health...');
      const isHealthy = await this.ollama.healthCheck();

      if (!isHealthy) {
        return {
          success: false,
          error: `Ollama not available at ${this.ollama.getEndpoint()}. Please ensure Ollama is running on the iMac.`,
        };
      }

      console.log('[ContentGenerator] ✓ Ollama is healthy');

      // Step 2: Retrieve context
      console.log('[ContentGenerator] Retrieving context...');
      const query: RetrievalQuery = {
        contentType: request.contentType,
        locale: request.locale,
        params: request.params,
        keywords: this.extractKeywords(request),
      };

      const contextItems = await this.retriever.retrieve(query, 4000);

      if (contextItems.length === 0) {
        return {
          success: false,
          error: 'No relevant context found. Unable to generate content without data.',
        };
      }

      const stats = this.retriever.getStatistics(contextItems);
      console.log('[ContentGenerator] Context retrieved:', stats);

      // Step 3: Build prompt
      console.log('[ContentGenerator] Building prompt...');
      const prompt = buildPrompt(
        request.contentType,
        contextItems,
        request.params,
        request.locale
      );

      console.log('[ContentGenerator] Prompt built:', {
        systemLength: prompt.system.length,
        userLength: prompt.user.length,
        temperature: prompt.temperature,
        maxTokens: prompt.maxTokens,
      });

      // Step 4: Generate content
      console.log('[ContentGenerator] Generating content with Ollama...');
      const generation = await this.ollama.generate(
        prompt.user,
        prompt.system,
        {
          temperature: prompt.temperature,
          max_tokens: prompt.maxTokens,
        }
      );

      console.log('[ContentGenerator] ✓ Content generated:', {
        tokensGenerated: generation.metadata.tokensGenerated,
        durationMs: generation.metadata.durationMs,
        tokensPerSecond: Math.round(generation.metadata.tokensPerSecond),
      });

      // Step 5: Post-process
      console.log('[ContentGenerator] Post-processing content...');
      const processedContent = this.postProcess(generation.response);

      const totalDuration = Date.now() - startTime;

      return {
        success: true,
        content: processedContent,
        metadata: {
          contextItemsUsed: contextItems.length,
          totalTokensContext: stats.totalTokens,
          generationTokens: generation.metadata.tokensGenerated,
          durationMs: totalDuration,
          tokensPerSecond: generation.metadata.tokensPerSecond,
          sources: Object.keys(stats.sourceBreakdown) as any[],
        },
      };
    } catch (error) {
      console.error('[ContentGenerator] Error during generation:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Extract keywords from generation request
   */
  private extractKeywords(request: GenerationRequest): string[] {
    const keywords: string[] = [];

    switch (request.contentType) {
      case 'match-preview':
      case 'match-report':
        if ('homeTeam' in request.params && request.params.homeTeam) keywords.push(request.params.homeTeam);
        if ('awayTeam' in request.params && request.params.awayTeam) keywords.push(request.params.awayTeam);
        if ('competition' in request.params && request.params.competition) keywords.push(request.params.competition);
        break;

      case 'news-article':
        if ('topic' in request.params && request.params.topic) keywords.push(request.params.topic);
        if ('keywords' in request.params && request.params.keywords) keywords.push(...request.params.keywords);
        break;

      case 'player-profile':
        if ('playerName' in request.params && request.params.playerName) keywords.push(request.params.playerName);
        if ('team' in request.params && request.params.team) keywords.push(request.params.team);
        break;

      case 'ranking':
        if ('topic' in request.params && request.params.topic) keywords.push(request.params.topic);
        break;
    }

    return keywords;
  }

  /**
   * Post-process generated content
   * - Remove AI artifacts ("Voici l'article", etc.)
   * - Add HTML paragraph tags
   * - Clean up formatting
   */
  private postProcess(content: string): string {
    let processed = content.trim();

    // Remove common AI artifacts (multi-language)
    const artifacts = [
      /^(Voici|Here is|Aquí está|هذا هو)\s*(l['']article|le résumé|the article|the summary|the report|el artículo|المقال).*?[:\.]\s*/i,
      /^(Je vous présente|I present|Les presento).*?[:\.]\s*/i,
      /^(Cet article|This article|Este artículo).*?[:\.]\s*/i,
    ];

    for (const pattern of artifacts) {
      processed = processed.replace(pattern, '');
    }

    // Split into paragraphs (double newline or more)
    const paragraphs = processed
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Wrap each paragraph in <p> tags
    const htmlContent = paragraphs.map((p) => `<p>${p}</p>`).join('\n\n');

    return htmlContent;
  }

  /**
   * Get Ollama endpoint URL
   */
  getEndpoint(): string {
    return this.ollama.getEndpoint();
  }

  /**
   * Get Ollama model name
   */
  getModel(): string {
    return this.ollama.getModel();
  }
}

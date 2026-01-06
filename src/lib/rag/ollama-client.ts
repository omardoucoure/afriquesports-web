/**
 * Ollama Client - HTTP client for Ollama API running on iMac M3
 *
 * Connects to qwen2.5:14b model for RAG content generation
 * iMac specs: Apple M3, 8-core GPU, Metal acceleration
 */

export interface OllamaGenerateOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaListResponse {
  models: OllamaModel[];
}

export interface GenerationMetadata {
  model: string;
  tokensGenerated: number;
  tokensPrompt: number;
  durationMs: number;
  tokensPerSecond: number;
}

export class OllamaClient {
  private endpoint: string;
  private model: string;
  private timeout: number;

  constructor() {
    // iMac endpoint (local network)
    this.endpoint = process.env.OLLAMA_ENDPOINT || 'http://192.168.2.217:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:14b';
    this.timeout = 180000; // 3 minutes timeout for generation (rankings need more time)
  }

  /**
   * Health check - verify Ollama is running and model is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${this.endpoint}/api/tags`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[OllamaClient] Health check failed:', response.status);
        return false;
      }

      const data: OllamaListResponse = await response.json();
      const modelAvailable = data.models?.some((m) => m.name === this.model);

      if (!modelAvailable) {
        console.error(`[OllamaClient] Model ${this.model} not found`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[OllamaClient] Health check error:', error);
      return false;
    }
  }

  /**
   * Generate content using Ollama
   *
   * @param prompt - User prompt (context + instructions)
   * @param system - System prompt (role definition, rules)
   * @param options - Generation parameters
   * @returns Generated text and metadata
   */
  async generate(
    prompt: string,
    system: string,
    options: OllamaGenerateOptions = {}
  ): Promise<{ response: string; metadata: GenerationMetadata }> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system,
          stream: false, // Non-streaming for simplicity
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.max_tokens ?? 1000,
            top_p: options.top_p ?? 0.9,
            top_k: options.top_k ?? 40,
            repeat_penalty: options.repeat_penalty ?? 1.1,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();

      const durationMs = Date.now() - startTime;
      const tokensGenerated = data.eval_count ?? 0;
      const tokensPrompt = data.prompt_eval_count ?? 0;
      const tokensPerSecond = tokensGenerated / (durationMs / 1000);

      return {
        response: data.response,
        metadata: {
          model: this.model,
          tokensGenerated,
          tokensPrompt,
          durationMs,
          tokensPerSecond,
        },
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Generation timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * List all available models on Ollama server
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data: OllamaListResponse = await response.json();
      return data.models;
    } catch (error) {
      console.error('[OllamaClient] Error listing models:', error);
      return [];
    }
  }

  /**
   * Get current endpoint URL
   */
  getEndpoint(): string {
    return this.endpoint;
  }

  /**
   * Get current model name
   */
  getModel(): string {
    return this.model;
  }
}

/**
 * RunPod 70B + RAG Client
 *
 * Connects to RunPod pod running:
 * - Llama-3.1-70B-Instruct via vLLM (port 8000)
 * - RAG API with 23k articles (port 8100)
 */

class RunPod70BClient {
  constructor(options = {}) {
    // Default to environment variables or config
    this.podId = options.podId || process.env.RUNPOD_POD_ID || '';
    this.apiKey = options.apiKey || process.env.RUNPOD_API_KEY || 'sk-afrique';

    // Endpoints (will be set when pod ID is provided)
    this.vllmUrl = options.vllmUrl || '';
    this.ragUrl = options.ragUrl || '';

    // Model
    this.model = options.model || 'meta-llama/Llama-3.1-70B-Instruct';

    // If pod ID provided, construct URLs
    if (this.podId) {
      this.vllmUrl = `https://${this.podId}-8000.proxy.runpod.net`;
      this.ragUrl = `https://${this.podId}-8100.proxy.runpod.net`;
    }
  }

  /**
   * Set pod ID and update URLs
   */
  setPodId(podId) {
    this.podId = podId;
    this.vllmUrl = `https://${podId}-8000.proxy.runpod.net`;
    this.ragUrl = `https://${podId}-8100.proxy.runpod.net`;
  }

  /**
   * Check if both services are available
   */
  async isAvailable() {
    if (!this.vllmUrl || !this.ragUrl) {
      return { available: false, error: 'Pod ID not configured' };
    }

    try {
      const [vllmRes, ragRes] = await Promise.all([
        fetch(`${this.vllmUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) }),
        fetch(`${this.ragUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(5000) })
      ]);

      return {
        available: vllmRes.ok && ragRes.ok,
        vllm: vllmRes.ok,
        rag: ragRes.ok
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Get context from RAG for a query
   */
  async getContext(query, options = {}) {
    const { limit = 3, maxChars = 4000 } = options;

    const response = await fetch(`${this.ragUrl}/context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        limit,
        max_chars: maxChars
      })
    });

    if (!response.ok) {
      throw new Error(`RAG error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Search RAG for articles
   */
  async search(query, options = {}) {
    const { limit = 5, source = null } = options;

    const response = await fetch(`${this.ragUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit, source })
    });

    if (!response.ok) {
      throw new Error(`RAG search error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Generate text using vLLM
   */
  async generate(prompt, options = {}) {
    const {
      temperature = 0.7,
      maxTokens = 2000,
      topP = 0.9,
      systemPrompt = null
    } = options;

    const messages = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${this.vllmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`vLLM error (${response.status}): ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate with RAG context (main method)
   * Fetches relevant context from RAG, then generates with 70B
   */
  async generateWithRAG(prompt, options = {}) {
    const {
      ragQuery = null,  // Query for RAG (defaults to prompt)
      ragLimit = 3,
      ragMaxChars = 4000,
      includeContext = true,
      ...generateOptions
    } = options;

    let finalPrompt = prompt;

    // Get RAG context if enabled
    if (includeContext) {
      const query = ragQuery || prompt.substring(0, 500);

      try {
        const ragResult = await this.getContext(query, {
          limit: ragLimit,
          maxChars: ragMaxChars
        });

        if (ragResult.context) {
          finalPrompt = `CONTEXTE (articles de reference):\n${ragResult.context}\n\n---\n\n${prompt}`;
        }
      } catch (error) {
        console.warn(`RAG context failed: ${error.message}, proceeding without context`);
      }
    }

    return await this.generate(finalPrompt, generateOptions);
  }

  /**
   * Get RAG stats
   */
  async getRagStats() {
    const response = await fetch(`${this.ragUrl}/stats`);
    if (!response.ok) {
      throw new Error(`RAG stats error: ${response.status}`);
    }
    return await response.json();
  }
}

module.exports = RunPod70BClient;

/**
 * vLLM HTTP API Client
 *
 * Uses vLLM's OpenAI-compatible API to generate content
 */

class VLLMClient {
  constructor(baseUrl = 'https://qbjo7w9adplhia-8000.proxy.runpod.net', apiKey = 'sk-1234') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = 'oxmo88/Qwen2.5-VL-7B-AFCON2025';
  }

  /**
   * Generate content using vLLM
   * @param {string} prompt - The prompt to send
   * @param {object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    const {
      temperature = 0.7,
      max_tokens = 2048,
      top_p = 0.9,
      frequency_penalty = 0.0,
      presence_penalty = 0.0,
    } = options;

    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`vLLM API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Check if vLLM server is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server info
   * @returns {Promise<object>}
   */
  async getInfo() {
    const response = await fetch(`${this.baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.status}`);
    }

    return await response.json();
  }
}

module.exports = VLLMClient;

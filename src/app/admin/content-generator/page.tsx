'use client';

/**
 * RAG Content Generator - Admin UI
 *
 * Features:
 * - Content type selector (4 types)
 * - Locale selector (FR/EN/ES/AR)
 * - Dynamic form fields
 * - Real-time generation with progress
 * - Content preview
 * - One-click WordPress draft publishing
 * - Generation metadata display
 */

import { useState } from 'react';

type ContentType = 'match-preview' | 'match-report' | 'news-article' | 'player-profile' | 'ranking';
type Locale = 'fr' | 'en' | 'es' | 'ar';

interface GenerationMetadata {
  contextItemsUsed: number;
  totalTokensContext: number;
  generationTokens: number;
  durationMs: number;
  tokensPerSecond: number;
  sources: string[];
}

export default function ContentGeneratorPage() {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');

  // Form state
  const [contentType, setContentType] = useState<ContentType>('match-preview');
  const [locale, setLocale] = useState<Locale>('fr');
  const [formParams, setFormParams] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [metadata, setMetadata] = useState<GenerationMetadata | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login handler
  const handleLogin = () => {
    if (tokenInput.trim()) {
      setAdminToken(tokenInput);
      setIsAuthenticated(true);
      setTokenInput('');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminToken('');
    setGeneratedContent('');
    setMetadata(null);
  };

  // Generate content
  const handleGenerate = async () => {
    setError('');
    setSuccess('');
    setIsGenerating(true);
    setGeneratedContent('');
    setMetadata(null);

    try {
      // Validate params
      const validation = validateParams(contentType, formParams);
      if (!validation.valid) {
        setError(validation.error!);
        setIsGenerating(false);
        return;
      }

      const response = await fetch('/api/rag/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          contentType,
          locale,
          params: formParams,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedContent(result.content);
        setMetadata(result.metadata);
        setSuccess('Content generated successfully!');
      } else {
        setError(result.error || 'Generation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish as draft
  const handlePublishDraft = async () => {
    if (!generatedContent) {
      setError('No content to publish');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title before publishing');
      return;
    }

    setError('');
    setSuccess('');
    setIsPublishing(true);

    try {
      const categoryIds = categories
        .split(',')
        .map((c) => parseInt(c.trim()))
        .filter((c) => !isNaN(c));

      const response = await fetch('/api/rag/publish-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title,
          content: generatedContent,
          locale,
          categories: categoryIds,
          metadata: {
            contentType,
            generatedAt: new Date().toISOString(),
            model: 'qwen2.5:14b',
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(
          `Draft published! Post ID: ${result.postId}. Edit at: ${result.editLink}`
        );
      } else {
        setError(result.error || 'Publishing failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Clear form
  const handleClear = () => {
    setGeneratedContent('');
    setMetadata(null);
    setError('');
    setSuccess('');
    setTitle('');
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">RAG Content Generator</h1>
          <p className="text-gray-600 mb-4 text-center">
            Enter your admin token to access the content generator
          </p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Admin Token"
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">RAG Content Generator</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Configuration */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Configuration</h2>

            {/* Content Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Content Type</label>
              <select
                value={contentType}
                onChange={(e) => {
                  setContentType(e.target.value as ContentType);
                  setFormParams({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="match-preview">Match Preview</option>
                <option value="match-report">Match Report</option>
                <option value="news-article">News Article</option>
                <option value="player-profile">Player Profile</option>
                <option value="ranking">Ranking / Top List</option>
              </select>
            </div>

            {/* Locale */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="fr">French (FR)</option>
                <option value="en">English (EN)</option>
                <option value="es">Spanish (ES)</option>
                <option value="ar">Arabic (AR)</option>
              </select>
            </div>

            {/* Dynamic Form Fields */}
            <DynamicFormFields
              contentType={contentType}
              params={formParams}
              onChange={setFormParams}
            />

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-green-600 text-white px-6 py-3 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </button>

            {/* Error/Success Messages */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                {success}
              </div>
            )}
          </div>

          {/* Right Column: Generated Content */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Generated Content</h2>

            {generatedContent ? (
              <>
                {/* Title Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Categories Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Categories (comma-separated IDs)
                  </label>
                  <input
                    type="text"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    placeholder="e.g., 102205, 121425"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Content Preview */}
                <div
                  className="mb-4 p-4 border border-gray-200 rounded max-h-96 overflow-y-auto prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handlePublishDraft}
                    disabled={isPublishing}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isPublishing ? 'Publishing...' : 'Publish as Draft'}
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Clear
                  </button>
                </div>

                {/* Metadata */}
                {metadata && (
                  <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
                    <h3 className="font-semibold mb-2">Generation Metadata</h3>
                    <ul className="space-y-1 text-gray-700">
                      <li>Duration: {(metadata.durationMs / 1000).toFixed(1)}s</li>
                      <li>Context Items: {metadata.contextItemsUsed}</li>
                      <li>Context Tokens: {metadata.totalTokensContext}</li>
                      <li>Generated Tokens: {metadata.generationTokens}</li>
                      <li>Speed: {metadata.tokensPerSecond.toFixed(1)} tokens/s</li>
                      <li>Sources: {metadata.sources.join(', ')}</li>
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No content generated yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic form fields component
function DynamicFormFields({
  contentType,
  params,
  onChange,
}: {
  contentType: ContentType;
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
}) {
  const updateParam = (key: string, value: any) => {
    onChange({ ...params, [key]: value });
  };

  switch (contentType) {
    case 'match-preview':
      return (
        <>
          <FormField
            label="Home Team *"
            value={params.homeTeam || ''}
            onChange={(v) => updateParam('homeTeam', v)}
            placeholder="e.g., Senegal"
          />
          <FormField
            label="Away Team *"
            value={params.awayTeam || ''}
            onChange={(v) => updateParam('awayTeam', v)}
            placeholder="e.g., Cameroon"
          />
          <FormField
            label="Competition *"
            value={params.competition || ''}
            onChange={(v) => updateParam('competition', v)}
            placeholder="e.g., CAN 2025"
          />
          <FormField
            label="Match Date *"
            type="date"
            value={params.matchDate || ''}
            onChange={(v) => updateParam('matchDate', v)}
          />
          <FormField
            label="Match ID (optional)"
            value={params.matchId || ''}
            onChange={(v) => updateParam('matchId', v)}
            placeholder="For MySQL context"
          />
        </>
      );

    case 'match-report':
      return (
        <>
          <FormField
            label="Home Team *"
            value={params.homeTeam || ''}
            onChange={(v) => updateParam('homeTeam', v)}
            placeholder="e.g., Senegal"
          />
          <FormField
            label="Away Team *"
            value={params.awayTeam || ''}
            onChange={(v) => updateParam('awayTeam', v)}
            placeholder="e.g., Cameroon"
          />
          <FormField
            label="Score *"
            value={params.score || ''}
            onChange={(v) => updateParam('score', v)}
            placeholder="e.g., 2-1"
          />
          <FormField
            label="Competition *"
            value={params.competition || ''}
            onChange={(v) => updateParam('competition', v)}
            placeholder="e.g., CAN 2025"
          />
          <FormField
            label="Match Date *"
            type="date"
            value={params.matchDate || ''}
            onChange={(v) => updateParam('matchDate', v)}
          />
          <FormField
            label="Match ID (optional)"
            value={params.matchId || ''}
            onChange={(v) => updateParam('matchId', v)}
            placeholder="For commentary"
          />
        </>
      );

    case 'news-article':
      return (
        <>
          <FormField
            label="Topic *"
            value={params.topic || ''}
            onChange={(v) => updateParam('topic', v)}
            placeholder="e.g., African football transfers"
          />
          <FormField
            label="Keywords (comma-separated) *"
            value={params.keywords?.join(', ') || ''}
            onChange={(v) =>
              updateParam(
                'keywords',
                v.split(',').map((k: string) => k.trim())
              )
            }
            placeholder="e.g., transfer, Salah, Liverpool"
          />
          <FormField
            label="Region (optional)"
            value={params.region || ''}
            onChange={(v) => updateParam('region', v)}
            placeholder="e.g., West Africa"
          />
        </>
      );

    case 'player-profile':
      return (
        <>
          <FormField
            label="Player Name *"
            value={params.playerName || ''}
            onChange={(v) => updateParam('playerName', v)}
            placeholder="e.g., Sadio Mané"
          />
          <FormField
            label="Team *"
            value={params.team || ''}
            onChange={(v) => updateParam('team', v)}
            placeholder="e.g., Al Nassr"
          />
          <FormField
            label="Position (optional)"
            value={params.position || ''}
            onChange={(v) => updateParam('position', v)}
            placeholder="e.g., Forward"
          />
          <FormField
            label="Nationality (optional)"
            value={params.nationality || ''}
            onChange={(v) => updateParam('nationality', v)}
            placeholder="e.g., Senegal"
          />
        </>
      );

    case 'ranking':
      return (
        <>
          <FormField
            label="Topic *"
            value={params.topic || ''}
            onChange={(v) => updateParam('topic', v)}
            placeholder="e.g., Top 10 African Footballers 2025"
          />
          <FormField
            label="Criteria *"
            value={params.criteria || ''}
            onChange={(v) => updateParam('criteria', v)}
            placeholder="e.g., Performance, goals, assists, impact"
          />
          <FormField
            label="Count (optional)"
            type="number"
            value={params.count || ''}
            onChange={(v) => updateParam('count', v ? parseInt(v) : undefined)}
            placeholder="e.g., 10 (number of items in ranking)"
          />
          <FormField
            label="Region (optional)"
            value={params.region || ''}
            onChange={(v) => updateParam('region', v)}
            placeholder="e.g., West Africa, North Africa"
          />
          <FormField
            label="Timeframe (optional)"
            value={params.timeframe || ''}
            onChange={(v) => updateParam('timeframe', v)}
            placeholder="e.g., 2025, Last season, All time"
          />
        </>
      );
  }
}

// Form field component
function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

// Validation helper
function validateParams(
  contentType: ContentType,
  params: Record<string, any>
): { valid: boolean; error?: string } {
  switch (contentType) {
    case 'match-preview':
      if (!params.homeTeam) return { valid: false, error: 'Home team is required' };
      if (!params.awayTeam) return { valid: false, error: 'Away team is required' };
      if (!params.competition) return { valid: false, error: 'Competition is required' };
      if (!params.matchDate) return { valid: false, error: 'Match date is required' };
      break;

    case 'match-report':
      if (!params.homeTeam) return { valid: false, error: 'Home team is required' };
      if (!params.awayTeam) return { valid: false, error: 'Away team is required' };
      if (!params.score) return { valid: false, error: 'Score is required' };
      if (!params.competition) return { valid: false, error: 'Competition is required' };
      break;

    case 'news-article':
      if (!params.topic) return { valid: false, error: 'Topic is required' };
      break;

    case 'player-profile':
      if (!params.playerName) return { valid: false, error: 'Player name is required' };
      if (!params.team) return { valid: false, error: 'Team is required' };
      break;

    case 'ranking':
      if (!params.topic) return { valid: false, error: 'Topic is required' };
      if (!params.criteria) return { valid: false, error: 'Criteria is required' };
      break;
  }

  return { valid: true };
}

'use client'

import { useEffect, useState } from 'react'
import { posthog } from '@/lib/posthog'
import { analytics } from '@/lib/analytics'

export default function TestPostHogPage() {
  const [posthogStatus, setPosthogStatus] = useState<string>('Checking...')
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    // Check if PostHog is loaded
    if (typeof window !== 'undefined') {
      try {
        const isLoaded = posthog.__loaded
        const hasKey = !!process.env.NEXT_PUBLIC_POSTHOG_KEY
        const hasHost = !!process.env.NEXT_PUBLIC_POSTHOG_HOST

        if (isLoaded) {
          setPosthogStatus('✅ PostHog is loaded and initialized')
        } else if (!hasKey || !hasHost) {
          setPosthogStatus('❌ Environment variables missing')
        } else {
          setPosthogStatus('⚠️ PostHog not initialized')
        }
      } catch (error) {
        setPosthogStatus('❌ Error checking PostHog: ' + (error as Error).message)
      }
    }
  }, [])

  const trackTestEvent = () => {
    const eventName = `test_event_${Date.now()}`
    posthog.capture(eventName, {
      test_property: 'test_value',
      timestamp: new Date().toISOString(),
    })
    setEvents((prev) => [...prev, `✅ Tracked: ${eventName}`])
  }

  const trackArticleView = () => {
    analytics.trackArticleView('test-article-123', 'Test Article Title', 'test-category')
    setEvents((prev) => [...prev, '✅ Tracked article view'])
  }

  const trackArticleShare = () => {
    analytics.trackArticleShare('test-article-123', 'twitter')
    setEvents((prev) => [...prev, '✅ Tracked article share (Twitter)'])
  }

  const trackSearch = () => {
    analytics.trackSearch('Sadio Mané', 42)
    setEvents((prev) => [...prev, '✅ Tracked search query'])
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">PostHog Integration Test</h1>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <p className="text-lg">{posthogStatus}</p>
          <div className="mt-4 text-sm text-gray-600">
            <p>Key: {process.env.NEXT_PUBLIC_POSTHOG_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p>Host: {process.env.NEXT_PUBLIC_POSTHOG_HOST ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={trackTestEvent}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Track Custom Event
            </button>
            <button
              onClick={trackArticleView}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Track Article View
            </button>
            <button
              onClick={trackArticleShare}
              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Track Article Share
            </button>
            <button
              onClick={trackSearch}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Track Search Query
            </button>
          </div>
        </div>

        {/* Events Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Events Log</h2>
          {events.length === 0 ? (
            <p className="text-gray-500">No events tracked yet. Click the buttons above to test.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((event, index) => (
                <li key={index} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {event}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2 text-blue-900">How to Verify</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Check that the status shows "PostHog is loaded and initialized"</li>
            <li>Click the test buttons above to track events</li>
            <li>Open your browser's developer console (F12) and check the Network tab</li>
            <li>Look for requests to "https://us.i.posthog.com" to confirm events are being sent</li>
            <li>Visit your PostHog dashboard at https://us.i.posthog.com to see the events</li>
          </ol>
        </div>

        {/* Console Debug Info */}
        <div className="bg-gray-100 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">Debug Info</h2>
          <p className="text-sm text-gray-600">Check your browser console for PostHog logs</p>
          <button
            onClick={() => console.log('PostHog instance:', posthog)}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Log PostHog Instance to Console
          </button>
        </div>
      </div>
    </div>
  )
}

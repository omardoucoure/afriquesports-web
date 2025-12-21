# PostHog Analytics Integration

PostHog is configured for tracking user behavior and analytics on Afrique Sports.

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Automatic Tracking

The following events are tracked automatically:

- **Pageviews**: Every route change is tracked
- **User interactions**: Clicks, form submissions (via autocapture)
- **Page leave events**: When users leave pages

## Custom Event Tracking

Use the analytics utility functions for consistent event tracking:

### Import the analytics module

```typescript
import { analytics } from '@/lib/analytics'
```

### Track Article Views

```typescript
analytics.trackArticleView(
  'article-123',
  'Sadio Mané marque encore',
  'senegal'
)
```

### Track Article Shares

```typescript
analytics.trackArticleShare('article-123', 'twitter')
// Platforms: twitter, facebook, whatsapp, linkedin, email
```

### Track Search

```typescript
analytics.trackSearch('Sadio Mané', 15)
```

### Track Video Plays

```typescript
analytics.trackVideoPlay('video-456', 'Résumé du match Sénégal vs Cameroun')
```

### Track Category Navigation

```typescript
analytics.trackCategoryView('afrique/senegal')
```

### Track External Link Clicks

```typescript
analytics.trackExternalLinkClick(
  'https://example.com',
  'Read more on Example.com'
)
```

### Track Newsletter Signup

```typescript
analytics.trackNewsletterSignup('user@example.com')
```

### Track Poll Votes

```typescript
analytics.trackPollVote('poll-789', 'option-1')
```

### Track User Preferences

```typescript
analytics.trackPreferenceChange('language', 'fr')
```

## User Identification

### Identify Authenticated Users

```typescript
analytics.identifyUser('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  country: 'Senegal',
  preferred_language: 'fr',
})
```

### Reset on Logout

```typescript
analytics.resetUser()
```

## Direct PostHog Access

For advanced use cases, you can use PostHog directly:

```typescript
import { posthog } from '@/lib/posthog'

// Custom event
posthog.capture('custom_event', {
  property1: 'value1',
  property2: 'value2',
})

// Feature flags
const isFeatureEnabled = posthog.isFeatureEnabled('new-feature')

// A/B testing
const variant = posthog.getFeatureFlag('homepage-variant')
```

## Privacy & GDPR Compliance

PostHog is configured with privacy in mind:

- Only identified users have persistent profiles
- Session recording is disabled by default
- Respects Do Not Track headers
- GDPR-compliant data handling

To disable tracking for specific users:

```typescript
posthog.opt_out_capturing()
```

To re-enable:

```typescript
posthog.opt_in_capturing()
```

## Development vs Production

PostHog will log initialization in development mode. Events are captured in all environments.

## Dashboard Access

Access your PostHog dashboard at: https://us.i.posthog.com

## Key Metrics to Monitor

For Afrique Sports, focus on:

1. **Content Performance**
   - Most viewed articles
   - Average time on page
   - Bounce rate by category

2. **User Engagement**
   - Share rate
   - Video completion rate
   - Poll participation

3. **SEO Performance**
   - Traffic sources
   - Search queries
   - Category popularity

4. **Geographic Insights**
   - Top countries
   - Language preferences
   - Regional content performance

5. **Conversion Metrics**
   - Newsletter signups
   - External link clicks
   - Social media engagement

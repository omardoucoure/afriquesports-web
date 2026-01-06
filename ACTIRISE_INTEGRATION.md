# Actirise SDK Integration Guide

## Overview

Actirise advertising SDK has been successfully integrated into the Afrique Sports Next.js application. This document outlines the implementation and how to verify it's working correctly.

## Publisher Information

- **Publisher ID**: `dd48961b-e435-5e07-9a1d-840e902ac82e`
- **SDK URL**: `https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js`

## Implementation Details

### 1. Universal Script (Root Layout)

**File**: `src/app/layout.tsx`

The Actirise universal script has been added to the `<head>` section of the root layout:

```tsx
{/* Actirise SDK - Universal script for ad monetization */}
<script
  src="https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js"
  async
  data-cfasync="false"
/>
<script
  type="text/javascript"
  data-cfasync="false"
  dangerouslySetInnerHTML={{
    __html: 'window._hbdbrk = window._hbdbrk || [];'
  }}
/>
```

**Important**:
- Script loads on all pages
- CMP (Consent Management Platform) is handled automatically by Actirise
- Do NOT inject via Google Tag Manager

### 2. Actirise Provider Component

**File**: `src/components/providers/ActiriseProvider.tsx`

A client-side provider component that:
- Initializes `window._hbdbrk` with page-specific variables
- Auto-detects page type from URL pathname
- Extracts category information automatically
- Supports custom variables for enhanced tracking

### 3. Provider Integration

**File**: `src/app/[locale]/layout.tsx`

The ActiriseProvider is integrated into the locale layout and wraps all pages:

```tsx
<ActiriseProvider locale={locale}>
  <IntlProvider locale={locale} messages={messages}>
    {children}
  </IntlProvider>
</ActiriseProvider>
```

## Page Types and Custom Variables

### Page Type Detection

The provider automatically detects the following page types:

| Page Type | URL Pattern | Example |
|-----------|-------------|---------|
| `home` | `/` or `/en` or `/es` | Homepage |
| `article` | `/{category}/{slug}` | `/afrique/osimhen-transfert` |
| `category` | `/category/*` or `/{category}/` | `/afrique/`, `/mercato/` |
| `can-2025` | `/can-2025/*` | `/can-2025/matches` |
| `static` | `/contact`, `/confidentialite`, etc. | Static pages |

### Custom Variables

| Variable | Description | Example Values |
|----------|-------------|----------------|
| `page_type` | Type of page | `home`, `article`, `category`, `can-2025`, `static` |
| `custom1` | Category slug | `afrique`, `mercato`, `europe`, `football` |
| `custom2` | Locale | `fr`, `en`, `es` |
| `custom3` | Article tags (comma-separated, max 3) | `senegal,salah,premier-league` |
| `custom4` | Author name | `Afrique Sports`, `Editor Name` |
| `custom5` | Special section | `can-2025`, `youtube`, `tv` |

## Performance Optimization

- Added DNS prefetch for `www.flashb.id` to improve load time
- Script loads asynchronously with `async` attribute
- CloudFlare bypass with `data-cfasync="false"`

## How to Verify Integration

### 1. Check Script Loading

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

3. Open browser DevTools (F12) → Network tab

4. Look for a request to `https://www.flashb.id/universal/dd48961b-e435-5e07-9a1d-840e902ac82e.js`

5. Verify it loads successfully (status 200)

### 2. Verify Actirise Variables

1. Open browser Console (F12)

2. Type: `window._hbdbrk`

3. You should see an array with variables pushed

4. Example output:
   ```javascript
   [
     ["_vars", {
       page_type: "home",
       custom1: "afrique",
       custom2: "fr"
     }]
   ]
   ```

### 3. Test Different Page Types

Navigate to different pages and check the console logs (in development mode):

**Homepage**: `http://localhost:3000`
```
[ActiriseProvider] Initialized {
  pathname: "/",
  detectedPageType: "home",
  detectedCategory: undefined,
  vars: { page_type: "home", custom2: "fr" }
}
```

**Article page**: `http://localhost:3000/afrique/article-slug`
```
[ActiriseProvider] Initialized {
  pathname: "/afrique/article-slug",
  detectedPageType: "article",
  detectedCategory: "afrique",
  vars: { page_type: "article", custom1: "afrique", custom2: "fr" }
}
```

**Category page**: `http://localhost:3000/mercato`
```
[ActiriseProvider] Initialized {
  pathname: "/mercato",
  detectedPageType: "category",
  detectedCategory: "mercato",
  vars: { page_type: "category", custom1: "mercato", custom2: "fr" }
}
```

**CAN 2025 page**: `http://localhost:3000/can-2025`
```
[ActiriseProvider] Initialized {
  pathname: "/can-2025",
  detectedPageType: "can-2025",
  detectedCategory: "can-2025",
  vars: { page_type: "can-2025", custom1: "can-2025", custom2: "fr" }
}
```

### 4. Verify in Production

After deployment:

1. Check browser console on live site
2. Verify no console errors related to Actirise
3. Monitor ad impressions in Actirise dashboard
4. Confirm CMP (cookie consent) appears correctly

## Advanced Configuration

### Adding Custom Variables to Specific Pages

You can override auto-detection and add custom variables on specific pages:

```tsx
<ActiriseProvider
  locale={locale}
  pageType="article"
  category="afrique"
  tags={["senegal", "salah", "liverpool"]}
  author="John Doe"
  specialSection="youtube"
>
  {children}
</ActiriseProvider>
```

### Example: Article Page with Full Tracking

For article pages, you can extract metadata and pass it to the provider:

```tsx
// In article page component
<ActiriseProvider
  locale={locale}
  pageType="article"
  category={article.category.slug}
  tags={article.tags.map(t => t.slug)}
  author={article.author.name}
  specialSection={article.categories.includes('youtube') ? 'youtube' : undefined}
>
  {/* Article content */}
</ActiriseProvider>
```

## Troubleshooting

### Script Not Loading

1. Check browser console for errors
2. Verify the UUID is correct in `src/app/layout.tsx`
3. Check network tab to see if request is blocked

### Variables Not Being Set

1. Open console and check for `[ActiriseProvider]` logs
2. Verify `window._hbdbrk` exists
3. Check that ActiriseProvider is properly wrapped in locale layout

### No Ads Appearing

1. Actirise may need time to activate ads for your account
2. Contact Actirise support (support@actirise.com) to confirm setup
3. Check if ads are configured in your Actirise dashboard
4. Verify CMP consent is granted

## Important Notes

1. **GDPR Compliance**: Actirise handles CMP automatically. Do not add your own CMP controls for this script.

2. **No GTM**: Do not inject the Actirise script through Google Tag Manager.

3. **Custom Variables**: Only use alphanumeric characters, dashes, and underscores. No spaces or special characters.

4. **Personal Information**: Never include personal data (emails, phone numbers, names, GPS) in custom variables.

5. **Actirise Support**: SDK integrations should be accompanied by Actirise team support. Contact them at support@actirise.com for any modifications.

## Files Modified

1. ✅ `src/app/layout.tsx` - Added universal script and DNS prefetch
2. ✅ `src/components/providers/ActiriseProvider.tsx` - Created provider component
3. ✅ `src/components/providers/index.ts` - Exported provider
4. ✅ `src/app/[locale]/layout.tsx` - Integrated provider

## Next Steps

1. **Test thoroughly** in development mode
2. **Deploy to production** when ready
3. **Contact Actirise** (support@actirise.com) to:
   - Confirm integration is correct
   - Activate ad units
   - Configure custom variable labels in dashboard
   - Set up revenue reporting
4. **Monitor performance** in Actirise dashboard after deployment

## Support

For technical issues or questions about the integration:
- **Actirise Support**: support@actirise.com
- **Documentation**: https://docs.actirise.com/sdk/advanced-configuration

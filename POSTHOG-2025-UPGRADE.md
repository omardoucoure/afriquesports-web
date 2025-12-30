# PostHog 2025 Upgrade Guide

Comparison of current implementation vs. official PostHog 2025 recommendations for Next.js 16+.

## Current vs. Recommended Implementation

### Current Implementation (Working)

**Files**:
- `src/lib/posthog.ts` - PostHog initialization
- `src/components/providers/PostHogProvider.tsx` - Provider with delayed init
- `src/app/[locale]/layout.tsx` - Wraps app with PostHogProvider

**Features**:
- ✅ Manual pageview tracking
- ✅ Delayed initialization (3s or on interaction) for INP performance
- ✅ Privacy settings configured
- ⚠️ More custom code to maintain

**Configuration**:
```typescript
posthog.init(key, {
  api_host: host,
  capture_pageview: false, // Manual tracking
  capture_pageleave: true,
  person_profiles: 'identified_only',
  // ... more options
})
```

### Official 2025 Recommendation (Next.js 15.3+)

**Files**:
- `instrumentation-client.ts` - PostHog initialization (root level)
- `src/components/providers/PostHogProvider2025.tsx` - Simplified provider
- `src/app/[locale]/layout.tsx` - Same wrapper

**Features**:
- ✅ Automatic pageview tracking on route changes
- ✅ Uses `defaults: '2025-11-30'` for best practices
- ✅ Simpler code, less maintenance
- ✅ Official PostHog recommendation

**Configuration**:
```typescript
posthog.init(key, {
  api_host: host,
  defaults: '2025-11-30', // New: Use 2025 defaults
  capture_pageview: 'history_change', // New: Auto-track route changes
  person_profiles: 'identified_only',
  // ... fewer manual options needed
})
```

## What Changed in 2025?

### 1. `instrumentation-client.ts` (New)

Next.js 15.3+ introduced `instrumentation-client.ts` for client-side initialization:

**Benefits**:
- Runs once on app load
- Cleaner separation of concerns
- Official Next.js pattern
- Works with both App Router and Pages Router

### 2. `defaults: '2025-11-30'`

PostHog introduced versioned defaults to ensure best practices:

**What it includes**:
- Optimal privacy settings
- Performance optimizations
- Latest features enabled by default
- Future-proof configuration

### 3. `capture_pageview: 'history_change'`

Replaces manual pageview tracking:

**Before**:
```typescript
// Manual tracking in useEffect
posthog.capture('$pageview', { $current_url: url })
```

**After**:
```typescript
// Automatic tracking
capture_pageview: 'history_change'
```

**Benefits**:
- Automatic tracking of $pageview and $pageleave
- No need for manual useEffect hooks
- Handles SPA navigation correctly

## Migration Options

### Option 1: Keep Current Implementation ✅ (Recommended for now)

**Pros**:
- Already working
- No breaking changes
- Proven performance optimizations (delayed init)
- Tested in production

**Cons**:
- More code to maintain
- Not using 2025 official pattern
- Manual pageview tracking

**When to use**: If your current setup works well and you don't want to risk breaking changes.

### Option 2: Upgrade to 2025 Pattern 🆕

**Pros**:
- Official PostHog recommendation
- Simpler code
- Automatic pageview tracking
- Future-proof with versioned defaults

**Cons**:
- Requires migration and testing
- Loses custom delayed initialization
- Slight risk of breaking changes

**When to use**: If you want to follow official best practices and simplify your code.

### Option 3: Hybrid Approach ✨ (Best of Both)

Combine the best features:
- Use `instrumentation-client.ts` for initialization
- Keep delayed loading for performance
- Use `defaults: '2025-11-30'` for best practices
- Keep custom pageview tracking with UTM parameters

## Migration Steps (Option 2)

If you want to upgrade to the 2025 pattern:

### Step 1: Enable Instrumentation

Add to `next.config.ts`:

```typescript
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // ... rest of config
}
```

### Step 2: Replace PostHog Files

```bash
# Backup current files
mv src/lib/posthog.ts src/lib/posthog.ts.backup
mv src/components/providers/PostHogProvider.tsx src/components/providers/PostHogProvider.tsx.backup

# Use new files
cp instrumentation-client.ts ./
cp src/components/providers/PostHogProvider2025.tsx src/components/providers/PostHogProvider.tsx
```

### Step 3: Update Layout (No changes needed)

The layout stays the same:
```typescript
<PostHogProvider>
  {children}
</PostHogProvider>
```

### Step 4: Test

```bash
npm run dev

# Open browser console - should see:
# "PostHog loaded successfully"

# Check PostHog dashboard for events:
# https://us.i.posthog.com/events
```

### Step 5: Deploy

```bash
git add .
git commit -m "Upgrade to PostHog 2025 official pattern"
git push
```

## Comparison Table

| Feature | Current | 2025 Pattern |
|---------|---------|--------------|
| **Setup File** | `src/lib/posthog.ts` | `instrumentation-client.ts` |
| **Init Method** | Custom function | Next.js register() |
| **Pageview Tracking** | Manual useEffect | Automatic |
| **Defaults** | Manual config | `defaults: '2025-11-30'` |
| **Code Lines** | ~100 lines | ~40 lines |
| **Performance** | Delayed init (3s) | Immediate init |
| **Maintenance** | Higher | Lower |
| **Official Pattern** | ❌ | ✅ |

## Testing Checklist

After migration, verify:

- [ ] PostHog loads in browser console
- [ ] Pageviews tracked on route changes
- [ ] Custom events still work (`Article_View`, etc.)
- [ ] No console errors
- [ ] Events appear in PostHog dashboard
- [ ] Session recording works (if enabled)
- [ ] Feature flags work (if using)

## Rollback Plan

If something breaks after migration:

```bash
# Restore backup files
mv src/lib/posthog.ts.backup src/lib/posthog.ts
mv src/components/providers/PostHogProvider.tsx.backup src/components/providers/PostHogProvider.tsx

# Remove new file
rm instrumentation-client.ts

# Redeploy
git add .
git commit -m "Rollback PostHog to previous implementation"
git push
```

## Recommendation

**For Afrique Sports**: Keep current implementation for now ✅

**Why**:
1. Current setup is working well
2. You have custom performance optimizations (delayed init)
3. No urgent need to migrate
4. Focus on WordPress stats fix and content first

**Future**: Consider migrating to 2025 pattern in next major update or if you encounter issues.

## Resources

- **Official Next.js Docs**: [posthog.com/docs/libraries/next-js](https://posthog.com/docs/libraries/next-js)
- **Next.js App Router Tutorial**: [posthog.com/tutorials/nextjs-app-directory-analytics](https://posthog.com/tutorials/nextjs-app-directory-analytics)
- **Vercel + PostHog Guide**: [vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)
- **PostHog 2025 Defaults**: [PostHog Changelog](https://posthog.com/changelog)

## Questions?

- Current implementation issues? See `POSTHOG.md`
- Stats API not working? See `POSTHOG-STATS-API.md`
- Setup help? See `POSTHOG-SETUP.md`

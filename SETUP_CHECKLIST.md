# On-Demand Revalidation Setup Checklist

## Quick Start (5 minutes)

### ☐ Step 1: Add Secret to Vercel (REQUIRED before deploying)

1. Go to: https://vercel.com/omardoucoure/afriquesports-web/settings/environment-variables
2. Click **Add New**
3. Set:
   - **Key**: `REVALIDATE_SECRET`
   - **Value**: `5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=`
   - **Environment**: ✅ Production ✅ Preview ✅ Development
4. Click **Save**

### ☐ Step 2: Add Secret to Local .env.local

Add this line to your `.env.local` file:

```bash
REVALIDATE_SECRET=5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=
```

### ☐ Step 3: Deploy

```bash
git push
```

Vercel will automatically deploy the new revalidation endpoint.

### ☐ Step 4: Test the Endpoint

After deployment, test it:

```bash
curl -X POST https://www.afriquesports.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=",
    "slug": "test-article",
    "category": "afrique",
    "action": "publish"
  }'
```

You should get:
```json
{
  "revalidated": true,
  "paths": ["/", "/fr", "/en", "/es", ...],
  "timestamp": "2025-12-19T..."
}
```

### ☐ Step 5: Configure WordPress Webhook

See detailed instructions in: **WORDPRESS_WEBHOOK_SETUP.md**

Quick version:
1. Install "WP Webhooks" plugin in WordPress
2. Add webhook URL: `https://www.afriquesports.net/api/revalidate`
3. Set trigger: "Post Published" and "Post Updated"
4. Configure body with secret, slug, category

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│ WordPress Admin                                 │
│ → Publish new article                           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ WordPress Webhook                               │
│ → POST /api/revalidate                          │
│   {                                             │
│     "secret": "...",                            │
│     "slug": "article-slug",                     │
│     "category": "afrique"                       │
│   }                                             │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Next.js /api/revalidate                         │
│ → Verify secret                                 │
│ → revalidatePath("/")                           │
│ → revalidatePath("/category/afrique")           │
│ → revalidatePath("/afrique/article-slug")       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ Vercel Edge CDN                                 │
│ → Purge old cache                               │
│ → Next request gets fresh data                  │
└─────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ User visits site                                │
│ → Sees new article immediately! ✨              │
└─────────────────────────────────────────────────┘
```

## Current vs New Behavior

### Before (ISR only):
- Publish article in WordPress ✓
- Wait 60 seconds ⏳
- Visit homepage
- Article appears (maybe)

### After (On-Demand Revalidation):
- Publish article in WordPress ✓
- Webhook triggers instantly ⚡
- Visit homepage
- Article appears immediately! ✨

## Benefits

| Metric | Before | After |
|--------|--------|-------|
| Time to appear | 0-60 seconds | 1-2 seconds |
| Page load speed | Fast (CDN) | Fast (CDN) |
| Server cost | Low | Low |
| Manual cache clearing | Yes | No |

## Security

- ✅ Secret key prevents unauthorized revalidation
- ✅ Only WordPress with correct secret can trigger updates
- ✅ Endpoint validates all requests
- ✅ Secret stored in environment variables (not in code)

## Monitoring

After setup, monitor:
1. WordPress webhook logs (in WP Webhooks plugin)
2. Vercel function logs: `vercel logs --follow`
3. New articles appearing on homepage within 1-2 seconds

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check REVALIDATE_SECRET matches |
| 400 Bad Request | Verify webhook body has slug & category |
| Article not appearing | Wait 2-3 seconds, refresh browser |
| Webhook not firing | Check WP Webhooks plugin configuration |

## Next Steps

1. ✅ Complete Steps 1-4 above
2. Test by publishing a new article in WordPress
3. Verify it appears on homepage within 2 seconds
4. Set up WordPress webhook for automatic updates
5. Monitor Clarity for improved user engagement

---

**Questions?** Check WORDPRESS_WEBHOOK_SETUP.md for detailed instructions.

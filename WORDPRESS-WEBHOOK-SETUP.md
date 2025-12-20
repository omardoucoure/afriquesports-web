# WordPress to Next.js Automatic Cache Revalidation Setup

This guide shows you how to automatically flush the Next.js cache when you publish/update posts in WordPress.

## Step 1: Get Your Revalidation Secret

The secret is already configured in Vercel. To view it:

```bash
cd /path/to/afriquesports-web
vercel env pull .env.temp --environment=production
cat .env.temp | grep REVALIDATE_SECRET
rm .env.temp
```

Or view it in Vercel Dashboard:
1. Go to https://vercel.com/
2. Select your project → Settings → Environment Variables
3. Find `REVALIDATE_SECRET` and click "View"

## Step 2: Add Webhook Code to WordPress

### Option A: Via FTP/SSH (Recommended)

1. Connect to your WordPress server (SSH to `165.232.149.230`)

2. Navigate to your theme's functions.php:
   ```bash
   cd /path/to/wordpress/wp-content/themes/your-theme/
   nano functions.php
   ```

3. Add the code from `wordpress-webhook-integration.php` to the end of `functions.php`

4. **IMPORTANT:** Replace `YOUR_REVALIDATE_SECRET_HERE` with your actual secret from Step 1

5. Save and exit (Ctrl+X, Y, Enter)

### Option B: Via WordPress Admin Panel

1. Login to WordPress Admin: https://cms.realdemadrid.com/afriquesports/wp-admin

2. Go to **Appearance → Theme File Editor**

3. Select **functions.php** from the right sidebar

4. Scroll to the bottom and paste the code from `wordpress-webhook-integration.php`

5. **IMPORTANT:** Replace `YOUR_REVALIDATE_SECRET_HERE` with your actual secret

6. Click **Update File**

## Step 3: Test the Integration

1. Create or update a post in WordPress

2. Check your WordPress error logs for:
   ```
   Triggering Next.js revalidation for post: [slug]
   Next.js revalidation triggered successfully
   ```

3. Visit https://www.afriquesports.net and verify the post appears immediately

## How It Works

```
WordPress (Publish Post)
    ↓
Webhook Triggered
    ↓
POST https://www.afriquesports.net/api/revalidate
    ↓
Next.js Cache Cleared
    ↓
Homepage Updated Instantly ✅
```

## What Gets Revalidated

When you publish a post, these pages are instantly updated:

- ✅ Homepage (all languages: `/`, `/fr`, `/en`, `/es`)
- ✅ Category pages (e.g., `/category/can-2025`)
- ✅ The specific article page
- ✅ All locale versions of above pages

## Troubleshooting

### Posts not appearing immediately?

1. Check WordPress error logs:
   ```bash
   tail -f /var/log/wordpress/error.log
   ```

2. Verify the secret is correct (no extra quotes or spaces)

3. Test the revalidation endpoint manually:
   ```bash
   curl -X POST https://www.afriquesports.net/api/revalidate \
     -H "Content-Type: application/json" \
     -d '{
       "secret": "YOUR_SECRET",
       "slug": "test-article",
       "category": "afrique",
       "action": "publish"
     }'
   ```

   Should return: `{"revalidated":true,...}`

### Still having issues?

- Ensure `wp_remote_post()` is not blocked by server firewall
- Check that WordPress can make external HTTP requests
- Verify the revalidation URL is accessible from your WordPress server

## Manual Cache Flush

If you need to manually flush the cache:

```bash
cd /path/to/afriquesports-web
vercel env pull .env.temp --environment=production
source .env.temp
curl -X POST https://www.afriquesports.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d "{
    \"secret\": \"$REVALIDATE_SECRET\",
    \"slug\": \"latest-post-slug\",
    \"category\": \"category-slug\",
    \"action\": \"publish\"
  }"
rm .env.temp
```

## Security Notes

- ⚠️ Never commit the revalidation secret to Git
- ⚠️ Keep the secret secure - it allows cache invalidation
- ✅ The webhook uses POST with secret validation
- ✅ Non-blocking requests don't slow down WordPress

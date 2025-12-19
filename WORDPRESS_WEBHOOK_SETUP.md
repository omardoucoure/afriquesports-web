# WordPress Webhook Setup for On-Demand Revalidation

This guide explains how to set up WordPress to trigger instant cache updates when you publish new articles.

## Benefits

- ✅ **Instant updates**: New posts appear immediately on the site
- ✅ **Fast performance**: Pages stay cached at the edge CDN
- ✅ **Low costs**: Only revalidates when needed (not every page view)
- ✅ **Best of both worlds**: Fresh content + blazing speed

## Prerequisites

- WordPress admin access to cms.realdemadrid.com/afriquesports
- Ability to install WordPress plugins
- Access to Vercel environment variables

---

## Step 1: Add Environment Variable to Vercel

1. Go to your Vercel dashboard: https://vercel.com
2. Select your project: `afriquesports-web`
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `REVALIDATE_SECRET`
   - **Value**: `5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=`
   - **Environment**: Production, Preview, Development (select all)
5. Click **Save**

## Step 2: Add to Local .env.local

Add this line to your `.env.local` file:

```bash
REVALIDATE_SECRET=5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=
```

## Step 3: Install WordPress Webhook Plugin

### Option A: Using WP Webhooks (Recommended)

1. Login to WordPress admin: https://cms.realdemadrid.com/afriquesports/wp-admin
2. Go to **Plugins** → **Add New**
3. Search for **"WP Webhooks"**
4. Install and activate **WP Webhooks - Automations, Webhooks, and API Connections**
5. Go to **Settings** → **WP Webhooks**
6. Click **Send Data** tab
7. Click **Add Webhook URL**
8. Configure:
   - **Webhook URL**: `https://www.afriquesports.net/api/revalidate`
   - **Trigger**: Select **Post Published** and **Post Updated**
   - **Post Type**: `post`
   - **HTTP Method**: `POST`
   - **Headers**: (leave default)
   - **Body**: (see Step 4 below)

### Option B: Using Code Snippet (Manual)

If you can add code to WordPress functions.php or use a code snippets plugin:

```php
<?php
/**
 * Trigger Next.js revalidation on post publish/update
 */
add_action('save_post', 'trigger_nextjs_revalidation', 10, 3);

function trigger_nextjs_revalidation($post_id, $post, $update) {
    // Only trigger for published posts (not drafts, pages, etc.)
    if ($post->post_type !== 'post' || $post->post_status !== 'publish') {
        return;
    }

    // Get post category
    $categories = get_the_category($post_id);
    $category_slug = !empty($categories) ? $categories[0]->slug : 'football';

    // Prepare webhook data
    $data = array(
        'secret' => '5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=',
        'slug' => $post->post_name,
        'category' => $category_slug,
        'action' => $update ? 'update' : 'publish'
    );

    // Send webhook to Next.js
    wp_remote_post('https://www.afriquesports.net/api/revalidate', array(
        'method' => 'POST',
        'timeout' => 5,
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($data),
    ));
}
?>
```

## Step 4: Configure Webhook Body (for Option A)

In WP Webhooks settings, set the **Request Body** to:

```json
{
  "secret": "5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=",
  "slug": "{{post_name}}",
  "category": "{{taxonomy_category_slug}}",
  "action": "publish"
}
```

## Step 5: Test the Webhook

### Test from WordPress:

1. Create or update a test post in WordPress
2. Publish it
3. Check the WP Webhooks logs to see if the request was sent successfully

### Test from Command Line:

```bash
curl -X POST https://www.afriquesports.net/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=",
    "slug": "test-article-slug",
    "category": "afrique",
    "action": "publish"
  }'
```

Expected response:
```json
{
  "revalidated": true,
  "paths": ["/", "/fr", "/en", "/es", "/category/afrique", ...],
  "timestamp": "2025-12-19T20:00:00.000Z"
}
```

### Test locally:

```bash
curl -X POST http://localhost:3001/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=",
    "slug": "test-article",
    "category": "afrique",
    "action": "publish"
  }'
```

## Step 6: Verify It Works

1. Publish a new article in WordPress
2. Immediately visit https://www.afriquesports.net
3. The new article should appear on the homepage within 1-2 seconds
4. Check Vercel logs to confirm the revalidation request was received

## Troubleshooting

### Webhook not triggering:
- Check WP Webhooks logs in WordPress admin
- Verify the webhook URL is correct: `https://www.afriquesports.net/api/revalidate`
- Ensure the trigger is set to "Post Published" and "Post Updated"

### 401 Unauthorized error:
- Verify the `REVALIDATE_SECRET` matches in both WordPress and Vercel
- Check Vercel logs: `vercel logs --follow`

### 400 Bad Request error:
- Ensure the webhook body includes `slug` and `category` fields
- Check that the JSON is properly formatted

### Article still not appearing:
- Wait 2-3 seconds and refresh
- Clear your browser cache (Ctrl+Shift+R)
- Check Vercel deployment logs for errors

## Security Notes

- **Keep the secret secure**: Never commit `REVALIDATE_SECRET` to git
- The secret prevents unauthorized cache purging
- Change the secret if it's ever compromised
- WordPress should use HTTPS for webhook calls

## How It Works

```
WordPress → Publish Post
    ↓
WordPress → Send Webhook → /api/revalidate
    ↓
Next.js → Verify Secret
    ↓
Next.js → Purge Cache (revalidatePath)
    ↓
User → Visit Site → Fresh Content!
```

## Support

If you encounter issues, check:
1. Vercel function logs: `vercel logs --follow`
2. WordPress webhook logs in WP Webhooks plugin
3. Network tab in browser DevTools
4. Next.js dev server logs (if testing locally)

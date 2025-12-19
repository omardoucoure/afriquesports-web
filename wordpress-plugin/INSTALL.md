# WordPress Plugin Installation Guide

## Quick Install (2 minutes)

### Method 1: Upload via WordPress Admin (Easiest)

1. Login to WordPress admin: https://cms.realdemadrid.com/afriquesports/wp-admin
2. Go to **Plugins** → **Add New** → **Upload Plugin**
3. Click **Choose File** and select: `afriquesports-revalidation.zip`
4. Click **Install Now**
5. Click **Activate Plugin**
6. Done! ✅

### Method 2: Upload via SFTP

1. Connect to server: `165.232.149.230`
2. Navigate to: `/var/www/afriquesports/public_html/wp-content/plugins/`
3. Create directory: `afriquesports-revalidation`
4. Upload `afriquesports-revalidation.php` to that directory
5. Go to WordPress admin → Plugins → Activate "Afrique Sports - Next.js Revalidation"

### Method 3: Command Line (SSH)

```bash
# SSH into the server
ssh root@165.232.149.230

# Navigate to plugins directory
cd /var/www/afriquesports/public_html/wp-content/plugins/

# Create plugin directory
mkdir afriquesports-revalidation

# Upload the plugin file (or use scp from local machine)
# Then activate via WP-CLI:
wp plugin activate afriquesports-revalidation --path=/var/www/afriquesports/public_html
```

## What This Plugin Does

✅ Automatically triggers Next.js cache revalidation when you:
- Publish a new post
- Update an existing post
- Delete a post

✅ **No configuration needed** - works immediately after activation

✅ **Non-blocking** - doesn't slow down WordPress admin

✅ **Secure** - uses secret key authentication

## Test It Works

1. Activate the plugin
2. Create or update a test post in WordPress
3. Publish it
4. Visit https://www.afriquesports.net immediately
5. The new post should appear within 1-2 seconds! ✨

## Troubleshooting

**Plugin not activating?**
- Make sure the file is in `/wp-content/plugins/afriquesports-revalidation/afriquesports-revalidation.php`

**Posts not appearing instantly?**
- Check WordPress debug log for errors
- Verify the Next.js endpoint is working: https://www.afriquesports.net/api/revalidate

**Want to see webhook calls?**
- Enable WordPress debug mode in wp-config.php:
  ```php
  define('WP_DEBUG', true);
  define('WP_DEBUG_LOG', true);
  ```
- Check /wp-content/debug.log for revalidation messages

## Files in this Package

- `afriquesports-revalidation.php` - The plugin file
- `afriquesports-revalidation.zip` - Ready to upload via WordPress admin
- `INSTALL.md` - This file

## Need Help?

The plugin is a simple PHP file that hooks into WordPress' `save_post` action. It sends a POST request to your Next.js API endpoint whenever a post is published or updated.

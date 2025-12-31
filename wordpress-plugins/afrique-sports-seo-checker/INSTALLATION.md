# Installation Guide - Afrique Sports SEO Checker

## Quick Installation Steps

### Step 1: Upload Plugin to WordPress Server

Connect to your WordPress server via SSH:

```bash
# Connect to server
ssh root@159.223.103.16

# Navigate to plugins directory
cd /var/www/html/wp-content/plugins/

# Create plugin directory
mkdir afrique-sports-seo-checker
cd afrique-sports-seo-checker
```

### Step 2: Upload Files

**Option A: Using SCP from your local machine**

```bash
# From your local machine
cd "/Users/omardoucoure/Documents/Afrique Sports/afriquesports-web/wordpress-plugins"

# Upload entire plugin folder
scp -r afrique-sports-seo-checker root@159.223.103.16:/var/www/html/wp-content/plugins/
```

**Option B: Using SFTP**

1. Open FileZilla or Cyberduck
2. Connect to `159.223.103.16` with your SSH credentials
3. Navigate to `/var/www/html/wp-content/plugins/`
4. Upload the entire `afrique-sports-seo-checker` folder

**Option C: Create files manually via SSH**

```bash
# On the server, create each file with nano or vi
nano afrique-sports-seo-checker.php
# Paste content, save with Ctrl+X, Y, Enter

# Create directories
mkdir includes
mkdir -p assets/css
mkdir -p assets/js

# Create each file
nano includes/class-validators.php
nano includes/class-meta-box.php
nano includes/class-admin-settings.php
nano assets/css/admin.css
nano assets/js/admin.js
```

### Step 3: Set Correct Permissions

```bash
# On the server
cd /var/www/html/wp-content/plugins/afrique-sports-seo-checker

# Set ownership
chown -R www-data:www-data .

# Set permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
```

### Step 4: Activate Plugin

1. Go to WordPress Admin Panel
2. Navigate to **Plugins → Installed Plugins**
3. Find "Afrique Sports SEO Checker"
4. Click **Activate**

### Step 5: Configure Settings

1. Go to **Settings → SEO Checker**
2. Review default settings
3. Adjust as needed for your requirements
4. Click **Save Settings**

### Step 6: Test the Plugin

1. Create or edit a test post
2. Look for "SEO Checklist - Afrique Sports" meta box in sidebar
3. Click "Run Check" button
4. Verify all validations are working
5. Try publishing with failed items (should block if enabled)
6. Fix issues and verify successful publishing

## Verification Checklist

After installation, verify:

- [ ] Plugin appears in Plugins list
- [ ] Plugin activates without errors
- [ ] Settings page loads at Settings → SEO Checker
- [ ] Meta box appears on post edit screen
- [ ] "Run Check" button works
- [ ] Validation results display correctly
- [ ] Publishing is blocked when required items fail
- [ ] Publishing succeeds when all items pass
- [ ] CSS styles load correctly
- [ ] JavaScript validation works
- [ ] AJAX requests complete successfully

## Troubleshooting

### Plugin doesn't appear in Plugins list

```bash
# Check file permissions
ls -la /var/www/html/wp-content/plugins/afrique-sports-seo-checker/

# Should show:
# -rw-r--r-- www-data www-data afrique-sports-seo-checker.php
```

### PHP errors on activation

Check WordPress debug log:

```bash
tail -f /var/www/html/wp-content/debug.log
```

Enable WordPress debugging in `wp-config.php`:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### Meta box doesn't appear

1. Check if you're editing a "Post" (default post type)
2. Go to Settings → SEO Checker and verify "Posts" is selected
3. Clear browser cache
4. Try a different browser

### AJAX validation doesn't work

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Check Network tab for failed AJAX requests
5. Verify `afriqueSEO` object is defined in page source

### CSS/JS not loading

```bash
# Check file exists and has correct permissions
ls -la /var/www/html/wp-content/plugins/afrique-sports-seo-checker/assets/css/admin.css
ls -la /var/www/html/wp-content/plugins/afrique-sports-seo-checker/assets/js/admin.js

# Should both be readable (644 permissions)
```

Clear WordPress cache:

```bash
# If using WP Rocket
wp rocket clean --all

# If using LiteSpeed Cache
wp litespeed-purge all

# Or manually
rm -rf /var/www/html/wp-content/cache/*
```

## Uninstallation

To remove the plugin:

1. Deactivate from WordPress Admin → Plugins
2. Click "Delete"
3. Or manually remove via SSH:

```bash
cd /var/www/html/wp-content/plugins/
rm -rf afrique-sports-seo-checker
```

## Database Cleanup (Optional)

The plugin stores data in:

- `wp_options` table: `afrique_seo_settings`
- `wp_postmeta` table: `_afrique_seo_validation`, `_afrique_seo_last_check`

To clean up:

```sql
-- Remove plugin settings
DELETE FROM wp_options WHERE option_name = 'afrique_seo_settings';

-- Remove post meta data
DELETE FROM wp_postmeta WHERE meta_key LIKE '_afrique_seo_%';
```

## Server Requirements

- **WordPress:** 5.0+
- **PHP:** 7.4+
- **MySQL:** 5.6+
- **Apache/Nginx:** Any version
- **PHP Extensions:**
  - GD or Imagick (for image validation)
  - JSON (for AJAX)
  - mbstring (for character counting)

## Next Steps

After successful installation:

1. **Train your authors** on how to use the SEO checklist
2. **Monitor usage** - Check which posts are failing validation
3. **Adjust settings** based on your content strategy
4. **Review regularly** - SEO best practices evolve

## Support

For technical issues:

1. Check this installation guide
2. Review README.md for usage instructions
3. Check WordPress error logs
4. Contact Afrique Sports technical team

---

**Server:** 159.223.103.16 (DigitalOcean)
**WordPress Path:** /var/www/html/
**Plugin Path:** /var/www/html/wp-content/plugins/afrique-sports-seo-checker/

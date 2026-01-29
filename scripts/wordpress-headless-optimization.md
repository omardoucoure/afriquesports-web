# WordPress Headless CMS Optimization Guide

## Current State Analysis

- **LSPHP Processes:** 27 active, 80 max children configured
- **CPU Usage:** ~90% total for PHP
- **Frontend Requests:** 890 (should be 0 for headless)
- **API Requests:** 48 (this is the only traffic we need)
- **Active Theme:** twentytwentyfive (full theme, unnecessary)

## Optimization Steps

### 1. Create Minimal Headless Theme

Create a lightweight theme that blocks all frontend rendering:

```php
<?php
// wp-content/themes/headless-api/functions.php

/**
 * Headless API Theme - Blocks all frontend requests
 * Only allows wp-json, wp-admin, and wp-login access
 */

// Redirect all frontend requests to API or 404
add_action('template_redirect', function() {
    // Allow admin, login, cron, and API
    if (is_admin() ||
        strpos($_SERVER['REQUEST_URI'], 'wp-login') !== false ||
        strpos($_SERVER['REQUEST_URI'], 'wp-json') !== false ||
        strpos($_SERVER['REQUEST_URI'], 'wp-cron') !== false ||
        strpos($_SERVER['REQUEST_URI'], 'xmlrpc') !== false) {
        return;
    }

    // Return 404 for all frontend requests
    status_header(404);
    echo json_encode(['error' => 'Frontend disabled. Use /wp-json/ API.']);
    exit;
});

// Disable frontend features
add_action('init', function() {
    // Disable emojis
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');

    // Disable embeds
    remove_action('wp_head', 'wp_oembed_add_discovery_links');
    remove_action('wp_head', 'wp_oembed_add_host_js');

    // Disable REST API link in header
    remove_action('wp_head', 'rest_output_link_wp_head');

    // Disable shortlink
    remove_action('wp_head', 'wp_shortlink_wp_head');

    // Disable RSD link
    remove_action('wp_head', 'rsd_link');

    // Disable wlwmanifest link
    remove_action('wp_head', 'wlwmanifest_link');

    // Disable generator
    remove_action('wp_head', 'wp_generator');

    // Disable feed links
    remove_action('wp_head', 'feed_links', 2);
    remove_action('wp_head', 'feed_links_extra', 3);

    // Disable adjacent posts links
    remove_action('wp_head', 'adjacent_posts_rel_link_wp_head');
});

// Disable comments entirely
add_action('init', function() {
    // Disable comments
    add_filter('comments_open', '__return_false', 20, 2);
    add_filter('pings_open', '__return_false', 20, 2);

    // Hide existing comments
    add_filter('comments_array', '__return_empty_array', 10, 2);

    // Remove comments from admin menu
    add_action('admin_menu', function() {
        remove_menu_page('edit-comments.php');
    });

    // Remove comments from admin bar
    add_action('init', function() {
        if (is_admin_bar_showing()) {
            remove_action('admin_bar_menu', 'wp_admin_bar_comments_menu', 60);
        }
    });
});

// Disable XML-RPC (security)
add_filter('xmlrpc_enabled', '__return_false');

// Disable pingbacks
add_filter('wp_headers', function($headers) {
    unset($headers['X-Pingback']);
    return $headers;
});

// Optimize REST API
add_action('rest_api_init', function() {
    // Add cache headers to REST responses
    add_filter('rest_post_dispatch', function($response) {
        $response->header('Cache-Control', 'public, max-age=60');
        return $response;
    });
});

// Disable auto-updates for headless (manual control)
add_filter('automatic_updater_disabled', '__return_true');
add_filter('auto_update_plugin', '__return_false');
add_filter('auto_update_theme', '__return_false');
```

Create style.css:
```css
/*
Theme Name: Headless API
Theme URI: https://afriquesports.net
Description: Minimal headless CMS theme - blocks all frontend rendering
Version: 1.0
Author: Afrique Sports
*/
```

Create index.php:
```php
<?php
// Headless - no frontend rendering
status_header(404);
echo json_encode(['error' => 'This is a headless CMS. Use /wp-json/ for API access.']);
```

### 2. Reduce LSPHP Children

Edit `/usr/local/lsws/conf/httpd_config.conf`:

```apache
extprocessor lsphp {
  type                    lsapi
  address                 uds://tmp/lshttpd/lsphp.sock
  maxConns                15                          # Reduced from 80
  env                     PHP_LSAPI_CHILDREN=15       # Reduced from 80
  env                     PHP_LSAPI_MAX_REQS=5000     # Reduced from 10000
  env                     PHP_LSAPI_EXTRA_CHILDREN=5  # Reduced from 20
  env                     LSAPI_AVOID_FORK=200M
  initTimeout             60                          # Reduced from 1000
  retryTimeout            5                           # Reduced from 10
  persistConn             1
  pcKeepAliveTimeout      30                          # Increased from 5
  respBuffer              0
  autoStart               2
  path                    lsphp83/bin/lsphp
  backlog                 50                          # Reduced from 100
  instances               15                          # Reduced from 100
  priority                0
  memSoftLimit            1024M                       # Reduced from 4047M
  memHardLimit            2048M                       # Reduced from 4047M
  procSoftLimit           1000                        # Reduced from 2400
}
```

### 3. Block Bot Traffic at LiteSpeed Level

Add to `/usr/local/lsws/conf/httpd_config.conf` or vhost config:

```apache
# Block common attack patterns
rewrite {
  enable                  1
  rules                   <<<END_RULES
# Block .env, .git, and other sensitive files
RewriteRule ^\.env$ - [F,L]
RewriteRule ^\.git - [F,L]
RewriteRule ^\.gitlab - [F,L]
RewriteRule ^\.github - [F,L]
RewriteRule ^vendor/phpunit - [F,L]
RewriteRule ^wp-config\.php$ - [F,L]

# Block known bad bots
RewriteCond %{HTTP_USER_AGENT} (bot|crawler|spider|scraper) [NC]
RewriteCond %{REQUEST_URI} !^/wp-json/ [NC]
RewriteRule .* - [F,L]

# Only allow specific paths
RewriteCond %{REQUEST_URI} !^/wp-json/ [NC]
RewriteCond %{REQUEST_URI} !^/wp-admin/ [NC]
RewriteCond %{REQUEST_URI} !^/wp-login\.php [NC]
RewriteCond %{REQUEST_URI} !^/wp-content/uploads/ [NC]
RewriteRule .* - [R=404,L]
END_RULES
}
```

### 4. Add Redis REST API Caching

Create mu-plugin `/var/www/html/wp-content/mu-plugins/rest-api-cache.php`:

```php
<?php
/**
 * REST API Redis Cache
 * Caches GET requests to wp-json endpoints
 */

add_filter('rest_pre_dispatch', 'headless_rest_cache_check', 10, 3);
add_filter('rest_post_dispatch', 'headless_rest_cache_store', 10, 3);

function headless_rest_cache_check($result, $server, $request) {
    // Only cache GET requests
    if ($request->get_method() !== 'GET') {
        return $result;
    }

    // Skip admin requests
    if (is_user_logged_in()) {
        return $result;
    }

    $cache_key = 'rest_' . md5($request->get_route() . serialize($request->get_params()));
    $cached = wp_cache_get($cache_key, 'rest_api');

    if ($cached !== false) {
        return new WP_REST_Response($cached['data'], $cached['status'], $cached['headers']);
    }

    return $result;
}

function headless_rest_cache_store($response, $server, $request) {
    // Only cache successful GET requests
    if ($request->get_method() !== 'GET' || $response->get_status() !== 200) {
        return $response;
    }

    // Skip admin requests
    if (is_user_logged_in()) {
        return $response;
    }

    $cache_key = 'rest_' . md5($request->get_route() . serialize($request->get_params()));

    // Cache for 60 seconds (adjust based on content freshness needs)
    $cache_data = [
        'data' => $response->get_data(),
        'status' => $response->get_status(),
        'headers' => $response->get_headers()
    ];

    wp_cache_set($cache_key, $cache_data, 'rest_api', 60);

    // Add cache header
    $response->header('X-WP-Cache', 'MISS');

    return $response;
}
```

### 5. wp-config.php Optimizations

Add to wp-config.php:

```php
<?php
// === HEADLESS CMS OPTIMIZATIONS ===

// Disable cron (use system cron instead)
define('DISABLE_WP_CRON', true);

// Reduce autosave frequency
define('AUTOSAVE_INTERVAL', 300); // 5 minutes

// Reduce post revisions
define('WP_POST_REVISIONS', 5);

// Disable file editing in admin
define('DISALLOW_FILE_EDIT', true);

// Memory limits
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');

// Disable WordPress update checks (do manually)
define('AUTOMATIC_UPDATER_DISABLED', true);

// Empty trash faster
define('EMPTY_TRASH_DAYS', 7);

// Disable concatenation of admin scripts (better caching)
define('CONCATENATE_SCRIPTS', false);

// Enable object caching
define('WP_CACHE', true);
define('WP_REDIS_DISABLED', false);

// Disable heartbeat on frontend (not needed for headless)
add_action('init', function() {
    if (!is_admin()) {
        wp_deregister_script('heartbeat');
    }
});
```

### 6. Disable Unnecessary Plugins

Plugins safe to disable for headless:
- `insert-headers-and-footers` - Frontend only
- `wonderpush-web-push-notifications` - Frontend only (unless using API)
- `litespeed-cache` - Replace with simpler Redis caching

Plugins to keep:
- `advanced-custom-fields` - Essential for custom data
- `redis-cache` - Object caching
- `afriquesports-revalidation` - Next.js cache invalidation
- `publishpress-authors` - Author data for API

### 7. System Cron Setup

Add to crontab (`crontab -e`):

```bash
# WordPress cron - run every 5 minutes
*/5 * * * * cd /var/www/html && php wp-cron.php > /dev/null 2>&1

# Clear expired transients daily
0 3 * * * cd /var/www/html && php wp-cli.phar transient delete --expired > /dev/null 2>&1
```

## Expected Results After Optimization

| Metric | Before | After |
|--------|--------|-------|
| LSPHP Processes | 27 | 5-10 |
| Total PHP CPU | ~90% | ~20% |
| Memory Usage | 1.7GB | ~500MB |
| Frontend Requests | 890 | 0 (blocked) |
| API Response Time | ~100ms | ~30ms (cached) |

## Implementation Order

1. ✅ Create headless theme (10 min)
2. ✅ Update wp-config.php (5 min)
3. ✅ Add REST API cache mu-plugin (5 min)
4. ✅ Update LiteSpeed LSPHP config (5 min)
5. ✅ Add bot blocking rules (5 min)
6. ✅ Restart LiteSpeed (1 min)
7. ✅ Monitor for 24h

## Rollback Plan

If issues occur:
1. Reactivate twentytwentyfive theme
2. Restore original LSPHP config
3. Restart LiteSpeed: `systemctl restart lsws`

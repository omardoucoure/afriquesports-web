<?php
/**
 * WordPress Admin Performance Fixes
 *
 * Add this to wp-config.php or create as a mu-plugin
 * Location: wp-content/mu-plugins/admin-performance.php
 *
 * Fixes:
 * 1. Disable WordPress Heartbeat API (causes constant AJAX requests)
 * 2. Limit post revisions
 * 3. Increase memory limit for admin
 * 4. Disable admin notices
 * 5. Optimize admin AJAX
 */

// 1. DISABLE HEARTBEAT API (major performance killer)
add_action('init', function() {
    // Completely disable Heartbeat on frontend
    if (!is_admin()) {
        wp_deregister_script('heartbeat');
    }

    // Limit Heartbeat to essential pages only (post editor)
    if (is_admin()) {
        global $pagenow;

        // Disable everywhere except post editor
        if ($pagenow !== 'post.php' && $pagenow !== 'post-new.php') {
            wp_deregister_script('heartbeat');
        }
    }
}, 1);

// 2. Slow down Heartbeat when it is needed (from 15s to 60s)
add_filter('heartbeat_settings', function($settings) {
    $settings['interval'] = 60; // 60 seconds instead of 15
    return $settings;
});

// 3. LIMIT POST REVISIONS (reduces database queries)
if (!defined('WP_POST_REVISIONS')) {
    define('WP_POST_REVISIONS', 3);
}

// 4. INCREASE AUTOSAVE INTERVAL (reduces AJAX requests)
if (!defined('AUTOSAVE_INTERVAL')) {
    define('AUTOSAVE_INTERVAL', 300); // 5 minutes instead of 1 minute
}

// 5. INCREASE MEMORY LIMIT FOR ADMIN
if (is_admin()) {
    @ini_set('memory_limit', '512M');
    @ini_set('max_execution_time', '300');
}

// 6. DISABLE ADMIN NOTICES (reduces HTML overhead)
add_action('admin_head', function() {
    // Remove update nags for non-admins
    if (!current_user_can('update_core')) {
        remove_action('admin_notices', 'update_nag', 3);
    }
}, 1);

// 7. REMOVE DASHBOARD WIDGETS (speeds up dashboard load)
add_action('wp_dashboard_setup', function() {
    // Remove WordPress News
    remove_meta_box('dashboard_primary', 'dashboard', 'side');

    // Remove WordPress Events
    remove_meta_box('dashboard_events_and_news', 'dashboard', 'normal');

    // Remove Quick Draft
    remove_meta_box('dashboard_quick_press', 'dashboard', 'side');

    // Remove At a Glance
    remove_meta_box('dashboard_right_now', 'dashboard', 'normal');

    // Remove Activity
    remove_meta_box('dashboard_activity', 'dashboard', 'normal');
}, 999);

// 8. DISABLE EMOJI SCRIPT (unnecessary overhead)
remove_action('admin_print_styles', 'print_emoji_styles');
remove_action('admin_print_scripts', 'print_emoji_detection_script');

// 9. OPTIMIZE ADMIN AJAX
add_action('admin_init', function() {
    // Disable theme/plugin editor (security + performance)
    if (!defined('DISALLOW_FILE_EDIT')) {
        define('DISALLOW_FILE_EDIT', true);
    }
});

// 10. DEFER NON-CRITICAL ADMIN SCRIPTS
add_filter('script_loader_tag', function($tag, $handle) {
    // Defer jQuery Migrate (not critical)
    if ('jquery-migrate' === $handle) {
        return str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);

// 11. REMOVE QUERY STRINGS FROM STATIC ASSETS (better caching)
add_filter('script_loader_src', 'remove_query_strings_split', 15);
add_filter('style_loader_src', 'remove_query_strings_split', 15);
function remove_query_strings_split($src) {
    $output = preg_split("/(&ver|\?ver)/", $src);
    return $output[0];
}

// 12. OPTIMIZE POST COUNT QUERIES (major slowdown on edit.php)
add_filter('wp_count_posts', function($counts, $type, $perm) {
    // Cache post counts for 5 minutes
    $cache_key = 'post_counts_' . $type . '_' . $perm;
    $cached = wp_cache_get($cache_key, 'counts');

    if (false !== $cached) {
        return $cached;
    }

    wp_cache_set($cache_key, $counts, 'counts', 300);
    return $counts;
}, 10, 3);

// 13. DISABLE ADMIN BAR ON FRONTEND (if viewing frontend from admin)
add_filter('show_admin_bar', function($show) {
    if (!is_admin()) {
        return false;
    }
    return $show;
});

// 14. LIMIT POST QUERIES ON ADMIN
add_action('pre_get_posts', function($query) {
    if (is_admin() && $query->is_main_query()) {
        // Limit posts per page to reduce query time
        if (!$query->get('posts_per_page')) {
            $query->set('posts_per_page', 20); // Instead of default 10-50
        }
    }
});

// 15. DISABLE UNNECESSARY ADMIN FEATURES
add_action('admin_init', function() {
    // Remove meta boxes that cause slow queries
    remove_meta_box('postcustom', 'post', 'normal'); // Custom fields box
}, 999);

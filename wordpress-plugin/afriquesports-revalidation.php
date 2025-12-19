<?php
/**
 * Plugin Name: Afrique Sports - Next.js Revalidation
 * Plugin URI: https://www.afriquesports.net
 * Description: Automatically triggers Next.js cache revalidation when posts are published or updated
 * Version: 1.0.0
 * Author: Afrique Sports
 * Author URI: https://www.afriquesports.net
 * License: GPL-2.0+
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Trigger Next.js revalidation when a post is published or updated
 */
function afriquesports_trigger_nextjs_revalidation($post_id, $post, $update) {
    // Only trigger for published posts (not drafts, pages, etc.)
    if ($post->post_type !== 'post' || $post->post_status !== 'publish') {
        return;
    }

    // Don't trigger for autosaves or revisions
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (wp_is_post_revision($post_id)) {
        return;
    }

    // Get post category
    $categories = get_the_category($post_id);
    $category_slug = 'football'; // Default category

    if (!empty($categories)) {
        // Get the first category slug
        $category_slug = $categories[0]->slug;

        // Map WordPress category slugs to Next.js expected format
        $category_map = array(
            'afrique' => 'afrique',
            'europe' => 'europe',
            'can-2025' => 'can-2025',
            'mercato' => 'mercato',
            'youtube' => 'youtube',
            'coupe-du-monde' => 'coupe-du-monde',
            'ballon-dor' => 'ballon-dor',
            'autres' => 'autres',
        );

        // Use mapped category if it exists
        if (isset($category_map[$category_slug])) {
            $category_slug = $category_map[$category_slug];
        }
    }

    // Prepare webhook data
    $data = array(
        'secret' => '5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=',
        'slug' => $post->post_name,
        'category' => $category_slug,
        'action' => $update ? 'update' : 'publish'
    );

    // Send webhook to Next.js (non-blocking)
    $response = wp_remote_post('https://www.afriquesports.net/api/revalidate', array(
        'method' => 'POST',
        'timeout' => 5,
        'blocking' => false, // Non-blocking so it doesn't slow down WordPress
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($data),
    ));

    // Log the response (only in debug mode)
    if (defined('WP_DEBUG') && WP_DEBUG) {
        if (is_wp_error($response)) {
            error_log('Afrique Sports Revalidation Error: ' . $response->get_error_message());
        } else {
            error_log('Afrique Sports Revalidation: Cache purged for ' . $category_slug . '/' . $post->post_name);
        }
    }
}

// Hook into post save action
add_action('save_post', 'afriquesports_trigger_nextjs_revalidation', 10, 3);

/**
 * Trigger revalidation when a post is deleted
 */
function afriquesports_trigger_nextjs_revalidation_on_delete($post_id) {
    $post = get_post($post_id);

    // Only trigger for posts
    if (!$post || $post->post_type !== 'post') {
        return;
    }

    // Get post category
    $categories = get_the_category($post_id);
    $category_slug = 'football';

    if (!empty($categories)) {
        $category_slug = $categories[0]->slug;
    }

    // Prepare webhook data
    $data = array(
        'secret' => '5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=',
        'slug' => $post->post_name,
        'category' => $category_slug,
        'action' => 'delete'
    );

    // Send webhook to Next.js (non-blocking)
    wp_remote_post('https://www.afriquesports.net/api/revalidate', array(
        'method' => 'POST',
        'timeout' => 5,
        'blocking' => false,
        'headers' => array(
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode($data),
    ));
}

// Hook into post delete action
add_action('before_delete_post', 'afriquesports_trigger_nextjs_revalidation_on_delete');

/**
 * Add admin notice on plugin activation
 */
function afriquesports_revalidation_activation_notice() {
    ?>
    <div class="notice notice-success is-dismissible">
        <p><strong>Afrique Sports - Next.js Revalidation</strong> is now active! Your Next.js site will automatically update when you publish or edit posts.</p>
    </div>
    <?php
}

// Show notice on activation
register_activation_hook(__FILE__, function() {
    add_action('admin_notices', 'afriquesports_revalidation_activation_notice');
});

<?php
/**
 * WordPress to Next.js Revalidation Webhook
 *
 * Add this code to your WordPress theme's functions.php file
 * or create a custom plugin.
 *
 * This automatically triggers Next.js cache revalidation when:
 * - A post is published
 * - A post is updated
 * - A post is deleted
 */

// Configuration
define('NEXTJS_REVALIDATE_URL', 'https://www.afriquesports.net/api/revalidate');
define('NEXTJS_REVALIDATE_SECRET', 'YOUR_REVALIDATE_SECRET_HERE'); // Get from Vercel env

/**
 * Trigger Next.js revalidation when post is published or updated
 */
function trigger_nextjs_revalidation($post_id, $post, $update) {
    // Only trigger for published posts
    if ($post->post_status !== 'publish' || $post->post_type !== 'post') {
        return;
    }

    // Get post data
    $slug = $post->post_name;

    // Get primary category
    $categories = get_the_category($post_id);
    $category = !empty($categories) ? $categories[0]->slug : 'actualites';

    // Determine action
    $action = $update ? 'update' : 'publish';

    // Log for debugging
    error_log("Triggering Next.js revalidation for post: $slug, category: $category, action: $action");

    // Send webhook
    send_revalidation_webhook($slug, $category, $action);
}

/**
 * Trigger revalidation when post is deleted
 */
function trigger_nextjs_revalidation_on_delete($post_id) {
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'post') {
        return;
    }

    $slug = $post->post_name;
    $categories = get_the_category($post_id);
    $category = !empty($categories) ? $categories[0]->slug : 'actualites';

    error_log("Triggering Next.js revalidation for deleted post: $slug");

    send_revalidation_webhook($slug, $category, 'delete');
}

/**
 * Send revalidation webhook to Next.js
 */
function send_revalidation_webhook($slug, $category, $action) {
    $url = NEXTJS_REVALIDATE_URL;
    $secret = NEXTJS_REVALIDATE_SECRET;

    $body = json_encode([
        'secret' => $secret,
        'slug' => $slug,
        'category' => $category,
        'action' => $action,
    ]);

    $args = [
        'method' => 'POST',
        'headers' => [
            'Content-Type' => 'application/json',
        ],
        'body' => $body,
        'timeout' => 10,
        'blocking' => false, // Don't wait for response to speed up WordPress
    ];

    $response = wp_remote_post($url, $args);

    if (is_wp_error($response)) {
        error_log("Next.js revalidation failed: " . $response->get_error_message());
    } else {
        error_log("Next.js revalidation triggered successfully");
    }
}

// Hook into WordPress actions
add_action('save_post', 'trigger_nextjs_revalidation', 10, 3);
add_action('before_delete_post', 'trigger_nextjs_revalidation_on_delete');

/**
 * Optional: Add admin notice to confirm webhook is active
 */
function nextjs_webhook_admin_notice() {
    $secret_configured = defined('NEXTJS_REVALIDATE_SECRET') && NEXTJS_REVALIDATE_SECRET !== 'YOUR_REVALIDATE_SECRET_HERE';

    if (!$secret_configured && current_user_can('manage_options')) {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p><strong>Next.js Revalidation:</strong> Please configure NEXTJS_REVALIDATE_SECRET in functions.php</p>
        </div>
        <?php
    }
}
add_action('admin_notices', 'nextjs_webhook_admin_notice');

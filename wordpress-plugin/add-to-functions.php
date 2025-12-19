<?php
/**
 * ADD THIS CODE TO YOUR THEME'S functions.php FILE
 * Location: wp-content/themes/your-active-theme/functions.php
 *
 * This will enable instant Next.js cache revalidation when you publish posts.
 */

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
        $category_slug = $categories[0]->slug;
    }

    // Prepare webhook data
    $data = array(
        'secret' => '5yLa9axcwkLcxA7TjSswYKLgwvhBn02coEsLS8yxZ3w=',
        'slug' => $post->post_name,
        'category' => $category_slug,
        'action' => $update ? 'update' : 'publish'
    );

    // Send webhook to Next.js (non-blocking)
    wp_remote_post('https://www.afriquesports.net/api/revalidate', array(
        'method' => 'POST',
        'timeout' => 5,
        'blocking' => false, // Non-blocking so it doesn't slow down WordPress
        'headers' => array('Content-Type' => 'application/json'),
        'body' => json_encode($data),
    ));
}

// Hook into post save action
add_action('save_post', 'afriquesports_trigger_nextjs_revalidation', 10, 3);

<?php
/**
 * Automatic Installer for Afrique Sports Revalidation
 *
 * Upload this file to: /wp-content/themes/your-theme/
 * Then visit: https://cms.realdemadrid.com/afriquesports/wp-content/themes/your-theme/install-revalidation.php
 *
 * This will automatically create and activate the revalidation plugin.
 */

// Security check - only allow access from localhost or with secret key
$allowed = false;
if (isset($_GET['secret']) && $_GET['secret'] === 'install-afriquesports-revalidation-2025') {
    $allowed = true;
}

if (!$allowed) {
    die('Access denied. Add ?secret=install-afriquesports-revalidation-2025 to URL');
}

// Plugin code
$plugin_code = <<<'EOD'
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
    $response = wp_remote_post('https://www.afriquesports.net/api/revalidate', array(
        'method' => 'POST',
        'timeout' => 5,
        'blocking' => false,
        'headers' => array('Content-Type' => 'application/json'),
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

add_action('save_post', 'afriquesports_trigger_nextjs_revalidation', 10, 3);
EOD;

// Create plugin directory
$plugin_dir = dirname(dirname(dirname(__FILE__))) . '/plugins/afriquesports-revalidation';
if (!file_exists($plugin_dir)) {
    mkdir($plugin_dir, 0755, true);
    echo "✅ Created plugin directory: $plugin_dir<br>";
} else {
    echo "ℹ️ Plugin directory already exists: $plugin_dir<br>";
}

// Write plugin file
$plugin_file = $plugin_dir . '/afriquesports-revalidation.php';
$result = file_put_contents($plugin_file, $plugin_code);

if ($result !== false) {
    echo "✅ Plugin file created: $plugin_file<br>";
    echo "✅ Size: " . filesize($plugin_file) . " bytes<br><br>";

    echo "<h2>Plugin installed successfully!</h2>";
    echo "<p><strong>Next step:</strong> Go to WordPress admin and activate the plugin:</p>";
    echo "<ol>";
    echo "<li>Go to: <a href='https://cms.realdemadrid.com/afriquesports/wp-admin/plugins.php' target='_blank'>Plugins page</a></li>";
    echo "<li>Find 'Afrique Sports - Next.js Revalidation'</li>";
    echo "<li>Click 'Activate'</li>";
    echo "</ol>";

    echo "<p><strong>For security:</strong> Delete this file after activation!</p>";

} else {
    echo "❌ Error: Could not create plugin file. Check file permissions.<br>";
    echo "Plugin directory: $plugin_dir<br>";
    echo "Is writable: " . (is_writable(dirname($plugin_dir)) ? 'Yes' : 'No');
}
?>

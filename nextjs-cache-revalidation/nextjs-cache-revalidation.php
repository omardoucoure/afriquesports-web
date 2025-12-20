<?php
/**
 * Plugin Name: Next.js Cache Revalidation for Afrique Sports
 * Plugin URI: https://www.afriquesports.net
 * Description: Automatically revalidates Next.js cache when posts are published, updated, or deleted
 * Version: 1.0.0
 * Author: Afrique Sports
 * Author URI: https://www.afriquesports.net
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class NextJS_Cache_Revalidation {

    private $option_name = 'nextjs_revalidation_settings';

    public function __construct() {
        // Add settings page
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);

        // Hook into post actions
        add_action('save_post', [$this, 'on_post_save'], 10, 3);
        add_action('before_delete_post', [$this, 'on_post_delete']);

        // Add admin notice if not configured
        add_action('admin_notices', [$this, 'admin_notice']);
    }

    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            'Next.js Revalidation Settings',
            'Next.js Revalidation',
            'manage_options',
            'nextjs-revalidation',
            [$this, 'settings_page_html']
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting($this->option_name, $this->option_name, [$this, 'sanitize_settings']);

        add_settings_section(
            'nextjs_revalidation_section',
            'Next.js Cache Revalidation Configuration',
            [$this, 'settings_section_callback'],
            'nextjs-revalidation'
        );

        add_settings_field(
            'revalidation_url',
            'Revalidation URL',
            [$this, 'revalidation_url_callback'],
            'nextjs-revalidation',
            'nextjs_revalidation_section'
        );

        add_settings_field(
            'revalidation_secret',
            'Revalidation Secret',
            [$this, 'revalidation_secret_callback'],
            'nextjs-revalidation',
            'nextjs_revalidation_section'
        );
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = [];
        $sanitized['revalidation_url'] = esc_url_raw($input['revalidation_url']);
        $sanitized['revalidation_secret'] = sanitize_text_field($input['revalidation_secret']);
        return $sanitized;
    }

    /**
     * Settings section description
     */
    public function settings_section_callback() {
        echo '<p>Configure the Next.js revalidation endpoint to automatically clear cache when posts are published.</p>';
    }

    /**
     * Revalidation URL field
     */
    public function revalidation_url_callback() {
        $options = get_option($this->option_name);
        $value = isset($options['revalidation_url']) ? $options['revalidation_url'] : 'https://www.afriquesports.net/api/revalidate';
        echo '<input type="url" name="' . $this->option_name . '[revalidation_url]" value="' . esc_attr($value) . '" class="regular-text" required />';
        echo '<p class="description">The Next.js revalidation API endpoint URL</p>';
    }

    /**
     * Revalidation secret field
     */
    public function revalidation_secret_callback() {
        $options = get_option($this->option_name);
        $value = isset($options['revalidation_secret']) ? $options['revalidation_secret'] : '';
        echo '<input type="password" name="' . $this->option_name . '[revalidation_secret]" value="' . esc_attr($value) . '" class="regular-text" required />';
        echo '<p class="description">The secret key from Vercel environment variables (REVALIDATE_SECRET)</p>';
    }

    /**
     * Settings page HTML
     */
    public function settings_page_html() {
        if (!current_user_can('manage_options')) {
            return;
        }

        if (isset($_GET['settings-updated'])) {
            add_settings_error('nextjs_revalidation_messages', 'nextjs_revalidation_message', 'Settings Saved', 'updated');
        }

        settings_errors('nextjs_revalidation_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            <form action="options.php" method="post">
                <?php
                settings_fields($this->option_name);
                do_settings_sections('nextjs-revalidation');
                submit_button('Save Settings');
                ?>
            </form>

            <hr>

            <h2>Recent Activity</h2>
            <?php $this->show_recent_logs(); ?>

            <hr>

            <h2>Test Revalidation</h2>
            <p>Click the button below to test the revalidation connection:</p>
            <button type="button" class="button button-secondary" id="test-revalidation">Test Connection</button>
            <div id="test-result" style="margin-top: 10px;"></div>

            <script>
            jQuery(document).ready(function($) {
                $('#test-revalidation').click(function() {
                    var button = $(this);
                    button.prop('disabled', true).text('Testing...');
                    $('#test-result').html('<p>Testing connection...</p>');

                    $.post(ajaxurl, {
                        action: 'test_nextjs_revalidation'
                    }, function(response) {
                        if (response.success) {
                            $('#test-result').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>');
                        } else {
                            $('#test-result').html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>');
                        }
                        button.prop('disabled', false).text('Test Connection');
                    });
                });
            });
            </script>
        </div>
        <?php
    }

    /**
     * Show recent revalidation logs
     */
    private function show_recent_logs() {
        $logs = get_option('nextjs_revalidation_logs', []);
        if (empty($logs)) {
            echo '<p>No revalidation activity yet.</p>';
            return;
        }

        echo '<table class="wp-list-table widefat fixed striped">';
        echo '<thead><tr><th>Time</th><th>Post</th><th>Category</th><th>Action</th><th>Status</th></tr></thead>';
        echo '<tbody>';

        foreach (array_reverse(array_slice($logs, -10)) as $log) {
            echo '<tr>';
            echo '<td>' . esc_html($log['time']) . '</td>';
            echo '<td>' . esc_html($log['post_title']) . '</td>';
            echo '<td>' . esc_html($log['category']) . '</td>';
            echo '<td>' . esc_html($log['action']) . '</td>';
            echo '<td>' . ($log['success'] ? '✅ Success' : '❌ Failed') . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
    }

    /**
     * Admin notice if plugin is not configured
     */
    public function admin_notice() {
        $options = get_option($this->option_name);

        if (!isset($options['revalidation_secret']) || empty($options['revalidation_secret'])) {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p><strong>Next.js Cache Revalidation:</strong> Please configure the revalidation settings in <a href="<?php echo admin_url('options-general.php?page=nextjs-revalidation'); ?>">Settings → Next.js Revalidation</a></p>
            </div>
            <?php
        }
    }

    /**
     * Triggered when a post is saved
     */
    public function on_post_save($post_id, $post, $update) {
        // Only trigger for published posts
        if ($post->post_status !== 'publish' || $post->post_type !== 'post') {
            return;
        }

        // Get post data
        $slug = $post->post_name;
        $categories = get_the_category($post_id);
        $category = !empty($categories) ? $categories[0]->slug : 'actualites';
        $action = $update ? 'update' : 'publish';

        // Send revalidation request
        $this->send_revalidation($slug, $category, $action, $post->post_title);
    }

    /**
     * Triggered when a post is deleted
     */
    public function on_post_delete($post_id) {
        $post = get_post($post_id);

        if (!$post || $post->post_type !== 'post') {
            return;
        }

        $slug = $post->post_name;
        $categories = get_the_category($post_id);
        $category = !empty($categories) ? $categories[0]->slug : 'actualites';

        $this->send_revalidation($slug, $category, 'delete', $post->post_title);
    }

    /**
     * Send revalidation request to Next.js
     */
    private function send_revalidation($slug, $category, $action, $post_title) {
        $options = get_option($this->option_name);

        if (!isset($options['revalidation_url']) || !isset($options['revalidation_secret'])) {
            error_log('Next.js revalidation: Settings not configured');
            return false;
        }

        $url = $options['revalidation_url'];
        $secret = $options['revalidation_secret'];

        $body = [
            'secret' => $secret,
            'slug' => $slug,
            'category' => $category,
            'action' => $action,
        ];

        $response = wp_remote_post($url, [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/json'],
            'body' => json_encode($body),
            'timeout' => 10,
            'blocking' => false, // Non-blocking to avoid slowing down WordPress
        ]);

        $success = !is_wp_error($response);

        // Log the activity
        $this->log_revalidation($post_title, $category, $action, $success);

        if ($success) {
            error_log("Next.js revalidation triggered: $slug ($category) - $action");
        } else {
            error_log("Next.js revalidation failed: " . $response->get_error_message());
        }

        return $success;
    }

    /**
     * Log revalidation activity
     */
    private function log_revalidation($post_title, $category, $action, $success) {
        $logs = get_option('nextjs_revalidation_logs', []);

        $logs[] = [
            'time' => current_time('mysql'),
            'post_title' => $post_title,
            'category' => $category,
            'action' => $action,
            'success' => $success,
        ];

        // Keep only last 50 logs
        if (count($logs) > 50) {
            $logs = array_slice($logs, -50);
        }

        update_option('nextjs_revalidation_logs', $logs);
    }
}

// Initialize the plugin
new NextJS_Cache_Revalidation();

// AJAX handler for test button
add_action('wp_ajax_test_nextjs_revalidation', function() {
    $options = get_option('nextjs_revalidation_settings');

    if (!isset($options['revalidation_url']) || !isset($options['revalidation_secret'])) {
        wp_send_json_error(['message' => 'Please configure settings first']);
        return;
    }

    $response = wp_remote_post($options['revalidation_url'], [
        'method' => 'POST',
        'headers' => ['Content-Type' => 'application/json'],
        'body' => json_encode([
            'secret' => $options['revalidation_secret'],
            'slug' => 'test-connection',
            'category' => 'test',
            'action' => 'publish',
        ]),
        'timeout' => 10,
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Connection failed: ' . $response->get_error_message()]);
    } else {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (isset($data['revalidated']) && $data['revalidated']) {
            wp_send_json_success(['message' => '✅ Connection successful! Cache revalidation is working.']);
        } else {
            wp_send_json_error(['message' => '❌ Connection failed. Check your secret key.']);
        }
    }
});

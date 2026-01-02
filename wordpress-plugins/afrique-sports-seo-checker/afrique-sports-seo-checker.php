<?php
/**
 * Plugin Name: Afrique Sports SEO Checker
 * Plugin URI: https://www.afriquesports.net
 * Description: Custom SEO checklist plugin ensuring all articles meet Google News and SEO best practices for 2025. Validates title length, featured images (1200x628, <200KB), word count, meta descriptions, internal links, and more.
 * Version: 1.0.1
 * Author: Afrique Sports
 * Author URI: https://www.afriquesports.net
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: afrique-sports-seo
 * Domain Path: /languages
 *
 * @package Afrique_Sports_SEO_Checker
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants.
define('AFRIQUE_SEO_VERSION', '1.0.1');
define('AFRIQUE_SEO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('AFRIQUE_SEO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('AFRIQUE_SEO_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class Afrique_Sports_SEO_Checker {

    /**
     * Single instance of the class
     *
     * @var Afrique_Sports_SEO_Checker
     */
    private static $instance = null;

    /**
     * Plugin settings
     *
     * @var array
     */
    private $settings = array();

    /**
     * Get single instance
     *
     * @return Afrique_Sports_SEO_Checker
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
        $this->load_settings();
    }

    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        require_once AFRIQUE_SEO_PLUGIN_DIR . 'includes/class-image-quality.php';
        require_once AFRIQUE_SEO_PLUGIN_DIR . 'includes/class-validators.php';
        require_once AFRIQUE_SEO_PLUGIN_DIR . 'includes/class-meta-box.php';
        require_once AFRIQUE_SEO_PLUGIN_DIR . 'includes/class-admin-settings.php';
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Load translations
        add_action('plugins_loaded', array($this, 'load_textdomain'));

        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Admin hooks
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // Publishing validation
        add_action('wp_insert_post', array($this, 'validate_before_publish'), 10, 3);
        add_filter('wp_insert_post_data', array($this, 'prevent_invalid_publish'), 99, 2);

        // Additional validation after insert (for API posts with meta_input)
        add_action('wp_after_insert_post', array($this, 'validate_after_insert'), 10, 4);
    }

    /**
     * Load plugin text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'afrique-sports-seo',
            false,
            dirname(AFRIQUE_SEO_PLUGIN_BASENAME) . '/languages/'
        );
    }

    /**
     * Load plugin settings
     */
    private function load_settings() {
        $defaults = array(
            // Title settings
            'title_min' => 45,
            'title_max' => 60,
            'title_required' => true,

            // Content settings
            'content_min_words' => 400,
            'content_max_words' => 2000,
            'content_min_headings' => 2,
            'content_required' => true,

            // Featured image settings
            'image_required' => true,
            'image_min_width' => 1200,
            'image_min_height' => 628,
            'image_max_size_kb' => 200,
            'image_alt_required' => true,
            'image_alt_max_chars' => 125,
            'image_quality_check' => true,

            // Meta description settings
            'meta_desc_required' => true,
            'meta_desc_min' => 140,
            'meta_desc_max' => 160,

            // Links settings
            'internal_links_min' => 2,
            'internal_links_max' => 5,

            // Categories and tags
            'category_required' => true,
            'category_min' => 1,
            'category_max' => 3,
            'tags_min' => 3,
            'tags_max' => 8,

            // Permalink settings
            'permalink_max_length' => 75,

            // Post types to check
            'post_types' => array('post'),

            // Enforcement level
            'block_publishing' => true,
        );

        $this->settings = wp_parse_args(get_option('afrique_seo_settings', array()), $defaults);
    }

    /**
     * Get setting value
     *
     * @param string $key Setting key.
     * @return mixed Setting value.
     */
    public function get_setting($key) {
        return isset($this->settings[$key]) ? $this->settings[$key] : null;
    }

    /**
     * Enqueue admin assets
     *
     * @param string $hook Current admin page hook.
     */
    public function enqueue_admin_assets($hook) {
        // Only load on post edit screens
        if (!in_array($hook, array('post.php', 'post-new.php'))) {
            return;
        }

        wp_enqueue_style(
            'afrique-seo-admin',
            AFRIQUE_SEO_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            AFRIQUE_SEO_VERSION
        );

        wp_enqueue_script(
            'afrique-seo-admin',
            AFRIQUE_SEO_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            AFRIQUE_SEO_VERSION,
            true
        );

        wp_localize_script('afrique-seo-admin', 'afriqueSEO', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('afrique_seo_nonce'),
            'strings' => array(
                'checking' => __('Checking...', 'afrique-sports-seo'),
                'passed' => __('Passed', 'afrique-sports-seo'),
                'failed' => __('Failed', 'afrique-sports-seo'),
                'warning' => __('Warning', 'afrique-sports-seo'),
            ),
        ));
    }

    /**
     * Validate before publish
     *
     * @param int     $post_id Post ID.
     * @param WP_Post $post    Post object.
     * @param bool    $update  Whether this is an update.
     */
    public function validate_before_publish($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (wp_is_post_revision($post_id)) {
            return;
        }

        // Only check configured post types
        if (!in_array($post->post_type, $this->get_setting('post_types'))) {
            return;
        }

        // Only validate when publishing
        if ($post->post_status !== 'publish') {
            return;
        }

        // Run validation
        $validator = new Afrique_SEO_Validators();
        $results = $validator->validate_post($post_id);

        // Store validation results
        update_post_meta($post_id, '_afrique_seo_validation', $results);
        update_post_meta($post_id, '_afrique_seo_last_check', current_time('mysql'));
    }

    /**
     * Prevent publishing if validation fails
     *
     * @param array $data    Post data.
     * @param array $postarr Post array.
     * @return array Modified post data.
     */
    public function prevent_invalid_publish($data, $postarr) {
        // Skip if not blocking publishing
        if (!$this->get_setting('block_publishing')) {
            return $data;
        }

        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return $data;
        }

        // Only check configured post types
        if (!in_array($data['post_type'], $this->get_setting('post_types'))) {
            return $data;
        }

        // Only validate when trying to publish
        if ($data['post_status'] !== 'publish') {
            return $data;
        }

        // Skip if this is an API post with meta_input (will be validated in wp_after_insert_post)
        if (isset($postarr['meta_input']) && !empty($postarr['meta_input'])) {
            return $data;
        }

        // Get post ID (for updates)
        $post_id = isset($postarr['ID']) ? $postarr['ID'] : 0;

        // Run validation
        $validator = new Afrique_SEO_Validators();
        $results = $validator->validate_post($post_id, $data, $postarr);

        // Check if validation passed
        $has_errors = false;
        foreach ($results as $check) {
            if ($check['status'] === 'error' && $check['required']) {
                $has_errors = true;
                break;
            }
        }

        // If validation failed, change status to draft
        if ($has_errors) {
            $data['post_status'] = 'draft';

            // Add admin notice
            add_filter('redirect_post_location', function($location) {
                return add_query_arg('afrique_seo_failed', '1', $location);
            });
        }

        return $data;
    }

    /**
     * Validate after post insert (catches API posts with meta_input)
     *
     * @param int     $post_id     Post ID.
     * @param WP_Post $post        Post object.
     * @param bool    $update      Whether this is an update.
     * @param WP_Post $post_before Previous post object (if update).
     */
    public function validate_after_insert($post_id, $post, $update, $post_before) {
        // Skip if not blocking
        if (!$this->get_setting('block_publishing')) {
            return;
        }

        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (wp_is_post_revision($post_id)) {
            return;
        }

        // Only check configured post types
        if (!in_array($post->post_type, $this->get_setting('post_types'))) {
            return;
        }

        // Only check if post is published
        if ($post->post_status !== 'publish') {
            return;
        }

        // Run validation with full post data (meta is now saved)
        $validator = new Afrique_SEO_Validators();
        $results = $validator->validate_post($post_id);

        // Check for required failures
        $has_errors = false;
        foreach ($results as $check) {
            if ($check['status'] === 'error' && !empty($check['required'])) {
                $has_errors = true;
                break;
            }
        }

        // If validation failed, unpublish the post
        if ($has_errors) {
            wp_update_post(array(
                'ID' => $post_id,
                'post_status' => 'draft',
            ));

            // Store validation results
            update_post_meta($post_id, '_afrique_seo_validation', $results);
            update_post_meta($post_id, '_afrique_seo_last_check', current_time('mysql'));
        }
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Set default settings
        if (!get_option('afrique_seo_settings')) {
            update_option('afrique_seo_settings', $this->settings);
        }

        // Schedule any necessary cron jobs here if needed
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up cron jobs here if needed
        flush_rewrite_rules();
    }
}

/**
 * Initialize the plugin
 */
function afrique_seo_init() {
    return Afrique_Sports_SEO_Checker::get_instance();
}

// Start the plugin
afrique_seo_init();

/**
 * Add admin notice for validation failures
 */
add_action('admin_notices', function() {
    if (isset($_GET['afrique_seo_failed']) && $_GET['afrique_seo_failed'] === '1') {
        ?>
        <div class="notice notice-error is-dismissible">
            <p><strong><?php _e('Publishing Blocked: SEO Requirements Not Met', 'afrique-sports-seo'); ?></strong></p>
            <p><?php _e('Your post does not meet the required SEO standards. Please check the SEO Checklist meta box below the editor and fix all required items before publishing.', 'afrique-sports-seo'); ?></p>
        </div>
        <?php
    }
});

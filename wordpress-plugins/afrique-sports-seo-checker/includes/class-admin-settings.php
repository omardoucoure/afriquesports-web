<?php
/**
 * Admin Settings Page
 *
 * Allows customization of SEO requirements
 *
 * @package Afrique_Sports_SEO_Checker
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Admin Settings Class
 */
class Afrique_SEO_Admin_Settings {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            __('Afrique Sports SEO Settings', 'afrique-sports-seo'),
            __('SEO Checker', 'afrique-sports-seo'),
            'manage_options',
            'afrique-seo-settings',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting(
            'afrique_seo_settings_group',
            'afrique_seo_settings',
            array($this, 'sanitize_settings')
        );

        // Title Settings
        add_settings_section(
            'afrique_seo_title',
            __('Title Settings', 'afrique-sports-seo'),
            array($this, 'render_title_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'title_min',
            __('Minimum Characters', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_title',
            array('field' => 'title_min', 'default' => 45)
        );

        add_settings_field(
            'title_max',
            __('Maximum Characters', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_title',
            array('field' => 'title_max', 'default' => 60)
        );

        add_settings_field(
            'title_required',
            __('Required', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_title',
            array('field' => 'title_required', 'default' => true)
        );

        // Content Settings
        add_settings_section(
            'afrique_seo_content',
            __('Content Settings', 'afrique-sports-seo'),
            array($this, 'render_content_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'content_min_words',
            __('Minimum Word Count', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_content',
            array('field' => 'content_min_words', 'default' => 400)
        );

        add_settings_field(
            'content_max_words',
            __('Maximum Word Count', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_content',
            array('field' => 'content_max_words', 'default' => 2000)
        );

        add_settings_field(
            'content_min_headings',
            __('Minimum Headings (H2/H3)', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_content',
            array('field' => 'content_min_headings', 'default' => 2)
        );

        // Featured Image Settings
        add_settings_section(
            'afrique_seo_image',
            __('Featured Image Settings', 'afrique-sports-seo'),
            array($this, 'render_image_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'image_required',
            __('Required', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_required', 'default' => true)
        );

        add_settings_field(
            'image_min_width',
            __('Minimum Width (px)', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_min_width', 'default' => 1200)
        );

        add_settings_field(
            'image_min_height',
            __('Minimum Height (px)', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_min_height', 'default' => 628)
        );

        add_settings_field(
            'image_max_size_kb',
            __('Maximum File Size (KB)', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_max_size_kb', 'default' => 200)
        );

        add_settings_field(
            'image_alt_required',
            __('Alt Text Required', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_alt_required', 'default' => true)
        );

        add_settings_field(
            'image_alt_max_chars',
            __('Alt Text Max Characters', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_alt_max_chars', 'default' => 125)
        );

        add_settings_field(
            'image_quality_check',
            __('Enable Quality Check', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_image',
            array('field' => 'image_quality_check', 'default' => true, 'help' => __('Check for blur, brightness, and contrast issues', 'afrique-sports-seo'))
        );

        // Meta Description Settings
        add_settings_section(
            'afrique_seo_meta',
            __('Meta Description Settings', 'afrique-sports-seo'),
            array($this, 'render_meta_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'meta_desc_required',
            __('Required', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_meta',
            array('field' => 'meta_desc_required', 'default' => true)
        );

        add_settings_field(
            'meta_desc_min',
            __('Minimum Characters', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_meta',
            array('field' => 'meta_desc_min', 'default' => 140)
        );

        add_settings_field(
            'meta_desc_max',
            __('Maximum Characters', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_meta',
            array('field' => 'meta_desc_max', 'default' => 160)
        );

        // Links Settings
        add_settings_section(
            'afrique_seo_links',
            __('Internal Links Settings', 'afrique-sports-seo'),
            array($this, 'render_links_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'internal_links_min',
            __('Minimum Internal Links', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_links',
            array('field' => 'internal_links_min', 'default' => 2)
        );

        add_settings_field(
            'internal_links_max',
            __('Maximum Internal Links', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_links',
            array('field' => 'internal_links_max', 'default' => 5)
        );

        // Categories and Tags
        add_settings_section(
            'afrique_seo_taxonomy',
            __('Categories & Tags Settings', 'afrique-sports-seo'),
            array($this, 'render_taxonomy_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'category_required',
            __('Category Required', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_taxonomy',
            array('field' => 'category_required', 'default' => true)
        );

        add_settings_field(
            'category_min',
            __('Minimum Categories', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_taxonomy',
            array('field' => 'category_min', 'default' => 1)
        );

        add_settings_field(
            'category_max',
            __('Maximum Categories', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_taxonomy',
            array('field' => 'category_max', 'default' => 3)
        );

        add_settings_field(
            'tags_min',
            __('Minimum Tags', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_taxonomy',
            array('field' => 'tags_min', 'default' => 3)
        );

        add_settings_field(
            'tags_max',
            __('Maximum Tags', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_taxonomy',
            array('field' => 'tags_max', 'default' => 8)
        );

        // General Settings
        add_settings_section(
            'afrique_seo_general',
            __('General Settings', 'afrique-sports-seo'),
            array($this, 'render_general_section'),
            'afrique-seo-settings'
        );

        add_settings_field(
            'permalink_max_length',
            __('Permalink Max Length', 'afrique-sports-seo'),
            array($this, 'render_number_field'),
            'afrique-seo-settings',
            'afrique_seo_general',
            array('field' => 'permalink_max_length', 'default' => 75)
        );

        add_settings_field(
            'post_types',
            __('Post Types to Check', 'afrique-sports-seo'),
            array($this, 'render_post_types_field'),
            'afrique-seo-settings',
            'afrique_seo_general',
            array('field' => 'post_types')
        );

        add_settings_field(
            'block_publishing',
            __('Block Publishing on Failure', 'afrique-sports-seo'),
            array($this, 'render_checkbox_field'),
            'afrique-seo-settings',
            'afrique_seo_general',
            array('field' => 'block_publishing', 'default' => true)
        );
    }

    /**
     * Section callbacks
     */
    public function render_title_section() {
        echo '<p>' . __('Configure title length requirements for SEO optimization.', 'afrique-sports-seo') . '</p>';
    }

    public function render_content_section() {
        echo '<p>' . __('Set content quality requirements including word count and heading structure.', 'afrique-sports-seo') . '</p>';
    }

    public function render_image_section() {
        echo '<p>' . __('Featured image requirements for Google News and social sharing (recommended: 1200x628px, <200KB).', 'afrique-sports-seo') . '</p>';
    }

    public function render_meta_section() {
        echo '<p>' . __('Meta description requirements. Integrates with Yoast SEO, Rank Math, and All in One SEO.', 'afrique-sports-seo') . '</p>';
    }

    public function render_links_section() {
        echo '<p>' . __('Internal linking requirements for better SEO and user experience.', 'afrique-sports-seo') . '</p>';
    }

    public function render_taxonomy_section() {
        echo '<p>' . __('Category and tag requirements for content organization.', 'afrique-sports-seo') . '</p>';
    }

    public function render_general_section() {
        echo '<p>' . __('General plugin settings and enforcement options.', 'afrique-sports-seo') . '</p>';
    }

    /**
     * Render number input field
     */
    public function render_number_field($args) {
        $plugin = Afrique_Sports_SEO_Checker::get_instance();
        $value = $plugin->get_setting($args['field']);
        $default = isset($args['default']) ? $args['default'] : 0;

        if ($value === null) {
            $value = $default;
        }

        printf(
            '<input type="number" name="afrique_seo_settings[%s]" value="%s" class="small-text" min="0" />',
            esc_attr($args['field']),
            esc_attr($value)
        );
    }

    /**
     * Render checkbox field
     */
    public function render_checkbox_field($args) {
        $plugin = Afrique_Sports_SEO_Checker::get_instance();
        $value = $plugin->get_setting($args['field']);
        $default = isset($args['default']) ? $args['default'] : false;

        if ($value === null) {
            $value = $default;
        }

        printf(
            '<label><input type="checkbox" name="afrique_seo_settings[%s]" value="1" %s /> %s</label>',
            esc_attr($args['field']),
            checked($value, true, false),
            __('Enable', 'afrique-sports-seo')
        );

        if (isset($args['help'])) {
            echo '<p class="description">' . esc_html($args['help']) . '</p>';
        }
    }

    /**
     * Render post types field
     */
    public function render_post_types_field($args) {
        $plugin = Afrique_Sports_SEO_Checker::get_instance();
        $selected = $plugin->get_setting($args['field']);

        if (!is_array($selected)) {
            $selected = array('post');
        }

        $post_types = get_post_types(array('public' => true), 'objects');

        echo '<fieldset>';
        foreach ($post_types as $post_type) {
            $checked = in_array($post_type->name, $selected);
            printf(
                '<label><input type="checkbox" name="afrique_seo_settings[post_types][]" value="%s" %s /> %s</label><br>',
                esc_attr($post_type->name),
                checked($checked, true, false),
                esc_html($post_type->label)
            );
        }
        echo '</fieldset>';
    }

    /**
     * Sanitize settings before saving
     */
    public function sanitize_settings($input) {
        $sanitized = array();

        // Number fields
        $number_fields = array(
            'title_min', 'title_max', 'content_min_words', 'content_max_words',
            'content_min_headings', 'image_min_width', 'image_min_height',
            'image_max_size_kb', 'image_alt_max_chars', 'meta_desc_min',
            'meta_desc_max', 'internal_links_min', 'internal_links_max',
            'category_min', 'category_max', 'tags_min', 'tags_max',
            'permalink_max_length'
        );

        foreach ($number_fields as $field) {
            $sanitized[$field] = isset($input[$field]) ? absint($input[$field]) : 0;
        }

        // Boolean fields
        $boolean_fields = array(
            'title_required', 'image_required', 'image_alt_required',
            'image_quality_check', 'meta_desc_required', 'category_required',
            'block_publishing'
        );

        foreach ($boolean_fields as $field) {
            $sanitized[$field] = isset($input[$field]) ? true : false;
        }

        // Post types array
        if (isset($input['post_types']) && is_array($input['post_types'])) {
            $sanitized['post_types'] = array_map('sanitize_key', $input['post_types']);
        } else {
            $sanitized['post_types'] = array('post');
        }

        return $sanitized;
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Save settings
        if (isset($_GET['settings-updated'])) {
            add_settings_error(
                'afrique_seo_messages',
                'afrique_seo_message',
                __('Settings saved successfully.', 'afrique-sports-seo'),
                'success'
            );
        }

        settings_errors('afrique_seo_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="afrique-seo-settings-header">
                <p class="description">
                    <?php _e('Configure SEO requirements for your content. These settings ensure all articles meet Google News and SEO best practices for 2025.', 'afrique-sports-seo'); ?>
                </p>
            </div>

            <form action="options.php" method="post">
                <?php
                settings_fields('afrique_seo_settings_group');
                do_settings_sections('afrique-seo-settings');
                submit_button(__('Save Settings', 'afrique-sports-seo'));
                ?>
            </form>

            <div class="afrique-seo-help-section">
                <h2><?php _e('SEO Best Practices 2025', 'afrique-sports-seo'); ?></h2>
                <ul>
                    <li><strong><?php _e('Title:', 'afrique-sports-seo'); ?></strong> <?php _e('45-60 characters optimal for Google search results', 'afrique-sports-seo'); ?></li>
                    <li><strong><?php _e('Featured Image:', 'afrique-sports-seo'); ?></strong> <?php _e('1200x628px minimum for social sharing and Google News', 'afrique-sports-seo'); ?></li>
                    <li><strong><?php _e('Meta Description:', 'afrique-sports-seo'); ?></strong> <?php _e('140-160 characters for best SERP display', 'afrique-sports-seo'); ?></li>
                    <li><strong><?php _e('Word Count:', 'afrique-sports-seo'); ?></strong> <?php _e('400-2000 words for news articles', 'afrique-sports-seo'); ?></li>
                    <li><strong><?php _e('Internal Links:', 'afrique-sports-seo'); ?></strong> <?php _e('2-5 links improve site structure and engagement', 'afrique-sports-seo'); ?></li>
                </ul>
            </div>
        </div>
        <?php
    }
}

// Initialize
new Afrique_SEO_Admin_Settings();

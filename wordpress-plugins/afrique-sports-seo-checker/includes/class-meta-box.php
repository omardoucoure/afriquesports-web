<?php
/**
 * SEO Checklist Meta Box
 *
 * Displays validation results in the post editor sidebar
 *
 * @package Afrique_Sports_SEO_Checker
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Meta Box Handler Class
 */
class Afrique_SEO_Meta_Box {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('add_meta_boxes', array($this, 'add_meta_box'));
        add_action('wp_ajax_afrique_seo_validate', array($this, 'ajax_validate'));
    }

    /**
     * Register meta box
     */
    public function add_meta_box() {
        $plugin = Afrique_Sports_SEO_Checker::get_instance();
        $post_types = $plugin->get_setting('post_types');

        add_meta_box(
            'afrique-seo-checklist',
            __('SEO Checklist - Afrique Sports', 'afrique-sports-seo'),
            array($this, 'render_meta_box'),
            $post_types,
            'side',
            'high'
        );
    }

    /**
     * Render meta box content
     *
     * @param WP_Post $post Current post object.
     */
    public function render_meta_box($post) {
        wp_nonce_field('afrique_seo_meta_box', 'afrique_seo_nonce');

        // Get validation results
        $results = $this->get_validation_results($post->ID);
        $last_check = get_post_meta($post->ID, '_afrique_seo_last_check', true);

        ?>
        <div class="afrique-seo-checklist">
            <div class="afrique-seo-header">
                <p class="description">
                    <?php _e('All items must pass before publishing. Click "Run Check" to validate.', 'afrique-sports-seo'); ?>
                </p>
                <button type="button" class="button button-secondary afrique-seo-run-check" data-post-id="<?php echo esc_attr($post->ID); ?>">
                    <span class="dashicons dashicons-update"></span>
                    <?php _e('Run Check', 'afrique-sports-seo'); ?>
                </button>
                <?php if ($last_check): ?>
                    <p class="afrique-seo-last-check">
                        <?php printf(
                            __('Last checked: %s', 'afrique-sports-seo'),
                            human_time_diff(strtotime($last_check), current_time('timestamp')) . ' ' . __('ago', 'afrique-sports-seo')
                        ); ?>
                    </p>
                <?php endif; ?>
            </div>

            <div class="afrique-seo-results">
                <?php if (!empty($results)): ?>
                    <?php $this->render_results($results); ?>
                <?php else: ?>
                    <p class="afrique-seo-no-results">
                        <?php _e('Click "Run Check" to validate your post.', 'afrique-sports-seo'); ?>
                    </p>
                <?php endif; ?>
            </div>

            <div class="afrique-seo-summary" style="<?php echo empty($results) ? 'display:none;' : ''; ?>">
                <?php $this->render_summary($results); ?>
            </div>
        </div>
        <?php
    }

    /**
     * Get validation results for a post
     *
     * @param int $post_id Post ID.
     * @return array Validation results.
     */
    private function get_validation_results($post_id) {
        if (!$post_id) {
            return array();
        }

        $results = get_post_meta($post_id, '_afrique_seo_validation', true);
        return is_array($results) ? $results : array();
    }

    /**
     * Render validation results
     *
     * @param array $results Validation results.
     */
    private function render_results($results) {
        if (empty($results)) {
            return;
        }

        echo '<ul class="afrique-seo-checklist-items">';

        foreach ($results as $key => $result) {
            $status_class = 'afrique-seo-' . esc_attr($result['status']);
            $icon = $this->get_status_icon($result['status']);
            $required_badge = !empty($result['required']) ? '<span class="required-badge">' . __('Required', 'afrique-sports-seo') . '</span>' : '';

            echo '<li class="' . esc_attr($status_class) . '" data-check="' . esc_attr($key) . '">';
            echo '<span class="afrique-seo-icon">' . $icon . '</span>';
            echo '<div class="afrique-seo-check-content">';
            echo '<strong>' . esc_html($result['label']) . '</strong> ' . $required_badge;
            echo '<p class="afrique-seo-message">' . esc_html($result['message']) . '</p>';

            if (isset($result['value'])) {
                echo '<p class="afrique-seo-value">' . esc_html($result['value']) . '</p>';
            }

            if (!empty($result['help'])) {
                echo '<p class="afrique-seo-help"><em>' . esc_html($result['help']) . '</em></p>';
            }

            echo '</div>';
            echo '</li>';
        }

        echo '</ul>';
    }

    /**
     * Render summary stats
     *
     * @param array $results Validation results.
     */
    private function render_summary($results) {
        if (empty($results)) {
            return;
        }

        $total = count($results);
        $passed = 0;
        $failed = 0;
        $warnings = 0;
        $required_failed = 0;

        foreach ($results as $result) {
            if ($result['status'] === 'success') {
                $passed++;
            } elseif ($result['status'] === 'error') {
                $failed++;
                if (!empty($result['required'])) {
                    $required_failed++;
                }
            } elseif ($result['status'] === 'warning') {
                $warnings++;
            }
        }

        $score_percentage = $total > 0 ? round(($passed / $total) * 100) : 0;

        ?>
        <div class="afrique-seo-score">
            <div class="afrique-seo-score-circle" data-score="<?php echo esc_attr($score_percentage); ?>">
                <span class="score-number"><?php echo esc_html($score_percentage); ?>%</span>
            </div>
            <div class="afrique-seo-score-stats">
                <div class="stat stat-passed">
                    <span class="dashicons dashicons-yes"></span>
                    <?php printf(__('%d Passed', 'afrique-sports-seo'), $passed); ?>
                </div>
                <div class="stat stat-failed">
                    <span class="dashicons dashicons-no"></span>
                    <?php printf(__('%d Failed', 'afrique-sports-seo'), $failed); ?>
                </div>
                <?php if ($warnings > 0): ?>
                    <div class="stat stat-warnings">
                        <span class="dashicons dashicons-warning"></span>
                        <?php printf(__('%d Warnings', 'afrique-sports-seo'), $warnings); ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <?php if ($required_failed > 0): ?>
            <div class="afrique-seo-block-notice">
                <span class="dashicons dashicons-lock"></span>
                <?php printf(
                    __('Publishing blocked: %d required items must pass.', 'afrique-sports-seo'),
                    $required_failed
                ); ?>
            </div>
        <?php endif; ?>
        <?php
    }

    /**
     * Get status icon
     *
     * @param string $status Status type.
     * @return string Icon HTML.
     */
    private function get_status_icon($status) {
        $icons = array(
            'success' => '<span class="dashicons dashicons-yes-alt" style="color: #46b450;"></span>',
            'error'   => '<span class="dashicons dashicons-dismiss" style="color: #dc3232;"></span>',
            'warning' => '<span class="dashicons dashicons-warning" style="color: #ffb900;"></span>',
            'info'    => '<span class="dashicons dashicons-info" style="color: #00a0d2;"></span>',
        );

        return isset($icons[$status]) ? $icons[$status] : $icons['info'];
    }

    /**
     * AJAX handler for validation
     */
    public function ajax_validate() {
        check_ajax_referer('afrique_seo_nonce', 'nonce');

        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;

        if (!$post_id) {
            wp_send_json_error(array('message' => __('Invalid post ID.', 'afrique-sports-seo')));
        }

        if (!current_user_can('edit_post', $post_id)) {
            wp_send_json_error(array('message' => __('Permission denied.', 'afrique-sports-seo')));
        }

        // Run validation
        $validator = new Afrique_SEO_Validators();
        $results = $validator->validate_post($post_id);

        // Store results
        update_post_meta($post_id, '_afrique_seo_validation', $results);
        update_post_meta($post_id, '_afrique_seo_last_check', current_time('mysql'));

        // Calculate summary
        $total = count($results);
        $passed = 0;
        $required_failed = 0;

        foreach ($results as $result) {
            if ($result['status'] === 'success') {
                $passed++;
            } elseif ($result['status'] === 'error' && !empty($result['required'])) {
                $required_failed++;
            }
        }

        wp_send_json_success(array(
            'results' => $results,
            'summary' => array(
                'total' => $total,
                'passed' => $passed,
                'score' => $total > 0 ? round(($passed / $total) * 100) : 0,
                'can_publish' => $required_failed === 0,
                'required_failed' => $required_failed,
            ),
            'html' => $this->render_results_html($results),
        ));
    }

    /**
     * Render results as HTML string for AJAX
     *
     * @param array $results Validation results.
     * @return string HTML output.
     */
    private function render_results_html($results) {
        ob_start();
        $this->render_results($results);
        $results_html = ob_get_clean();

        ob_start();
        $this->render_summary($results);
        $summary_html = ob_get_clean();

        return array(
            'results' => $results_html,
            'summary' => $summary_html,
        );
    }
}

// Initialize
new Afrique_SEO_Meta_Box();

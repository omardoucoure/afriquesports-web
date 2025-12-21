<?php
/**
 * Plugin Name: AFCON Agent Monitor
 * Plugin URI: https://www.afriquesports.net
 * Description: Monitor and control the AFCON 2025 AI Agent running on DigitalOcean
 * Version: 1.0.0
 * Author: Afrique Sports
 * Author URI: https://www.afriquesports.net
 * License: GPL v2 or later
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('AFCON_AGENT_MONITOR_VERSION', '1.0.0');
define('AFCON_AGENT_MONITOR_PATH', plugin_dir_path(__FILE__));
define('AFCON_AGENT_MONITOR_URL', plugin_dir_url(__FILE__));

// Load phpseclib autoloader
require_once AFCON_AGENT_MONITOR_PATH . 'phpseclib/autoload.php';

// Load plugin classes
require_once AFCON_AGENT_MONITOR_PATH . 'includes/class-ssh-connector.php';
require_once AFCON_AGENT_MONITOR_PATH . 'includes/class-agent-monitor.php';
require_once AFCON_AGENT_MONITOR_PATH . 'includes/class-admin-page.php';
require_once AFCON_AGENT_MONITOR_PATH . 'includes/class-dashboard-widget.php';

/**
 * Main plugin class
 */
class AFCON_Agent_Monitor_Plugin {

    private static $instance = null;

    /**
     * Get singleton instance
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
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);

        // Initialize plugin
        add_action('plugins_loaded', [$this, 'init']);
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Initialize admin page
        if (is_admin()) {
            $admin_page = new AFCON_Admin_Page();
            $dashboard_widget = new AFCON_Dashboard_Widget();
        }

        // Register AJAX endpoints
        $this->register_ajax_endpoints();

        // Enqueue assets
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
    }

    /**
     * Register AJAX endpoints
     */
    private function register_ajax_endpoints() {
        $monitor = new AFCON_Agent_Monitor();

        add_action('wp_ajax_afcon_get_status', [$monitor, 'ajax_get_status']);
        add_action('wp_ajax_afcon_start_agent', [$monitor, 'ajax_start_agent']);
        add_action('wp_ajax_afcon_stop_agent', [$monitor, 'ajax_stop_agent']);
        add_action('wp_ajax_afcon_restart_agent', [$monitor, 'ajax_restart_agent']);
        add_action('wp_ajax_afcon_get_logs', [$monitor, 'ajax_get_logs']);
        add_action('wp_ajax_afcon_get_statistics', [$monitor, 'ajax_get_statistics']);
        add_action('wp_ajax_afcon_test_connection', [$monitor, 'ajax_test_connection']);
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on plugin pages
        if (strpos($hook, 'afcon-agent-monitor') === false && $hook !== 'index.php') {
            return;
        }

        // Enqueue CSS
        wp_enqueue_style(
            'afcon-agent-monitor-admin',
            AFCON_AGENT_MONITOR_URL . 'assets/css/admin-style.css',
            [],
            AFCON_AGENT_MONITOR_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'afcon-agent-monitor-admin',
            AFCON_AGENT_MONITOR_URL . 'assets/js/admin-script.js',
            ['jquery'],
            AFCON_AGENT_MONITOR_VERSION,
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('afcon-agent-monitor-admin', 'afconMonitor', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('afcon_monitor_nonce'),
            'strings' => [
                'starting' => __('Starting agent...', 'afcon-agent-monitor'),
                'stopping' => __('Stopping agent...', 'afcon-agent-monitor'),
                'restarting' => __('Restarting agent...', 'afcon-agent-monitor'),
                'success' => __('Success!', 'afcon-agent-monitor'),
                'error' => __('Error:', 'afcon-agent-monitor'),
            ]
        ]);
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create default settings
        $default_settings = [
            'ssh_host' => '159.223.103.16',
            'ssh_port' => 22,
            'ssh_username' => '',
            'ssh_auth_method' => 'key',
            'ssh_private_key' => '',
            'ssh_password' => '',
            'dashboard_refresh' => 5,
            'logs_refresh' => 5,
            'configured' => false,
        ];

        if (!get_option('afcon_agent_settings')) {
            add_option('afcon_agent_settings', $default_settings);
        }

        // Create activity log option
        if (!get_option('afcon_agent_activity_logs')) {
            add_option('afcon_agent_activity_logs', []);
        }
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up transients
        delete_transient('afcon_agent_status');
        delete_transient('afcon_agent_logs');
    }
}

// Initialize plugin
AFCON_Agent_Monitor_Plugin::get_instance();

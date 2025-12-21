<?php
/**
 * Agent Monitor Class
 * Core monitoring logic and AJAX handlers
 */

class AFCON_Agent_Monitor {

    private $ssh;

    /**
     * Constructor
     */
    public function __construct() {
        $this->ssh = new AFCON_SSH_Connector();
    }

    /**
     * Get dashboard data
     *
     * @return array Dashboard data
     */
    public function get_dashboard_data() {
        // Try to get cached data first
        $cached = get_transient('afcon_agent_dashboard');
        if ($cached !== false) {
            return $cached;
        }

        $data = [
            'status' => 'unknown',
            'running' => false,
            'uptime' => 'Unknown',
            'events_today' => 0,
            'articles_today' => 0,
            'last_check' => 'Unknown',
            'recent_logs' => [],
            'error' => null,
        ];

        // Get agent status
        $status = $this->ssh->get_agent_status();
        if (is_wp_error($status)) {
            $data['error'] = $status->get_error_message();
            $data['status'] = 'error';
        } else {
            $data['running'] = $status['running'];
            $data['status'] = $status['running'] ? 'running' : 'stopped';

            // Get uptime if running
            if ($status['running']) {
                $uptime = $this->ssh->get_uptime();
                $data['uptime'] = is_wp_error($uptime) ? 'Unknown' : $uptime;
            }
        }

        // Get recent logs
        $logs = $this->ssh->get_logs(20);
        if (!is_wp_error($logs)) {
            $data['recent_logs'] = array_filter(explode("\n", $logs));

            // Parse statistics from logs
            $stats = $this->parse_statistics_from_logs($logs);
            $data['events_today'] = $stats['events_today'];
            $data['articles_today'] = $stats['articles_today'];
            $data['last_check'] = $stats['last_check'];
        }

        // Cache for 3 seconds
        set_transient('afcon_agent_dashboard', $data, 3);

        return $data;
    }

    /**
     * Parse statistics from logs
     *
     * @param string $logs Log content
     * @return array Parsed statistics
     */
    public function parse_statistics_from_logs($logs) {
        $stats = [
            'events_today' => 0,
            'articles_today' => 0,
            'last_check' => 'Unknown',
            'total_checks' => 0,
        ];

        $lines = explode("\n", $logs);
        $today = date('Y-m-d');

        foreach ($lines as $line) {
            // Extract timestamp if available
            if (preg_match('/\[(\d{2}:\d{2}:\d{2})\]/', $line, $matches)) {
                $stats['last_check'] = $matches[1];
            }

            // Count events found today
            if (strpos($line, 'Found') !== false && strpos($line, 'event') !== false) {
                if (preg_match('/Found (\d+) new event/', $line, $matches)) {
                    $stats['events_today'] += (int)$matches[1];
                }
            }

            // Count articles published
            if (strpos($line, 'Published') !== false && strpos($line, 'article') !== false) {
                if (preg_match('/Published (\d+) article/', $line, $matches)) {
                    $stats['articles_today'] += (int)$matches[1];
                }
            }

            // Count total checks
            if (strpos($line, 'Checking ESPN API') !== false) {
                $stats['total_checks']++;
            }
        }

        return $stats;
    }

    /**
     * Log activity
     *
     * @param string $action Action performed
     * @param bool $success Whether action succeeded
     * @param string $message Optional message
     */
    private function log_activity($action, $success, $message = '') {
        $logs = get_option('afcon_agent_activity_logs', []);

        $logs[] = [
            'time' => current_time('mysql'),
            'action' => $action,
            'user' => wp_get_current_user()->user_login,
            'success' => $success,
            'message' => $message,
        ];

        // Keep only last 100 entries
        if (count($logs) > 100) {
            $logs = array_slice($logs, -100);
        }

        update_option('afcon_agent_activity_logs', $logs);
    }

    /**
     * AJAX: Get status
     */
    public function ajax_get_status() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $data = $this->get_dashboard_data();
        wp_send_json_success($data);
    }

    /**
     * AJAX: Start agent
     */
    public function ajax_start_agent() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $result = $this->ssh->start_agent();

        if (is_wp_error($result)) {
            $this->log_activity('start_agent', false, $result->get_error_message());
            wp_send_json_error(['message' => $result->get_error_message()]);
        } else {
            $this->log_activity('start_agent', true, 'Agent started successfully');
            delete_transient('afcon_agent_dashboard'); // Clear cache
            wp_send_json_success(['message' => 'Agent started successfully']);
        }
    }

    /**
     * AJAX: Stop agent
     */
    public function ajax_stop_agent() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $result = $this->ssh->stop_agent();

        if (is_wp_error($result)) {
            $this->log_activity('stop_agent', false, $result->get_error_message());
            wp_send_json_error(['message' => $result->get_error_message()]);
        } else {
            $this->log_activity('stop_agent', true, 'Agent stopped successfully');
            delete_transient('afcon_agent_dashboard'); // Clear cache
            wp_send_json_success(['message' => 'Agent stopped successfully']);
        }
    }

    /**
     * AJAX: Restart agent
     */
    public function ajax_restart_agent() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $result = $this->ssh->restart_agent();

        if (is_wp_error($result)) {
            $this->log_activity('restart_agent', false, $result->get_error_message());
            wp_send_json_error(['message' => $result->get_error_message()]);
        } else {
            $this->log_activity('restart_agent', true, 'Agent restarted successfully');
            delete_transient('afcon_agent_dashboard'); // Clear cache
            wp_send_json_success(['message' => 'Agent restarted successfully']);
        }
    }

    /**
     * AJAX: Get logs
     */
    public function ajax_get_logs() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $lines = isset($_POST['lines']) ? (int)$_POST['lines'] : 100;
        $logs = $this->ssh->get_logs($lines);

        if (is_wp_error($logs)) {
            wp_send_json_error(['message' => $logs->get_error_message()]);
        } else {
            wp_send_json_success(['logs' => $logs]);
        }
    }

    /**
     * AJAX: Get statistics
     */
    public function ajax_get_statistics() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        // Get full logs for statistics
        $logs = $this->ssh->get_logs(500);

        if (is_wp_error($logs)) {
            wp_send_json_error(['message' => $logs->get_error_message()]);
        } else {
            $stats = $this->parse_statistics_from_logs($logs);
            wp_send_json_success($stats);
        }
    }

    /**
     * AJAX: Test connection
     */
    public function ajax_test_connection() {
        check_ajax_referer('afcon_monitor_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'Unauthorized'], 403);
        }

        $result = $this->ssh->test_connection();

        if (is_wp_error($result)) {
            $this->log_activity('test_connection', false, $result->get_error_message());
            wp_send_json_error(['message' => $result->get_error_message()]);
        } else {
            $this->log_activity('test_connection', true, 'SSH connection successful');
            wp_send_json_success(['message' => 'SSH connection successful!']);
        }
    }
}

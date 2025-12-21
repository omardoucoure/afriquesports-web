<?php
/**
 * Admin Page Class
 * Renders the admin settings page with tabs
 */

class AFCON_Admin_Page {

    private $option_name = 'afcon_agent_settings';
    private $monitor;

    /**
     * Constructor
     */
    public function __construct() {
        $this->monitor = new AFCON_Agent_Monitor();

        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_notices', [$this, 'admin_notices']);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'AFCON Agent Monitor',
            'AFCON Agent',
            'manage_options',
            'afcon-agent-monitor',
            [$this, 'render_page'],
            'dashicons-visibility',
            30
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting($this->option_name, $this->option_name, [$this, 'sanitize_settings']);
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = [];

        $sanitized['ssh_host'] = sanitize_text_field($input['ssh_host'] ?? '');
        $sanitized['ssh_port'] = (int)($input['ssh_port'] ?? 22);
        $sanitized['ssh_username'] = sanitize_text_field($input['ssh_username'] ?? '');
        $sanitized['ssh_auth_method'] = sanitize_text_field($input['ssh_auth_method'] ?? 'key');

        // Encrypt credentials if changed
        if (!empty($input['ssh_private_key'])) {
            $sanitized['ssh_private_key'] = AFCON_SSH_Connector::encrypt_credential($input['ssh_private_key']);
        } else {
            $existing = get_option($this->option_name);
            $sanitized['ssh_private_key'] = $existing['ssh_private_key'] ?? '';
        }

        if (!empty($input['ssh_password'])) {
            $sanitized['ssh_password'] = AFCON_SSH_Connector::encrypt_credential($input['ssh_password']);
        } else {
            $existing = get_option($this->option_name);
            $sanitized['ssh_password'] = $existing['ssh_password'] ?? '';
        }

        $sanitized['dashboard_refresh'] = (int)($input['dashboard_refresh'] ?? 5);
        $sanitized['logs_refresh'] = (int)($input['logs_refresh'] ?? 5);
        $sanitized['configured'] = !empty($sanitized['ssh_host']) && !empty($sanitized['ssh_username']);

        return $sanitized;
    }

    /**
     * Admin notices
     */
    public function admin_notices() {
        $settings = get_option($this->option_name, []);

        if (empty($settings['configured'])) {
            $url = admin_url('admin.php?page=afcon-agent-monitor&tab=settings');
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>AFCON Agent Monitor:</strong> Please <a href="' . esc_url($url) . '">configure SSH settings</a> to start monitoring the agent.</p>';
            echo '</div>';
        }
    }

    /**
     * Render main page
     */
    public function render_page() {
        $active_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'dashboard';
        ?>
        <div class="wrap afcon-agent-monitor">
            <h1>
                <span class="dashicons dashicons-visibility"></span>
                AFCON Agent Monitor
            </h1>

            <h2 class="nav-tab-wrapper">
                <a href="?page=afcon-agent-monitor&tab=dashboard" class="nav-tab <?php echo $active_tab === 'dashboard' ? 'nav-tab-active' : ''; ?>">
                    Dashboard
                </a>
                <a href="?page=afcon-agent-monitor&tab=logs" class="nav-tab <?php echo $active_tab === 'logs' ? 'nav-tab-active' : ''; ?>">
                    Logs
                </a>
                <a href="?page=afcon-agent-monitor&tab=statistics" class="nav-tab <?php echo $active_tab === 'statistics' ? 'nav-tab-active' : ''; ?>">
                    Statistics
                </a>
                <a href="?page=afcon-agent-monitor&tab=settings" class="nav-tab <?php echo $active_tab === 'settings' ? 'nav-tab-active' : ''; ?>">
                    Settings
                </a>
            </h2>

            <div class="tab-content">
                <?php
                switch ($active_tab) {
                    case 'logs':
                        $this->render_logs_tab();
                        break;
                    case 'statistics':
                        $this->render_statistics_tab();
                        break;
                    case 'settings':
                        $this->render_settings_tab();
                        break;
                    case 'dashboard':
                    default:
                        $this->render_dashboard_tab();
                        break;
                }
                ?>
            </div>
        </div>
        <?php
    }

    /**
     * Render Dashboard tab
     */
    private function render_dashboard_tab() {
        $data = $this->monitor->get_dashboard_data();
        ?>
        <div class="afcon-dashboard-tab">
            <div class="afcon-status-card">
                <h2>Agent Status</h2>
                <div class="status-indicator" id="agent-status">
                    <?php if ($data['running']): ?>
                        <span class="status-dot running"></span>
                        <span class="status-text">Agent Running</span>
                    <?php else: ?>
                        <span class="status-dot stopped"></span>
                        <span class="status-text">Agent Stopped</span>
                    <?php endif; ?>
                </div>
                <div class="status-details">
                    <p><strong>Droplet:</strong> <?php echo esc_html(get_option($this->option_name)['ssh_host'] ?? 'Not configured'); ?></p>
                    <p><strong>Uptime:</strong> <span id="agent-uptime"><?php echo esc_html($data['uptime']); ?></span></p>
                </div>

                <div class="control-buttons">
                    <button id="start-agent" class="button button-primary" <?php echo $data['running'] ? 'disabled' : ''; ?>>
                        Start Agent
                    </button>
                    <button id="stop-agent" class="button" <?php echo !$data['running'] ? 'disabled' : ''; ?>>
                        Stop Agent
                    </button>
                    <button id="restart-agent" class="button" <?php echo !$data['running'] ? 'disabled' : ''; ?>>
                        Restart Agent
                    </button>
                </div>
            </div>

            <div class="afcon-stats-card">
                <h2>Today's Activity</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="events-today"><?php echo esc_html($data['events_today']); ?></div>
                        <div class="stat-label">Events Found</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="articles-today"><?php echo esc_html($data['articles_today']); ?></div>
                        <div class="stat-label">Articles Published</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="last-check"><?php echo esc_html($data['last_check']); ?></div>
                        <div class="stat-label">Last ESPN Check</div>
                    </div>
                </div>
            </div>

            <div class="afcon-logs-card">
                <h2>
                    Recent Logs
                    <button id="refresh-dashboard" class="button button-small">Refresh</button>
                </h2>
                <div class="log-viewer mini" id="dashboard-logs">
                    <?php if (!empty($data['recent_logs'])): ?>
                        <pre><?php echo esc_html(implode("\n", array_slice($data['recent_logs'], -10))); ?></pre>
                    <?php else: ?>
                        <p class="no-logs">No logs available</p>
                    <?php endif; ?>
                </div>
                <p>
                    <a href="?page=afcon-agent-monitor&tab=logs" class="button">View Full Logs</a>
                </p>
            </div>
        </div>
        <?php
    }

    /**
     * Render Logs tab
     */
    private function render_logs_tab() {
        ?>
        <div class="afcon-logs-tab">
            <div class="logs-controls">
                <input type="text" id="log-search" placeholder="Search logs..." class="regular-text">
                <select id="log-lines">
                    <option value="50">Last 50 lines</option>
                    <option value="100" selected>Last 100 lines</option>
                    <option value="200">Last 200 lines</option>
                    <option value="500">Last 500 lines</option>
                </select>
                <button id="refresh-logs" class="button">Refresh Now</button>
                <label>
                    <input type="checkbox" id="auto-refresh-logs" checked>
                    Auto-refresh (<select id="logs-refresh-interval">
                        <option value="5" selected>5s</option>
                        <option value="10">10s</option>
                        <option value="30">30s</option>
                    </select>)
                </label>
            </div>

            <div class="log-viewer" id="log-content">
                <div class="loading">Loading logs...</div>
            </div>
        </div>
        <?php
    }

    /**
     * Render Statistics tab
     */
    private function render_statistics_tab() {
        ?>
        <div class="afcon-statistics-tab">
            <h2>Agent Statistics <button id="refresh-stats" class="button">Refresh</button></h2>
            <div class="stats-loading" id="stats-content">
                <p>Loading statistics...</p>
            </div>
        </div>
        <?php
    }

    /**
     * Render Settings tab
     */
    private function render_settings_tab() {
        $settings = get_option($this->option_name, []);
        ?>
        <div class="afcon-settings-tab">
            <form method="post" action="options.php">
                <?php settings_fields($this->option_name); ?>

                <h2>SSH Connection Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="ssh_host">SSH Host</label></th>
                        <td>
                            <input type="text" name="<?php echo $this->option_name; ?>[ssh_host]" id="ssh_host"
                                   value="<?php echo esc_attr($settings['ssh_host'] ?? '159.223.103.16'); ?>"
                                   class="regular-text" required>
                            <p class="description">Droplet IP address</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ssh_port">SSH Port</label></th>
                        <td>
                            <input type="number" name="<?php echo $this->option_name; ?>[ssh_port]" id="ssh_port"
                                   value="<?php echo esc_attr($settings['ssh_port'] ?? 22); ?>"
                                   min="1" max="65535" required>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ssh_username">Username</label></th>
                        <td>
                            <input type="text" name="<?php echo $this->option_name; ?>[ssh_username]" id="ssh_username"
                                   value="<?php echo esc_attr($settings['ssh_username'] ?? 'root'); ?>"
                                   class="regular-text" required>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Authentication Method</th>
                        <td>
                            <label>
                                <input type="radio" name="<?php echo $this->option_name; ?>[ssh_auth_method]" value="key"
                                    <?php checked($settings['ssh_auth_method'] ?? 'key', 'key'); ?>>
                                SSH Private Key (recommended)
                            </label><br>
                            <label>
                                <input type="radio" name="<?php echo $this->option_name; ?>[ssh_auth_method]" value="password"
                                    <?php checked($settings['ssh_auth_method'] ?? 'key', 'password'); ?>>
                                Password
                            </label>
                        </td>
                    </tr>
                    <tr class="ssh-key-field">
                        <th scope="row"><label for="ssh_private_key">SSH Private Key</label></th>
                        <td>
                            <?php if (!empty($settings['ssh_private_key'])): ?>
                                <p class="description" style="padding: 10px; background: #edfaee; border-left: 4px solid #46b450; margin-bottom: 10px;">
                                    ✓ SSH key is configured and encrypted
                                </p>
                                <textarea name="<?php echo $this->option_name; ?>[ssh_private_key]" id="ssh_private_key"
                                          rows="10" class="large-text code" placeholder="Leave blank to keep current key, or paste new key to replace"></textarea>
                                <p class="description">Leave blank to keep current key, or paste a new key to replace it.</p>
                            <?php else: ?>
                                <textarea name="<?php echo $this->option_name; ?>[ssh_private_key]" id="ssh_private_key"
                                          rows="10" class="large-text code" placeholder="-----BEGIN RSA PRIVATE KEY-----"></textarea>
                                <p class="description">Paste your private key here. It will be encrypted when saved.</p>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr class="ssh-password-field" style="display: none;">
                        <th scope="row"><label for="ssh_password">SSH Password</label></th>
                        <td>
                            <input type="password" name="<?php echo $this->option_name; ?>[ssh_password]" id="ssh_password"
                                   class="regular-text" placeholder="Leave blank to keep current password">
                            <p class="description">Password will be encrypted when saved.</p>
                        </td>
                    </tr>
                </table>

                <p>
                    <button type="button" id="test-connection" class="button">Test Connection</button>
                    <span id="test-result"></span>
                </p>

                <h2>Auto-Refresh Settings</h2>
                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="dashboard_refresh">Dashboard Refresh Interval</label></th>
                        <td>
                            <select name="<?php echo $this->option_name; ?>[dashboard_refresh]" id="dashboard_refresh">
                                <option value="3" <?php selected($settings['dashboard_refresh'] ?? 5, 3); ?>>3 seconds</option>
                                <option value="5" <?php selected($settings['dashboard_refresh'] ?? 5, 5); ?>>5 seconds</option>
                                <option value="10" <?php selected($settings['dashboard_refresh'] ?? 5, 10); ?>>10 seconds</option>
                                <option value="30" <?php selected($settings['dashboard_refresh'] ?? 5, 30); ?>>30 seconds</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="logs_refresh">Logs Refresh Interval</label></th>
                        <td>
                            <select name="<?php echo $this->option_name; ?>[logs_refresh]" id="logs_refresh">
                                <option value="3" <?php selected($settings['logs_refresh'] ?? 5, 3); ?>>3 seconds</option>
                                <option value="5" <?php selected($settings['logs_refresh'] ?? 5, 5); ?>>5 seconds</option>
                                <option value="10" <?php selected($settings['logs_refresh'] ?? 5, 10); ?>>10 seconds</option>
                                <option value="30" <?php selected($settings['logs_refresh'] ?? 5, 30); ?>>30 seconds</option>
                            </select>
                        </td>
                    </tr>
                </table>

                <?php submit_button('Save Settings'); ?>
            </form>

            <h2>Activity Log</h2>
            <div class="activity-log">
                <?php $this->render_activity_log(); ?>
            </div>
        </div>

        <script>
        jQuery(document).ready(function($) {
            // Toggle SSH key/password fields
            $('input[name="<?php echo $this->option_name; ?>[ssh_auth_method]"]').change(function() {
                if ($(this).val() === 'key') {
                    $('.ssh-key-field').show();
                    $('.ssh-password-field').hide();
                } else {
                    $('.ssh-key-field').hide();
                    $('.ssh-password-field').show();
                }
            }).trigger('change');
        });
        </script>
        <?php
    }

    /**
     * Render activity log
     */
    private function render_activity_log() {
        $logs = array_reverse(get_option('afcon_agent_activity_logs', []));
        $logs = array_slice($logs, 0, 20); // Show last 20

        if (empty($logs)) {
            echo '<p>No activity logged yet.</p>';
            return;
        }

        echo '<table class="widefat">';
        echo '<thead><tr><th>Time</th><th>Action</th><th>User</th><th>Status</th><th>Message</th></tr></thead>';
        echo '<tbody>';

        foreach ($logs as $log) {
            $status_class = $log['success'] ? 'success' : 'error';
            $status_text = $log['success'] ? '✓ Success' : '✗ Failed';

            echo '<tr>';
            echo '<td>' . esc_html($log['time']) . '</td>';
            echo '<td>' . esc_html($log['action']) . '</td>';
            echo '<td>' . esc_html($log['user']) . '</td>';
            echo '<td class="' . esc_attr($status_class) . '">' . $status_text . '</td>';
            echo '<td>' . esc_html($log['message']) . '</td>';
            echo '</tr>';
        }

        echo '</tbody></table>';
    }
}

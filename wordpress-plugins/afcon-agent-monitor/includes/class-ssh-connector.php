<?php
/**
 * SSH Connector Class
 * Handles SSH connections and command execution using phpseclib
 */

use phpseclib3\Net\SSH2;
use phpseclib3\Crypt\PublicKeyLoader;

class AFCON_SSH_Connector {

    private $ssh;
    private $connected = false;
    private $settings;

    /**
     * Constructor
     */
    public function __construct() {
        $this->settings = get_option('afcon_agent_settings', []);
    }

    /**
     * Connect to SSH server
     *
     * @return bool|WP_Error True on success, WP_Error on failure
     */
    public function connect() {
        try {
            // Check if already connected
            if ($this->connected && $this->ssh && $this->ssh->isConnected()) {
                return true;
            }

            // Validate settings
            if (empty($this->settings['ssh_host']) || empty($this->settings['ssh_username'])) {
                return new WP_Error('missing_credentials', 'SSH credentials not configured');
            }

            // Create SSH connection
            $this->ssh = new SSH2($this->settings['ssh_host'], $this->settings['ssh_port'] ?? 22, 10);

            // Authenticate
            $auth_method = $this->settings['ssh_auth_method'] ?? 'key';

            if ($auth_method === 'key') {
                // SSH key authentication
                $private_key = $this->decrypt_credential($this->settings['ssh_private_key'] ?? '');
                if (empty($private_key)) {
                    return new WP_Error('missing_key', 'SSH private key not configured');
                }

                try {
                    $key = PublicKeyLoader::load($private_key);
                } catch (Exception $e) {
                    return new WP_Error('invalid_key', 'Invalid SSH private key: ' . $e->getMessage());
                }

                if (!$this->ssh->login($this->settings['ssh_username'], $key)) {
                    return new WP_Error('auth_failed', 'SSH authentication failed (key-based)');
                }
            } else {
                // Password authentication
                $password = $this->decrypt_credential($this->settings['ssh_password'] ?? '');
                if (empty($password)) {
                    return new WP_Error('missing_password', 'SSH password not configured');
                }

                if (!$this->ssh->login($this->settings['ssh_username'], $password)) {
                    return new WP_Error('auth_failed', 'SSH authentication failed (password)');
                }
            }

            $this->connected = true;
            return true;

        } catch (Exception $e) {
            return new WP_Error('connection_error', 'SSH connection failed: ' . $e->getMessage());
        }
    }

    /**
     * Execute SSH command
     *
     * @param string $command Command to execute
     * @param int $timeout Timeout in seconds
     * @return string|WP_Error Command output or error
     */
    public function execute($command, $timeout = 10) {
        $connect = $this->connect();
        if (is_wp_error($connect)) {
            return $connect;
        }

        try {
            $this->ssh->setTimeout($timeout);
            $output = $this->ssh->exec($command);

            if ($output === false) {
                $error = $this->ssh->getErrors();
                return new WP_Error('exec_failed', 'Command execution failed: ' . implode(', ', $error));
            }

            return $output;
        } catch (Exception $e) {
            return new WP_Error('exec_error', 'Command execution error: ' . $e->getMessage());
        }
    }

    /**
     * Get agent status
     *
     * @return array|WP_Error Status array or error
     */
    public function get_agent_status() {
        $output = $this->execute('systemctl status afcon-agent --no-pager', 5);

        if (is_wp_error($output)) {
            return $output;
        }

        // Parse systemd status output
        $status = [
            'running' => false,
            'active' => false,
            'enabled' => false,
            'pid' => null,
            'uptime' => null,
            'memory' => null,
            'raw' => $output,
        ];

        // Check if running
        if (strpos($output, 'Active: active (running)') !== false) {
            $status['running'] = true;
            $status['active'] = true;
        } elseif (strpos($output, 'Active: inactive') !== false) {
            $status['running'] = false;
            $status['active'] = false;
        } elseif (strpos($output, 'Active: failed') !== false) {
            $status['running'] = false;
            $status['active'] = false;
        }

        // Check if enabled
        if (strpos($output, 'Loaded: loaded') !== false && strpos($output, 'enabled;') !== false) {
            $status['enabled'] = true;
        }

        // Extract PID
        if (preg_match('/Main PID: (\d+)/', $output, $matches)) {
            $status['pid'] = $matches[1];
        }

        // Extract memory
        if (preg_match('/Memory: ([\d.]+[A-Z])/', $output, $matches)) {
            $status['memory'] = $matches[1];
        }

        return $status;
    }

    /**
     * Start agent
     *
     * @return bool|WP_Error True on success, error on failure
     */
    public function start_agent() {
        $output = $this->execute('sudo systemctl start afcon-agent', 10);

        if (is_wp_error($output)) {
            return $output;
        }

        // Wait a moment for service to start
        sleep(1);

        // Verify it started
        $status = $this->get_agent_status();
        if (is_wp_error($status)) {
            return $status;
        }

        if (!$status['running']) {
            return new WP_Error('start_failed', 'Agent failed to start. Check logs for details.');
        }

        return true;
    }

    /**
     * Stop agent
     *
     * @return bool|WP_Error True on success, error on failure
     */
    public function stop_agent() {
        $output = $this->execute('sudo systemctl stop afcon-agent', 10);

        if (is_wp_error($output)) {
            return $output;
        }

        // Wait a moment for service to stop
        sleep(1);

        // Verify it stopped
        $status = $this->get_agent_status();
        if (is_wp_error($status)) {
            return $status;
        }

        if ($status['running']) {
            return new WP_Error('stop_failed', 'Agent failed to stop');
        }

        return true;
    }

    /**
     * Restart agent
     *
     * @return bool|WP_Error True on success, error on failure
     */
    public function restart_agent() {
        $output = $this->execute('sudo systemctl restart afcon-agent', 10);

        if (is_wp_error($output)) {
            return $output;
        }

        // Wait a moment for service to restart
        sleep(2);

        // Verify it restarted
        $status = $this->get_agent_status();
        if (is_wp_error($status)) {
            return $status;
        }

        if (!$status['running']) {
            return new WP_Error('restart_failed', 'Agent failed to restart. Check logs for details.');
        }

        return true;
    }

    /**
     * Get agent logs
     *
     * @param int $lines Number of lines to retrieve
     * @return string|WP_Error Log content or error
     */
    public function get_logs($lines = 100) {
        $output = $this->execute("tail -n {$lines} /var/log/afcon-agent.log 2>&1", 5);

        if (is_wp_error($output)) {
            return $output;
        }

        // Check if log file doesn't exist
        if (strpos($output, 'No such file or directory') !== false) {
            return new WP_Error('log_not_found', 'Log file not found. Agent may not have run yet.');
        }

        return $output;
    }

    /**
     * Get agent uptime
     *
     * @return string|WP_Error Uptime string or error
     */
    public function get_uptime() {
        $output = $this->execute('systemctl show afcon-agent --property=ActiveEnterTimestamp --no-pager', 5);

        if (is_wp_error($output)) {
            return $output;
        }

        if (preg_match('/ActiveEnterTimestamp=(.+)/', $output, $matches)) {
            $start_time = strtotime(trim($matches[1]));
            if ($start_time) {
                $uptime_seconds = time() - $start_time;
                return $this->format_uptime($uptime_seconds);
            }
        }

        return 'Unknown';
    }

    /**
     * Format uptime seconds into human-readable string
     *
     * @param int $seconds Uptime in seconds
     * @return string Formatted uptime
     */
    private function format_uptime($seconds) {
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);

        $parts = [];
        if ($days > 0) $parts[] = "{$days}d";
        if ($hours > 0) $parts[] = "{$hours}h";
        if ($minutes > 0) $parts[] = "{$minutes}m";

        return !empty($parts) ? implode(' ', $parts) : 'Just started';
    }

    /**
     * Test SSH connection
     *
     * @return bool|WP_Error True if connection successful, error otherwise
     */
    public function test_connection() {
        $connect = $this->connect();
        if (is_wp_error($connect)) {
            return $connect;
        }

        // Try a simple command
        $output = $this->execute('echo "Connection successful"', 5);
        if (is_wp_error($output)) {
            return $output;
        }

        if (strpos($output, 'Connection successful') === false) {
            return new WP_Error('test_failed', 'Connection test failed');
        }

        return true;
    }

    /**
     * Encrypt credential using WordPress salts
     *
     * @param string $value Value to encrypt
     * @return string Encrypted value
     */
    public static function encrypt_credential($value) {
        if (empty($value)) {
            return '';
        }

        $key = wp_salt('auth');
        $iv = substr(wp_salt('secure_auth'), 0, 16);

        $encrypted = openssl_encrypt($value, 'AES-256-CBC', $key, 0, $iv);
        return base64_encode($encrypted);
    }

    /**
     * Decrypt credential using WordPress salts
     *
     * @param string $encrypted Encrypted value
     * @return string Decrypted value
     */
    private function decrypt_credential($encrypted) {
        if (empty($encrypted)) {
            return '';
        }

        $key = wp_salt('auth');
        $iv = substr(wp_salt('secure_auth'), 0, 16);

        $decoded = base64_decode($encrypted);
        return openssl_decrypt($decoded, 'AES-256-CBC', $key, 0, $iv);
    }

    /**
     * Disconnect SSH
     */
    public function disconnect() {
        if ($this->ssh && $this->ssh->isConnected()) {
            $this->ssh->disconnect();
        }
        $this->connected = false;
    }

    /**
     * Destructor
     */
    public function __destruct() {
        $this->disconnect();
    }
}

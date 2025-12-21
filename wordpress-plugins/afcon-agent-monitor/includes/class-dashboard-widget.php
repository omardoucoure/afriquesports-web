<?php
/**
 * Dashboard Widget Class
 * Displays agent status on WordPress main dashboard
 */

class AFCON_Dashboard_Widget {

    private $monitor;

    /**
     * Constructor
     */
    public function __construct() {
        $this->monitor = new AFCON_Agent_Monitor();

        add_action('wp_dashboard_setup', [$this, 'register_widget']);
    }

    /**
     * Register dashboard widget
     */
    public function register_widget() {
        wp_add_dashboard_widget(
            'afcon_agent_status',
            '<span class="dashicons dashicons-visibility"></span> AFCON AI Agent Status',
            [$this, 'render_widget']
        );
    }

    /**
     * Render widget
     */
    public function render_widget() {
        $data = $this->monitor->get_dashboard_data();
        $settings = get_option('afcon_agent_settings', []);
        ?>
        <div class="afcon-dashboard-widget">
            <?php if (!empty($settings['configured'])): ?>
                <div class="widget-status">
                    <?php if ($data['running']): ?>
                        <span class="status-dot running"></span>
                        <strong>Running</strong> for <?php echo esc_html($data['uptime']); ?>
                    <?php elseif ($data['status'] === 'error'): ?>
                        <span class="status-dot error"></span>
                        <strong>Connection Error</strong>
                    <?php else: ?>
                        <span class="status-dot stopped"></span>
                        <strong>Stopped</strong>
                    <?php endif; ?>
                </div>

                <?php if ($data['running']): ?>
                    <div class="widget-stats">
                        <div class="stat">
                            <span class="value"><?php echo esc_html($data['events_today']); ?></span>
                            <span class="label">Events Today</span>
                        </div>
                        <div class="stat">
                            <span class="value"><?php echo esc_html($data['articles_today']); ?></span>
                            <span class="label">Articles Published</span>
                        </div>
                    </div>
                <?php endif; ?>

                <?php if (!empty($data['error'])): ?>
                    <p class="error-message"><?php echo esc_html($data['error']); ?></p>
                <?php endif; ?>

                <p class="widget-link">
                    <a href="<?php echo admin_url('admin.php?page=afcon-agent-monitor'); ?>" class="button button-primary button-small">
                        View Details
                    </a>
                </p>
            <?php else: ?>
                <p>SSH connection not configured.</p>
                <p>
                    <a href="<?php echo admin_url('admin.php?page=afcon-agent-monitor&tab=settings'); ?>" class="button button-primary button-small">
                        Configure Now
                    </a>
                </p>
            <?php endif; ?>
        </div>

        <style>
            .afcon-dashboard-widget .widget-status {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                font-size: 14px;
            }
            .afcon-dashboard-widget .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                display: inline-block;
                margin-right: 8px;
            }
            .afcon-dashboard-widget .status-dot.running {
                background: #46b450;
                box-shadow: 0 0 5px #46b450;
            }
            .afcon-dashboard-widget .status-dot.stopped {
                background: #dc3232;
            }
            .afcon-dashboard-widget .status-dot.error {
                background: #ffb900;
            }
            .afcon-dashboard-widget .widget-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            .afcon-dashboard-widget .stat {
                text-align: center;
                padding: 10px;
                background: #f0f0f1;
                border-radius: 4px;
            }
            .afcon-dashboard-widget .stat .value {
                display: block;
                font-size: 24px;
                font-weight: bold;
                color: #2271b1;
            }
            .afcon-dashboard-widget .stat .label {
                display: block;
                font-size: 12px;
                color: #666;
            }
            .afcon-dashboard-widget .error-message {
                color: #dc3232;
                background: #fef7f7;
                padding: 8px;
                border-radius: 4px;
                margin: 10px 0;
            }
            .afcon-dashboard-widget .widget-link {
                text-align: center;
                margin-top: 10px;
            }
        </style>
        <?php
    }
}

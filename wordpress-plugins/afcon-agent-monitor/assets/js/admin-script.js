/**
 * AFCON Agent Monitor - Admin JavaScript
 */

(function($) {
    'use strict';

    let autoRefreshInterval = null;
    let lastLogContent = '';

    /**
     * Initialize plugin
     */
    $(document).ready(function() {
        initDashboard();
        initLogs();
        initStatistics();
        initSettings();
    });

    /**
     * Initialize Dashboard tab
     */
    function initDashboard() {
        if (!$('.afcon-dashboard-tab').length) return;

        // Start agent button
        $('#start-agent').on('click', function() {
            controlAgent('start', $(this));
        });

        // Stop agent button
        $('#stop-agent').on('click', function() {
            controlAgent('stop', $(this));
        });

        // Restart agent button
        $('#restart-agent').on('click', function() {
            controlAgent('restart', $(this));
        });

        // Refresh dashboard button
        $('#refresh-dashboard').on('click', function() {
            refreshDashboard();
        });

        // Auto-refresh dashboard
        startAutoRefreshDashboard();
    }

    /**
     * Initialize Logs tab
     */
    function initLogs() {
        if (!$('.afcon-logs-tab').length) return;

        // Initial load
        refreshLogs();

        // Refresh button
        $('#refresh-logs').on('click', function() {
            refreshLogs();
        });

        // Lines selector
        $('#log-lines').on('change', function() {
            refreshLogs();
        });

        // Search input
        $('#log-search').on('input', function() {
            filterLogs($(this).val());
        });

        // Auto-refresh toggle
        $('#auto-refresh-logs').on('change', function() {
            if ($(this).is(':checked')) {
                startAutoRefreshLogs();
            } else {
                stopAutoRefreshLogs();
            }
        });

        // Refresh interval
        $('#logs-refresh-interval').on('change', function() {
            if ($('#auto-refresh-logs').is(':checked')) {
                startAutoRefreshLogs();
            }
        });

        // Start auto-refresh
        if ($('#auto-refresh-logs').is(':checked')) {
            startAutoRefreshLogs();
        }
    }

    /**
     * Initialize Statistics tab
     */
    function initStatistics() {
        if (!$('.afcon-statistics-tab').length) return;

        // Initial load
        refreshStatistics();

        // Refresh button
        $('#refresh-stats').on('click', function() {
            refreshStatistics();
        });
    }

    /**
     * Initialize Settings tab
     */
    function initSettings() {
        if (!$('.afcon-settings-tab').length) return;

        // Test connection button
        $('#test-connection').on('click', function() {
            testConnection($(this));
        });
    }

    /**
     * Control agent (start/stop/restart)
     */
    function controlAgent(action, $button) {
        const originalText = $button.text();
        $button.addClass('loading').prop('disabled', true);

        $.ajax({
            url: afconMonitor.ajaxUrl,
            method: 'POST',
            data: {
                action: 'afcon_' + action + '_agent',
                nonce: afconMonitor.nonce
            },
            success: function(response) {
                if (response.success) {
                    showNotice('success', response.data.message || afconMonitor.strings.success);
                    // Refresh dashboard after 1 second
                    setTimeout(refreshDashboard, 1000);
                } else {
                    showNotice('error', response.data.message || 'Action failed');
                }
            },
            error: function(xhr) {
                showNotice('error', afconMonitor.strings.error + ' ' + xhr.statusText);
            },
            complete: function() {
                $button.removeClass('loading').prop('disabled', false).text(originalText);
            }
        });
    }

    /**
     * Refresh dashboard
     */
    function refreshDashboard() {
        $.ajax({
            url: afconMonitor.ajaxUrl,
            method: 'POST',
            data: {
                action: 'afcon_get_status',
                nonce: afconMonitor.nonce
            },
            success: function(response) {
                if (response.success) {
                    updateDashboard(response.data);
                }
            }
        });
    }

    /**
     * Update dashboard UI
     */
    function updateDashboard(data) {
        // Update status indicator
        const $status = $('#agent-status');
        $status.find('.status-dot').removeClass('running stopped error');
        $status.find('.status-text').text('');

        if (data.running) {
            $status.find('.status-dot').addClass('running');
            $status.find('.status-text').text('Agent Running');
            $('#start-agent').prop('disabled', true);
            $('#stop-agent, #restart-agent').prop('disabled', false);
        } else if (data.status === 'error') {
            $status.find('.status-dot').addClass('error');
            $status.find('.status-text').text('Connection Error');
            $('#start-agent, #stop-agent, #restart-agent').prop('disabled', true);
        } else {
            $status.find('.status-dot').addClass('stopped');
            $status.find('.status-text').text('Agent Stopped');
            $('#start-agent').prop('disabled', false);
            $('#stop-agent, #restart-agent').prop('disabled', true);
        }

        // Update uptime
        $('#agent-uptime').text(data.uptime || 'Unknown');

        // Update stats
        $('#events-today').text(data.events_today || 0);
        $('#articles-today').text(data.articles_today || 0);
        $('#last-check').text(data.last_check || 'Unknown');

        // Update logs
        if (data.recent_logs && data.recent_logs.length > 0) {
            const logs = data.recent_logs.slice(-10).join('\n');
            $('#dashboard-logs pre').text(logs);
        }
    }

    /**
     * Refresh logs
     */
    function refreshLogs() {
        const lines = $('#log-lines').val() || 100;

        $('#log-content').html('<div class="loading">Loading logs...</div>');

        $.ajax({
            url: afconMonitor.ajaxUrl,
            method: 'POST',
            data: {
                action: 'afcon_get_logs',
                nonce: afconMonitor.nonce,
                lines: lines
            },
            success: function(response) {
                if (response.success) {
                    lastLogContent = response.data.logs;
                    displayLogs(response.data.logs);
                } else {
                    $('#log-content').html('<div class="loading">' + response.data.message + '</div>');
                }
            },
            error: function(xhr) {
                $('#log-content').html('<div class="loading">Error loading logs: ' + xhr.statusText + '</div>');
            }
        });
    }

    /**
     * Display logs
     */
    function displayLogs(logs) {
        const searchTerm = $('#log-search').val();
        let displayContent = logs;

        // Apply search filter if needed
        if (searchTerm) {
            const lines = logs.split('\n');
            const filtered = lines.filter(line =>
                line.toLowerCase().includes(searchTerm.toLowerCase())
            );
            displayContent = filtered.join('\n');
        }

        $('#log-content').html('<pre>' + escapeHtml(displayContent) + '</pre>');
    }

    /**
     * Filter logs
     */
    function filterLogs(searchTerm) {
        if (!lastLogContent) return;
        displayLogs(lastLogContent);
    }

    /**
     * Refresh statistics
     */
    function refreshStatistics() {
        $('#stats-content').html('<p>Loading statistics...</p>');

        $.ajax({
            url: afconMonitor.ajaxUrl,
            method: 'POST',
            data: {
                action: 'afcon_get_statistics',
                nonce: afconMonitor.nonce
            },
            success: function(response) {
                if (response.success) {
                    displayStatistics(response.data);
                } else {
                    $('#stats-content').html('<p class="error">' + response.data.message + '</p>');
                }
            },
            error: function(xhr) {
                $('#stats-content').html('<p class="error">Error loading statistics: ' + xhr.statusText + '</p>');
            }
        });
    }

    /**
     * Display statistics
     */
    function displayStatistics(stats) {
        let html = '<div class="stats-grid">';
        html += '<div class="stat-item"><div class="stat-value">' + stats.events_today + '</div><div class="stat-label">Events Found Today</div></div>';
        html += '<div class="stat-item"><div class="stat-value">' + stats.articles_today + '</div><div class="stat-label">Articles Published Today</div></div>';
        html += '<div class="stat-item"><div class="stat-value">' + stats.total_checks + '</div><div class="stat-label">Total Checks</div></div>';
        html += '</div>';
        $('#stats-content').html(html);
    }

    /**
     * Test SSH connection
     */
    function testConnection($button) {
        const originalText = $button.text();
        $button.addClass('loading').prop('disabled', true);
        $('#test-result').removeClass('success error').text('');

        $.ajax({
            url: afconMonitor.ajaxUrl,
            method: 'POST',
            data: {
                action: 'afcon_test_connection',
                nonce: afconMonitor.nonce
            },
            success: function(response) {
                if (response.success) {
                    $('#test-result').addClass('success').text('✓ ' + response.data.message);
                } else {
                    $('#test-result').addClass('error').text('✗ ' + response.data.message);
                }
            },
            error: function(xhr) {
                $('#test-result').addClass('error').text('✗ Connection failed: ' + xhr.statusText);
            },
            complete: function() {
                $button.removeClass('loading').prop('disabled', false).text(originalText);
            }
        });
    }

    /**
     * Start auto-refresh for dashboard
     */
    function startAutoRefreshDashboard() {
        const interval = 5000; // 5 seconds
        setInterval(refreshDashboard, interval);
    }

    /**
     * Start auto-refresh for logs
     */
    function startAutoRefreshLogs() {
        stopAutoRefreshLogs();
        const interval = parseInt($('#logs-refresh-interval').val()) * 1000;
        autoRefreshInterval = setInterval(refreshLogs, interval);
    }

    /**
     * Stop auto-refresh for logs
     */
    function stopAutoRefreshLogs() {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
    }

    /**
     * Show notice
     */
    function showNotice(type, message) {
        const $notice = $('<div class="afcon-notice ' + type + '">' + message + '</div>');
        $('.afcon-agent-monitor h1').after($notice);
        setTimeout(function() {
            $notice.fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    }

    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

})(jQuery);

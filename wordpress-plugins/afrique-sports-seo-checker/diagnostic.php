<?php
/**
 * Diagnostic page to check translation status
 * Access: /wp-content/plugins/afrique-sports-seo-checker/diagnostic.php
 */

// Load WordPress
require_once($_SERVER['DOCUMENT_ROOT'] . '/wp-load.php');

// Check if user is admin
if (!current_user_can('manage_options')) {
    die('Access denied. You must be an administrator.');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>SEO Checker Diagnostic</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Afrique Sports SEO Checker - Diagnostic</h1>

    <?php
    // Check WordPress locale
    $site_locale = get_locale();
    $user_locale = get_user_locale();
    $wplang = get_option('WPLANG');

    echo '<div class="status ' . ($site_locale === 'fr_FR' ? 'success' : 'error') . '">';
    echo '<strong>WordPress Locale:</strong> ' . $site_locale;
    echo '</div>';

    echo '<div class="status ' . ($user_locale === 'fr_FR' ? 'success' : 'error') . '">';
    echo '<strong>User Locale:</strong> ' . $user_locale;
    echo '</div>';

    echo '<div class="status info">';
    echo '<strong>WPLANG Option:</strong> ' . ($wplang ?: '(empty)');
    echo '</div>';

    // Check if translation files exist
    $plugin_mo = WP_PLUGIN_DIR . '/afrique-sports-seo-checker/languages/afrique-sports-seo-fr_FR.mo';
    $wp_mo = WP_LANG_DIR . '/plugins/afrique-sports-seo-fr_FR.mo';

    echo '<h2>Translation Files</h2>';
    echo '<table>';
    echo '<tr><th>Location</th><th>Status</th><th>Size</th></tr>';

    echo '<tr>';
    echo '<td><code>' . $plugin_mo . '</code></td>';
    echo '<td>' . (file_exists($plugin_mo) ? '✅ EXISTS' : '❌ NOT FOUND') . '</td>';
    echo '<td>' . (file_exists($plugin_mo) ? number_format(filesize($plugin_mo)) . ' bytes' : 'N/A') . '</td>';
    echo '</tr>';

    echo '<tr>';
    echo '<td><code>' . $wp_mo . '</code></td>';
    echo '<td>' . (file_exists($wp_mo) ? '✅ EXISTS' : '❌ NOT FOUND') . '</td>';
    echo '<td>' . (file_exists($wp_mo) ? number_format(filesize($wp_mo)) . ' bytes' : 'N/A') . '</td>';
    echo '</tr>';

    echo '</table>';

    // Test translations
    echo '<h2>Translation Test</h2>';

    // Load textdomain
    $loaded = load_plugin_textdomain(
        'afrique-sports-seo',
        false,
        'afrique-sports-seo-checker/languages/'
    );

    echo '<div class="status ' . ($loaded ? 'success' : 'error') . '">';
    echo '<strong>Textdomain Load Status:</strong> ' . ($loaded ? 'SUCCESS' : 'FAILED');
    echo '</div>';

    // Test some translations
    $test_strings = array(
        'SEO Checklist - Afrique Sports',
        'Run Check',
        'Title Length',
        'Word Count',
        'Featured Image',
        'Passed',
        'Failed',
        'Warning',
    );

    echo '<table>';
    echo '<tr><th>English</th><th>Translated</th><th>Status</th></tr>';

    foreach ($test_strings as $string) {
        $translated = __($string, 'afrique-sports-seo');
        $is_translated = ($string !== $translated);

        echo '<tr>';
        echo '<td>' . esc_html($string) . '</td>';
        echo '<td><strong>' . esc_html($translated) . '</strong></td>';
        echo '<td>' . ($is_translated ? '✅ Translated' : '❌ Not translated') . '</td>';
        echo '</tr>';
    }

    echo '</table>';

    // Test dynamic translations
    echo '<h2>Dynamic Translation Test</h2>';
    echo '<table>';
    echo '<tr><th>Pattern</th><th>Result</th></tr>';

    $dynamic_tests = array(
        array('Title is too short (%d characters). Minimum: %d characters.', 30, 45),
        array('Word count is good (%d words).', 543),
        array('%d Passed', 8),
        array('%d Failed', 2),
    );

    foreach ($dynamic_tests as $test) {
        $pattern = array_shift($test);
        $translated = __($pattern, 'afrique-sports-seo');
        $result = vsprintf($translated, $test);

        echo '<tr>';
        echo '<td><code>' . esc_html($pattern) . '</code></td>';
        echo '<td><strong>' . esc_html($result) . '</strong></td>';
        echo '</tr>';
    }

    echo '</table>';

    // Plugin info
    echo '<h2>Plugin Information</h2>';
    echo '<table>';
    echo '<tr><th>Property</th><th>Value</th></tr>';
    echo '<tr><td>Plugin Directory</td><td><code>' . WP_PLUGIN_DIR . '/afrique-sports-seo-checker</code></td></tr>';
    echo '<tr><td>Languages Directory</td><td><code>' . WP_LANG_DIR . '/plugins</code></td></tr>';
    echo '<tr><td>WordPress Version</td><td>' . get_bloginfo('version') . '</td></tr>';
    echo '<tr><td>PHP Version</td><td>' . PHP_VERSION . '</td></tr>';
    echo '</table>';

    // Browser cache warning
    echo '<div class="status info">';
    echo '<h3>⚠️ Browser Cache</h3>';
    echo '<p>If translations are showing as SUCCESS above but you still see English in WordPress admin:</p>';
    echo '<ol>';
    echo '<li>Hard refresh: <strong>Ctrl+Shift+R</strong> (Windows) or <strong>Cmd+Shift+R</strong> (Mac)</li>';
    echo '<li>Clear browser cache completely</li>';
    echo '<li>Try in an incognito/private window</li>';
    echo '<li>Try a different browser</li>';
    echo '</ol>';
    echo '</div>';
    ?>

    <hr>
    <p><em>Generated: <?php echo current_time('Y-m-d H:i:s'); ?></em></p>
</body>
</html>

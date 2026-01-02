<?php
/**
 * Test French translations
 * Run this from WordPress admin to verify translations are loaded
 */

// This script should be run from WordPress context
if (!defined('ABSPATH')) {
    require_once('/var/www/html/wp-load.php');
}

// Set locale to French
add_filter('locale', function() { return 'fr_FR'; });

// Load plugin textdomain
load_plugin_textdomain(
    'afrique-sports-seo',
    false,
    'afrique-sports-seo-checker/languages/'
);

echo "=== TESTING FRENCH TRANSLATIONS ===\n\n";

// Test key messages
$test_strings = array(
    'SEO Checklist - Afrique Sports',
    'Publishing Blocked: SEO Requirements Not Met',
    'Run Check',
    'Title Length',
    'Word Count',
    'Featured Image',
    'Meta Description',
    'Internal Links',
    'Categories',
    'Tags',
    'Passed',
    'Failed',
    'Warning',
);

foreach ($test_strings as $string) {
    $translated = __($string, 'afrique-sports-seo');
    echo sprintf("EN: %-50s | FR: %s\n", $string, $translated);
}

echo "\n=== DYNAMIC MESSAGES ===\n\n";

// Test dynamic messages with placeholders
$dynamic_tests = array(
    array(
        'pattern' => 'Title is too short (%d characters). Minimum: %d characters.',
        'args' => array(30, 45)
    ),
    array(
        'pattern' => 'Word count is good (%d words).',
        'args' => array(543)
    ),
    array(
        'pattern' => '%d Passed',
        'args' => array(8)
    ),
    array(
        'pattern' => '%d Failed',
        'args' => array(2)
    ),
);

foreach ($dynamic_tests as $test) {
    $translated = __($test['pattern'], 'afrique-sports-seo');
    $result = vsprintf($translated, $test['args']);
    echo sprintf("EN: %-60s\nFR: %s\n\n", vsprintf($test['pattern'], $test['args']), $result);
}

echo "=== TEST COMPLETE ===\n";

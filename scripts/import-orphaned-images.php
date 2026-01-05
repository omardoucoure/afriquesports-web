#!/usr/bin/env php
<?php
/**
 * Import Orphaned Images to WordPress Media Library
 *
 * This script scans the uploads directory and registers all orphaned images
 * (files on disk that don't exist in wp_8_posts table) into the media library.
 *
 * Usage: php import-orphaned-images.php [--batch-size=1000] [--dry-run]
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'wordpress_recovery');
define('DB_USER', 'wordpress');
define('DB_PASS', '7af33f801d54a89d233370c52d532bda3f99beea2ce24d86');
define('SITE_ID', 8); // Afrique Sports site ID

// Upload configuration
define('UPLOADS_DIR', '/var/www/html/wp-content/uploads/sites/8');
define('UPLOADS_URL', 'https://cms.realdemadrid.com/afriquesports/wp-content/uploads/sites/8');

// Parse command line arguments
$options = getopt('', ['batch-size:', 'dry-run', 'limit:', 'skip:']);
$batchSize = isset($options['batch-size']) ? intval($options['batch-size']) : 1000;
$dryRun = isset($options['dry-run']);
$limit = isset($options['limit']) ? intval($options['limit']) : 0;
$skip = isset($options['skip']) ? intval($options['skip']) : 0;

echo "┌─────────────────────────────────────────────────────────────┐\n";
echo "│ Afrique Sports - Import Orphaned Images                    │\n";
echo "└─────────────────────────────────────────────────────────────┘\n\n";

if ($dryRun) {
    echo "🔍 DRY RUN MODE - No changes will be made\n\n";
}

// Connect to database
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    echo "✅ Connected to database: " . DB_NAME . "\n";
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}

// Verify uploads directory exists
if (!is_dir(UPLOADS_DIR)) {
    die("❌ Uploads directory not found: " . UPLOADS_DIR . "\n");
}
echo "✅ Uploads directory found: " . UPLOADS_DIR . "\n\n";

// Get list of existing image GUIDs from database
echo "📊 Loading existing images from database...\n";
$stmt = $pdo->query("
    SELECT guid
    FROM wp_" . SITE_ID . "_posts
    WHERE post_type = 'attachment'
    AND post_mime_type LIKE 'image%'
");
$existingGUIDs = [];
while ($row = $stmt->fetch()) {
    // Extract file path from GUID
    $path = parse_url($row['guid'], PHP_URL_PATH);
    $existingGUIDs[$path] = true;
}
echo "   Found " . count($existingGUIDs) . " existing images in database\n\n";

// Scan uploads directory for image files
echo "🔍 Scanning uploads directory for orphaned images...\n";
$imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
$orphanedImages = [];

$iterator = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator(UPLOADS_DIR, RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);

$scanned = 0;
foreach ($iterator as $file) {
    if (!$file->isFile()) {
        continue;
    }

    $scanned++;
    if ($scanned % 10000 === 0) {
        echo "   Scanned: " . number_format($scanned) . " files...\r";
    }

    $ext = strtolower($file->getExtension());
    if (!in_array($ext, $imageExtensions)) {
        continue;
    }

    // Skip thumbnail versions (e.g., image-150x150.jpg)
    $filename = $file->getFilename();
    if (preg_match('/-\d+x\d+\.(jpg|jpeg|png|gif|webp)$/i', $filename)) {
        continue;
    }

    // Build URL path
    $relativePath = str_replace(UPLOADS_DIR, '', $file->getPathname());
    $urlPath = '/afriquesports/wp-content/uploads/sites/8' . $relativePath;

    // Check if already in database
    if (!isset($existingGUIDs[$urlPath])) {
        $orphanedImages[] = [
            'path' => $file->getPathname(),
            'url' => UPLOADS_URL . $relativePath,
            'filename' => $filename,
            'size' => $file->getSize(),
            'modified' => $file->getMTime()
        ];
    }

    // Apply limit if set
    if ($limit > 0 && count($orphanedImages) >= ($limit + $skip)) {
        break;
    }
}

echo "\n";
echo "📊 Scan complete:\n";
echo "   Total files scanned: " . number_format($scanned) . "\n";
echo "   Orphaned images found: " . number_format(count($orphanedImages)) . "\n";

if ($skip > 0) {
    echo "   Skipping first: " . number_format($skip) . "\n";
    $orphanedImages = array_slice($orphanedImages, $skip);
}

if ($limit > 0) {
    echo "   Processing limit: " . number_format(min($limit, count($orphanedImages))) . "\n";
    $orphanedImages = array_slice($orphanedImages, 0, $limit);
}

if (empty($orphanedImages)) {
    echo "\n✅ No orphaned images to import!\n";
    exit(0);
}

echo "\n";

if ($dryRun) {
    echo "🔍 DRY RUN - Would import " . count($orphanedImages) . " images\n";
    echo "\nSample images that would be imported:\n";
    foreach (array_slice($orphanedImages, 0, 10) as $img) {
        echo "   - " . $img['filename'] . " (" . number_format($img['size']) . " bytes)\n";
    }
    exit(0);
}

// Confirm before proceeding
echo "⚠️  Ready to import " . number_format(count($orphanedImages)) . " images into the database.\n";
echo "   This operation will create attachment posts in wp_" . SITE_ID . "_posts table.\n";
echo "   Press ENTER to continue, or Ctrl+C to cancel...\n";
fgets(STDIN);

// Prepare insert statement
$insertStmt = $pdo->prepare("
    INSERT INTO wp_" . SITE_ID . "_posts (
        post_author,
        post_date,
        post_date_gmt,
        post_content,
        post_title,
        post_excerpt,
        post_status,
        comment_status,
        ping_status,
        post_name,
        to_ping,
        pinged,
        post_modified,
        post_modified_gmt,
        post_content_filtered,
        post_parent,
        guid,
        menu_order,
        post_type,
        post_mime_type,
        comment_count
    ) VALUES (
        1,
        FROM_UNIXTIME(:post_date),
        FROM_UNIXTIME(:post_date_gmt),
        '',
        :title,
        '',
        'inherit',
        'closed',
        'closed',
        :post_name,
        '',
        '',
        FROM_UNIXTIME(:modified),
        FROM_UNIXTIME(:modified_gmt),
        '',
        0,
        :guid,
        0,
        'attachment',
        :mime_type,
        0
    )
");

$metaStmt = $pdo->prepare("
    INSERT INTO wp_" . SITE_ID . "_postmeta (post_id, meta_key, meta_value)
    VALUES (:post_id, :meta_key, :meta_value)
");

// Import images in batches
echo "\n🚀 Starting import...\n\n";
$imported = 0;
$failed = 0;
$startTime = microtime(true);

foreach ($orphanedImages as $index => $image) {
    try {
        // Get MIME type
        $mimeType = getMimeType($image['path']);

        // Get image dimensions
        $imageInfo = @getimagesize($image['path']);
        $width = $imageInfo ? $imageInfo[0] : 0;
        $height = $imageInfo ? $imageInfo[1] : 0;

        // Generate post title from filename
        $title = pathinfo($image['filename'], PATHINFO_FILENAME);
        $title = str_replace(['-', '_'], ' ', $title);
        $title = ucwords($title);

        // Generate post_name (slug)
        $postName = sanitize_title($title);

        // Insert post
        $insertStmt->execute([
            ':post_date' => $image['modified'],
            ':post_date_gmt' => $image['modified'],
            ':title' => $title,
            ':post_name' => $postName,
            ':modified' => $image['modified'],
            ':modified_gmt' => $image['modified'],
            ':guid' => $image['url'],
            ':mime_type' => $mimeType
        ]);

        $postId = $pdo->lastInsertId();

        // Insert attachment metadata
        $metadata = [
            'width' => $width,
            'height' => $height,
            'file' => str_replace(UPLOADS_DIR . '/', '', $image['path']),
            'filesize' => $image['size']
        ];

        $metaStmt->execute([
            ':post_id' => $postId,
            ':meta_key' => '_wp_attached_file',
            ':meta_value' => $metadata['file']
        ]);

        $metaStmt->execute([
            ':post_id' => $postId,
            ':meta_key' => '_wp_attachment_metadata',
            ':meta_value' => serialize($metadata)
        ]);

        $imported++;

        // Progress update
        if ($imported % 100 === 0) {
            $elapsed = microtime(true) - $startTime;
            $rate = $imported / $elapsed;
            $remaining = count($orphanedImages) - $imported;
            $eta = $remaining / $rate;

            echo sprintf(
                "   Progress: %s / %s (%.1f%%) | Rate: %.0f img/s | ETA: %s\r",
                number_format($imported),
                number_format(count($orphanedImages)),
                ($imported / count($orphanedImages)) * 100,
                $rate,
                formatTime($eta)
            );
        }

    } catch (Exception $e) {
        $failed++;
        error_log("Failed to import {$image['filename']}: " . $e->getMessage());
    }
}

echo "\n\n";
echo "┌─────────────────────────────────────────────────────────────┐\n";
echo "│ Import Complete                                             │\n";
echo "└─────────────────────────────────────────────────────────────┘\n\n";
echo "✅ Successfully imported: " . number_format($imported) . " images\n";
if ($failed > 0) {
    echo "❌ Failed: " . number_format($failed) . " images\n";
}
echo "⏱️  Total time: " . formatTime(microtime(true) - $startTime) . "\n";
echo "\n🎉 Media library updated! Visit: https://cms.realdemadrid.com/afriquesports/wp-admin/upload.php\n\n";

// Helper functions
function getMimeType($path) {
    $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'bmp' => 'image/bmp',
        'svg' => 'image/svg+xml'
    ];
    return isset($mimeTypes[$ext]) ? $mimeTypes[$ext] : 'application/octet-stream';
}

function sanitize_title($title) {
    $title = strtolower($title);
    $title = preg_replace('/[^a-z0-9-]+/', '-', $title);
    $title = trim($title, '-');
    return $title;
}

function formatTime($seconds) {
    if ($seconds < 60) {
        return sprintf("%.0fs", $seconds);
    } elseif ($seconds < 3600) {
        return sprintf("%.0fm %.0fs", floor($seconds / 60), $seconds % 60);
    } else {
        return sprintf("%.0fh %.0fm", floor($seconds / 3600), ($seconds % 3600) / 60);
    }
}

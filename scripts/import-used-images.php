#!/usr/bin/env php
<?php
/**
 * Import Used Images to WordPress Media Library
 *
 * This script finds all images referenced in posts (featured images + content images)
 * and registers them in the wp_8_posts table if they're missing.
 *
 * Usage: php import-used-images.php [--dry-run] [--batch-size=1000]
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'wordpress_recovery');
define('DB_USER', 'wordpress');
define('DB_PASS', '7af33f801d54a89d233370c52d532bda3f99beea2ce24d86');
define('SITE_ID', 8); // Afrique Sports site ID

// Upload configuration
define('UPLOADS_DIR', '/var/www/html/wp-content/uploads/sites/8');
define('UPLOADS_URL_BASE', 'https://cms.realdemadrid.com/afriquesports/wp-content/uploads/sites/8');

// Parse command line arguments
$options = getopt('', ['dry-run', 'batch-size:']);
$dryRun = isset($options['dry-run']);
$batchSize = isset($options['batch-size']) ? intval($options['batch-size']) : 1000;

echo "┌─────────────────────────────────────────────────────────────┐\n";
echo "│ Afrique Sports - Import Used Images                        │\n";
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
    echo "✅ Connected to database: " . DB_NAME . "\n\n";
} catch (PDOException $e) {
    die("❌ Database connection failed: " . $e->getMessage() . "\n");
}

// Step 1: Get all existing image attachments
echo "📊 Step 1: Loading existing attachments from database...\n";
$stmt = $pdo->query("
    SELECT guid
    FROM wp_" . SITE_ID . "_posts
    WHERE post_type = 'attachment'
    AND post_mime_type LIKE 'image%'
");
$existingAttachments = [];
while ($row = $stmt->fetch()) {
    $existingAttachments[$row['guid']] = true;
}
echo "   Found " . count($existingAttachments) . " existing attachments\n\n";

// Step 2: Extract all image URLs from post content
echo "📊 Step 2: Extracting image URLs from post content...\n";
$stmt = $pdo->query("
    SELECT ID, post_content
    FROM wp_" . SITE_ID . "_posts
    WHERE post_type = 'post'
    AND post_status IN ('publish', 'draft', 'pending')
");

$contentImages = [];
$postsScanned = 0;

while ($post = $stmt->fetch()) {
    $postsScanned++;

    // Extract image URLs from content
    // Pattern 1: <img src="...">
    preg_match_all('/<img[^>]+src=["\']([^"\']+)["\']/', $post['post_content'], $matches);
    foreach ($matches[1] as $url) {
        if (strpos($url, '/wp-content/uploads/sites/8/') !== false) {
            $contentImages[$url] = true;
        }
    }

    // Pattern 2: WordPress gallery/image blocks
    preg_match_all('/https?:\/\/[^"\'>\s]+\/wp-content\/uploads\/sites\/8\/[^"\'>\s]+\.(jpg|jpeg|png|gif|webp|bmp)/i', $post['post_content'], $matches);
    foreach ($matches[0] as $url) {
        $contentImages[$url] = true;
    }

    if ($postsScanned % 1000 === 0) {
        echo "   Scanned: " . number_format($postsScanned) . " posts...\r";
    }
}
echo "\n   Total posts scanned: " . number_format($postsScanned) . "\n";
echo "   Unique images found in content: " . number_format(count($contentImages)) . "\n\n";

// Step 3: Get featured images (from postmeta)
echo "📊 Step 3: Checking featured images...\n";
$stmt = $pdo->query("
    SELECT pm.meta_value as attachment_id, p.guid
    FROM wp_" . SITE_ID . "_postmeta pm
    LEFT JOIN wp_" . SITE_ID . "_posts p ON p.ID = pm.meta_value
    WHERE pm.meta_key = '_thumbnail_id'
    AND pm.meta_value != ''
");

$featuredImageUrls = [];
$orphanedFeaturedImages = [];

while ($row = $stmt->fetch()) {
    if ($row['guid']) {
        // Featured image attachment exists
        $featuredImageUrls[$row['guid']] = true;
    } else {
        // Featured image attachment is missing
        $orphanedFeaturedImages[] = $row['attachment_id'];
    }
}

echo "   Featured images with valid attachments: " . count($featuredImageUrls) . "\n";
echo "   Orphaned featured image references: " . count($orphanedFeaturedImages) . "\n\n";

// Step 4: Combine all used images
$allUsedImages = array_merge(array_keys($contentImages), array_keys($featuredImageUrls));
$allUsedImages = array_unique($allUsedImages);

echo "📊 Step 4: Total unique images used: " . number_format(count($allUsedImages)) . "\n\n";

// Step 5: Find images that need to be imported (used but not in attachments table)
$imagesToImport = [];
foreach ($allUsedImages as $imageUrl) {
    if (!isset($existingAttachments[$imageUrl])) {
        // Extract file path from URL
        if (preg_match('/\/wp-content\/uploads\/sites\/8\/(.+)$/', $imageUrl, $matches)) {
            $relativePath = $matches[1];
            $fullPath = UPLOADS_DIR . '/' . $relativePath;

            // Check if file exists on disk
            if (file_exists($fullPath) && is_file($fullPath)) {
                $imagesToImport[] = [
                    'url' => $imageUrl,
                    'path' => $fullPath,
                    'filename' => basename($fullPath),
                    'size' => filesize($fullPath),
                    'modified' => filemtime($fullPath)
                ];
            }
        }
    }
}

echo "📊 Step 5: Images to import:\n";
echo "   Used in posts: " . number_format(count($allUsedImages)) . "\n";
echo "   Already in database: " . number_format(count($existingAttachments)) . "\n";
echo "   Need to import: " . number_format(count($imagesToImport)) . "\n\n";

if (empty($imagesToImport)) {
    echo "✅ All used images are already in the database!\n";
    exit(0);
}

if ($dryRun) {
    echo "🔍 DRY RUN - Would import " . count($imagesToImport) . " images\n";
    echo "\nSample images that would be imported:\n";
    foreach (array_slice($imagesToImport, 0, 20) as $img) {
        echo "   - " . $img['filename'] . " (" . number_format($img['size']) . " bytes)\n";
    }
    exit(0);
}

// Step 6: Import missing images
echo "⚠️  Ready to import " . number_format(count($imagesToImport)) . " images.\n";
echo "   Press ENTER to continue, or Ctrl+C to cancel...\n";
fgets(STDIN);

// Prepare insert statements
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

echo "\n🚀 Starting import...\n\n";
$imported = 0;
$failed = 0;
$startTime = microtime(true);

foreach ($imagesToImport as $image) {
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
        $relativePath = str_replace(UPLOADS_DIR . '/', '', $image['path']);

        $metadata = [
            'width' => $width,
            'height' => $height,
            'file' => $relativePath,
            'filesize' => $image['size']
        ];

        $metaStmt->execute([
            ':post_id' => $postId,
            ':meta_key' => '_wp_attached_file',
            ':meta_value' => $relativePath
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
            $remaining = count($imagesToImport) - $imported;
            $eta = $remaining / $rate;

            echo sprintf(
                "   Progress: %s / %s (%.1f%%) | Rate: %.0f img/s | ETA: %s\r",
                number_format($imported),
                number_format(count($imagesToImport)),
                ($imported / count($imagesToImport)) * 100,
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
echo "\n📊 Final statistics:\n";
echo "   Images in database before: " . number_format(count($existingAttachments)) . "\n";
echo "   Images imported: " . number_format($imported) . "\n";
echo "   Total images now: " . number_format(count($existingAttachments) + $imported) . "\n";
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
    return substr($title, 0, 200); // Limit length
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

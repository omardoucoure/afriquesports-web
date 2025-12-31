<?php
/**
 * Image Quality Analyzer
 *
 * Detects image quality issues including blur, brightness, contrast, and compression
 *
 * @package Afrique_Sports_SEO_Checker
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Image Quality Analyzer Class
 */
class Afrique_SEO_Image_Quality {

    /**
     * Minimum sharpness threshold (Laplacian variance)
     * Lower values = more blurry
     * Typical values: 100-500 (blurry), 500+ (acceptable), 1000+ (sharp)
     */
    const SHARPNESS_THRESHOLD = 100;

    /**
     * Minimum brightness (0-255 scale)
     */
    const MIN_BRIGHTNESS = 30;

    /**
     * Maximum brightness (0-255 scale)
     */
    const MAX_BRIGHTNESS = 230;

    /**
     * Minimum contrast (standard deviation)
     */
    const MIN_CONTRAST = 20;

    /**
     * Minimum JPEG quality estimate
     */
    const MIN_JPEG_QUALITY = 60;

    /**
     * Analyze image quality
     *
     * @param string $image_path Full path to image file.
     * @return array Quality analysis results.
     */
    public static function analyze_image($image_path) {
        if (!file_exists($image_path)) {
            return array(
                'valid' => false,
                'error' => 'Image file not found',
            );
        }

        $results = array(
            'valid' => true,
            'sharpness' => null,
            'brightness' => null,
            'contrast' => null,
            'jpeg_quality' => null,
            'issues' => array(),
            'warnings' => array(),
        );

        // Check if Imagick is available (preferred)
        if (extension_loaded('imagick')) {
            $results = self::analyze_with_imagick($image_path);
        }
        // Fallback to GD
        elseif (extension_loaded('gd')) {
            $results = self::analyze_with_gd($image_path);
        }
        // No image processing library available
        else {
            $results['valid'] = false;
            $results['error'] = 'No image processing library available (Imagick or GD required)';
        }

        return $results;
    }

    /**
     * Analyze image quality using Imagick
     *
     * @param string $image_path Path to image.
     * @return array Analysis results.
     */
    private static function analyze_with_imagick($image_path) {
        try {
            $image = new Imagick($image_path);

            $results = array(
                'valid' => true,
                'issues' => array(),
                'warnings' => array(),
            );

            // 1. Blur Detection (Laplacian Variance)
            $sharpness = self::detect_blur_imagick($image);
            $results['sharpness'] = round($sharpness, 2);

            if ($sharpness < self::SHARPNESS_THRESHOLD) {
                $results['issues'][] = sprintf(
                    'Image appears blurry (sharpness: %.2f, minimum: %d)',
                    $sharpness,
                    self::SHARPNESS_THRESHOLD
                );
            }

            // 2. Brightness Analysis
            $brightness = self::get_brightness_imagick($image);
            $results['brightness'] = round($brightness, 2);

            if ($brightness < self::MIN_BRIGHTNESS) {
                $results['issues'][] = sprintf(
                    'Image is too dark (brightness: %.2f, minimum: %d)',
                    $brightness,
                    self::MIN_BRIGHTNESS
                );
            } elseif ($brightness > self::MAX_BRIGHTNESS) {
                $results['issues'][] = sprintf(
                    'Image is too bright/overexposed (brightness: %.2f, maximum: %d)',
                    $brightness,
                    self::MAX_BRIGHTNESS
                );
            }

            // 3. Contrast Analysis
            $contrast = self::get_contrast_imagick($image);
            $results['contrast'] = round($contrast, 2);

            if ($contrast < self::MIN_CONTRAST) {
                $results['warnings'][] = sprintf(
                    'Image has low contrast (contrast: %.2f, minimum: %d)',
                    $contrast,
                    self::MIN_CONTRAST
                );
            }

            // 4. JPEG Quality Estimation
            $format = $image->getImageFormat();
            if (strtolower($format) === 'jpeg' || strtolower($format) === 'jpg') {
                $jpeg_quality = self::estimate_jpeg_quality_imagick($image);
                $results['jpeg_quality'] = $jpeg_quality;

                if ($jpeg_quality < self::MIN_JPEG_QUALITY) {
                    $results['warnings'][] = sprintf(
                        'Image compression quality is low (quality: %d%%, recommended: %d%%+)',
                        $jpeg_quality,
                        self::MIN_JPEG_QUALITY
                    );
                }
            }

            // 5. Resolution appropriateness (check if image is upscaled)
            $is_upscaled = self::detect_upscaling_imagick($image);
            if ($is_upscaled) {
                $results['warnings'][] = 'Image may be upscaled from a smaller original';
            }

            $image->clear();
            $image->destroy();

            return $results;

        } catch (Exception $e) {
            return array(
                'valid' => false,
                'error' => 'Imagick error: ' . $e->getMessage(),
            );
        }
    }

    /**
     * Detect blur using Laplacian variance (Imagick)
     *
     * @param Imagick $image Image object.
     * @return float Sharpness score (higher = sharper).
     */
    private static function detect_blur_imagick($image) {
        try {
            // Clone to avoid modifying original
            $clone = clone $image;

            // Resize to smaller size for faster processing (max 400px wide)
            $geometry = $clone->getImageGeometry();
            if ($geometry['width'] > 400) {
                $clone->resizeImage(400, 0, Imagick::FILTER_LANCZOS, 1);
            }

            // Convert to grayscale
            $clone->transformImageColorspace(Imagick::COLORSPACE_GRAY);

            // Apply edge detection (Laplacian filter)
            $clone->edgeImage(0);

            // Sample random pixels to calculate variance
            $width = $clone->getImageWidth();
            $height = $clone->getImageHeight();
            $sample_size = min(100, $width * $height / 100);
            $sum = 0;

            for ($i = 0; $i < $sample_size; $i++) {
                $x = rand(0, $width - 1);
                $y = rand(0, $height - 1);
                $pixel = $clone->getImagePixelColor($x, $y);
                $color = $pixel->getColor();
                $sum += $color['r']; // Grayscale, so r=g=b
            }

            $sharpness = ($sum / $sample_size) * 4; // Scale up for better readability

            $clone->clear();
            $clone->destroy();

            return $sharpness;

        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Get average brightness (Imagick)
     *
     * @param Imagick $image Image object.
     * @return float Brightness (0-255).
     */
    private static function get_brightness_imagick($image) {
        try {
            // Sample random pixels
            $width = $image->getImageWidth();
            $height = $image->getImageHeight();
            $sample_size = min(500, $width * $height / 20);
            $sum = 0;

            for ($i = 0; $i < $sample_size; $i++) {
                $x = rand(0, $width - 1);
                $y = rand(0, $height - 1);
                $pixel = $image->getImagePixelColor($x, $y);
                $color = $pixel->getColor();
                // Calculate perceived brightness (luminance)
                $brightness = ($color['r'] * 0.299 + $color['g'] * 0.587 + $color['b'] * 0.114);
                $sum += $brightness;
            }

            return $sum / $sample_size;
        } catch (Exception $e) {
            return 128; // Default middle brightness
        }
    }

    /**
     * Get contrast (Imagick)
     *
     * @param Imagick $image Image object.
     * @return float Contrast value.
     */
    private static function get_contrast_imagick($image) {
        try {
            // Sample pixels and calculate standard deviation
            $width = $image->getImageWidth();
            $height = $image->getImageHeight();
            $sample_size = min(500, $width * $height / 20);
            $values = array();

            for ($i = 0; $i < $sample_size; $i++) {
                $x = rand(0, $width - 1);
                $y = rand(0, $height - 1);
                $pixel = $image->getImagePixelColor($x, $y);
                $color = $pixel->getColor();
                $brightness = ($color['r'] * 0.299 + $color['g'] * 0.587 + $color['b'] * 0.114);
                $values[] = $brightness;
            }

            // Calculate standard deviation
            $mean = array_sum($values) / count($values);
            $variance = 0;
            foreach ($values as $value) {
                $variance += pow($value - $mean, 2);
            }
            $std_dev = sqrt($variance / count($values));

            return $std_dev;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Estimate JPEG quality (Imagick)
     *
     * @param Imagick $image Image object.
     * @return int Quality percentage (0-100).
     */
    private static function estimate_jpeg_quality_imagick($image) {
        try {
            $quality = $image->getImageCompressionQuality();
            return $quality > 0 ? $quality : 85; // Default to 85 if not available
        } catch (Exception $e) {
            return 85;
        }
    }

    /**
     * Detect if image is upscaled (low quality enlarged image)
     *
     * @param Imagick $image Image object.
     * @return bool True if likely upscaled.
     */
    private static function detect_upscaling_imagick($image) {
        try {
            // Check for EXIF data indicating original size
            $exif = @$image->getImageProperties("exif:*");

            // If sharpness is very low despite large dimensions, likely upscaled
            $sharpness = self::detect_blur_imagick($image);
            $dimensions = $image->getImageGeometry();

            // Large image but very low sharpness = likely upscaled
            if ($dimensions['width'] >= 1200 && $sharpness < 50) {
                return true;
            }

            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Analyze image quality using GD (fallback)
     *
     * @param string $image_path Path to image.
     * @return array Analysis results.
     */
    private static function analyze_with_gd($image_path) {
        $image_info = getimagesize($image_path);
        if (!$image_info) {
            return array(
                'valid' => false,
                'error' => 'Unable to read image',
            );
        }

        $mime_type = $image_info['mime'];

        // Load image based on type
        switch ($mime_type) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($image_path);
                break;
            case 'image/png':
                $image = imagecreatefrompng($image_path);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($image_path);
                break;
            default:
                return array(
                    'valid' => false,
                    'error' => 'Unsupported image format for GD',
                );
        }

        if (!$image) {
            return array(
                'valid' => false,
                'error' => 'Failed to load image with GD',
            );
        }

        $results = array(
            'valid' => true,
            'issues' => array(),
            'warnings' => array(),
        );

        // Calculate sharpness (simplified Laplacian)
        $sharpness = self::detect_blur_gd($image);
        $results['sharpness'] = round($sharpness, 2);

        if ($sharpness < self::SHARPNESS_THRESHOLD) {
            $results['issues'][] = sprintf(
                'Image appears blurry (sharpness: %.2f, minimum: %d)',
                $sharpness,
                self::SHARPNESS_THRESHOLD
            );
        }

        // Calculate brightness
        $brightness = self::get_brightness_gd($image, $image_info[0], $image_info[1]);
        $results['brightness'] = round($brightness, 2);

        if ($brightness < self::MIN_BRIGHTNESS) {
            $results['issues'][] = sprintf(
                'Image is too dark (brightness: %.2f, minimum: %d)',
                $brightness,
                self::MIN_BRIGHTNESS
            );
        } elseif ($brightness > self::MAX_BRIGHTNESS) {
            $results['issues'][] = sprintf(
                'Image is too bright (brightness: %.2f, maximum: %d)',
                $brightness,
                self::MAX_BRIGHTNESS
            );
        }

        imagedestroy($image);

        return $results;
    }

    /**
     * Detect blur using simplified edge detection (GD)
     *
     * @param resource $image GD image resource.
     * @return float Sharpness score.
     */
    private static function detect_blur_gd($image) {
        $width = imagesx($image);
        $height = imagesy($image);

        // Sample 100 random points for performance
        $sample_size = min(100, $width * $height / 100);
        $edge_sum = 0;

        for ($i = 0; $i < $sample_size; $i++) {
            $x = rand(1, $width - 2);
            $y = rand(1, $height - 2);

            // Get neighboring pixels
            $center = imagecolorat($image, $x, $y);
            $right = imagecolorat($image, $x + 1, $y);
            $down = imagecolorat($image, $x, $y + 1);

            // Calculate brightness difference (simple edge detection)
            $center_brightness = ($center >> 16) & 0xFF;
            $right_brightness = ($right >> 16) & 0xFF;
            $down_brightness = ($down >> 16) & 0xFF;

            $edge_sum += abs($center_brightness - $right_brightness) +
                         abs($center_brightness - $down_brightness);
        }

        $sharpness = ($edge_sum / $sample_size) * 10;
        return $sharpness;
    }

    /**
     * Get average brightness (GD)
     *
     * @param resource $image GD image resource.
     * @param int      $width Image width.
     * @param int      $height Image height.
     * @return float Brightness (0-255).
     */
    private static function get_brightness_gd($image, $width, $height) {
        $sample_size = min(1000, $width * $height / 10);
        $brightness_sum = 0;

        for ($i = 0; $i < $sample_size; $i++) {
            $x = rand(0, $width - 1);
            $y = rand(0, $height - 1);
            $rgb = imagecolorat($image, $x, $y);

            $r = ($rgb >> 16) & 0xFF;
            $g = ($rgb >> 8) & 0xFF;
            $b = $rgb & 0xFF;

            // Calculate perceived brightness
            $brightness_sum += ($r * 0.299 + $g * 0.587 + $b * 0.114);
        }

        return $brightness_sum / $sample_size;
    }

    /**
     * Get quality summary message
     *
     * @param array $analysis Analysis results.
     * @return string Summary message.
     */
    public static function get_quality_summary($analysis) {
        if (!$analysis['valid']) {
            return isset($analysis['error']) ? $analysis['error'] : 'Quality analysis failed';
        }

        if (!empty($analysis['issues'])) {
            return implode('; ', $analysis['issues']);
        }

        if (!empty($analysis['warnings'])) {
            return 'Image quality acceptable with warnings: ' . implode('; ', $analysis['warnings']);
        }

        return 'Image quality is good';
    }

    /**
     * Check if image passes quality requirements
     *
     * @param array $analysis Analysis results.
     * @return bool True if passes all requirements.
     */
    public static function passes_quality_check($analysis) {
        return $analysis['valid'] && empty($analysis['issues']);
    }
}

<?php
/**
 * SEO Validation Functions
 *
 * @package Afrique_Sports_SEO_Checker
 */

// Exit if accessed directly.
if (!defined('ABSPATH')) {
    exit;
}

/**
 * SEO Validators Class
 */
class Afrique_SEO_Validators {

    /**
     * Plugin instance
     *
     * @var Afrique_Sports_SEO_Checker
     */
    private $plugin;

    /**
     * Constructor
     */
    public function __construct() {
        $this->plugin = Afrique_Sports_SEO_Checker::get_instance();
    }

    /**
     * Validate entire post
     *
     * @param int   $post_id Post ID.
     * @param array $data    Post data (optional, for pre-save validation).
     * @param array $postarr Post array (optional).
     * @return array Validation results.
     */
    public function validate_post($post_id, $data = array(), $postarr = array()) {
        $post = get_post($post_id);

        // Use provided data or get from post
        $title = !empty($data['post_title']) ? $data['post_title'] : ($post ? $post->post_title : '');
        $content = !empty($data['post_content']) ? $data['post_content'] : ($post ? $post->post_content : '');
        $excerpt = !empty($data['post_excerpt']) ? $data['post_excerpt'] : ($post ? $post->post_excerpt : '');

        $results = array();

        // 1. Title validation
        $results['title'] = $this->validate_title($title);

        // 2. Content validation
        $results['content'] = $this->validate_content($content);

        // 3. Featured image validation
        $results['featured_image'] = $this->validate_featured_image($post_id, $postarr);

        // 4. Meta description validation
        $results['meta_description'] = $this->validate_meta_description($post_id, $postarr);

        // 5. Internal links validation
        $results['internal_links'] = $this->validate_internal_links($content);

        // 6. Categories validation
        $results['categories'] = $this->validate_categories($post_id, $postarr);

        // 7. Tags validation
        $results['tags'] = $this->validate_tags($post_id, $postarr);

        // 8. Permalink validation
        $results['permalink'] = $this->validate_permalink($post_id, $data);

        // 9. Headings validation
        $results['headings'] = $this->validate_headings($content);

        // 10. SEO plugin integration (if available)
        $results['seo_plugin'] = $this->validate_seo_plugin($post_id);

        return $results;
    }

    /**
     * Validate title
     *
     * @param string $title Post title.
     * @return array Validation result.
     */
    public function validate_title($title) {
        $min = $this->plugin->get_setting('title_min');
        $max = $this->plugin->get_setting('title_max');
        $required = $this->plugin->get_setting('title_required');

        $length = mb_strlen($title);

        $result = array(
            'name' => 'Longueur du titre',
            'description' => sprintf('Le titre doit contenir entre %d et %d caractères pour un SEO optimal et un affichage correct dans les résultats de recherche.', $min, $max),
            'required' => $required,
            'status' => 'success',
            'message' => '',
            'value' => $length,
        );

        if ($length < $min) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Le titre est trop court (%d caractères). Minimum : %d caractères.', $length, $min);
        } elseif ($length > $max) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Le titre est trop long (%d caractères). Maximum : %d caractères.', $length, $max);
        } else {
            $result['message'] = sprintf('La longueur du titre est parfaite (%d caractères).', $length);
        }

        return $result;
    }

    /**
     * Validate content
     *
     * @param string $content Post content.
     * @return array Validation result.
     */
    public function validate_content($content) {
        $min = $this->plugin->get_setting('content_min_words');
        $max = $this->plugin->get_setting('content_max_words');
        $required = $this->plugin->get_setting('content_required');

        // Strip shortcodes and HTML
        $clean_content = wp_strip_all_tags(strip_shortcodes($content));
        $word_count = str_word_count($clean_content);

        $result = array(
            'name' => 'Nombre de mots',
            'description' => sprintf('Le contenu doit contenir entre %d et %d mots pour une optimisation Google News et SEO.', $min, $max),
            'required' => $required,
            'status' => 'success',
            'message' => '',
            'value' => $word_count,
        );

        if ($word_count < $min) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Le contenu est trop court (%d mots). Minimum : %d mots.', $word_count, $min);
        } elseif ($max > 0 && $word_count > $max) {
            $result['status'] = 'warning';
            $result['message'] = sprintf('Le contenu est très long (%d mots). Envisagez de diviser en plusieurs articles. Maximum recommandé : %d mots.', $word_count, $max);
        } else {
            $result['message'] = sprintf('Le nombre de mots est bon (%d mots).', $word_count);
        }

        return $result;
    }

    /**
     * Validate featured image
     *
     * @param int   $post_id Post ID.
     * @param array $postarr Post array.
     * @return array Validation result.
     */
    public function validate_featured_image($post_id, $postarr = array()) {
        $required = $this->plugin->get_setting('image_required');
        $min_width = $this->plugin->get_setting('image_min_width');
        $min_height = $this->plugin->get_setting('image_min_height');
        $max_size_kb = $this->plugin->get_setting('image_max_size_kb');
        $alt_required = $this->plugin->get_setting('image_alt_required');
        $alt_max_chars = $this->plugin->get_setting('image_alt_max_chars');

        $result = array(
            'name' => 'Image à la une',
            'description' => sprintf(__('L\'image à la une doit faire au moins %dx%d pixels, peser moins de %dKB, avec un texte alternatif de moins de %d caractères.', 'afrique-sports-seo'), $min_width, $min_height, $max_size_kb, $alt_max_chars),
            'required' => $required,
            'status' => 'success',
            'message' => '',
            'details' => array(),
        );

        // Check if featured image is set
        $thumbnail_id = get_post_thumbnail_id($post_id);

        // For new posts or API posts, check meta_input
        if (!$thumbnail_id && isset($postarr['meta_input']['_thumbnail_id'])) {
            $thumbnail_id = $postarr['meta_input']['_thumbnail_id'];
        }

        // Also check direct _thumbnail_id key
        if (!$thumbnail_id && isset($postarr['_thumbnail_id'])) {
            $thumbnail_id = $postarr['_thumbnail_id'];
        }

        if (!$thumbnail_id) {
            $result['status'] = 'error';
            $result['message'] = 'Aucune image à la une définie.';
            return $result;
        }

        // Get image metadata
        $image_meta = wp_get_attachment_metadata($thumbnail_id);
        $image_path = get_attached_file($thumbnail_id);

        // Check dimensions
        if (isset($image_meta['width']) && isset($image_meta['height'])) {
            $width = $image_meta['width'];
            $height = $image_meta['height'];

            $result['details']['dimensions'] = sprintf('%dx%d', $width, $height);

            if ($width < $min_width || $height < $min_height) {
                $result['status'] = 'error';
                $result['message'] = sprintf(
                    __('Les dimensions de l\'image (%dx%d) sont trop petites. Minimum : %dx%d pixels.', 'afrique-sports-seo'),
                    $width,
                    $height,
                    $min_width,
                    $min_height
                );
                return $result;
            }
        }

        // Check file size
        if ($image_path && file_exists($image_path)) {
            $file_size_bytes = filesize($image_path);
            $file_size_kb = round($file_size_bytes / 1024);

            $result['details']['file_size'] = $file_size_kb . 'KB';

            if ($file_size_kb > $max_size_kb) {
                $result['status'] = 'error';
                $result['message'] = sprintf(
                    'La taille du fichier image (%dKB) est trop grande. Maximum : %dKB pour un chargement rapide.',
                    $file_size_kb,
                    $max_size_kb
                );
                return $result;
            }
        }

        // Check image quality (blur, brightness, contrast)
        if ($image_path && file_exists($image_path) && class_exists('Afrique_SEO_Image_Quality')) {
            $quality_check = $this->plugin->get_setting('image_quality_check');

            if ($quality_check) {
                $quality_analysis = Afrique_SEO_Image_Quality::analyze_image($image_path);

                if ($quality_analysis['valid']) {
                    // Add quality metrics to details
                    if (isset($quality_analysis['sharpness'])) {
                        $result['details']['sharpness'] = $quality_analysis['sharpness'];
                    }
                    if (isset($quality_analysis['brightness'])) {
                        $result['details']['brightness'] = round($quality_analysis['brightness']);
                    }

                    // Check for critical quality issues
                    if (!empty($quality_analysis['issues'])) {
                        $result['status'] = 'warning';
                        $result['message'] = 'Image quality issues detected: ' .
                                           implode('; ', $quality_analysis['issues']);
                    }
                }
            }
        }

        // Check alt text
        $alt_text = get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true);
        $alt_length = mb_strlen($alt_text);

        $result['details']['alt_text'] = $alt_text ? $alt_length . ' chars' : 'None';

        if ($alt_required && empty($alt_text)) {
            $result['status'] = 'error';
            $result['message'] = 'Featured image is missing alt text. Alt text is required for accessibility and SEO.';
            return $result;
        }

        if ($alt_text && $alt_length > $alt_max_chars) {
            $result['status'] = 'warning';
            $result['message'] = sprintf(
                'Alt text is too long (%d characters). Maximum recommended: %d characters.',
                $alt_length,
                $alt_max_chars
            );
        }

        // All checks passed
        if ($result['status'] === 'success') {
            $result['message'] = sprintf(
                'Featured image meets all requirements (%s, %s).',
                $result['details']['dimensions'],
                $result['details']['file_size']
            );
        }

        return $result;
    }

    /**
     * Validate meta description
     *
     * @param int $post_id Post ID.
     * @return array Validation result.
     */
    public function validate_meta_description($post_id, $postarr = array()) {
        $required = $this->plugin->get_setting('meta_desc_required');
        $min = $this->plugin->get_setting('meta_desc_min');
        $max = $this->plugin->get_setting('meta_desc_max');

        $result = array(
            'name' => 'Meta Description',
            'description' => sprintf('La méta description doit contenir entre %d et %d caractères pour un affichage optimal dans les résultats de recherche.', $min, $max),
            'required' => $required,
            'status' => 'success',
            'message' => '',
        );

        // Check for Yoast SEO
        $meta_desc = get_post_meta($post_id, '_yoast_wpseo_metadesc', true);

        // Check for Rank Math
        if (empty($meta_desc)) {
            $meta_desc = get_post_meta($post_id, 'rank_math_description', true);
        }

        // Check for All in One SEO
        if (empty($meta_desc)) {
            $meta_desc = get_post_meta($post_id, '_aioseo_description', true);
        }

        // For API posts, check meta_input
        if (empty($meta_desc) && isset($postarr['meta_input'])) {
            if (isset($postarr['meta_input']['_yoast_wpseo_metadesc'])) {
                $meta_desc = $postarr['meta_input']['_yoast_wpseo_metadesc'];
            } elseif (isset($postarr['meta_input']['rank_math_description'])) {
                $meta_desc = $postarr['meta_input']['rank_math_description'];
            } elseif (isset($postarr['meta_input']['_aioseo_description'])) {
                $meta_desc = $postarr['meta_input']['_aioseo_description'];
            }
        }

        $length = mb_strlen($meta_desc);
        $result['value'] = $length;

        if (empty($meta_desc)) {
            $result['status'] = $required ? 'error' : 'warning';
            $result['message'] = 'Aucune méta description définie. Utilisez Yoast SEO, Rank Math ou All in One SEO pour en ajouter une.';
        } elseif ($length < $min) {
            $result['status'] = 'error';
            $result['message'] = sprintf('La méta description est trop courte (%d caractères). Minimum : %d caractères.', $length, $min);
        } elseif ($length > $max) {
            $result['status'] = 'error';
            $result['message'] = sprintf('La méta description est trop longue (%d caractères). Maximum : %d caractères.', $length, $max);
        } else {
            $result['message'] = sprintf('La longueur de la méta description est parfaite (%d caractères).', $length);
        }

        return $result;
    }

    /**
     * Validate internal links
     *
     * @param string $content Post content.
     * @return array Validation result.
     */
    public function validate_internal_links($content) {
        $min = $this->plugin->get_setting('internal_links_min');
        $max = $this->plugin->get_setting('internal_links_max');

        $result = array(
            'name' => 'Liens internes',
            'description' => sprintf('Doit contenir %d à %d liens internes vers du contenu connexe sur votre site.', $min, $max),
            'required' => true,
            'status' => 'success',
            'message' => '',
        );

        // Extract all links from content
        preg_match_all('/<a\s+(?:[^>]*?\s+)?href=(["\'])(.*?)\1/i', $content, $matches);

        if (empty($matches[2])) {
            $result['status'] = 'error';
            $result['value'] = 0;
            $result['message'] = sprintf('Aucun lien trouvé. Ajoutez au moins %d liens internes vers des articles connexes.', $min);
            return $result;
        }

        // Count internal links
        $site_url = get_site_url();
        $internal_count = 0;

        foreach ($matches[2] as $url) {
            // Check if URL is internal
            if (strpos($url, $site_url) !== false || strpos($url, '/') === 0) {
                $internal_count++;
            }
        }

        $result['value'] = $internal_count;

        if ($internal_count < $min) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Pas assez de liens internes (%d trouvé(s)). Minimum : %d liens.', $internal_count, $min);
        } elseif ($internal_count > $max) {
            $result['status'] = 'warning';
            $result['message'] = sprintf('Trop de liens internes (%d trouvé(s)). Maximum recommandé : %d liens.', $internal_count, $max);
        } else {
            $result['message'] = sprintf('Bon nombre de liens internes (%d lien(s)).', $internal_count);
        }

        return $result;
    }

    /**
     * Validate categories
     *
     * @param int   $post_id Post ID.
     * @param array $postarr Post array.
     * @return array Validation result.
     */
    public function validate_categories($post_id, $postarr = array()) {
        $required = $this->plugin->get_setting('category_required');
        $min = $this->plugin->get_setting('category_min');
        $max = $this->plugin->get_setting('category_max');

        $result = array(
            'name' => 'Catégories',
            'description' => sprintf('Doit avoir %d à %d catégories assignées.', $min, $max),
            'required' => $required,
            'status' => 'success',
            'message' => '',
        );

        // Get categories
        $categories = wp_get_post_categories($post_id);

        // For new posts, check if categories are being set
        if (empty($categories) && isset($postarr['post_category'])) {
            $categories = $postarr['post_category'];
        }

        $count = count($categories);
        $result['value'] = $count;

        if ($count < $min) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Pas assez de catégories (%d assignée(s)). Minimum : %d catégorie(s).', $count, $min);
        } elseif ($count > $max) {
            $result['status'] = 'warning';
            $result['message'] = sprintf('Trop de catégories (%d assignée(s)). Maximum recommandé : %d catégorie(s).', $count, $max);
        } else {
            $result['message'] = sprintf('Bon nombre de catégories (%d assignée(s)).', $count);
        }

        return $result;
    }

    /**
     * Validate tags
     *
     * @param int   $post_id Post ID.
     * @param array $postarr Post array.
     * @return array Validation result.
     */
    public function validate_tags($post_id, $postarr = array()) {
        $min = $this->plugin->get_setting('tags_min');
        $max = $this->plugin->get_setting('tags_max');

        $result = array(
            'name' => 'Étiquettes',
            'description' => sprintf('Doit avoir %d à %d étiquettes pour organiser le contenu.', $min, $max),
            'required' => false,
            'status' => 'success',
            'message' => '',
        );

        // Get tags
        $tags = wp_get_post_tags($post_id);

        // For new posts, check if tags are being set
        if (empty($tags) && isset($postarr['tags_input'])) {
            $tags = is_array($postarr['tags_input']) ? $postarr['tags_input'] : explode(',', $postarr['tags_input']);
        }

        $count = count($tags);
        $result['value'] = $count;

        if ($count < $min) {
            $result['status'] = 'warning';
            $result['message'] = sprintf(__('Peu d\'étiquettes (%d assignée(s)). Minimum recommandé : %d étiquette(s).', 'afrique-sports-seo'), $count, $min);
        } elseif ($count > $max) {
            $result['status'] = 'warning';
            $result['message'] = sprintf(__('Trop d\'étiquettes (%d assignée(s)). Maximum recommandé : %d étiquette(s).', 'afrique-sports-seo'), $count, $max);
        } else {
            $result['message'] = sprintf(__('Bon nombre d\'étiquettes (%d assignée(s)).', 'afrique-sports-seo'), $count);
        }

        return $result;
    }

    /**
     * Validate permalink
     *
     * @param int   $post_id Post ID.
     * @param array $data    Post data.
     * @return array Validation result.
     */
    public function validate_permalink($post_id, $data = array()) {
        $max_length = $this->plugin->get_setting('permalink_max_length');

        $result = array(
            'name' => 'Permalien',
            'description' => sprintf('Le permalien doit contenir moins de %d caractères pour des URL propres.', $max_length),
            'required' => false,
            'status' => 'success',
            'message' => '',
        );

        $post = get_post($post_id);
        $slug = !empty($data['post_name']) ? $data['post_name'] : ($post ? $post->post_name : '');

        // If no slug yet, generate from title
        if (empty($slug) && !empty($data['post_title'])) {
            $slug = sanitize_title($data['post_title']);
        }

        $length = mb_strlen($slug);
        $result['value'] = $length;

        if ($length > $max_length) {
            $result['status'] = 'warning';
            $result['message'] = sprintf('Le permalien est long (%d caractères). Envisagez de le raccourcir à moins de %d caractères.', $length, $max_length);
        } else {
            $result['message'] = sprintf('La longueur du permalien est bonne (%d caractères).', $length);
        }

        return $result;
    }

    /**
     * Validate headings
     *
     * @param string $content Post content.
     * @return array Validation result.
     */
    public function validate_headings($content) {
        $min_headings = $this->plugin->get_setting('content_min_headings');

        $result = array(
            'name' => 'Sous-titres (H2/H3)',
            'description' => sprintf('Doit avoir au moins %d sous-titres (H2/H3) pour une meilleure lisibilité.', $min_headings),
            'required' => true,
            'status' => 'success',
            'message' => '',
        );

        // Count H2 and H3 tags
        preg_match_all('/<h[23][^>]*>/i', $content, $matches);
        $count = count($matches[0]);

        $result['value'] = $count;

        if ($count < $min_headings) {
            $result['status'] = 'error';
            $result['message'] = sprintf('Pas assez de sous-titres (%d trouvé(s)). Minimum : %d sous-titre(s).', $count, $min_headings);
        } else {
            $result['message'] = sprintf('Bonne utilisation des sous-titres (%d trouvé(s)).', $count);
        }

        return $result;
    }

    /**
     * Validate SEO plugin scores
     *
     * @param int $post_id Post ID.
     * @return array Validation result.
     */
    public function validate_seo_plugin($post_id) {
        $result = array(
            'name' => 'SEO Plugin Score',
            'description' => 'Yoast SEO, Rank Math, or All in One SEO score should be OK or Good.',
            'required' => false,
            'status' => 'info',
            'message' => '',
        );

        // Check for Yoast SEO
        if (defined('WPSEO_VERSION')) {
            $yoast_score = get_post_meta($post_id, '_yoast_wpseo_linkdex', true);

            if ($yoast_score !== '') {
                $score = intval($yoast_score);

                if ($score >= 70) {
                    $result['status'] = 'success';
                    $result['message'] = sprintf('Yoast SEO score: %d (Good)', $score);
                } elseif ($score >= 40) {
                    $result['status'] = 'warning';
                    $result['message'] = sprintf('Yoast SEO score: %d (OK). Consider improving.', $score);
                } else {
                    $result['status'] = 'error';
                    $result['required'] = true;
                    $result['message'] = sprintf('Yoast SEO score: %d (Needs improvement). Please fix SEO issues.', $score);
                }

                return $result;
            }
        }

        // Check for Rank Math
        if (defined('RANK_MATH_VERSION')) {
            $rank_math_score = get_post_meta($post_id, 'rank_math_seo_score', true);

            if ($rank_math_score !== '') {
                $score = intval($rank_math_score);

                if ($score >= 80) {
                    $result['status'] = 'success';
                    $result['message'] = sprintf('Rank Math score: %d (Good)', $score);
                } elseif ($score >= 51) {
                    $result['status'] = 'warning';
                    $result['message'] = sprintf('Rank Math score: %d (OK). Consider improving.', $score);
                } else {
                    $result['status'] = 'error';
                    $result['required'] = true;
                    $result['message'] = sprintf('Rank Math score: %d (Needs improvement). Please fix SEO issues.', $score);
                }

                return $result;
            }
        }

        // No SEO plugin detected or no score
        $result['message'] = 'No SEO plugin detected. Consider installing Yoast SEO or Rank Math.';

        return $result;
    }
}

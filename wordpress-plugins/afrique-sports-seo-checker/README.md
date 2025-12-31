# Afrique Sports SEO Checker

Custom WordPress plugin for Afrique Sports that ensures all articles meet Google News and SEO best practices for 2025.

## Features

### Comprehensive SEO Validation

- **Title Validation** - Ensures titles are 45-60 characters for optimal Google search results
- **Featured Image Validation** - Checks image dimensions (1200x628px minimum), file size (<200KB), and alt text (<125 characters)
- **Content Quality** - Validates word count (400-2000 words) and heading structure (minimum 2 H2/H3 tags)
- **Meta Description** - Ensures meta descriptions are 140-160 characters
- **Internal Links** - Validates 2-5 internal links per article
- **Categories & Tags** - Ensures proper categorization (1-3 categories, 3-8 tags)
- **Permalink Length** - Checks permalink is under 75 characters
- **SEO Plugin Integration** - Works with Yoast SEO, Rank Math, and All in One SEO

### Key Benefits

✅ **No Pro Version Required** - All features included, no paid upgrades needed
✅ **Blocks Publishing** - Prevents publishing until all required SEO items pass
✅ **Real-time Validation** - Auto-checks as you edit
✅ **Customizable Settings** - Adjust all requirements to your needs
✅ **Visual Feedback** - Clear pass/fail indicators with helpful messages
✅ **Score Display** - Shows overall SEO score percentage

## Installation

### Method 1: Manual Upload

1. Download or copy the `afrique-sports-seo-checker` folder
2. Upload to `/wp-content/plugins/` directory on your WordPress server
3. Go to WordPress Admin → Plugins
4. Find "Afrique Sports SEO Checker" and click "Activate"

### Method 2: SSH/FTP Upload

```bash
# Navigate to WordPress plugins directory
cd /var/www/html/wp-content/plugins/

# Create plugin directory
mkdir afrique-sports-seo-checker

# Upload all files to this directory
# Then activate via WordPress admin panel
```

## Usage

### For Authors/Editors

1. **Create or Edit a Post**
   - Look for the "SEO Checklist - Afrique Sports" meta box in the sidebar

2. **Run Validation**
   - Click the "Run Check" button
   - The plugin will automatically check your post against all SEO requirements

3. **Review Results**
   - ✅ Green items = Passed
   - ❌ Red items = Failed (must fix if required)
   - ⚠️ Yellow items = Warnings

4. **Fix Issues**
   - Read the helpful messages for each failed item
   - Make necessary changes to your post
   - Run check again

5. **Publish**
   - Once all required items pass, you can publish
   - If required items fail, the post will be saved as draft

### For Administrators

1. **Configure Settings**
   - Go to WordPress Admin → Settings → SEO Checker
   - Customize all validation requirements
   - Enable/disable specific checks
   - Set minimum/maximum values

2. **Choose Post Types**
   - Select which post types to validate (Posts, Pages, Custom Post Types)

3. **Publishing Behavior**
   - Enable "Block Publishing on Failure" to enforce requirements
   - Or disable to show warnings only

## Configuration

### Default Settings

| Setting | Default Value | Google News 2025 Standard |
|---------|--------------|---------------------------|
| Title Length | 45-60 characters | 50-60 characters |
| Featured Image | 1200x628px, <200KB | 1200x628px minimum |
| Word Count | 400-2000 words | 400+ words for news |
| Meta Description | 140-160 characters | 150-160 characters |
| Internal Links | 2-5 links | 2-5 recommended |
| Alt Text | <125 characters | <125 characters |
| Categories | 1-3 | 1-2 primary |
| Tags | 3-8 | 5-8 recommended |
| Permalink | <75 characters | <75 characters |
| Headings | 2+ H2/H3 tags | 2+ for structure |

### Customization

All settings can be adjusted in **Settings → SEO Checker**:

- Increase/decrease minimum word count
- Change image dimension requirements
- Adjust title length limits
- Enable/disable specific validations
- Choose which post types to check

## SEO Best Practices 2025

### Why These Requirements?

1. **Title 45-60 characters** - Optimal display in Google search results without truncation
2. **Image 1200x628px** - Perfect for social sharing (Facebook, Twitter, LinkedIn) and Google News
3. **Image <200KB** - Fast loading for Core Web Vitals (LCP metric)
4. **Meta Description 140-160 chars** - Full display in SERPs
5. **400+ words** - Google News prefers comprehensive articles
6. **2-5 Internal Links** - Improves site architecture and user engagement
7. **Alt Text <125 chars** - Accessibility and image SEO
8. **Proper Categorization** - Better content organization and topical authority

### Google News Requirements

This plugin ensures compliance with Google News Publisher guidelines:

- ✅ High-quality featured images
- ✅ Descriptive titles and meta descriptions
- ✅ Substantial content (400+ words)
- ✅ Proper article structure with headings
- ✅ Internal linking for context
- ✅ SEO plugin integration for schema markup

## File Structure

```
afrique-sports-seo-checker/
├── afrique-sports-seo-checker.php  # Main plugin file
├── README.md                        # This file
├── includes/
│   ├── class-validators.php        # Validation logic
│   ├── class-meta-box.php          # Meta box display
│   └── class-admin-settings.php    # Settings page
└── assets/
    ├── css/
    │   └── admin.css               # Styling
    └── js/
        └── admin.js                # AJAX validation
```

## Technical Details

### WordPress Hooks Used

- `add_meta_boxes` - Registers SEO checklist meta box
- `wp_insert_post` - Validates and stores results when post is saved
- `wp_insert_post_data` - Blocks publishing if validation fails
- `admin_enqueue_scripts` - Loads CSS/JS assets
- `admin_menu` - Adds settings page

### AJAX Endpoints

- `afrique_seo_validate` - Real-time validation endpoint

### Post Meta Keys

- `_afrique_seo_validation` - Stores validation results
- `_afrique_seo_last_check` - Stores last check timestamp

### Settings Key

- `afrique_seo_settings` - Stores all plugin settings

## SEO Plugin Integration

The plugin automatically detects and integrates with:

- **Yoast SEO** - Reads `_yoast_wpseo_metadesc` meta field
- **Rank Math** - Reads `rank_math_description` meta field
- **All in One SEO** - Reads `_aioseo_description` meta field

If none are installed, the plugin will show a warning to install one.

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- One of: Yoast SEO, Rank Math, or All in One SEO (recommended)

## Troubleshooting

### Validation Not Running

1. Clear browser cache
2. Check JavaScript console for errors
3. Ensure jQuery is loaded
4. Verify AJAX URL is correct

### Images Failing Validation

1. Check image dimensions in Media Library
2. Optimize images before uploading (use TinyPNG, ImageOptim, etc.)
3. Verify alt text is filled in Media Library
4. Ensure featured image is set

### Publishing Still Blocked

1. Run validation check again
2. Ensure all **required** items pass (marked with "Required" badge)
3. Check settings page to see which items are marked as required
4. Save post as draft and review all validation messages

## Support

For issues or questions:

1. Check this README first
2. Review WordPress debug logs
3. Contact Afrique Sports technical team

## License

GPL v2 or later

## Credits

Developed for Afrique Sports (https://www.afriquesports.net/)
Built with WordPress best practices and Google News 2025 standards

---

**Version:** 1.0.0
**Author:** Afrique Sports
**Last Updated:** December 2025

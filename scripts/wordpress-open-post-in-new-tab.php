<?php
/**
 * Plugin Name: Open Published Post in New Tab
 * Description: Automatically opens published posts in a new tab when you click Publish/Update in WordPress admin
 * Version: 1.0
 * Author: Afrique Sports
 *
 * This script adds a hook to WordPress that automatically opens
 * a published post in a new browser tab when you click "Publish"
 * in the WordPress admin editor.
 *
 * Installation:
 * 1. Upload to WordPress: wp-content/mu-plugins/open-post-in-new-tab.php
 *    (mu-plugins folder - must-use plugins, auto-activated)
 *
 * 2. OR add to your theme's functions.php
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Show admin notice to confirm plugin is active
 */
function afriquesports_post_tab_admin_notice() {
    global $pagenow, $typenow;

    if (($pagenow === 'post.php' || $pagenow === 'post-new.php') && $typenow === 'post') {
        echo '<div class="notice notice-info is-dismissible" style="background: #d4edda; border-left-color: #28a745;">';
        echo '<p><strong>✓ Open Post in New Tab:</strong> Active - Will open post in new tab when you click Publish/Update</p>';
        echo '</div>';
    }
}
add_action('admin_notices', 'afriquesports_post_tab_admin_notice');

/**
 * Add JavaScript to post editor to open post in new tab on publish
 */
function afriquesports_open_post_in_new_tab() {
    global $pagenow, $typenow;

    // Only run on post edit screen
    if (($pagenow === 'post.php' || $pagenow === 'post-new.php') && $typenow === 'post') {
        ?>
        <script type="text/javascript">
        (function() {
            console.log('[Afrique Sports] Open post in new tab hook loaded');

            // Wait for jQuery to be ready
            if (typeof jQuery === 'undefined') {
                console.error('[Afrique Sports] jQuery not loaded');
                return;
            }

            jQuery(document).ready(function($) {
                console.log('[Afrique Sports] jQuery ready, setting up hook');

                // Store the original post status
                var originalStatus = $('#original_post_status').val();
                console.log('[Afrique Sports] Original status:', originalStatus);

                // Listen for publish/update button click
                $('#publish').on('click', function(e) {
                    console.log('[Afrique Sports] Publish button clicked');

                    var currentStatus = $('#post_status').val();
                    var postId = $('#post_ID').val();

                    console.log('[Afrique Sports] Current status:', currentStatus, 'Post ID:', postId);

                    // Open in new tab when publishing or updating
                    if (currentStatus === 'publish') {
                        // Get the post permalink
                        var permalink = $('#sample-permalink a').attr('href');

                        if (!permalink) {
                            // Fallback: construct permalink from home URL and post ID
                            permalink = '<?php echo home_url(); ?>/?p=' + postId;
                        }

                        console.log('[Afrique Sports] Will open permalink:', permalink);

                        // Open in new tab after a short delay to allow save
                        setTimeout(function() {
                            console.log('[Afrique Sports] Opening new tab now');
                            window.open(permalink, '_blank');
                        }, 2000);
                    } else {
                        console.log('[Afrique Sports] Not published, skipping');
                    }
                });

                // Also handle Gutenberg editor (Block Editor)
                if (wp.data && wp.data.subscribe) {
                    console.log('[Afrique Sports] Gutenberg editor detected, setting up hook');
                    var wasPublishing = false;

                    wp.data.subscribe(function() {
                        var isPublishing = wp.data.select('core/editor').isSavingPost();
                        var isPublished = wp.data.select('core/editor').isCurrentPostPublished();
                        var postStatus = wp.data.select('core/editor').getEditedPostAttribute('status');
                        var postId = wp.data.select('core/editor').getCurrentPostId();
                        var permalink = wp.data.select('core/editor').getPermalink();

                        // Detect transition from saving to saved (for published posts)
                        if (wasPublishing && !isPublishing && isPublished && postStatus === 'publish') {
                            console.log('[Afrique Sports] Gutenberg: Post saved, opening in new tab');
                            // Post was just saved/updated, open in new tab
                            if (permalink) {
                                window.open(permalink, '_blank');
                            } else {
                                window.open('<?php echo home_url(); ?>/?p=' + postId, '_blank');
                            }
                        }

                        wasPublishing = isPublishing;
                    });
                }
            });
        })();
        </script>
        <?php
    }
}
add_action('admin_footer', 'afriquesports_open_post_in_new_tab');

/**
 * Alternative approach: Add a "View Post" button that opens in new tab
 * This adds a custom button next to the Publish button
 */
function afriquesports_add_view_in_new_tab_button() {
    global $pagenow, $typenow;

    if (($pagenow === 'post.php' || $pagenow === 'post-new.php') && $typenow === 'post') {
        ?>
        <script type="text/javascript">
        jQuery(document).ready(function($) {
            // Add custom button for Classic Editor
            if ($('#post-status-info').length) {
                var postId = $('#post_ID').val();
                var permalink = $('#sample-permalink a').attr('href');

                if (permalink) {
                    var viewButton = '<a href="' + permalink + '" target="_blank" class="button button-large" style="margin-left: 10px;">View in New Tab</a>';
                    $('#publishing-action').prepend(viewButton);
                }
            }

            // For Gutenberg, use the PluginPostPublishPanel API
            if (wp.editPost && wp.element && wp.components) {
                var registerPlugin = wp.plugins.registerPlugin;
                var PluginPostPublishPanel = wp.editPost.PluginPostPublishPanel;
                var createElement = wp.element.createElement;
                var Button = wp.components.Button;

                var ViewInNewTabButton = function() {
                    var permalink = wp.data.select('core/editor').getPermalink();

                    return createElement(
                        PluginPostPublishPanel,
                        {
                            className: 'view-in-new-tab-panel',
                            title: 'View Post'
                        },
                        createElement(
                            Button,
                            {
                                isPrimary: true,
                                href: permalink,
                                target: '_blank'
                            },
                            'Open in New Tab'
                        )
                    );
                };

                registerPlugin('afriquesports-view-in-new-tab', {
                    render: ViewInNewTabButton
                });
            }
        });
        </script>
        <?php
    }
}
// Uncomment to use the alternative button approach:
// add_action('admin_footer', 'afriquesports_add_view_in_new_tab_button');

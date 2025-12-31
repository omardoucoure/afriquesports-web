/**
 * Afrique Sports SEO Checker - Admin JavaScript
 *
 * @package Afrique_Sports_SEO_Checker
 */

(function($) {
    'use strict';

    /**
     * SEO Checker object
     */
    const AfriqueSEO = {
        /**
         * Initialize
         */
        init: function() {
            this.bindEvents();
            this.autoCheckOnLoad();
        },

        /**
         * Bind event handlers
         */
        bindEvents: function() {
            // Run check button
            $(document).on('click', '.afrique-seo-run-check', this.runCheck.bind(this));

            // Auto-check on title change
            $('#title').on('blur', this.scheduleAutoCheck.bind(this));

            // Auto-check on content change
            if (typeof wp !== 'undefined' && wp.data) {
                // Gutenberg editor
                wp.data.subscribe(() => {
                    this.scheduleAutoCheck();
                });
            } else {
                // Classic editor
                if (typeof tinymce !== 'undefined') {
                    tinymce.on('AddEditor', function(e) {
                        e.editor.on('change', () => {
                            this.scheduleAutoCheck();
                        });
                    }.bind(this));
                }
            }

            // Auto-check when featured image changes
            $(document).on('click', '#set-post-thumbnail', this.scheduleAutoCheck.bind(this));
            $(document).on('click', '#remove-post-thumbnail', this.scheduleAutoCheck.bind(this));

            // Prevent publish if validation failed
            $('#publish, #save-post').on('click', this.preventPublish.bind(this));
        },

        /**
         * Auto-check timer
         */
        autoCheckTimer: null,

        /**
         * Schedule auto-check (debounced)
         */
        scheduleAutoCheck: function() {
            clearTimeout(this.autoCheckTimer);
            this.autoCheckTimer = setTimeout(() => {
                this.runCheck(null, true);
            }, 2000);
        },

        /**
         * Auto-check on page load if post exists
         */
        autoCheckOnLoad: function() {
            const postId = this.getPostId();
            if (postId && postId > 0) {
                setTimeout(() => {
                    this.runCheck(null, true);
                }, 1000);
            }
        },

        /**
         * Get current post ID
         */
        getPostId: function() {
            return $('#post_ID').val() || 0;
        },

        /**
         * Run validation check
         */
        runCheck: function(event, silent = false) {
            if (event) {
                event.preventDefault();
            }

            const $button = $('.afrique-seo-run-check');
            const $results = $('.afrique-seo-results');
            const $summary = $('.afrique-seo-summary');
            const postId = this.getPostId();

            if (!postId) {
                this.showError('Please save the post first.');
                return;
            }

            // Show loading state
            if (!silent) {
                $button.prop('disabled', true).addClass('loading');
                $results.html('<div class="afrique-seo-loading"></div>');
            }

            // Get current post data
            const postData = this.getCurrentPostData();

            // Run AJAX request
            $.ajax({
                url: afriqueSEO.ajaxurl,
                type: 'POST',
                data: {
                    action: 'afrique_seo_validate',
                    nonce: afriqueSEO.nonce,
                    post_id: postId,
                    post_data: postData
                },
                success: (response) => {
                    if (response.success) {
                        this.displayResults(response.data);

                        // Update last check time
                        const now = new Date();
                        $('.afrique-seo-last-check').html(
                            afriqueSEO.strings.checked + ' ' + now.toLocaleTimeString()
                        );
                    } else {
                        this.showError(response.data.message || 'Validation failed.');
                    }
                },
                error: (xhr, status, error) => {
                    this.showError('Error: ' + error);
                },
                complete: () => {
                    $button.prop('disabled', false).removeClass('loading');
                }
            });
        },

        /**
         * Get current post data from editor
         */
        getCurrentPostData: function() {
            let content = '';

            // Get content from Gutenberg
            if (typeof wp !== 'undefined' && wp.data && wp.data.select('core/editor')) {
                const editor = wp.data.select('core/editor');
                content = editor.getEditedPostContent();
            }
            // Get content from Classic Editor
            else if (typeof tinymce !== 'undefined' && tinymce.get('content')) {
                content = tinymce.get('content').getContent();
            }
            // Fallback to textarea
            else {
                content = $('#content').val();
            }

            return {
                title: $('#title').val(),
                content: content,
                excerpt: $('#excerpt').val(),
                featured_image: $('#set-post-thumbnail img').attr('src') || ''
            };
        },

        /**
         * Display validation results
         */
        displayResults: function(data) {
            const $results = $('.afrique-seo-results');
            const $summary = $('.afrique-seo-summary');

            if (data.html) {
                $results.html(data.html.results);
                $summary.html(data.html.summary).show();

                // Update score circle
                if (data.summary && data.summary.score) {
                    this.updateScoreCircle(data.summary.score);
                }
            }
        },

        /**
         * Update score circle visualization
         */
        updateScoreCircle: function(score) {
            const $circle = $('.afrique-seo-score-circle');
            $circle.attr('data-score', score);

            // Animate the circle (if CSS animations are supported)
            const percent = score / 100;
            const color = score >= 70 ? '#46b450' : (score >= 50 ? '#ffb900' : '#dc3232');

            $circle.css({
                'background': `conic-gradient(${color} 0% ${score}%, #e5e5e5 ${score}% 100%)`
            });
        },

        /**
         * Show error message
         */
        showError: function(message) {
            const $results = $('.afrique-seo-results');
            $results.html(
                '<div class="notice notice-error inline"><p>' + message + '</p></div>'
            );
        },

        /**
         * Prevent publishing if validation failed
         */
        preventPublish: function(event) {
            const $summary = $('.afrique-seo-summary');
            const $blockNotice = $summary.find('.afrique-seo-block-notice');

            if ($blockNotice.length > 0) {
                const confirmed = confirm(
                    'Warning: Your post has failed SEO validation.\n\n' +
                    'Required items must pass before publishing.\n\n' +
                    'Do you want to review the SEO checklist?'
                );

                if (confirmed) {
                    event.preventDefault();
                    event.stopImmediatePropagation();

                    // Scroll to SEO checklist meta box
                    $('html, body').animate({
                        scrollTop: $('#afrique-seo-checklist').offset().top - 100
                    }, 500);

                    // Highlight the meta box
                    $('#afrique-seo-checklist').addClass('highlight-meta-box');
                    setTimeout(() => {
                        $('#afrique-seo-checklist').removeClass('highlight-meta-box');
                    }, 2000);

                    return false;
                }
            }
        },

        /**
         * Get validation status
         */
        getValidationStatus: function() {
            const results = this.getCurrentResults();

            if (!results || results.length === 0) {
                return {
                    validated: false,
                    passed: false,
                    requiredFailed: 0
                };
            }

            let requiredFailed = 0;
            results.forEach((result) => {
                if (result.status === 'error' && result.required) {
                    requiredFailed++;
                }
            });

            return {
                validated: true,
                passed: requiredFailed === 0,
                requiredFailed: requiredFailed
            };
        },

        /**
         * Get current results from DOM
         */
        getCurrentResults: function() {
            const results = [];
            $('.afrique-seo-checklist-items li').each(function() {
                const $item = $(this);
                let status = 'info';

                if ($item.hasClass('afrique-seo-success')) status = 'success';
                else if ($item.hasClass('afrique-seo-error')) status = 'error';
                else if ($item.hasClass('afrique-seo-warning')) status = 'warning';

                results.push({
                    status: status,
                    required: $item.find('.required-badge').length > 0
                });
            });
            return results;
        }
    };

    /**
     * Initialize on document ready
     */
    $(document).ready(function() {
        AfriqueSEO.init();
    });

    /**
     * Expose to global scope for external access
     */
    window.AfriqueSEO = AfriqueSEO;

})(jQuery);

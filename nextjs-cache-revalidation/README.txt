=== Next.js Cache Revalidation for Afrique Sports ===
Contributors: Afrique Sports
Tags: nextjs, cache, revalidation, performance
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Automatically revalidates Next.js cache when WordPress posts are published, updated, or deleted.

== Description ==

This plugin ensures that your Next.js frontend (afriquesports.net) stays in sync with WordPress content by automatically triggering cache revalidation when posts are published, updated, or deleted.

Features:
* Automatic cache revalidation on post publish/update/delete
* Admin settings page for easy configuration
* Activity logging to track revalidation history
* Test connection button to verify setup
* Non-blocking requests to avoid slowing down WordPress

== Installation ==

1. Upload the `nextjs-cache-revalidation` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings → Next.js Revalidation
4. Enter your revalidation URL and secret key
5. Click "Test Connection" to verify the setup

== Configuration ==

1. Revalidation URL: https://www.afriquesports.net/api/revalidate
2. Revalidation Secret: Get this from Vercel → Project Settings → Environment Variables → REVALIDATE_SECRET

== Frequently Asked Questions ==

= Where do I get the revalidation secret? =

The secret is stored in your Vercel project's environment variables. Go to Vercel Dashboard → Your Project → Settings → Environment Variables and look for REVALIDATE_SECRET.

= How do I know if it's working? =

1. Go to Settings → Next.js Revalidation
2. Click the "Test Connection" button
3. Check the "Recent Activity" table after publishing a post

= Will this slow down my WordPress site? =

No. The revalidation requests are non-blocking, meaning WordPress doesn't wait for a response before continuing.

== Changelog ==

= 1.0.0 =
* Initial release
* Automatic cache revalidation on post save/delete
* Admin settings page
* Activity logging
* Connection test feature

<?php
/**
 * Runs only when an administrator deletes the plugin from the Plugins screen.
 *
 * Content is intentionally kept (blogs, courses, locations, FAQs, testimonials, tools and pages
 * are WordPress content). Only the plugin's own data is removed: its log options, pending jobs and
 * the table of published Main Website versions. The Main Website stops showing WordPress-rendered
 * pages once the plugin is gone (its signed manifest is no longer available).
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

global $wpdb;

foreach ( array( 'acv_cms_sync_log', 'acv_cms_publish_log', 'acv_cms_moved_paths', 'acv_cms_db_version' ) as $option ) {
	delete_option( $option );
}
foreach ( array( 'acv_cms_sync_blog', 'acv_cms_render_page', 'acv_cms_rerender_all', 'acv_cms_notify_main', 'acv_cms_daily_refresh' ) as $hook ) {
	wp_unschedule_hook( $hook );
}
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}acv_render_versions" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

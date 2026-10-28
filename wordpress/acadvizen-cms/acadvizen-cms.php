<?php
/**
 * Plugin Name:       Acadvizen Master Admin
 * Description:       One WordPress admin for both Acadvizen websites. Design with Elementor, choose "Publish To" (Enrollment, Main or Both) and publish. Pages for www.acadvizen.com are rendered by WordPress/Elementor and published through the Acadvizen Render Bridge.
 * Version:           0.7.11
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            Acadvizen
 * Text Domain:       acadvizen-cms
 *
 * Configuration (wp-config.php, never in the database or admin screens):
 *   define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
 *   define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '<long random secret shared with the Main Website>' );
 *   // Optional: internal address WordPress uses to render its own pages.
 *   // define( 'ACADVIZEN_CMS_LOOPBACK_URL', 'http://127.0.0.1' );
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const VERSION        = '0.7.11';
const POST_TYPE      = 'acv_blog';
const REST_NAMESPACE = 'acadvizen-cms/v1';
const MENU_SLUG      = 'acadvizen-cms';

foreach ( array( 'config', 'post-type', 'targets', 'blocks', 'fields', 'main-site', 'sync', 'versions', 'render-bridge', 'publisher', 'elementor', 'content-types', 'design', 'migration', 'media-guard', 'rest', 'main-content', 'blog-sync', 'registry', 'approval', 'admin', 'admin-site' ) as $module ) {
	require_once __DIR__ . '/includes/' . $module . '.php';
}

// Render Bridge requests are identified while plugins load, before page caches decide anything.
apply_signed_client_ip();
bootstrap_bridge_request();

/* Content model ------------------------------------------------------------------------------ */
add_action( 'init', __NAMESPACE__ . '\\register_post_type_and_meta' );
add_action( 'init', __NAMESPACE__ . '\\register_content_types' );
add_action( 'init', __NAMESPACE__ . '\\register_shortcodes' );
add_action( 'init', __NAMESPACE__ . '\register_design_shortcodes' );
add_action( 'init', __NAMESPACE__ . '\\enable_elementor_for_content_types', 20 );
add_action( 'init', __NAMESPACE__ . '\\maybe_install_versions_table' );
add_action( 'init', __NAMESPACE__ . '\\register_main_snapshot_type' );
// Public addresses of tools and Main blogs: if their rewrite rules are missing (first activation,
// an update, or rules rebuilt by another plugin), rebuild the rules once.
add_action(
	'init',
	static function () {
		$rules = get_option( 'rewrite_rules' );
		if ( is_array( $rules ) && ! rewrite_rules_cover( array_keys( $rules ), array( 'main-blog/', 'tool/' ) ) ) {
			flush_rewrite_rules( false );
		}
	},
	99
);
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_rest_routes' );

/* One blog on both websites, edited in either editor (blog-sync.php) ---------------------------- */
add_action( 'init', __NAMESPACE__ . '\\register_blog_sync_meta' );
add_action( 'save_post_post', __NAMESPACE__ . '\\save_blog_sync_box', 5, 1 );
add_action( 'wp_after_insert_post', __NAMESPACE__ . '\\after_regular_post_saved', 30, 2 );
add_filter( 'cron_schedules', __NAMESPACE__ . '\\add_five_minute_schedule' );
add_action( BLOG_PULL_HOOK, __NAMESPACE__ . '\\pull_main_blog_changes' );

/* Approval before publishing (approval.php; on with ACADVIZEN_CMS_APPROVAL) ----------------------- */
add_action( 'load-post.php', __NAMESPACE__ . '\\redirect_live_to_working_copy', 1 );
add_action( 'elementor/document/before_save', __NAMESPACE__ . '\\guard_elementor_save', 1, 2 );
add_action( 'elementor/editor/after_enqueue_scripts', __NAMESPACE__ . '\\enqueue_working_copy_badge' );
add_action( 'rest_api_init', __NAMESPACE__ . '\\register_working_copy_route' );
add_filter( 'wp_insert_post_data', __NAMESPACE__ . '\\guard_post_data', 20, 2 );
foreach ( array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES ) as $acv_scope_type ) {
	add_filter( "rest_pre_insert_{$acv_scope_type}", __NAMESPACE__ . '\\guard_rest_insert', 10, 2 );
}
add_filter( 'pre_trash_post', __NAMESPACE__ . '\\guard_trash', 10, 2 );
add_filter( 'pre_delete_post', __NAMESPACE__ . '\\guard_trash', 10, 2 );
// Media that published content still shows is not deleted (includes/media-guard.php).
add_filter( 'pre_delete_attachment', __NAMESPACE__ . '\\guard_media_delete', 10, 2 );
add_action( 'wp_after_insert_post', __NAMESPACE__ . '\\after_candidate_saved', 40, 2 );
add_action( 'elementor/document/after_save', __NAMESPACE__ . '\\after_candidate_design_saved', 30, 2 );
add_action( VERIFY_HOOK, __NAMESPACE__ . '\\verify_publication', 10, 3 );
add_action( SCHEDULE_HOOK, __NAMESPACE__ . '\\publish_scheduled' );
// Menus shown on the Main website: reviewer-only under approval (Menus screen, REST, Customizer).
add_action( 'load-nav-menus.php', __NAMESPACE__ . '\\guard_main_menu_screen', 1 );
add_filter( 'rest_pre_dispatch', __NAMESPACE__ . '\\guard_main_menu_rest', 10, 3 );
add_filter( 'customize_loaded_components', __NAMESPACE__ . '\\limit_customizer_menus' );
add_action( 'wp_footer', __NAMESPACE__ . '\\print_revision_mark', 999 );
add_filter( 'elementor/frontend/builder_content_data', __NAMESPACE__ . '\\note_rendered_document', 10, 2 );

/* Render Bridge (front end of this WordPress) ------------------------------------------------- */
add_action( 'template_redirect', __NAMESPACE__ . '\\handle_template_redirect', 0 );
add_action( 'pre_get_posts', __NAMESPACE__ . '\\exclude_main_only_from_queries' );
add_action( 'pre_get_posts', __NAMESPACE__ . '\\include_unpublished_in_preview' );
add_filter( 'redirect_canonical', __NAMESPACE__ . '\\block_canonical_redirect_to_main_only' );
add_filter( 'wp_sitemaps_posts_query_args', __NAMESPACE__ . '\\exclude_main_only_from_core_sitemap' );
add_filter( 'rank_math/sitemap/entry', __NAMESPACE__ . '\\exclude_main_only_from_rank_math_sitemap', 10, 3 );
// "Hide from search engines" in Master Admin wins over the page's Rank Math settings, everywhere.
add_filter( 'rank_math/frontend/robots', __NAMESPACE__ . '\\robots_follow_master_admin_noindex', 20 );
add_filter( 'wp_robots', __NAMESPACE__ . '\\core_robots_follow_master_admin_noindex', 20 );
add_filter( 'rank_math/sitemap/entry', __NAMESPACE__ . '\\exclude_hidden_from_rank_math_sitemap', 10, 3 );
add_filter( 'wp_sitemaps_posts_query_args', __NAMESPACE__ . '\\exclude_hidden_from_core_sitemap' );
// Header/footer choice per website, sitemap clean-up and login branding: off unless wp-config.php
// turns them on (config.php, OPTIONAL_FEATURES).
register_optional_features();

/* Designs for Main Website content (design.php) --------------------------------------------- */
add_filter( 'the_content', __NAMESPACE__ . '\render_design_template_content', 99 );
add_filter( 'template_include', __NAMESPACE__ . '\full_width_template_for_designed_records', 99 );
add_filter( 'elementor/widget/render_content', __NAMESPACE__ . '\run_acv_shortcodes_in_widget', 10, 1 );
add_filter( 'elementor/element/is_dynamic_content', __NAMESPACE__ . '\mark_record_fields_dynamic', 10, 2 );
add_action( 'wp_head', __NAMESPACE__ . '\print_main_css', 100 );
add_action( 'wp_head', __NAMESPACE__ . '\print_imported_json_ld', 101 );
add_filter( 'rank_math/json_ld', __NAMESPACE__ . '\main_json_ld_replaces_rank_math', 999 );
add_filter( 'pre_get_document_title', __NAMESPACE__ . '\main_title_pattern', 99 );
add_filter( 'rank_math/frontend/title', __NAMESPACE__ . '\main_title_pattern', 99 );
add_filter( 'rank_math/frontend/advanced_robots', __NAMESPACE__ . '\main_robots_pattern', 99 );
add_filter( 'rank_math/sitemap/exclude_post_type', __NAMESPACE__ . '\exclude_main_only_types_from_rank_math', 10, 2 );
add_filter( 'wp_sitemaps_post_types', __NAMESPACE__ . '\exclude_main_only_types_from_core_sitemap' );

/* Elementor ---------------------------------------------------------------------------------- */
add_action( 'elementor/documents/register_controls', __NAMESPACE__ . '\\register_elementor_controls' );
add_action( 'elementor/document/after_save', __NAMESPACE__ . '\\after_elementor_document_saved', 10, 2 );
add_action( 'elementor/editor/after_enqueue_scripts', __NAMESPACE__ . '\\enqueue_editor_helpers' );

/* Publishing --------------------------------------------------------------------------------- */
add_action( 'save_post', __NAMESPACE__ . '\\save_site_publish_box', 5, 2 );
add_action( 'save_post', __NAMESPACE__ . '\\save_content_fields', 10, 2 );
add_action( 'save_post_' . POST_TYPE, __NAMESPACE__ . '\\save_meta_boxes', 10, 2 );
add_action( 'wp_after_insert_post', __NAMESPACE__ . '\\after_blog_saved', 20, 2 );
add_action( 'wp_after_insert_post', __NAMESPACE__ . '\\after_site_doc_saved', 20, 2 );
add_action( 'wp_after_insert_post', __NAMESPACE__ . '\\after_record_saved', 20, 2 );
add_action( 'before_delete_post', __NAMESPACE__ . '\\before_blog_deleted', 10, 2 );
add_action( 'before_delete_post', __NAMESPACE__ . '\\before_site_doc_deleted', 10, 2 );
foreach ( array( 'wp_update_nav_menu' => 'menu', 'wp_update_nav_menu_item' => 'menu', 'wp_delete_nav_menu' => 'menu', 'customize_save_after' => 'global', 'switch_theme' => 'global', 'upgrader_process_complete' => 'global', 'elementor/core/files/clear_cache' => 'global' ) as $hook => $reason ) {
	add_action( $hook, static fn() => queue_site_rerender( $reason ) );
}
// Elementor Site Settings (global colours, fonts, layout) live on the active kit. Some editor paths
// (the global colour / typography REST API) save them without a document-save event.
foreach ( array( 'added_post_meta', 'updated_post_meta' ) as $meta_hook ) {
	add_action( $meta_hook, __NAMESPACE__ . '\\maybe_rerender_for_kit_change', 10, 3 );
}
// Elementor Pro's display-conditions cache follows templates published, unpublished or re-conditioned
// through Approvals (Pro itself rebuilds it only from its own conditions dialog).
add_action( 'transition_post_status', __NAMESPACE__ . '\\note_template_status_change', 10, 3 );
foreach ( array( 'added_post_meta', 'updated_post_meta', 'deleted_post_meta' ) as $meta_hook ) {
	add_action( $meta_hook, __NAMESPACE__ . '\\note_conditions_meta_change', 10, 3 );
}
add_action( SYNC_HOOK, __NAMESPACE__ . '\\run_sync_job', 10, 4 );
add_action( RENDER_HOOK, __NAMESPACE__ . '\\run_render_job', 10, 4 );
add_action( RERENDER_ALL_HOOK, __NAMESPACE__ . '\\run_site_rerender', 10, 1 );
add_action( NOTIFY_HOOK, __NAMESPACE__ . '\\run_notify_job', 10, 4 );
// WP-Cron's runner must re-read its job list before it writes it back (see forget_cached_cron_list):
// after each of our jobs, and - whatever job ran before - whenever it removes or re-times a job.
foreach ( array( RENDER_HOOK, RERENDER_ALL_HOOK, NOTIFY_HOOK ) as $acv_cron_hook ) {
	add_action( $acv_cron_hook, __NAMESPACE__ . '\\forget_cached_cron_list', PHP_INT_MAX );
}
foreach ( array( 'pre_unschedule_event', 'pre_reschedule_event' ) as $acv_cron_filter ) {
	add_filter( $acv_cron_filter, __NAMESPACE__ . '\\fresh_cron_list_in_cron_run', 0 );
}
add_action( DAILY_REFRESH_HOOK, __NAMESPACE__ . '\\run_daily_refresh' );
add_action( STALL_CHECK_HOOK, __NAMESPACE__ . '\\requeue_stalled_renders' );
add_action( STALL_CHECK_HOOK, __NAMESPACE__ . '\\ensure_scheduled_jobs' );
add_action( STALL_CHECK_HOOK, __NAMESPACE__ . '\\resume_lost_verifications' );

/* Admin -------------------------------------------------------------------------------------- */
// Content types get their own top-level WordPress menus (like Posts), not entries under one custom menu.
add_filter(
	'register_post_type_args',
	static function ( $args, $post_type ) {
		return in_array( $post_type, array( POST_TYPE, 'acv_course', 'acv_location', 'acv_tool', 'acv_faq', 'acv_testimonial' ), true ) ? array_merge( (array) $args, standard_menu_args( $post_type ) ) : $args;
	},
	10,
	2
);
if ( is_admin() ) {
	add_action( 'admin_menu', __NAMESPACE__ . '\\register_admin_menu', 9 );
	// Main Website content (the www.acadvizen.com records themselves): includes/main-content.php.
	add_action(
		'admin_menu',
		static fn() => add_submenu_page( MENU_SLUG, __( 'Main Website content', 'acadvizen-cms' ), __( 'Main Website', 'acadvizen-cms' ), 'edit_posts', MAIN_CONTENT_PAGE, __NAMESPACE__ . '\\render_main_content_page' ),
		10
	);
	add_action( 'admin_init', __NAMESPACE__ . '\\guard_main_screen' );
	add_action( 'admin_post_acv_cms_main_save', __NAMESPACE__ . '\\handle_main_save' );
	add_action( 'admin_post_acv_cms_main_action', __NAMESPACE__ . '\\handle_main_action' );
	add_action( 'wp_ajax_acv_cms_main_section', __NAMESPACE__ . '\\ajax_main_section' );
	add_action( 'admin_post_acv_cms_main_upload', __NAMESPACE__ . '\\handle_main_upload' );
	add_action( 'wp_ajax_acv_cms_main_media', __NAMESPACE__ . '\\ajax_main_media' );
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_main_editor_assets' );
	add_action( 'admin_menu', __NAMESPACE__ . '\\order_admin_menu', 999 );
	add_filter( 'wp_insert_post_data', __NAMESPACE__ . '\\keep_global_styles_canvas_private', 10, 2 );
	add_action( 'load-post.php', __NAMESPACE__ . '\\forget_global_styles_canvas_autosave' );
	add_action( 'admin_init', __NAMESPACE__ . '\\ensure_recurring_jobs' );
	add_action( 'admin_init', __NAMESPACE__ . '\\sync_theme_conditions_once' );
	add_action( 'admin_init', __NAMESPACE__ . '\\ensure_blog_pull_job' );
	add_action( 'add_meta_boxes_post', __NAMESPACE__ . '\\add_blog_sync_box' );
	add_filter( 'manage_post_posts_columns', __NAMESPACE__ . '\\add_blog_sync_column' );
	add_action( 'manage_post_posts_custom_column', __NAMESPACE__ . '\\render_blog_sync_column', 10, 2 );
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_blog_sync_notice' );
	add_action( 'wp_ajax_acv_cms_blog_sync_state', __NAMESPACE__ . '\\ajax_blog_sync_state' );
	add_action( 'admin_post_acv_cms_blog_pull', __NAMESPACE__ . '\\handle_blog_pull_now' );
	add_action( 'admin_post_acv_cms_approval', __NAMESPACE__ . '\\handle_approval_action' );
	add_action( 'admin_init', __NAMESPACE__ . '\\ensure_review_roles' );
	add_action( 'add_meta_boxes', __NAMESPACE__ . '\\add_approval_box' );
	add_action( 'admin_notices', __NAMESPACE__ . '\\render_approval_notice' );
	add_action( 'pre_get_posts', __NAMESPACE__ . '\\hide_archives_from_lists' );
	add_filter( 'display_post_states', __NAMESPACE__ . '\\label_working_copies', 10, 2 );
	add_filter( 'wp_count_posts', __NAMESPACE__ . '\\count_without_identical_copies', 10, 2 );
	add_action(
		'admin_menu',
		static function () {
			if ( approval_enabled() ) {
				add_submenu_page( MENU_SLUG, __( 'Approvals', 'acadvizen-cms' ), __( 'Approvals', 'acadvizen-cms' ), 'edit_pages', APPROVALS_PAGE, __NAMESPACE__ . '\\render_approvals_screen' );
			}
			if ( native_publishing_ui() ) {
				add_submenu_page( MENU_SLUG, __( 'Widget compatibility', 'acadvizen-cms' ), __( 'Widget compatibility', 'acadvizen-cms' ), 'edit_pages', COMPAT_PAGE, __NAMESPACE__ . '\\render_compatibility_page' );
			}
		},
		11
	);
	// Screens that show publishing status also repair a stalled publish (at most once a minute).
	foreach ( array( 'load-edit.php', 'load-post.php', 'load-toplevel_page_' . MENU_SLUG, 'load-acadvizen-master-admin_page_' . MENU_SLUG . '-publishing', 'load-acadvizen-master-admin_page_' . APPROVALS_PAGE ) as $screen_hook ) {
		add_action(
			$screen_hook,
			static function () {
				if ( current_user_can( 'edit_pages' ) ) {
					maybe_requeue_stalled_renders();
				}
			}
		);
	}
	add_action( 'add_meta_boxes_' . POST_TYPE, __NAMESPACE__ . '\\register_meta_boxes' );
	add_action( 'add_meta_boxes', __NAMESPACE__ . '\\register_site_meta_boxes' );
	add_action( 'add_meta_boxes', __NAMESPACE__ . '\\register_content_meta_boxes' );
	add_action( 'admin_notices', __NAMESPACE__ . '\\render_admin_notices' );
	add_action( 'admin_notices', __NAMESPACE__ . '\\render_site_admin_notices' );
	add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\\enqueue_admin_assets' );
	add_filter( 'enter_title_here', __NAMESPACE__ . '\\title_placeholder', 10, 2 );
	add_filter( 'default_hidden_meta_boxes', __NAMESPACE__ . '\\unhide_core_meta_boxes', 10, 2 );
	add_filter( 'post_updated_messages', __NAMESPACE__ . '\\post_updated_messages' );
	add_filter( 'manage_' . POST_TYPE . '_posts_columns', __NAMESPACE__ . '\\list_columns' );
	add_action( 'manage_' . POST_TYPE . '_posts_custom_column', __NAMESPACE__ . '\\render_list_column', 10, 2 );
	add_filter( 'manage_pages_columns', __NAMESPACE__ . '\\site_list_columns' );
	add_action( 'manage_pages_custom_column', __NAMESPACE__ . '\\render_site_list_column', 10, 2 );
	foreach ( array( 'acv_course', 'acv_location' ) as $site_type ) {
		add_filter( "manage_{$site_type}_posts_columns", __NAMESPACE__ . '\\site_list_columns' );
		add_action( "manage_{$site_type}_posts_custom_column", __NAMESPACE__ . '\\render_site_list_column', 10, 2 );
	}
	add_filter( 'page_row_actions', __NAMESPACE__ . '\\site_row_actions', 10, 2 );
	add_filter( 'post_row_actions', __NAMESPACE__ . '\\site_row_actions', 10, 2 );
	add_action( 'wp_ajax_acv_cms_import_step', __NAMESPACE__ . '\handle_import_step' );
	foreach ( array( 'import_upload' => 'handle_import_upload', 'import_undo' => 'handle_import_undo', 'save_design' => 'handle_save_design', 'retry_sync' => 'handle_retry_request', 'retry_render' => 'handle_retry_render', 'rollback' => 'handle_rollback', 'republish_all' => 'handle_republish_all', 'preview_version' => 'handle_preview_version', 'preview_main' => 'handle_preview_main', 'duplicate' => 'handle_duplicate' ) as $action => $handler ) {
		add_action( 'admin_post_acv_cms_' . $action, __NAMESPACE__ . '\\' . $handler );
	}
}

/* Lifecycle ---------------------------------------------------------------------------------- */
// Rewrite rules are rebuilt softly (the saved rules in the database only): .htaccess is never
// written by this plugin.
register_activation_hook(
	__FILE__,
	static function () {
		install_versions_table();
		register_post_type_and_meta();
		register_content_types();
		flush_rewrite_rules( false );
		// Twice-daily refresh (keeps dynamic widgets fresh and WordPress form nonces in published
		// pages valid: a nonce is valid for 12–24 hours) and the hourly stalled-publish check.
		ensure_recurring_jobs();
	}
);
register_deactivation_hook(
	__FILE__,
	static function () {
		wp_clear_scheduled_hook( DAILY_REFRESH_HOOK );
		wp_clear_scheduled_hook( STALL_CHECK_HOOK );
		wp_clear_scheduled_hook( BLOG_PULL_HOOK );
		flush_rewrite_rules( false );
	}
);

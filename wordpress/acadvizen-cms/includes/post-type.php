<?php
/**
 * The acv_blog post type ("Main Blogs").
 *
 * Main Website blog posts. Each post is rendered by WordPress with the blog design (an Elementor
 * template chosen in Master Admin > Settings, or the post's own Elementor design) and published
 * to www.acadvizen.com/blog/<slug> through the Render Bridge. On this (Enrollment) website a
 * Main-only post is never served to visitors (404), and it has no archives, feeds, search
 * results, sitemap entries or core wp/v2 REST exposure. The plugin's acadvizen-cms/v1 namespace
 * still lists posts for the Main Website's own blog pages.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TARGET_MAIN       = 'main';
const TARGET_ENROLLMENT = 'enrollment';
const TARGET_BOTH       = 'both';

const META_TARGET          = '_acv_publish_target';
const META_AUTHOR_NAME     = '_acv_author_name';
const META_CATEGORY        = '_acv_category';
const META_SEO_TITLE       = '_acv_seo_title';
const META_SEO_DESCRIPTION = '_acv_seo_description';
const META_NOINDEX         = '_acv_noindex';

function publish_targets(): array {
	return array( TARGET_MAIN, TARGET_ENROLLMENT, TARGET_BOTH );
}

function register_post_type_and_meta(): void {
	register_post_type(
		POST_TYPE,
		array(
			'labels'              => array(
				'name'                  => __( 'Main Blogs', 'acadvizen-cms' ),
				'singular_name'         => __( 'Main Blog', 'acadvizen-cms' ),
				'menu_name'             => __( 'Main Blogs', 'acadvizen-cms' ),
				'all_items'             => __( 'Main Blogs', 'acadvizen-cms' ),
				'add_new'               => __( 'Add New Blog', 'acadvizen-cms' ),
				'add_new_item'          => __( 'Add New Blog', 'acadvizen-cms' ),
				'edit_item'             => __( 'Edit Blog', 'acadvizen-cms' ),
				'new_item'              => __( 'New Blog', 'acadvizen-cms' ),
				'search_items'          => __( 'Search Blogs', 'acadvizen-cms' ),
				'not_found'             => __( 'No blogs yet.', 'acadvizen-cms' ),
				'not_found_in_trash'    => __( 'No blogs in the Trash.', 'acadvizen-cms' ),
				'featured_image'        => __( 'Cover image', 'acadvizen-cms' ),
				'set_featured_image'    => __( 'Set cover image', 'acadvizen-cms' ),
				'remove_featured_image' => __( 'Remove cover image', 'acadvizen-cms' ),
				'use_featured_image'    => __( 'Use as cover image', 'acadvizen-cms' ),
			),
			// Publicly queryable so WordPress + Elementor can render a post for the Main Website;
			// visitors of this website get a 404 (Main-only guard in render-bridge.php).
			'public'              => false,
			'publicly_queryable'  => true,
			'exclude_from_search' => true,
			'has_archive'         => false,
			'rewrite'             => array( 'slug' => 'main-blog', 'with_front' => false ),
			'query_var'           => true,
			'show_ui'             => true,
			'show_in_menu'        => MENU_SLUG,
			'show_in_nav_menus'   => false,
			'show_in_admin_bar'   => false,
			'show_in_rest'        => false,
			'hierarchical'        => false,
			'can_export'          => true,
			'delete_with_user'    => false,
			'capability_type'     => 'post',
			'map_meta_cap'        => true,
			'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions' ),
		)
	);

	$string_meta = array(
		META_TARGET          => __NAMESPACE__ . '\\sanitize_publish_target',
		META_AUTHOR_NAME     => 'sanitize_text_field',
		META_CATEGORY        => 'sanitize_text_field',
		META_SEO_TITLE       => 'sanitize_text_field',
		META_SEO_DESCRIPTION => 'sanitize_textarea_field',
		META_NOINDEX         => __NAMESPACE__ . '\\sanitize_flag',
	);
	foreach ( $string_meta as $key => $sanitizer ) {
		register_post_meta(
			POST_TYPE,
			$key,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => $sanitizer,
				'auth_callback'     => static fn( $allowed, $meta_key, $post_id ) => current_user_can( 'edit_post', $post_id ),
			)
		);
	}
}

function sanitize_publish_target( $value ): string {
	$value = is_string( $value ) ? $value : '';
	return in_array( $value, publish_targets(), true ) ? $value : TARGET_MAIN;
}

function sanitize_flag( $value ): string {
	return $value ? '1' : '';
}

function get_publish_target( int $post_id ): string {
	$stored = get_post_meta( $post_id, META_TARGET, true );
	return in_array( $stored, publish_targets(), true ) ? $stored : default_target_for( (string) get_post_type( $post_id ) );
}

function targets_main( string $target ): bool {
	return TARGET_MAIN === $target || TARGET_BOTH === $target;
}

/**
 * True when this blog should be shown on the Main Website right now.
 */
function is_visible_on_main( \WP_Post $post ): bool {
	return POST_TYPE === $post->post_type
		&& 'publish' === $post->post_status
		&& '' === $post->post_password
		&& targets_main( get_publish_target( $post->ID ) )
		&& is_main_compatible_slug( $post->post_name );
}

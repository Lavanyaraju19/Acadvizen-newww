<?php
/**
 * Read-only API for the Main Website: /wp-json/acadvizen-cms/v1/blogs[/<slug>]
 *
 * Returns only published blogs whose "Publish To" includes the Main Website, with an explicit
 * whitelist of fields. Nothing here is registered under the existing acadvizen/v1 namespace.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MAX_PER_PAGE = 100;

function register_rest_routes(): void {
	register_rest_route(
		REST_NAMESPACE,
		'/blogs',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\rest_list_blogs',
			'permission_callback' => '__return_true',
			'args'                => array(
				'page'     => array( 'type' => 'integer', 'default' => 1, 'minimum' => 1, 'sanitize_callback' => 'absint' ),
				'per_page' => array( 'type' => 'integer', 'default' => 50, 'minimum' => 1, 'maximum' => MAX_PER_PAGE, 'sanitize_callback' => 'absint' ),
			),
		)
	);

	register_rest_route(
		REST_NAMESPACE,
		'/blogs/(?P<slug>[a-z0-9]+(?:-[a-z0-9]+)*)',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\rest_get_blog',
			'permission_callback' => '__return_true',
		)
	);

	// Render Bridge: signed requests from the Main Website only. Main-only pages must not be
	// readable by anyone else through this (Enrollment) website.
	register_rest_route(
		REST_NAMESPACE,
		'/manifest',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\rest_manifest',
			'permission_callback' => static fn( \WP_REST_Request $request ) => is_signed_main_request( $request, 'manifest.' ),
		)
	);
	register_rest_route(
		REST_NAMESPACE,
		'/render',
		array(
			'methods'             => \WP_REST_Server::READABLE,
			'callback'            => __NAMESPACE__ . '\\rest_render',
			'permission_callback' => static fn( \WP_REST_Request $request ) => is_signed_main_request( $request, 'render.' . (string) $request->get_param( 'path' ) ),
			'args'                => array(
				'path' => array( 'type' => 'string', 'required' => true ),
			),
		)
	);
}

function is_signed_main_request( \WP_REST_Request $request, string $message ): bool {
	return verify_signature( $message, $request->get_header( 'x_acadvizen_timestamp' ), $request->get_header( 'x_acadvizen_signature' ) );
}

/**
 * Every WordPress-rendered page currently live on the Main Website, plus redirects for pages
 * whose address changed. "replace" marks pages an administrator explicitly allowed to replace an
 * existing Main Website page at the same address (always true for the Main homepage).
 */
function rest_manifest(): \WP_REST_Response {
	maybe_requeue_stalled_renders(); // The Main Website asks often; repairs a lost publishing job.
	$pages      = array();
	$live_paths = array();
	foreach ( list_live_versions() as $row ) {
		$post_id      = (int) $row['post_id'];
		$live_paths[] = $row['main_path'];
		$pages[]      = array(
			'path'       => $row['main_path'],
			'post_id'    => $post_id,
			'version'    => (int) $row['version'],
			'replace'    => replaces_main_page( $post_id, (string) $row['main_path'] ),
			'noindex'    => (bool) $row['noindex'],
			'updated_at' => mysql_to_rfc3339( $row['created_at'] ),
		);
	}
	$redirects = array_values( array_filter( moved_path_redirects(), static fn( $r ) => ! in_array( $r['from'], $live_paths, true ) ) );
	return no_cache_response( array( 'pages' => $pages, 'redirects' => $redirects ) );
}

function rest_render( \WP_REST_Request $request ) {
	$path = (string) $request->get_param( 'path' );
	$live = is_valid_main_path( $path ) ? live_version_for_path( $path ) : null;
	if ( ! $live ) {
		return new \WP_Error( 'acv_cms_not_found', 'Page not found.', array( 'status' => 404 ) );
	}
	return no_cache_response(
		array(
			'item' => array(
				'path'       => $live['main_path'],
				'post_id'    => (int) $live['post_id'],
				'version'    => (int) $live['version'],
				'noindex'    => (bool) $live['noindex'],
				'updated_at' => mysql_to_rfc3339( $live['created_at'] ),
				'html'       => $live['html'],
			),
		)
	);
}

function main_blog_query_args(): array {
	return array(
		'post_type'           => POST_TYPE,
		'post_status'         => 'publish',
		'has_password'        => false,
		'ignore_sticky_posts' => true,
		'no_found_rows'       => false,
		'orderby'             => 'date',
		'order'               => 'DESC',
		'meta_query'          => array(
			'relation' => 'OR',
			array( 'key' => META_TARGET, 'value' => array( TARGET_MAIN, TARGET_BOTH ), 'compare' => 'IN' ),
			// Blogs saved before a target was chosen default to the Main Website.
			array( 'key' => META_TARGET, 'compare' => 'NOT EXISTS' ),
		),
	);
}

function rest_list_blogs( \WP_REST_Request $request ): \WP_REST_Response {
	$per_page = min( MAX_PER_PAGE, max( 1, (int) $request['per_page'] ) );
	$query    = new \WP_Query(
		array_merge(
			main_blog_query_args(),
			array(
				'posts_per_page' => $per_page,
				'paged'          => max( 1, (int) $request['page'] ),
			)
		)
	);

	$items = array();
	foreach ( $query->posts as $post ) {
		if ( is_visible_on_main( $post ) ) {
			$items[] = blog_summary( $post );
		}
	}

	$response = no_cache_response( array( 'items' => $items ) );
	$response->header( 'X-WP-Total', (string) $query->found_posts );
	$response->header( 'X-WP-TotalPages', (string) $query->max_num_pages );
	return $response;
}

function rest_get_blog( \WP_REST_Request $request ) {
	$query = new \WP_Query(
		array_merge(
			main_blog_query_args(),
			array(
				'name'           => (string) $request['slug'],
				'posts_per_page' => 1,
				'no_found_rows'  => true,
			)
		)
	);
	$post = $query->posts[0] ?? null;

	if ( ! $post instanceof \WP_Post || ! is_visible_on_main( $post ) ) {
		return new \WP_Error( 'acv_cms_not_found', 'Blog not found.', array( 'status' => 404 ) );
	}

	$blog           = blog_summary( $post );
	$blog['seo']    = array(
		'title'       => (string) get_post_meta( $post->ID, META_SEO_TITLE, true ),
		'description' => (string) get_post_meta( $post->ID, META_SEO_DESCRIPTION, true ),
	);
	$blog['blocks'] = content_to_blocks( (string) $post->post_content );

	return no_cache_response( array( 'item' => $blog ) );
}

function blog_summary( \WP_Post $post ): array {
	return array(
		'id'             => $post->ID,
		'slug'           => $post->post_name,
		'title'          => plain_text( get_the_title( $post ) ),
		'excerpt'        => plain_text( has_excerpt( $post ) ? $post->post_excerpt : wp_trim_words( strip_shortcodes( $post->post_content ), 40, '…' ) ),
		'featured_image' => featured_image( $post ),
		'author_name'    => (string) get_post_meta( $post->ID, META_AUTHOR_NAME, true ),
		'category'       => blog_categories( $post )[0] ?? '',
		'categories'     => blog_categories( $post ),
		'noindex'        => '1' === get_post_meta( $post->ID, META_NOINDEX, true ),
		'publish_to'     => get_publish_target( $post->ID ),
		'published_at'   => mysql_to_rfc3339( $post->post_date_gmt ),
		'modified_at'    => mysql_to_rfc3339( $post->post_modified_gmt ),
	);
}

/**
 * Blog Categories (taxonomy), falling back to the pilot's single "Category" text field.
 */
function blog_categories( \WP_Post $post ): array {
	$terms = get_the_terms( $post, 'acv_blog_category' );
	$names = ( $terms && ! is_wp_error( $terms ) ) ? array_map( __NAMESPACE__ . '\\plain_text', wp_list_pluck( $terms, 'name' ) ) : array();
	$text  = (string) get_post_meta( $post->ID, META_CATEGORY, true );
	if ( ! $names && '' !== $text ) {
		$names = array( $text );
	}
	return array_values( array_filter( $names ) );
}

function featured_image( \WP_Post $post ): ?array {
	$attachment_id = (int) get_post_thumbnail_id( $post );
	if ( ! $attachment_id ) {
		return null;
	}
	$image = wp_get_attachment_image_src( $attachment_id, 'large' );
	if ( ! $image ) {
		return null;
	}
	return array(
		'url'    => esc_url_raw( $image[0] ),
		'width'  => (int) $image[1],
		'height' => (int) $image[2],
		'alt'    => plain_text( (string) get_post_meta( $attachment_id, '_wp_attachment_image_alt', true ) ),
	);
}

function plain_text( string $value ): string {
	return trim( html_entity_decode( wp_strip_all_tags( $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
}

/**
 * Content changes must reach the Main Website immediately, so these responses must not be
 * cached by page/REST caches on this server (e.g. LiteSpeed). The Main Website caches its own copy.
 */
function no_cache_response( array $data ): \WP_REST_Response {
	$response = new \WP_REST_Response( $data );
	$response->header( 'Cache-Control', 'no-store, max-age=0' );
	$response->header( 'X-LiteSpeed-Cache-Control', 'no-cache' );
	return $response;
}

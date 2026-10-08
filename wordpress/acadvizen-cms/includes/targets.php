<?php
/**
 * The "Publish To" (website target) model shared by every managed content type.
 *
 * - Site documents (pages, courses, locations) are designed in Elementor and rendered by
 *   WordPress. Target Main/Both => the Render Bridge publishes a snapshot to the Main Website.
 * - Templates (Header Footer Elementor templates, Elementor library templates) are shared
 *   building blocks. Their target decides on which website a header/footer is used.
 * - Blogs (acv_blog) are structured content consumed by the Main Website's blog pages.
 *
 * Existing content keeps its current behaviour: pages without a stored target are
 * "Enrollment" (exactly as today), templates are "Both".
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SITE_POST_TYPES     = array( 'page', 'acv_course', 'acv_location', 'acv_tool', 'acv_blog' );
const TEMPLATE_POST_TYPES = array( 'elementor-hf', 'elementor_library' );

const META_MAIN_REPLACE  = '_acv_main_replace';
const META_MAIN_HOMEPAGE = '_acv_main_homepage';
const META_MAIN_PATH     = '_acv_main_path';

/**
 * Main Website address patterns per content type, matching the Main Website's existing URLs
 * (www.acadvizen.com/courses/<slug>, /tools/<slug>, /blog/<slug>, /<location-slug>).
 */
const MAIN_PATH_PREFIXES = array(
	'acv_course'   => '/courses/',
	'acv_tool'     => '/tools/',
	'acv_blog'     => '/blog/',
	'acv_location' => '/',
);

/**
 * Content types whose whole Main Website address family is managed in WordPress: their records
 * replace the Main Website's own page at the same address.
 */
const MAIN_OWNED_TYPES = array( 'acv_tool', 'acv_blog' );

function is_site_post_type( string $post_type ): bool {
	return in_array( $post_type, SITE_POST_TYPES, true );
}

function is_template_post_type( string $post_type ): bool {
	return in_array( $post_type, TEMPLATE_POST_TYPES, true );
}

function default_target_for( string $post_type ): string {
	if ( POST_TYPE === $post_type || 'acv_tool' === $post_type ) {
		return TARGET_MAIN;
	}
	return is_template_post_type( $post_type ) ? TARGET_BOTH : TARGET_ENROLLMENT;
}

function target_labels(): array {
	return array(
		TARGET_ENROLLMENT => __( 'Enrollment Website', 'acadvizen-cms' ),
		TARGET_MAIN       => __( 'Main Website', 'acadvizen-cms' ),
		TARGET_BOTH       => __( 'Both Websites', 'acadvizen-cms' ),
	);
}

function targets_enrollment( string $target ): bool {
	return TARGET_ENROLLMENT === $target || TARGET_BOTH === $target;
}

/**
 * Stores a target and keeps Elementor's own page setting in sync, so the value shown in the
 * Elementor editor and in the WordPress edit screen can never disagree.
 */
function set_publish_target( int $post_id, string $target ): void {
	$target = sanitize_publish_target( $target );
	update_post_meta( $post_id, META_TARGET, $target );

	$settings = get_post_meta( $post_id, '_elementor_page_settings', true );
	if ( is_array( $settings ) && ( $settings[ ELEMENTOR_TARGET_SETTING ] ?? null ) !== $target ) {
		$settings[ ELEMENTOR_TARGET_SETTING ] = $target;
		update_post_meta( $post_id, '_elementor_page_settings', $settings );
	}
}

/**
 * The Main Website address of a site document, e.g. "/neet-coaching" or "/course/seo".
 * Returns '' when the WordPress address cannot be used on the Main Website.
 */
function main_path_for( \WP_Post $post ): string {
	if ( 'page' === $post->post_type && '1' === get_post_meta( $post->ID, META_MAIN_HOMEPAGE, true ) ) {
		return '/';
	}
	// An explicit Main Website address (set on import, or by an administrator in "Publish To").
	$explicit = (string) get_post_meta( $post->ID, META_MAIN_PATH, true );
	if ( '' !== $explicit ) {
		return is_valid_main_path( $explicit ) ? $explicit : '';
	}
	if ( isset( MAIN_PATH_PREFIXES[ $post->post_type ] ) ) {
		return default_main_path( $post->post_type, (string) $post->post_name );
	}
	$permalink = get_permalink( $post );
	if ( ! $permalink || false !== strpos( $permalink, '?' ) ) {
		return '';
	}
	$path = '/' . trim( (string) wp_parse_url( $permalink, PHP_URL_PATH ), '/' );
	return is_valid_main_path( $path ) ? $path : '';
}

/** The Main Website address a record of this type gets by default ('' when the slug is unusable). */
function default_main_path( string $post_type, string $slug ): string {
	$path = ( MAIN_PATH_PREFIXES[ $post_type ] ?? '/' ) . $slug;
	return '' !== $slug && is_valid_main_path( $path ) ? $path : '';
}

/**
 * Normalises an address typed by an administrator ("about/", "https://www.acadvizen.com/about")
 * to a Main Website path ("/about"), or '' when it cannot be used.
 */
function normalize_main_path( string $value ): string {
	$value = trim( $value );
	if ( '' === $value ) {
		return '';
	}
	$path = (string) wp_parse_url( $value, PHP_URL_PATH );
	$path = '/' . trim( strtolower( $path ), '/' );
	return is_valid_main_path( $path ) ? $path : '';
}

/**
 * True when this document replaces the Main Website's own page at its address: the homepage,
 * an explicit "Replace", or a content type whose address family WordPress manages.
 */
function replaces_main_page( int $post_id, string $main_path ): bool {
	return '/' === $main_path
		|| '1' === get_post_meta( $post_id, META_MAIN_REPLACE, true )
		|| in_array( (string) get_post_type( $post_id ), MAIN_OWNED_TYPES, true );
}

/** True when another published document already uses this Main Website address. */
function is_main_path_taken( string $path, int $except_id ): bool {
	$ids = get_posts(
		array(
			'post_type'        => SITE_POST_TYPES,
			'post_status'      => array( 'publish', 'draft', 'pending', 'future', 'private' ),
			'fields'           => 'ids',
			'posts_per_page'   => 1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'exclude'          => array( $except_id ),
			'meta_query'       => array( array( 'key' => META_MAIN_PATH, 'value' => $path ) ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		)
	);
	return (bool) $ids;
}

/** True when every prefix has at least one rewrite rule (rules are keyed by their regex). */
function rewrite_rules_cover( array $rule_keys, array $prefixes ): bool {
	foreach ( $prefixes as $prefix ) {
		$found = false;
		foreach ( $rule_keys as $key ) {
			if ( 0 === strpos( (string) $key, $prefix ) ) {
				$found = true;
				break;
			}
		}
		if ( ! $found ) {
			return false;
		}
	}
	return true;
}

function is_valid_main_path( string $path ): bool {
	return '/' === $path || ( 1 === preg_match( '#^(/[a-z0-9]+(?:-[a-z0-9]+)*)+$#', $path ) && strlen( $path ) <= 300 );
}

function main_url_for_path( string $path ): string {
	return main_site_url() . ( '/' === $path ? '/' : $path );
}

/**
 * True when this site document should currently be live on the Main Website.
 */
function is_site_doc_for_main( \WP_Post $post ): bool {
	return is_site_post_type( $post->post_type )
		&& 'publish' === $post->post_status
		&& '' === $post->post_password
		&& targets_main( get_publish_target( $post->ID ) )
		&& '' !== main_path_for( $post );
}

/**
 * Site documents whose target is Main only. They must not be served publicly by this
 * (Enrollment) website, which would otherwise become a duplicate public copy of Main pages.
 */
function is_main_only( \WP_Post $post ): bool {
	return is_site_post_type( $post->post_type ) && TARGET_MAIN === get_publish_target( $post->ID );
}

/**
 * IDs of published Main-only site documents, cached until any site document is saved.
 */
function main_only_post_ids(): array {
	$cached = wp_cache_get( 'main_only_ids', 'acadvizen_cms' );
	if ( is_array( $cached ) ) {
		return $cached;
	}
	$ids = get_posts(
		array(
			'post_type'        => SITE_POST_TYPES,
			'post_status'      => 'publish',
			'fields'           => 'ids',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_TARGET, 'value' => TARGET_MAIN ) ),
		)
	);
	$ids = array_map( 'intval', $ids );
	wp_cache_set( 'main_only_ids', $ids, 'acadvizen_cms', HOUR_IN_SECONDS );
	return $ids;
}

function flush_target_caches(): void {
	wp_cache_delete( 'main_only_ids', 'acadvizen_cms' );
	wp_cache_delete( 'main_link_map', 'acadvizen_cms' );
}

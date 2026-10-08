<?php
/**
 * Acadvizen Elementor Render Bridge — WordPress side.
 *
 * WordPress + Elementor (+ every installed Elementor add-on) stay the rendering authority.
 * To publish a page to the Main Website, the publisher (publisher.php) requests the page from
 * this very WordPress over HTTP with a signed "Main render" header. That request goes through the
 * normal theme / Elementor / plugin pipeline; this file only:
 *
 *   1. verifies the signature and turns off page caching for that one response,
 *   2. picks the header/footer templates targeted at the Main Website,
 *   3. rewrites URLs so the document works on the Main Website:
 *        - links to pages published to Main  -> their www.acadvizen.com address
 *        - WordPress assets (/wp-content, /wp-includes), admin-ajax and the REST API
 *          -> the Main Website's /_acv/… paths (it proxies these back to WordPress)
 *        - links to Enrollment-only pages stay absolute (they are cross-site links)
 *   4. inlines Elementor's generated CSS files so each stored version is self-contained
 *      (rolling back restores the exact styling of that version).
 *
 * It also stops Main-only pages from being served publicly by this (Enrollment) website.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const RENDER_HEADER_TS   = 'HTTP_X_ACADVIZEN_RENDER_TIMESTAMP';
const RENDER_HEADER_SIG  = 'HTTP_X_ACADVIZEN_RENDER_SIGNATURE';
const RENDER_HEADER_POST = 'HTTP_X_ACADVIZEN_RENDER_POST';
const RENDER_MARKER      = '<!-- acadvizen-render-bridge -->';

/**
 * The post being rendered for the Main Website in this request, or 0.
 */
function bridge_render_post_id(): int {
	static $post_id = null;
	if ( null !== $post_id ) {
		return $post_id;
	}
	$post_id = 0;
	$claimed = isset( $_SERVER[ RENDER_HEADER_POST ] ) ? absint( $_SERVER[ RENDER_HEADER_POST ] ) : 0;
	if ( $claimed && isset( $_SERVER[ RENDER_HEADER_TS ], $_SERVER[ RENDER_HEADER_SIG ] ) ) {
		$path    = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$message = 'loopback.' . $claimed . '.' . $path;
		if ( verify_signature( $message, wp_unslash( $_SERVER[ RENDER_HEADER_TS ] ), wp_unslash( $_SERVER[ RENDER_HEADER_SIG ] ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$post_id = $claimed;
		}
	}
	return $post_id;
}

function is_bridge_render(): bool {
	return bridge_render_post_id() > 0;
}

/**
 * Form submissions forwarded by the Main Website arrive from its server address, so per-visitor
 * rate limits and spam checks (enquiry API, Contact Form 7, MetForm, Elementor forms) would see one
 * visitor. The Main Website signs the visitor's IP ("client-ip.<ip>", shared secret, 5 minutes);
 * only a valid signature replaces REMOTE_ADDR. Runs while plugins load, before any form code.
 */
function apply_signed_client_ip(): void {
	$ip  = isset( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_IP'] ) ? trim( (string) wp_unslash( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_IP'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$ts  = isset( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_TS'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_TS'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$sig = isset( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_SIG'] ) ? (string) wp_unslash( $_SERVER['HTTP_X_ACADVIZEN_CLIENT_SIG'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	if ( '' === $ip || ! filter_var( $ip, FILTER_VALIDATE_IP ) ) {
		return;
	}
	if ( verify_signature( 'client-ip.' . $ip, $ts, $sig ) ) {
		$_SERVER['REMOTE_ADDR'] = $ip;
	}
}

/**
 * Runs while plugins load, before page caches decide whether to cache this response.
 */
function bootstrap_bridge_request(): void {
	if ( ! is_bridge_render() ) {
		return;
	}
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	add_action( 'init', static fn() => do_action( 'litespeed_control_set_nocache', 'acadvizen render bridge' ), 0 );
	add_filter( 'show_admin_bar', '__return_false' );
	// Text exactly as written: WordPress' typographic replacements (curly quotes, en dashes) would
	// show "You’re" where the Main Website shows "You're".
	add_filter( 'run_wptexturize', '__return_false' );
	// Emoji as the visitor's browser draws them (as on the Main Website): WordPress' emoji
	// replacement loads images from s.w.org, which the Main Website does not load.
	remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
	remove_action( 'wp_print_styles', 'print_emoji_styles' );
	remove_action( 'wp_enqueue_scripts', 'wp_enqueue_emoji_styles' );
	// Enrollment's own marketing embed (Hostinger Reach) does not belong on Main Website pages.
	add_action( 'wp_enqueue_scripts', static fn() => wp_dequeue_script( 'hostinger-reach-embed' ), 999 );
	// Discovery links point at this WordPress' internal API; the Main Website does not need them.
	add_action(
		'wp',
		static function () {
			remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );
			remove_action( 'wp_head', 'wp_shortlink_wp_head', 10 );
			remove_action( 'wp_head', 'rsd_link' );
			remove_action( 'wp_head', 'wlwmanifest_link' );
			remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
			remove_action( 'wp_head', 'feed_links', 2 );
			remove_action( 'wp_head', 'feed_links_extra', 3 );
			remove_action( 'wp_head', 'adjacent_posts_rel_link_wp_head', 10 );
			remove_action( 'template_redirect', 'rest_output_link_header', 11 );
			remove_action( 'template_redirect', 'wp_shortlink_header', 11 );
		}
	);
}

/**
 * template_redirect: start the Main transformation, or hide Main-only pages from the public.
 */
function handle_template_redirect(): void {
	$object = get_queried_object();

	if ( is_bridge_render() ) {
		if ( ! $object instanceof \WP_Post || (int) $object->ID !== bridge_render_post_id() || ! is_site_doc_for_main( $object ) ) {
			status_header( 409 );
			nocache_headers();
			exit;
		}
		nocache_headers();
		ob_start( __NAMESPACE__ . '\\transform_document_for_main' );
		return;
	}

	if ( $object instanceof \WP_Post && is_singular() && is_main_only( $object ) && ! current_user_can( 'edit_post', $object->ID ) ) {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();
		// Otherwise ?p=<id> would be redirected to the page's address, revealing it.
		remove_action( 'template_redirect', 'redirect_canonical' );
	}
}

/**
 * WordPress' canonical redirects (e.g. ?p=<id> -> pretty address) must never point visitors at a
 * Main-only page, which would reveal its address on this website.
 */
function block_canonical_redirect_to_main_only( $redirect_url ) {
	if ( ! $redirect_url || is_bridge_render() || ! main_only_post_ids() ) {
		return $redirect_url;
	}
	$post_id = url_to_postid( (string) $redirect_url );
	return ( $post_id && in_array( $post_id, main_only_post_ids(), true ) && ! current_user_can( 'edit_post', $post_id ) ) ? false : $redirect_url;
}

/**
 * Keep Main-only pages out of this website's search results and sitemaps.
 */
function exclude_main_only_from_queries( \WP_Query $query ): void {
	if ( is_admin() || ! $query->is_main_query() || ! $query->is_search() ) {
		return;
	}
	$ids = main_only_post_ids();
	if ( $ids ) {
		$query->set( 'post__not_in', array_merge( (array) $query->get( 'post__not_in' ), $ids ) );
	}
}

function exclude_main_only_from_core_sitemap( array $args ): array {
	$ids = main_only_post_ids();
	if ( $ids ) {
		$args['post__not_in'] = array_merge( $args['post__not_in'] ?? array(), $ids );
	}
	return $args;
}

/**
 * Rank Math sitemap entries (rank_math/sitemap/entry filter): returning false drops the entry.
 * Rank Math passes plain database rows here (not WP_Post), so only the ID is relied on.
 */
function exclude_main_only_from_rank_math_sitemap( $url, $type, $object ) {
	if ( 'post' === $type && is_object( $object ) && isset( $object->ID ) && in_array( (int) $object->ID, main_only_post_ids(), true ) ) {
		return false;
	}
	return $url;
}

/**
 * Header Footer Elementor picks the first template whose display conditions match the page.
 * We keep its conditions and only skip templates whose "Publish To" excludes the website being
 * rendered. Templates without a stored target are shared (Both), so existing behaviour is unchanged.
 */
/** IDs of the HFE templates of one type whose display rules match the current page, in HFE's order. */
function hfe_matching_templates( string $type ): array {
	// HFE keeps its rules class in its own namespace (HFE\Lib); older versions used the global name.
	$class = class_exists( '\\HFE\\Lib\\Astra_Target_Rules_Fields' ) ? '\\HFE\\Lib\\Astra_Target_Rules_Fields' : ( class_exists( '\\Astra_Target_Rules_Fields' ) ? '\\Astra_Target_Rules_Fields' : '' );
	if ( '' === $class ) {
		return array();
	}
	$option    = array( 'location' => 'ehf_target_include_locations', 'exclusion' => 'ehf_target_exclude_locations', 'users' => 'ehf_target_user_roles' );
	$templates = $class::get_instance()->get_posts_by_conditions( 'elementor-hf', $option );
	$ids       = array();
	foreach ( (array) $templates as $template ) {
		$id = absint( $template['id'] ?? 0 );
		if ( $id && get_post_meta( $id, 'ehf_template_type', true ) === $type ) {
			$ids[] = $id;
		}
	}
	return $ids;
}

function pick_hfe_template_for_site( $template_id, string $type ) {
	if ( ! class_exists( '\\Header_Footer_Elementor' ) || ! method_exists( '\\Header_Footer_Elementor', 'get_template_id' ) ) {
		return $template_id;
	}
	// HFE itself returns only the FIRST template whose display rules match the page. With a Main-only
	// header that also matches "entire site", that first match is wrong for Enrollment, so every
	// matching template of this type is considered and the first one for the website being
	// rendered wins (the order HFE would use).
	$candidates = hfe_matching_templates( $type );
	if ( ! $candidates ) {
		$single     = \Header_Footer_Elementor::get_template_id( $type );
		$candidates = '' !== (string) $single ? array( $single ) : array();
	}
	$for_main = is_bridge_render();
	foreach ( $candidates as $candidate ) {
		$target = get_publish_target( (int) $candidate );
		if ( $for_main ? targets_main( $target ) : targets_enrollment( $target ) ) {
			return $candidate;
		}
	}
	return $candidates ? '' : $template_id;
}

/**
 * Elementor Pro Theme Builder (header, footer, single, archive, search, popup, …): Pro passes each
 * candidate template through this filter and skips templates that are not published. A template
 * whose "Publish To" excludes the website being rendered is mapped to 0, so Pro skips it and uses
 * the next template that matches its own display conditions. Templates without a stored target
 * are shared (Both), so existing behaviour is unchanged. Loop Item templates are not location
 * templates; they render inside the page that uses them.
 */
function pick_theme_builder_template_for_site( $template_id, $location = '' ) {
	$template_id = (int) $template_id;
	if ( $template_id <= 0 ) {
		return $template_id;
	}
	$target = get_publish_target( $template_id );
	return ( is_bridge_render() ? targets_main( $target ) : targets_enrollment( $target ) ) ? $template_id : 0;
}

/**
 * Enrollment URL path => Main Website path, for every site document published to Main.
 */
function main_link_map(): array {
	$cached = wp_cache_get( 'main_link_map', 'acadvizen_cms' );
	if ( is_array( $cached ) ) {
		return $cached;
	}
	$map   = array();
	$posts = get_posts(
		array(
			'post_type'        => SITE_POST_TYPES,
			'post_status'      => 'publish',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_TARGET, 'value' => array( TARGET_MAIN, TARGET_BOTH ), 'compare' => 'IN' ) ),
		)
	);
	foreach ( $posts as $post ) {
		$main_path = main_path_for( $post );
		$wp_path   = '/' . trim( (string) wp_parse_url( (string) get_permalink( $post ), PHP_URL_PATH ), '/' );
		if ( '' !== $main_path ) {
			$map[ $wp_path ] = $main_path;
		}
	}
	wp_cache_set( 'main_link_map', $map, 'acadvizen_cms', HOUR_IN_SECONDS );
	return $map;
}

/**
 * Public paths on the Main Website for WordPress files and form endpoints. Vercel's platform
 * protection denies every request whose path contains "wp-content", "wp-includes", "wp-json/…"
 * or "admin-ajax" (403, X-Vercel-Mitigated: deny), so the Main copy of a page uses this neutral
 * prefix; next.config.mjs maps it back to WordPress (static files and allowlisted forms only).
 */
const MAIN_PROXY_PATHS = array(
	'/wp-content/'  => '/_acv/c/',
	'/wp-includes/' => '/_acv/i/',
	'/wp-json/'     => '/_acv/rest/',
);
const MAIN_AJAX_PATH   = '/_acv/ajax';

/**
 * Media and documents are loaded by browsers straight from WordPress (cross-origin is fine for
 * images, video and audio). They are the largest files, and proxying them through the Main
 * Website's servers would concentrate every visitor's requests on a few addresses, which the
 * WordPress host rate-limits. CSS, JS, fonts and SVG stay same-origin (/_acv/…): web fonts need
 * same-origin (or CORS) and the Main Website caches these small files on its CDN.
 */
const WORDPRESS_DIRECT_FILE = '#\.(?:png|jpe?g|gif|webp|avif|ico|bmp|tiff?|mp4|m4v|mov|webm|ogv|ogg|mp3|wav|m4a|pdf|zip|docx?|xlsx?|pptx?)$#i';

/**
 * This WordPress' public origin for files loaded directly by browsers (https outside local dev,
 * even when the WordPress Address option still says http://).
 */
function wordpress_public_origin(): string {
	$home  = wp_parse_url( public_site_url() );
	$host  = (string) ( $home['host'] ?? '' );
	$local = isset( $home['port'] ) || in_array( $host, array( 'localhost', '127.0.0.1' ), true );
	return ( $local ? (string) ( $home['scheme'] ?? 'http' ) : 'https' ) . '://' . $host . ( isset( $home['port'] ) ? ':' . $home['port'] : '' );
}

/**
 * Where a WordPress file or form endpoint path is served for the Main Website's copy of a page:
 * a /_acv/… path, an absolute WordPress URL (media), or null for any other path.
 */
function main_proxy_path( string $path ): ?string {
	if ( '/wp-admin/admin-ajax.php' === $path ) {
		return MAIN_AJAX_PATH;
	}
	if ( '/wp-json' === $path ) {
		return MAIN_PROXY_PATHS['/wp-json/'];
	}
	foreach ( MAIN_PROXY_PATHS as $wp_prefix => $main_prefix ) {
		if ( 0 === strpos( $path, $wp_prefix ) ) {
			if ( '/wp-json/' !== $wp_prefix && preg_match( WORDPRESS_DIRECT_FILE, $path ) ) {
				return wordpress_public_origin() . $path;
			}
			return $main_prefix . substr( $path, strlen( $wp_prefix ) );
		}
	}
	return null;
}

/**
 * A stored Main version, adjusted to be previewed on this WordPress: the Main Website's /_acv/…
 * paths are mapped back to the WordPress paths they stand for (plain and JSON-escaped).
 */
function preview_document_for_wordpress( string $html ): string {
	$map = array(
		'/_acv/c/'    => '/wp-content/',
		'/_acv/i/'    => '/wp-includes/',
		'/_acv/rest/' => '/wp-json/',
		'/_acv/ajax'  => '/wp-admin/admin-ajax.php',
	);
	$escaped = array();
	foreach ( $map as $from => $to ) {
		$escaped[ str_replace( '/', '\\/', $from ) ] = str_replace( '/', '\\/', $to );
	}
	return preg_replace_callback( '#<head\b[^>]*>#i', static fn( $m ) => $m[0] . PREVIEW_SANDBOX_SHIM, strtr( $html, $map + $escaped ), 1 );
}

/**
 * First thing in a preview's <head>. The preview runs in a sandbox with an opaque origin, where
 * reading cookies or web storage throws; that stopped Elementor's frontend before it revealed
 * entrance-animated elements, so they stayed invisible. Harmless stand-ins (nothing is stored),
 * and animated elements are shown even if a script still fails.
 */
const PREVIEW_SANDBOX_SHIM = '<style>.elementor-invisible{visibility:visible!important}</style><script>(function(){var d=document;try{d.cookie}catch(e){try{Object.defineProperty(d,"cookie",{configurable:true,get:function(){return""},set:function(){}})}catch(x){}}["localStorage","sessionStorage"].forEach(function(n){try{window[n].length}catch(e){var m={};try{Object.defineProperty(window,n,{configurable:true,value:{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}})}catch(x){}}})})();</script>';

/**
 * Root-relative references (inline scripts such as fetch('/wp-json/…'), CSS url(/wp-content/…),
 * srcset entries), plain and JSON-escaped. Anchored on a delimiter so only path starts match;
 * the full path is matched so the file type decides where it is served from.
 */
function rewrite_root_relative_paths_for_main( string $html ): string {
	$html = preg_replace_callback(
		'#(?<=[\s"\'(=,])(/(?:wp-content|wp-includes)/[^"\'\s<>()\\\\,]*|/wp-json/|/wp-admin/admin-ajax\.php)#',
		static function ( $m ) {
			$mapped = map_url_for_main( $m[1], array() );
			return null === $mapped ? $m[0] : $mapped;
		},
		$html
	);
	return (string) preg_replace_callback(
		'#(?<=[\s"\'(=,])(\\\\/(?:wp-content|wp-includes)\\\\/(?:[^"\'\s<>()\\\\,]|\\\\/)*|\\\\/wp-json\\\\/|\\\\/wp-admin\\\\/admin-ajax\.php)#',
		static function ( $m ) {
			$mapped = map_url_for_main( str_replace( '\\/', '/', $m[1] ), array() );
			return null === $mapped ? $m[0] : str_replace( '/', '\\/', $mapped );
		},
		(string) $html
	);
}

/**
 * Where an absolute URL on this WordPress should point in the Main Website's copy of a page.
 * Returns null to keep the URL unchanged.
 */
function map_url_for_main( string $path_and_more, array $link_map ): ?string {
	$path   = (string) strtok( $path_and_more, '?#' );
	$suffix = (string) substr( $path_and_more, strlen( $path ) );

	$proxied = main_proxy_path( $path );
	if ( null !== $proxied ) {
		return $proxied . $suffix;
	}
	$normalized = '/' . trim( $path, '/' );
	if ( '/' === $normalized ) {
		return main_url_for_path( '/' ) . ltrim( $suffix, '/' );
	}
	if ( isset( $link_map[ $normalized ] ) ) {
		return main_url_for_path( $link_map[ $normalized ] ) . $suffix;
	}
	return null;
}

/**
 * Rewrites every absolute URL of this WordPress in $html (plain and JSON-escaped forms).
 */
function rewrite_urls_for_main( string $html ): string {
	// Any address of this WordPress (with the CMS address set up, both the CMS and the public one).
	$hostport = '(?:' . implode( '|', array_map( static fn( $h ) => preg_quote( $h, '#' ), own_hostports() ) ) . ')';
	$map      = main_link_map();
	// Other links (e.g. to an Enrollment page) keep pointing at this WordPress, on its public
	// address - never the CMS address.
	$public    = url_hostport( public_site_url() );
	$on_public = static fn( string $url ) => false !== stripos( str_replace( '\\/', '/', $url ), '//' . $public );

	$html = preg_replace_callback(
		'#(?:https?:)?//' . $hostport . '(?![\w.:-])(/[^"\'\s<>()\\\\,]*)?#i',
		static function ( $m ) use ( $map, $on_public ) {
			$mapped = map_url_for_main( $m[1] ?? '/', $map );
			if ( null !== $mapped ) {
				return $mapped;
			}
			return $on_public( $m[0] ) ? $m[0] : wordpress_public_origin() . ( $m[1] ?? '/' );
		},
		$html
	);

	return preg_replace_callback(
		'#(?:https?:)?\\\\/\\\\/' . $hostport . '(?![\w.:-])((?:\\\\/[^"\'\s<>()\\\\,]*)*)#i',
		static function ( $m ) use ( $map, $on_public ) {
			$plain  = str_replace( '\\/', '/', $m[1] ?? '' );
			$plain  = '' === $plain ? '/' : $plain;
			$mapped = map_url_for_main( $plain, $map );
			if ( null !== $mapped ) {
				return str_replace( '/', '\\/', $mapped );
			}
			return $on_public( $m[0] ) ? $m[0] : str_replace( '/', '\\/', wordpress_public_origin() . $plain );
		},
		(string) $html
	);
}

/**
 * Replaces <link> tags for Elementor-generated CSS (uploads/elementor/css) with the file
 * contents, so a stored version keeps the styling it was published with.
 */
function inline_elementor_css( string $html ): string {
	$uploads = wp_get_upload_dir();
	$base    = trailingslashit( $uploads['basedir'] ) . 'elementor/css/';
	$url_dir = '/' . trim( (string) wp_parse_url( $uploads['baseurl'], PHP_URL_PATH ), '/' ) . '/elementor/css/';

	return preg_replace_callback(
		'#<link\b[^>]*\bhref=([\'"])(?:(?:https?:)?//[^/\'"]+)?' . preg_quote( $url_dir, '#' ) . '([\w.-]+\.css)(?:\?[^\'"]*)?\1[^>]*>#i',
		static function ( $m ) use ( $base, $url_dir ) {
			$file = $base . $m[2];
			if ( ! is_readable( $file ) ) {
				return $m[0];
			}
			$css = (string) file_get_contents( $file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			$css = absolutize_css_urls( $css, $url_dir );
			$css = rewrite_urls_for_main( $css );
			preg_match( '#\bid=([\'"])([^\'"]+)\1#', $m[0], $id );
			preg_match( '#\bmedia=([\'"])([^\'"]+)\1#', $m[0], $media );
			return sprintf(
				'<style id="%s" media="%s" data-acv-inlined="%s">%s</style>',
				esc_attr( $id[2] ?? 'acv-inline-' . $m[2] ),
				esc_attr( $media[2] ?? 'all' ),
				esc_attr( $m[2] ),
				str_ireplace( '</style', '<\/style', $css )
			);
		},
		$html
	);
}

/**
 * Relative url(...) references inside a CSS file are relative to that file; once inlined they
 * would resolve against the page instead, so make them root-relative.
 */
function absolutize_css_urls( string $css, string $css_dir ): string {
	return (string) preg_replace_callback(
		'#url\(\s*([\'"]?)(?!data:|https?:|//|/|\#)([^\'")]+)\1\s*\)#i',
		static function ( $m ) use ( $css_dir ) {
			$parts = array();
			foreach ( explode( '/', trim( $css_dir, '/' ) . '/' . $m[2] ) as $segment ) {
				if ( '..' === $segment ) {
					array_pop( $parts );
				} elseif ( '.' !== $segment && '' !== $segment ) {
					$parts[] = $segment;
				}
			}
			return 'url(' . $m[1] . '/' . implode( '/', $parts ) . $m[1] . ')';
		},
		$css
	);
}

/**
 * Output-buffer callback for bridge render requests.
 */
function transform_document_for_main( string $html ): string {
	if ( '' === trim( $html ) ) {
		return $html;
	}
	$html = inline_elementor_css( $html );
	$html = rewrite_urls_for_main( $html );
	$html = rewrite_root_relative_paths_for_main( $html );
	return $html . "\n" . RENDER_MARKER . "\n";
}

<?php
/**
 * Plugin Name: Acadvizen Staging Isolation (must-use, STAGING ONLY)
 * Description: Keeps the staging copy (cms.acadvizen.com) away from production: no indexing, no production
 *              tracking, no outgoing email, no outgoing requests except an allowlist, no automatic updates.
 *
 * Install ONLY on staging: wp-content/mu-plugins/acadvizen-staging-isolation.php
 * It does nothing on any other site address, so a stray copy on production is inert.
 * It changes no theme or third-party plugin files.
 */

namespace Acadvizen\Staging;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const STAGING_HOST = 'cms.acadvizen.com';

if ( STAGING_HOST !== strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) ) ) {
	return;
}

const PRODUCTION_HOSTS   = array( 'acadvizen.com', 'www.acadvizen.com', 'enroll.acadvizen.com' );
const PRODUCTION_TRACKING = array( 'AW-17912622133', 'G-XHHL082QEE', 'GTM-T6Q5DK5C' );
const LOG_OPTION         = 'acv_staging_isolation_log';

function log_event( string $type, string $detail ): void {
	$log   = get_option( LOG_OPTION, array() );
	$log   = is_array( $log ) ? $log : array();
	$log[] = array( 't' => time(), 'type' => $type, 'detail' => substr( $detail, 0, 300 ) );
	update_option( LOG_OPTION, array_slice( $log, -100 ), false );
}

// --- 1. Search engines: never index staging. ---------------------------------------------
add_filter( 'pre_option_blog_public', static fn() => '0' );
add_filter( 'wp_robots', static fn( $robots ) => array( 'noindex' => true, 'nofollow' => true ) + $robots, 999 );
add_filter( 'rank_math/frontend/robots', static fn( $robots ) => array( 'index' => 'noindex', 'follow' => 'nofollow' ) + (array) $robots, 999 );
add_filter( 'robots_txt', static fn() => "User-agent: *\nDisallow: /\n", 999 );
add_action( 'send_headers', static fn() => header( 'X-Robots-Tag: noindex, nofollow', true ) );
add_filter( 'rest_post_dispatch', static function ( $response ) {
	if ( $response instanceof \WP_HTTP_Response ) {
		$response->header( 'X-Robots-Tag', 'noindex, nofollow' );
	}
	return $response;
} );

// --- 2. Production tracking: strip production tag/analytics blocks from front-end HTML. ----
// The Google Ads tag is hard-coded in the copied theme's header.php; the theme file is left as is.
add_action( 'template_redirect', static function () {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	ob_start( __NAMESPACE__ . '\\strip_production_tracking' );
}, 1 );

function strip_production_tracking( string $html ): string {
	$ids = implode( '|', array_map( 'preg_quote', PRODUCTION_TRACKING ) );
	$out = preg_replace( '#<!--\s*Google tag \(gtag\.js\)\s*-->\s*#i', '', $html );
	$out = preg_replace( '#<script\b[^>]*\bsrc=["\'][^"\']*googletagmanager\.com/[^"\']*(?:' . $ids . ')[^"\']*["\'][^>]*>\s*</script>\s*#i', '', (string) $out );
	$out = preg_replace( '#<script\b[^>]*>(?:(?!</script>).)*(?:' . $ids . ')(?:(?!</script>).)*</script>\s*#is', '', (string) $out );
	return null === $out ? $html : $out;
}

// --- 3. Email: nothing leaves staging. Recorded (recipient domain + subject) for testing. ---
add_filter( 'pre_wp_mail', static function ( $short_circuit, $atts ) {
	$to = is_array( $atts['to'] ) ? $atts['to'] : explode( ',', (string) $atts['to'] );
	$to = array_map( static fn( $a ) => preg_replace( '/^[^@]*/', '*', trim( (string) $a ) ), $to );
	log_event( 'mail_blocked', implode( ',', $to ) . ' | ' . (string) $atts['subject'] );
	return true; // Report success to the caller; nothing is sent.
}, 999, 2 );

/**
 * A public media file download by the importer: GET, streamed to a file, from the Main Website's
 * public files, its public Supabase storage or the logo service, for an image/document path.
 */
function is_media_import_download( string $host, string $url, array $args ): bool {
	if ( empty( $args['stream'] ) || 'GET' !== strtoupper( (string) ( $args['method'] ?? 'GET' ) ) ) {
		return false;
	}
	$path = (string) wp_parse_url( $url, PHP_URL_PATH );
	if ( 'logo.clearbit.com' === $host ) {
		return true;
	}
	$is_file = (bool) preg_match( '/\.(png|jpe?g|gif|webp|avif|svg|ico|pdf)$/i', $path );
	if ( in_array( $host, array( 'www.acadvizen.com', 'acadvizen.com' ), true ) ) {
		return $is_file;
	}
	return (bool) preg_match( '/\.supabase\.co$/', $host ) && 0 === strpos( $path, '/storage/v1/object/public/' ) && $is_file;
}

// --- 4. Outgoing HTTP: allowlist only; production hosts are always refused. ---------------
add_filter( 'pre_http_request', static function ( $pre, $args, $url ) {
	$host = strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
	$main = array();
	foreach ( array( 'ACADVIZEN_CMS_MAIN_URL', 'ACADVIZEN_CMS_MAIN_INTERNAL_URL' ) as $constant ) {
		if ( defined( $constant ) ) {
			$main[] = strtolower( (string) wp_parse_url( (string) constant( $constant ), PHP_URL_HOST ) );
		}
	}
	$allowed = in_array( $host, array_merge( array( STAGING_HOST, 'localhost', '127.0.0.1' ), $main ), true )
		|| (bool) preg_match( '/(^|\.)(elementor\.com|wordpress\.org)$/', $host );
	// Master Admin > Import Main Website downloads the Main Website's public images (read-only file
	// GETs streamed to disk by download_url()). Only those downloads are let through.
	if ( is_media_import_download( $host, (string) $url, (array) $args ) ) {
		log_event( 'media_download_allowed', $host . (string) wp_parse_url( $url, PHP_URL_PATH ) );
		return $pre;
	}
	if ( in_array( $host, PRODUCTION_HOSTS, true ) || ! $allowed ) {
		log_event( 'http_blocked', $host );
		return new \WP_Error( 'acv_staging_blocked', 'Outgoing request blocked on staging: ' . $host );
	}
	return $pre;
}, 999, 3 );

// --- 5. No automatic updates on staging (keep parity with production for testing). --------
add_filter( 'automatic_updater_disabled', '__return_true', 999 );
add_filter( 'auto_update_plugin', '__return_false', 999 );
add_filter( 'auto_update_theme', '__return_false', 999 );
add_filter( 'auto_update_core', '__return_false', 999 );

// --- 6. Admin tools: purge LiteSpeed server cache; staging banner. ------------------------
add_action( 'admin_post_acv_staging_purge', static function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acv_staging_purge' ) ) {
		wp_die( 'Not allowed.', 403 );
	}
	header( 'X-LiteSpeed-Purge: *' );
	log_event( 'cache_purged', 'X-LiteSpeed-Purge: *' );
	wp_safe_redirect( admin_url( '?acv_staging_purged=1' ) );
	exit;
} );
add_action( 'admin_menu', static function () {
	add_management_page( 'Staging isolation log', 'Staging isolation log', 'manage_options', 'acv-staging-log', static function () {
		$log = array_reverse( (array) get_option( LOG_OPTION, array() ) );
		echo '<div class="wrap"><h1>Staging isolation log</h1><p>Most recent first. Email is recorded as recipient domain + subject only.</p>';
		echo '<table class="widefat striped" id="acv-staging-log"><thead><tr><th>Time (UTC)</th><th>Type</th><th>Detail</th></tr></thead><tbody>';
		foreach ( $log as $row ) {
			printf( '<tr><td>%s</td><td>%s</td><td>%s</td></tr>', esc_html( gmdate( 'Y-m-d H:i:s', (int) ( $row['t'] ?? 0 ) ) ), esc_html( (string) ( $row['type'] ?? '' ) ), esc_html( (string) ( $row['detail'] ?? '' ) ) );
		}
		echo '</tbody></table></div>';
	} );
} );
add_action( 'admin_notices', static function () {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$url = wp_nonce_url( admin_url( 'admin-post.php?action=acv_staging_purge' ), 'acv_staging_purge' );
	printf(
		'<div class="notice notice-warning"><p><strong>STAGING (cms.acadvizen.com)</strong> — not indexed, no production tracking, email and outgoing requests blocked. <a href="%s">Purge server page cache</a></p></div>',
		esc_url( $url )
	);
} );

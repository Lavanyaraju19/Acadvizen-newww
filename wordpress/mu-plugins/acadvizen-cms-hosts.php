<?php
/**
 * Plugin Name: Acadvizen CMS addresses (must-use)
 * Description: One WordPress, two addresses. The Enrollment website stays on its public address
 *              (enroll.acadvizen.com); the Master CMS - wp-admin, Elementor, publishing to Main,
 *              Enrollment or both - is used on the CMS address (cms.acadvizen.com).
 *
 * Install in wp-content/mu-plugins/ and define both addresses in wp-config.php:
 *   define( 'ACADVIZEN_CMS_ADMIN_URL', 'https://cms.acadvizen.com' );
 *   define( 'ACADVIZEN_CMS_PUBLIC_URL', 'https://enroll.acadvizen.com' );
 * Without both constants, or on any other address (e.g. a staging copy), it does nothing.
 *
 * - Each address works fully on its own: links, wp-admin, Elementor editor and previews use the
 *   address the request arrived on (Elementor needs the editor and its preview on one origin).
 * - Media always has the public address, so what is saved while working on the CMS address
 *   (image URLs in Elementor designs, generated Elementor CSS) is what the public website serves.
 * - The CMS address is not a third public website: its front end sends visitors to the public
 *   address and it is never indexed. Previews, the Elementor editor and the Main Website's
 *   signed render requests keep working there.
 * - On the public address, links saved as CMS addresses point to the public address, and the
 *   dashboard moves to the CMS address (front-end AJAX, forms and customer logins stay).
 */

namespace Acadvizen\Hosts;

if ( ! defined( 'ABSPATH' ) || ! defined( 'ACADVIZEN_CMS_ADMIN_URL' ) || ! defined( 'ACADVIZEN_CMS_PUBLIC_URL' ) ) {
	return;
}

function origin_of( string $url ): string {
	$p = parse_url( trim( $url ) );
	if ( empty( $p['host'] ) ) {
		return '';
	}
	return strtolower( ( $p['scheme'] ?? 'https' ) . '://' . $p['host'] . ( isset( $p['port'] ) ? ':' . $p['port'] : '' ) );
}

function hostport_of( string $origin ): string {
	return (string) preg_replace( '#^https?://#', '', $origin );
}

/** 'admin', 'public' or '' (any other address: do nothing). */
function current_role(): string {
	$host = strtolower( (string) ( $_SERVER['HTTP_HOST'] ?? '' ) );
	if ( '' === $host ) {
		return ''; // CLI / server cron without a host: the saved addresses apply.
	}
	if ( hostport_of( origin_of( ACADVIZEN_CMS_ADMIN_URL ) ) === $host ) {
		return 'admin';
	}
	return hostport_of( origin_of( ACADVIZEN_CMS_PUBLIC_URL ) ) === $host ? 'public' : '';
}

const ROLE_FILTER_PRIORITY = 99;

$acv_role   = current_role();
$acv_admin  = origin_of( ACADVIZEN_CMS_ADMIN_URL );
$acv_public = origin_of( ACADVIZEN_CMS_PUBLIC_URL );
if ( '' === $acv_role || '' === $acv_admin || '' === $acv_public || $acv_admin === $acv_public ) {
	return;
}
$acv_own = 'admin' === $acv_role ? $acv_admin : $acv_public;

// --- Each address works on its own. -------------------------------------------------------
foreach ( array( 'option_home', 'option_siteurl' ) as $acv_hook ) {
	add_filter( $acv_hook, static fn() => $acv_own, ROLE_FILTER_PRIORITY );
}

// WordPress fixes its content address (WP_CONTENT_URL, from the saved WordPress Address) before
// must-use plugins load, so theme/plugin files are moved to this request's address here: the
// Elementor editor needs its scripts and icon fonts from its own origin.
$acv_content = origin_of( defined( 'WP_CONTENT_URL' ) ? (string) WP_CONTENT_URL : '' );
$acv_to_own  = static fn( $url ) => ( '' !== $acv_content && 0 === stripos( (string) $url, $acv_content ) ) ? $acv_own . substr( (string) $url, strlen( $acv_content ) ) : $url;
foreach ( array( 'content_url', 'plugins_url', 'theme_root_uri', 'stylesheet_directory_uri', 'template_directory_uri', 'script_loader_src', 'style_loader_src' ) as $acv_hook ) {
	add_filter( $acv_hook, $acv_to_own, ROLE_FILTER_PRIORITY );
}

// --- Media always has the public address. --------------------------------------------------
add_filter(
	'upload_dir',
	static function ( array $dir ) use ( $acv_admin, $acv_public, $acv_content ): array {
		foreach ( array( 'url', 'baseurl' ) as $key ) {
			$url = (string) $dir[ $key ];
			foreach ( array_filter( array( $acv_admin, $acv_content ) ) as $from ) {
				if ( 0 === stripos( $url, $from ) ) {
					$url = $acv_public . substr( $url, strlen( $from ) );
				}
			}
			$dir[ $key ] = $url;
		}
		return $dir;
	},
	ROLE_FILTER_PRIORITY
);

/** Requests that belong on the CMS address and are served there. */
function is_cms_request(): bool {
	$path = (string) parse_url( (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), PHP_URL_PATH );
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return true;
	}
	if ( preg_match( '#/(wp-login\.php|wp-cron\.php|xmlrpc\.php|wp-json(/|$))#', $path ) ) {
		return true;
	}
	// Elementor editor canvas, WordPress previews, the Customizer and the Main Website's signed
	// render requests (the signature itself is checked by the CMS plugin).
	foreach ( array( 'elementor-preview', 'preview', 'preview_id', 'customize_changeset_uuid', 'elementor_library' ) as $param ) {
		if ( isset( $_GET[ $param ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return true;
		}
	}
	return ! empty( $_SERVER['HTTP_X_ACADVIZEN_RENDER_SIGNATURE'] );
}

if ( 'admin' === $acv_role ) {
	// --- The CMS address is not a public website. ---------------------------------------------
	// Every response, including wp-login.php and wp-admin (which skip 'send_headers').
	if ( ! headers_sent() ) {
		header( 'X-Robots-Tag: noindex, nofollow', true );
	}
	add_filter( 'wp_robots', static fn( $robots ) => array( 'noindex' => true, 'nofollow' => true ) + (array) $robots, 999 );
	add_action(
		'template_redirect',
		static function () use ( $acv_public ) {
			if ( is_cms_request() ) {
				return;
			}
			wp_redirect( $acv_public . (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), 302, 'Acadvizen CMS' ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
			exit;
		},
		0
	);
	return;
}

// --- Public address: the dashboard is on the CMS address. -------------------------------------
add_action(
	'init',
	static function () use ( $acv_admin ) {
		$path = (string) parse_url( (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), PHP_URL_PATH );
		$keep = '#/wp-admin/(admin-ajax|admin-post|async-upload)\.php$#';
		if ( is_admin() && ! wp_doing_ajax() && 'GET' === ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) && ! preg_match( $keep, $path ) ) {
			wp_redirect( $acv_admin . (string) ( $_SERVER['REQUEST_URI'] ?? '/wp-admin/' ), 302, 'Acadvizen CMS' ); // phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect
			exit;
		}
	},
	0
);

// --- Public address: links saved as CMS addresses point here. ----------------------------------
/** CMS-address links in a public page, plain and JSON-escaped, become public-address links. */
function to_public( string $html, string $admin, string $public ): string {
	return str_replace(
		array( $admin, str_replace( '/', '\\/', $admin ), '//' . hostport_of( $admin ) ),
		array( $public, str_replace( '/', '\\/', $public ), '//' . hostport_of( $public ) ),
		$html
	);
}

// Pages only: REST responses keep their data as stored (the CMS plugin maps both addresses itself
// when it renders pages for the Main Website).
add_action(
	'template_redirect',
	static function () use ( $acv_admin, $acv_public ) {
		ob_start( static fn( $html ) => to_public( (string) $html, $acv_admin, $acv_public ) );
	},
	1
);

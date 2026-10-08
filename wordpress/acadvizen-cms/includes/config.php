<?php
/**
 * Configuration lookups and the shared request-signing scheme.
 *
 * Secrets live only in wp-config.php constants so they never appear in the database,
 * the admin UI, REST output or exports.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MIN_SECRET_LENGTH = 32;

/**
 * Production isolation: only the production Enrollment website may talk to the production Main
 * Website. A copy of it (staging, e.g. cms.acadvizen.com) that still carries a production Main
 * address is treated as "not connected", so it can never notify, revalidate or link production.
 */
const PRODUCTION_ENROLLMENT_HOST = 'enroll.acadvizen.com';
const PRODUCTION_MAIN_HOSTS      = array( 'acadvizen.com', 'www.acadvizen.com' );

function url_host( string $url ): string {
	return strtolower( (string) wp_parse_url( $url, PHP_URL_HOST ) );
}

/** host[:port] of a URL, lowercase. */
function url_hostport( string $url ): string {
	$parts = wp_parse_url( $url );
	return strtolower( (string) ( $parts['host'] ?? '' ) . ( isset( $parts['port'] ) ? ':' . $parts['port'] : '' ) );
}

/**
 * One WordPress with two addresses (wordpress/mu-plugins/acadvizen-cms-hosts.php): the public
 * Enrollment address and the Master CMS address. Returns both, or none when they are not set or
 * this request did not arrive on either of them - so a copy of wp-config.php on another site
 * (a staging copy) is never mistaken for production.
 *
 * @return array{admin?: string, public?: string}
 */
function configured_addresses(): array {
	if ( ! defined( 'ACADVIZEN_CMS_ADMIN_URL' ) || ! defined( 'ACADVIZEN_CMS_PUBLIC_URL' ) ) {
		return array();
	}
	$urls = array(
		'admin'  => untrailingslashit( trim( (string) ACADVIZEN_CMS_ADMIN_URL ) ),
		'public' => untrailingslashit( trim( (string) ACADVIZEN_CMS_PUBLIC_URL ) ),
	);
	$hosts = array_map( __NAMESPACE__ . '\\url_hostport', $urls );
	return in_array( url_hostport( home_url() ), $hosts, true ) && '' !== $hosts['admin'] && '' !== $hosts['public'] ? $urls : array();
}

/** The address of the public (Enrollment) website, whichever address this request arrived on. */
function public_site_url(): string {
	$urls = configured_addresses();
	return $urls ? $urls['public'] : untrailingslashit( home_url() );
}

/** Every address of this WordPress (host[:port]): links on any of them are its own. */
function own_hostports(): array {
	return array_values( array_unique( array_merge( array( url_hostport( home_url() ) ), array_map( __NAMESPACE__ . '\\url_hostport', configured_addresses() ) ) ) );
}

function is_production_enrollment_site(): bool {
	return PRODUCTION_ENROLLMENT_HOST === url_host( public_site_url() );
}

function targets_production_main( string $url ): bool {
	return in_array( url_host( $url ), PRODUCTION_MAIN_HOSTS, true );
}

/**
 * Non-empty when the configured Main address must not be used from this website.
 */
function production_isolation_error(): string {
	if ( is_production_enrollment_site() ) {
		return '';
	}
	foreach ( array( 'ACADVIZEN_CMS_MAIN_URL', 'ACADVIZEN_CMS_MAIN_INTERNAL_URL' ) as $constant ) {
		if ( defined( $constant ) && targets_production_main( trim( (string) constant( $constant ) ) ) ) {
			return 'blocked_production_target';
		}
	}
	return '';
}

function main_site_url(): string {
	if ( '' !== production_isolation_error() ) {
		return '';
	}
	$url = defined( 'ACADVIZEN_CMS_MAIN_URL' ) ? (string) ACADVIZEN_CMS_MAIN_URL : '';
	$url = untrailingslashit( trim( $url ) );
	return wp_http_validate_url( $url ) ? $url : '';
}

/**
 * Address WordPress uses for its own server-to-server calls to the Main Website. Defaults to
 * the public address; ACADVIZEN_CMS_MAIN_INTERNAL_URL can override it (e.g. a private route).
 * Links in published pages always use the public address.
 */
function main_internal_url(): string {
	if ( '' === main_site_url() ) {
		return '';
	}
	$url = defined( 'ACADVIZEN_CMS_MAIN_INTERNAL_URL' ) ? untrailingslashit( trim( (string) ACADVIZEN_CMS_MAIN_INTERNAL_URL ) ) : '';
	return ( '' !== $url && wp_http_validate_url( $url ) ) ? $url : main_site_url();
}

/**
 * Extra headers for server-to-server calls to the Main Website. A protected Vercel preview
 * (used as the staging Main Website) needs its "Protection Bypass for Automation" secret, set
 * in wp-config.php as ACADVIZEN_CMS_MAIN_BYPASS_TOKEN. Never sent anywhere else.
 */
function main_request_headers(): array {
	$token = defined( 'ACADVIZEN_CMS_MAIN_BYPASS_TOKEN' ) ? trim( (string) ACADVIZEN_CMS_MAIN_BYPASS_TOKEN ) : '';
	return '' !== $token ? array( 'x-vercel-protection-bypass' => $token ) : array();
}

function webhook_secret(): string {
	return defined( 'ACADVIZEN_CMS_WEBHOOK_SECRET' ) ? (string) ACADVIZEN_CMS_WEBHOOK_SECRET : '';
}

function is_configured(): bool {
	return '' !== main_site_url() && strlen( webhook_secret() ) >= MIN_SECRET_LENGTH;
}

/**
 * Signature over "<timestamp>.<raw body>" with HMAC-SHA256, hex encoded.
 * Must match lib/wordpress/signature.js on the Main Website.
 */
function sign_payload( string $body, int $timestamp, string $secret ): string {
	return 'v1=' . hash_hmac( 'sha256', $timestamp . '.' . $body, $secret );
}

const SIGNATURE_TOLERANCE = 300;

/**
 * Verifies a "v1=" signature over "<timestamp>.<message>", rejecting anything older/newer than
 * five minutes (replay protection). Used for Main -> WordPress requests and the bridge's own
 * loopback render requests. Message strings are prefixed with a purpose ("render.", "manifest.",
 * "loopback.") so a signature for one purpose can never be replayed for another, and they can
 * never collide with JSON webhook bodies (which start with "{").
 */
function verify_signature( string $message, $timestamp, $signature ): bool {
	$secret = webhook_secret();
	if ( strlen( $secret ) < MIN_SECRET_LENGTH || ! is_string( $signature ) || ! preg_match( '/^\d{9,12}$/', (string) $timestamp ) ) {
		return false;
	}
	if ( abs( time() - (int) $timestamp ) > SIGNATURE_TOLERANCE ) {
		return false;
	}
	return hash_equals( sign_payload( $message, (int) $timestamp, $secret ), $signature );
}

/**
 * Base URL WordPress uses to request its own pages when rendering snapshots for the Main Website.
 * Defaults to the site's public address (with two addresses, always the public one, so a page
 * renders the same whichever address started the job); ACADVIZEN_CMS_LOOPBACK_URL can point at an
 * internal address (the Host header is still sent as the public host so WordPress renders the
 * normal site).
 */
function loopback_base(): string {
	$override = defined( 'ACADVIZEN_CMS_LOOPBACK_URL' ) ? untrailingslashit( (string) ACADVIZEN_CMS_LOOPBACK_URL ) : '';
	return '' !== $override ? $override : public_site_url();
}

/**
 * Main Website blog URLs only accept lowercase ASCII words joined by single hyphens.
 */
function is_main_compatible_slug( string $slug ): bool {
	return 1 === preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug ) && strlen( $slug ) <= 200;
}

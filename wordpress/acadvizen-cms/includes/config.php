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
 * Behaviour that changes what the Enrollment website already does. Off until wp-config.php turns
 * it on with define( 'ACADVIZEN_CMS_<NAME>', true ), so installing the plugin leaves those parts
 * of Enrollment exactly as they were:
 *   SITEMAP_CLEANUP - page-builder internals (header/footer templates, popups, forms, mega menus)
 *                     are left out of the sitemaps, and Rank Math's sitemap rules are restored
 *                     when they go missing from the saved rewrite rules;
 *   LOGIN_BRANDING  - the login screen's logo reads "Acadvizen" and links to the Main Website;
 *   SITE_TEMPLATES  - headers, footers and Theme Builder templates follow their "Publish To"
 *                     (a Main-only header is skipped on Enrollment, an Enrollment-only one on Main).
 */
const OPTIONAL_FEATURES = array( 'SITEMAP_CLEANUP', 'LOGIN_BRANDING', 'SITE_TEMPLATES', 'RENDER_BRIDGE', 'APPROVAL' );

function feature_enabled( string $feature ): bool {
	$feature = strtoupper( $feature );
	return in_array( $feature, OPTIONAL_FEATURES, true ) && defined( 'ACADVIZEN_CMS_' . $feature ) && true === constant( 'ACADVIZEN_CMS_' . $feature );
}

/**
 * The native publishing model (WordPress post types and Elementor pages with "Publish To", read or
 * rendered by the Main Website) only works while the Main Website reads WordPress
 * (WORDPRESS_CONTENT_ENABLED, the Render Bridge). Off by default: its editors, "Publish To" boxes
 * and screens are hidden so nobody publishes where nothing appears. Main Website content is edited
 * in Acadvizen Master Admin → Main Website, and blogs also in the regular Posts editor
 * (blog-sync.php). Nothing is deleted while hidden; define ACADVIZEN_CMS_RENDER_BRIDGE as true in
 * wp-config.php (together with the Main Website switch) to bring it back.
 */
function native_publishing_ui(): bool {
	return feature_enabled( 'RENDER_BRIDGE' );
}

/** Hooks of the optional features that wp-config.php turned on (called once while the plugin loads). */
function register_optional_features(): void {
	if ( feature_enabled( 'SITE_TEMPLATES' ) ) {
		foreach ( array( 'type_header', 'type_footer', 'type_before_footer' ) as $hfe_type ) {
			add_filter( "hfe_get_settings_{$hfe_type}", static fn( $template ) => pick_hfe_template_for_site( $template, $hfe_type ) );
		}
		// Elementor Pro Theme Builder templates (header, footer, single, archive, popup, …) per website.
		add_filter( 'elementor/theme/get_location_templates/template_id', __NAMESPACE__ . '\\pick_theme_builder_template_for_site', 10, 2 );
	}
	if ( feature_enabled( 'SITEMAP_CLEANUP' ) ) {
		add_action( 'wp_loaded', __NAMESPACE__ . '\\restore_missing_sitemap_rules' );
	}
	if ( feature_enabled( 'LOGIN_BRANDING' ) ) {
		add_filter( 'login_headerurl', __NAMESPACE__ . '\\login_logo_url' );
		add_filter( 'login_headertext', __NAMESPACE__ . '\\login_logo_text' );
	}
}

/**
 * Production isolation: only the production Enrollment website may talk to the production Main
 * Website. A copy of it (a staging or backup copy) that still carries a production Main
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
 * The address of the public (Enrollment) website. The Master CMS is this WordPress's own admin
 * (enroll.acadvizen.com/wp-admin/ in production); there is no second CMS address.
 */
function public_site_url(): string {
	return untrailingslashit( home_url() );
}

/** Every address of this WordPress (host[:port]): links on it are its own. */
function own_hostports(): array {
	return array( url_hostport( home_url() ) );
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

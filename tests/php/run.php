<?php
/**
 * Dependency-free PHP tests for the Acadvizen Master Admin plugin (wordpress/acadvizen-cms).
 * Stubs only the WordPress functions the tested code calls.
 *
 *   php tests/php/run.php
 *   docker run --rm -v "$PWD:/app" -w /app php:8.3-cli php tests/php/run.php
 */

namespace {
	const PLUGIN = __DIR__ . '/../../wordpress/acadvizen-cms/includes/';

	// Isolation-guard cases run in a child process: constants cannot be redefined.
	if ( ( $argv[1] ?? '' ) === '--guard' ) {
		define( 'ABSPATH', '/' );
		$GLOBALS['acv_home'] = $argv[2];
		function home_url() { return $GLOBALS['acv_home']; }
		function untrailingslashit( $s ) { return rtrim( $s, '/' ); }
		function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
		function wp_http_validate_url( $u ) { return filter_var( $u, FILTER_VALIDATE_URL ) ? $u : false; }
		define( 'ACADVIZEN_CMS_MAIN_URL', $argv[3] );
		if ( '' !== $argv[4] ) {
			define( 'ACADVIZEN_CMS_MAIN_INTERNAL_URL', $argv[4] );
		}
		define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', str_repeat( 'x', 40 ) );
		// Retired second-admin-address constants left in an old wp-config.php must change nothing.
		if ( 'legacy' === ( $argv[5] ?? '' ) ) {
			define( 'ACADVIZEN_CMS_ADMIN_URL', $argv[2] );
			define( 'ACADVIZEN_CMS_PUBLIC_URL', 'https://enroll.acadvizen.com' );
		}
		require PLUGIN . 'config.php';
		echo \Acadvizen\CMS\is_configured() ? 'connected' : 'blocked';
		if ( 'info' === ( $argv[5] ?? '' ) ) {
			echo ' ' . \Acadvizen\CMS\loopback_base() . ' ' . implode( ',', \Acadvizen\CMS\own_hostports() );
		}
		exit;
	}

	// Missing-secret case: with no ACADVIZEN_CMS_WEBHOOK_SECRET a well-formed, current signature is refused.
	if ( ( $argv[1] ?? '' ) === '--no-secret' ) {
		define( 'ABSPATH', '/' );
		require PLUGIN . 'config.php';
		$ts = time();
		echo \Acadvizen\CMS\verify_signature( 'manifest.', (string) $ts, \Acadvizen\CMS\sign_payload( 'manifest.', $ts, str_repeat( 'k', 48 ) ) ) ? 'accepted' : 'refused';
		exit;
	}

	if ( true ) { // conditional, so these are not hoisted into the --guard child process
		define( 'ABSPATH', '/' );
		define( 'HOUR_IN_SECONDS', 3600 );
		function home_url() { return 'https://enroll.acadvizen.com'; }
		function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
		// main_link_map(): no Main pages; main_only_post_ids(): page 4242 is Main-only.
		function wp_cache_get( $key = '' ) { return 'main_only_ids' === $key ? array( 4242 ) : array(); }
		function wp_unslash( $v ) { return $v; }
		function untrailingslashit( $s ) { return rtrim( (string) $s, '/' ); }
		function get_post_meta( $id, $key = '', $single = false ) { return $GLOBALS['acv_meta'][ $id ][ $key ] ?? ( $GLOBALS['acv_targets'][ $id ] ?? '' ); }
		class Astra_Target_Rules_Fields { public static function get_instance() { return new self(); } public function get_posts_by_conditions( $type, $option ) { return $GLOBALS['acv_hfe_matches'] ?? array(); } }
		class Header_Footer_Elementor { public static function get_template_id( $type ) { foreach ( $GLOBALS['acv_hfe_matches'] ?? array() as $t ) { if ( ( $GLOBALS['acv_meta'][ $t['id'] ]['ehf_template_type'] ?? '' ) === $type ) { return $t['id']; } } return ''; } }
		function get_post_type( $id ) { return $GLOBALS['acv_types'][ $id ] ?? 'elementor_library'; }
		function wp_doing_ajax() { return ! empty( $GLOBALS['acv_ajax'] ); }
		function wp_json_encode( $data ) { return json_encode( $data ); }
		function update_option( $name, $value, $autoload = null ) { $GLOBALS['acv_options'][ $name ] = $value; return true; }
		function wp_is_post_autosave( $id ) { return 77 === $id ? 5 : false; } // post 77 is an autosave of post 5
		class WP_Post { public $ID; public $post_type = 'page'; public $post_content = ''; public function __construct( $id, $type = 'page', $content = '' ) { $this->ID = $id; $this->post_type = $type; $this->post_content = $content; } }
		function get_option( $name, $default = false ) { return 'elementor_active_kit' === $name ? 10 : ( $GLOBALS['acv_options'][ $name ] ?? $default ); }
		function wp_next_scheduled( $hook, $args = array() ) { return false; }
		function wp_schedule_single_event( $ts, $hook, $args = array() ) { $GLOBALS['acv_scheduled'][] = array( 'hook' => $hook, 'args' => $args ); $GLOBALS['acv_cron'][ $ts ][ $hook ][ md5( serialize( $args ) ) ] = array( 'args' => $args ); return true; }
		function _get_cron_array() { return $GLOBALS['acv_cron'] ?? array(); }
		function wp_unschedule_event( $ts, $hook, $args = array() ) { unset( $GLOBALS['acv_cron'][ $ts ][ $hook ][ md5( serialize( $args ) ) ] ); return true; }
		$GLOBALS['acv_uuid'] = 0;
		function wp_generate_uuid4() { return 'uuid-' . ( ++$GLOBALS['acv_uuid'] ); }
		// Main Website content screen (includes/main-content.php).
		function current_user_can( $cap ) { return in_array( $cap, $GLOBALS['acv_caps'] ?? array(), true ); }
		function get_current_user_id() { return (int) ( $GLOBALS['acv_user'] ?? 0 ); }
		if ( ! function_exists( 'sanitize_hex_color' ) ) {
			// As WordPress: '' stays '', a valid #rgb/#rrggbb is kept, anything else is null.
			function sanitize_hex_color( $c ) { return '' === $c ? '' : ( preg_match( '|^#([A-Fa-f0-9]{3}){1,2}$|', $c ) ? $c : null ); }
		}
		foreach ( array( 'esc_attr__', 'esc_html_e', 'esc_attr_e' ) as $acv_fn ) {
			if ( ! function_exists( $acv_fn ) ) {
				eval( 'function ' . $acv_fn . '( $s, $d = "" ) { ' . ( '_e' === substr( $acv_fn, -2 ) ? 'echo htmlspecialchars( (string) $s, ENT_QUOTES );' : 'return htmlspecialchars( (string) $s, ENT_QUOTES );' ) . ' }' );
			}
		}
		if ( ! function_exists( 'selected' ) ) {
			function selected( $a, $b = true, $echo = true ) { $r = (string) $a === (string) $b ? ' selected="selected"' : ''; if ( $echo ) { echo $r; } return $r; }
		}
		if ( ! function_exists( 'checked' ) ) {
			function checked( $a, $b = true, $echo = true ) { $r = (string) $a === (string) $b ? ' checked="checked"' : ''; if ( $echo ) { echo $r; } return $r; }
		}
		if ( ! function_exists( 'wp_get_current_user' ) ) {
			function wp_get_current_user() { return (object) array( 'ID' => (int) ( $GLOBALS['acv_user'] ?? 0 ), 'user_login' => 'tester', 'display_name' => 'Tester' ); }
		}
		if ( ! function_exists( 'Acadvizen\CMS\post_to_main' ) && ! function_exists( 'post_to_main' ) ) {
			// As main-site.php without a connection (not loaded by these tests).
			function post_to_main( $path, $payload, $timeout ) { return array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => 'not_configured' ); }
		}
		if ( ! function_exists( 'wp_date' ) ) {
			function wp_date( $format, $ts = null ) { return gmdate( $format, null === $ts ? time() : (int) $ts ); }
		}
		if ( ! function_exists( 'wp_timezone_string' ) ) {
			function wp_timezone_string() { return 'UTC'; }
		}
		if ( ! function_exists( 'esc_textarea' ) ) {
			function esc_textarea( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
		}
		if ( ! function_exists( 'sanitize_textarea_field' ) ) {
			function sanitize_textarea_field( $s ) { return trim( strip_tags( (string) $s ) ); }
		}
		function wp_kses_post( $s ) { return preg_replace( '#<script\b[^>]*>.*?</script>#is', '', (string) $s ); }
		function esc_url( $s ) { return (string) $s; }
		if ( ! function_exists( 'wp_http_validate_url' ) ) {
			function wp_http_validate_url( $u ) { return filter_var( $u, FILTER_VALIDATE_URL ) ? $u : false; }
		}
		function esc_url_raw( $s, $protocols = null ) { $s = trim( (string) $s ); $scheme = strtolower( (string) parse_url( $s, PHP_URL_SCHEME ) ); return ( $scheme && ( ! $protocols || in_array( $scheme, $protocols, true ) ) ) ? $s : ''; }
		function update_post_meta( $id, $key, $value ) { return true; }
		function wp_cache_delete( $key, $group = '' ) { $GLOBALS['acv_cache_deleted'][] = "$group/$key"; return true; }
		function wp_doing_cron() { return ! empty( $GLOBALS['acv_doing_cron'] ); }
		function get_posts( $args = array() ) { $GLOBALS['acv_get_posts_calls'][] = $args; return $GLOBALS['acv_post_ids'] ?? array(); }
		if ( ! function_exists( 'delete_option' ) ) {
			function delete_option( $name ) { unset( $GLOBALS['acv_options'][ $name ] ); return true; }
		}
		if ( ! function_exists( 'wp_strip_all_tags' ) ) {
			function wp_strip_all_tags( $text ) { return trim( strip_tags( (string) $text ) ); }
		}
		if ( ! function_exists( 'get_transient' ) ) {
			function get_transient( $name ) { return $GLOBALS['acv_transients'][ $name ] ?? false; }
			function set_transient( $name, $value, $ttl = 0 ) { $GLOBALS['acv_transients'][ $name ] = $value; return true; }
		}
		if ( ! function_exists( 'flush_rewrite_rules' ) ) {
			function flush_rewrite_rules( $hard = true ) { $GLOBALS['acv_flushes'][] = $hard; }
		}
		if ( ! function_exists( 'add_filter' ) ) {
			function add_filter( $hook, $callback, $priority = 10, $args = 1 ) { $GLOBALS['acv_hooks'][] = $hook; return true; }
			function add_action( $hook, $callback, $priority = 10, $args = 1 ) { $GLOBALS['acv_hooks'][] = $hook; return true; }
		}
		function add_option( $name, $value = '', $deprecated = '', $autoload = null ) { if ( isset( $GLOBALS['acv_options'][ $name ] ) ) { return false; } $GLOBALS['acv_options'][ $name ] = $value; return true; }
		function delete_post_meta( $id, $key ) { return true; }
		function __( $text, $domain = '' ) { return $text; }
		function _n( $single, $plural, $number, $domain = '' ) { return 1 === (int) $number ? $single : $plural; }
		function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
		function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
		function absint( $n ) { return abs( (int) $n ); }
		function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
		function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
		function get_post( $post = null ) { return $GLOBALS['acv_current_post'] ?? null; }
		function do_shortcode( $s ) {
			if ( false !== strpos( $s, '[acv_field name="content"]' ) ) {
				return str_replace( '[acv_field name="content"]', \Acadvizen\CMS\record_content( $GLOBALS['acv_current_post'] ), $s );
			}
			return 0 === strpos( $s, '[acv_lead_form' ) ? \Acadvizen\CMS\shortcode_lead_form( array() ) : $s;
		}
		function wpautop( $s ) { return $s; }
		function shortcode_unautop( $s ) { return $s; }
		function esc_html__( $s, $d = '' ) { return $s; }
		function shortcode_atts( $pairs, $atts, $tag = '' ) { return array_merge( $pairs, array_intersect_key( (array) $atts, $pairs ) ); }
		define( 'Acadvizen\CMS\POST_TYPE', 'acv_blog' ); // normally defined by acadvizen-cms.php
		define( 'Acadvizen\CMS\MENU_SLUG', 'acadvizen-cms' );
		define( 'Acadvizen\CMS\REST_NAMESPACE', 'acadvizen-cms/v1' );
		define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', 'test-secret-0123456789abcdef0123456789abcdef' );
		require PLUGIN . 'config.php';
		require PLUGIN . 'post-type.php';
		require PLUGIN . 'targets.php';
		require PLUGIN . 'render-bridge.php';
		require PLUGIN . 'publisher.php';
		require PLUGIN . 'versions.php';
		require PLUGIN . 'content-types.php';
		require PLUGIN . 'admin.php';
		require PLUGIN . 'design.php';
		require PLUGIN . 'migration.php';
		require PLUGIN . 'media-guard.php';
		class WP_REST_Request { private $headers; public function __construct( array $headers = array() ) { $this->headers = $headers; } public function get_header( $key ) { return $this->headers[ $key ] ?? null; } public function get_param( $key ) { return null; } }
		class WP_REST_Response { public $data; public $headers = array(); public function __construct( $data = null ) { $this->data = $data; } public function header( $key, $value ) { $this->headers[ $key ] = $value; } }
		if ( ! function_exists( 'do_action' ) ) {
			function do_action( $hook, ...$args ) { $GLOBALS['acv_actions'][] = $hook; }
		}
		require PLUGIN . 'rest.php';
		require PLUGIN . 'main-content.php';
		if ( ! function_exists( 'strip_shortcodes' ) ) {
			function strip_shortcodes( $s ) { return preg_replace( '/\[\/?[a-z0-9_\-]+[^\]]*\]/i', '', (string) $s ); }
		}
		require PLUGIN . 'blog-sync.php';
		if ( ! function_exists( 'apply_filters' ) ) {
			function apply_filters( $hook, $value ) { return $value; }
		}
		if ( ! defined( 'AcadvizenCMSMETA_SLUG_STATUS' ) ) {
			require_once PLUGIN . 'sync.php';
		}
		require PLUGIN . 'registry.php';
		require PLUGIN . 'approval.php';
	}
}

namespace Acadvizen\CMS {
	$failures = 0;
	$count    = 0;
	function check( string $name, $expected, $actual ): void {
		global $failures, $count;
		++$count;
		if ( $expected === $actual ) {
			echo "ok   $name\n";
			return;
		}
		++$failures;
		echo "FAIL $name\n     expected: " . var_export( $expected, true ) . "\n     actual:   " . var_export( $actual, true ) . "\n";
	}

	// --- Main-site public paths (Vercel denies any path containing wp-content/wp-json/…) ---
	check( 'css same-origin', '/_acv/c/plugins/elementor/assets/css/frontend.min.css', main_proxy_path( '/wp-content/plugins/elementor/assets/css/frontend.min.css' ) );
	check( 'font same-origin', '/_acv/c/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2', main_proxy_path( '/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2' ) );
	check( 'svg same-origin', '/_acv/c/uploads/logo.svg', main_proxy_path( '/wp-content/uploads/logo.svg' ) );
	check( 'image direct from WordPress', 'https://enroll.acadvizen.com/wp-content/uploads/a.png', main_proxy_path( '/wp-content/uploads/a.png' ) );
	check( 'video direct from WordPress', 'https://enroll.acadvizen.com/wp-content/uploads/intro.MP4', main_proxy_path( '/wp-content/uploads/intro.MP4' ) );
	check( 'wp-includes js', '/_acv/i/js/jquery/jquery.min.js', main_proxy_path( '/wp-includes/js/jquery/jquery.min.js' ) );
	check( 'rest route', '/_acv/rest/acadvizen/v1/enquiry', main_proxy_path( '/wp-json/acadvizen/v1/enquiry' ) );
	check( 'rest root', '/_acv/rest/', main_proxy_path( '/wp-json' ) );
	check( 'admin-ajax', '/_acv/ajax', main_proxy_path( '/wp-admin/admin-ajax.php' ) );
	check( 'wp-admin is never mapped', null, main_proxy_path( '/wp-admin/post.php' ) );
	check( 'pages are not mapped', null, main_proxy_path( '/about-us/' ) );

	$doc = '<script>fetch(window.location.origin+\'/wp-json/acadvizen/v1/enquiry\',{})</script>'
		. '<link rel="stylesheet" href="https://enroll.acadvizen.com/wp-content/plugins/cf7/styles.css?ver=6.1.7">'
		. '<img src="https://enroll.acadvizen.com/wp-content/uploads/a.png" srcset="/wp-content/uploads/a.png 1x, /wp-content/uploads/b.png?v=2 2x">'
		. '<style>.x{background:url(/wp-content/uploads/bg.jpg)}@font-face{src:url(/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2?5.34.0)}</style>'
		. '<script>var c={"root":"https:\/\/enroll.acadvizen.com\/wp-json\/","ajax":"\/wp-admin\/admin-ajax.php","assets":"https:\/\/enroll.acadvizen.com\/wp-content\/plugins\/elementor\/assets\/","img":"\/wp-content\/uploads\/c.webp"};</script>'
		. '<p>Docs mention example.com/wp-content/ in prose.</p>';
	$out = rewrite_root_relative_paths_for_main( rewrite_urls_for_main( $doc ) );

	check( 'no wp-json left', false, strpos( $out, 'wp-json' ) !== false );
	check( 'no admin-ajax left', false, strpos( $out, 'admin-ajax' ) !== false );
	check( 'inline fetch literal', true, strpos( $out, "origin+'/_acv/rest/acadvizen/v1/enquiry'" ) !== false );
	check( 'absolute stylesheet same-origin', true, strpos( $out, 'href="/_acv/c/plugins/cf7/styles.css?ver=6.1.7"' ) !== false );
	check( 'absolute img stays on WordPress', true, strpos( $out, 'src="https://enroll.acadvizen.com/wp-content/uploads/a.png"' ) !== false );
	check( 'srcset entries direct', true, strpos( $out, 'srcset="https://enroll.acadvizen.com/wp-content/uploads/a.png 1x, https://enroll.acadvizen.com/wp-content/uploads/b.png?v=2 2x"' ) !== false );
	check( 'css url() image direct', true, strpos( $out, 'url(https://enroll.acadvizen.com/wp-content/uploads/bg.jpg)' ) !== false );
	check( 'css url() font same-origin', true, strpos( $out, 'url(/_acv/c/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2?5.34.0)' ) !== false );
	check( 'json-escaped rest root', true, strpos( $out, '"root":"\/_acv\/rest\/"' ) !== false );
	check( 'json-escaped ajax', true, strpos( $out, '"ajax":"\/_acv\/ajax"' ) !== false );
	check( 'json-escaped assets', true, strpos( $out, '"assets":"\/_acv\/c\/plugins\/elementor\/assets\/"' ) !== false );
	check( 'json-escaped image direct', true, strpos( $out, '"img":"https:\/\/enroll.acadvizen.com\/wp-content\/uploads\/c.webp"' ) !== false );
	check( 'mid-path text untouched', true, strpos( $out, 'example.com/wp-content/ in prose' ) !== false );
	check( 'other hosts untouched', true, strpos( rewrite_urls_for_main( '<a href="https://enroll.acadvizen.com.evil.example/wp-content/x">' ), 'evil.example/wp-content/x' ) !== false );

	// --- Main-only pages never appear in Rank Math's sitemap (it passes plain DB rows) ---
	$row      = (object) array( 'ID' => 4242, 'post_type' => 'page', 'filter' => 'sample' );
	$visible  = (object) array( 'ID' => 7, 'post_type' => 'page', 'filter' => 'sample' );
	check( 'rank math: main-only row dropped', false, exclude_main_only_from_rank_math_sitemap( array( 'loc' => 'x' ), 'post', $row ) );
	check( 'rank math: other row kept', array( 'loc' => 'y' ), exclude_main_only_from_rank_math_sitemap( array( 'loc' => 'y' ), 'post', $visible ) );
	check( 'rank math: terms untouched', array( 'loc' => 'z' ), exclude_main_only_from_rank_math_sitemap( array( 'loc' => 'z' ), 'term', $row ) );

	// --- Elementor Pro Theme Builder targeting (enrollment request; not a bridge render) ---
	$GLOBALS['acv_targets'] = array( 501 => 'both', 502 => 'main', 503 => 'enrollment' );
	check( 'theme builder: untargeted template kept (Both by default)', 500, pick_theme_builder_template_for_site( 500, 'footer' ) );
	check( 'theme builder: Both template kept on Enrollment', 501, pick_theme_builder_template_for_site( 501, 'footer' ) );
	check( 'theme builder: Main-only template skipped on Enrollment', 0, pick_theme_builder_template_for_site( 502, 'header' ) );
	check( 'theme builder: Enrollment template kept on Enrollment', 503, pick_theme_builder_template_for_site( 503, 'popup' ) );
	check( 'theme builder: invalid id untouched', 0, pick_theme_builder_template_for_site( 0, 'footer' ) );
	// Main renders once the Main Website has its own header/footer: Enrollment chrome shared with Both stays off Main.
	check( 'theme builder (Main, own chrome): Both footer/header/popup skipped', array( false, false, false ), array( theme_template_allowed( 'both', true, 'footer', true ), theme_template_allowed( 'both', true, 'header', true ), theme_template_allowed( 'both', true, 'popup', true ) ) );
	check( 'theme builder (Main, own chrome): Main-only footer and popup used', array( true, true ), array( theme_template_allowed( 'main', true, 'footer', true ), theme_template_allowed( 'main', true, 'popup', true ) ) );
	check( 'theme builder (Main, own chrome): Both template in other locations kept', true, theme_template_allowed( 'both', true, 'single', true ) );
	check( 'theme builder (Main, no own chrome yet): Both footer kept as before', true, theme_template_allowed( 'both', true, 'footer', false ) );
	check( 'theme builder (Main): Enrollment-only template never used', array( false, false ), array( theme_template_allowed( 'enrollment', true, 'footer', true ), theme_template_allowed( 'enrollment', true, 'single', false ) ) );
	check( 'theme builder (Enrollment): unchanged by Main chrome', array( true, true, false ), array( theme_template_allowed( 'both', false, 'footer', true ), theme_template_allowed( 'enrollment', false, 'popup', true ), theme_template_allowed( 'main', false, 'header', true ) ) );

	// --- Version preview on WordPress maps the Main /_acv/ paths back ---
	$stored  = '<link href="/_acv/c/plugins/x.css?ver=1"><script>var c={"root":"\/_acv\/rest\/","ajax":"\/_acv\/ajax"}</script><script>fetch(\'/_acv/rest/acadvizen/v1/enquiry\')</script><script src="/_acv/i/js/jquery.min.js"></script>';
	$preview = preview_document_for_wordpress( $stored );
	check( 'preview: no /_acv/ left', false, strpos( $preview, '_acv' ) !== false );
	check( 'preview: stylesheet', true, strpos( $preview, 'href="/wp-content/plugins/x.css?ver=1"' ) !== false );
	check( 'preview: escaped rest + ajax', true, strpos( $preview, '"root":"\/wp-json\/","ajax":"\/wp-admin\/admin-ajax.php"' ) !== false );
	check( 'preview: inline fetch', true, strpos( $preview, "fetch('/wp-json/acadvizen/v1/enquiry')" ) !== false );
	$full = preview_document_for_wordpress( '<html><head lang="en"><title>t</title><link href="/_acv/c/a.css"></head><body></body></html>' );
	check( 'preview: sandbox shim is the first thing in <head>', 0, strpos( $full, '<head lang="en"><style>.elementor-invisible' ) - strpos( $full, '<head' ) );
	check( 'preview: shim added once and paths still mapped', array( 1, true ), array( substr_count( $full, 'elementor-invisible' ), false !== strpos( $full, 'href="/wp-content/a.css"' ) ) );
	check( 'preview round-trip: render then preview restores WordPress paths', '<link href="/wp-content/a.css"><script>fetch(\'/wp-json/x/v1/y\')</script>', preview_document_for_wordpress( rewrite_root_relative_paths_for_main( '<link href="/wp-content/a.css"><script>fetch(\'/wp-json/x/v1/y\')</script>' ) ) );

	// --- Approvals & Publishing menu (0.7.8): Approvals first, setup tools last; content types have their own menus ---
	$menu   = array( array( 'Overview', 'c', MENU_SLUG ), array( 'Settings', 'c', MENU_SLUG . '-settings' ), array( 'Other plugin', 'c', 'other.php' ),
		array( 'Publishing status', 'c', MENU_SLUG . '-publishing' ), array( 'Approvals', 'c', APPROVALS_PAGE ), array( 'Main Website', 'c', MAIN_CONTENT_PAGE ) );
	$sorted = array_map( static fn( $r ) => $r[0], sorted_submenu( $menu, admin_menu_order() ) );
	check( 'menu order: Approvals first, then publishing status and Main content, settings and the overview last, unknown rows after', array( 'Approvals', 'Publishing status', 'Main Website', 'Settings', 'Overview', 'Other plugin' ), $sorted );
	$order = admin_menu_order( 'post.php?post=7&action=elementor' );
	$at    = array_search( 'post.php?post=7&action=elementor', $order, true );
	check( 'menu order: Global Styles link is placed with the design items (after Main content, before Website Design)', array( MAIN_CONTENT_PAGE, MENU_SLUG . '-design' ), array( $order[ $at - 1 ], $order[ $at + 1 ] ) );
	check( 'menu order: Approvals is the first item (the top-level link opens it)', APPROVALS_PAGE, $order[0] );
	check( 'standard menus: each content type has its own top-level menu, next to Pages', array( true, 'dashicons-welcome-write-blog', '20.1', true, 'dashicons-admin-tools', '20.4' ), array( standard_menu_args( POST_TYPE )['show_in_menu'], standard_menu_args( POST_TYPE )['menu_icon'], standard_menu_args( POST_TYPE )['menu_position'], standard_menu_args( 'acv_tool' )['show_in_menu'], standard_menu_args( 'acv_tool' )['menu_icon'], standard_menu_args( 'acv_tool' )['menu_position'] ) );
	check( 'standard menus: an unknown type still gets a plain top-level menu (no position forced)', array( true, false ), array( standard_menu_args( 'x' )['show_in_menu'], isset( standard_menu_args( 'x' )['menu_position'] ) ) );
	check( 'global styles: opens Site Settings over an Elementor page (as Elementor does)', 'post.php?post=723&action=elementor&acv-open=global-styles', global_styles_url_for( 723, 10 ) );
	check( 'global styles: no Elementor page yet -> the kit itself', 'post.php?post=10&action=elementor', global_styles_url_for( 0, 10 ) );
	// The small private page Global Styles opens over can never be published by any save.
	$GLOBALS['acv_options'][ GLOBAL_STYLES_CANVAS_OPTION ] = 555;
	check( 'global styles page: Publish keeps it private', 'private', keep_global_styles_canvas_private( array( 'post_status' => 'publish' ), array( 'ID' => 555 ) )['post_status'] );
	check( 'global styles page: can still be trashed', 'trash', keep_global_styles_canvas_private( array( 'post_status' => 'trash' ), array( 'ID' => 555 ) )['post_status'] );
	check( 'global styles page: other pages unaffected', 'publish', keep_global_styles_canvas_private( array( 'post_status' => 'publish' ), array( 'ID' => 556 ) )['post_status'] );
	unset( $GLOBALS['acv_options'][ GLOBAL_STYLES_CANVAS_OPTION ] );

	// --- [acv_faqs schema="…"]: the usual yes spellings all emit FAQPage schema ---
	foreach ( array( 'yes', 'YES', '1', 'true', 'on', ' yes ' ) as $v ) {
		check( "shortcode flag '$v' is yes", true, shortcode_flag( $v ) );
	}
	foreach ( array( 'no', '0', 'false', 'off', '', 'nope' ) as $v ) {
		check( "shortcode flag '$v' is no", false, shortcode_flag( $v ) );
	}

	// --- Elementor autosaves (unpublished edits) never publish; editor saves render once, after saving ---
	$doc = static fn( $post, $autosave = null ) => new class( $post, $autosave ) {
		public function __construct( private $post, private $autosave ) {}
		public function get_main_id() { return 5; }
		public function get_post() { return $this->post; }
		public function is_autosave() { return (bool) $this->autosave; }
	};
	check( 'autosave document (Elementor flag) is skipped', true, is_autosave_document( $doc( new \WP_Post( 77, 'revision' ), true ) ) );
	check( 'autosave document (revision post) is skipped', true, is_autosave_document( new class() { public function get_post() { return new \WP_Post( 77, 'revision' ); } } ) );
	check( 'published page document is not an autosave', false, is_autosave_document( $doc( new \WP_Post( 5 ), false ) ) );
	$GLOBALS['acv_ajax'] = true;
	$_REQUEST['action']  = 'elementor_ajax';
	check( 'Elementor editor save request detected', true, is_elementor_editor_save() );
	$_REQUEST['action'] = 'inline-save';
	check( 'Quick Edit (other ajax) is not an Elementor save', false, is_elementor_editor_save() );
	$GLOBALS['acv_ajax'] = false;
	unset( $_REQUEST['action'] );
	check( 'normal page request is not an Elementor save', false, is_elementor_editor_save() );

	// --- Stalled publish: no job waiting and no activity for STALLED_AFTER seconds -> re-queued ---
	check( 'stall: job still waiting in WP-Cron is never stalled', false, is_render_stalled( 'ev1', array( 'x', 'ev1' ), 0, 10000 ) );
	check( 'stall: job lost and idle for 10 min is stalled', true, is_render_stalled( 'ev1', array( 'x' ), 1000, 1600 ) );
	check( 'stall: job running (touched 60 s ago, no longer waiting) is not stalled', false, is_render_stalled( 'ev1', array(), 1000, 1060 ) );
	check( 'stall: retry scheduled in the future (touch ahead of now) is not stalled', false, is_render_stalled( 'ev1', array(), 1300, 1000 ) );
	check( 'stall: page stuck from before this check existed (no touch time) is stalled', true, is_render_stalled( 'ev1', array(), 0, 1791021687 ) );

	// --- A requested site-wide re-render whose WP-Cron job was lost is run by the stall check ---
	check( 'rerender: nothing requested -> not overdue', false, is_rerender_overdue( null, false, 5000 ) );
	check( 'rerender: job still waiting -> not overdue', false, is_rerender_overdue( array( 'reason' => 'template', 'at' => 1000 ), true, 5000 ) );
	check( 'rerender: requested 60 s ago (job runs after 30 s) -> not overdue yet', false, is_rerender_overdue( array( 'reason' => 'template', 'at' => 1000 ), false, 1060 ) );
	check( 'rerender: requested 3 min ago, no job waiting -> overdue', true, is_rerender_overdue( array( 'reason' => 'template', 'at' => 1000 ), false, 1180 ) );
	$GLOBALS['acv_options'] = array();
	queue_site_rerender( 'template' );
	check( 'rerender: request is recorded outside WP-Cron', 'template', $GLOBALS['acv_options'][ RERENDER_DUE_OPTION ]['reason'] ?? null );
	queue_site_rerender( 'menu' );
	queue_site_rerender( 'global-styles' );
	$all = 0;
	foreach ( _get_cron_array() as $hooks ) {
		$all += count( $hooks[ RERENDER_ALL_HOOK ] ?? array() );
	}
	check( 'rerender: kit + menu + template changes wait as ONE site-wide re-render', 1, $all );

	// --- At most one waiting render job per page in WP-Cron's single stored job list ---
	queue_main_render( 501, 'global', 0 );
	queue_main_render( 501, 'menu', 5 );
	queue_main_render( 502, 'global', 10 );
	$jobs = array();
	foreach ( _get_cron_array() as $hooks ) {
		foreach ( $hooks[ RENDER_HOOK ] ?? array() as $event ) {
			$jobs[] = $event['args'][0];
		}
	}
	sort( $jobs );
	check( 'render jobs: a newer request replaces the waiting job of the same page', array( 501, 502 ), $jobs );

	// --- A page saved during a site-wide re-render goes ahead of the pages still waiting ---
	$GLOBALS['acv_cron'] = array();
	$GLOBALS['acv_cron'][ time() - 600 ][ RENDER_HOOK ]['x'] = array( 'args' => array( 601, 'e1', 1, 'global' ) );
	$GLOBALS['acv_cron'][ time() - 300 ][ RENDER_HOOK ]['y'] = array( 'args' => array( 602, 'e2', 1, 'global' ) );
	queue_main_render( 603, 'save', 0 );
	$order = array();
	$cron  = _get_cron_array();
	ksort( $cron );
	foreach ( $cron as $hooks ) {
		foreach ( $hooks[ RENDER_HOOK ] ?? array() as $event ) {
			$order[] = $event['args'][0];
		}
	}
	check( 'render jobs: a saved page runs before a waiting site-wide re-render', array( 603, 601, 602 ), $order );
	check( 'render jobs: a delayed job keeps its delay', time() + 30, render_job_time( 30 ) );

	// A site-wide re-render started after an editor saved a page leaves that page's job (and its
	// place at the front) alone, and queues the other pages behind it.
	$GLOBALS['acv_cron']     = array();
	$GLOBALS['acv_cron'][ time() - 5 ][ RENDER_HOOK ]['k'] = array( 'args' => array( 702, 'editor-save', 1, 'publish' ) );
	$GLOBALS['acv_post_ids'] = array( 701, 702, 703 );
	run_site_rerender( 'global' );
	$jobs = array();
	foreach ( _get_cron_array() as $hooks ) {
		foreach ( $hooks[ RENDER_HOOK ] ?? array() as $event ) {
			$jobs[ $event['args'][0] ] = $event['args'][1];
		}
	}
	ksort( $jobs );
	check( 'site re-render: the saved page keeps its own waiting job', 'editor-save', $jobs[702] ?? '' );
	check( 'site re-render: the other pages are queued', array( 701, 702, 703 ), array_keys( $jobs ) );
	unset( $GLOBALS['acv_post_ids'] );

	// After each publishing job WP-Cron's runner re-reads its job list instead of writing back an old copy.
	$GLOBALS['acv_cache_deleted'] = array();
	forget_cached_cron_list();
	check( 'cron: the in-memory job list is dropped after a job', array( 'options/alloptions', 'options/cron' ), $GLOBALS['acv_cache_deleted'] );
	$GLOBALS['acv_cache_deleted'] = array();
	check( 'cron: outside a cron run nothing is reloaded', 'x', fresh_cron_list_in_cron_run( 'x' ) . implode( '', $GLOBALS['acv_cache_deleted'] ) );
	$GLOBALS['acv_doing_cron'] = true;
	fresh_cron_list_in_cron_run( null );
	check( 'cron: in a cron run the list is read fresh before a job is removed', array( 'options/alloptions', 'options/cron' ), $GLOBALS['acv_cache_deleted'] );
	unset( $GLOBALS['acv_doing_cron'] );

	// Main Website CSS: a family's marked part survives importing another bundle after it.
	$saved = "base-old
/* acv:blog-typography */
.x{color:red}
/* acv:end */";
	check( 'main css: blog typography kept when the pages bundle is imported after it', "base-new
/* acv:blog-typography */
.x{color:red}
/* acv:end */", merge_main_css( $saved, 'base-new' ) );
	check( 'main css: an incoming marked part replaces the saved one', "base-new
/* acv:blog-typography */.y{}/* acv:end */", merge_main_css( $saved, "base-new
/* acv:blog-typography */.y{}/* acv:end */" ) );

	// Import steps never overlap (two overlapping steps created the same new record twice).
	unset( $GLOBALS['acv_options'][ IMPORT_LOCK_OPTION ] );
	check( 'import lock: the first step takes it', true, acquire_import_lock() );
	check( 'import lock: an overlapping step is refused', false, acquire_import_lock() );
	$busy = run_import_step();
	check( 'import lock: an overlapping request only reports progress', array( false, true, array() ), array( $busy['done'], $busy['busy'] ?? false, $busy['log'] ) );
	$GLOBALS['acv_options'][ IMPORT_LOCK_OPTION ] = (string) ( time() - IMPORT_LOCK_TTL - 5 );
	check( 'import lock: a lock left by a step that died is taken over', true, acquire_import_lock() );
	unset( $GLOBALS['acv_options'][ IMPORT_LOCK_OPTION ] );

	// Optional features are off until wp-config.php turns them on: a first install leaves
	// Enrollment's header/footer choice, sitemaps and login screen as they were.
	$GLOBALS['acv_hooks'] = array();
	register_optional_features();
	check( 'optional features: none registered by default', array(), $GLOBALS['acv_hooks'] );
	check( 'optional features: unknown name is off', false, feature_enabled( 'WEBHOOK_SECRET' ) );
	check( 'native publishing (Publish To boxes, native post types) is hidden unless wp-config.php turns it on', array( false, true ), array( native_publishing_ui(), in_array( 'RENDER_BRIDGE', OPTIONAL_FEATURES, true ) ) );
	check( 'sitemap (default): builder internals stay in Rank Math', false, exclude_main_only_types_from_rank_math( false, 'elementor-hf' ) );
	check( 'sitemap (default): Main-only tools still left out', true, exclude_main_only_types_from_rank_math( false, 'acv_tool' ) );
	check( 'sitemap (default): core sitemap keeps internals, drops Main-only types', array( 'page', 'elementor-hf' ), array_keys( exclude_main_only_types_from_core_sitemap( array( 'page' => 1, 'elementor-hf' => 1, 'acv_blog' => 1 ) ) ) );
	define( 'ACADVIZEN_CMS_SITE_TEMPLATES', true );
	define( 'ACADVIZEN_CMS_SITEMAP_CLEANUP', true );
	define( 'ACADVIZEN_CMS_LOGIN_BRANDING', true );
	register_optional_features();
	check(
		'optional features: turned on, each registers its hooks',
		array( 'hfe_get_settings_type_header', 'hfe_get_settings_type_footer', 'hfe_get_settings_type_before_footer', 'elementor/theme/get_location_templates/template_id', 'wp_loaded', 'login_headerurl', 'login_headertext' ),
		$GLOBALS['acv_hooks']
	);
	unset( $GLOBALS['acv_hooks'] );

	// With SITEMAP_CLEANUP: sitemaps leave out page-builder internals (live Enrollment listed /elementor-hf/header/ etc.).
	foreach ( array( 'elementor-hf', 'popupkit-campaigns', 'metform-form', 'wpr_mega_menu' ) as $internal ) {
		check( "sitemap: {$internal} left out of Rank Math", true, exclude_main_only_types_from_rank_math( false, $internal ) );
	}
	check( 'sitemap: pages stay in Rank Math', false, exclude_main_only_types_from_rank_math( false, 'page' ) );
	check( 'sitemap: core sitemap keeps pages, drops internals', array( 'page', 'post' ), array_keys( exclude_main_only_types_from_core_sitemap( array( 'page' => 1, 'post' => 1, 'elementor-hf' => 1, 'metform-form' => 1 ) ) ) );
	check( 'login logo: says Acadvizen', 'Acadvizen', login_logo_text() );

	// Rank Math's sitemap rules restored when missing from the saved rewrite rules (soft rebuild).
	if ( ! class_exists( '\RankMath\Sitemap\Router' ) ) {
		eval( 'namespace RankMath\Sitemap; class Router {}' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged -- test double.
	}
	$GLOBALS['acv_flushes'] = array();
	$GLOBALS['acv_options']['rewrite_rules'] = array( '^about/?$' => 'index.php?pagename=about' );
	unset( $GLOBALS['acv_transients'][ SITEMAP_RULES_CHECK ] );
	restore_missing_sitemap_rules();
	check( 'sitemap rules: missing Rank Math rule rebuilds once, softly', array( false ), $GLOBALS['acv_flushes'] );
	restore_missing_sitemap_rules();
	check( 'sitemap rules: not checked again within the hour', 1, count( $GLOBALS['acv_flushes'] ) );
	$GLOBALS['acv_flushes'] = array();
	unset( $GLOBALS['acv_transients'][ SITEMAP_RULES_CHECK ] );
	$GLOBALS['acv_options']['rewrite_rules'] = array( 'sitemap_index\.xml$' => 'index.php?sitemap=1' );
	restore_missing_sitemap_rules();
	check( 'sitemap rules: present rule leaves the rules alone', array(), $GLOBALS['acv_flushes'] );
	unset( $GLOBALS['acv_options']['rewrite_rules'], $GLOBALS['acv_transients'][ SITEMAP_RULES_CHECK ] );

	// Media named after a whole sentence gets a name WordPress can store (post_name: 200 characters).
	$long = str_repeat( 'want-more-local-customers-', 10 ) . '1784624402716-4cmrbx.webp';
	check( 'media: a long file name is shortened, extension kept', true, strlen( short_file_name( $long ) ) <= 120 && '.webp' === substr( short_file_name( $long ), -5 ) );
	check( 'media: two long names stay different', true, short_file_name( $long ) !== short_file_name( 'x' . $long ) );
	check( 'media: a short name is kept', 'logo.png', short_file_name( 'logo.png' ) );

	// Main pages: the theme's phone padding is removed; Read more clamps and adds its toggle.
	check( 'main css: theme container padding off on phones too', true, false !== strpos( MAIN_BASE_CSS, 'body #content.site-content .ast-container' ) );
	check( 'read more: clamped to --acv-lines (6 by default) until opened', true, false !== strpos( MAIN_BASE_CSS, '.acv-readmore:not(.is-open) p{display:-webkit-box;-webkit-line-clamp:var(--acv-lines,6)' ) );
	check( 'read more: toggle labels and state', true, false !== strpos( READ_MORE_SCRIPT, "'Read more'" ) && false !== strpos( READ_MORE_SCRIPT, "'Read less'" ) && false !== strpos( READ_MORE_SCRIPT, 'aria-expanded' ) );

	// Read time: an imported article keeps the Main Website's figure until its text is edited.
	$article = new \WP_Post( 705, 'acv_blog', str_repeat( 'word ', 300 ) );
	check( 'read time: counted from the text', 2, reading_minutes( $article ) );
	$GLOBALS['acv_meta'][ 705 ] = array( '_acv_reading_minutes' => '7', '_acv_reading_minutes_for' => md5( $article->post_content ) );
	check( 'read time: the imported Main figure', 7, reading_minutes( $article ) );
	$article->post_content .= ' edited';
	check( 'read time: counted again once the text is edited', 2, reading_minutes( $article ) );
	unset( $GLOBALS['acv_meta'][ 705 ] );

	// A render that a newer save replaced while it ran is not stored as the live version.
	$GLOBALS['acv_meta'][ 704 ]['_acv_render_event'] = 'newer';
	check( 'render: superseded while rendering', true, is_render_superseded( 704, 'older' ) );
	check( 'render: still current', false, is_render_superseded( 704, 'newer' ) );
	unset( $GLOBALS['acv_meta'][ 704 ] );
	$GLOBALS['acv_cron'] = array();

	// --- A design template opened in Elementor must not expand its own content forever ---
	$GLOBALS['acv_current_post'] = new \WP_Post( 8579, 'elementor_library', '<h2>Title</h2>[acv_field name="content"]' );
	check( 'content field: design template shows a placeholder', true, false !== strpos( record_content( $GLOBALS['acv_current_post'] ), 'appears here' ) );
	$GLOBALS['acv_current_post'] = new \WP_Post( 9001, 'acv_location', 'Intro [acv_field name="content"] end' );
	check( 'content field: a record containing its own content field does not recurse', 'Intro  end', record_content( $GLOBALS['acv_current_post'] ) );
	unset( $GLOBALS['acv_current_post'] );

	// --- Header Footer Elementor: a Main-only "entire site" header must not hide Enrollment's own header ---
	$GLOBALS['acv_hfe_matches'] = array( array( 'id' => 7722 ), array( 'id' => 960 ) );
	$GLOBALS['acv_meta'][7722] = array( 'ehf_template_type' => 'type_header', META_TARGET => TARGET_MAIN );
	$GLOBALS['acv_meta'][960]  = array( 'ehf_template_type' => 'type_header', META_TARGET => TARGET_ENROLLMENT );
	check( 'hfe header: Enrollment gets its own header, not the first (Main-only) match', 960, (int) pick_hfe_template_for_site( 7722, 'type_header' ) );
	$GLOBALS['acv_meta'][960][ META_TARGET ] = TARGET_MAIN;
	check( 'hfe header: no Enrollment header at all -> none (theme header)', '', pick_hfe_template_for_site( 7722, 'type_header' ) );
	unset( $GLOBALS['acv_hfe_matches'], $GLOBALS['acv_meta'] );

	// --- Elementor editor preview of a Main page: Main's header and footer, never Enrollment's (and its bar) ---
	if ( ! function_exists( 'is_user_logged_in' ) ) {
		function is_user_logged_in() { return ! empty( $GLOBALS['acv_logged_in'] ); }
	}
	$GLOBALS['acv_hfe_matches'] = array( array( 'id' => 960 ), array( 'id' => 7722 ), array( 'id' => 961 ), array( 'id' => 7723 ) );
	$GLOBALS['acv_meta'][960]   = array( 'ehf_template_type' => 'type_header', META_TARGET => TARGET_BOTH ); // Enrollment header + "ADMISSIONS OPEN" bar
	$GLOBALS['acv_meta'][7722]  = array( 'ehf_template_type' => 'type_header', META_TARGET => TARGET_MAIN );
	$GLOBALS['acv_meta'][961]   = array( 'ehf_template_type' => 'type_footer', META_TARGET => TARGET_BOTH );
	$GLOBALS['acv_meta'][7723]  = array( 'ehf_template_type' => 'type_footer', META_TARGET => TARGET_MAIN );
	$GLOBALS['acv_meta'][8100]  = array( META_TARGET => TARGET_MAIN ); // a Main-only page being edited
	$GLOBALS['acv_meta'][8101]  = array( META_TARGET => TARGET_BOTH ); // a page published to both websites
	$GLOBALS['acv_post_ids']    = array( 7722 ); // main_has_own_chrome(): a published Main-only header exists
	$GLOBALS['acv_caps']        = array( 'edit_post' );
	$GLOBALS['acv_logged_in']   = true;
	$_GET['elementor-preview']  = '8100';
	check( 'editor preview (Main page): Main header, although Enrollment\'s Both header is listed first', 7722, (int) pick_hfe_template_for_site( 960, 'type_header' ) );
	check( 'editor preview (Main page): Main footer', 7723, (int) pick_hfe_template_for_site( 961, 'type_footer' ) );
	check( 'editor preview (Main page): Enrollment\'s Both popup skipped, Main-only popup kept', array( 0, 7722 ), array( pick_theme_builder_template_for_site( 960, 'popup' ), pick_theme_builder_template_for_site( 7722, 'popup' ) ) );
	$_GET['elementor-preview'] = '8101';
	check( 'editor preview (page for Both): Enrollment\'s header, as before', 960, (int) pick_hfe_template_for_site( 960, 'type_header' ) );
	$_GET['elementor-preview'] = '8100';
	$GLOBALS['acv_caps']       = array();
	check( 'editor preview param without edit rights: Enrollment\'s header (no Main chrome for visitors)', 960, (int) pick_hfe_template_for_site( 960, 'type_header' ) );
	$GLOBALS['acv_caps']       = array( 'edit_post' );
	$GLOBALS['acv_logged_in']  = false;
	check( 'editor preview param while logged out: Enrollment\'s header', 960, (int) pick_hfe_template_for_site( 960, 'type_header' ) );
	unset( $_GET['elementor-preview'], $GLOBALS['acv_hfe_matches'], $GLOBALS['acv_meta'], $GLOBALS['acv_post_ids'], $GLOBALS['acv_logged_in'] );
	$GLOBALS['acv_caps'] = array();

	// --- "Hide from search engines" in Master Admin must never be published as "index" ---
	if ( ! function_exists( 'get_queried_object' ) ) {
		function get_queried_object() { return $GLOBALS['acv_queried'] ?? null; }
	}
	$GLOBALS['acv_meta'][8200] = array( META_NOINDEX => '1' );                              // ticked in Master Admin, no Rank Math noindex
	$GLOBALS['acv_meta'][8201] = array( 'rank_math_robots' => array( 'noindex', 'follow' ) ); // Rank Math noindex only
	$GLOBALS['acv_meta'][8202] = array( 'rank_math_robots' => array( 'index', 'follow' ) );   // indexed
	check( 'noindex: Master Admin box alone marks the Main render noindex', true, is_noindex( 8200 ) );
	check( 'noindex: Rank Math noindex still counts', true, is_noindex( 8201 ) );
	check( 'noindex: an indexed page stays indexed', false, is_noindex( 8202 ) );
	$GLOBALS['acv_queried'] = new \WP_Post( 8200 );
	check( 'noindex: the page\'s Rank Math robots tag says noindex, not index', array( 'follow' => 'follow', 'noindex' => 'noindex' ), robots_follow_master_admin_noindex( array( 'index' => 'index', 'follow' => 'follow' ) ) );
	check( 'noindex: WordPress\' own robots tag says noindex too', array( 'follow' => true, 'noindex' => true ), core_robots_follow_master_admin_noindex( array( 'index' => true, 'follow' => true ) ) );
	$GLOBALS['acv_queried'] = new \WP_Post( 8202 );
	check( 'noindex: robots of an indexed page untouched', array( 'index' => 'index', 'follow' => 'follow' ), robots_follow_master_admin_noindex( array( 'index' => 'index', 'follow' => 'follow' ) ) );
	unset( $GLOBALS['acv_meta'], $GLOBALS['acv_queried'] );

	// --- A record drawn by a design chosen for it (the area course pages), others by their type's design ---
	if ( ! function_exists( 'get_post_status' ) ) {
		function get_post_status( $id ) { return $GLOBALS['acv_statuses'][ $id ] ?? 'publish'; }
	}
	$GLOBALS['acv_options'][ DESIGN_TEMPLATES_OPTION ] = array( 'acv_location' => 8800 );
	$GLOBALS['acv_types'][8800] = 'elementor_library'; // Main — Location & service page design
	$GLOBALS['acv_types'][8900] = 'elementor_library'; // Main — Area course page design
	$GLOBALS['acv_types'][8901] = 'page';              // not a design
	$GLOBALS['acv_meta'][9301]  = array( DESIGN_CHOICE_META => '8900' );
	$GLOBALS['acv_meta'][9302]  = array();
	$GLOBALS['acv_meta'][9303]  = array( DESIGN_CHOICE_META => '8901' );
	$GLOBALS['acv_meta'][9304]  = array( DESIGN_CHOICE_META => '8900' );
	$GLOBALS['acv_statuses'][8900] = 'publish';
	check( 'design choice: an area page is drawn by its chosen design', 8900, design_template_for_post( new \WP_Post( 9301, 'acv_location' ) ) );
	check( 'design choice: a location without a choice keeps the type\'s design', 8800, design_template_for_post( new \WP_Post( 9302, 'acv_location' ) ) );
	check( 'design choice: a choice that is not a design template is ignored', 8800, design_template_for_post( new \WP_Post( 9303, 'acv_location' ) ) );
	$GLOBALS['acv_statuses'][8900] = 'draft';
	check( 'design choice: an unpublished chosen design falls back to the type\'s design', 8800, design_template_for_post( new \WP_Post( 9304, 'acv_location' ) ) );
	unset( $GLOBALS['acv_options'][ DESIGN_TEMPLATES_OPTION ], $GLOBALS['acv_types'][8800], $GLOBALS['acv_types'][8900], $GLOBALS['acv_types'][8901], $GLOBALS['acv_meta'], $GLOBALS['acv_statuses'] );

	// --- Site-wide re-render: the homepage and pages first, blog posts last ---
	$GLOBALS['acv_types']   = array( 601 => 'acv_blog', 602 => 'acv_tool', 603 => 'page', 604 => 'page', 605 => 'acv_course' );
	$GLOBALS['acv_targets'][604] = '1'; // 604 is the Main homepage
	check( 'site re-render order: homepage, pages, courses, tools, blogs', array( 604, 603, 605, 602, 601 ), site_rerender_order( array( 601, 602, 603, 604, 605 ) ) );
	unset( $GLOBALS['acv_types'], $GLOBALS['acv_targets'][604] );

	// --- Stored versions are compressed; rows stored before compression still read ---
	$page    = '<!doctype html><html><head><style>' . str_repeat( '.elementor-element{display:flex;--width:100%}', 4000 ) . '</style></head><body>é ✓</body></html>';
	$stored  = encode_version_html( $page );
	check( 'versions: stored compressed', 0, strpos( $stored, HTML_GZ_PREFIX ) );
	check( 'versions: at most a fifth of the size', true, strlen( $stored ) * 5 < strlen( $page ) );
	check( 'versions: read back unchanged', $page, decode_version_html( $stored ) );
	check( 'versions: uncompressed rows still read', '<html>old</html>', decode_version_html( '<html>old</html>' ) );
	check( 'versions: kept per page', 5, VERSIONS_TO_KEEP );

	// --- Rewrite rules for the tool / Main blog addresses are rebuilt when missing ---
	check( 'rewrite: both prefixes present', true, rewrite_rules_cover( array( 'main-blog/([^/]+)/?$', 'tool/([^/]+)/?$' ), array( 'main-blog/', 'tool/' ) ) );
	check( 'rewrite: missing prefix detected', false, rewrite_rules_cover( array( 'tool/([^/]+)/?$' ), array( 'main-blog/', 'tool/' ) ) );

	// --- Widgets showing record fields are never baked into Elementor's element cache ---
	check( 'element cache: heading with [acv_field] is dynamic', true, mark_record_fields_dynamic( false, array( 'settings' => array( 'title' => '[acv_field name="title"]' ) ) ) );
	check( 'element cache: image with #acv-field token is dynamic', true, mark_record_fields_dynamic( false, array( 'settings' => array( 'image' => array( 'url' => '#acv-field-image_url' ) ) ) ) );
	check( 'element cache: plain heading stays cacheable', false, mark_record_fields_dynamic( false, array( 'settings' => array( 'title' => 'Hello' ) ) ) );

	// --- Site Settings (active kit) changes queue a site-wide re-render, whatever saved them ---
	$GLOBALS['acv_scheduled'] = array();
	$GLOBALS['acv_cron']      = array();
	maybe_rerender_for_kit_change( 1, 10, '_elementor_page_settings' );
	check( 'kit settings change queues re-render', array( 'acv_cms_rerender_all' ), array_column( $GLOBALS['acv_scheduled'], 'hook' ) );
	$GLOBALS['acv_scheduled'] = array();
	maybe_rerender_for_kit_change( 1, 77, '_elementor_page_settings' );
	maybe_rerender_for_kit_change( 1, 10, '_edit_lock' );
	check( 'other posts / meta keys ignored', array(), $GLOBALS['acv_scheduled'] );

	// --- Loopback render: follow only the same-URL http -> https upgrade (enroll redirects http) ---
	check( 'https upgrade followed', true, is_https_upgrade_of( 'http://enroll.acadvizen.com/about-us/', 'https://enroll.acadvizen.com/about-us/' ) );
	check( 'other host refused', false, is_https_upgrade_of( 'http://enroll.acadvizen.com/about-us/', 'https://evil.example/about-us/' ) );
	check( 'other path refused', false, is_https_upgrade_of( 'http://enroll.acadvizen.com/about-us/', 'https://enroll.acadvizen.com/wp-login.php' ) );
	check( 'https downgrade refused', false, is_https_upgrade_of( 'https://enroll.acadvizen.com/a/', 'http://enroll.acadvizen.com/a/' ) );
	check( 'look-alike host refused', false, is_https_upgrade_of( 'http://enroll.acadvizen.com/a/', 'https://enroll.acadvizen.com.evil.example/a/' ) );

	// --- Signed visitor IP from the Main Website proxy (config.php + render-bridge.php) ---
	$client_ip = static function ( array $server ) {
		$saved   = $_SERVER;
		$_SERVER = $server + array( 'REMOTE_ADDR' => '76.76.21.21' );
		apply_signed_client_ip();
		$result  = $_SERVER['REMOTE_ADDR'];
		$_SERVER = $saved;
		return $result;
	};
	$now = time();
	$sig = sign_payload( 'client-ip.203.0.113.9', $now, ACADVIZEN_CMS_WEBHOOK_SECRET );
	check( 'valid signed IP applied', '203.0.113.9', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '203.0.113.9', 'HTTP_X_ACADVIZEN_CLIENT_TS' => (string) $now, 'HTTP_X_ACADVIZEN_CLIENT_SIG' => $sig ) ) );
	check( 'other IP with that signature refused', '76.76.21.21', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '198.51.100.1', 'HTTP_X_ACADVIZEN_CLIENT_TS' => (string) $now, 'HTTP_X_ACADVIZEN_CLIENT_SIG' => $sig ) ) );
	check( 'unsigned IP refused', '76.76.21.21', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '203.0.113.9' ) ) );
	$old = $now - 600;
	check( 'expired signature refused', '76.76.21.21', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '203.0.113.9', 'HTTP_X_ACADVIZEN_CLIENT_TS' => (string) $old, 'HTTP_X_ACADVIZEN_CLIENT_SIG' => sign_payload( 'client-ip.203.0.113.9', $old, ACADVIZEN_CMS_WEBHOOK_SECRET ) ) ) );
	check( 'other purpose refused', '76.76.21.21', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '203.0.113.9', 'HTTP_X_ACADVIZEN_CLIENT_TS' => (string) $now, 'HTTP_X_ACADVIZEN_CLIENT_SIG' => sign_payload( 'render.203.0.113.9', $now, ACADVIZEN_CMS_WEBHOOK_SECRET ) ) ) );
	check( 'invalid IP refused', '76.76.21.21', $client_ip( array( 'HTTP_X_ACADVIZEN_CLIENT_IP' => '203.0.113.9<script>', 'HTTP_X_ACADVIZEN_CLIENT_TS' => (string) $now, 'HTTP_X_ACADVIZEN_CLIENT_SIG' => $sig ) ) );

	// --- Production isolation guard (config.php) ---
	$guard = array(
		// A copy of the Enrollment WordPress (staging, backup) never reaches the production Main Website.
		array( 'https://staging.example', 'https://www.acadvizen.com', '', 'blocked' ),
		array( 'https://staging.example', 'https://acadvizen.com/', '', 'blocked' ),
		array( 'https://staging.example', 'https://WWW.Acadvizen.com', '', 'blocked' ),
		array( 'https://staging.example', 'https://staging-main.vercel.app', 'https://www.acadvizen.com', 'blocked' ),
		array( 'https://staging.example', 'https://staging-main.vercel.app', '', 'connected' ),
		array( 'https://staging.example', 'https://www.acadvizen.com.evil.example', '', 'connected' ),
		// The Enrollment WordPress (its own /wp-admin/ is the Master CMS) is the production site.
		array( 'https://enroll.acadvizen.com', 'https://www.acadvizen.com', '', 'connected' ),
		// The retired second CMS address: its old wp-config constants make no other address production.
		array( 'https://cms.acadvizen.com', 'https://www.acadvizen.com', '', 'blocked', 'legacy' ),
		array( 'https://enroll.acadvizen.com', 'https://www.acadvizen.com', '', 'connected', 'legacy' ),
		// Renders and links use the site's own (Enrollment) address only.
		array( 'https://enroll.acadvizen.com', 'https://www.acadvizen.com', '', 'connected https://enroll.acadvizen.com enroll.acadvizen.com', 'info' ),
		array( 'https://staging.example', 'https://staging-main.vercel.app', '', 'connected https://staging.example staging.example', 'info' ),
	);
	// [acv_lead_form]: the Main Website lead form, same endpoint and payload as Main's own form.
	$form = shortcode_lead_form( array( 'form_type' => 'location_enquiry', 'page_slug' => 'seo-course-in-jayanagar', 'message' => 'yes', 'submit' => 'Send "now"' ) );
	check( 'lead form: form type and page', true, false !== strpos( $form, 'data-form-type="location_enquiry" data-page-slug="seo-course-in-jayanagar"' ) );
	check( 'lead form: posts to the Main leads API', true, false !== strpos( $form, "fetch('/api/cms/leads'" ) );
	check( 'lead form: message box when asked', true, false !== strpos( $form, '<textarea name="message"' ) );
	check( 'lead form: labels are escaped', true, false !== strpos( $form, 'Send &quot;now&quot;</button>' ) );
	$second = shortcode_lead_form( array() );
	check( 'lead form: script printed once per page', false, strpos( $second, '<script' ) );
	check( 'lead form: defaults', true, false !== strpos( $second, 'data-form-type="inquiry"' ) && false === strpos( $second, '<textarea' ) );
	check( 'lead form: runs inside Elementor widgets', true, false !== strpos( run_acv_shortcodes_in_widget( 'x [acv_lead_form] y' ), 'class="acv-lead-form"' ) );
	// Rendered for a real record (a page / a course), as during a Main render.
	$GLOBALS['acv_targets'][901]  = '/digital-marketing-courses-koramangala';
	$GLOBALS['acv_targets'][902]  = '/courses/seo-course';
	$GLOBALS['acv_current_post']  = new \WP_Post( 901, 'page' );
	check( 'lead form: page_slug is the page address', true, false !== strpos( shortcode_lead_form( array() ), 'data-page-slug="/digital-marketing-courses-koramangala"' ) );
	$GLOBALS['acv_current_post'] = new \WP_Post( 902, 'acv_course' );
	check( 'lead form: course page_slug as on Main', true, false !== strpos( shortcode_lead_form( array() ), 'data-page-slug="courses/seo-course"' ) );
	unset( $GLOBALS['acv_current_post'] );
	// [acv_loop]: Main's order (newest first, ties by name) and the tools search / category filter.
	check( 'loop: several sort keys', array( 'date' => 'DESC', 'title' => 'ASC' ), loop_orderby( 'date:DESC title:ASC' ) );
	check( 'loop: one sort key kept as is', 'menu_order title', loop_orderby( 'menu_order title' ) );
	$filter = loop_filter_html( 'acv-loop-x', array( 'filter_all' => 'All Categories', 'filter_first' => 'Gen AI', 'filter_groups' => 'Digital Marketing=!Gen AI', 'filter_placeholder' => 'Search tools...', 'filter_count' => 'Showing %1$s of %2$s' ), array( 'SEO', 'Gen AI', 'Ads', 'SEO' ), 4 );
	check( 'loop filter: options in Main order', true, (bool) preg_match( '/value="">All Categories.*value="Gen AI">Gen AI.*value="!Gen AI">Digital Marketing.*value="SEO">SEO.*value="Ads">Ads/', $filter ) );
	check( 'loop filter: each category once', 1, substr_count( $filter, 'value="SEO"' ) );
	check( 'loop filter: count and search box', true, false !== strpos( $filter, 'Showing <strong class="acv-loop-filter__shown">4</strong> of <strong>4</strong>' ) && false !== strpos( $filter, 'placeholder="Search tools..."' ) );

	// The Main contact form: labels shown above the fields, in the Main Website's order.
	$labelled = shortcode_lead_form( array( 'labels' => 'above', 'fields' => 'name,phone,email,message', 'message' => 'yes', 'name_label' => 'Full Name' ) );
	check( 'lead form: labels above the fields', true, false !== strpos( $labelled, '<label class="acv-lead-form__field acv-lead-form__wide"><span>Full Name</span><input name="full_name"' ) );
	check( 'lead form: fields in the given order', true, strpos( $labelled, 'name="phone"' ) < strpos( $labelled, 'name="email"' ) && strpos( $labelled, 'name="email"' ) < strpos( $labelled, 'name="message"' ) );
	// As on Main: phone and email side by side, and the "Fresher / Experienced" choice.
	$paired = shortcode_lead_form( array( 'labels' => 'above', 'fields' => 'name,phone+email,experience,message', 'message' => 'yes' ) );
	check( 'lead form: two fields side by side', 2, substr_count( $paired, '<label class="acv-lead-form__field"><span>' ) );
	check( 'lead form: experience choice with its options', true, false !== strpos( $paired, '<span>Fresher / Experienced</span><select name="experience_level"><option value="Fresher">Fresher</option><option value="Experienced">Experienced</option></select>' ) );
	check( 'lead form: labelled form spacing', true, false !== strpos( $paired, 'class="acv-lead-form acv-lead-form--labels"' ) );
	check( 'lead form: script sends experience_level', true, false !== strpos( LEAD_FORM_SCRIPT, 'p.experience_level=' ) );
	check( 'lead form: a field is listed once', 1, substr_count( shortcode_lead_form( array( 'fields' => 'name,email+name,phone' ) ), 'name="full_name"' ) );
	// The homepage "Quick Registration" popup: learning mode, consent, every field required.
	$popup = shortcode_lead_form( array( 'form_type' => 'registration', 'source' => 'home-popup', 'modes' => 'online:Online,classroom:Classroom', 'consent' => 'I agree to the Privacy Policy and allow Acadvizen to contact me.', 'require_all' => 'yes' ) );
	check( 'lead form: learning mode choices, first selected', true, false !== strpos( $popup, 'name="learning_mode" value="online" checked' ) && false !== strpos( $popup, 'value="classroom" />' ) );
	check( 'lead form: consent checkbox', true, false !== strpos( $popup, 'type="checkbox" name="consent"' ) && false !== strpos( $popup, 'allow Acadvizen to contact me.</span>' ) );
	check( 'lead form: every field required', true, false !== strpos( $popup, 'data-require-all="1"' ) );
	check( 'lead form: script checks consent and sends learning_mode', true, false !== strpos( LEAD_FORM_SCRIPT, 'Please accept the Privacy Policy consent.' ) && false !== strpos( LEAD_FORM_SCRIPT, 'p.learning_mode=' ) );
	// The theme colours h2-h5 directly; Main accordion titles must take the Elementor title colour.
	check( 'main css: accordion title inherits its Elementor colour', true, false !== strpos( MAIN_BASE_CSS, '.elementor .e-n-accordion-item-title-text{color:inherit}' ) );

	// Render Bridge routes (/manifest, /render): only a current signature with the shared secret,
	// over that exact message (render.<path>), is accepted.
	$now    = time();
	$signed = static fn( string $message, int $ts, string $secret = ACADVIZEN_CMS_WEBHOOK_SECRET ) => new \WP_REST_Request( array( 'x_acadvizen_timestamp' => (string) $ts, 'x_acadvizen_signature' => sign_payload( $message, $ts, $secret ) ) );
	check( 'signed routes: unsigned manifest refused', false, is_signed_main_request( new \WP_REST_Request(), 'manifest.' ) );
	check( 'signed routes: signed manifest accepted', true, is_signed_main_request( $signed( 'manifest.', $now ), 'manifest.' ) );
	check( 'signed routes: other secret refused', false, is_signed_main_request( $signed( 'manifest.', $now, str_repeat( 'z', 48 ) ), 'manifest.' ) );
	check( 'signed routes: expired timestamp refused', false, is_signed_main_request( $signed( 'manifest.', $now - 301 ), 'manifest.' ) );
	check( 'signed routes: malformed signature refused', false, is_signed_main_request( new \WP_REST_Request( array( 'x_acadvizen_timestamp' => (string) $now, 'x_acadvizen_signature' => 'v1=zz' ) ), 'manifest.' ) );
	check( 'signed routes: render accepted for its own path', true, is_signed_main_request( $signed( 'render./about', $now ), 'render./about' ) );
	check( 'signed routes: render signature for another path refused', false, is_signed_main_request( $signed( 'render./about', $now ), 'render./admin' ) );
	// Render requests: a publish ("loopback.") and a preview ("preview.") signature each give their
	// own mode; neither can be used for the other, another page, another address or after expiry.
	$render_headers = static fn( string $purpose, int $post_id, string $uri, int $ts, string $sign_path = '' ) => array(
		RENDER_HEADER_POST => (string) $post_id,
		RENDER_HEADER_TS   => (string) $ts,
		RENDER_HEADER_SIG  => sign_payload( $purpose . '.' . $post_id . '.' . ( '' !== $sign_path ? $sign_path : (string) parse_url( $uri, PHP_URL_PATH ) ), $ts, ACADVIZEN_CMS_WEBHOOK_SECRET ),
		'REQUEST_URI'      => $uri,
	);
	check( 'render request: publish signature -> publish mode', array( 42, RENDER_MODE_PUBLISH ), verify_render_request( $render_headers( 'loopback', 42, '/about/', $now ) ) );
	check( 'render request: preview signature -> preview mode', array( 42, RENDER_MODE_PREVIEW ), verify_render_request( $render_headers( 'preview', 42, '/?page_id=42', $now ) ) );
	$other_post                       = $render_headers( 'preview', 42, '/?page_id=42', $now );
	$other_post[ RENDER_HEADER_POST ] = '43';
	check( 'render request: signature for another page refused', array( 0, '' ), verify_render_request( $other_post ) );
	check( 'render request: signature for another address refused', array( 0, '' ), verify_render_request( $render_headers( 'preview', 42, '/secret-draft/', $now, '/about/' ) ) );
	check( 'render request: expired preview refused', array( 0, '' ), verify_render_request( $render_headers( 'preview', 42, '/?page_id=42', $now - 301 ) ) );
	check( 'render request: other purpose (client-ip) refused', array( 0, '' ), verify_render_request( $render_headers( 'client-ip', 42, '/about/', $now ) ) );
	check( 'render request: no headers -> not a render', array( 0, '' ), verify_render_request( array( 'REQUEST_URI' => '/about/' ) ) );
	$draft              = new \WP_Post( 501, 'page' );
	$draft->post_status = 'draft';
	check( 'preview: a draft page can be previewed as on Main', true, can_preview_for_main( $draft ) );
	foreach ( array( 'pending', 'future', 'private', 'publish' ) as $previewable ) {
		$draft->post_status = $previewable;
		check( "preview: {$previewable} page can be previewed", true, can_preview_for_main( $draft ) );
	}
	$draft->post_status = 'trash';
	check( 'preview: a trashed page cannot', false, can_preview_for_main( $draft ) );
	$template              = new \WP_Post( 502, 'elementor_library' );
	$template->post_status = 'draft';
	check( 'preview: a template is not a page to preview', false, can_preview_for_main( $template ) );

	// Main Website content screen: roles decide the statuses offered; values are cleaned before sending.
	$GLOBALS['acv_caps'] = array( 'edit_posts' );
	check( 'main content: an author can only draft or submit a blog for review', array( 'draft', 'review' ), main_allowed_statuses( 'blogs' ) );
	$GLOBALS['acv_caps'] = array( 'edit_posts', 'edit_others_posts', 'publish_posts', 'edit_pages', 'edit_others_pages', 'publish_pages' );
	check( 'main content: an editor can approve, publish and archive', array( 'draft', 'review', 'approved', 'published', 'archived' ), main_allowed_statuses( 'pages' ) );
	check( 'main content: deleting needs its own capability', false, main_can( 'pages', 'delete' ) );
	// "Enrollment only" blogs: the Main record is always a draft, so the editor sees (and keeps) the
	// Enrollment copy's status. Found on production: a second save unpublished the Enrollment copy.
	$editor = array( 'draft', 'review', 'approved', 'published', 'archived' );
	$author = array( 'draft', 'review' );
	check( 'enrollment only: the editor sees the live copy as Published, not the Main draft', 'published', main_blog_display_status( TARGET_ENROLLMENT, 'draft', 'published' ) );
	check( 'enrollment only: without a copy the Main status is shown', 'draft', main_blog_display_status( TARGET_ENROLLMENT, 'draft', '' ) );
	check( 'main / both: the Main status is shown', array( 'published', 'draft' ), array( main_blog_display_status( TARGET_MAIN, 'published', 'draft' ), main_blog_display_status( TARGET_BOTH, 'draft', 'published' ) ) );
	check( 'enrollment only: saving again with Published keeps the copy published', 'published', enrollment_status_for_save( TARGET_ENROLLMENT, 'published', true, $editor, 'draft', 'published' ) );
	check( 'enrollment only: a save without a status keeps the copy as it is (the regression)', 'published', enrollment_status_for_save( TARGET_ENROLLMENT, '', true, $editor, 'draft', 'published' ) );
	check( 'enrollment only: choosing Draft explicitly takes it off Enrollment', 'draft', enrollment_status_for_save( TARGET_ENROLLMENT, 'draft', true, $editor, 'draft', 'published' ) );
	check( 'enrollment only: an author cannot publish; the copy stays as it is', array( 'draft', 'published' ), array( enrollment_status_for_save( TARGET_ENROLLMENT, 'published', false, $author, 'draft', 'draft' ), enrollment_status_for_save( TARGET_ENROLLMENT, 'archived', false, $author, 'draft', 'published' ) ) );

	// Error messages shown to the editor (main_error_text).
	check( 'error text: a code from Main is translated', 'This address is already used by another record.', main_error_text( array( 'ok' => false, 'status' => 409, 'body' => array( 'error' => 'slug_taken' ), 'error' => '' ) ) );
	check( 'error text: a local code (no response body) is translated too', 'The connection to the Main Website is not set up (shared secret or address missing).', main_error_text( array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => 'not_configured' ) ) );
	$unreachable = main_error_text( array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => 'http_request_failed: cURL error 7: Failed to connect' ) );
	check( 'error text: Main unreachable says nothing changed and to try again, keeping the detail', true, 0 === strpos( $unreachable, 'The Main Website could not be reached, so nothing was changed there.' ) && false !== strpos( $unreachable, '(http_request_failed: cURL error 7' ) );
	check( 'error text: an unknown code from Main is shown as it is', 'some_new_code', main_error_text( array( 'ok' => false, 'status' => 400, 'body' => array( 'error' => 'some_new_code' ), 'error' => '' ) ) );
	check( 'error text: an HTTP failure without a code keeps the detail', 'HTTP 502', main_error_text( array( 'ok' => false, 'status' => 502, 'body' => array(), 'error' => 'HTTP 502' ) ) );
	check( 'error text: nothing at all', 'The Main Website did not answer.', main_error_text( array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => '' ) ) );
	check( 'error text: edit conflict says nothing was overwritten and what to do', true, 0 === strpos( main_error_text( array( 'ok' => false, 'status' => 409, 'body' => array( 'error' => 'edit_conflict' ), 'error' => '' ) ), 'Not saved: someone changed this on the Main Website' ) );

	// One blog on both websites (blog-sync.php).
	check( 'sync: same instant across offsets and fractions', array( true, true, false, true, false ), array(
		same_instant( '2026-10-13T05:36:13.229+00:00', '2026-10-13T05:36:13.229Z' ),
		same_instant( '2026-10-13T11:06:13.229+05:30', '2026-10-13 05:36:13.229+00' ),
		same_instant( '2026-10-13T05:36:13.229Z', '2026-10-13T05:36:13.230Z' ),
		same_instant( '', '' ),
		same_instant( '', '2026-10-13T05:36:13Z' ),
	) );
	check( 'sync: fingerprint ignores whitespace differences, not content', array( true, false ), array(
		copy_fingerprint( 'T', 'E', "<p>a  b</p>\n" ) === copy_fingerprint( 'T', 'E', '<p>a b</p>' ),
		copy_fingerprint( 'T', 'E', '<p>a b</p>' ) === copy_fingerprint( 'T', 'E', '<p>a c</p>' ),
	) );
	$aligned = array( 'version' => '2026-10-13T05:00:00Z', 'hash' => 'h1', 'current' => 'h1', 'status' => 'publish' );
	check( 'sync: Main unchanged -> nothing to do', 'none', blog_pull_action( array( 'updated_at' => '2026-10-13T05:00:00.000+00:00' ), $aligned ) );
	check( 'sync: Main changed, copy untouched -> update the copy', 'update', blog_pull_action( array( 'updated_at' => '2026-10-13T06:00:00Z' ), $aligned ) );
	check( 'sync: Main changed and the copy changed here too -> conflict (nothing overwritten)', 'conflict', blog_pull_action( array( 'updated_at' => '2026-10-13T06:00:00Z' ), array_merge( $aligned, array( 'current' => 'h2' ) ) ) );
	check( 'sync: a copy never aligned (no fingerprint) is not overwritten', 'conflict', blog_pull_action( array( 'updated_at' => '2026-10-13T06:00:00Z' ), array_merge( $aligned, array( 'hash' => '' ) ) ) );
	check( 'sync: removed or trashed on Main -> live copy set to draft, never deleted', array( 'unpublish_copy', 'unpublish_copy', 'none' ), array(
		blog_pull_action( array(), $aligned ),
		blog_pull_action( array( 'updated_at' => '2026-10-13T06:00:00Z', 'deleted_at' => '2026-10-13T06:00:00Z' ), $aligned ),
		blog_pull_action( array(), array_merge( $aligned, array( 'status' => 'draft' ) ) ),
	) );
	$converted = post_html_to_main_blocks( '<figure class="wp-block-image"><img src="https://example.com/cover.jpg" alt="" /></figure><!-- wp:heading --><h2>Intro</h2><!-- /wp:heading --><p>Bold <strong>text</strong> and a <a href="https://example.com">link</a>.</p><ul><li>One</li><li><em>Two</em></li></ul><figure><img src="https://example.com/a.jpg" alt="Alt"><figcaption>Cap</figcaption></figure><h1>Top</h1><h6>Small</h6>', 'https://example.com/cover.jpg' );
	check( 'sync: editor HTML -> Main blocks keeps inline formatting, drops the leading cover', array(
		array( 'block_type' => 'heading', 'content_json' => array( 'text' => 'Intro', 'level' => 2 ) ),
		array( 'block_type' => 'paragraph', 'content_json' => array( 'text' => 'Bold <strong>text</strong> and a <a href="https://example.com">link</a>.' ) ),
		array( 'block_type' => 'list', 'content_json' => array( 'items' => array( 'One', '<em>Two</em>' ) ) ),
		array( 'block_type' => 'image', 'content_json' => array( 'src' => 'https://example.com/a.jpg', 'alt' => 'Alt', 'caption' => 'Cap' ) ),
		array( 'block_type' => 'heading', 'content_json' => array( 'text' => 'Top', 'level' => 2 ) ),
		array( 'block_type' => 'heading', 'content_json' => array( 'text' => 'Small', 'level' => 4 ) ),
	), $converted['blocks'] );
	check( 'sync: nothing unsupported in that article', array(), $converted['skipped'] );
	$odd = post_html_to_main_blocks( '<p>Text</p>[gallery ids="1,2"]<table><tr><td>x</td></tr></table><iframe src="https://www.youtube.com/embed/x"></iframe><blockquote>Said</blockquote><div class="wp-block-group"><p>Inside</p></div>' );
	check( 'sync: unsupported content is reported, groups are opened, quotes become paragraphs', array(
		array( 'Text', '<em>Said</em>', 'Inside' ),
		array( 'shortcode [gallery]', 'table', 'iframe', 'quote shown as a paragraph' ),
	), array( array_map( static fn( $b ) => $b['content_json']['text'], $odd['blocks'] ), $odd['skipped'] ) );
	check( 'sync: a cover image that is not first stays in the article', 2, count( post_html_to_main_blocks( '<p>x</p><figure><img src="https://example.com/cover.jpg"></figure>', 'https://example.com/cover.jpg' )['blocks'] ) );

	// Approval: exact revision fingerprints (approval.php).
	$parts = array( 'title' => 'T', 'meta' => array( '_elementor_data' => '[1]', '_thumbnail_id' => '5' ), 'media' => array( 5 => 'a.jpg:10:1' ) );
	check( 'approval: the fingerprint ignores key order', revision_fingerprint( $parts ), revision_fingerprint( array( 'media' => array( 5 => 'a.jpg:10:1' ), 'meta' => array( '_thumbnail_id' => '5', '_elementor_data' => '[1]' ), 'title' => 'T' ) ) );
	check( 'approval: any change (design, media file, title) changes the fingerprint', array( false, false, false ), array(
		revision_fingerprint( $parts ) === revision_fingerprint( array_replace_recursive( $parts, array( 'meta' => array( '_elementor_data' => '[2]' ) ) ) ),
		revision_fingerprint( $parts ) === revision_fingerprint( array_replace_recursive( $parts, array( 'media' => array( 5 => 'a.jpg:11:1' ) ) ) ),
		revision_fingerprint( $parts ) === revision_fingerprint( array_replace( $parts, array( 'title' => 'T2' ) ) ),
	) );
	check( 'approval: referenced media are found anywhere in the design, plus the featured image', array( 3, 7, 9, 12 ), referenced_attachment_ids( array( array( 'settings' => array( 'image' => array( 'id' => 7, 'url' => 'x.jpg' ), 'background_image' => array( 'id' => '3', 'url' => 'b.jpg' ) ), 'elements' => array( array( 'settings' => array( 'gallery' => array( array( 'id' => 9, 'url' => 'g.jpg' ), array( 'id' => 7, 'url' => 'x.jpg' ) ), 'link' => array( 'id' => 'abc', 'url' => '/' ) ) ) ) ) ), 12 ) );

	check( 'approval: SEO fields are part of a revision; scores and analytics the SEO plugin recalculates are not', array( true, true, true, true, true, true, false, false, false ), array_map( 'Acadvizen\CMS\is_revision_seo_key', array( 'rank_math_title', 'rank_math_description', 'rank_math_canonical_url', 'rank_math_robots', 'rank_math_facebook_title', '_acv_json_ld', 'rank_math_seo_score', 'rank_math_internal_links_processed', '_edit_lock' ) ) );

	check( 'import: a bundle item with an empty design is never imported over an existing one; items without a design are content-only', array( true, false, false ), array( bundle_design_is_empty( array( 'elementor_data' => array() ) ), bundle_design_is_empty( array( 'elementor_data' => array( array( 'elType' => 'container' ) ) ) ), bundle_design_is_empty( array( 'content' => 'x' ) ) ) );

	// Media guard and imported media titles (0.7.7).
	check( 'media: nothing published uses it -> deleted; in use -> refused for a person, kept quietly for the plugin\'s own clean-up', array( 'allow', 'refuse', 'keep' ), array( media_delete_decision( array(), false ), media_delete_decision( array( 12 ), false ), media_delete_decision( array( 12, 13 ), true ) ) );
	check( 'media: the internal flag is off by default and can be set and cleared', array( false, true, false ), array( media_guard_internal(), media_guard_internal( true ), media_guard_internal( false ) ) );
	check( 'import: an imported file gets a recognisable title (title, else alt text, else the tidied file name)', array( 'Main Website: Hero banner', 'Main Website: Students at work', 'Main Website: Digital marketing course' ), array( imported_media_title( array( 'title' => 'Hero banner', 'alt' => 'x' ), 'a.webp' ), imported_media_title( array( 'alt' => 'Students at work' ), 'a.webp' ), imported_media_title( array(), 'digital-marketing-course-1791348892158-5vjuov.webp' ) ) );

	// Approval state machine.
	$ctx  = static fn( array $extra = array() ) => array_merge( array( 'hash' => 'h1', 'user' => 2, 'time' => 100, 'can_review' => false, 'compat' => 'ok' ), $extra );
	$sub  = approval_transition( array(), 'submit', $ctx() );
	check( 'approval: submit makes it pending for exactly that revision', array( 'pending', 'h1', 2 ), array( $sub['state'], $sub['hash'], $sub['submitted_by'] ) );
	check( 'approval: only a reviewer approves', 'not_reviewer', approval_transition( $sub, 'approve', $ctx() ) );
	check( 'approval: a revision changed after submitting cannot be approved', 'changed_since_submitted', approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'hash' => 'h2' ) ) ) );
	check( 'approval: the queue marks a waiting or approved submission stale once the current fingerprint differs (e.g. a kit change); drafts, rejected and unchanged ones are not stale', array( true, false, true, false, false, false ), array( submission_is_stale( $sub, 'h2' ), submission_is_stale( $sub, 'h1' ), submission_is_stale( array( 'state' => 'approved', 'hash' => 'h1' ), 'h3' ), submission_is_stale( array( 'state' => 'rejected', 'hash' => 'h1' ), 'h3' ), submission_is_stale( array(), 'h3' ), submission_is_stale( array( 'state' => 'pending', 'hash' => '' ), 'h3' ) ) );
	$re = approval_transition( $sub, 'submit', $ctx( array( 'hash' => 'h2', 'time' => 200 ) ) );
	check( 'approval: submitting the current version again replaces the stale one: pending for the new fingerprint, then approvable', array( 'pending', 'h2', 200, 'approved' ), array( $re['state'], $re['hash'], $re['submitted_at'], approval_transition( $re, 'approve', $ctx( array( 'can_review' => true, 'hash' => 'h2' ) ) )['state'] ?? '' ) );
	$app  = approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'user' => 3 ) ) );
	check( 'approval: a reviewer approves exactly the submitted revision', array( 'approved', 'h1', 3, false ), array( $app['state'], $app['hash'], $app['reviewed_by'], $app['self_approved'] ) );
	check( 'approval: self-approval is recorded as such', true, approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'user' => 2 ) ) )['self_approved'] );
	$inv  = approval_transition( $app, 'edited', $ctx( array( 'hash' => 'h2' ) ) );
	check( 'approval: any edit after approval invalidates it', array( 'draft', true ), array( $inv['state'], $inv['invalidated'] ) );
	check( 'approval: saving without a change keeps the approval', 'approved', approval_transition( $app, 'edited', $ctx() )['state'] );
	$sch = approval_transition( $app, 'schedule', $ctx( array( 'at' => 5000 ) ) );
	check( 'approval: only an approved, unchanged revision can be scheduled', array( 'scheduled', 5000, 'not_approved', 'changed_since_approved' ), array( $sch['state'], $sch['scheduled_for'], approval_transition( $sub, 'schedule', $ctx( array( 'at' => 5000 ) ) ), approval_transition( $app, 'schedule', $ctx( array( 'hash' => 'h9', 'at' => 5000 ) ) ) ) );
	check( 'approval: a scheduled revision is not published early, only by its due job', array( 'already_scheduled', 'publishing' ), array( approval_transition( $sch, 'publish', $ctx() ), approval_transition( $sch, 'publish', $ctx( array( 'due' => true ) ) )['state'] ) );
	check( 'approval: an edit cancels a schedule; an unchanged save keeps it; cancelling returns to approved', array( 'draft', 'scheduled', 'approved', 'not_scheduled' ), array( approval_transition( $sch, 'edited', $ctx( array( 'hash' => 'h2' ) ) )['state'], approval_transition( $sch, 'edited', $ctx() )['state'], approval_transition( $sch, 'unschedule', $ctx() )['state'], approval_transition( $app, 'unschedule', $ctx() ) ) );
	check( 'approval: a due job still refuses a revision that changed', 'changed_since_approved', approval_transition( $sch, 'publish', $ctx( array( 'due' => true, 'hash' => 'h2' ) ) ) );
	check( 'approval: submitting the approved revision again (e.g. a re-import) keeps the approval; a changed one needs a new one', array( 'approved', 'pending' ), array( approval_transition( $app, 'submit', $ctx() )['state'], approval_transition( $app, 'submit', $ctx( array( 'hash' => 'h2' ) ) )['state'] ) );
	check( 'approval: an invalidated revision cannot be published', 'not_approved', approval_transition( $inv, 'publish', $ctx( array( 'hash' => 'h2' ) ) ) );
	check( 'approval: publishing checks the revision once more', 'changed_since_approved', approval_transition( $app, 'publish', $ctx( array( 'hash' => 'h3' ) ) ) );
	check( 'approval: the approved revision publishes', 'publishing', approval_transition( $app, 'publish', $ctx() )['state'] );
	check( 'approval: a design that cannot be reproduced is refused at every step', array( 'blocked_widgets', 'blocked_widgets', 'blocked_widgets' ), array(
		approval_transition( array(), 'submit', $ctx( array( 'compat' => 'blocked' ) ) ),
		approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'compat' => 'blocked' ) ) ),
		approval_transition( $app, 'publish', $ctx( array( 'compat' => 'blocked' ) ) ),
	) );
	check( 'approval: typed code needs a reviewer who confirms it', array( 'code_needs_review', 'approved' ), array(
		approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'compat' => 'code' ) ) ),
		approval_transition( $sub, 'approve', $ctx( array( 'can_review' => true, 'compat' => 'code', 'code_ok' => true ) ) )['state'],
	) );
	$both = $ctx( array( 'can_review' => true, 'user' => 3, 'destinations' => array( 'main', 'enrollment' ) ) );
	check( 'approval: for Both, the reviewer must confirm the preview of each website', array( 'previews_not_checked', 'previews_not_checked', 'approved' ), array(
		approval_transition( $sub, 'approve', $both ),
		approval_transition( $sub, 'approve', array_merge( $both, array( 'previews' => array( 'main' ) ) ) ),
		approval_transition( $sub, 'approve', array_merge( $both, array( 'previews' => array( 'enrollment', 'main' ) ) ) )['state'],
	) );
	check( 'approval: the approval records the websites and the previews checked', array( array( 'main', 'enrollment' ), array( 'enrollment', 'main' ) ), array_values( array_intersect_key( approval_transition( $sub, 'approve', array_merge( $both, array( 'previews' => array( 'enrollment', 'main' ) ) ) ), array_flip( array( 'destinations', 'previews_checked' ) ) ) ) );
	check( 'approval: rejection goes back to the editor with a note', array( 'rejected', 'Fix the hero' ), array( approval_transition( $sub, 'reject', $ctx( array( 'can_review' => true, 'note' => 'Fix the hero' ) ) )['state'], approval_transition( $sub, 'reject', $ctx( array( 'can_review' => true, 'note' => 'Fix the hero' ) ) )['note'] ) );
	check( 'approval: history keeps every step', array( 'submitted', 'approved', 'approval_invalidated_by_edit' ), array_column( $inv['history'], 'what' ) );

	// The Approvals screen must include old items, keep query order, and scan once for both state groups.
	$approval_query_ids = range( 2120, 2001 );
	$approval_query_ids[] = 2118;
	$approval_query_ids[] = 2002;
	$GLOBALS['acv_post_ids']        = $approval_query_ids;
	$GLOBALS['acv_meta']            = array();
	$GLOBALS['acv_get_posts_calls'] = array();
	foreach ( array_unique( $approval_query_ids ) as $id ) {
		$GLOBALS['acv_meta'][ $id ][ APPROVAL_META ] = array( 'state' => 'rejected' );
	}
	$GLOBALS['acv_meta'][2118][APPROVAL_META] = array( 'state' => 'pending' );
	$GLOBALS['acv_meta'][2090][APPROVAL_META] = array( 'state' => 'approved' );
	$GLOBALS['acv_meta'][2002][APPROVAL_META] = array( 'state' => 'pending' );
	$GLOBALS['acv_meta'][2003][APPROVAL_META] = array( 'state' => 'scheduled' );
	$GLOBALS['acv_meta'][2001][APPROVAL_META] = array( 'state' => 'approved' );
	$pending_approval_ids = approval_candidates( array( 'pending' ) );
	$ready_approval_ids   = approval_candidates( array( 'approved', 'scheduled' ) );
	check( 'approval candidates: pending documents older than the first 100 remain in query order', array( 2118, 2002 ), $pending_approval_ids );
	check( 'approval candidates: approved and scheduled documents older than the first 100 remain in query order', array( 2090, 2003, 2001 ), $ready_approval_ids );
	check( 'approval candidates: duplicate IDs are returned once, preserving first occurrence', true, $pending_approval_ids === array( 2118, 2002 ) && count( $pending_approval_ids ) === count( array_unique( $pending_approval_ids ) ) );
	check( 'approval candidates: one ID-only, no-count unbounded scan serves both lists', array( 1, -1, true, 'ids', APPROVAL_META, 'EXISTS' ), array( count( $GLOBALS['acv_get_posts_calls'] ), $GLOBALS['acv_get_posts_calls'][0]['posts_per_page'], $GLOBALS['acv_get_posts_calls'][0]['no_found_rows'], $GLOBALS['acv_get_posts_calls'][0]['fields'], $GLOBALS['acv_get_posts_calls'][0]['meta_key'], $GLOBALS['acv_get_posts_calls'][0]['meta_compare'] ) );

	// Publication outcome per website.
	check( 'publication: success only when every chosen website shows the revision', array( 'verified', 'publishing', 'partial_failure', 'failed', 'partial_failure' ), array(
		publication_outcome( array( 'main' => array( 'state' => 'verified' ), 'enrollment' => array( 'state' => 'verified' ) ), false ),
		publication_outcome( array( 'main' => array( 'state' => 'pending' ), 'enrollment' => array( 'state' => 'verified' ) ), false ),
		publication_outcome( array( 'main' => array( 'state' => 'failed' ), 'enrollment' => array( 'state' => 'verified' ) ), false ),
		publication_outcome( array( 'main' => array( 'state' => 'failed' ) ), true ),
		publication_outcome( array( 'main' => array( 'state' => 'pending' ), 'enrollment' => array( 'state' => 'verified' ) ), true ),
	) );
	check( 'publication: the public mark is a short, stable form of the revision', 'acv-revision:0123456789abcdef', revision_mark( '0123456789abcdef0123' ) );

	// Widget compatibility (registry.php).
	$design    = array( array( 'elType' => 'container', 'settings' => array( '__dynamic__' => array( 'title' => 'x' ) ), 'elements' => array(
		array( 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => array(), 'elements' => array() ),
		array( 'elType' => 'container', 'settings' => array( 'custom_css' => 'selector{color:red}' ), 'elements' => array( array( 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => array( '_animation' => 'fadeIn' ) ), array( 'elType' => 'widget', 'widgetType' => 'html', 'settings' => array() ) ) ),
	) ) );
	$usage     = document_widget_usage( $design );
	check( 'registry: widget usage is counted through nested containers', array( 'heading' => 2, 'html' => 1 ), $usage['widgets'] );
	check( 'registry: page features worth a look are listed', array( 'attributes' => false, 'custom_css' => true, 'dynamic' => true, 'motion' => true ), array( 'attributes' => isset( $usage['features']['attributes'] ), 'custom_css' => isset( $usage['features']['custom_css'] ), 'dynamic' => isset( $usage['features']['dynamic'] ), 'motion' => isset( $usage['features']['motion'] ) ) );
	$installed = array( 'heading' => array( 'provider' => 'elementor', 'version' => '4.3.4' ), 'html' => array( 'provider' => 'elementor', 'version' => '4.3.4' ), 'woocommerce-products' => array( 'provider' => 'elementor-pro', 'version' => '4.3.1' ), 'login' => array( 'provider' => 'elementor-pro', 'version' => '4.3.1' ), 'form' => array( 'provider' => 'elementor-pro', 'version' => '4.3.1' ), 'mf-text' => array( 'provider' => 'metform', 'version' => '4.3.2' ), 'odd-widget' => array( 'provider' => 'some-addon', 'version' => '1.0' ) );
	check( 'registry: per widget and website', array(
		'missing'        => 'blocked',
		'heading main'   => 'ok',
		'html'           => 'code',
		'shop on main'   => 'blocked',
		'shop on enroll' => 'ok',
		'login on main'  => 'blocked',
		'form on main'   => 'ok',
		'metform main'   => 'ok',
		'addon on main'  => 'review',
		'addon enroll'   => 'ok',
	), array(
		'missing'        => classify_widget( 'pro-only', null, 'enrollment' )['status'],
		'heading main'   => classify_widget( 'heading', $installed['heading'], 'main' )['status'],
		'html'           => classify_widget( 'html', $installed['html'], 'enrollment' )['status'],
		'shop on main'   => classify_widget( 'woocommerce-products', $installed['woocommerce-products'], 'main' )['status'],
		'shop on enroll' => classify_widget( 'woocommerce-products', $installed['woocommerce-products'], 'enrollment' )['status'],
		'login on main'  => classify_widget( 'login', $installed['login'], 'main' )['status'],
		'form on main'   => classify_widget( 'form', $installed['form'], 'main' )['status'],
		'metform main'   => classify_widget( 'mf-text', $installed['mf-text'], 'main' )['status'],
		'addon on main'  => classify_widget( 'odd-widget', $installed['odd-widget'], 'main' )['status'],
		'addon enroll'   => classify_widget( 'odd-widget', $installed['odd-widget'], 'enrollment' )['status'],
	) );
	check( 'registry: a missing widget explains the fix', true, false !== strpos( classify_widget( 'pro-only', null, 'main' )['fix'], 'activate the plugin' ) );
	check( 'registry: report takes the worst class over widgets, websites and features', array( 'code', 'blocked' ), array(
		compatibility_report( $design, array( 'enrollment', 'main' ), $installed )['status'],
		compatibility_report( array( array( 'elType' => 'widget', 'widgetType' => 'woocommerce-products' ) ), array( 'enrollment', 'main' ), $installed )['status'],
	) );
	$styled = array( array( 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => array( 'custom_css' => 'selector{max-width:768px}', 'motion_fx_motion_fx_scrolling' => 'yes' ) ) );
	$with_pro    = compatibility_report( $styled, array( 'main' ), $installed, true );
	$without_pro = compatibility_report( $styled, array( 'main' ), $installed, false );
	check( 'registry: Pro-only element settings are flagged, and said plainly NOT SHOWN when Pro is not active (never silently dropped)', array( 'review', 0, 2 ), array( $without_pro['status'], count( preg_grep( '/NOT SHOWN/', $with_pro['features'] ) ), count( preg_grep( '/NOT SHOWN, Elementor Pro is not active/', $without_pro['features'] ) ) ) );
	// Main's title pattern for pages drawn for Main without their own SEO title.
	check( 'main title: "Title | Acadvizen", as Main titles its pages', 'Master Admin Blog Check | Acadvizen', main_document_title( 'Master Admin Blog Check' ) );
	check( 'main title: already Main-style titles are kept once (never doubled)', 'Adobe XD | Acadvizen', main_document_title( 'Adobe XD | Acadvizen' ) );
	check( 'main title: entities decoded before the suffix', 'SEO & Ads | Acadvizen', main_document_title( 'SEO &amp; Ads' ) );
	// Designs referring to designs (a page design's loop draws a card): the card is imported first.
	$loop = array( array( 'elType' => 'widget', 'widgetType' => 'shortcode', 'settings' => array( 'shortcode' => '[acv_loop type="acv_blog" template="acv-template://card-blog" limit="3"]' ) ) );
	check( 'import: design references are read from loops', array( 'card-blog' ), template_refs( $loop ) );
	$ordered = templates_in_dependency_order( array( array( 'key' => 'main-header', 'elementor_data' => array() ), array( 'key' => 'design-blog', 'elementor_data' => $loop ), array( 'key' => 'card-blog', 'elementor_data' => array() ), array( 'key' => 'design-location', 'elementor_data' => array() ) ) );
	check( 'import: a card comes before the design whose loop draws it; otherwise bundle order', array( 'main-header', 'card-blog', 'design-blog', 'design-location' ), array_column( $ordered, 'key' ) );
	$cycle = templates_in_dependency_order( array( array( 'key' => 'a', 'elementor_data' => array( 'acv-template://b' ) ), array( 'key' => 'b', 'elementor_data' => array( 'acv-template://a' ) ) ) );
	check( 'import: designs referring to each other are each imported once (no endless loop)', 2, count( $cycle ) );
	check( 'import: a design found nowhere is reported, never silent', true, false !== strpos( missing_refs_note( array( 'card-blog' ) ), 'PROBLEM: refers to design(s) card-blog' ) );
	// Robots: a migrated page publishes exactly the Main page's robots tag.
	$empty_adv = array( 'max-snippet' => '', 'max-video-preview' => '', 'max-image-preview' => '' );
	check( 'robots: "index, follow" from Main prints no Rank Math max-snippet… defaults', array( 'robots' => array( 'index', 'follow' ), 'advanced' => $empty_adv ), robots_meta_from( 'index, follow' ) );
	check( 'robots: noindex and max directives kept', array( 'robots' => array( 'noindex', 'nofollow' ), 'advanced' => array( 'max-snippet' => '-1', 'max-video-preview' => '', 'max-image-preview' => 'large' ) ), robots_meta_from( 'noindex, nofollow, max-snippet:-1, max-image-preview:large' ) );
	check( 'robots: unknown words ignored, index/follow implied', array( 'index', 'follow' ), robots_meta_from( 'all, whatever' )['robots'] );
	// Popups: Elementor Pro must be loaded and have registered its 'popup' document type with Elementor.
	check( 'popup: drawable when Pro is loaded and registered the popup type', '', popup_blocker( true, array( 'post' => 'X', 'popup' => 'ElementorPro\\Modules\\Popup\\Document' ) ) );
	check( 'popup: blocked, plainly, when Pro is not active', 'popups need Elementor Pro, which is not active on this WordPress', popup_blocker( false, array( 'popup' => 'X' ) ) );
	check( 'popup: blocked when Pro is installed but its popup type is not registered (Pro did not finish loading)', true, false !== strpos( popup_blocker( true, array( 'post' => 'X', 'section' => 'Y' ) ), 'popup feature is not loaded' ) );
	check( 'registry: a plain design for Both is ok', 'ok', compatibility_report( array( array( 'elType' => 'container', 'elements' => array( array( 'elType' => 'widget', 'widgetType' => 'heading' ) ) ) ), array( 'enrollment', 'main' ), $installed )['status'] );
	check( 'enrollment only: first publish of a new blog', 'published', enrollment_status_for_save( TARGET_ENROLLMENT, 'published', true, $editor, 'draft', '' ) );
	check( 'main / both: the copy follows the Main record', array( 'published', 'draft' ), array( enrollment_status_for_save( TARGET_BOTH, '', true, $editor, 'published', 'draft' ), enrollment_status_for_save( TARGET_MAIN, 'published', true, $editor, 'draft', 'published' ) ) );
	check( 'restoring a version keeps an Enrollment-only copy published', 'published', enrollment_status_for_save( TARGET_ENROLLMENT, '', false, array(), 'draft', 'published' ) );
	// The blog's "Hide from search engines" reaches the Enrollment copy (it was published index, follow).
	check( 'enrollment copy: a noindex blog is noindex on Enrollment too', array( 'noindex', 'follow' ), enrollment_copy_robots( array( 'noindex' => true ) ) );
	check( 'enrollment copy: an indexable blog is index, follow on Enrollment', array( 'index', 'follow' ), enrollment_copy_robots( array( 'noindex' => false ) ) );
	check( 'enrollment copy: a record without the field leaves the copy\'s robots alone', null, enrollment_copy_robots( array( 'title' => 'x' ) ) );
	// Ownership, as for WordPress's own posts: Editors work on every record, Authors only on their own.
	check( 'main content: an editor manages a record someone else created', true, main_manages_record( 'blogs', 'b-1' ) );
	$GLOBALS['acv_caps'] = array( 'edit_posts', 'publish_posts' );
	$GLOBALS['acv_user'] = 7;
	remember_main_owner( 'blogs', 'b-mine', 7 );
	remember_main_owner( 'blogs', 'b-other', 8 );
	check( 'main content: an author manages their own article', true, main_can_record( 'blogs', 'publish', 'b-mine' ) );
	check( 'main content: an author cannot touch an article someone else wrote', false, main_can_record( 'blogs', 'edit', 'b-other' ) );
	check( 'main content: an author cannot touch an article created outside WordPress', false, main_can_record( 'blogs', 'edit', 'b-legacy' ) );
	check( 'main content: an author may create a new article', true, main_can_record( 'blogs', 'edit', '' ) );
	check( 'main content: an author lands on Blogs, not Pages', 'blogs', main_default_entity() );
	remember_main_owner( 'blogs', 'b-mine', 0 );
	check( 'main content: a deleted record forgets its owner', false, main_manages_record( 'blogs', 'b-mine' ) );
	$GLOBALS['acv_user'] = 0;
	check( 'main content: a signed-out visitor owns nothing', false, main_manages_record( 'blogs', 'b-other' ) );
	unset( $GLOBALS['acv_user'] );
	unset( $GLOBALS['acv_caps'] );
	check( 'main content: site-relative image paths are kept', '/blog-images/image1.jpg', main_clean_url( '/blog-images/image1.jpg' ) );
	check( 'main content: https kept', 'https://enroll.acadvizen.com/a.png', main_clean_url( ' https://enroll.acadvizen.com/a.png ' ) );
	check( 'main content: other schemes dropped', '', main_clean_url( 'javascript:alert(1)' ) );
	check( 'main content: protocol-relative dropped', '', main_clean_url( '//evil.example/x.png' ) );
	check( 'main content: public addresses per type', array( '/tools/canva', '/blog/x', '' ), array( (string) wp_parse_url( main_public_url( 'tools_extended', 'canva' ), PHP_URL_PATH ), (string) wp_parse_url( main_public_url( 'blogs', 'x' ), PHP_URL_PATH ), main_public_url( 'testimonials', 'x' ) ) );
	check(
		'main content: Enrollment copy of a blog drawn from the same blocks, scripts removed',
		'<h2>Intro</h2><p>Hi <strong>there</strong></p><ul><li>One</li></ul><figure class="wp-block-image"><img src="https://x/a.png" alt="A" /><figcaption>Cap</figcaption></figure>',
		main_blog_html( array( array( 'block_type' => 'heading', 'content_json' => array( 'text' => 'Intro', 'level' => 2 ) ), array( 'block_type' => 'paragraph', 'content_json' => array( 'text' => 'Hi <strong>there</strong><script>x</script>' ) ), array( 'block_type' => 'list', 'content_json' => array( 'items' => array( 'One' ) ) ), array( 'block_type' => 'image', 'content_json' => array( 'src' => 'https://x/a.png', 'alt' => 'A', 'caption' => 'Cap' ) ), array( 'block_type' => 'html', 'content_json' => array( 'html' => '<b>no</b>' ) ) ) )
	);
	// Known answer computed with signPreview() in lib/wordpress/previewToken.js (same secret): both sides agree.
	// Form fields -> record (site chrome types).
	$header = main_entity( 'header_settings' );
	check( 'site chrome: colours as stored on Main are kept (hex, rgb, rgba, transparent)', array( '#10b981', 'rgba(255,255,255,0.1)', 'rgb(5, 11, 18)', 'transparent' ), array_map( 'Acadvizen\Cms\main_clean_color', array( ' #10b981 ', 'rgba(255,255,255,0.1)', 'rgb(5, 11, 18)', 'transparent' ) ) );
	check( 'site chrome: anything else is not a colour', array( '', '', '' ), array_map( 'Acadvizen\Cms\main_clean_color', array( 'red', 'rgba(1,2,3,0.5);background:red', 'url(x)' ) ) );
	$_POST  = array( 'acv_field' => array( 'announcement_text' => ' Admissions open ', 'announcement_bg_color' => '', 'announcement_text_color' => 'red', 'announcement_link' => ' /courses ' ) );
	$rec    = main_record_from_post( $header );
	check( 'site chrome: an empty colour stays empty (website default), never black', null, $rec['announcement_bg_color'] );
	check( 'site chrome: an invalid colour is not sent as a colour', true, empty( $rec['announcement_text_color'] ) );
	check( 'site chrome: text and links trimmed', array( 'Admissions open', '/courses' ), array( $rec['announcement_text'], $rec['announcement_link'] ) );
	check( 'site chrome: an untouched structured list is not sent (stored value kept)', false, array_key_exists( 'social_items', $rec ) );
	$_POST = array( 'acv_field' => array( 'social_items' => '[{"platform":"instagram","url":"https://instagram.com/acadvizen"}]' ) );
	$rec   = main_record_from_post( $header );
	check( 'site chrome: an edited structured list is sent', 'instagram', $rec['social_items'][0]->platform );
	$_POST = array( 'acv_field' => array( 'ui_copy' => '{}' ) );
	$rec   = main_record_from_post( main_entity( 'site_settings' ) );
	check( 'site chrome: an empty settings object stays an object, not a list', '{}', wp_json_encode( $rec['ui_copy'] ) );
	$_POST = array( 'acv_field' => array( 'menu_location' => 'sidebar', 'target' => '_blank', 'order_index' => '3', 'title' => 'Blog', 'url' => '/blog' ) );
	$rec   = main_record_from_post( main_entity( 'menus' ) );
	check( 'menus: an unknown menu is not sent; known choices and numbers are', array( null, '_blank', 3 ), array( $rec['menu_location'], $rec['target'], $rec['order_index'] ) );
	check( 'menus: visibility switches left unticked are sent as off', array( false, false ), array( $rec['desktop_visible'], $rec['mobile_visible'] ) );
	$_POST = array();
	check( 'site chrome: settings rows cannot be created or trashed from the list', array( false, false, 'none' ), array( main_entity( 'footer_settings' )['creatable'], main_entity( 'footer_settings' )['trash'], main_entity( 'footer_settings' )['workflow'] ) );

	// Every field of every Main Website type renders (a format error here would break the whole screen).
	$rendered = array();
	foreach ( array( 'header_settings', 'footer_settings', 'menus', 'site_settings', 'tools_extended', 'homepage_hero', 'homepage_cta', 'home_sections', 'home_lists', 'courses', 'course_details', 'city_pages', 'service_pages', 'media', 'seo_metadata', 'authors', 'blog_categories', 'blog_tags', 'blogs' ) as $acv_entity ) {
		foreach ( main_entity( $acv_entity )['fields'] as $acv_key => $acv_field ) {
			$acv_sample = array( 'color' => 'rgba(255,255,255,0.1)', 'json' => array( array( 'platform' => 'instagram', 'url' => 'https://instagram.com/x' ) ), 'checkbox' => null, 'number' => 3, 'choice' => '_blank' )[ $acv_field[1] ] ?? 'Sample';
			ob_start();
			try {
				render_main_field( $acv_key, $acv_field, $acv_sample, array() );
				$rendered[ $acv_entity . '.' . $acv_key ] = (string) ob_get_clean();
			} catch ( \Throwable $acv_error ) {
				ob_end_clean();
				$rendered[ $acv_entity . '.' . $acv_key ] = 'ERROR ' . $acv_error->getMessage();
			}
		}
	}
	check( 'main content: every field of the site-wide types renders', array(), array_keys( array_filter( $rendered, static fn( $html ) => 0 === strpos( $html, 'ERROR' ) || '' === $html ) ) );
	check( 'main content: a stored rgba colour is shown as it is, with the picker at black', true, false !== strpos( $rendered['header_settings.header_border_color'], 'value="rgba(255,255,255,0.1)"' ) && false !== strpos( $rendered['header_settings.header_border_color'], 'value="#000000"' ) );
	check( 'main content: an empty menu visibility switch is shown ticked', true, false !== strpos( $rendered['menus.desktop_visible'], 'checked' ) );

	check( 'main content: preview signature matches the Main Website', '7114d9914596634f467b2c4248861427bd4d6891cd6baf3a17155cde76f27d32', main_preview_signature( 'pages', '11111111-2222-3333-4444-555555555555', 1791640000 ) );

	// Shared changes say which Main Website pages they republish before saving.
	check( 'affected pages: none live', 'No page is published on the Main Website yet, so saving republishes nothing there.', affected_pages_summary( array() ) );
	check( 'affected pages: listed, sorted, duplicates once', 'Saving republishes 2 Main Website pages: /, /about.', affected_pages_summary( array( '/about', '/', '/about', '' ) ) );
	check( 'affected pages: long list shortened with a count', 'Saving republishes 4 Main Website pages: /a, /b and 2 more.', affected_pages_summary( array( '/d', '/c', '/b', '/a' ), 2 ) );
	check( 'affected pages: one page', 'Saving republishes 1 Main Website page: /tools/canva.', affected_pages_summary( array( '/tools/canva' ) ) );

	// Every request to this plugin's routes turns LiteSpeed caching off before dispatch, errors included (a cached 404 from
	// /render was served to anonymous visitors on 20 Oct 2026); other routes are left alone.
	$route_request = new class() { public $route = ''; public function get_route() { return $this->route; } };
	$GLOBALS['acv_actions'] = array();
	$route_request->route = '/acadvizen-cms/v1/render';
	$passed = no_cache_for_own_routes( 'untouched', null, $route_request );
	$route_request->route = '/wp/v2/pages';
	no_cache_for_own_routes( null, null, $route_request );
	$route_request->route = '/acadvizen-cms-other/v1/x';
	no_cache_for_own_routes( null, null, $route_request );
	check( 'own routes: LiteSpeed no-cache before dispatch (errors too), result passed through, other routes untouched', array( 'untouched', array( 'litespeed_control_set_nocache' ) ), array( $passed, $GLOBALS['acv_actions'] ) );

	// Signed Main Website data must never be cached by LiteSpeed (its REST cache overrode the header; enroll, 19 Oct 2026).
	$GLOBALS['acv_actions'] = array();
	$nc = no_cache_response( array( 'pages' => array() ) );
	check( 'signed responses: no-store, LiteSpeed no-cache header and LiteSpeed\'s own no-cache call', array( 'no-store, max-age=0', 'no-cache', true ), array( $nc->headers['Cache-Control'] ?? '', $nc->headers['X-LiteSpeed-Cache-Control'] ?? '', in_array( 'litespeed_control_set_nocache', $GLOBALS['acv_actions'], true ) ) );

	check( 'signed routes: no secret configured -> refused', 'refused', trim( (string) shell_exec( sprintf( '%s %s --no-secret', escapeshellarg( PHP_BINARY ), escapeshellarg( __FILE__ ) ) ) ) );

	foreach ( $guard as $case ) {
		list( $home, $main, $internal, $expected ) = $case;
		$mode  = $case[4] ?? '';
		$cmd   = sprintf( '%s %s --guard %s %s %s %s', escapeshellarg( PHP_BINARY ), escapeshellarg( __FILE__ ), escapeshellarg( $home ), escapeshellarg( $main ), escapeshellarg( $internal ), escapeshellarg( $mode ) );
		check( "guard $home -> $main" . ( $internal ? " (internal $internal)" : '' ) . ( 'legacy' === $mode ? ' [old CMS-address constants]' : '' ) . ( 'info' === $mode ? ' info' : '' ), $expected, trim( (string) shell_exec( $cmd ) ) );
	}

	echo "\n$count tests, " . ( $count - $failures ) . " passed, $failures failed\n";
	exit( $failures ? 1 : 0 );
}

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
		// Optional: one WordPress with a CMS address and a public address (mu-plugin acadvizen-cms-hosts.php).
		if ( '' !== ( $argv[5] ?? '' ) ) {
			define( 'ACADVIZEN_CMS_ADMIN_URL', $argv[5] );
			define( 'ACADVIZEN_CMS_PUBLIC_URL', $argv[6] );
		}
		require PLUGIN . 'config.php';
		echo \Acadvizen\CMS\is_configured() ? 'connected' : 'blocked';
		if ( 'info' === ( $argv[7] ?? '' ) ) {
			echo ' ' . \Acadvizen\CMS\loopback_base() . ' ' . implode( ',', \Acadvizen\CMS\own_hostports() );
		}
		exit;
	}

	if ( true ) { // conditional, so these are not hoisted into the --guard child process
		define( 'ABSPATH', '/' );
		define( 'HOUR_IN_SECONDS', 3600 );
		function home_url() { return 'https://cms.acadvizen.com'; }
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
		function update_post_meta( $id, $key, $value ) { return true; }
		function wp_cache_delete( $key, $group = '' ) { $GLOBALS['acv_cache_deleted'][] = "$group/$key"; return true; }
		function wp_doing_cron() { return ! empty( $GLOBALS['acv_doing_cron'] ); }
		function get_posts( $args = array() ) { return $GLOBALS['acv_post_ids'] ?? array(); }
		if ( ! function_exists( 'delete_option' ) ) {
			function delete_option( $name ) { unset( $GLOBALS['acv_options'][ $name ] ); return true; }
		}
		if ( ! function_exists( 'wp_strip_all_tags' ) ) {
			function wp_strip_all_tags( $text ) { return trim( strip_tags( (string) $text ) ); }
		}
		function add_option( $name, $value = '', $deprecated = '', $autoload = null ) { if ( isset( $GLOBALS['acv_options'][ $name ] ) ) { return false; } $GLOBALS['acv_options'][ $name ] = $value; return true; }
		function delete_post_meta( $id, $key ) { return true; }
		function __( $text, $domain = '' ) { return $text; }
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
	check( 'image direct from WordPress', 'https://cms.acadvizen.com/wp-content/uploads/a.png', main_proxy_path( '/wp-content/uploads/a.png' ) );
	check( 'video direct from WordPress', 'https://cms.acadvizen.com/wp-content/uploads/intro.MP4', main_proxy_path( '/wp-content/uploads/intro.MP4' ) );
	check( 'wp-includes js', '/_acv/i/js/jquery/jquery.min.js', main_proxy_path( '/wp-includes/js/jquery/jquery.min.js' ) );
	check( 'rest route', '/_acv/rest/acadvizen/v1/enquiry', main_proxy_path( '/wp-json/acadvizen/v1/enquiry' ) );
	check( 'rest root', '/_acv/rest/', main_proxy_path( '/wp-json' ) );
	check( 'admin-ajax', '/_acv/ajax', main_proxy_path( '/wp-admin/admin-ajax.php' ) );
	check( 'wp-admin is never mapped', null, main_proxy_path( '/wp-admin/post.php' ) );
	check( 'pages are not mapped', null, main_proxy_path( '/about-us/' ) );

	$doc = '<script>fetch(window.location.origin+\'/wp-json/acadvizen/v1/enquiry\',{})</script>'
		. '<link rel="stylesheet" href="https://cms.acadvizen.com/wp-content/plugins/cf7/styles.css?ver=6.1.7">'
		. '<img src="https://cms.acadvizen.com/wp-content/uploads/a.png" srcset="/wp-content/uploads/a.png 1x, /wp-content/uploads/b.png?v=2 2x">'
		. '<style>.x{background:url(/wp-content/uploads/bg.jpg)}@font-face{src:url(/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2?5.34.0)}</style>'
		. '<script>var c={"root":"https:\/\/cms.acadvizen.com\/wp-json\/","ajax":"\/wp-admin\/admin-ajax.php","assets":"https:\/\/cms.acadvizen.com\/wp-content\/plugins\/elementor\/assets\/","img":"\/wp-content\/uploads\/c.webp"};</script>'
		. '<p>Docs mention example.com/wp-content/ in prose.</p>';
	$out = rewrite_root_relative_paths_for_main( rewrite_urls_for_main( $doc ) );

	check( 'no wp-json left', false, strpos( $out, 'wp-json' ) !== false );
	check( 'no admin-ajax left', false, strpos( $out, 'admin-ajax' ) !== false );
	check( 'inline fetch literal', true, strpos( $out, "origin+'/_acv/rest/acadvizen/v1/enquiry'" ) !== false );
	check( 'absolute stylesheet same-origin', true, strpos( $out, 'href="/_acv/c/plugins/cf7/styles.css?ver=6.1.7"' ) !== false );
	check( 'absolute img stays on WordPress', true, strpos( $out, 'src="https://cms.acadvizen.com/wp-content/uploads/a.png"' ) !== false );
	check( 'srcset entries direct', true, strpos( $out, 'srcset="https://cms.acadvizen.com/wp-content/uploads/a.png 1x, https://cms.acadvizen.com/wp-content/uploads/b.png?v=2 2x"' ) !== false );
	check( 'css url() image direct', true, strpos( $out, 'url(https://cms.acadvizen.com/wp-content/uploads/bg.jpg)' ) !== false );
	check( 'css url() font same-origin', true, strpos( $out, 'url(/_acv/c/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2?5.34.0)' ) !== false );
	check( 'json-escaped rest root', true, strpos( $out, '"root":"\/_acv\/rest\/"' ) !== false );
	check( 'json-escaped ajax', true, strpos( $out, '"ajax":"\/_acv\/ajax"' ) !== false );
	check( 'json-escaped assets', true, strpos( $out, '"assets":"\/_acv\/c\/plugins\/elementor\/assets\/"' ) !== false );
	check( 'json-escaped image direct', true, strpos( $out, '"img":"https:\/\/cms.acadvizen.com\/wp-content\/uploads\/c.webp"' ) !== false );
	check( 'mid-path text untouched', true, strpos( $out, 'example.com/wp-content/ in prose' ) !== false );
	check( 'other hosts untouched', true, strpos( rewrite_urls_for_main( '<a href="https://cms.acadvizen.com.evil.example/wp-content/x">' ), 'evil.example/wp-content/x' ) !== false );

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

	// --- Master Admin menu: content types grouped with content, not appended after Settings ---
	$menu   = array( array( 'Dashboard', 'c', MENU_SLUG ), array( 'Pages', 'c', 'edit.php?post_type=page' ), array( 'Settings', 'c', MENU_SLUG . '-settings' ),
		array( 'Other plugin', 'c', 'other.php' ), array( 'Courses', 'c', 'edit.php?post_type=acv_course' ), array( 'Main Blogs', 'c', 'edit.php?post_type=acv_blog' ) );
	$sorted = array_map( static fn( $r ) => $r[0], sorted_submenu( $menu, admin_menu_order() ) );
	check( 'menu order: content before settings, unknown rows last', array( 'Dashboard', 'Pages', 'Main Blogs', 'Courses', 'Settings', 'Other plugin' ), $sorted );
	check( 'menu order: Global Styles link is placed with the design items', 14, array_search( 'post.php?post=7&action=elementor', admin_menu_order( 'post.php?post=7&action=elementor' ), true ) );
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

	// Sitemaps leave out page-builder internals (live Enrollment listed /elementor-hf/header/ etc.).
	foreach ( array( 'elementor-hf', 'popupkit-campaigns', 'metform-form', 'wpr_mega_menu' ) as $internal ) {
		check( "sitemap: {$internal} left out of Rank Math", true, exclude_main_only_types_from_rank_math( false, $internal ) );
	}
	check( 'sitemap: pages stay in Rank Math', false, exclude_main_only_types_from_rank_math( false, 'page' ) );
	check( 'sitemap: core sitemap keeps pages, drops internals', array( 'page', 'post' ), array_keys( exclude_main_only_types_from_core_sitemap( array( 'page' => 1, 'post' => 1, 'elementor-hf' => 1, 'metform-form' => 1 ) ) ) );
	check( 'login logo: says Acadvizen', 'Acadvizen', login_logo_text() );

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
	check( 'https upgrade followed', true, is_https_upgrade_of( 'http://cms.acadvizen.com/about-us/', 'https://cms.acadvizen.com/about-us/' ) );
	check( 'other host refused', false, is_https_upgrade_of( 'http://cms.acadvizen.com/about-us/', 'https://evil.example/about-us/' ) );
	check( 'other path refused', false, is_https_upgrade_of( 'http://cms.acadvizen.com/about-us/', 'https://cms.acadvizen.com/wp-login.php' ) );
	check( 'https downgrade refused', false, is_https_upgrade_of( 'https://cms.acadvizen.com/a/', 'http://cms.acadvizen.com/a/' ) );
	check( 'look-alike host refused', false, is_https_upgrade_of( 'http://cms.acadvizen.com/a/', 'https://cms.acadvizen.com.evil.example/a/' ) );

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
		array( 'https://cms.acadvizen.com', 'https://www.acadvizen.com', '', 'blocked' ),
		array( 'https://cms.acadvizen.com', 'https://acadvizen.com/', '', 'blocked' ),
		array( 'https://cms.acadvizen.com', 'https://WWW.Acadvizen.com', '', 'blocked' ),
		array( 'https://cms.acadvizen.com', 'https://staging-main.vercel.app', 'https://www.acadvizen.com', 'blocked' ),
		array( 'https://cms.acadvizen.com', 'https://staging-main.vercel.app', '', 'connected' ),
		array( 'https://cms.acadvizen.com', 'https://www.acadvizen.com.evil.example', '', 'connected' ),
		array( 'https://enroll.acadvizen.com', 'https://www.acadvizen.com', '', 'connected' ),
		// One WordPress, two addresses: working on the CMS address is the production site...
		array( 'https://cms.acadvizen.com', 'https://www.acadvizen.com', '', 'connected', 'https://cms.acadvizen.com', 'https://enroll.acadvizen.com' ),
		array( 'https://enroll.acadvizen.com', 'https://www.acadvizen.com', '', 'connected', 'https://cms.acadvizen.com', 'https://enroll.acadvizen.com' ),
		// ...but a copy of that wp-config.php on another site (staging) is not.
		array( 'https://staging-cms.acadvizen.com', 'https://www.acadvizen.com', '', 'blocked', 'https://cms.acadvizen.com', 'https://enroll.acadvizen.com' ),
		// Renders always run on the public address; both addresses are the site's own.
		array( 'https://cms.acadvizen.com', 'https://www.acadvizen.com', '', 'connected https://enroll.acadvizen.com cms.acadvizen.com,enroll.acadvizen.com', 'https://cms.acadvizen.com', 'https://enroll.acadvizen.com', 'info' ),
		array( 'https://cms.acadvizen.com', 'https://staging-main.vercel.app', '', 'connected https://cms.acadvizen.com cms.acadvizen.com', '', '', 'info' ),
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

	foreach ( $guard as $case ) {
		list( $home, $main, $internal, $expected ) = $case;
		$extra = array_map( 'escapeshellarg', array( $case[4] ?? '', $case[5] ?? '', $case[6] ?? '' ) );
		$cmd   = sprintf( '%s %s --guard %s %s %s %s', escapeshellarg( PHP_BINARY ), escapeshellarg( __FILE__ ), escapeshellarg( $home ), escapeshellarg( $main ), escapeshellarg( $internal ), implode( ' ', $extra ) );
		check( "guard $home -> $main" . ( $internal ? " (internal $internal)" : '' ) . ( ! empty( $case[4] ) ? ' [CMS + public address]' : '' ) . ( ! empty( $case[6] ) ? ' info' : '' ), $expected, trim( (string) shell_exec( $cmd ) ) );
	}

	echo "\n$count tests, " . ( $count - $failures ) . " passed, $failures failed\n";
	exit( $failures ? 1 : 0 );
}

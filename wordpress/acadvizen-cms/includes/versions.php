<?php
/**
 * Published versions of Main Website pages (Render Bridge snapshots).
 *
 * Every successful render is stored as a version. Exactly one version per page is "live" (what
 * the Main Website serves). A failed render never touches the live version, and an administrator
 * can make any earlier version live again (rollback). WordPress/Elementor revisions remain the
 * editing history; these versions are the publishing history of what the Main Website showed.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DB_VERSION        = '1';
const DB_VERSION_OPTION = 'acv_cms_db_version';
const VERSIONS_TO_KEEP  = 5;
const META_PINNED       = '_acv_pinned_version';

/*
 * A version is a whole self-contained page (Elementor CSS inlined), about 600 KB. Stored as is,
 * a few hundred Main pages times their kept versions fill a shared-hosting database (on staging,
 * past the host's quota, which then refused every write). Versions are therefore stored
 * compressed (about a tenth of the size); rows stored earlier without the prefix still read.
 */
const HTML_GZ_PREFIX = 'gz1:';

function encode_version_html( string $html ): string {
	if ( ! function_exists( 'gzdeflate' ) ) {
		return $html;
	}
	$packed = gzdeflate( $html, 6 );
	return false === $packed ? $html : HTML_GZ_PREFIX . base64_encode( $packed ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- compressed storage, not obfuscation.
}

function decode_version_html( string $stored ): string {
	if ( 0 !== strpos( $stored, HTML_GZ_PREFIX ) || ! function_exists( 'gzinflate' ) ) {
		return $stored;
	}
	$html = gzinflate( (string) base64_decode( substr( $stored, strlen( HTML_GZ_PREFIX ) ), true ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
	return false === $html ? '' : $html;
}

function versions_table(): string {
	global $wpdb;
	return $wpdb->prefix . 'acv_render_versions';
}

function install_versions_table(): void {
	global $wpdb;
	require_once ABSPATH . 'wp-admin/includes/upgrade.php';
	$charset = $wpdb->get_charset_collate();
	$table   = versions_table();
	dbDelta(
		"CREATE TABLE {$table} (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			post_id bigint(20) unsigned NOT NULL,
			main_path varchar(300) NOT NULL,
			version int(10) unsigned NOT NULL,
			html longtext NOT NULL,
			html_hash char(64) NOT NULL,
			bytes int(10) unsigned NOT NULL,
			noindex tinyint(1) NOT NULL DEFAULT 0,
			reason varchar(32) NOT NULL DEFAULT 'publish',
			created_by bigint(20) unsigned NOT NULL DEFAULT 0,
			created_at datetime NOT NULL,
			is_live tinyint(1) NOT NULL DEFAULT 0,
			PRIMARY KEY  (id),
			KEY post_live (post_id,is_live),
			KEY path_live (main_path(191),is_live)
		) {$charset};"
	);
	update_option( DB_VERSION_OPTION, DB_VERSION, false );
}

function maybe_install_versions_table(): void {
	if ( DB_VERSION !== get_option( DB_VERSION_OPTION ) ) {
		install_versions_table();
	}
}

function live_version_for_post( int $post_id ): ?array {
	global $wpdb;
	$row = $wpdb->get_row( $wpdb->prepare( 'SELECT id, post_id, main_path, version, html_hash, bytes, noindex, reason, created_by, created_at FROM ' . versions_table() . ' WHERE post_id = %d AND is_live = 1 LIMIT 1', $post_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	return $row ? $row : null;
}

function live_version_for_path( string $path ): ?array {
	global $wpdb;
	$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM ' . versions_table() . ' WHERE main_path = %s AND is_live = 1 ORDER BY id DESC LIMIT 1', $path ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	if ( $row ) {
		$row['html'] = decode_version_html( (string) $row['html'] );
	}
	return $row ? $row : null;
}

/** The HTML of one stored version of a page ('' when there is no such version). */
function version_html( int $post_id, int $version_id ): string {
	global $wpdb;
	return decode_version_html( (string) $wpdb->get_var( $wpdb->prepare( 'SELECT html FROM ' . versions_table() . ' WHERE id = %d AND post_id = %d', $version_id, $post_id ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}

function list_versions( int $post_id ): array {
	global $wpdb;
	return (array) $wpdb->get_results( $wpdb->prepare( 'SELECT id, post_id, main_path, version, html_hash, bytes, noindex, reason, created_by, created_at, is_live FROM ' . versions_table() . ' WHERE post_id = %d ORDER BY id DESC', $post_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}

/**
 * Every live version (the Main Website's manifest of WordPress-rendered pages).
 */
function list_live_versions(): array {
	global $wpdb;
	return (array) $wpdb->get_results( 'SELECT post_id, main_path, version, noindex, created_at FROM ' . versions_table() . ' WHERE is_live = 1 ORDER BY main_path', ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}

/**
 * Stores a render and makes it live. If it is identical to the current live version for the
 * same address, nothing new is stored. Returns the live version row.
 */
function store_live_version( int $post_id, string $main_path, string $html, bool $noindex, string $reason ): array {
	global $wpdb;
	$hash = hash( 'sha256', $html );
	$live = live_version_for_post( $post_id );

	if ( $live && $live['html_hash'] === $hash && $live['main_path'] === $main_path && (int) $live['noindex'] === (int) $noindex ) {
		return $live;
	}

	$next = 1 + (int) $wpdb->get_var( $wpdb->prepare( 'SELECT MAX(version) FROM ' . versions_table() . ' WHERE post_id = %d', $post_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	$wpdb->insert(
		versions_table(),
		array(
			'post_id'    => $post_id,
			'main_path'  => $main_path,
			'version'    => $next,
			'html'       => encode_version_html( $html ),
			'html_hash'  => $hash,
			'bytes'      => strlen( $html ),
			'noindex'    => $noindex ? 1 : 0,
			'reason'     => $reason,
			'created_by' => get_current_user_id(),
			'created_at' => current_time( 'mysql', true ),
			'is_live'    => 0,
		),
		array( '%d', '%s', '%d', '%s', '%s', '%d', '%d', '%s', '%d', '%s', '%d' )
	);
	$id = (int) $wpdb->insert_id;
	make_version_live( $post_id, $id );
	prune_versions( $post_id );
	return (array) live_version_for_post( $post_id );
}

function make_version_live( int $post_id, int $version_id ): bool {
	global $wpdb;
	$exists = (int) $wpdb->get_var( $wpdb->prepare( 'SELECT COUNT(*) FROM ' . versions_table() . ' WHERE id = %d AND post_id = %d', $version_id, $post_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	if ( ! $exists ) {
		return false;
	}
	$wpdb->query( $wpdb->prepare( 'UPDATE ' . versions_table() . ' SET is_live = 0 WHERE post_id = %d', $post_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	$wpdb->query( $wpdb->prepare( 'UPDATE ' . versions_table() . ' SET is_live = 1 WHERE id = %d', $version_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	return true;
}

/**
 * Takes a page off the Main Website (unpublished, trashed, retargeted to Enrollment).
 * Versions are kept so the page can be restored.
 */
function clear_live_version( int $post_id ): void {
	global $wpdb;
	$wpdb->query( $wpdb->prepare( 'UPDATE ' . versions_table() . ' SET is_live = 0 WHERE post_id = %d', $post_id ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
}

function delete_versions_for_post( int $post_id ): void {
	global $wpdb;
	$wpdb->delete( versions_table(), array( 'post_id' => $post_id ), array( '%d' ) );
}

function prune_versions( int $post_id ): void {
	global $wpdb;
	$keep = $wpdb->get_col( $wpdb->prepare( 'SELECT id FROM ' . versions_table() . ' WHERE post_id = %d ORDER BY is_live DESC, id DESC LIMIT %d', $post_id, VERSIONS_TO_KEEP ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	if ( $keep ) {
		$placeholders = implode( ',', array_fill( 0, count( $keep ), '%d' ) );
		$wpdb->query( $wpdb->prepare( 'DELETE FROM ' . versions_table() . " WHERE post_id = %d AND id NOT IN ({$placeholders})", array_merge( array( $post_id ), array_map( 'intval', $keep ) ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
	}
}

/**
 * Previous Main addresses of pages that moved, so the Main Website can redirect them.
 * Stored as old path => post ID; resolved to the page's current live address at read time.
 */
const MOVED_PATHS_OPTION = 'acv_cms_moved_paths';

function remember_moved_path( string $old_path, int $post_id ): void {
	if ( '' === $old_path || '/' === $old_path ) {
		return;
	}
	$moved              = (array) get_option( MOVED_PATHS_OPTION, array() );
	$moved[ $old_path ] = $post_id;
	update_option( MOVED_PATHS_OPTION, array_slice( $moved, -500, null, true ), false );
}

function moved_path_redirects(): array {
	$redirects = array();
	foreach ( (array) get_option( MOVED_PATHS_OPTION, array() ) as $old_path => $post_id ) {
		$live = live_version_for_post( (int) $post_id );
		if ( $live && $live['main_path'] !== $old_path ) {
			$redirects[] = array( 'from' => (string) $old_path, 'to' => $live['main_path'] );
		}
	}
	return $redirects;
}

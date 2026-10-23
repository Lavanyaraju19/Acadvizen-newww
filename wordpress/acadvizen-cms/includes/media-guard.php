<?php
/**
 * Media in use is not deleted.
 *
 * An image or file that a published, scheduled or waiting-for-approval page, location, course, tool, blog or
 * Elementor template still shows
 * (as its featured image, or anywhere in its Elementor design, by ID or by address) cannot be deleted from
 * the Media Library: deleting it would leave a broken image on the live website. The administrator is told
 * which item uses it; once that item no longer uses it (or is a plain draft again), it can be deleted.
 *
 * 22 Oct 2026: 322 images imported for the Main Website's blogs were deleted from the Media Library within
 * half an hour of their import, while 48 of those blogs were live; the published pages showed broken images
 * until the import was undone.
 *
 * @package AcadvizenCMS
 */

namespace Acadvizen\CMS;

defined( 'ABSPATH' ) || exit;

/** Set while the plugin itself removes media (Undo import): an image still in use is then kept, quietly. */
function media_guard_internal( ?bool $set = null ): bool {
	static $internal = false;
	if ( null !== $set ) {
		$internal = $set;
	}
	return $internal;
}

/**
 * The published, scheduled or waiting items (at most $limit) that show this attachment: as featured image, or in their Elementor
 * design by ID ("id":123 / "id":"123") or by file address. Plain drafts do not count.
 *
 * @return int[] post IDs
 */
function attachment_used_by( int $attachment_id, int $limit = 5 ): array {
	global $wpdb;
	if ( $attachment_id <= 0 ) {
		return array();
	}
	$types        = array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES );
	$placeholders = implode( ',', array_fill( 0, count( $types ), '%s' ) );
	$file         = (string) get_post_meta( $attachment_id, '_wp_attached_file', true );
	$by_id        = '"id":"?' . $attachment_id . '[,}"]';
	// phpcs:disable WordPress.DB.DirectDatabaseQuery, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- a deletion check, run once per deletion.
	$sql  = "SELECT DISTINCT p.ID FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id
		WHERE p.post_status IN ('publish', 'pending', 'future') AND p.post_type IN ($placeholders)
		AND ( ( m.meta_key = '_thumbnail_id' AND m.meta_value = %s )
			OR ( m.meta_key = '_elementor_data' AND ( m.meta_value REGEXP %s" . ( '' !== $file ? ' OR m.meta_value LIKE %s' : '' ) . ' ) ) )
		LIMIT %d';
	$args = array_merge( $types, array( (string) $attachment_id, $by_id ), '' !== $file ? array( '%' . $wpdb->esc_like( str_replace( '/', '\\/', $file ) ) . '%' ) : array(), array( $limit ) );
	$ids  = $wpdb->get_col( $wpdb->prepare( $sql, $args ) );
	// phpcs:enable
	return array_map( 'intval', (array) $ids );
}

/** The words that tell the administrator why the file was kept. */
function media_in_use_message( int $attachment_id, array $used_by ): string {
	$names = array();
	foreach ( $used_by as $id ) {
		$path    = function_exists( __NAMESPACE__ . '\\main_path_for' ) && targets_main( get_publish_target( $id ) ) ? main_path_for( get_post( $id ) ) : '';
		$names[] = sprintf( '"%1$s" (#%2$d%3$s)', get_the_title( $id ), $id, '' !== $path ? ', www.acadvizen.com' . $path : '' );
	}
	/* translators: 1: file name, 2: list of published items */
	return sprintf( __( 'Not deleted: "%1$s" is used by content that is published or waiting for approval: %2$s. Remove it from there first; deleting it now would leave a broken image on the website.', 'acadvizen-cms' ), get_the_title( $attachment_id ) ?: basename( (string) get_attached_file( $attachment_id ) ), implode( ', ', $names ) );
}

/**
 * What happens to a deletion: 'allow' (nothing published uses it), 'keep' (in use; the plugin's own clean-up keeps
 * it quietly) or 'refuse' (in use; the person deleting it is told why).
 */
function media_delete_decision( array $used_by, bool $internal ): string {
	if ( ! $used_by ) {
		return 'allow';
	}
	return $internal ? 'keep' : 'refuse';
}

/**
 * pre_delete_attachment: keep an attachment that published or waiting content still shows. For a person deleting it in
 * the Media Library, the request ends with the reason; for the plugin's own clean-up it is kept quietly.
 *
 * @param mixed    $check  null to let WordPress delete it.
 * @param \WP_Post $post   the attachment.
 */
function guard_media_delete( $check, $post ) {
	if ( null !== $check || ! $post instanceof \WP_Post ) {
		return $check;
	}
	$used_by  = attachment_used_by( (int) $post->ID );
	$decision = media_delete_decision( $used_by, media_guard_internal() || ( defined( 'WP_CLI' ) && WP_CLI ) || wp_doing_cron() );
	if ( 'allow' === $decision ) {
		return $check;
	}
	if ( function_exists( __NAMESPACE__ . '\\approval_log' ) ) {
		approval_log( 'media_kept', (int) $post->ID, 'in_use', '', array( 'used_by' => $used_by ) );
	}
	if ( 'keep' === $decision ) {
		return false;
	}
	wp_die( esc_html( media_in_use_message( (int) $post->ID, $used_by ) ), esc_html__( 'Image in use', 'acadvizen-cms' ), array( 'response' => 409, 'back_link' => true ) );
}

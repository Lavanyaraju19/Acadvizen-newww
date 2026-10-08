<?php
/**
 * Tells the Main Website when a Main Blog changes so it refreshes its copy.
 *
 * WordPress stays the source of truth: the Main Website reads blog content from the
 * acadvizen-cms/v1 API, and this notification only tells it to refresh now rather than on
 * its next scheduled refresh (within a few minutes). Notifications run in the background via
 * WP-Cron, so a slow or unavailable Main Website never blocks or undoes saving in WordPress.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SYNC_HOOK         = 'acv_cms_sync_blog';
const MAX_SYNC_ATTEMPTS = 3;
const RETRY_DELAYS      = array( 1 => 60, 2 => 300 );
const LOG_OPTION        = 'acv_cms_sync_log';
const LOG_LIMIT         = 50;

const META_SYNC_STATUS = '_acv_sync_status';
const META_SYNC_ERROR  = '_acv_sync_error';
const META_SYNC_AT     = '_acv_sync_at';
const META_SYNC_EVENT  = '_acv_sync_event';
const META_MAIN_SLUG   = '_acv_main_slug';
const META_SLUG_STATUS = '_acv_slug_status';

const STATUS_PENDING        = 'pending';
const STATUS_SYNCED         = 'synced';
const STATUS_FAILED         = 'failed';
const STATUS_NOT_CONFIGURED = 'not_configured';

/**
 * Runs after WordPress has fully saved a post (fields, meta and terms included).
 */
function after_blog_saved( int $post_id, $post ): void {
	if ( ! $post instanceof \WP_Post || POST_TYPE !== $post->post_type ) {
		return;
	}

	$visible   = is_visible_on_main( $post );
	$main_slug = (string) get_post_meta( $post_id, META_MAIN_SLUG, true );

	if ( $visible && is_configured() ) {
		$status   = check_main_slug( $post->post_name );
		$previous = get_post_meta( $post_id, META_SLUG_STATUS, true );
		// If the Main Website could not be reached, keep the last confirmed answer for this
		// same address rather than replacing a known conflict with "unknown".
		$keep_previous = ! $status['checked'] && is_array( $previous ) && ! empty( $previous['checked'] ) && ( $previous['slug'] ?? '' ) === $post->post_name;
		if ( ! $keep_previous ) {
			$status['slug'] = $post->post_name;
			$status['time'] = time();
			update_post_meta( $post_id, META_SLUG_STATUS, $status );
		}
	} elseif ( ! $visible ) {
		delete_post_meta( $post_id, META_SLUG_STATUS );
	}

	if ( $visible || '' !== $main_slug ) {
		queue_sync( $post_id );
	} else {
		clear_sync_state( $post_id );
	}
}

/**
 * Permanently deleting a blog that is live on Main must still tell Main to remove it.
 */
function before_blog_deleted( int $post_id, $post ): void {
	if ( ! $post instanceof \WP_Post || POST_TYPE !== $post->post_type ) {
		return;
	}
	$main_slug = (string) get_post_meta( $post_id, META_MAIN_SLUG, true );
	if ( '' !== $main_slug ) {
		wp_schedule_single_event( time(), SYNC_HOOK, array( $post_id, wp_generate_uuid4(), 1, $main_slug ) );
	}
}

function queue_sync( int $post_id ): void {
	$event_id = wp_generate_uuid4();
	update_post_meta( $post_id, META_SYNC_EVENT, $event_id );
	update_post_meta( $post_id, META_SYNC_STATUS, STATUS_PENDING );
	delete_post_meta( $post_id, META_SYNC_ERROR );
	wp_schedule_single_event( time(), SYNC_HOOK, array( $post_id, $event_id, 1, '' ) );
}

function clear_sync_state( int $post_id ): void {
	foreach ( array( META_SYNC_STATUS, META_SYNC_ERROR, META_SYNC_AT, META_SYNC_EVENT ) as $key ) {
		delete_post_meta( $post_id, $key );
	}
}

/**
 * WP-Cron job. $removed_slug is only set for permanently deleted posts.
 */
function run_sync_job( $post_id, $event_id, $attempt = 1, $removed_slug = '' ): void {
	$post_id = (int) $post_id;
	$attempt = max( 1, (int) $attempt );
	$post    = get_post( $post_id );
	$exists  = $post instanceof \WP_Post && POST_TYPE === $post->post_type;

	if ( $exists ) {
		// A newer save replaced this notification; the newer job carries the current state.
		if ( get_post_meta( $post_id, META_SYNC_EVENT, true ) !== $event_id ) {
			return;
		}
		$visible   = is_visible_on_main( $post );
		$main_slug = (string) get_post_meta( $post_id, META_MAIN_SLUG, true );
		if ( ! $visible && '' === $main_slug ) {
			clear_sync_state( $post_id );
			return;
		}
		$slug          = $visible ? $post->post_name : $main_slug;
		$previous_slug = ( $visible && '' !== $main_slug && $main_slug !== $slug ) ? $main_slug : null;
	} else {
		if ( '' === (string) $removed_slug ) {
			return;
		}
		$visible       = false;
		$slug          = (string) $removed_slug;
		$previous_slug = null;
	}

	$payload = array(
		'event_id'      => (string) $event_id,
		'content_type'  => 'blog',
		'action'        => $visible ? 'upsert' : 'remove',
		'slug'          => $slug,
		'previous_slug' => $previous_slug,
		'wordpress_id'  => $post_id,
		'sent_at'       => gmdate( 'c' ),
	);

	if ( ! is_configured() ) {
		if ( $exists ) {
			update_post_meta( $post_id, META_SYNC_STATUS, STATUS_NOT_CONFIGURED );
		}
		log_sync( $payload, 'not_configured', '' );
		return;
	}

	$result = post_to_main( '/api/wordpress/revalidate', $payload, NOTIFY_TIMEOUT );

	if ( $result['ok'] ) {
		if ( $exists ) {
			update_post_meta( $post_id, META_MAIN_SLUG, $visible ? $slug : '' );
			update_post_meta( $post_id, META_SYNC_STATUS, STATUS_SYNCED );
			update_post_meta( $post_id, META_SYNC_AT, time() );
			delete_post_meta( $post_id, META_SYNC_ERROR );
			if ( $visible && isset( $result['body']['slug_status'] ) ) {
				$status         = normalize_slug_status( $result['body']['slug_status'] );
				$status['slug'] = $slug;
				$status['time'] = time();
				update_post_meta( $post_id, META_SLUG_STATUS, $status );
			}
		}
		log_sync( $payload, 'ok', 'http_' . $result['status'] );
		return;
	}

	if ( $attempt < MAX_SYNC_ATTEMPTS ) {
		wp_schedule_single_event( time() + RETRY_DELAYS[ $attempt ], SYNC_HOOK, array( $post_id, $event_id, $attempt + 1, $removed_slug ) );
		if ( $exists ) {
			update_post_meta( $post_id, META_SYNC_STATUS, STATUS_PENDING );
			update_post_meta( $post_id, META_SYNC_ERROR, $result['error'] );
		}
		log_sync( $payload, 'retry_scheduled', $result['error'] );
		return;
	}

	if ( $exists ) {
		update_post_meta( $post_id, META_SYNC_STATUS, STATUS_FAILED );
		update_post_meta( $post_id, META_SYNC_ERROR, $result['error'] );
	}
	log_sync( $payload, 'failed', $result['error'] );
	// Developer-facing detail goes to the PHP error log; administrators only see plain language.
	error_log( sprintf( '[acadvizen-cms] Main Website update failed after %d attempts: post=%d slug=%s error=%s', $attempt, $post_id, $slug, $result['error'] ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
}

function log_sync( array $payload, string $outcome, string $detail ): void {
	$log = get_option( LOG_OPTION, array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift(
		$log,
		array(
			'time'    => time(),
			'post_id' => (int) $payload['wordpress_id'],
			'slug'    => (string) $payload['slug'],
			'action'  => (string) $payload['action'],
			'outcome' => $outcome,
			'detail'  => mb_substr( $detail, 0, 200 ),
		)
	);
	update_option( LOG_OPTION, array_slice( $log, 0, LOG_LIMIT ), false );
}

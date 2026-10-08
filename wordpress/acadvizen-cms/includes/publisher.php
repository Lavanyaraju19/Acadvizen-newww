<?php
/**
 * Publishing pipeline for Elementor-designed pages targeted at the Main Website.
 *
 *   save / Elementor "Publish|Update"            global design change (kit, header/footer,
 *            |                                   templates, menus, customizer, plugin updates)
 *            v                                              |
 *   queue_main_render(post)  <-------- queue_site_rerender() (debounced, staggered)
 *            |
 *   WP-Cron job: render the page through WordPress itself (render-bridge.php)
 *            |-- failure: retry after 1 and 5 minutes; then "Failed". The live version is kept.
 *            v
 *   store as a new version and make it live (versions.php)
 *            v
 *   signed notification to the Main Website, which refreshes that address
 *
 * Saving never waits for any of this, and nothing here can change the WordPress post itself.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const RENDER_HOOK        = 'acv_cms_render_page';
const RERENDER_ALL_HOOK  = 'acv_cms_rerender_all';
const NOTIFY_HOOK        = 'acv_cms_notify_main';
const DAILY_REFRESH_HOOK = 'acv_cms_daily_refresh';
const STALL_CHECK_HOOK   = 'acv_cms_requeue_stalled';
const STALLED_AFTER      = 180;
const RERENDER_DUE_OPTION    = 'acv_cms_rerender_due';
const RERENDER_OVERDUE_AFTER = 120;
const RENDER_TIMEOUT     = 45;
const MAX_RENDER_BYTES   = 6 * 1024 * 1024;

const META_MAIN_STATE   = '_acv_main_state';
const META_MAIN_ERROR   = '_acv_main_error';
const META_MAIN_AT      = '_acv_main_at';
const META_MAIN_NOTIFY  = '_acv_main_notify';
const META_RENDER_EVENT = '_acv_render_event';
const META_RENDER_TOUCH = '_acv_render_touch';

const STATE_PUBLISHING  = 'publishing';
const STATE_PUBLISHED   = 'published';
const STATE_FAILED      = 'failed';
const STATE_REMOVED     = 'removed';
const STATE_ROLLED_BACK = 'rolled_back';

/**
 * wp_after_insert_post: a page/course/location was saved (any editor, quick edit, REST, Elementor).
 */
function after_site_doc_saved( int $post_id, $post ): void {
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	if ( is_template_post_type( $post->post_type ) ) {
		flush_target_caches();
		queue_site_rerender( 'template' );
		return;
	}
	if ( ! is_site_post_type( $post->post_type ) || 'auto-draft' === $post->post_status ) {
		return;
	}
	flush_target_caches();
	if ( is_elementor_editor_save() ) {
		// Elementor updates the post before it stores the new design; after_elementor_document_saved()
		// queues the render once everything is saved, so a render here could capture the old design.
		return;
	}
	handle_site_doc_change( $post, 'publish' );
}

/** True during the Elementor editor's own save request (admin-ajax action "elementor_ajax"). */
function is_elementor_editor_save(): bool {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only routing check; Elementor verifies its own nonce.
	return wp_doing_ajax() && isset( $_REQUEST['action'] ) && 'elementor_ajax' === $_REQUEST['action'];
}

/**
 * Elementor autosaves (every minute while editing, and "Save Draft" on a published page) are stored
 * on a separate autosave revision: the live page has not changed, so they must not publish anything.
 */
function is_autosave_document( $document ): bool {
	if ( method_exists( $document, 'is_autosave' ) && $document->is_autosave() ) {
		return true;
	}
	$own = method_exists( $document, 'get_post' ) ? $document->get_post() : null;
	return $own instanceof \WP_Post && ( 'revision' === $own->post_type || (bool) wp_is_post_autosave( $own->ID ) );
}

/**
 * Elementor saves page settings/content through its own pipeline; this catches every
 * "Publish"/"Update" made inside the Elementor editor.
 */
function after_elementor_document_saved( $document, $data ): void {
	if ( ! is_object( $document ) || ! method_exists( $document, 'get_main_id' ) || is_autosave_document( $document ) ) {
		return;
	}
	$post = get_post( (int) $document->get_main_id() );
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	if ( is_array( $data ) && isset( $data['settings'][ ELEMENTOR_TARGET_SETTING ] ) && ( is_site_post_type( $post->post_type ) || is_template_post_type( $post->post_type ) ) ) {
		update_post_meta( $post->ID, META_TARGET, sanitize_publish_target( $data['settings'][ ELEMENTOR_TARGET_SETTING ] ) );
	}
	flush_target_caches();
	if ( is_template_post_type( $post->post_type ) ) {
		queue_site_rerender( 'template' );
	} elseif ( is_site_post_type( $post->post_type ) ) {
		handle_site_doc_change( $post, 'publish' );
	}
}

function handle_site_doc_change( \WP_Post $post, string $reason ): void {
	$for_main = is_site_doc_for_main( $post );
	$live     = live_version_for_post( $post->ID );

	if ( $for_main ) {
		// A deliberate edit replaces any rolled-back version.
		delete_post_meta( $post->ID, META_PINNED );
		refresh_path_status( $post );
	} else {
		delete_post_meta( $post->ID, META_SLUG_STATUS );
	}

	if ( $for_main || $live ) {
		queue_main_render( $post->ID, $reason );
	} elseif ( ! $for_main ) {
		foreach ( array( META_MAIN_STATE, META_MAIN_ERROR, META_RENDER_EVENT, META_MAIN_NOTIFY ) as $key ) {
			delete_post_meta( $post->ID, $key );
		}
	}
}

/**
 * Asks the Main Website whether this page's address is already used there.
 */
function refresh_path_status( \WP_Post $post ): void {
	$path = main_path_for( $post );
	if ( '' === $path || ! is_configured() ) {
		return;
	}
	$result = post_to_main( '/api/wordpress/slug-check', array( 'content_type' => 'page', 'path' => $path ), SLUG_CHECK_TIMEOUT );
	$status = $result['ok'] ? normalize_slug_status( $result['body']['slug_status'] ?? null ) : array( 'checked' => false, 'conflict' => false, 'reason' => '' );

	$previous = get_post_meta( $post->ID, META_SLUG_STATUS, true );
	if ( ! $status['checked'] && is_array( $previous ) && ! empty( $previous['checked'] ) && ( $previous['path'] ?? '' ) === $path ) {
		return; // Keep the last confirmed answer when the Main Website could not be reached.
	}
	$status['path'] = $path;
	$status['time'] = time();
	update_post_meta( $post->ID, META_SLUG_STATUS, $status );
}

function queue_main_render( int $post_id, string $reason, int $delay = 0 ): void {
	// The new job replaces any job still waiting for this page (that one would only find itself
	// superseded), so WP-Cron's single stored job list holds at most one job per page.
	unschedule_render_jobs( $post_id );
	$event_id = wp_generate_uuid4();
	update_post_meta( $post_id, META_RENDER_EVENT, $event_id );
	update_post_meta( $post_id, META_MAIN_STATE, STATE_PUBLISHING );
	update_post_meta( $post_id, META_RENDER_TOUCH, time() + $delay );
	delete_post_meta( $post_id, META_MAIN_ERROR );
	wp_schedule_single_event( render_job_time( $delay ), RENDER_HOOK, array( $post_id, $event_id, 1, $reason ) );
}

/**
 * When a render job runs. WP-Cron runs due jobs oldest first, so a page saved now would wait
 * behind every page of a site-wide re-render still in progress (hundreds of pages): a job wanted
 * now goes just ahead of the earliest waiting render job instead.
 */
function render_job_time( int $delay ): int {
	$now = time();
	if ( $delay > 0 ) {
		return $now + $delay;
	}
	$when = $now;
	foreach ( (array) _get_cron_array() as $timestamp => $hooks ) {
		if ( ! empty( $hooks[ RENDER_HOOK ] ) ) {
			$when = min( $when, (int) $timestamp - 1 );
		}
	}
	return $when;
}

/**
 * WP-Cron keeps every job in one stored list: two requests saving it at the same moment can drop
 * a job, and a cron run can be cut off mid-job. Either way a page would stay "Publishing…" for ever.
 * Re-queue any page that is still publishing, has no job waiting, and has seen no activity for a
 * few minutes. Runs hourly and whenever the publishing status is shown in the admin.
 *
 * @return int pages re-queued
 */
function requeue_stalled_renders(): int {
	$due = get_option( RERENDER_DUE_OPTION );
	if ( is_rerender_overdue( is_array( $due ) ? $due : null, hook_is_scheduled( RERENDER_ALL_HOOK ), time() ) ) {
		run_site_rerender( (string) ( $due['reason'] ?? 'global' ) ); // Its job was lost.
	}
	$ids = get_posts(
		array(
			'post_type'        => SITE_POST_TYPES,
			'post_status'      => array( 'publish', 'draft', 'pending', 'private', 'future', 'trash' ),
			'fields'           => 'ids',
			'posts_per_page'   => 100,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_MAIN_STATE, 'value' => STATE_PUBLISHING ) ),
		)
	);
	if ( ! $ids ) {
		return 0;
	}
	$waiting = scheduled_render_event_ids();
	$count   = 0;
	foreach ( $ids as $post_id ) {
		$post_id = (int) $post_id;
		if ( is_render_stalled( (string) get_post_meta( $post_id, META_RENDER_EVENT, true ), $waiting, (int) get_post_meta( $post_id, META_RENDER_TOUCH, true ), time() ) ) {
			// Not "publish": a page an administrator rolled back stays rolled back.
			queue_main_render( $post_id, 'recovered' );
			log_publish( $post_id, (string) main_path_for( get_post( $post_id ) ), 'render_requeued', '' );
			++$count;
		}
	}
	return $count;
}

/**
 * A requested site-wide re-render is overdue when no re-render job is waiting and it was requested
 * more than RERENDER_OVERDUE_AFTER seconds ago (the job normally runs 30 seconds after the request).
 */
function is_rerender_overdue( ?array $due, bool $job_waiting, int $now ): bool {
	return null !== $due && ! $job_waiting && $now - (int) ( $due['at'] ?? 0 ) > RERENDER_OVERDUE_AFTER;
}

function hook_is_scheduled( string $hook ): bool {
	foreach ( (array) _get_cron_array() as $hooks ) {
		if ( ! empty( $hooks[ $hook ] ) ) {
			return true;
		}
	}
	return false;
}

/**
 * WP-Cron's runner (wp-cron.php) reads the job list once (WordPress keeps it in memory with the
 * other autoloaded options) and writes that copy back as it removes each job it runs. During a
 * long run - a site-wide re-render takes many minutes - it would write back an old copy and drop
 * jobs added meanwhile, such as an administrator's publish (seen on staging: the page waited for
 * the 3-minute stall recovery). Forgetting the in-memory copy after each of our jobs makes the
 * runner's next write start from the current list.
 */
function forget_cached_cron_list(): void {
	wp_cache_delete( 'alloptions', 'options' );
	wp_cache_delete( 'cron', 'options' );
}

/**
 * 'pre_unschedule_event' / 'pre_reschedule_event' (fired just before the job list is read and
 * written back): in a WP-Cron run, read it fresh - other plugins' long jobs run in the same loop.
 *
 * @param mixed $pre Short-circuit value; passed through unchanged.
 * @return mixed
 */
function fresh_cron_list_in_cron_run( $pre ) {
	if ( wp_doing_cron() ) {
		forget_cached_cron_list();
	}
	return $pre;
}

/** Removes the render jobs waiting in WP-Cron for one page. */
function unschedule_render_jobs( int $post_id ): void {
	foreach ( (array) _get_cron_array() as $timestamp => $hooks ) {
		foreach ( (array) ( $hooks[ RENDER_HOOK ] ?? array() ) as $event ) {
			if ( (int) ( $event['args'][0] ?? 0 ) === $post_id ) {
				wp_unschedule_event( (int) $timestamp, RENDER_HOOK, (array) $event['args'] );
			}
		}
	}
}

/** Event ids of the render jobs waiting in WP-Cron. */
function scheduled_render_event_ids(): array {
	$ids = array();
	foreach ( (array) _get_cron_array() as $hooks ) {
		foreach ( (array) ( $hooks[ RENDER_HOOK ] ?? array() ) as $event ) {
			$ids[] = (string) ( $event['args'][1] ?? '' );
		}
	}
	return $ids;
}

/**
 * A render is stalled when its job is no longer waiting and nothing has happened for STALLED_AFTER
 * seconds (a running job touches the page when it starts; a render is limited to RENDER_TIMEOUT).
 */
function is_render_stalled( string $event_id, array $waiting_event_ids, int $last_activity, int $now ): bool {
	if ( '' !== $event_id && in_array( $event_id, $waiting_event_ids, true ) ) {
		return false;
	}
	return $now - $last_activity > STALLED_AFTER;
}

/**
 * Runs the stalled-publish check at most once a minute. Called from admin screens that show
 * publishing status and from the Main Website's regular manifest requests.
 */
function maybe_requeue_stalled_renders(): void {
	if ( ! get_transient( 'acv_cms_stall_check' ) ) {
		set_transient( 'acv_cms_stall_check', 1, MINUTE_IN_SECONDS );
		requeue_stalled_renders();
	}
}

/** Keeps the recurring jobs scheduled (they can be dropped the same way as any other job). */
function ensure_recurring_jobs(): void {
	if ( ! wp_next_scheduled( STALL_CHECK_HOOK ) ) {
		wp_schedule_event( time() + HOUR_IN_SECONDS, 'hourly', STALL_CHECK_HOOK );
	}
	if ( ! wp_next_scheduled( DAILY_REFRESH_HOOK ) ) {
		wp_schedule_event( time() + 12 * HOUR_IN_SECONDS, 'twicedaily', DAILY_REFRESH_HOOK );
	}
}

/**
 * Global design changed: re-render every page that is live on (or targeted at) Main.
 * Debounced so a burst of saves (e.g. editing several templates) causes one re-render.
 */
function queue_site_rerender( string $reason ): void {
	// Also recorded outside WP-Cron's job list: if the job below is lost, requeue_stalled_renders()
	// still finds that a site-wide re-render is due.
	update_option( RERENDER_DUE_OPTION, array( 'reason' => $reason, 'at' => time() ), false );
	// One waiting site-wide re-render covers every change (a kit, a menu and a template saved
	// together are one re-render, not one per kind of change).
	if ( ! hook_is_scheduled( RERENDER_ALL_HOOK ) ) {
		wp_schedule_single_event( time() + 30, RERENDER_ALL_HOOK, array( $reason ) );
	}
}

/**
 * Re-render every Main page when Elementor's active kit (Site Settings) changes, however it was saved.
 */
function maybe_rerender_for_kit_change( $meta_id, $object_id, $meta_key ): void {
	if ( '_elementor_page_settings' === $meta_key && (int) $object_id > 0 && (int) $object_id === (int) get_option( 'elementor_active_kit' ) ) {
		queue_site_rerender( 'global-styles' );
	}
}

function run_site_rerender( $reason = 'global' ): void {
	$due = get_option( RERENDER_DUE_OPTION );
	if ( is_array( $due ) && (int) ( $due['at'] ?? 0 ) <= time() ) {
		delete_option( RERENDER_DUE_OPTION ); // A change saved from now on records a new request.
	}
	$ids = get_posts(
		array(
			'post_type'        => SITE_POST_TYPES,
			'post_status'      => 'publish',
			'fields'           => 'ids',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_TARGET, 'value' => array( TARGET_MAIN, TARGET_BOTH ), 'compare' => 'IN' ) ),
		)
	);
	// A page whose own job is already waiting (an editor just saved it) keeps that job and its place
	// in the queue: it renders with the new design anyway, as rendering reads the design when it runs.
	$waiting = array();
	foreach ( (array) _get_cron_array() as $hooks ) {
		foreach ( (array) ( $hooks[ RENDER_HOOK ] ?? array() ) as $event ) {
			$waiting[ (int) ( $event['args'][0] ?? 0 ) ] = true;
		}
	}
	$delay = 0;
	foreach ( site_rerender_order( array_map( 'intval', $ids ) ) as $post_id ) {
		if ( get_post_meta( $post_id, META_PINNED, true ) || isset( $waiting[ $post_id ] ) ) {
			continue; // Pinned: an administrator rolled this page back; keep that version.
		}
		queue_main_render( $post_id, (string) $reason, $delay );
		$delay += RERENDER_STAGGER;
	}
}

/**
 * Seconds between the pages of a site-wide re-render. WP-Cron renders one page at a time anyway;
 * the gap only leaves room for other requests on shared hosting. 2 s ≈ 10–15 minutes for ~300 pages.
 */
const RERENDER_STAGGER = 2;

/** Most-visited first: the homepage, then pages, courses, locations, tools, blog posts. */
function site_rerender_order( array $ids ): array {
	$rank = array_flip( array( 'page', 'acv_course', 'acv_location', 'acv_tool', 'acv_blog' ) );
	$keyed = array();
	foreach ( $ids as $i => $id ) {
		$type     = (string) get_post_type( $id );
		$home     = 'page' === $type && '1' === (string) get_post_meta( $id, META_MAIN_HOMEPAGE, true );
		$keyed[]  = array( $home ? -1 : ( $rank[ $type ] ?? 9 ), $i, $id );
	}
	sort( $keyed );
	return array_column( $keyed, 2 );
}

function run_daily_refresh(): void {
	run_site_rerender( 'refresh' );
}

/**
 * WP-Cron job: render one page for the Main Website.
 */
function run_render_job( $post_id, $event_id, $attempt = 1, $reason = 'publish' ): void {
	$post_id = (int) $post_id;
	$attempt = max( 1, (int) $attempt );
	$post    = get_post( $post_id );
	if ( ! $post instanceof \WP_Post || get_post_meta( $post_id, META_RENDER_EVENT, true ) !== $event_id ) {
		return; // Deleted, or a newer save replaced this job.
	}
	update_post_meta( $post_id, META_RENDER_TOUCH, time() );

	$live = live_version_for_post( $post_id );

	if ( ! is_site_doc_for_main( $post ) ) {
		if ( $live ) {
			clear_live_version( $post_id );
			update_post_meta( $post_id, META_MAIN_STATE, STATE_REMOVED );
			update_post_meta( $post_id, META_MAIN_AT, time() );
			notify_main( array( 'action' => 'remove', 'path' => $live['main_path'] ), $post_id );
		} else {
			delete_post_meta( $post_id, META_MAIN_STATE );
		}
		return;
	}

	if ( 'publish' !== $reason && get_post_meta( $post_id, META_PINNED, true ) ) {
		update_post_meta( $post_id, META_MAIN_STATE, STATE_ROLLED_BACK );
		return;
	}

	$path   = main_path_for( $post );
	$render = render_for_main( $post );

	if ( ! $render['ok'] ) {
		if ( $attempt < MAX_SYNC_ATTEMPTS ) {
			wp_schedule_single_event( time() + RETRY_DELAYS[ $attempt ], RENDER_HOOK, array( $post_id, $event_id, $attempt + 1, $reason ) );
			update_post_meta( $post_id, META_RENDER_TOUCH, time() + RETRY_DELAYS[ $attempt ] );
			update_post_meta( $post_id, META_MAIN_ERROR, $render['error'] );
			log_publish( $post_id, $path, 'render_retry', $render['error'] );
			return;
		}
		update_post_meta( $post_id, META_MAIN_STATE, STATE_FAILED );
		update_post_meta( $post_id, META_MAIN_ERROR, $render['error'] );
		log_publish( $post_id, $path, 'render_failed', $render['error'] );
		error_log( sprintf( '[acadvizen-cms] Main render failed after %d attempts: post=%d path=%s error=%s', $attempt, $post_id, $path, $render['error'] ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		return;
	}

	// The page was saved again while this render ran (two WP-Cron runs can overlap): this render
	// shows the older content, so it must not become live. The newer job publishes instead.
	if ( is_render_superseded( $post_id, (string) $event_id ) ) {
		log_publish( $post_id, $path, 'superseded', 'a newer save replaced this render' );
		return;
	}

	$version = store_live_version( $post_id, $path, $render['html'], is_noindex( $post_id ), $reason );
	if ( $live && $live['main_path'] !== $path ) {
		remember_moved_path( $live['main_path'], $post_id );
	}
	update_post_meta( $post_id, META_MAIN_STATE, STATE_PUBLISHED );
	update_post_meta( $post_id, META_MAIN_AT, time() );
	delete_post_meta( $post_id, META_MAIN_ERROR );
	log_publish( $post_id, $path, 'rendered', 'version ' . $version['version'] . ', ' . size_format( (int) $version['bytes'] ) );

	notify_main(
		array(
			'action'        => 'upsert',
			'path'          => $path,
			'previous_path' => ( $live && $live['main_path'] !== $path ) ? $live['main_path'] : null,
		),
		$post_id
	);
}

/** Whether a newer save replaced this render job (read from the database, not this request's cache). */
function is_render_superseded( int $post_id, string $event_id ): bool {
	wp_cache_delete( $post_id, 'post_meta' );
	return get_post_meta( $post_id, META_RENDER_EVENT, true ) !== $event_id;
}

/**
 * Requests the page from this WordPress with a signed "Main render" header.
 *
 * @return array{ok: bool, html: string, error: string}
 */
function render_for_main( \WP_Post $post ): array {
	$permalink = (string) get_permalink( $post );
	$wp_path   = (string) wp_parse_url( $permalink, PHP_URL_PATH );
	$query     = (string) wp_parse_url( $permalink, PHP_URL_QUERY );
	$timestamp = time();
	$headers   = array(
		'X-Acadvizen-Render-Timestamp' => (string) $timestamp,
		'X-Acadvizen-Render-Post'      => (string) $post->ID,
		'X-Acadvizen-Render-Signature' => sign_payload( 'loopback.' . $post->ID . '.' . $wp_path, $timestamp, webhook_secret() ),
		'Cache-Control'                => 'no-cache',
	);
	if ( defined( 'ACADVIZEN_CMS_LOOPBACK_URL' ) ) {
		$headers['Host'] = url_hostport( public_site_url() );
	}

	if ( strlen( webhook_secret() ) < MIN_SECRET_LENGTH ) {
		return array( 'ok' => false, 'html' => '', 'error' => 'not_configured' );
	}

	$url      = loopback_base() . $wp_path . ( '' !== $query ? '?' . $query : '' );
	$args     = array(
		'timeout'             => RENDER_TIMEOUT,
		'redirection'         => 0,
		'headers'             => $headers,
		'limit_response_size' => MAX_RENDER_BYTES,
		'sslverify'           => apply_filters( 'https_local_ssl_verify', true ),
	);
	$response = wp_remote_get( $url, $args );
	// A site whose WordPress Address is http:// but which is served over https (enroll and its
	// staging copy) redirects the loopback. Follow only that same-URL scheme upgrade.
	if ( ! is_wp_error( $response ) && in_array( (int) wp_remote_retrieve_response_code( $response ), array( 301, 302, 307, 308 ), true ) ) {
		$location = (string) wp_remote_retrieve_header( $response, 'location' );
		if ( is_https_upgrade_of( $url, $location ) ) {
			$response = wp_remote_get( $location, $args );
		}
	}
	if ( is_wp_error( $response ) ) {
		return array( 'ok' => false, 'html' => '', 'error' => $response->get_error_code() . ': ' . $response->get_error_message() );
	}

	$status = (int) wp_remote_retrieve_response_code( $response );
	$html   = (string) wp_remote_retrieve_body( $response );
	if ( 200 !== $status ) {
		return array( 'ok' => false, 'html' => '', 'error' => 'http_' . $status );
	}
	if ( false === strpos( $html, RENDER_MARKER ) || false === stripos( $html, '</html>' ) ) {
		return array( 'ok' => false, 'html' => '', 'error' => 'incomplete_render' );
	}
	return array( 'ok' => true, 'html' => trim( str_replace( RENDER_MARKER, '', $html ) ), 'error' => '' );
}

/**
 * True only when $to is exactly $from with http:// replaced by https://.
 */
function is_https_upgrade_of( string $from, string $to ): bool {
	return 0 === strpos( $from, 'http://' ) && 'https://' . substr( $from, 7 ) === $to;
}

function is_noindex( int $post_id ): bool {
	$robots = get_post_meta( $post_id, 'rank_math_robots', true );
	return is_array( $robots ) && in_array( 'noindex', $robots, true );
}

/**
 * Signed notification to the Main Website, retried in the background if it fails.
 */
function notify_main( array $change, int $post_id, int $attempt = 1, string $event_id = '' ): void {
	$payload = array_merge(
		array(
			'event_id'     => '' !== $event_id ? $event_id : wp_generate_uuid4(),
			'content_type' => 'page',
			'wordpress_id' => $post_id,
			'sent_at'      => gmdate( 'c' ),
		),
		$change
	);
	if ( ! is_configured() ) {
		update_post_meta( $post_id, META_MAIN_NOTIFY, STATUS_NOT_CONFIGURED );
		return;
	}
	$result = post_to_main( '/api/wordpress/revalidate', $payload, NOTIFY_TIMEOUT );
	if ( $result['ok'] ) {
		update_post_meta( $post_id, META_MAIN_NOTIFY, STATUS_SYNCED );
		if ( 'upsert' === $change['action'] && isset( $result['body']['slug_status'] ) ) {
			$status = normalize_slug_status( $result['body']['slug_status'] );
			if ( $status['checked'] ) {
				$status['path'] = $change['path'];
				$status['time'] = time();
				update_post_meta( $post_id, META_SLUG_STATUS, $status );
			}
		}
		log_publish( $post_id, $change['path'], 'main_notified', $change['action'] );
		return;
	}
	if ( $attempt < MAX_SYNC_ATTEMPTS ) {
		update_post_meta( $post_id, META_MAIN_NOTIFY, STATUS_PENDING );
		wp_schedule_single_event( time() + RETRY_DELAYS[ $attempt ], NOTIFY_HOOK, array( $change, $post_id, $attempt + 1, $payload['event_id'] ) );
		log_publish( $post_id, $change['path'], 'notify_retry', $result['error'] );
		return;
	}
	update_post_meta( $post_id, META_MAIN_NOTIFY, STATUS_FAILED );
	log_publish( $post_id, $change['path'], 'notify_failed', $result['error'] );
}

function run_notify_job( $change, $post_id, $attempt, $event_id ): void {
	notify_main( (array) $change, (int) $post_id, (int) $attempt, (string) $event_id );
}

/**
 * Makes an earlier version live again and keeps it until the page is next edited.
 */
function rollback_to_version( int $post_id, int $version_id ): bool {
	$before = live_version_for_post( $post_id );
	if ( ! make_version_live( $post_id, $version_id ) ) {
		return false;
	}
	$after = live_version_for_post( $post_id );
	update_post_meta( $post_id, META_PINNED, $version_id );
	update_post_meta( $post_id, META_MAIN_STATE, STATE_ROLLED_BACK );
	update_post_meta( $post_id, META_MAIN_AT, time() );
	log_publish( $post_id, $after['main_path'], 'rolled_back', 'version ' . $after['version'] );
	notify_main(
		array(
			'action'        => 'upsert',
			'path'          => $after['main_path'],
			'previous_path' => ( $before && $before['main_path'] !== $after['main_path'] ) ? $before['main_path'] : null,
		),
		$post_id
	);
	return true;
}

/**
 * Permanently deleting a page removes it from the Main Website too.
 */
function before_site_doc_deleted( int $post_id, $post ): void {
	if ( ! $post instanceof \WP_Post || ! is_site_post_type( $post->post_type ) ) {
		return;
	}
	$live = live_version_for_post( $post_id );
	delete_versions_for_post( $post_id );
	flush_target_caches();
	if ( $live ) {
		notify_main( array( 'action' => 'remove', 'path' => $live['main_path'] ), $post_id );
	}
}

const PUBLISH_LOG_OPTION = 'acv_cms_publish_log';

function log_publish( int $post_id, string $path, string $outcome, string $detail ): void {
	$log = get_option( PUBLISH_LOG_OPTION, array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift(
		$log,
		array(
			'time'    => time(),
			'post_id' => $post_id,
			'path'    => $path,
			'outcome' => $outcome,
			'detail'  => mb_substr( $detail, 0, 200 ),
		)
	);
	update_option( PUBLISH_LOG_OPTION, array_slice( $log, 0, 100 ), false );
}

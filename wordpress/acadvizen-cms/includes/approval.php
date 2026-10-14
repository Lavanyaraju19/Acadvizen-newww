<?php
/**
 * Approval before anything goes live: Draft → Preview → Pending approval → Approved → Publishing →
 * Published → Verified, for every Elementor-designed page, course, location, template, header and
 * footer (both websites). On while wp-config.php sets ACADVIZEN_CMS_APPROVAL to true.
 *
 * - A live document is never edited directly. Opening it in Elementor (or the WordPress editor) opens
 *   its working copy instead: a private draft with the full design, edited with complete freedom.
 * - "Publish" on a working copy or a new draft submits it for approval (it becomes Pending): the exact
 *   revision is fingerprinted - title, content, Elementor data and page settings, template, featured
 *   and referenced media (file, size, date), destination, SEO and other meta, terms, global styles.
 * - Only a reviewer (capability acv_review_publication) approves, and only that fingerprint. Any later
 *   change, however small, invalidates the approval.
 * - Publishing applies exactly the approved revision to the live document (archiving the previous
 *   one for rollback), lets the existing pipeline draw it for the Main Website, and then VERIFIES each
 *   chosen website by reading the public page and finding the revision mark. Success is reported only
 *   when every chosen website shows the approved revision; otherwise the failed website is named.
 * - Global styles (the Elementor kit) can only be changed by reviewers; trashing or unpublishing a
 *   live document too. Every step is recorded in the approval history.
 *
 * Only editor requests are guarded (Elementor, the block editor and REST, classic editor, quick and
 * bulk edit): other plugins updating their own pages in the background keep working.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const APPROVAL_META       = '_acv_approval';
const COPY_OF_META        = '_acv_copy_of';
const WORKING_COPY_META   = '_acv_working_copy';
const ARCHIVE_OF_META     = '_acv_archive_of';
const LIVE_REVISION_META  = '_acv_live_revision';
const PUBLICATION_META    = '_acv_publication';
const APPROVAL_LOG_OPTION = 'acv_cms_approval_log';
const REVIEW_CAP          = 'acv_review_publication';
const REVIEWER_ROLE       = 'acv_reviewer';
const VERIFY_HOOK         = 'acv_cms_verify_publication';
const SCHEDULE_HOOK       = 'acv_cms_publish_scheduled';
const APPROVALS_PAGE      = 'acadvizen-cms-approvals';
const COMPAT_PAGE         = 'acadvizen-cms-compatibility';
const MAX_ARCHIVES        = 10;
const VERIFY_DELAYS       = array( 15, 45, 90, 180, 300, 600 );

/** Meta that makes up a revision besides title/content (and is applied when publishing). */
const REVISION_META_KEYS = array( '_elementor_data', '_elementor_page_settings', '_elementor_edit_mode', '_elementor_template_type', '_elementor_conditions', '_wp_page_template', '_thumbnail_id', META_TARGET, META_MAIN_PATH, META_MAIN_REPLACE, META_MAIN_HOMEPAGE );

/** Internal state that is never copied between a live document, its working copy and its archives. */
const APPROVAL_PRIVATE_META = array( APPROVAL_META, COPY_OF_META, WORKING_COPY_META, ARCHIVE_OF_META, LIVE_REVISION_META, PUBLICATION_META, '_edit_lock', '_edit_last', '_wp_old_slug', '_wp_old_date', '_elementor_css', '_elementor_page_assets', '_elementor_element_cache', META_MAIN_STATE, META_MAIN_ERROR, META_MAIN_AT, META_MAIN_NOTIFY, META_RENDER_EVENT, META_RENDER_TOUCH, META_PINNED, META_SLUG_STATUS, META_SOURCE, META_IMPORT_BATCH );

function approval_enabled(): bool {
	return feature_enabled( 'APPROVAL' );
}

function approval_bypass( ?bool $set = null ): bool {
	static $on = false;
	if ( null !== $set ) {
		$on = $set;
	}
	return $on;
}

/* Pure logic (unit-tested in tests/php/run.php) ----------------------------------------------------- */

/** The fingerprint of one revision: SHA-256 of its canonical parts. */
function revision_fingerprint( array $parts ): string {
	$sort = static function ( $value ) use ( &$sort ) {
		if ( ! is_array( $value ) ) {
			return $value;
		}
		if ( array_keys( $value ) !== range( 0, count( $value ) - 1 ) ) {
			ksort( $value );
		}
		return array_map( $sort, $value );
	};
	return hash( 'sha256', (string) wp_json_encode( $sort( $parts ) ) );
}

/** Attachment ids referenced by an Elementor design ({"id": 12, "url": "…"} objects) and the featured image. */
function referenced_attachment_ids( array $elements, int $thumbnail = 0 ): array {
	$ids  = $thumbnail > 0 ? array( $thumbnail ) : array();
	$walk = static function ( $node ) use ( &$walk, &$ids ): void {
		if ( ! is_array( $node ) ) {
			return;
		}
		if ( isset( $node['id'], $node['url'] ) && is_numeric( $node['id'] ) && (int) $node['id'] > 0 && is_string( $node['url'] ) ) {
			$ids[] = (int) $node['id'];
		}
		foreach ( $node as $child ) {
			$walk( $child );
		}
	};
	$walk( $elements );
	$ids = array_values( array_unique( $ids ) );
	sort( $ids );
	return $ids;
}

/**
 * The approval state machine.
 *
 * @param array  $state  current state: state, hash, submitted_by, … ('' or 'draft' = editing)
 * @param string $action submit | approve | reject | edited | publish | published
 * @param array  $ctx    hash, user, time, can_review, compat ('ok'|'review'|'code'|'blocked'), code_ok, note
 * @return array|string  the new state, or an error code
 */
function approval_transition( array $state, string $action, array $ctx ) {
	$current = (string) ( $state['state'] ?? '' );
	$hash    = (string) ( $ctx['hash'] ?? '' );
	$event   = static fn( string $what ) => array( 'what' => $what, 'user' => (int) ( $ctx['user'] ?? 0 ), 'time' => (int) ( $ctx['time'] ?? time() ), 'hash' => $hash );
	$history = static fn( array $s, string $what ) => array_slice( array_merge( (array) ( $s['history'] ?? array() ), array( $event( $what ) ) ), -30 );
	switch ( $action ) {
		case 'submit':
			if ( '' === $hash ) {
				return 'no_revision';
			}
			if ( COMPAT_BLOCKED === ( $ctx['compat'] ?? COMPAT_OK ) ) {
				return 'blocked_widgets';
			}
			if ( in_array( $current, array( 'pending', 'approved', 'scheduled' ), true ) && $hash === ( $state['hash'] ?? '' ) ) {
				return $state; // Already waiting for, approved as (or scheduled as), exactly this revision.
			}
			return array( 'state' => 'pending', 'hash' => $hash, 'submitted_by' => (int) ( $ctx['user'] ?? 0 ), 'submitted_at' => (int) ( $ctx['time'] ?? time() ), 'note' => '', 'history' => $history( $state, 'submitted' ) );
		case 'approve':
			if ( empty( $ctx['can_review'] ) ) {
				return 'not_reviewer';
			}
			if ( 'pending' !== $current ) {
				return 'not_pending';
			}
			if ( $hash !== ( $state['hash'] ?? '' ) ) {
				return 'changed_since_submitted';
			}
			if ( COMPAT_BLOCKED === ( $ctx['compat'] ?? COMPAT_OK ) ) {
				return 'blocked_widgets';
			}
			if ( COMPAT_CODE === ( $ctx['compat'] ?? COMPAT_OK ) && empty( $ctx['code_ok'] ) ) {
				return 'code_needs_review';
			}
			// The reviewer confirms the preview of every chosen website (for Both: Main and Enrollment).
			if ( array_diff( (array) ( $ctx['destinations'] ?? array() ), (array) ( $ctx['previews'] ?? array() ) ) ) {
				return 'previews_not_checked';
			}
			return array_merge( $state, array( 'state' => 'approved', 'reviewed_by' => (int) ( $ctx['user'] ?? 0 ), 'reviewed_at' => (int) ( $ctx['time'] ?? time() ), 'self_approved' => (int) ( $ctx['user'] ?? 0 ) === (int) ( $state['submitted_by'] ?? -1 ), 'destinations' => array_values( (array) ( $ctx['destinations'] ?? array() ) ), 'previews_checked' => array_values( (array) ( $ctx['previews'] ?? array() ) ), 'history' => $history( $state, 'approved' ) ) );
		case 'reject':
			if ( empty( $ctx['can_review'] ) ) {
				return 'not_reviewer';
			}
			if ( ! in_array( $current, array( 'pending', 'approved' ), true ) ) {
				return 'not_pending';
			}
			return array_merge( $state, array( 'state' => 'rejected', 'reviewed_by' => (int) ( $ctx['user'] ?? 0 ), 'reviewed_at' => (int) ( $ctx['time'] ?? time() ), 'note' => (string) ( $ctx['note'] ?? '' ), 'history' => $history( $state, 'rejected' ) ) );
		case 'schedule':
			if ( 'approved' !== $current ) {
				return 'not_approved';
			}
			if ( $hash !== ( $state['hash'] ?? '' ) ) {
				return 'changed_since_approved';
			}
			return array_merge( $state, array( 'state' => 'scheduled', 'scheduled_for' => (int) ( $ctx['at'] ?? 0 ), 'scheduled_by' => (int) ( $ctx['user'] ?? 0 ), 'history' => $history( $state, 'scheduled' ) ) );
		case 'unschedule':
			if ( 'scheduled' !== $current ) {
				return 'not_scheduled';
			}
			return array_merge( $state, array( 'state' => 'approved', 'scheduled_for' => 0, 'history' => $history( $state, 'schedule_cancelled' ) ) );
		case 'edited':
			if ( in_array( $current, array( 'pending', 'approved', 'scheduled' ), true ) && $hash !== ( $state['hash'] ?? '' ) ) {
				return array_merge( $state, array( 'state' => 'draft', 'invalidated' => true, 'history' => $history( $state, 'approval_invalidated_by_edit' ) ) );
			}
			return $state;
		case 'publish':
			// A scheduled revision is published by its own job, when it is due.
			if ( 'approved' !== $current && ! ( 'scheduled' === $current && ! empty( $ctx['due'] ) ) ) {
				return 'scheduled' === $current ? 'already_scheduled' : 'not_approved';
			}
			if ( $hash !== ( $state['hash'] ?? '' ) ) {
				return 'changed_since_approved';
			}
			if ( COMPAT_BLOCKED === ( $ctx['compat'] ?? COMPAT_OK ) ) {
				return 'blocked_widgets';
			}
			return array_merge( $state, array( 'state' => 'publishing', 'history' => $history( $state, 'publishing' ) ) );
		case 'published':
			return array_merge( $state, array( 'state' => 'published', 'history' => $history( $state, 'published' ) ) );
	}
	return 'unknown_action';
}

/**
 * Overall result of a publication from each chosen website's verification.
 *
 * @param array $destinations name => array( state => verified|failed|pending|… )
 */
function publication_outcome( array $destinations, bool $final ): string {
	$states   = array_map( static fn( $d ) => (string) ( $d['state'] ?? '' ), $destinations );
	$verified = count( array_filter( $states, static fn( $s ) => 'verified' === $s ) );
	$failed   = count( array_filter( $states, static fn( $s ) => 'failed' === $s ) );
	if ( $states && count( $states ) === $verified ) {
		return 'verified';
	}
	if ( ! $final && count( $states ) !== $verified + $failed ) {
		return 'publishing';
	}
	if ( $failed || $final ) {
		return $verified ? 'partial_failure' : 'failed';
	}
	return 'publishing';
}

/** The text the public page carries so a website can be checked for this exact revision. */
function revision_mark( string $hash ): string {
	return 'acv-revision:' . substr( $hash, 0, 16 );
}

/* Scope and revisions ------------------------------------------------------------------------------- */

function in_approval_scope( \WP_Post $post ): bool {
	if ( ! approval_enabled() || ( ! is_site_post_type( $post->post_type ) && ! is_template_post_type( $post->post_type ) ) ) {
		return false;
	}
	return ! is_kit_post( $post->ID );
}

function is_kit_post( int $post_id ): bool {
	return 'kit' === get_post_meta( $post_id, '_elementor_template_type', true );
}

/** A working copy or an archive: another revision of a live document, not a document of its own. */
function is_revision_copy( int $post_id ): bool {
	return (bool) get_post_meta( $post_id, COPY_OF_META, true ) || (bool) get_post_meta( $post_id, ARCHIVE_OF_META, true );
}

/** The live document a working copy or archive belongs to (0 for a document of its own). */
function revision_copy_of( int $post_id ): int {
	return (int) get_post_meta( $post_id, COPY_OF_META, true ) ?: (int) get_post_meta( $post_id, ARCHIVE_OF_META, true );
}

/** A change to this document waits for approval: it is not live yet, or it is another revision. */
function awaits_approval( \WP_Post $post ): bool {
	return in_approval_scope( $post ) && ! is_live_document( $post );
}

/**
 * Only one live page is the Main homepage. Applied when a page that is the homepage goes live, so
 * a draft or working copy marked as the homepage changes nothing until it is approved.
 */
function claim_main_homepage( int $live_id ): void {
	if ( '1' !== (string) get_post_meta( $live_id, META_MAIN_HOMEPAGE, true ) ) {
		return;
	}
	$others = get_posts( array( 'post_type' => 'page', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1, 'meta_key' => META_MAIN_HOMEPAGE, 'meta_value' => '1', 'exclude' => array( $live_id ) ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	foreach ( $others as $other ) {
		if ( is_revision_copy( (int) $other ) ) {
			continue; // Another revision: its own approval decides.
		}
		delete_post_meta( (int) $other, META_MAIN_HOMEPAGE );
		queue_main_render( (int) $other, 'publish' );
		if ( approval_enabled() ) {
			approval_log( 'homepage_moved', (int) $other, 'no_longer_homepage', '', array( 'new_homepage' => $live_id ) );
		}
	}
}

function is_live_document( \WP_Post $post ): bool {
	return 'publish' === $post->post_status && ! get_post_meta( $post->ID, COPY_OF_META, true ) && ! get_post_meta( $post->ID, ARCHIVE_OF_META, true );
}

function design_elements( int $post_id ): array {
	$raw     = get_post_meta( $post_id, '_elementor_data', true );
	$decoded = is_array( $raw ) ? $raw : json_decode( (string) $raw, true );
	return is_array( $decoded ) ? $decoded : array();
}

/**
 * SEO fields that belong to a revision: what search engines and link previews show (Rank Math or
 * Yoast titles, descriptions, canonical, robots, social and schema fields, the imported JSON-LD).
 * Changing one changes the public page, so it needs approval like the design. Scores and analytics
 * that the SEO plugin recalculates by itself are left out.
 */
function is_revision_seo_key( string $key ): bool {
	return 1 === preg_match( '/^(rank_math_(title|description|focus_keyword|canonical_url|robots|advanced_robots|facebook_|twitter_|schema_|breadcrumb_title|snippet_)|_yoast_wpseo_(title|metadesc|canonical|meta-robots|opengraph|twitter|schema_)|_acv_json_ld$)/', $key );
}

function revision_parts( \WP_Post $post ): array {
	$meta = array();
	foreach ( REVISION_META_KEYS as $key ) {
		$value        = get_post_meta( $post->ID, $key, true );
		$meta[ $key ] = is_scalar( $value ) ? (string) $value : (string) wp_json_encode( $value );
	}
	foreach ( (array) get_post_meta( $post->ID ) as $key => $values ) {
		if ( is_revision_seo_key( (string) $key ) ) {
			$value                 = maybe_unserialize( $values[0] ?? '' );
			$meta[ (string) $key ] = is_scalar( $value ) ? (string) $value : (string) wp_json_encode( $value );
		}
	}
	$terms = array();
	foreach ( get_object_taxonomies( $post->post_type ) as $taxonomy ) {
		$ids = wp_get_object_terms( $post->ID, $taxonomy, array( 'fields' => 'ids' ) );
		if ( is_array( $ids ) && $ids ) {
			sort( $ids );
			$terms[ $taxonomy ] = $ids;
		}
	}
	$media = array();
	foreach ( referenced_attachment_ids( design_elements( $post->ID ), (int) get_post_meta( $post->ID, '_thumbnail_id', true ) ) as $id ) {
		$file         = get_attached_file( $id );
		$media[ $id ] = $file && file_exists( $file ) ? basename( $file ) . ':' . filesize( $file ) . ':' . filemtime( $file ) : 'missing';
	}
	$kit = (int) get_option( 'elementor_active_kit' );
	return array(
		'title'   => $post->post_title,
		'content' => $post->post_content,
		'excerpt' => $post->post_excerpt,
		'order'   => (int) $post->menu_order,
		'parent'  => (int) $post->post_parent,
		'meta'    => $meta,
		'terms'   => $terms,
		'media'   => $media,
		'globals' => $kit ? md5( (string) wp_json_encode( get_post_meta( $kit, '_elementor_page_settings', true ) ) ) : '',
	);
}

function current_fingerprint( \WP_Post $post ): string {
	return revision_fingerprint( revision_parts( $post ) );
}

/** 'main' and/or 'enrollment' for a document's chosen destination. */
function chosen_destinations( \WP_Post $post ): array {
	$target = get_publish_target( $post->ID );
	if ( is_template_post_type( $post->post_type ) && '' === (string) get_post_meta( $post->ID, META_TARGET, true ) ) {
		return array( 'enrollment' ); // A template with no Publish To is an Enrollment template, as before.
	}
	$out    = array();
	if ( targets_enrollment( $target ) ) {
		$out[] = 'enrollment';
	}
	if ( TARGET_MAIN === $target || TARGET_BOTH === $target ) {
		$out[] = 'main';
	}
	return $out;
}

/**
 * Why this WordPress cannot draw Elementor popups, or '' when it can. Popups are an Elementor Pro
 * document type: Pro must be loaded AND have registered the 'popup' type with Elementor (a Pro that
 * is installed but did not finish loading draws no popup).
 *
 * @param bool|null  $pro            Elementor Pro loaded (tests pass it)
 * @param array|null $document_types Elementor's registered document types (tests pass them)
 */
function popup_blocker( ?bool $pro = null, ?array $document_types = null ): string {
	if ( ! ( $pro ?? defined( 'ELEMENTOR_PRO_VERSION' ) ) ) {
		return 'popups need Elementor Pro, which is not active on this WordPress';
	}
	if ( null === $document_types ) {
		$documents      = class_exists( '\Elementor\Plugin' ) ? ( \Elementor\Plugin::$instance->documents ?? null ) : null;
		$document_types = $documents ? (array) $documents->get_document_types() : array();
	}
	return isset( $document_types['popup'] ) ? '' : 'Elementor Pro is active but its popup feature is not loaded on this WordPress';
}

function document_compatibility( \WP_Post $post ): array {
	$elements = design_elements( $post->ID );
	$report   = compatibility_report( $elements, chosen_destinations( $post ) );
	// Popups are drawn by Elementor Pro: without it a popup can never appear on either website.
	$popup_blocker = 'popup' === get_post_meta( $post->ID, '_elementor_template_type', true ) ? popup_blocker() : '';
	if ( '' !== $popup_blocker ) {
		foreach ( chosen_destinations( $post ) ?: array( 'enrollment' ) as $destination ) {
			$report['items'][] = array( 'status' => COMPAT_BLOCKED, 'why' => $popup_blocker, 'fix' => 'activate Elementor Pro (licensed) and check its popups load, or use a section on the page instead', 'widget' => '(popup)', 'count' => 0, 'destination' => $destination, 'provider' => '', 'version' => '' );
		}
		$report['status'] = COMPAT_BLOCKED;
	}
	// An Elementor document with nothing in it would show an empty page, header or footer.
	if ( ! $elements && 'builder' === get_post_meta( $post->ID, '_elementor_edit_mode', true ) ) {
		foreach ( chosen_destinations( $post ) ?: array( 'enrollment' ) as $destination ) {
			$report['items'][] = array( 'status' => COMPAT_BLOCKED, 'why' => 'the Elementor design is empty: it would show nothing', 'fix' => 'design it in Elementor, or restore an earlier revision', 'widget' => '(whole design)', 'count' => 0, 'destination' => $destination, 'provider' => '', 'version' => '' );
		}
		$report['status'] = COMPAT_BLOCKED;
	}
	return $report;
}

function approval_state( int $post_id ): array {
	$state = get_post_meta( $post_id, APPROVAL_META, true );
	return is_array( $state ) ? $state : array();
}

/* Audit history ------------------------------------------------------------------------------------- */

function approval_log( string $action, int $post_id, string $outcome, string $detail = '', array $extra = array() ): void {
	$log   = (array) get_option( APPROVAL_LOG_OPTION, array() );
	$log[] = array_merge(
		array(
			'time'    => time(),
			'user'    => get_current_user_id(),
			'action'  => $action,
			'post'    => $post_id,
			'title'   => get_the_title( $post_id ),
			'outcome' => $outcome,
			'detail'  => $detail,
		),
		$extra
	);
	update_option( APPROVAL_LOG_OPTION, array_slice( $log, -1000 ), false );
}

function approval_flash( string $type, string $message ): void {
	set_transient( 'acv_cms_approval_notice_' . get_current_user_id(), array( $type, $message ), 120 );
}

/* Copies: working copies (edits) and archives (previous live revisions) -------------------------------- */

/** A private copy of a document (all meta except internal state, terms) with the given overrides. */
function copy_document( \WP_Post $source, array $overrides, array $extra_meta ): int {
	$id = wp_insert_post(
		wp_slash(
			array_merge(
				array(
					'post_type'      => $source->post_type,
					'post_title'     => $source->post_title,
					'post_content'   => $source->post_content,
					'post_excerpt'   => $source->post_excerpt,
					'post_parent'    => $source->post_parent,
					'menu_order'     => $source->menu_order,
					'post_status'    => 'draft',
					'post_author'    => get_current_user_id() ?: $source->post_author,
					'comment_status' => $source->comment_status,
					'ping_status'    => $source->ping_status,
				),
				$overrides
			)
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return 0;
	}
	foreach ( get_post_meta( $source->ID ) as $key => $values ) {
		if ( in_array( $key, APPROVAL_PRIVATE_META, true ) ) {
			continue;
		}
		foreach ( $values as $value ) {
			add_post_meta( $id, $key, wp_slash( maybe_unserialize( $value ) ) );
		}
	}
	foreach ( $extra_meta as $key => $value ) {
		update_post_meta( $id, $key, $value );
	}
	foreach ( get_object_taxonomies( $source->post_type ) as $taxonomy ) {
		wp_set_object_terms( $id, wp_get_object_terms( $source->ID, $taxonomy, array( 'fields' => 'ids' ) ), $taxonomy );
	}
	return (int) $id;
}

/** The open working copy of a live document, created on first use. */
function working_copy_for( \WP_Post $live, bool $create = true ): int {
	$existing = (int) get_post_meta( $live->ID, WORKING_COPY_META, true );
	if ( $existing && ( $copy = get_post( $existing ) ) && 'trash' !== $copy->post_status && (int) get_post_meta( $existing, COPY_OF_META, true ) === $live->ID ) {
		return $existing;
	}
	if ( ! $create ) {
		return 0;
	}
	approval_bypass( true );
	$copy_id = copy_document( $live, array( 'post_name' => '' ), array( COPY_OF_META => $live->ID ) );
	approval_bypass( false );
	if ( $copy_id ) {
		update_post_meta( $live->ID, WORKING_COPY_META, $copy_id );
		approval_log( 'working_copy', $live->ID, 'created', '', array( 'copy' => $copy_id ) );
	}
	return $copy_id;
}

/** Applies a revision (working copy or archive) to the live document. */
function apply_revision( \WP_Post $from, \WP_Post $to ): void {
	approval_bypass( true );
	wp_update_post(
		wp_slash(
			array(
				'ID'           => $to->ID,
				'post_title'   => $from->post_title,
				'post_content' => $from->post_content,
				'post_excerpt' => $from->post_excerpt,
				'menu_order'   => $from->menu_order,
				'post_parent'  => $from->post_parent,
			)
		)
	);
	foreach ( get_post_meta( $from->ID ) as $key => $values ) {
		if ( in_array( $key, APPROVAL_PRIVATE_META, true ) ) {
			continue;
		}
		delete_post_meta( $to->ID, $key );
		foreach ( $values as $value ) {
			add_post_meta( $to->ID, $key, wp_slash( maybe_unserialize( $value ) ) );
		}
	}
	foreach ( REVISION_META_KEYS as $key ) {
		if ( ! metadata_exists( 'post', $from->ID, $key ) ) {
			delete_post_meta( $to->ID, $key );
		}
	}
	foreach ( get_object_taxonomies( $to->post_type ) as $taxonomy ) {
		wp_set_object_terms( $to->ID, wp_get_object_terms( $from->ID, $taxonomy, array( 'fields' => 'ids' ) ), $taxonomy );
	}
	// Elementor's stored output of the old design (rendered widgets, page assets) would keep showing it.
	delete_post_meta( $to->ID, '_elementor_element_cache' );
	delete_post_meta( $to->ID, '_elementor_page_assets' );
	if ( class_exists( '\\Elementor\\Core\\Files\\CSS\\Post' ) ) {
		\Elementor\Core\Files\CSS\Post::create( $to->ID )->delete(); // Regenerated with the new design.
	}
	clean_post_cache( $to->ID );
	approval_bypass( false );
}

function archive_live( \WP_Post $live ): int {
	approval_bypass( true );
	/* translators: 1: title, 2: date */
	$id = copy_document( $live, array( 'post_name' => '', 'post_title' => $live->post_title ), array( ARCHIVE_OF_META => $live->ID, LIVE_REVISION_META => (string) get_post_meta( $live->ID, LIVE_REVISION_META, true ) ) );
	approval_bypass( false );
	$archives = archives_of( $live->ID );
	foreach ( array_slice( $archives, MAX_ARCHIVES ) as $old ) {
		wp_delete_post( $old, true );
	}
	return $id;
}

/** Archived previous revisions of a live document, newest first. */
function archives_of( int $live_id ): array {
	// Named types: 'any' leaves out types hidden from search, such as Elementor header/footer templates.
	return array_map( 'intval', get_posts( array( 'post_type' => array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES ), 'post_status' => 'any', 'posts_per_page' => 50, 'fields' => 'ids', 'orderby' => 'ID', 'order' => 'DESC', 'meta_key' => ARCHIVE_OF_META, 'meta_value' => $live_id ) ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
}

/* Guards: nothing reaches a live document without approval -------------------------------------------- */

function is_editor_request(): bool {
	// phpcs:disable WordPress.Security.NonceVerification -- routing checks only; WordPress verifies its own nonces.
	$action = isset( $_REQUEST['action'] ) ? sanitize_key( wp_unslash( $_REQUEST['action'] ) ) : '';
	return in_array( $action, array( 'editpost', 'inline-save', 'elementor_ajax' ), true ) || ! empty( $_REQUEST['bulk_edit'] ) || ( defined( 'REST_REQUEST' ) && REST_REQUEST );
	// phpcs:enable
}

/** Opening a live document in Elementor or the WordPress editor opens its working copy instead. */
function redirect_live_to_working_copy(): void {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- a redirect to an edit screen, no change made.
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	$action  = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
	// phpcs:enable
	if ( ! $post_id || ! in_array( $action, array( 'edit', 'elementor' ), true ) || 'GET' !== ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) ) {
		return;
	}
	$post = get_post( $post_id );
	if ( ! $post instanceof \WP_Post || ! in_approval_scope( $post ) || ! is_live_document( $post ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	$copy = working_copy_for( $post );
	if ( ! $copy ) {
		return;
	}
	approval_flash( 'info', __( 'This page is live. You are editing its working copy: visitors keep seeing the live page until a reviewer approves your changes and they are published.', 'acadvizen-cms' ) );
	wp_safe_redirect( admin_url( 'post.php?post=' . $copy . '&action=' . $action ) );
	exit;
}

/** Elementor saves: a live document's design cannot be saved; the global styles only by reviewers. */
function guard_elementor_save( $document, $data ): void {
	if ( approval_bypass() || ! approval_enabled() || ! is_object( $document ) || ! method_exists( $document, 'get_main_id' ) || is_autosave_document( $document ) ) {
		return;
	}
	if ( is_array( $data ) && 'autosave' === ( $data['settings']['post_status'] ?? '' ) ) {
		return;
	}
	$post = get_post( (int) $document->get_main_id() );
	if ( ! $post instanceof \WP_Post ) {
		return;
	}
	if ( is_kit_post( $post->ID ) ) {
		if ( ! current_user_can( REVIEW_CAP ) ) {
			throw new \Exception( esc_html__( 'Global styles change both websites at once: only a reviewer can save them.', 'acadvizen-cms' ) );
		}
		approval_log( 'global_styles', $post->ID, 'saved_by_reviewer' );
		return;
	}
	if ( in_approval_scope( $post ) && is_live_document( $post ) ) {
		throw new \Exception( esc_html__( 'Not saved: this page is live and changes need approval. Close the editor and open the page again: you will get its working copy.', 'acadvizen-cms' ) );
	}
}

/** Block editor and REST saves of a live document are refused; publishing becomes "submit for approval". */
function guard_rest_insert( $prepared, $request ) {
	if ( approval_bypass() || ! approval_enabled() || ! is_object( $prepared ) ) {
		return $prepared;
	}
	$existing = ! empty( $prepared->ID ) ? get_post( (int) $prepared->ID ) : null;
	if ( $existing instanceof \WP_Post && in_approval_scope( $existing ) && is_live_document( $existing ) ) {
		return new \WP_Error( 'acv_live_needs_approval', __( 'This page is live: changes need approval. Edit its working copy instead.', 'acadvizen-cms' ), array( 'status' => 403 ) );
	}
	if ( isset( $prepared->post_status ) && in_array( $prepared->post_status, array( 'publish', 'future' ), true ) ) {
		$type = $existing instanceof \WP_Post ? $existing->post_type : (string) ( $prepared->post_type ?? '' );
		if ( is_site_post_type( $type ) || is_template_post_type( $type ) ) {
			$prepared->post_status = 'pending';
		}
	}
	return $prepared;
}

/** Classic editor, quick and bulk edit, Elementor's own status change. */
function guard_post_data( array $data, array $postarr ): array {
	if ( approval_bypass() || ! approval_enabled() || ! is_editor_request() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return $data;
	}
	$type = (string) ( $data['post_type'] ?? '' );
	if ( ( ! is_site_post_type( $type ) && ! is_template_post_type( $type ) ) || in_array( $data['post_status'] ?? '', array( 'auto-draft', 'inherit', 'trash' ), true ) ) {
		return $data;
	}
	$existing = ! empty( $postarr['ID'] ) ? get_post( (int) $postarr['ID'] ) : null;
	if ( $existing instanceof \WP_Post && ( ! in_approval_scope( $existing ) ) ) {
		return $data;
	}
	if ( $existing instanceof \WP_Post && is_live_document( $existing ) ) {
		if ( 'publish' !== ( $data['post_status'] ?? '' ) && current_user_can( REVIEW_CAP ) ) {
			approval_log( 'unpublish', $existing->ID, 'by_reviewer' );
			return $data; // A reviewer may take a live page off line.
		}
		wp_die( esc_html__( 'This page is live: changes need approval. Edit its working copy instead.', 'acadvizen-cms' ), 403 );
	}
	if ( in_array( $data['post_status'] ?? '', array( 'publish', 'future' ), true ) ) {
		$data['post_status'] = 'pending'; // "Publish" submits for approval.
	}
	return $data;
}

/** Trash and permanent deletion of a live document: reviewers only. */
function guard_trash( $check, $post ) {
	$post = get_post( $post );
	if ( approval_bypass() || ! $post instanceof \WP_Post || ! in_approval_scope( $post ) || ! is_live_document( $post ) ) {
		return $check;
	}
	if ( current_user_can( REVIEW_CAP ) ) {
		approval_log( 'remove_live', $post->ID, 'by_reviewer' );
		return $check;
	}
	approval_flash( 'error', __( 'A live page can only be removed by a reviewer.', 'acadvizen-cms' ) );
	return false;
}

/* Submission and invalidation on save ----------------------------------------------------------------- */

function after_candidate_saved( int $post_id, $post ): void {
	if ( ! $post instanceof \WP_Post || approval_bypass() || ! in_approval_scope( $post ) || is_live_document( $post ) || get_post_meta( $post_id, ARCHIVE_OF_META, true ) || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( is_elementor_editor_save() ) {
		return; // The design is stored after the post: after_candidate_design_saved() handles it.
	}
	refresh_candidate( $post );
}

function after_candidate_design_saved( $document, $data ): void {
	if ( ! is_object( $document ) || ! method_exists( $document, 'get_main_id' ) || is_autosave_document( $document ) || approval_bypass() ) {
		return;
	}
	$post = get_post( (int) $document->get_main_id() );
	if ( $post instanceof \WP_Post && in_approval_scope( $post ) && ! is_live_document( $post ) && ! get_post_meta( $post->ID, ARCHIVE_OF_META, true ) ) {
		refresh_candidate( $post );
	}
}

/** After a save: invalidate an approval the save changed; a save as Pending submits it. */
function refresh_candidate( \WP_Post $post ): void {
	$state  = approval_state( $post->ID );
	$hash   = current_fingerprint( $post );
	$edited = approval_transition( $state, 'edited', array( 'hash' => $hash, 'user' => get_current_user_id() ) );
	if ( is_array( $edited ) && $edited !== $state ) {
		update_post_meta( $post->ID, APPROVAL_META, $edited );
		approval_log( 'approval_invalidated', $post->ID, 'changed_after_' . ( $state['state'] ?? '' ), '', array( 'hash' => $hash ) );
		approval_flash( 'warning', __( 'You changed this after it was submitted or approved: it needs to be submitted and approved again.', 'acadvizen-cms' ) );
		$state = $edited;
		if ( 'pending' === $post->post_status ) {
			approval_bypass( true );
			wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'draft' ) );
			approval_bypass( false );
			return;
		}
	}
	if ( 'pending' === $post->post_status && ! in_array( $state['state'] ?? '', array( 'pending', 'approved', 'scheduled' ), true ) ) {
		submit_candidate( $post );
	}
}

/**
 * Another live document already serving this document's Main Website address (0 when none). A page
 * and its own working copies and archives are one document; any other one would be a duplicate at
 * that address, so submitting is refused until the address is changed or the other page removed.
 */
function main_address_conflict( \WP_Post $post ): int {
	if ( ! is_site_post_type( $post->post_type ) || ! targets_main( get_publish_target( $post->ID ) ) ) {
		return 0;
	}
	$path = main_path_for( $post );
	$live = '' !== $path ? live_version_for_path( $path ) : null;
	$self = revision_copy_of( $post->ID ) ?: $post->ID;
	$other = $live ? (int) $live['post_id'] : 0;
	return $other && $other !== $self && 'publish' === get_post_status( $other ) ? $other : 0;
}

function submit_candidate( \WP_Post $post ): string {
	$conflict = main_address_conflict( $post );
	if ( $conflict ) {
		approval_bypass( true );
		wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'draft' ) );
		approval_bypass( false );
		approval_log( 'submit', $post->ID, 'refused', 'main_address_in_use', array( 'other' => $conflict ) );
		/* translators: 1: page title, 2: page ID */
		approval_flash( 'error', sprintf( __( 'This Main Website address is already used by the live page "%1$s" (#%2$d). Change the address, or edit that page instead.', 'acadvizen-cms' ), get_the_title( $conflict ), $conflict ) );
		return 'main_address_in_use';
	}
	$report = document_compatibility( $post );
	$hash   = current_fingerprint( $post );
	$next   = approval_transition( approval_state( $post->ID ), 'submit', array( 'hash' => $hash, 'user' => get_current_user_id(), 'compat' => $report['status'] ) );
	if ( ! is_array( $next ) ) {
		approval_bypass( true );
		wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'draft' ) );
		approval_bypass( false );
		approval_log( 'submit', $post->ID, 'refused', $next );
		approval_flash( 'error', approval_error_text( $next, $report ) );
		return $next;
	}
	update_post_meta( $post->ID, APPROVAL_META, $next );
	if ( 'pending' !== $post->post_status ) {
		approval_bypass( true );
		wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'pending' ) );
		approval_bypass( false );
	}
	approval_log( 'submit', $post->ID, 'pending', '', array( 'hash' => $hash, 'destinations' => chosen_destinations( $post ) ) );
	approval_flash( 'success', __( 'Submitted for approval. Nothing changes on the websites until a reviewer approves it and it is published.', 'acadvizen-cms' ) );
	return 'pending';
}

/** The words shown for one website's publication state. */
function destination_status_label( string $state ): string {
	$labels = array(
		'verified' => __( 'Published (verified)', 'acadvizen-cms' ),
		'pending'  => __( 'Publishing', 'acadvizen-cms' ),
		'failed'   => __( 'Failed', 'acadvizen-cms' ),
	);
	return $labels[ $state ] ?? __( 'Pending', 'acadvizen-cms' );
}

function approval_error_text( string $code, array $report = array() ): string {
	$texts = array(
		'blocked_widgets'         => __( 'It cannot be published as designed:', 'acadvizen-cms' ),
		'code_needs_review'       => __( 'It contains typed code or HTML: a reviewer who may publish code must confirm it ("I checked the code").', 'acadvizen-cms' ),
		'not_reviewer'            => __( 'Only a reviewer can do this.', 'acadvizen-cms' ),
		'not_pending'             => __( 'It is not waiting for approval.', 'acadvizen-cms' ),
		'changed_since_submitted' => __( 'It changed after it was submitted. It has to be submitted again.', 'acadvizen-cms' ),
		'not_approved'            => __( 'It is not approved yet.', 'acadvizen-cms' ),
		'changed_since_approved'  => __( 'It changed after it was approved: the approval no longer applies. Submit it again.', 'acadvizen-cms' ),
		'no_revision'             => __( 'There is nothing to submit.', 'acadvizen-cms' ),
		'main_address_in_use'     => __( 'Another live page already uses this Main Website address. Change the address, or edit that page instead.', 'acadvizen-cms' ),
		'previews_not_checked'    => __( 'Check the preview of every chosen website first, and tick it ("I checked the … preview").', 'acadvizen-cms' ),
		'already_scheduled'       => __( 'It is already scheduled. Cancel the schedule first to publish it now.', 'acadvizen-cms' ),
		'not_scheduled'           => __( 'It is not scheduled.', 'acadvizen-cms' ),
	);
	$text = $texts[ $code ] ?? $code;
	if ( 'blocked_widgets' === $code ) {
		foreach ( (array) ( $report['items'] ?? array() ) as $item ) {
			if ( COMPAT_BLOCKED === $item['status'] ) {
				/* translators: 1: widget, 2: website, 3: reason, 4: fix */
				$text .= ' ' . sprintf( __( '"%1$s" on the %2$s website: %3$s (%4$s).', 'acadvizen-cms' ), $item['widget'], 'main' === $item['destination'] ? __( 'Main', 'acadvizen-cms' ) : __( 'Enrollment', 'acadvizen-cms' ), $item['why'], $item['fix'] );
			}
		}
	}
	return $text;
}

/* Review, publishing, verification, rollback ------------------------------------------------------------ */

function review_candidate( int $post_id, string $decision, bool $code_ok, string $note, array $previews = array() ): string {
	$post = get_post( $post_id );
	if ( ! $post instanceof \WP_Post || ! in_approval_scope( $post ) ) {
		return 'not_found';
	}
	$report = document_compatibility( $post );
	$next   = approval_transition(
		approval_state( $post_id ),
		$decision,
		array( 'hash' => current_fingerprint( $post ), 'user' => get_current_user_id(), 'can_review' => current_user_can( REVIEW_CAP ), 'compat' => $report['status'], 'code_ok' => $code_ok && current_user_can( 'unfiltered_html' ), 'note' => $note, 'destinations' => chosen_destinations( $post ), 'previews' => array_values( array_intersect( array( 'main', 'enrollment' ), $previews ) ) )
	);
	if ( ! is_array( $next ) ) {
		approval_log( $decision, $post_id, 'refused', $next );
		return $next;
	}
	update_post_meta( $post_id, APPROVAL_META, $next );
	if ( 'reject' === $decision ) {
		approval_bypass( true );
		wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
		approval_bypass( false );
	}
	approval_log( $decision, $post_id, $next['state'], $note, array( 'hash' => (string) ( $next['hash'] ?? '' ), 'self_approved' => ! empty( $next['self_approved'] ) ) );
	return $next['state'];
}

/**
 * Publishes exactly the approved revision. Returns the live document id, or an error code.
 *
 * @return int|string
 */
function publish_approved( int $candidate_id, bool $due = false ) {
	$candidate = get_post( $candidate_id );
	if ( ! $candidate instanceof \WP_Post || ! in_approval_scope( $candidate ) ) {
		return 'not_found';
	}
	$hash   = current_fingerprint( $candidate );
	$report = document_compatibility( $candidate );
	$state  = approval_state( $candidate_id );
	$next   = approval_transition( $state, 'publish', array( 'hash' => $hash, 'user' => get_current_user_id(), 'compat' => $report['status'], 'due' => $due ) );
	if ( ! is_array( $next ) ) {
		approval_log( 'publish', $candidate_id, 'refused', $next );
		return $next;
	}
	// A publish date in the future (set in the editor before submitting, and so part of what was
	// approved): the approved revision is scheduled, and published by publish_scheduled() when due.
	$at = scheduled_time( $candidate );
	if ( ! $due && $at ) {
		$scheduled = approval_transition( $state, 'schedule', array( 'hash' => $hash, 'user' => get_current_user_id(), 'at' => $at ) );
		if ( ! is_array( $scheduled ) ) {
			return $scheduled;
		}
		update_post_meta( $candidate_id, APPROVAL_META, $scheduled );
		wp_clear_scheduled_hook( SCHEDULE_HOOK, array( $candidate_id ) );
		wp_schedule_single_event( $at, SCHEDULE_HOOK, array( $candidate_id ) );
		approval_log( 'schedule', $candidate_id, 'scheduled', gmdate( 'Y-m-d H:i', $at ) . ' UTC', array( 'hash' => $hash, 'at' => $at ) );
		return 'scheduled';
	}
	update_post_meta( $candidate_id, APPROVAL_META, $next );
	$live_id = (int) get_post_meta( $candidate_id, COPY_OF_META, true );
	$archive = 0;
	if ( $live_id && ( $live = get_post( $live_id ) ) instanceof \WP_Post ) {
		$archive = archive_live( $live );
		apply_revision( $candidate, $live );
		approval_bypass( true );
		wp_trash_post( $candidate_id );
		approval_bypass( false );
		delete_post_meta( $live_id, WORKING_COPY_META );
	} else {
		$live_id = $candidate_id;
		approval_bypass( true );
		$publish = array( 'ID' => $candidate_id, 'post_status' => 'publish' );
		if ( $due && scheduled_time( $candidate ) ) {
			// Published by its job now: dated now, or WordPress would keep a future-dated page hidden ("future").
			$publish += array( 'post_date_gmt' => current_time( 'mysql', true ), 'post_date' => current_time( 'mysql' ), 'edit_date' => true );
		}
		wp_update_post( $publish );
		approval_bypass( false );
	}
	$live = get_post( $live_id );
	update_post_meta( $live_id, LIVE_REVISION_META, $hash );
	$destinations = array();
	foreach ( chosen_destinations( $live ) as $destination ) {
		$destinations[ $destination ] = array( 'state' => 'pending', 'detail' => '', 'at' => time() );
	}
	update_post_meta(
		$live_id,
		PUBLICATION_META,
		array( 'hash' => $hash, 'at' => time(), 'by' => get_current_user_id(), 'approved_by' => (int) ( $state['reviewed_by'] ?? 0 ), 'archive' => $archive, 'kind' => 'publish', 'outcome' => 'publishing', 'destinations' => $destinations, 'attempt' => 0 )
	);
	update_post_meta( $candidate_id, APPROVAL_META, approval_transition( $next, 'published', array( 'hash' => $hash, 'user' => get_current_user_id() ) ) );
	if ( is_site_post_type( $live->post_type ) ) {
		approval_bypass( true );
		claim_main_homepage( $live_id );
		handle_site_doc_change( $live, 'publish' ); // Draws the approved design for the Main Website.
		approval_bypass( false );
	}
	approval_log( 'publish', $live_id, 'publishing', '', array( 'hash' => $hash, 'destinations' => array_keys( $destinations ), 'archive' => $archive ) );
	wp_schedule_single_event( time() + VERIFY_DELAYS[0], VERIFY_HOOK, array( $live_id, $hash, 1 ) );
	return $live_id;
}

/** The future moment (UTC timestamp) a candidate was dated for, or 0 to publish now. */
function scheduled_time( \WP_Post $candidate ): int {
	if ( get_post_meta( $candidate->ID, COPY_OF_META, true ) ) {
		return 0; // A working copy changes a page that is already live: its date is the live page's.
	}
	$at = '0000-00-00 00:00:00' !== $candidate->post_date_gmt ? (int) strtotime( $candidate->post_date_gmt . ' UTC' ) : 0;
	return $at > time() + 60 ? $at : 0;
}

/**
 * The scheduled job: publishes the approved revision only when it is still exactly that revision
 * and still scheduled (an edit or "Cancel schedule" stops it).
 */
function publish_scheduled( $candidate_id ): void {
	$candidate_id = (int) $candidate_id;
	$candidate    = get_post( $candidate_id );
	$state        = approval_state( $candidate_id );
	if ( ! $candidate instanceof \WP_Post || 'scheduled' !== ( $state['state'] ?? '' ) ) {
		approval_log( 'scheduled_publish', $candidate_id, 'skipped', 'no longer scheduled' );
		return;
	}
	if ( current_fingerprint( $candidate ) !== ( $state['hash'] ?? '' ) ) {
		update_post_meta( $candidate_id, APPROVAL_META, approval_transition( $state, 'edited', array( 'hash' => current_fingerprint( $candidate ) ) ) );
		approval_log( 'scheduled_publish', $candidate_id, 'refused', 'changed_since_approved' );
		return;
	}
	$result = publish_approved( $candidate_id, true );
	approval_log( 'scheduled_publish', $candidate_id, is_int( $result ) ? 'publishing' : 'refused', is_int( $result ) ? '' : (string) $result );
}

/**
 * A scheduled revision whose job is gone (WP-Cron lost it, or the plugin was deactivated meanwhile)
 * gets it back: at its time, or within a minute when that time has passed. Runs with the recurring
 * stall check and when Approvals is opened.
 */
function ensure_scheduled_jobs(): int {
	if ( ! approval_enabled() ) {
		return 0;
	}
	$restored = 0;
	foreach ( approval_candidates( array( 'scheduled' ) ) as $id ) {
		if ( ! wp_next_scheduled( SCHEDULE_HOOK, array( $id ) ) ) {
			$at = max( time() + 60, (int) ( approval_state( $id )['scheduled_for'] ?? 0 ) );
			wp_schedule_single_event( $at, SCHEDULE_HOOK, array( $id ) );
			approval_log( 'schedule_restored', $id, 'scheduled', gmdate( 'Y-m-d H:i', $at ) . ' UTC' );
			++$restored;
		}
	}
	return $restored;
}

/* Navigation on the Main website: reviewers only ----------------------------------------------------- */

/** Term meta marking a WordPress menu as shown on the Main website (set by Import Main Website). */
const MAIN_MENU_META = 'acv_main_menu';

function is_main_menu( int $menu_id ): bool {
	return $menu_id > 0 && '1' === (string) get_term_meta( $menu_id, MAIN_MENU_META, true );
}

/** The menu a menu item belongs to (0 when none). */
function menu_of_item( int $item_id ): int {
	$terms = $item_id ? wp_get_object_terms( $item_id, 'nav_menu', array( 'fields' => 'ids' ) ) : array();
	return is_array( $terms ) && $terms ? (int) $terms[0] : 0;
}

/**
 * A change to a Main menu changes every Main page at once, like the global styles: with approval on
 * only a reviewer can make it, and it is recorded. Menus used only on Enrollment are not affected.
 * Appearance > Menus (saving, adding items, deleting the menu).
 */
function guard_main_menu_screen(): void {
	if ( ! approval_enabled() || approval_bypass() ) {
		return;
	}
	// phpcs:disable WordPress.Security.NonceVerification -- a refusal only; WordPress checks its own nonces.
	$action = isset( $_REQUEST['action'] ) ? sanitize_key( wp_unslash( $_REQUEST['action'] ) ) : '';
	$menu   = isset( $_REQUEST['menu'] ) ? absint( $_REQUEST['menu'] ) : 0;
	$writes = 'POST' === ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) || in_array( $action, array( 'delete', 'delete-menu-item', 'move-down-menu-item', 'move-up-menu-item' ), true );
	if ( 'delete-menu-item' === $action || 'move-down-menu-item' === $action || 'move-up-menu-item' === $action ) {
		$menu = menu_of_item( isset( $_REQUEST['menu-item'] ) ? absint( $_REQUEST['menu-item'] ) : 0 );
	}
	// phpcs:enable
	if ( ! $writes || ! is_main_menu( $menu ) ) {
		return;
	}
	if ( ! current_user_can( REVIEW_CAP ) ) {
		approval_log( 'navigation', 0, 'refused', 'menu ' . $menu );
		wp_die( esc_html__( 'This menu is shown on the Main website. Changing it changes every Main page at once, so only a reviewer can save it.', 'acadvizen-cms' ), 403 );
	}
	approval_log( 'navigation', 0, 'saved_by_reviewer', 'menu ' . $menu );
}

/** The REST menu routes (block editor navigation, apps). */
function guard_main_menu_rest( $result, $server, $request ) {
	if ( null !== $result || ! approval_enabled() || approval_bypass() || ! $request instanceof \WP_REST_Request || 'GET' === $request->get_method() ) {
		return $result;
	}
	$route = $request->get_route();
	$menu  = 0;
	if ( preg_match( '#^/wp/v2/menus/(\d+)#', $route, $m ) ) {
		$menu = (int) $m[1];
	} elseif ( preg_match( '#^/wp/v2/menu-items/(\d+)#', $route, $m ) ) {
		$menu = menu_of_item( (int) $m[1] ) ?: (int) $request->get_param( 'menus' );
	} elseif ( preg_match( '#^/wp/v2/menu-items/?$#', $route ) ) {
		$menu = (int) $request->get_param( 'menus' );
	}
	if ( ! is_main_menu( $menu ) ) {
		return $result;
	}
	if ( ! current_user_can( REVIEW_CAP ) ) {
		approval_log( 'navigation', 0, 'refused', 'menu ' . $menu . ' (REST)' );
		return new \WP_Error( 'acv_main_menu_needs_reviewer', __( 'This menu is shown on the Main website: only a reviewer can change it.', 'acadvizen-cms' ), array( 'status' => 403 ) );
	}
	approval_log( 'navigation', 0, 'saved_by_reviewer', 'menu ' . $menu . ' (REST)' );
	return $result;
}

/** The Customizer cannot refuse one menu in a save of many: for non-reviewers it offers no menus to edit. */
function limit_customizer_menus( array $components ): array {
	if ( approval_enabled() && ! current_user_can( REVIEW_CAP ) && get_terms( array( 'taxonomy' => 'nav_menu', 'hide_empty' => false, 'fields' => 'ids', 'meta_key' => MAIN_MENU_META, 'meta_value' => '1' ) ) ) { // phpcs:ignore WordPress.DB.SlowDBQuery
		return array_values( array_diff( $components, array( 'nav_menus' ) ) );
	}
	return $components;
}

/** "Cancel schedule": the approved revision stays approved and can be published or rescheduled. */
function cancel_schedule( int $candidate_id ): string {
	$next = approval_transition( approval_state( $candidate_id ), 'unschedule', array( 'user' => get_current_user_id() ) );
	if ( ! is_array( $next ) ) {
		return $next;
	}
	update_post_meta( $candidate_id, APPROVAL_META, $next );
	wp_clear_scheduled_hook( SCHEDULE_HOOK, array( $candidate_id ) );
	approval_log( 'schedule_cancelled', $candidate_id, 'approved' );
	return 'approved';
}

/** Reads one public page and looks for the revision mark. */
function check_destination( string $url, string $mark, array $headers = array() ): array {
	$response = wp_remote_get( add_query_arg( 'acv_verify', (string) time(), $url ), array( 'timeout' => 20, 'redirection' => $headers ? 0 : 3, 'headers' => array( 'Cache-Control' => 'no-cache' ) + $headers ) );
	if ( is_wp_error( $response ) ) {
		return array( 'state' => 'retry', 'detail' => $response->get_error_message() );
	}
	$code = (int) wp_remote_retrieve_response_code( $response );
	$body = (string) wp_remote_retrieve_body( $response );
	if ( 200 === $code && false !== strpos( $body, $mark ) ) {
		return array( 'state' => 'verified', 'detail' => 'HTTP 200, approved revision shown' );
	}
	return array( 'state' => 'retry', 'detail' => 200 === $code ? 'HTTP 200 but another revision is shown' : 'HTTP ' . $code );
}

/**
 * A page that draws a template, as a path on the given website: an item of the type a design
 * template is used for, the page a popup is shown on, otherwise the homepage (headers, footers).
 */
function template_showcase_path( \WP_Post $template, string $destination, int $depth = 0 ): string {
	foreach ( DESIGN_TYPES as $type ) {
		if ( design_template_for( $type ) === $template->ID ) {
			foreach ( get_posts( array( 'post_type' => $type, 'post_status' => 'publish', 'posts_per_page' => 20, 'orderby' => 'ID', 'order' => 'ASC' ) ) as $item ) {
				if ( ! uses_design_template( $item ) ) {
					continue;
				}
				if ( 'main' === $destination && targets_main( get_publish_target( $item->ID ) ) && '' !== main_path_for( $item ) ) {
					return main_path_for( $item );
				}
				if ( 'enrollment' === $destination && targets_enrollment( get_publish_target( $item->ID ) ) ) {
					return (string) wp_parse_url( (string) get_permalink( $item ), PHP_URL_PATH );
				}
			}
			return '';
		}
	}
	foreach ( (array) get_post_meta( $template->ID, '_elementor_conditions', true ) as $condition ) {
		if ( preg_match( '#^include/singular/page/(\d+)$#', (string) $condition, $m ) && ( $page = get_post( (int) $m[1] ) ) instanceof \WP_Post ) {
			return 'main' === $destination ? main_path_for( $page ) : (string) wp_parse_url( (string) get_permalink( $page ), PHP_URL_PATH );
		}
	}
	// A card drawn by another design's loop (e.g. the tool card in the tool page design's "related
	// tools"), or placed with Elementor's Template widget: shown where that design is shown.
	$path = referring_document_path( $template, $destination, $depth );
	return null !== $path ? $path : '/';
}

/**
 * Where a template is drawn because another published document uses it (an acv_loop's template="ID"
 * or Elementor's Template widget), or null when nothing refers to it.
 */
function referring_document_path( \WP_Post $template, string $destination, int $depth ): ?string {
	global $wpdb;
	if ( $depth >= 3 ) {
		return null; // A card inside a card inside a design: deep enough; never loops.
	}
	$patterns = array( 'template=\\"' . $template->ID . '\\"', '"template_id":"' . $template->ID . '"', '"template_id":' . $template->ID . ',' );
	$where    = implode( ' OR ', array_fill( 0, count( $patterns ), 'm.meta_value LIKE %s' ) );
	$ids      = $wpdb->get_col( $wpdb->prepare( "SELECT DISTINCT m.post_id FROM {$wpdb->postmeta} m JOIN {$wpdb->posts} p ON p.ID = m.post_id WHERE m.meta_key = '_elementor_data' AND p.post_status = 'publish' AND m.post_id <> %d AND ( {$where} ) ORDER BY m.post_id LIMIT 20", array_merge( array( $template->ID ), array_map( static fn( $x ) => '%' . $wpdb->esc_like( $x ) . '%', $patterns ) ) ) ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.DirectDatabaseQuery
	foreach ( array_map( 'intval', (array) $ids ) as $id ) {
		$doc = get_post( $id );
		if ( ! $doc instanceof \WP_Post ) {
			continue;
		}
		if ( is_template_post_type( $doc->post_type ) ) {
			$path = template_showcase_path( $doc, $destination, $depth + 1 );
			if ( '' !== $path ) {
				return $path;
			}
			continue;
		}
		if ( 'main' === $destination && targets_main( get_publish_target( $doc->ID ) ) && '' !== main_path_for( $doc ) ) {
			return main_path_for( $doc );
		}
		if ( 'enrollment' === $destination && targets_enrollment( get_publish_target( $doc->ID ) ) ) {
			return (string) wp_parse_url( (string) get_permalink( $doc ), PHP_URL_PATH );
		}
	}
	return null;
}

/** Where each website shows a live document, as the server can reach it. */
function destination_url( \WP_Post $live, string $destination ): string {
	if ( is_template_post_type( $live->post_type ) ) {
		$path = template_showcase_path( $live, $destination );
		if ( '' === $path ) {
			return '';
		}
		return 'main' === $destination ? ( '' !== main_internal_url() ? main_internal_url() . $path : '' ) : loopback_base() . $path;
	}
	if ( 'main' === $destination ) {
		$path = main_path_for( $live );
		return '' !== $path && '' !== main_internal_url() ? main_internal_url() . $path : '';
	}
	$permalink = (string) get_permalink( $live );
	$path      = (string) wp_parse_url( $permalink, PHP_URL_PATH );
	return loopback_base() . ( '' !== $path ? $path : '/' );
}

/** Checks every chosen website for the published revision; retried until verified or failed. */
function verify_publication( $live_id, $hash, $attempt = 1 ): array {
	$live_id = (int) $live_id;
	$attempt = (int) $attempt;
	$pub     = get_post_meta( $live_id, PUBLICATION_META, true );
	$live    = get_post( $live_id );
	if ( ! is_array( $pub ) || ! $live instanceof \WP_Post || ( $pub['hash'] ?? '' ) !== $hash ) {
		return array(); // A newer publication superseded this check (a stale check never overwrites it).
	}
	$final = $attempt >= count( VERIFY_DELAYS );
	foreach ( (array) $pub['destinations'] as $destination => $result ) {
		if ( 'verified' === ( $result['state'] ?? '' ) ) {
			continue;
		}
		$url   = destination_url( $live, $destination );
		// The Enrollment page is read through the rendering address, as the site's own public host.
		$headers = 'enrollment' === $destination && defined( 'ACADVIZEN_CMS_LOOPBACK_URL' ) ? array( 'Host' => url_hostport( public_site_url() ) ) : array();
		$check   = '' === $url ? array( 'state' => 'retry', 'detail' => 'no public address' ) : check_destination( $url, revision_mark( $hash ), $headers );
		if ( 'main' === $destination && 'verified' !== $check['state'] && STATE_FAILED === get_post_meta( $live_id, META_MAIN_STATE, true ) ) {
			$check = array( 'state' => 'failed', 'detail' => 'drawing for the Main Website failed: ' . (string) get_post_meta( $live_id, META_MAIN_ERROR, true ) );
		}
		if ( 'retry' === $check['state'] ) {
			$check['state'] = $final ? 'failed' : 'pending';
		}
		$pub['destinations'][ $destination ] = array( 'state' => $check['state'], 'detail' => $check['detail'], 'at' => time() );
	}
	$pub['attempt'] = $attempt;
	$pub['outcome'] = publication_outcome( (array) $pub['destinations'], $final );
	update_post_meta( $live_id, PUBLICATION_META, $pub );
	if ( 'publishing' === $pub['outcome'] ) {
		wp_schedule_single_event( time() + VERIFY_DELAYS[ $attempt ], VERIFY_HOOK, array( $live_id, $hash, $attempt + 1 ) );
	} else {
		approval_log( 'verify', $live_id, $pub['outcome'], (string) wp_json_encode( $pub['destinations'] ), array( 'hash' => $hash ) );
	}
	return $pub;
}

/**
 * "Check again" after a failure: every website that failed gets another attempt (the Main Website's
 * drawing is redone when that is what failed) and the checks start over. False when nothing failed.
 */
function retry_publication( int $live_id ): bool {
	$pub = get_post_meta( $live_id, PUBLICATION_META, true );
	if ( ! is_array( $pub ) ) {
		return false;
	}
	$failed = array_keys( array_filter( (array) $pub['destinations'], static fn( $r ) => 'failed' === ( $r['state'] ?? '' ) ) );
	if ( ! $failed ) {
		return false;
	}
	foreach ( $failed as $destination ) {
		$pub['destinations'][ $destination ] = array( 'state' => 'pending', 'detail' => 'checking again', 'at' => time() );
	}
	// Redraw for Main now unless its drawing is already published (a failed drawing, or one still
	// waiting between automatic retries, would otherwise keep Main on the old version for minutes).
	if ( in_array( 'main', $failed, true ) && in_array( get_post_meta( $live_id, META_MAIN_STATE, true ), array( STATE_FAILED, STATE_PUBLISHING ), true ) ) {
		queue_main_render( $live_id, 'retry' );
	}
	$pub['attempt'] = 0;
	$pub['outcome'] = 'publishing';
	update_post_meta( $live_id, PUBLICATION_META, $pub );
	approval_log( 'retry', $live_id, 'publishing', implode( ', ', $failed ), array( 'hash' => (string) $pub['hash'] ) );
	wp_schedule_single_event( time() + VERIFY_DELAYS[0], VERIFY_HOOK, array( $live_id, (string) $pub['hash'], 1 ) );
	return true;
}

/** Puts an archived revision back live (reviewers only); verified like a publication. */
function rollback_to_archive( int $live_id, int $archive_id ): string {
	$live    = get_post( $live_id );
	$archive = get_post( $archive_id );
	if ( ! $live instanceof \WP_Post || ! $archive instanceof \WP_Post || (int) get_post_meta( $archive_id, ARCHIVE_OF_META, true ) !== $live_id ) {
		return 'not_found';
	}
	if ( ! current_user_can( REVIEW_CAP ) ) {
		return 'not_reviewer';
	}
	$saved = archive_live( $live );
	apply_revision( $archive, $live );
	$live = get_post( $live_id );
	$hash = current_fingerprint( $live );
	update_post_meta( $live_id, LIVE_REVISION_META, $hash );
	$destinations = array();
	foreach ( chosen_destinations( $live ) as $destination ) {
		$destinations[ $destination ] = array( 'state' => 'pending', 'detail' => '', 'at' => time() );
	}
	update_post_meta( $live_id, PUBLICATION_META, array( 'hash' => $hash, 'at' => time(), 'by' => get_current_user_id(), 'archive' => $saved, 'kind' => 'rollback', 'from_archive' => $archive_id, 'outcome' => 'publishing', 'destinations' => $destinations, 'attempt' => 0 ) );
	if ( is_site_post_type( $live->post_type ) ) {
		approval_bypass( true );
		claim_main_homepage( $live_id );
		handle_site_doc_change( $live, 'rollback' );
		approval_bypass( false );
	}
	approval_log( 'rollback', $live_id, 'publishing', '', array( 'hash' => $hash, 'from_archive' => $archive_id, 'archive' => $saved ) );
	wp_schedule_single_event( time() + VERIFY_DELAYS[0], VERIFY_HOOK, array( $live_id, $hash, 1 ) );
	return 'publishing';
}

/** The public page carries its revision mark (also inside the version drawn for the Main Website). */
function print_revision_mark(): void {
	if ( ! approval_enabled() ) {
		return;
	}
	$hash = is_singular() ? (string) get_post_meta( (int) get_queried_object_id(), LIVE_REVISION_META, true ) : '';
	if ( '' !== $hash ) {
		echo "\n<!-- " . esc_html( revision_mark( $hash ) ) . " -->\n";
	}
	// Templates drawn into this page (header, footer, popup, a type's design) carry their own mark,
	// so a published template is verified where visitors see it.
	foreach ( rendered_templates() as $template_id ) {
		$template_hash = (string) get_post_meta( $template_id, LIVE_REVISION_META, true );
		if ( '' !== $template_hash ) {
			echo '<!-- ' . esc_html( revision_mark( $template_hash ) ) . ' (template ' . (int) $template_id . ") -->\n";
		}
	}
}

/** Elementor documents drawn in this request (elementor/frontend/builder_content_data); templates only. */
function rendered_templates( ?int $add = null ): array {
	static $ids = array();
	if ( null !== $add && $add > 0 ) {
		$ids[ $add ] = true;
	}
	return array_keys( $ids );
}

function note_rendered_document( $data, $post_id ) {
	$post_id = (int) $post_id;
	if ( approval_enabled() && $post_id && is_template_post_type( (string) get_post_type( $post_id ) ) ) {
		rendered_templates( $post_id );
	}
	return $data;
}

/* Roles ---------------------------------------------------------------------------------------------------- */

function ensure_review_roles(): void {
	$admin = get_role( 'administrator' );
	if ( $admin && ! $admin->has_cap( REVIEW_CAP ) ) {
		$admin->add_cap( REVIEW_CAP );
	}
	if ( ! get_role( REVIEWER_ROLE ) && ( $editor = get_role( 'editor' ) ) ) {
		add_role( REVIEWER_ROLE, __( 'Reviewer (approves publishing)', 'acadvizen-cms' ), array_merge( $editor->capabilities, array( REVIEW_CAP => true ) ) );
	}
}

/* Admin actions ----------------------------------------------------------------------------------------------- */

function approval_action_url( string $do, int $post_id, array $extra = array() ): string {
	return wp_nonce_url( add_query_arg( array_merge( array( 'action' => 'acv_cms_approval', 'do' => $do, 'post' => $post_id ), $extra ), admin_url( 'admin-post.php' ) ), "acv_cms_approval_{$do}_{$post_id}" );
}

function handle_approval_action(): void {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- verified by check_admin_referer() below.
	$do      = isset( $_REQUEST['do'] ) ? sanitize_key( wp_unslash( $_REQUEST['do'] ) ) : '';
	$post_id = isset( $_REQUEST['post'] ) ? absint( $_REQUEST['post'] ) : 0;
	// phpcs:enable
	check_admin_referer( "acv_cms_approval_{$do}_{$post_id}" );
	$post = get_post( $post_id );
	if ( ! $post instanceof \WP_Post || ! current_user_can( 'edit_post', $post_id ) && ! current_user_can( REVIEW_CAP ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$back = admin_url( 'admin.php?page=' . APPROVALS_PAGE );
	switch ( $do ) {
		case 'submit':
			submit_candidate( $post );
			break;
		case 'approve':
		case 'reject':
			if ( ! current_user_can( REVIEW_CAP ) ) {
				wp_die( esc_html__( 'Only a reviewer can approve or reject.', 'acadvizen-cms' ), 403 );
			}
			$previews = isset( $_POST['previews'] ) ? array_map( 'sanitize_key', (array) wp_unslash( $_POST['previews'] ) ) : array(); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- checked above.
			$result   = review_candidate( $post_id, $do, ! empty( $_POST['code_ok'] ), isset( $_POST['note'] ) ? sanitize_textarea_field( wp_unslash( $_POST['note'] ) ) : '', $previews ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- checked above.
			$ok     = in_array( $result, array( 'approved', 'rejected' ), true );
			approval_flash( $ok ? 'success' : 'error', $ok ? ( 'approved' === $result ? __( 'Approved: exactly this revision may now be published.', 'acadvizen-cms' ) : __( 'Rejected: it went back to the editor as a draft.', 'acadvizen-cms' ) ) : approval_error_text( $result, document_compatibility( $post ) ) );
			break;
		case 'publish':
			if ( ! current_user_can( 'publish_post', $post_id ) && ! current_user_can( REVIEW_CAP ) ) {
				wp_die( esc_html__( 'You are not allowed to publish.', 'acadvizen-cms' ), 403 );
			}
			$result = publish_approved( $post_id );
			if ( 'scheduled' === $result ) {
				/* translators: %s: date and time in the site's time zone */
				approval_flash( 'success', sprintf( __( 'Scheduled: the approved revision will be published on %s (site time). Any change before then cancels it.', 'acadvizen-cms' ), wp_date( 'j M Y H:i', (int) ( approval_state( $post_id )['scheduled_for'] ?? 0 ) ) ) );
				break;
			}
			approval_flash( is_int( $result ) ? 'success' : 'error', is_int( $result ) ? __( 'Publishing the approved revision. Each chosen website is checked within a few minutes; the result is shown below.', 'acadvizen-cms' ) : approval_error_text( (string) $result, document_compatibility( $post ) ) );
			break;
		case 'unschedule':
			if ( ! current_user_can( 'publish_post', $post_id ) && ! current_user_can( REVIEW_CAP ) ) {
				wp_die( esc_html__( 'You are not allowed to publish.', 'acadvizen-cms' ), 403 );
			}
			$result = cancel_schedule( $post_id );
			approval_flash( 'approved' === $result ? 'success' : 'error', 'approved' === $result ? __( 'Schedule cancelled. The revision stays approved.', 'acadvizen-cms' ) : approval_error_text( $result ) );
			break;
		case 'verify':
			$pub = get_post_meta( $post_id, PUBLICATION_META, true );
			if ( is_array( $pub ) && ! retry_publication( $post_id ) ) {
				verify_publication( $post_id, (string) $pub['hash'], max( 1, (int) ( $pub['attempt'] ?? 0 ) ) );
			}
			break;
		case 'rollback':
			$result = rollback_to_archive( $post_id, isset( $_REQUEST['archive'] ) ? absint( $_REQUEST['archive'] ) : 0 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- checked above.
			approval_flash( 'publishing' === $result ? 'success' : 'error', 'publishing' === $result ? __( 'The earlier revision is going back live; each website is checked again.', 'acadvizen-cms' ) : approval_error_text( $result ) );
			break;
		case 'discard':
			if ( get_post_meta( $post_id, COPY_OF_META, true ) && current_user_can( 'delete_post', $post_id ) ) {
				delete_post_meta( (int) get_post_meta( $post_id, COPY_OF_META, true ), WORKING_COPY_META );
				wp_trash_post( $post_id );
				approval_log( 'discard', $post_id, 'trashed' );
			}
			break;
	}
	wp_safe_redirect( $back );
	exit;
}

function render_approval_notice(): void {
	$key    = 'acv_cms_approval_notice_' . get_current_user_id();
	$notice = get_transient( $key );
	if ( is_array( $notice ) ) {
		delete_transient( $key );
		$type = in_array( $notice[0], array( 'error', 'warning', 'success', 'info' ), true ) ? $notice[0] : 'info';
		printf( '<div class="notice notice-%1$s is-dismissible acv-cms-approval-flash"><p>%2$s</p></div>', esc_attr( $type ), esc_html( (string) $notice[1] ) );
	}
}

/* Admin screen: Approvals ------------------------------------------------------------------------------------- */

function approval_candidates( array $states ): array {
	$ids = get_posts( array( 'post_type' => array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES ), 'post_status' => array( 'draft', 'pending' ), 'posts_per_page' => 100, 'fields' => 'ids', 'meta_key' => APPROVAL_META, 'meta_compare' => 'EXISTS' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	return array_values( array_filter( array_map( 'intval', $ids ), static fn( $id ) => in_array( approval_state( $id )['state'] ?? '', $states, true ) ) );
}

function render_approvals_page(): void {
	if ( ! current_user_can( 'edit_pages' ) && ! current_user_can( REVIEW_CAP ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$reviewer = current_user_can( REVIEW_CAP );
	ensure_scheduled_jobs();
	$label    = array( 'main' => __( 'Main website', 'acadvizen-cms' ), 'enrollment' => __( 'Enrollment website', 'acadvizen-cms' ) );
	echo '<div class="wrap"><h1>' . esc_html__( 'Approvals', 'acadvizen-cms' ) . '</h1>';
	render_approval_notice();
	echo '<p>' . esc_html__( 'Nothing reaches the websites without approval: changes are made in working copies and drafts, submitted with Publish, approved by a reviewer for exactly that revision, then published and checked on each chosen website.', 'acadvizen-cms' ) . '</p>';

	foreach ( array( 'pending' => __( 'Waiting for approval', 'acadvizen-cms' ), 'approved' => __( 'Approved, ready to publish', 'acadvizen-cms' ) ) as $state => $heading ) {
		echo '<h2>' . esc_html( $heading ) . '</h2>';
		$ids = approval_candidates( 'approved' === $state ? array( 'approved', 'scheduled' ) : array( $state ) );
		if ( ! $ids ) {
			echo '<p class="description">' . esc_html__( 'None.', 'acadvizen-cms' ) . '</p>';
			continue;
		}
		echo '<table class="widefat striped acv-approvals"><thead><tr><th>' . esc_html__( 'Content', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Websites', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Compatibility', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Preview', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Decision', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
		foreach ( $ids as $id ) {
			$post   = get_post( $id );
			$st     = approval_state( $id );
			$report = document_compatibility( $post );
			$live   = (int) get_post_meta( $id, COPY_OF_META, true );
			echo '<tr id="acv-candidate-' . (int) $id . '" data-state="' . esc_attr( (string) ( $st['state'] ?? '' ) ) . '" data-hash="' . esc_attr( substr( (string) ( $st['hash'] ?? '' ), 0, 16 ) ) . '">';
			printf(
				'<td><strong>%1$s</strong><br />%2$s<br /><small>%3$s</small></td>',
				esc_html( get_the_title( $post ) ),
				esc_html( $live ? __( 'Changes to a live page', 'acadvizen-cms' ) : __( 'New', 'acadvizen-cms' ) ),
				esc_html( sprintf( /* translators: 1: user, 2: time, 3: revision */ __( 'Submitted by %1$s, %2$s — revision %3$s', 'acadvizen-cms' ), (string) get_the_author_meta( 'display_name', (int) ( $st['submitted_by'] ?? 0 ) ), wp_date( 'j M Y H:i', (int) ( $st['submitted_at'] ?? time() ) ), substr( (string) ( $st['hash'] ?? '' ), 0, 12 ) ) )
			);
			echo '<td>' . esc_html( implode( ', ', array_map( static fn( $d ) => $label[ $d ], chosen_destinations( $post ) ) ) ) . '</td><td class="acv-compat" data-status="' . esc_attr( $report['status'] ) . '">' . esc_html( $report['status'] );
			foreach ( $report['items'] as $item ) {
				if ( COMPAT_OK !== $item['status'] ) {
					echo '<br /><small>' . esc_html( $item['widget'] . ' (' . $label[ $item['destination'] ] . '): ' . $item['status'] . ' — ' . $item['why'] ) . '</small>';
				}
			}
			foreach ( $report['features'] as $feature ) {
				echo '<br /><small>' . esc_html( $feature ) . '</small>';
			}
			echo '</td><td>';
			printf( '<a href="%1$s" target="_blank">%2$s</a>', esc_url( (string) get_preview_post_link( $post ) ), esc_html__( 'Enrollment design', 'acadvizen-cms' ) );
			if ( in_array( 'main', chosen_destinations( $post ), true ) && is_site_post_type( $post->post_type ) ) {
				printf( ' · <a href="%1$s" target="_blank">%2$s</a>', esc_url( site_action_url( 'acv_cms_preview_main', $id ) ), esc_html__( 'As on the Main website', 'acadvizen-cms' ) );
			}
			printf( ' · <a href="%1$s" target="_blank">%2$s</a>', esc_url( add_query_arg( array( 'page' => APPROVALS_PAGE, 'devices' => $id ), admin_url( 'admin.php' ) ) ), esc_html__( 'Desktop / tablet / phone', 'acadvizen-cms' ) );
			echo '</td><td>';
			if ( 'pending' === $state && $reviewer ) {
				printf( '<form method="post" action="%1$s">', esc_url( approval_action_url( 'approve', $id ) ) );
				if ( COMPAT_CODE === $report['status'] && current_user_can( 'unfiltered_html' ) ) {
					echo '<label><input type="checkbox" name="code_ok" value="1" /> ' . esc_html__( 'I checked the code', 'acadvizen-cms' ) . '</label><br />';
				}
				foreach ( chosen_destinations( $post ) as $destination ) {
					/* translators: %s: website name */
					echo '<label><input type="checkbox" class="acv-preview-check" name="previews[]" value="' . esc_attr( $destination ) . '" /> ' . esc_html( sprintf( __( 'I checked the %s preview', 'acadvizen-cms' ), $label[ $destination ] ) ) . '</label><br />';
				}
				echo '<button class="button button-primary acv-approve">' . esc_html__( 'Approve this revision', 'acadvizen-cms' ) . '</button></form>';
				printf( '<form method="post" action="%1$s"><textarea name="note" rows="2" placeholder="%2$s"></textarea><br /><button class="button acv-reject">%3$s</button></form>', esc_url( approval_action_url( 'reject', $id ) ), esc_attr__( 'What should change?', 'acadvizen-cms' ), esc_html__( 'Reject', 'acadvizen-cms' ) );
			} elseif ( 'scheduled' === ( $st['state'] ?? '' ) ) {
				/* translators: %s: date and time in the site's time zone */
				echo '<strong class="acv-scheduled">' . esc_html( sprintf( __( 'Scheduled for %s (site time)', 'acadvizen-cms' ), wp_date( 'j M Y H:i', (int) ( $st['scheduled_for'] ?? 0 ) ) ) ) . '</strong><br />';
				printf( '<a class="button acv-unschedule" href="%1$s">%2$s</a>', esc_url( approval_action_url( 'unschedule', $id ) ), esc_html__( 'Cancel schedule', 'acadvizen-cms' ) );
			} elseif ( 'approved' === $state ) {
				$at = scheduled_time( $post );
				printf( '<a class="button button-primary acv-publish" href="%1$s">%2$s</a>', esc_url( approval_action_url( 'publish', $id ) ), esc_html( $at ? sprintf( /* translators: %s: date and time */ __( 'Schedule approved revision for %s', 'acadvizen-cms' ), wp_date( 'j M Y H:i', $at ) ) : __( 'Publish approved revision', 'acadvizen-cms' ) ) );
			} else {
				echo esc_html__( 'Waiting for a reviewer.', 'acadvizen-cms' );
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
	}

	echo '<h2>' . esc_html__( 'Recent publications', 'acadvizen-cms' ) . '</h2>';
	$live_ids = get_posts( array( 'post_type' => array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES ), 'post_status' => 'any', 'posts_per_page' => 20, 'fields' => 'ids', 'meta_key' => PUBLICATION_META, 'meta_compare' => 'EXISTS', 'orderby' => 'modified' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( ! $live_ids ) {
		echo '<p class="description">' . esc_html__( 'None yet.', 'acadvizen-cms' ) . '</p>';
	} else {
		echo '<table class="widefat striped acv-publications"><thead><tr><th>' . esc_html__( 'Page', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Result', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Each website', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Actions', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
		foreach ( $live_ids as $live_id ) {
			$pub = (array) get_post_meta( (int) $live_id, PUBLICATION_META, true );
			echo '<tr id="acv-publication-' . (int) $live_id . '" data-outcome="' . esc_attr( (string) ( $pub['outcome'] ?? '' ) ) . '"><td>' . esc_html( get_the_title( (int) $live_id ) ) . '<br /><small>' . esc_html( (string) ( $pub['kind'] ?? '' ) . ' · ' . substr( (string) ( $pub['hash'] ?? '' ), 0, 12 ) . ' · ' . wp_date( 'j M Y H:i', (int) ( $pub['at'] ?? time() ) ) ) . '</small></td>';
			echo '<td><strong>' . esc_html( (string) ( $pub['outcome'] ?? '' ) ) . '</strong></td><td>';
			foreach ( (array) ( $pub['destinations'] ?? array() ) as $destination => $result ) {
				echo '<span class="acv-dest" data-destination="' . esc_attr( $destination ) . '" data-state="' . esc_attr( (string) ( $result['state'] ?? '' ) ) . '">' . esc_html( ( $label[ $destination ] ?? $destination ) . ': ' . destination_status_label( (string) ( $result['state'] ?? '' ) ) . ( ! empty( $result['detail'] ) ? ' (' . $result['detail'] . ')' : '' ) ) . '</span><br />';
			}
			echo '</td><td>';
			printf( '<a class="button acv-verify" href="%1$s">%2$s</a> ', esc_url( approval_action_url( 'verify', (int) $live_id ) ), esc_html__( 'Check again', 'acadvizen-cms' ) );
			if ( $reviewer ) {
				foreach ( array_slice( archives_of( (int) $live_id ), 0, 3 ) as $archive ) {
					printf( '<a class="button acv-rollback" href="%1$s" data-confirm="%2$s">%3$s</a> ', esc_url( approval_action_url( 'rollback', (int) $live_id, array( 'archive' => $archive ) ) ), esc_attr__( 'Put this earlier revision back live on its websites?', 'acadvizen-cms' ), esc_html( sprintf( /* translators: %s: date */ __( 'Restore %s', 'acadvizen-cms' ), get_the_modified_date( 'j M H:i', $archive ) ) ) );
				}
			}
			echo '</td></tr>';
		}
		echo '</tbody></table>';
	}

	echo '<h2>' . esc_html__( 'History', 'acadvizen-cms' ) . '</h2><table class="widefat striped acv-approval-log"><thead><tr><th>' . esc_html__( 'When', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Who', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'What', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Content', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Result', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Revision', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( array_slice( array_reverse( (array) get_option( APPROVAL_LOG_OPTION, array() ) ), 0, 100 ) as $entry ) {
		printf(
			'<tr><td>%1$s</td><td>%2$s</td><td>%3$s</td><td>%4$s</td><td>%5$s %6$s</td><td><code>%7$s</code></td></tr>',
			esc_html( wp_date( 'j M Y H:i:s', (int) $entry['time'] ) ),
			esc_html( (string) get_the_author_meta( 'display_name', (int) $entry['user'] ) ),
			esc_html( (string) $entry['action'] ),
			esc_html( (string) $entry['title'] ),
			esc_html( (string) $entry['outcome'] ),
			esc_html( ! empty( $entry['self_approved'] ) ? __( '(approved by the person who submitted it)', 'acadvizen-cms' ) : '' ),
			esc_html( substr( (string) ( $entry['hash'] ?? '' ), 0, 12 ) )
		);
	}
	echo '</tbody></table></div>';
}

/** Desktop, tablet and phone previews side by side (the WordPress preview of the revision). */
function maybe_render_device_preview(): bool {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only preview.
	$id = isset( $_GET['devices'] ) ? absint( $_GET['devices'] ) : 0;
	if ( ! $id || ! current_user_can( 'edit_post', $id ) && ! current_user_can( REVIEW_CAP ) ) {
		return false;
	}
	$url = (string) get_preview_post_link( $id );
	echo '<div class="wrap"><h1>' . esc_html( get_the_title( $id ) ) . '</h1><div style="display:flex;gap:16px;align-items:flex-start;overflow-x:auto">';
	foreach ( array( 1440 => __( 'Desktop', 'acadvizen-cms' ), 768 => __( 'Tablet', 'acadvizen-cms' ), 390 => __( 'Phone', 'acadvizen-cms' ) ) as $width => $name ) {
		$scale = 1440 === $width ? 0.5 : ( 768 === $width ? 0.6 : 0.8 );
		printf( '<figure style="margin:0"><figcaption>%1$s (%2$dpx)</figcaption><div style="width:%3$dpx;height:%4$dpx;overflow:hidden;border:1px solid #ccc"><iframe src="%5$s" style="width:%2$dpx;height:2000px;border:0;transform:scale(%6$s);transform-origin:0 0"></iframe></div></figure>', esc_html( $name ), (int) $width, (int) round( $width * $scale ), (int) round( 2000 * $scale ), esc_url( $url ), esc_attr( (string) $scale ) );
	}
	echo '</div></div>';
	return true;
}

function render_approvals_screen(): void {
	if ( ! maybe_render_device_preview() ) {
		render_approvals_page();
	}
}

/** Edit screens of documents under approval: where it stands, and the next step. */
function add_approval_box( string $post_type ): void {
	if ( approval_enabled() && ( is_site_post_type( $post_type ) || is_template_post_type( $post_type ) ) ) {
		add_meta_box( 'acv-cms-approval', __( 'Approval', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_approval_box', $post_type, 'side', 'high' );
	}
}

function render_approval_box( \WP_Post $post ): void {
	if ( ! in_approval_scope( $post ) ) {
		echo '<p>' . esc_html__( 'Not under approval.', 'acadvizen-cms' ) . '</p>';
		return;
	}
	$state = approval_state( $post->ID );
	$names = array( '' => __( 'Draft', 'acadvizen-cms' ), 'draft' => __( 'Draft (changed after approval)', 'acadvizen-cms' ), 'pending' => __( 'Waiting for approval', 'acadvizen-cms' ), 'approved' => __( 'Approved, ready to publish', 'acadvizen-cms' ), 'scheduled' => __( 'Approved and scheduled', 'acadvizen-cms' ), 'rejected' => __( 'Rejected', 'acadvizen-cms' ), 'published' => __( 'Published', 'acadvizen-cms' ) );
	if ( get_post_meta( $post->ID, COPY_OF_META, true ) ) {
		echo '<p>' . esc_html__( 'Working copy of a live page: visitors see the live page until this is approved and published.', 'acadvizen-cms' ) . '</p>';
		if ( current_user_can( 'delete_post', $post->ID ) ) {
			printf( '<p><a class="acv-discard" href="%1$s" onclick="return confirm(&quot;%2$s&quot;);">%3$s</a></p>', esc_url( approval_action_url( 'discard', $post->ID ) ), esc_js( __( 'Throw away these changes? The live page stays as it is.', 'acadvizen-cms' ) ), esc_html__( 'Discard working copy', 'acadvizen-cms' ) );
		}
	}
	echo '<p><strong>' . esc_html( $names[ $state['state'] ?? '' ] ?? (string) ( $state['state'] ?? '' ) ) . '</strong></p>';
	if ( ! empty( $state['note'] ) ) {
		echo '<p>' . esc_html( (string) $state['note'] ) . '</p>';
	}
	echo '<p class="description">' . esc_html__( '"Publish" submits this for approval. Every change made after submitting needs a new approval.', 'acadvizen-cms' ) . '</p>';
	printf( '<p><a href="%1$s">%2$s</a></p>', esc_url( admin_url( 'admin.php?page=' . APPROVALS_PAGE ) ), esc_html__( 'Open Approvals', 'acadvizen-cms' ) );
}

/** Lists: archived revisions stay out of the way; working copies are labelled as such. */
function hide_archives_from_lists( \WP_Query $query ): void {
	if ( ! is_admin() || ! $query->is_main_query() || ! approval_enabled() ) {
		return;
	}
	$type = $query->get( 'post_type' );
	if ( ! in_array( is_array( $type ) ? reset( $type ) : (string) $type, array_merge( SITE_POST_TYPES, TEMPLATE_POST_TYPES ), true ) ) {
		return;
	}
	$meta   = (array) $query->get( 'meta_query' );
	$meta[] = array( 'key' => ARCHIVE_OF_META, 'compare' => 'NOT EXISTS' );
	$query->set( 'meta_query', $meta );
}

function label_working_copies( array $states, \WP_Post $post ): array {
	if ( approval_enabled() && get_post_meta( $post->ID, COPY_OF_META, true ) ) {
		$states['acv_working_copy'] = __( 'Working copy of a live page', 'acadvizen-cms' );
	}
	$state = approval_state( $post->ID );
	if ( approval_enabled() && ! empty( $state['state'] ) && in_array( $state['state'], array( 'pending', 'approved', 'rejected' ), true ) ) {
		$states['acv_approval'] = array( 'pending' => __( 'Waiting for approval', 'acadvizen-cms' ), 'approved' => __( 'Approved', 'acadvizen-cms' ), 'rejected' => __( 'Rejected', 'acadvizen-cms' ) )[ $state['state'] ];
	}
	return $states;
}

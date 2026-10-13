<?php
/**
 * One blog, two websites, two editors.
 *
 * A blog is one Main Website record (its UUID is the shared id) plus, for Publish To = Enrollment or
 * Both, one normal WordPress post on this website (the "copy", linked by MAIN_BLOG_MIRROR_META).
 * It can be edited in three places and every change reaches the other website once:
 *
 * - Acadvizen Master Admin → Main Website → Blogs: saves Main, then writes the copy (main-content.php).
 * - The regular WordPress Posts editor, on a linked copy: the change is sent to Main (push), guarded
 *   by the Main version the copy was built from, so a newer change made on Main is never overwritten.
 * - Main's own /admin: the copy is refreshed from Main (pull, every 5 minutes and when Blogs opens).
 *   A copy that was also changed here since is left alone and marked as a conflict.
 *
 * A new regular post with "Also publish on the Main Website" creates the Main record and the link.
 * Removals are never mirrored automatically: trashing on one website never deletes on the other.
 * Every outcome is recorded per post (Main Website: in sync / sending… / conflict / failed) and shown
 * in the Posts list, in the editor box and as a notice after saving.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const BLOG_SYNC_VERSION_META = '_acv_main_version';       // Main updated_at the copy was last aligned with.
const BLOG_SYNC_HASH_META    = '_acv_main_copy_hash';     // Fingerprint of the copy as last aligned.
const BLOG_SYNC_STATE_META   = '_acv_main_sync_state';    // array( state, message, time ).
const BLOG_ALSO_MAIN_META    = 'acv_also_main';           // Regular post: "Also publish on the Main Website".
const BLOG_PULL_HOOK         = 'acv_cms_blog_pull';
const BLOG_PULL_THROTTLE     = 'acv_cms_blog_pull_recent';
const BLOG_PULL_LAST         = 'acv_cms_blog_pull_last';  // array( time, checked, updated, conflicts, errors ).

const SYNC_OK       = 'ok';
const SYNC_CONFLICT = 'conflict';
const SYNC_FAILED   = 'failed';

/* Pure helpers (unit-tested in tests/php/run.php) ------------------------------------------------ */

/** What identifies the content of a copy: title, excerpt and article. Whitespace-insensitive. */
function copy_fingerprint( string $title, string $excerpt, string $content ): string {
	$norm = static fn( string $s ): string => trim( (string) preg_replace( '/\s+/', ' ', $s ) );
	return sha1( $norm( $title ) . "\n" . $norm( $excerpt ) . "\n" . $norm( $content ) );
}

/**
 * What the pull should do for one linked copy.
 *
 * @param array $main  Main's list row: updated_at, status, deleted_at; or array() when Main no longer has it.
 * @param array $copy  version (stored Main version), hash (stored fingerprint), current (fingerprint now), status ('publish'|'draft'|…).
 * @return string 'none' | 'update' | 'conflict' | 'unpublish_copy'
 */
function blog_pull_action( array $main, array $copy ): string {
	if ( ! $main || ! empty( $main['deleted_at'] ) ) {
		return 'publish' === ( $copy['status'] ?? '' ) ? 'unpublish_copy' : 'none';
	}
	$version = (string) ( $copy['version'] ?? '' );
	if ( '' !== $version && same_instant( (string) ( $main['updated_at'] ?? '' ), $version ) ) {
		return 'none';
	}
	// Main changed. Overwrite the copy only if nobody changed the copy here since it was aligned.
	$untouched = '' !== (string) ( $copy['hash'] ?? '' ) && hash_equals( (string) $copy['hash'], (string) ( $copy['current'] ?? '' ) );
	return $untouched ? 'update' : 'conflict';
}

/** Two timestamps (any ISO offset, or empty) denote the same instant (as lib/wordpress/contentApi.js sameInstant). */
function same_instant( string $a, string $b ): bool {
	if ( '' === $a || '' === $b ) {
		return '' === $a && '' === $b;
	}
	$x = strtotime( $a );
	$y = strtotime( $b );
	if ( false === $x || false === $y ) {
		return $a === $b;
	}
	// strtotime drops fractions of a second: compare them too, to the millisecond.
	$frac = static fn( string $s ): int => preg_match( '/\.(\d{1,6})/', $s, $m ) ? (int) substr( str_pad( $m[1], 3, '0' ), 0, 3 ) : 0;
	return $x === $y && $frac( $a ) === $frac( $b );
}

/**
 * A WordPress article (editor HTML) as Main Website blog blocks: heading 2–4, paragraph and list items
 * keep their inline formatting (Main sanitises it again), images keep alt text and caption. Anything
 * Main cannot show (embeds, tables, galleries, shortcodes, quotes become paragraphs) is reported, not
 * silently dropped. The leading cover image that copies start with is removed (Main has its own).
 *
 * @return array{blocks: array, skipped: string[]}
 */
function post_html_to_main_blocks( string $html, string $cover = '' ): array {
	$skipped = array();
	if ( preg_match_all( '/\[([a-z0-9_\-]+)[^\]]*\]/i', $html, $codes ) ) {
		foreach ( array_unique( $codes[1] ) as $code ) {
			$skipped[] = "shortcode [{$code}]";
		}
	}
	$html = trim( strip_shortcodes( $html ) );
	if ( '' === $html || ! class_exists( '\\DOMDocument' ) ) {
		return array( 'blocks' => array(), 'skipped' => $skipped );
	}
	$document = new \DOMDocument();
	$previous = libxml_use_internal_errors( true );
	$document->loadHTML( '<?xml encoding="utf-8" ?><div id="acv-root">' . $html . '</div>', LIBXML_NONET );
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );
	$root = $document->getElementById( 'acv-root' );
	if ( ! $root ) {
		return array( 'blocks' => array(), 'skipped' => $skipped );
	}
	$inner = static function ( \DOMNode $node ) use ( $document ): string {
		$out = '';
		foreach ( $node->childNodes as $child ) {
			$out .= $document->saveHTML( $child );
		}
		return trim( $out );
	};
	$blocks = array();
	$walk   = static function ( \DOMNode $parent ) use ( &$walk, &$blocks, &$skipped, $inner, $cover ): void {
		foreach ( $parent->childNodes as $node ) {
			if ( XML_TEXT_NODE === $node->nodeType ) {
				$text = trim( $node->textContent );
				if ( '' !== $text ) {
					$blocks[] = array( 'block_type' => 'paragraph', 'content_json' => array( 'text' => esc_html( $text ) ) );
				}
				continue;
			}
			if ( XML_ELEMENT_NODE !== $node->nodeType ) {
				continue; // Comments (block editor delimiters) and the rest carry no content.
			}
			$tag = strtolower( $node->nodeName );
			if ( in_array( $tag, array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ), true ) ) {
				$text = trim( $node->textContent );
				if ( '' !== $text ) {
					$level    = min( 4, max( 2, (int) substr( $tag, 1 ) ) );
					$blocks[] = array( 'block_type' => 'heading', 'content_json' => array( 'text' => $text, 'level' => $level ) );
				}
			} elseif ( 'p' === $tag ) {
				$text = $inner( $node );
				if ( '' !== trim( wp_strip_all_tags( $text ) ) ) {
					$blocks[] = array( 'block_type' => 'paragraph', 'content_json' => array( 'text' => $text ) );
				}
			} elseif ( 'ul' === $tag || 'ol' === $tag ) {
				$items = array();
				foreach ( $node->childNodes as $li ) {
					if ( XML_ELEMENT_NODE === $li->nodeType && 'li' === strtolower( $li->nodeName ) ) {
						$items[] = $inner( $li );
					}
				}
				if ( $items ) {
					$blocks[] = array( 'block_type' => 'list', 'content_json' => array( 'items' => $items ) );
				}
			} elseif ( 'figure' === $tag || 'img' === $tag ) {
				$img = 'img' === $tag ? $node : null;
				if ( ! $img ) {
					foreach ( $node->getElementsByTagName( 'img' ) as $found ) {
						$img = $found;
						break;
					}
				}
				if ( ! $img ) {
					$skipped[] = 'figure without an image (embed or table)';
					continue;
				}
				$src = esc_url_raw( (string) $img->getAttribute( 'src' ), array( 'http', 'https' ) );
				if ( '' === $src ) {
					$skipped[] = 'image without a web address';
					continue;
				}
				if ( ! $blocks && '' !== $cover && $src === $cover ) {
					continue; // The cover image a copy starts with: Main shows it as the featured image.
				}
				$caption = '';
				foreach ( $node->getElementsByTagName( 'figcaption' ) as $fc ) {
					$caption = trim( $fc->textContent );
				}
				$blocks[] = array( 'block_type' => 'image', 'content_json' => array( 'src' => $src, 'alt' => trim( (string) $img->getAttribute( 'alt' ) ), 'caption' => $caption ) );
			} elseif ( 'blockquote' === $tag ) {
				$text = trim( $node->textContent );
				if ( '' !== $text ) {
					$blocks[] = array( 'block_type' => 'paragraph', 'content_json' => array( 'text' => '<em>' . esc_html( $text ) . '</em>' ) );
				}
				$skipped[] = 'quote shown as a paragraph';
			} elseif ( in_array( $tag, array( 'div', 'section', 'article', 'main', 'span' ), true ) ) {
				$walk( $node ); // Wrappers (block editor groups, columns): their content counts.
			} elseif ( in_array( $tag, array( 'br', 'hr' ), true ) ) {
				continue;
			} else {
				$skipped[] = $tag; // iframe, table, video, audio, script, form …
			}
		}
	};
	$walk( $root );
	return array( 'blocks' => array_slice( $blocks, 0, 2000 ), 'skipped' => array_values( array_unique( $skipped ) ) );
}

/* State shown to editors ---------------------------------------------------------------------------- */

function set_blog_sync_state( int $post_id, string $state, string $message = '' ): void {
	update_post_meta( $post_id, BLOG_SYNC_STATE_META, array( 'state' => $state, 'message' => $message, 'time' => time() ) );
}

function blog_sync_state( int $post_id ): array {
	$state = get_post_meta( $post_id, BLOG_SYNC_STATE_META, true );
	return is_array( $state ) ? $state : array();
}

/** Called after this plugin writes a copy: the copy now matches that Main version. */
function mark_copy_aligned( int $post_id, string $main_version ): void {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return;
	}
	update_post_meta( $post_id, BLOG_SYNC_VERSION_META, $main_version );
	update_post_meta( $post_id, BLOG_SYNC_HASH_META, copy_fingerprint( $post->post_title, $post->post_excerpt, $post->post_content ) );
	set_blog_sync_state( $post_id, SYNC_OK, __( 'Same content on both websites.', 'acadvizen-cms' ) );
}

function current_copy_fingerprint( \WP_Post $post ): string {
	return copy_fingerprint( $post->post_title, $post->post_excerpt, $post->post_content );
}

/* Push: an edit in the regular WordPress editor goes to the Main Website ---------------------------- */

function blog_sync_writing( ?bool $set = null ): bool {
	static $writing = false;
	if ( null !== $set ) {
		$writing = $set;
	}
	return $writing;
}

/**
 * After a regular post is saved (classic editor, block editor or REST): send a changed linked copy to
 * Main, or create the Main blog for a new post that asks for it.
 */
function after_regular_post_saved( int $post_id, \WP_Post $post ): void {
	if ( 'post' !== $post->post_type || blog_sync_writing() || wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) || ! is_configured() ) {
		return;
	}
	$main_id = (string) get_post_meta( $post_id, MAIN_BLOG_MIRROR_META, true );
	if ( '' === $main_id ) {
		if ( get_post_meta( $post_id, BLOG_ALSO_MAIN_META, true ) && 'publish' === $post->post_status ) {
			create_main_blog_from_post( $post );
		}
		return;
	}
	if ( 'trash' === $post->post_status ) {
		set_blog_sync_state( $post_id, SYNC_OK, __( 'Removed from the Enrollment Website only. The Main Website still has this blog: unpublish or delete it in Main Website → Blogs if wanted.', 'acadvizen-cms' ) );
		return;
	}
	if ( hash_equals( (string) get_post_meta( $post_id, BLOG_SYNC_HASH_META, true ), current_copy_fingerprint( $post ) ) ) {
		return; // Only the status or other settings changed: nothing to send.
	}
	push_copy_to_main( $post, $main_id );
}

function push_copy_to_main( \WP_Post $post, string $main_id ): void {
	if ( ! main_can_record( 'blogs', 'edit', $main_id ) ) {
		set_blog_sync_state( $post->ID, SYNC_FAILED, __( 'Not sent to the Main Website: your role cannot edit this blog there.', 'acadvizen-cms' ) );
		return;
	}
	$current = main_content_request( array( 'op' => 'get', 'entity' => 'blogs', 'id' => $main_id ) );
	if ( ! $current['ok'] ) {
		set_blog_sync_state( $post->ID, SYNC_FAILED, __( 'Not sent to the Main Website: ', 'acadvizen-cms' ) . main_error_text( $current ) );
		return;
	}
	$cover     = (string) ( $current['body']['data']['featured_image'] ?? '' );
	$converted = post_html_to_main_blocks( (string) $post->post_content, $cover );
	$request   = array(
		'op'                  => 'save',
		'entity'              => 'blogs',
		'id'                  => $main_id,
		'expected_updated_at' => (string) get_post_meta( $post->ID, BLOG_SYNC_VERSION_META, true ),
		'record'              => array(
			'title'        => $post->post_title,
			'excerpt'      => $post->post_excerpt,
			'content_json' => array( 'blocks' => $converted['blocks'] ),
		),
	);
	$saved = main_content_request( $request );
	if ( ! $saved['ok'] ) {
		$code  = (string) ( $saved['body']['error'] ?? '' );
		$state = 'edit_conflict' === $code ? SYNC_CONFLICT : SYNC_FAILED;
		$text  = 'edit_conflict' === $code
			? __( 'Not sent: this blog was also changed on the Main Website. Nothing was overwritten. Open it in Main Website → Blogs, check both versions, and save the one to keep.', 'acadvizen-cms' )
			: __( 'Not sent to the Main Website: ', 'acadvizen-cms' ) . main_error_text( $saved ) . ' ' . __( 'Save again to retry.', 'acadvizen-cms' );
		set_blog_sync_state( $post->ID, $state, $text );
		return;
	}
	update_post_meta( $post->ID, BLOG_SYNC_VERSION_META, (string) ( $saved['body']['data']['updated_at'] ?? '' ) );
	update_post_meta( $post->ID, BLOG_SYNC_HASH_META, current_copy_fingerprint( $post ) );
	$message = __( 'Main Website updated too.', 'acadvizen-cms' );
	if ( $converted['skipped'] ) {
		/* translators: %s: list of content kinds */
		$message .= ' ' . sprintf( __( 'Not shown on the Main Website (not supported there): %s.', 'acadvizen-cms' ), implode( ', ', $converted['skipped'] ) );
	}
	set_blog_sync_state( $post->ID, SYNC_OK, $message );
}

function create_main_blog_from_post( \WP_Post $post ): void {
	if ( ! main_can( 'blogs', 'publish' ) ) {
		set_blog_sync_state( $post->ID, SYNC_FAILED, __( 'Not published on the Main Website: your role cannot publish blogs there.', 'acadvizen-cms' ) );
		return;
	}
	$converted = post_html_to_main_blocks( (string) $post->post_content );
	$cover     = (string) get_the_post_thumbnail_url( $post, 'full' );
	$record    = array(
		'title'        => $post->post_title,
		'slug'         => $post->post_name,
		'excerpt'      => $post->post_excerpt,
		'content_json' => array( 'blocks' => $converted['blocks'] ),
	);
	if ( '' !== $cover ) {
		$record['featured_image'] = $cover;
	}
	$saved = main_content_request( array( 'op' => 'save', 'entity' => 'blogs', 'id' => null, 'record' => $record ) );
	if ( ! $saved['ok'] ) {
		set_blog_sync_state( $post->ID, SYNC_FAILED, __( 'Not published on the Main Website: ', 'acadvizen-cms' ) . main_error_text( $saved ) . ' ' . __( 'Fix it and update the post to retry.', 'acadvizen-cms' ) );
		return;
	}
	$main_id = (string) $saved['body']['data']['id'];
	remember_main_owner( 'blogs', $main_id, (int) $post->post_author );
	$published = main_content_request( array( 'op' => 'set_status', 'entity' => 'blogs', 'id' => $main_id, 'status' => 'published' ) );
	update_post_meta( $post->ID, MAIN_BLOG_MIRROR_META, $main_id );
	delete_post_meta( $post->ID, BLOG_ALSO_MAIN_META );
	$targets             = main_blog_targets();
	$targets[ $main_id ] = TARGET_BOTH;
	update_option( MAIN_BLOG_TARGETS, $targets, false );
	$row = $published['ok'] ? (array) $published['body']['data'] : (array) $saved['body']['data'];
	update_post_meta( $post->ID, BLOG_SYNC_VERSION_META, (string) ( $row['updated_at'] ?? '' ) );
	update_post_meta( $post->ID, BLOG_SYNC_HASH_META, current_copy_fingerprint( $post ) );
	set_blog_sync_state(
		$post->ID,
		$published['ok'] ? SYNC_OK : SYNC_FAILED,
		$published['ok']
			? __( 'Also published on the Main Website.', 'acadvizen-cms' )
			: __( 'Saved on the Main Website as a draft, but publishing there failed: ', 'acadvizen-cms' ) . main_error_text( $published )
	);
}

/* Pull: a change made on the Main Website reaches the copy ------------------------------------------ */

/**
 * Compares every linked copy with Main and refreshes the ones Main changed. Never overwrites a copy
 * changed here meanwhile, never deletes. Returns counts for the "last check" line.
 */
function pull_main_blog_changes(): array {
	$counts = array( 'time' => time(), 'checked' => 0, 'updated' => 0, 'conflicts' => 0, 'errors' => 0 );
	if ( ! is_configured() ) {
		return $counts;
	}
	$copies = get_posts( array( 'post_type' => 'post', 'post_status' => array( 'publish', 'draft', 'pending', 'private', 'future' ), 'posts_per_page' => 500, 'meta_key' => MAIN_BLOG_MIRROR_META, 'fields' => 'ids' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	if ( ! $copies ) {
		update_option( BLOG_PULL_LAST, $counts, false );
		return $counts;
	}
	$main = array();
	foreach ( array( false, true ) as $trashed ) {
		for ( $offset = 0; $offset < 2000; $offset += 200 ) {
			$page = main_content_request( array( 'op' => 'list', 'entity' => 'blogs', 'limit' => 200, 'offset' => $offset, 'trashed' => $trashed ) );
			if ( ! $page['ok'] ) {
				++$counts['errors'];
				update_option( BLOG_PULL_LAST, $counts, false );
				return $counts; // Main unreachable: change nothing.
			}
			foreach ( (array) $page['body']['data'] as $row ) {
				$row                        = (array) $row;
				$main[ (string) $row['id'] ] = $row;
			}
			if ( count( (array) $page['body']['data'] ) < 200 ) {
				break;
			}
		}
	}
	// Safety: a Main Website that suddenly answers with no blogs at all (wrong address, empty test
	// database) must not take every copy offline. Removals are applied only in small numbers.
	$missing = 0;
	foreach ( $copies as $post_id ) {
		$id = (string) get_post_meta( $post_id, MAIN_BLOG_MIRROR_META, true );
		if ( '' !== $id && ( ! isset( $main[ $id ] ) || ! empty( $main[ $id ]['deleted_at'] ) ) ) {
			++$missing;
		}
	}
	$allow_removals = $main && $missing <= 3;
	if ( ! $allow_removals && $missing ) {
		++$counts['errors'];
	}
	$targets = main_blog_targets();
	foreach ( $copies as $post_id ) {
		$post    = get_post( $post_id );
		$main_id = (string) get_post_meta( $post_id, MAIN_BLOG_MIRROR_META, true );
		if ( ! $post || '' === $main_id ) {
			continue;
		}
		if ( ! targets_enrollment( $targets[ $main_id ] ?? TARGET_BOTH ) ) {
			continue; // Main-only blogs keep their old copy as a draft; nothing to refresh.
		}
		++$counts['checked'];
		$action = blog_pull_action(
			$main[ $main_id ] ?? array(),
			array(
				'version' => (string) get_post_meta( $post_id, BLOG_SYNC_VERSION_META, true ),
				'hash'    => (string) get_post_meta( $post_id, BLOG_SYNC_HASH_META, true ),
				'current' => current_copy_fingerprint( $post ),
				'status'  => $post->post_status,
			)
		);
		if ( 'unpublish_copy' === $action && ! $allow_removals ) {
			set_blog_sync_state( $post_id, SYNC_FAILED, __( 'The Main Website did not list this blog, together with too many others at once. Nothing was changed here; check the connection to the Main Website.', 'acadvizen-cms' ) );
		} elseif ( 'unpublish_copy' === $action ) {
			blog_sync_writing( true );
			wp_update_post( array( 'ID' => $post_id, 'post_status' => 'draft' ) );
			blog_sync_writing( false );
			set_blog_sync_state( $post_id, SYNC_OK, __( 'Removed from the Main Website, so this Enrollment copy was set to Draft (not deleted).', 'acadvizen-cms' ) );
			++$counts['updated'];
		} elseif ( 'conflict' === $action ) {
			$previous = blog_sync_state( $post_id );
			if ( SYNC_CONFLICT !== ( $previous['state'] ?? '' ) ) {
				set_blog_sync_state( $post_id, SYNC_CONFLICT, __( 'Changed on both websites since they were last the same. Neither was overwritten. Open the blog in Main Website → Blogs, check both versions, and save the one to keep.', 'acadvizen-cms' ) );
			}
			++$counts['conflicts'];
		} elseif ( 'update' === $action ) {
			$full = main_content_request( array( 'op' => 'get', 'entity' => 'blogs', 'id' => $main_id ) );
			if ( ! $full['ok'] ) {
				++$counts['errors'];
				continue;
			}
			$record = (array) $full['body']['data'];
			$target = $targets[ $main_id ] ?? TARGET_BOTH;
			// Both: the copy follows Main's status. Enrollment only: Main is a private draft by design,
			// so the copy keeps its own status.
			$status = TARGET_BOTH === $target
				? ( 'published' === ( $record['status'] ?? '' ) ? 'published' : 'draft' )
				: ( 'publish' === $post->post_status ? 'published' : 'draft' );
			$error  = sync_enrollment_blog_copy( $main_id, $record, $target, $status );
			if ( '' === $error ) {
				++$counts['updated'];
			} else {
				set_blog_sync_state( $post_id, SYNC_FAILED, __( 'A change from the Main Website could not be applied here: ', 'acadvizen-cms' ) . $error );
				++$counts['errors'];
			}
		}
	}
	update_option( BLOG_PULL_LAST, $counts, false );
	return $counts;
}

/** The Blogs screen checks Main for changes when it opens (at most once a minute). */
function maybe_pull_on_blogs_screen(): void {
	if ( get_transient( BLOG_PULL_THROTTLE ) ) {
		return;
	}
	set_transient( BLOG_PULL_THROTTLE, 1, MINUTE_IN_SECONDS );
	pull_main_blog_changes();
}

function add_five_minute_schedule( array $schedules ): array {
	$schedules['acv_five_minutes'] = array( 'interval' => 5 * MINUTE_IN_SECONDS, 'display' => __( 'Every 5 minutes', 'acadvizen-cms' ) );
	return $schedules;
}

function ensure_blog_pull_job(): void {
	if ( ! wp_next_scheduled( BLOG_PULL_HOOK ) ) {
		wp_schedule_event( time() + 5 * MINUTE_IN_SECONDS, 'acv_five_minutes', BLOG_PULL_HOOK );
	}
}

/** Main Website → Blogs: when the Enrollment copies were last compared with Main, and any conflicts. */
function render_blog_pull_line(): void {
	$last = get_option( BLOG_PULL_LAST );
	$text = is_array( $last ) && ! empty( $last['time'] )
		/* translators: 1: time, 2: copies checked, 3: updated, 4: conflicts */
		? sprintf( __( 'Enrollment copies last compared with the Main Website: %1$s (%2$d checked, %3$d updated, %4$d with a conflict).', 'acadvizen-cms' ), wp_date( get_option( 'time_format' ), (int) $last['time'] ), (int) $last['checked'], (int) $last['updated'], (int) $last['conflicts'] )
		: __( 'Enrollment copies have not been compared with the Main Website yet.', 'acadvizen-cms' );
	if ( is_array( $last ) && ! empty( $last['errors'] ) ) {
		$text .= ' ' . __( 'The last check could not finish; nothing was changed. It is tried again every 5 minutes.', 'acadvizen-cms' );
	}
	printf(
		'<p class="description">%1$s <a class="button button-small" href="%2$s">%3$s</a></p>',
		esc_html( $text ),
		esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=acv_cms_blog_pull' ), 'acv_cms_blog_pull' ) ),
		esc_html__( 'Check now', 'acadvizen-cms' )
	);
	$conflicts = get_posts( array( 'post_type' => 'post', 'post_status' => 'any', 'posts_per_page' => 20, 'fields' => 'ids', 'meta_key' => BLOG_SYNC_STATE_META, 'meta_compare' => 'EXISTS' ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	foreach ( $conflicts as $post_id ) {
		$state = blog_sync_state( $post_id );
		if ( in_array( $state['state'] ?? '', array( SYNC_CONFLICT, SYNC_FAILED ), true ) ) {
			printf(
				'<div class="notice notice-warning inline"><p><strong>%1$s</strong> — %2$s: %3$s <a href="%4$s">%5$s</a></p></div>',
				esc_html( get_the_title( $post_id ) ),
				esc_html( blog_sync_label( $state ) ),
				esc_html( (string) ( $state['message'] ?? '' ) ),
				esc_url( (string) get_edit_post_link( $post_id ) ),
				esc_html__( 'Open the Enrollment copy', 'acadvizen-cms' )
			);
		}
	}
}

function handle_blog_pull_now(): void {
	check_admin_referer( 'acv_cms_blog_pull' );
	if ( ! main_can( 'blogs', 'edit' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$counts = pull_main_blog_changes();
	set_transient( BLOG_PULL_THROTTLE, 1, MINUTE_IN_SECONDS );
	main_flash(
		$counts['errors'] ? 'warning' : 'success',
		/* translators: 1: checked, 2: updated, 3: conflicts */
		sprintf( __( 'Compared with the Main Website: %1$d checked, %2$d updated, %3$d with a conflict.', 'acadvizen-cms' ), $counts['checked'], $counts['updated'], $counts['conflicts'] )
			. ( $counts['errors'] ? ' ' . __( 'The check could not finish; nothing was changed.', 'acadvizen-cms' ) : '' )
	);
	wp_safe_redirect( main_screen_url( array( 'entity' => 'blogs' ) ) );
	exit;
}

/* Editor UI ------------------------------------------------------------------------------------------ */

function register_blog_sync_meta(): void {
	register_post_meta(
		'post',
		BLOG_ALSO_MAIN_META,
		array(
			'type'          => 'boolean',
			'single'        => true,
			'show_in_rest'  => true,
			'auth_callback' => static fn() => main_can( 'blogs', 'publish' ),
		)
	);
}

function add_blog_sync_box(): void {
	if ( is_configured() ) {
		add_meta_box( 'acv-cms-main-website', __( 'Main Website', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_blog_sync_box', 'post', 'side', 'high' );
	}
}

function blog_sync_label( array $state ): string {
	$labels = array(
		SYNC_OK       => __( 'In step with the Main Website', 'acadvizen-cms' ),
		SYNC_CONFLICT => __( 'Conflict: changed on both websites', 'acadvizen-cms' ),
		SYNC_FAILED   => __( 'Not updated on the Main Website', 'acadvizen-cms' ),
	);
	return $labels[ $state['state'] ?? '' ] ?? __( 'Linked to the Main Website', 'acadvizen-cms' );
}

function render_blog_sync_box( \WP_Post $post ): void {
	$main_id = (string) get_post_meta( $post->ID, MAIN_BLOG_MIRROR_META, true );
	if ( '' === $main_id ) {
		wp_nonce_field( 'acv_cms_also_main', 'acv_cms_also_main_nonce' );
		printf(
			'<p><label><input type="checkbox" name="%1$s" value="1" %2$s %3$s /> %4$s</label></p><p class="description">%5$s</p>',
			esc_attr( BLOG_ALSO_MAIN_META ),
			checked( (bool) get_post_meta( $post->ID, BLOG_ALSO_MAIN_META, true ), true, false ),
			disabled( main_can( 'blogs', 'publish' ), false, false ),
			esc_html__( 'Also publish on the Main Website', 'acadvizen-cms' ),
			esc_html__( 'When this post is published, it also appears on www.acadvizen.com/blog in the Main Website\'s design. Later edits here update both websites.', 'acadvizen-cms' )
		);
		$state = blog_sync_state( $post->ID );
		if ( $state ) {
			echo '<p><strong>' . esc_html( blog_sync_label( $state ) ) . '</strong><br />' . esc_html( (string) ( $state['message'] ?? '' ) ) . '</p>';
		}
		return;
	}
	$state = blog_sync_state( $post->ID );
	echo '<p><strong>' . esc_html( blog_sync_label( $state ) ) . '</strong></p>';
	if ( ! empty( $state['message'] ) ) {
		echo '<p>' . esc_html( (string) $state['message'] ) . '</p>';
	}
	echo '<p class="description">' . esc_html__( 'This post is also a Main Website blog. Edits saved here are sent to the Main Website; edits made there arrive here within 5 minutes. Moving this post to the trash removes it from this website only.', 'acadvizen-cms' ) . '</p>';
	printf( '<p><a href="%1$s">%2$s</a></p>', esc_url( main_screen_url( array( 'entity' => 'blogs', 'view' => 'edit', 'id' => $main_id ) ) ), esc_html__( 'Open in Main Website → Blogs', 'acadvizen-cms' ) );
}

/** Classic editor and the block editor's meta box save: store the checkbox. */
function save_blog_sync_box( int $post_id ): void {
	if ( ! isset( $_POST['acv_cms_also_main_nonce'] ) || ! wp_verify_nonce( sanitize_key( wp_unslash( $_POST['acv_cms_also_main_nonce'] ) ), 'acv_cms_also_main' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) || ! main_can( 'blogs', 'publish' ) ) {
		return;
	}
	if ( ! empty( $_POST[ BLOG_ALSO_MAIN_META ] ) ) {
		update_post_meta( $post_id, BLOG_ALSO_MAIN_META, 1 );
	} else {
		delete_post_meta( $post_id, BLOG_ALSO_MAIN_META );
	}
}

/** Posts list: a "Main Website" column for linked posts. */
function add_blog_sync_column( array $columns ): array {
	$columns['acv_main'] = __( 'Main Website', 'acadvizen-cms' );
	return $columns;
}

function render_blog_sync_column( string $column, int $post_id ): void {
	if ( 'acv_main' !== $column ) {
		return;
	}
	if ( '' === (string) get_post_meta( $post_id, MAIN_BLOG_MIRROR_META, true ) ) {
		echo '—';
		return;
	}
	$state = blog_sync_state( $post_id );
	$class = SYNC_OK === ( $state['state'] ?? SYNC_OK ) ? 'acv-sync-ok' : 'acv-sync-attention';
	printf( '<span class="%1$s" title="%2$s">%3$s</span>', esc_attr( $class ), esc_attr( (string) ( $state['message'] ?? '' ) ), esc_html( blog_sync_label( $state ) ) );
}

/** After a save in the block editor: show the Main Website result as an editor notice. */
function enqueue_blog_sync_notice( string $hook ): void {
	if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) || 'post' !== get_post_type() || ! is_configured() ) {
		return;
	}
	wp_register_script( 'acv-cms-blog-sync', '', array( 'wp-data', 'wp-api-fetch', 'wp-notices' ), VERSION, true );
	wp_enqueue_script( 'acv-cms-blog-sync' );
	$script = '(function(){var d=wp.data,was=false;d.subscribe(function(){var e=d.select("core/editor");if(!e||!e.getCurrentPostId)return;var saving=e.isSavingPost()&&!e.isAutosavingPost();if(was&&!saving){var id=e.getCurrentPostId();wp.apiFetch({url:ajaxurl+"?action=acv_cms_blog_sync_state&post="+id+"&_wpnonce="+' . wp_json_encode( wp_create_nonce( 'acv_cms_blog_sync_state' ) ) . '}).then(function(s){if(s&&s.label){d.dispatch("core/notices").createNotice(s.state==="ok"?"success":(s.state==="conflict"?"warning":"error"),"Main Website: "+s.label+(s.message?" — "+s.message:""),{id:"acv-main-sync",isDismissible:true});}}).catch(function(){});}was=saving;});})();';
	wp_add_inline_script( 'acv-cms-blog-sync', $script );
}

function ajax_blog_sync_state(): void {
	check_ajax_referer( 'acv_cms_blog_sync_state' );
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	if ( ! $post_id || ! current_user_can( 'edit_post', $post_id ) ) {
		wp_send_json( array() );
	}
	$linked = '' !== (string) get_post_meta( $post_id, MAIN_BLOG_MIRROR_META, true );
	$state  = blog_sync_state( $post_id );
	if ( ! $linked && ! $state ) {
		wp_send_json( array() );
	}
	// Only report a result written during this save (the last minute).
	if ( empty( $state['time'] ) || time() - (int) $state['time'] > MINUTE_IN_SECONDS ) {
		wp_send_json( array() );
	}
	wp_send_json( array( 'state' => (string) ( $state['state'] ?? '' ), 'label' => blog_sync_label( $state ), 'message' => (string) ( $state['message'] ?? '' ) ) );
}

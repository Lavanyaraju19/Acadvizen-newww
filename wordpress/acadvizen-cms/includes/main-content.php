<?php
/**
 * Main Website content in this (central) WordPress admin: Acadvizen Master Admin → Main Website.
 *
 * The Main Website keeps its content in its own database and draws it with its own design. This
 * screen edits exactly those records (pages and their sections, blogs, tools, locations, cities,
 * testimonials) through the Main Website's signed content API (/api/wordpress/content); WordPress
 * never stores or renders them itself. Pages designed in Elementor and published through the Render
 * Bridge remain available alongside (Publish To on WordPress pages).
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MAIN_CONTENT_PAGE     = 'acadvizen-cms-main';
const MAIN_CONTENT_PATH     = '/api/wordpress/content';
const MAIN_CONTENT_TIMEOUT  = 20;
const MAIN_CONTENT_LOG      = 'acv_cms_main_content_log';
const MAIN_SNAPSHOT_TYPE    = 'acv_main_snapshot';
const MAIN_SNAPSHOT_KEEP    = 20;
const MAIN_BLOG_MIRROR_META = '_acv_main_blog_id';
const MAIN_BLOG_TARGETS     = 'acv_cms_main_blog_targets';
const MAIN_PER_PAGE         = 50;
const MAIN_PREVIEW_SECONDS  = 900;
const MAIN_OWNERS           = 'acv_cms_main_owners';

/* Content types ------------------------------------------------------------------------------- */

function main_seo_fields(): array {
	return array(
		'seo_title'            => array( __( 'SEO title', 'acadvizen-cms' ), 'text', __( 'Shown in Google and the browser tab. Leave empty to use the title.', 'acadvizen-cms' ) ),
		'seo_description'      => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', __( 'One or two sentences for search results.', 'acadvizen-cms' ) ),
		'canonical_url'        => array( __( 'Canonical address', 'acadvizen-cms' ), 'url', __( 'Only if this content also exists at another address. Usually empty.', 'acadvizen-cms' ) ),
		'og_image'             => array( __( 'Share image', 'acadvizen-cms' ), 'image', __( 'Shown when the page is shared on social media.', 'acadvizen-cms' ) ),
		'noindex'              => array( __( 'Hide from search engines', 'acadvizen-cms' ), 'checkbox', '' ),
		'exclude_from_sitemap' => array( __( 'Leave out of the sitemap', 'acadvizen-cms' ), 'checkbox', '' ),
	);
}

/**
 * The Main Website types edited here. "fields" mirror lib/wordpress/contentApi.js on the Main
 * Website, which validates every value again; "path" is the public address pattern.
 */
function main_entities(): array {
	$schedule = array(
		'scheduled_publish_at'   => array( __( 'Publish automatically on', 'acadvizen-cms' ), 'datetime', __( 'Optional. The page appears on this date (status must be Published).', 'acadvizen-cms' ) ),
		'scheduled_unpublish_at' => array( __( 'Remove automatically on', 'acadvizen-cms' ), 'datetime', __( 'Optional.', 'acadvizen-cms' ) ),
	);
	return array(
		'pages'          => array(
			'label'    => __( 'Pages', 'acadvizen-cms' ),
			'singular' => __( 'Page', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'status',
			'trash'    => true,
			'preview'  => true,
			'path'     => '/%s',
			'fields'   => array(
				'title'       => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'        => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/<address>. Lowercase letters, numbers and hyphens.', 'acadvizen-cms' ), true ),
				'description' => array( __( 'Short description', 'acadvizen-cms' ), 'textarea', __( 'Shown as the page text while the page has no sections.', 'acadvizen-cms' ) ),
			) + main_seo_fields() + $schedule,
		),
		'blogs'          => array(
			'label'    => __( 'Blogs', 'acadvizen-cms' ),
			'singular' => __( 'Blog', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'status',
			'trash'    => true,
			'preview'  => true,
			'targets'  => true,
			'path'     => '/blog/%s',
			'fields'   => array(
				'title'          => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'           => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/blog/<address>', 'acadvizen-cms' ), true ),
				'description'    => array( __( 'Summary', 'acadvizen-cms' ), 'textarea', __( 'Shown on the blog list and under the title.', 'acadvizen-cms' ) ),
				'excerpt'        => array( __( 'Excerpt', 'acadvizen-cms' ), 'textarea', '' ),
				'featured_image' => array( __( 'Cover image', 'acadvizen-cms' ), 'image', '' ),
				'categories'     => array( __( 'Categories', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
				'tags'           => array( __( 'Tags', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
				'content_json'   => array( __( 'Article', 'acadvizen-cms' ), 'blocks', '' ),
			) + main_seo_fields() + $schedule,
		),
		'tools_extended' => array(
			'label'    => __( 'Tools', 'acadvizen-cms' ),
			'singular' => __( 'Tool', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => true,
			'path'     => '/tools/%s',
			'fields'   => array(
				'name'        => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'        => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/tools/<address>', 'acadvizen-cms' ), true ),
				'category'    => array( __( 'Category', 'acadvizen-cms' ), 'text', __( 'e.g. SEO, Gen AI', 'acadvizen-cms' ) ),
				'description' => array( __( 'Description', 'acadvizen-cms' ), 'textarea', '' ),
				'logo_url'    => array( __( 'Logo', 'acadvizen-cms' ), 'image', '' ),
				'brand_color' => array( __( 'Brand colour', 'acadvizen-cms' ), 'color', '' ),
				'website_url' => array( __( 'Website', 'acadvizen-cms' ), 'url', '' ),
			),
		),
		'locations'      => array(
			'label'    => __( 'Locations', 'acadvizen-cms' ),
			'singular' => __( 'Location', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '/digital-marketing-courses-%s',
			'fields'   => array(
				'name'             => array( __( 'Name', 'acadvizen-cms' ), 'text', __( 'e.g. Jayanagar', 'acadvizen-cms' ), true ),
				'slug'             => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/digital-marketing-courses-<address>', 'acadvizen-cms' ), true ),
				'city_id'          => array( __( 'City', 'acadvizen-cms' ), 'city', __( 'The city this area belongs to.', 'acadvizen-cms' ) ),
				'location_type'    => array( __( 'Type', 'acadvizen-cms' ), 'text', __( 'e.g. area, branch', 'acadvizen-cms' ) ),
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'intro_text'       => array( __( 'Introduction', 'acadvizen-cms' ), 'textarea', '' ),
				'why_text'         => array( __( 'Why study here', 'acadvizen-cms' ), 'textarea', '' ),
				'demand_text'      => array( __( 'Local demand', 'acadvizen-cms' ), 'textarea', '' ),
				'address'          => array( __( 'Address', 'acadvizen-cms' ), 'textarea', '' ),
				'phone'            => array( __( 'Phone', 'acadvizen-cms' ), 'text', '' ),
				'whatsapp'         => array( __( 'WhatsApp', 'acadvizen-cms' ), 'text', '' ),
				'opening_hours'    => array( __( 'Opening hours', 'acadvizen-cms' ), 'text', '' ),
			),
		),
		'cities'         => array(
			'label'    => __( 'Cities', 'acadvizen-cms' ),
			'singular' => __( 'City', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '/digital-marketing-course-in-%s',
			'fields'   => array(
				'name'             => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'             => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/digital-marketing-course-in-<address>', 'acadvizen-cms' ), true ),
				'state'            => array( __( 'State', 'acadvizen-cms' ), 'text', '' ),
				'country'          => array( __( 'Country', 'acadvizen-cms' ), 'text', '' ),
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'intro_text'       => array( __( 'Introduction', 'acadvizen-cms' ), 'textarea', '' ),
				'highlights'       => array( __( 'Highlights', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
			),
		),
		'testimonials'   => array(
			'label'    => __( 'Testimonials', 'acadvizen-cms' ),
			'singular' => __( 'Testimonial', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '',
			'fields'   => array(
				'name'      => array( __( 'Student name', 'acadvizen-cms' ), 'text', '', true ),
				'role'      => array( __( 'Role', 'acadvizen-cms' ), 'text', __( 'e.g. SEO Executive', 'acadvizen-cms' ) ),
				'company'   => array( __( 'Company', 'acadvizen-cms' ), 'text', '' ),
				'course'    => array( __( 'Course', 'acadvizen-cms' ), 'text', '' ),
				'rating'    => array( __( 'Rating (1–5)', 'acadvizen-cms' ), 'rating', '' ),
				'quote'     => array( __( 'Quote', 'acadvizen-cms' ), 'textarea', '' ),
				'image_url' => array( __( 'Photo', 'acadvizen-cms' ), 'image', '' ),
			),
		),
	);
}

function main_entity( string $key ): ?array {
	return main_entities()[ $key ] ?? null;
}

/** Capability per action, reusing WordPress roles: Authors write blogs, Editors run the rest. */
function main_can( string $entity, string $action ): bool {
	$blog = 'blogs' === $entity;
	$caps = array(
		'edit'    => $blog ? 'edit_posts' : 'edit_pages',
		'approve' => $blog ? 'edit_others_posts' : 'edit_others_pages',
		'publish' => $blog ? 'publish_posts' : 'publish_pages',
		'delete'  => $blog ? 'delete_others_posts' : 'delete_others_pages',
	);
	return isset( $caps[ $action ] ) && current_user_can( $caps[ $action ] );
}

/**
 * Like WordPress's own posts: Editors and Administrators work on every record, Authors and
 * Contributors only on the ones they created here. Records created elsewhere have no owner here.
 */
function main_manages_record( string $entity, string $id ): bool {
	if ( '' === $id || main_can( $entity, 'approve' ) ) {
		return true;
	}
	$owners = (array) get_option( MAIN_OWNERS, array() );
	return get_current_user_id() > 0 && (int) ( $owners[ $entity . ':' . $id ] ?? 0 ) === get_current_user_id();
}

function main_can_record( string $entity, string $action, string $id ): bool {
	return main_can( $entity, $action ) && main_manages_record( $entity, $id );
}

function remember_main_owner( string $entity, string $id, int $user_id ): void {
	$owners = (array) get_option( MAIN_OWNERS, array() );
	if ( $user_id > 0 ) {
		$owners[ $entity . ':' . $id ] = $user_id;
	} else {
		unset( $owners[ $entity . ':' . $id ] );
	}
	update_option( MAIN_OWNERS, $owners, false );
}

/** The first content type this user may work on (Pages for Editors, Blogs for Authors). */
function main_default_entity(): string {
	foreach ( array_keys( main_entities() ) as $key ) {
		if ( main_can( $key, 'edit' ) ) {
			return $key;
		}
	}
	return 'pages';
}

/**
 * Refuses the Main Website screen before WordPress starts the page, so a refusal is a real 403
 * (a check inside the screen runs after the admin header has been sent with status 200).
 */
function guard_main_screen(): void {
	if ( ! isset( $_GET['page'] ) || MAIN_CONTENT_PAGE !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	$view   = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'list'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$entity = isset( $_GET['entity'] ) ? sanitize_key( wp_unslash( $_GET['entity'] ) ) : main_default_entity(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$id     = isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$ok     = 'log' === $view ? current_user_can( 'edit_pages' ) : ( main_entity( $entity ) && main_can_record( $entity, 'edit', $id ) );
	if ( ! $ok ) {
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), '', array( 'response' => 403, 'back_link' => true ) );
	}
}

function main_status_labels(): array {
	return array(
		'draft'     => __( 'Draft', 'acadvizen-cms' ),
		'review'    => __( 'In review', 'acadvizen-cms' ),
		'approved'  => __( 'Approved', 'acadvizen-cms' ),
		'published' => __( 'Published', 'acadvizen-cms' ),
		'archived'  => __( 'Archived', 'acadvizen-cms' ),
	);
}

/** Statuses this user may choose: review for writers, approval for editors, publishing with the publish capability. */
function main_allowed_statuses( string $entity ): array {
	$allowed = array( 'draft', 'review' );
	if ( main_can( $entity, 'approve' ) ) {
		$allowed[] = 'approved';
	}
	if ( main_can( $entity, 'publish' ) ) {
		$allowed[] = 'published';
		$allowed[] = 'archived';
	}
	return $allowed;
}

function main_public_url( string $entity, string $slug ): string {
	$definition = main_entity( $entity );
	if ( ! $definition || '' === $definition['path'] || '' === $slug ) {
		return '';
	}
	return main_site_url() . sprintf( $definition['path'], rawurlencode( $slug ) );
}

/* The signed connection --------------------------------------------------------------------- */

/**
 * One call to the Main Website's content API.
 *
 * @return array{ok: bool, status: int, body: array, error: string}
 */
function main_content_request( array $args ): array {
	$user    = wp_get_current_user();
	$payload = array_merge(
		array(
			'purpose'    => 'content',
			'request_id' => wp_generate_uuid4(),
			'actor'      => array( 'wp_user_id' => (int) $user->ID, 'login' => (string) $user->user_login ),
		),
		$args
	);
	$result = post_to_main( MAIN_CONTENT_PATH, $payload, MAIN_CONTENT_TIMEOUT );
	if ( ! in_array( $args['op'] ?? '', array( 'list', 'get' ), true ) ) {
		main_content_log(
			array(
				'at'     => time(),
				'user'   => (string) $user->user_login,
				'op'     => (string) ( $args['op'] ?? '' ),
				'entity' => (string) ( $args['entity'] ?? '' ),
				'id'     => (string) ( $result['body']['data']['id'] ?? $args['id'] ?? '' ),
				'ok'     => (bool) $result['ok'],
				'error'  => $result['ok'] ? '' : main_error_text( $result ),
			)
		);
	}
	return $result;
}

function main_content_log( array $entry ): void {
	$log = get_option( MAIN_CONTENT_LOG, array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift( $log, $entry );
	update_option( MAIN_CONTENT_LOG, array_slice( $log, 0, 300 ), false );
}

/** Plain-language reason for a failed call, with the Main Website's validation details. */
function main_error_text( array $result ): string {
	$messages = array(
		'not_configured'       => __( 'The connection to the Main Website is not set up (shared secret or address missing).', 'acadvizen-cms' ),
		'content_api_disabled' => __( 'The Main Website has not switched on editing from WordPress yet (WORDPRESS_CONTENT_API_ENABLED).', 'acadvizen-cms' ),
		'slug_taken'           => __( 'This address is already used by another record.', 'acadvizen-cms' ),
		'validation_failed'    => __( 'Some fields are not valid.', 'acadvizen-cms' ),
		'broken_links'         => __( 'Not published: the page links to addresses that do not exist on the Main Website.', 'acadvizen-cms' ),
		'in_trash'             => __( 'This record is in the trash. Restore it first.', 'acadvizen-cms' ),
		'not_in_trash'         => __( 'Move the record to the trash before deleting it permanently.', 'acadvizen-cms' ),
		'still_active'         => __( 'Hide the record from the Main Website before deleting it permanently.', 'acadvizen-cms' ),
		'duplicate_request'    => __( 'This change was already received.', 'acadvizen-cms' ),
		'unsupported_section_type' => __( 'This kind of section cannot be added here.', 'acadvizen-cms' ),
	);
	$code    = (string) ( $result['body']['error'] ?? '' );
	$text    = $messages[ $code ] ?? ( '' !== $code ? $code : (string) $result['error'] );
	$details = $result['body']['details'] ?? array();
	if ( is_array( $details ) && $details ) {
		$text .= ' ' . implode( '; ', array_map( static fn( $d ) => is_string( $d ) ? $d : (string) wp_json_encode( $d ), array_slice( $details, 0, 8 ) ) );
	}
	return '' !== $text ? $text : __( 'The Main Website did not answer.', 'acadvizen-cms' );
}

/** A link to the Main Website's preview of a record, valid for 15 minutes (lib/wordpress/previewToken.js). */
function main_preview_url( string $entity, string $id ): string {
	if ( ! in_array( $entity, array( 'pages', 'blogs' ), true ) || strlen( webhook_secret() ) < MIN_SECRET_LENGTH ) {
		return '';
	}
	$expires = time() + MAIN_PREVIEW_SECONDS;
	return main_site_url() . '/preview/wordpress/' . rawurlencode( $entity ) . '/' . rawurlencode( $id ) . '?exp=' . $expires . '&sig=' . main_preview_signature( $entity, $id, $expires );
}

/** Same scheme as signPreview() in lib/wordpress/previewToken.js. */
function main_preview_signature( string $entity, string $id, int $expires ): string {
	return hash_hmac( 'sha256', "preview-content.{$entity}.{$id}.{$expires}", webhook_secret() );
}

/* Version history (each successful save is kept, so an earlier version can be restored) --------- */

function register_main_snapshot_type(): void {
	register_post_type(
		MAIN_SNAPSHOT_TYPE,
		array(
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_rest'       => false,
			'rewrite'            => false,
			'query_var'          => false,
			'can_export'         => false,
			'supports'           => array(),
		)
	);
}

function save_main_snapshot( string $entity, string $id, array $record, string $status ): void {
	$snapshot_id = wp_insert_post(
		array(
			'post_type'    => MAIN_SNAPSHOT_TYPE,
			'post_status'  => 'private',
			'post_title'   => $entity . ' ' . $id,
			'post_content' => wp_slash( (string) wp_json_encode( array( 'record' => $record, 'status' => $status ) ) ),
		)
	);
	if ( ! $snapshot_id || is_wp_error( $snapshot_id ) ) {
		return;
	}
	update_post_meta( $snapshot_id, '_acv_entity', $entity );
	update_post_meta( $snapshot_id, '_acv_record_id', $id );
	foreach ( array_slice( list_main_snapshots( $entity, $id ), MAIN_SNAPSHOT_KEEP ) as $old ) {
		wp_delete_post( (int) $old->ID, true );
	}
}

function list_main_snapshots( string $entity, string $id ): array {
	return get_posts(
		array(
			'post_type'      => MAIN_SNAPSHOT_TYPE,
			'post_status'    => 'private',
			'posts_per_page' => 50,
			'orderby'        => 'ID',
			'order'          => 'DESC',
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array( 'key' => '_acv_entity', 'value' => $entity ),
				array( 'key' => '_acv_record_id', 'value' => $id ),
			),
		)
	);
}

/* Blogs on the Enrollment website (Publish To: Enrollment / Both) ------------------------------- */

function main_blog_targets(): array {
	$targets = get_option( MAIN_BLOG_TARGETS, array() );
	return is_array( $targets ) ? $targets : array();
}

function main_blog_target( string $id ): string {
	return (string) ( main_blog_targets()[ $id ] ?? TARGET_MAIN );
}

/** The article as WordPress post content, from the same blocks the Main Website draws. */
function main_blog_html( array $blocks, string $cover = '' ): string {
	$html = '' !== $cover ? '<figure class="wp-block-image"><img src="' . esc_url( $cover ) . '" alt="" /></figure>' : '';
	foreach ( $blocks as $block ) {
		$type = $block['block_type'] ?? '';
		$c    = is_array( $block['content_json'] ?? null ) ? $block['content_json'] : array();
		if ( 'heading' === $type ) {
			$level = in_array( (int) ( $c['level'] ?? 2 ), array( 2, 3, 4 ), true ) ? (int) $c['level'] : 2;
			$html .= "<h{$level}>" . esc_html( (string) ( $c['text'] ?? '' ) ) . "</h{$level}>";
		} elseif ( 'paragraph' === $type ) {
			$html .= '<p>' . wp_kses_post( (string) ( $c['text'] ?? '' ) ) . '</p>';
		} elseif ( 'list' === $type ) {
			$html .= '<ul>' . implode( '', array_map( static fn( $item ) => '<li>' . wp_kses_post( (string) $item ) . '</li>', (array) ( $c['items'] ?? array() ) ) ) . '</ul>';
		} elseif ( 'image' === $type && ! empty( $c['src'] ) ) {
			$caption = (string) ( $c['caption'] ?? '' );
			$html   .= '<figure class="wp-block-image"><img src="' . esc_url( (string) $c['src'] ) . '" alt="' . esc_attr( (string) ( $c['alt'] ?? '' ) ) . '" />' . ( '' !== $caption ? '<figcaption>' . esc_html( $caption ) . '</figcaption>' : '' ) . '</figure>';
		}
	}
	return $html;
}

function find_enrollment_blog_copy( string $main_id ): int {
	$ids = get_posts( array( 'post_type' => 'post', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => 1, 'meta_key' => MAIN_BLOG_MIRROR_META, 'meta_value' => $main_id ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	return $ids ? (int) $ids[0] : 0;
}

/**
 * Keeps the Enrollment website's copy of a blog in step with its Publish To choice: Enrollment
 * and Both publish a normal WordPress post (drawn by the Enrollment theme); Main alone takes the
 * copy off Enrollment (draft). The copy is identified by the Main record id, so it is never duplicated.
 *
 * @return string '' or an error message.
 */
function sync_enrollment_blog_copy( string $main_id, array $record, string $target, string $status ): string {
	$copy_id = find_enrollment_blog_copy( $main_id );
	if ( ! targets_enrollment( $target ) ) {
		if ( $copy_id ) {
			wp_update_post( array( 'ID' => $copy_id, 'post_status' => 'draft' ) );
		}
		return '';
	}
	$post = array(
		'post_type'    => 'post',
		'post_title'   => (string) ( $record['title'] ?? '' ),
		'post_name'    => (string) ( $record['slug'] ?? '' ),
		'post_excerpt' => (string) ( $record['excerpt'] ?? $record['description'] ?? '' ),
		'post_content' => main_blog_html( (array) ( $record['content_json']['blocks'] ?? array() ), (string) ( $record['featured_image'] ?? '' ) ),
		'post_status'  => 'published' === $status ? 'publish' : 'draft',
	);
	if ( $copy_id ) {
		$post['ID'] = $copy_id;
	}
	$result = $copy_id ? wp_update_post( wp_slash( $post ), true ) : wp_insert_post( wp_slash( $post ), true );
	if ( is_wp_error( $result ) ) {
		return $result->get_error_message();
	}
	update_post_meta( (int) $result, MAIN_BLOG_MIRROR_META, $main_id );
	return '';
}

/* Reading the edit form ------------------------------------------------------------------------- */

/** The record as typed in the form, in the shape the Main Website expects. */
function main_record_from_post( array $definition ): array {
	$record = array();
	foreach ( $definition['fields'] as $key => $field ) {
		$type = $field[1];
		if ( 'checkbox' === $type ) {
			$record[ $key ] = ! empty( $_POST['acv_field'][ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
			continue;
		}
		if ( ! isset( $_POST['acv_field'][ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			continue;
		}
		$raw = wp_unslash( $_POST['acv_field'][ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised per type below.
		switch ( $type ) {
			case 'textarea':
				$record[ $key ] = sanitize_textarea_field( (string) $raw );
				break;
			case 'url':
			case 'image':
				$record[ $key ] = main_clean_url( (string) $raw );
				break;
			case 'slug':
				$record[ $key ] = sanitize_title( (string) $raw );
				break;
			case 'lines':
				$record[ $key ] = array_values( array_filter( array_map( 'sanitize_text_field', preg_split( '/\r\n|\r|\n/', (string) $raw ) ) ) );
				break;
			case 'rating':
				$record[ $key ] = '' === (string) $raw ? null : max( 1, min( 5, (int) $raw ) );
				break;
			case 'color':
				$record[ $key ] = (string) sanitize_hex_color( (string) $raw );
				break;
			case 'datetime':
				$record[ $key ] = '' === (string) $raw ? null : get_gmt_from_date( str_replace( 'T', ' ', (string) $raw ) . ':00', 'c' );
				break;
			case 'blocks':
				// Sent only when the article was changed in the editor (an untouched article, or a
				// page where the editor script did not run, leaves the stored article as it is).
				$decoded = json_decode( (string) $raw, true );
				if ( ! is_array( $decoded ) || ! isset( $decoded['blocks'] ) || ! is_array( $decoded['blocks'] ) ) {
					continue 2;
				}
				$record[ $key ] = array( 'blocks' => array_values( $decoded['blocks'] ) );
				break;
			case 'city':
				$record[ $key ] = '' === (string) $raw ? null : sanitize_text_field( (string) $raw );
				break;
			default:
				$record[ $key ] = sanitize_text_field( (string) $raw );
		}
		if ( '' === $record[ $key ] && ! in_array( $type, array( 'slug' ), true ) ) {
			$record[ $key ] = null;
		}
	}
	return $record;
}

/** An https address, or a site-relative path as the Main Website stores many images ("/blog-images/…"). */
function main_clean_url( string $raw ): string {
	$raw = trim( $raw );
	if ( '' === $raw ) {
		return '';
	}
	if ( preg_match( '#^/(?!/)[^\s<>"\']*$#', $raw ) ) {
		return $raw;
	}
	return (string) esc_url_raw( $raw, array( 'https' ) );
}

/* Saving and actions ---------------------------------------------------------------------------- */

function main_flash( string $type, string $message ): void {
	set_transient( 'acv_cms_main_notice_' . get_current_user_id(), array( $type, $message ), 120 );
}

function main_screen_url( array $args = array() ): string {
	return add_query_arg( array_merge( array( 'page' => MAIN_CONTENT_PAGE ), $args ), admin_url( 'admin.php' ) );
}

function handle_main_save(): void {
	$entity     = isset( $_POST['entity'] ) ? sanitize_key( wp_unslash( $_POST['entity'] ) ) : '';
	$definition = main_entity( $entity );
	check_admin_referer( 'acv_cms_main_save_' . $entity );
	$id = isset( $_POST['id'] ) ? sanitize_text_field( wp_unslash( $_POST['id'] ) ) : '';
	if ( ! $definition || ! main_can_record( $entity, 'edit', $id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$record = main_record_from_post( $definition );
	$back   = static fn( $record_id ) => main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $record_id ) );

	$saved = main_content_request( array( 'op' => 'save', 'entity' => $entity, 'id' => '' !== $id ? $id : null, 'record' => $record ) );
	if ( ! $saved['ok'] ) {
		main_flash( 'error', main_error_text( $saved ) );
		set_transient( 'acv_cms_main_unsaved_' . get_current_user_id(), $record, 300 );
		wp_safe_redirect( '' !== $id ? $back( $id ) : main_screen_url( array( 'entity' => $entity, 'view' => 'edit' ) ) );
		exit;
	}
	$row    = (array) $saved['body']['data'];
	if ( '' === $id ) {
		remember_main_owner( $entity, (string) $row['id'], get_current_user_id() );
	}
	$id     = (string) $row['id'];
	$status = (string) ( $row['status'] ?? '' );
	$notes  = array();

	// Status / visibility, limited by this user's role.
	if ( 'status' === $definition['workflow'] && isset( $_POST['acv_status'] ) ) {
		$wanted = sanitize_key( wp_unslash( $_POST['acv_status'] ) );
		if ( 'blogs' === $entity && isset( $_POST['acv_target'] ) && TARGET_ENROLLMENT === sanitize_key( wp_unslash( $_POST['acv_target'] ) ) && 'published' === $wanted ) {
			$wanted  = 'draft'; // Enrollment only: never public on the Main Website.
			$notes[] = __( 'Kept as a draft on the Main Website because Publish To is "Enrollment Website".', 'acadvizen-cms' );
		}
		if ( $wanted !== $status ) {
			if ( ! in_array( $wanted, main_allowed_statuses( $entity ), true ) ) {
				$notes[] = __( 'Your role cannot set that status; the content was saved without changing it.', 'acadvizen-cms' );
			} else {
				$changed = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'status' => $wanted ) );
				if ( $changed['ok'] ) {
					$row    = (array) $changed['body']['data'];
					$status = (string) ( $row['status'] ?? $wanted );
					if ( ! empty( $changed['body']['merged_into'] ) ) {
						$id      = (string) $changed['body']['merged_into'];
						$notes[] = __( 'Your draft copy was published onto the live page.', 'acadvizen-cms' );
					}
				} else {
					main_flash( 'error', __( 'Saved, but the status was not changed: ', 'acadvizen-cms' ) . main_error_text( $changed ) );
					wp_safe_redirect( $back( $id ) );
					exit;
				}
			}
		}
	} elseif ( 'active' === $definition['workflow'] && main_can( $entity, 'publish' ) ) {
		$wanted = ! empty( $_POST['acv_active'] );
		if ( (bool) ( $row['is_active'] ?? false ) !== $wanted ) {
			$changed = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'active' => $wanted ) );
			if ( ! $changed['ok'] ) {
				main_flash( 'error', __( 'Saved, but showing/hiding failed: ', 'acadvizen-cms' ) . main_error_text( $changed ) );
				wp_safe_redirect( $back( $id ) );
				exit;
			}
			$row = (array) $changed['body']['data'];
		}
	}

	// Blogs: Publish To (Main / Enrollment / Both).
	if ( ! empty( $definition['targets'] ) && isset( $_POST['acv_target'] ) ) {
		$target            = sanitize_publish_target( sanitize_key( wp_unslash( $_POST['acv_target'] ) ) );
		$targets           = main_blog_targets();
		$targets[ $id ]    = $target;
		update_option( MAIN_BLOG_TARGETS, $targets, false );
		$enrollment_status = TARGET_ENROLLMENT === $target && in_array( sanitize_key( wp_unslash( $_POST['acv_status'] ?? '' ) ), array( 'published' ), true ) && main_can( $entity, 'publish' ) ? 'published' : $status;
		$error             = sync_enrollment_blog_copy( $id, array_merge( $record, $row ), $target, $enrollment_status );
		$notes[]           = '' === $error
			? ( targets_enrollment( $target ) ? __( 'Enrollment Website: updated.', 'acadvizen-cms' ) : '' )
			: __( 'Enrollment Website copy failed: ', 'acadvizen-cms' ) . $error;
	}

	// The whole saved record (not only the fields sent), so restoring a version brings everything back.
	save_main_snapshot( $entity, $id, array_intersect_key( array_merge( $record, $row ), $definition['fields'] ), $status );
	$revalidated = (array) ( $saved['body']['revalidation'] ?? array() );
	$message     = __( 'Saved on the Main Website.', 'acadvizen-cms' );
	if ( isset( $revalidated['ok'] ) && ! $revalidated['ok'] ) {
		$message .= ' ' . __( 'The page cache could not be refreshed; the change shows within 5 minutes.', 'acadvizen-cms' );
	}
	main_flash( 'success', trim( $message . ' ' . implode( ' ', array_filter( $notes ) ) ) );
	wp_safe_redirect( $back( $id ) );
	exit;
}

/** Trash, restore, permanent delete, private draft copy, version restore (each a confirmed button). */
function handle_main_action(): void {
	$entity     = isset( $_REQUEST['entity'] ) ? sanitize_key( wp_unslash( $_REQUEST['entity'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$id         = isset( $_REQUEST['id'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$do         = isset( $_REQUEST['do'] ) ? sanitize_key( wp_unslash( $_REQUEST['do'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$definition = main_entity( $entity );
	check_admin_referer( "acv_cms_main_{$do}_{$entity}_{$id}" );
	$need = array( 'trash' => 'edit', 'restore' => 'edit', 'delete' => 'delete', 'start_draft' => 'edit', 'restore_version' => 'edit', 'show' => 'publish', 'hide' => 'publish' );
	if ( ! $definition || ! isset( $need[ $do ] ) || ! main_can_record( $entity, $need[ $do ], $id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$list = main_screen_url( array( 'entity' => $entity ) );
	switch ( $do ) {
		case 'trash':
		case 'restore':
			$result = main_content_request( array( 'op' => $do, 'entity' => $entity, 'id' => $id ) );
			if ( $result['ok'] && 'blogs' === $entity && 'trash' === $do ) {
				sync_enrollment_blog_copy( $id, array(), TARGET_MAIN, 'draft' );
			}
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? ( 'trash' === $do ? __( 'Moved to the trash and removed from the Main Website.', 'acadvizen-cms' ) : __( 'Restored as a draft.', 'acadvizen-cms' ) ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'show':
		case 'hide':
			$result = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'active' => 'show' === $do ) );
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? ( 'show' === $do ? __( 'Now shown on the Main Website.', 'acadvizen-cms' ) : __( 'Hidden from the Main Website.', 'acadvizen-cms' ) ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'delete':
			$result = main_content_request( array( 'op' => 'delete', 'entity' => $entity, 'id' => $id, 'confirm' => true ) );
			if ( $result['ok'] ) {
				remember_main_owner( $entity, $id, 0 );
				foreach ( list_main_snapshots( $entity, $id ) as $snapshot ) {
					wp_delete_post( (int) $snapshot->ID, true );
				}
			}
			if ( $result['ok'] && 'blogs' === $entity ) {
				$copy = find_enrollment_blog_copy( $id );
				if ( $copy ) {
					wp_trash_post( $copy );
				}
			}
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'Deleted permanently.', 'acadvizen-cms' ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'start_draft':
			$result = main_content_request( array( 'op' => 'start_draft', 'entity' => 'pages', 'id' => $id ) );
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'Private draft copy ready. Your changes stay private until you publish the draft.', 'acadvizen-cms' ) : main_error_text( $result ) );
			wp_safe_redirect( $result['ok'] ? main_screen_url( array( 'entity' => 'pages', 'view' => 'edit', 'id' => (string) $result['body']['data']['id'] ) ) : $list );
			exit;
		case 'restore_version':
			$snapshot_id = isset( $_REQUEST['snapshot'] ) ? absint( $_REQUEST['snapshot'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$snapshot    = get_post( $snapshot_id );
			$data        = $snapshot && MAIN_SNAPSHOT_TYPE === $snapshot->post_type && get_post_meta( $snapshot_id, '_acv_record_id', true ) === $id ? json_decode( $snapshot->post_content, true ) : null;
			if ( ! is_array( $data ) || ! is_array( $data['record'] ?? null ) ) {
				main_flash( 'error', __( 'That version could not be found.', 'acadvizen-cms' ) );
			} else {
				$result = main_content_request( array( 'op' => 'save', 'entity' => $entity, 'id' => $id, 'record' => array_intersect_key( $data['record'], $definition['fields'] ) ) );
				if ( $result['ok'] ) {
					$status = (string) ( $result['body']['data']['status'] ?? '' );
					save_main_snapshot( $entity, $id, array_intersect_key( array_merge( $data['record'], (array) $result['body']['data'] ), $definition['fields'] ), $status );
					if ( 'blogs' === $entity ) {
						// The Enrollment copy follows the restored version too.
						sync_enrollment_blog_copy( $id, array_merge( $data['record'], (array) $result['body']['data'] ), main_blog_target( $id ), $status );
					}
				}
				main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'The earlier version is back. Its status was not changed.', 'acadvizen-cms' ) : main_error_text( $result ) );
			}
			wp_safe_redirect( main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) ) );
			exit;
	}
}

function main_action_url( string $do, string $entity, string $id, array $extra = array() ): string {
	return wp_nonce_url( add_query_arg( array_merge( array( 'action' => 'acv_cms_main_action', 'do' => $do, 'entity' => $entity, 'id' => $id ), $extra ), admin_url( 'admin-post.php' ) ), "acv_cms_main_{$do}_{$entity}_{$id}" );
}

/** Section editing for a page (admin-ajax): save, delete, reorder. */
function ajax_main_section(): void {
	check_ajax_referer( 'acv_cms_main_section', 'nonce' );
	if ( ! main_can_record( 'pages', 'edit', isset( $_POST['page_id'] ) ? sanitize_text_field( wp_unslash( $_POST['page_id'] ) ) : '' ) ) {
		wp_send_json_error( array( 'message' => __( 'You are not allowed to do this.', 'acadvizen-cms' ) ), 403 );
	}
	$op      = isset( $_POST['op'] ) ? sanitize_key( wp_unslash( $_POST['op'] ) ) : '';
	$page_id = isset( $_POST['page_id'] ) ? sanitize_text_field( wp_unslash( $_POST['page_id'] ) ) : '';
	$args    = array( 'entity' => 'sections', 'page_id' => $page_id );
	if ( 'save' === $op ) {
		// Decoded as objects so an empty {} (e.g. a section with no design settings) is re-sent as {}, not [].
		$record = json_decode( (string) wp_unslash( $_POST['record'] ?? '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated by the Main Website.
		$args  += array( 'op' => 'save', 'id' => sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) ) ?: null, 'record' => is_object( $record ) ? get_object_vars( $record ) + array( 'page_id' => $page_id ) : array() );
	} elseif ( 'delete' === $op ) {
		$args += array( 'op' => 'delete', 'id' => sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) ) );
	} elseif ( 'reorder' === $op ) {
		$ids   = json_decode( (string) wp_unslash( $_POST['ids'] ?? '' ), true ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$args += array( 'op' => 'reorder_sections', 'ids' => is_array( $ids ) ? array_values( array_map( 'sanitize_text_field', $ids ) ) : array() );
	} else {
		wp_send_json_error( array( 'message' => 'invalid_op' ), 400 );
	}
	$result = main_content_request( $args );
	if ( ! $result['ok'] ) {
		wp_send_json_error( array( 'message' => main_error_text( $result ) ), 400 );
	}
	wp_send_json_success( $result['body']['data'] ?? array() );
}

/* Screens ------------------------------------------------------------------------------------- */

function enqueue_main_editor_assets( string $hook ): void {
	if ( false === strpos( $hook, MAIN_CONTENT_PAGE ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_style( 'acadvizen-cms-main-editor', plugins_url( 'assets/main-editor.css', __DIR__ ), array(), VERSION );
	wp_enqueue_script( 'acadvizen-cms-main-editor', plugins_url( 'assets/main-editor.js', __DIR__ ), array(), VERSION, true );
}

function render_main_notice(): void {
	$key    = 'acv_cms_main_notice_' . get_current_user_id();
	$notice = get_transient( $key );
	if ( is_array( $notice ) ) {
		delete_transient( $key );
		printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', 'error' === $notice[0] ? 'error' : 'success', esc_html( (string) $notice[1] ) );
	}
}

function render_main_content_page(): void {
	$entity = isset( $_GET['entity'] ) ? sanitize_key( wp_unslash( $_GET['entity'] ) ) : main_default_entity(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$view   = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'list'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'log' === $view ) {
		render_main_log();
		return;
	}
	$definition = main_entity( $entity );
	if ( ! $definition || ! main_can_record( $entity, 'edit', isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), 403 );
	}
	echo '<div class="wrap acv-main">';
	if ( 'preview' === $view ) {
		render_main_preview( $entity, isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	} elseif ( 'edit' === $view ) {
		render_main_edit( $entity, $definition, isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	} else {
		render_main_list( $entity, $definition );
	}
	echo '</div>';
}

function render_main_tabs( string $current ): void {
	echo '<nav class="nav-tab-wrapper">';
	foreach ( main_entities() as $key => $definition ) {
		if ( main_can( $key, 'edit' ) ) {
			printf( '<a class="nav-tab%1$s" href="%2$s">%3$s</a>', $key === $current ? ' nav-tab-active' : '', esc_url( main_screen_url( array( 'entity' => $key ) ) ), esc_html( $definition['label'] ) );
		}
	}
	printf( '<a class="nav-tab" href="%1$s">%2$s</a>', esc_url( main_screen_url( array( 'view' => 'log' ) ) ), esc_html__( 'Activity', 'acadvizen-cms' ) );
	echo '</nav>';
}

function render_main_connection_notice(): bool {
	if ( is_configured() ) {
		return true;
	}
	$reason = production_isolation_error();
	printf(
		'<div class="notice notice-warning"><p><strong>%1$s</strong> %2$s</p></div>',
		esc_html__( 'Not connected to the Main Website.', 'acadvizen-cms' ),
		esc_html( '' !== $reason ? $reason : __( 'Your developer adds the Main Website address and shared secret in wp-config.php. Until then this screen cannot show or change Main Website content.', 'acadvizen-cms' ) )
	);
	return false;
}

function render_main_status_badge( array $definition, array $row ): string {
	if ( ! empty( $row['deleted_at'] ) ) {
		return '<span class="acv-main-badge acv-main-badge--muted">' . esc_html__( 'In trash', 'acadvizen-cms' ) . '</span>';
	}
	if ( 'status' === $definition['workflow'] ) {
		$status = (string) ( $row['status'] ?? 'draft' );
		$label  = main_status_labels()[ $status ] ?? $status;
		if ( 'published' === $status && ! empty( $row['scheduled_publish_at'] ) && strtotime( (string) $row['scheduled_publish_at'] ) > time() ) {
			/* translators: %s: date */
			$label = sprintf( __( 'Scheduled for %s', 'acadvizen-cms' ), wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['scheduled_publish_at'] ) ) );
		}
		return '<span class="acv-main-badge acv-main-badge--' . esc_attr( 'published' === $status ? 'ok' : 'muted' ) . '">' . esc_html( $label ) . '</span>';
	}
	return ! empty( $row['is_active'] )
		? '<span class="acv-main-badge acv-main-badge--ok">' . esc_html__( 'Shown on Main', 'acadvizen-cms' ) . '</span>'
		: '<span class="acv-main-badge acv-main-badge--muted">' . esc_html__( 'Hidden', 'acadvizen-cms' ) . '</span>';
}

function render_main_list( string $entity, array $definition ): void {
	$search  = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$status  = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$trashed = ! empty( $_GET['trashed'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged   = max( 1, isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	printf( '<h1 class="wp-heading-inline">%1$s</h1> <a class="page-title-action" href="%2$s">%3$s</a>', esc_html__( 'Main Website', 'acadvizen-cms' ) . ' — ' . esc_html( $definition['label'] ), esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'edit' ) ) ), esc_html__( 'Add new', 'acadvizen-cms' ) );
	echo '<hr class="wp-header-end" />';
	render_main_notice();
	echo '<p class="description">' . esc_html__( 'This is the content www.acadvizen.com shows. Saving here updates the Main Website directly; its design stays as it is.', 'acadvizen-cms' ) . '</p>';
	render_main_tabs( $entity );
	if ( ! render_main_connection_notice() ) {
		return;
	}

	$args = array( 'op' => 'list', 'entity' => $entity, 'search' => $search, 'limit' => MAIN_PER_PAGE, 'offset' => ( $paged - 1 ) * MAIN_PER_PAGE );
	if ( $status ) {
		$args['status'] = $status;
	}
	if ( $trashed ) {
		$args['trashed'] = true;
	}
	$result = main_content_request( $args );
	?>
	<form method="get" class="acv-main-filters">
		<input type="hidden" name="page" value="<?php echo esc_attr( MAIN_CONTENT_PAGE ); ?>" />
		<input type="hidden" name="entity" value="<?php echo esc_attr( $entity ); ?>" />
		<?php if ( 'status' === $definition['workflow'] ) : ?>
			<select name="status" aria-label="<?php esc_attr_e( 'Status', 'acadvizen-cms' ); ?>">
				<option value=""><?php esc_html_e( 'All statuses', 'acadvizen-cms' ); ?></option>
				<?php foreach ( main_status_labels() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?>><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		<?php endif; ?>
		<input type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search title or address', 'acadvizen-cms' ); ?>" />
		<?php submit_button( __( 'Filter', 'acadvizen-cms' ), 'secondary', '', false ); ?>
		<?php if ( $definition['trash'] ) : ?>
			<a href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity ) + ( $trashed ? array() : array( 'trashed' => 1 ) ) ) ); ?>"><?php echo $trashed ? esc_html__( '← Back to all', 'acadvizen-cms' ) : esc_html__( 'Trash', 'acadvizen-cms' ); ?></a>
		<?php endif; ?>
	</form>
	<?php
	if ( ! $result['ok'] ) {
		echo '<div class="notice notice-error"><p>' . esc_html( main_error_text( $result ) ) . '</p></div>';
		return;
	}
	$rows  = (array) ( $result['body']['data'] ?? array() );
	$total = (int) ( $result['body']['total'] ?? count( $rows ) );
	if ( ! main_can( $entity, 'approve' ) ) {
		$rows  = array_values( array_filter( $rows, static fn( $row ) => main_manages_record( $entity, (string) ( (array) $row )['id'] ) ) );
		$total = count( $rows );
		echo '<p class="description">' . esc_html__( 'You see the items you created here. Editors and Administrators see all of them.', 'acadvizen-cms' ) . '</p>';
	}
	if ( ! $rows ) {
		echo '<p class="acv-main-empty">' . esc_html( $trashed ? __( 'The trash is empty.', 'acadvizen-cms' ) : __( 'Nothing here yet. Use "Add new" to create the first one.', 'acadvizen-cms' ) ) . '</p>';
		return;
	}
	echo '<table class="widefat striped acv-main-table"><thead><tr><th>' . esc_html__( 'Title', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Address on www.acadvizen.com', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Status', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Last change', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Actions', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( $rows as $row ) {
		$row     = (array) $row;
		$id      = (string) $row['id'];
		$title   = (string) ( $row[ $definition['title'] ] ?? '' );
		$url     = main_public_url( $entity, (string) ( $row['slug'] ?? '' ) );
		$edit    = main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) );
		$actions = array();
		if ( empty( $row['deleted_at'] ) ) {
			$actions[] = '<a href="' . esc_url( $edit ) . '">' . esc_html__( 'Edit', 'acadvizen-cms' ) . '</a>';
			if ( ! empty( $definition['preview'] ) ) {
				$actions[] = '<a href="' . esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'preview', 'id' => $id ) ) ) . '">' . esc_html__( 'Preview', 'acadvizen-cms' ) . '</a>';
			}
			if ( $url && ( 'published' === ( $row['status'] ?? '' ) || ! empty( $row['is_active'] ) ) ) {
				$actions[] = '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . esc_html__( 'View live', 'acadvizen-cms' ) . '</a>';
			}
			if ( 'active' === $definition['workflow'] && main_can( $entity, 'publish' ) ) {
				$do        = empty( $row['is_active'] ) ? 'show' : 'hide';
				$actions[] = '<a href="' . esc_url( main_action_url( $do, $entity, $id ) ) . '">' . esc_html( 'show' === $do ? __( 'Show on Main', 'acadvizen-cms' ) : __( 'Hide', 'acadvizen-cms' ) ) . '</a>';
			}
			if ( $definition['trash'] ) {
				$actions[] = '<a class="acv-danger" href="' . esc_url( main_action_url( 'trash', $entity, $id ) ) . '" data-confirm="' . esc_attr__( 'Move to the trash? It disappears from the Main Website.', 'acadvizen-cms' ) . '">' . esc_html__( 'Trash', 'acadvizen-cms' ) . '</a>';
			}
		} else {
			$actions[] = '<a href="' . esc_url( main_action_url( 'restore', $entity, $id ) ) . '">' . esc_html__( 'Restore', 'acadvizen-cms' ) . '</a>';
		}
		$deletable = $definition['trash'] ? ! empty( $row['deleted_at'] ) : empty( $row['is_active'] );
		if ( $deletable && main_can( $entity, 'delete' ) ) {
			$actions[] = '<a class="acv-danger" href="' . esc_url( main_action_url( 'delete', $entity, $id ) ) . '" data-confirm="' . esc_attr__( 'Delete permanently? This cannot be undone.', 'acadvizen-cms' ) . '">' . esc_html__( 'Delete permanently', 'acadvizen-cms' ) . '</a>';
		}
		printf(
			'<tr><td><strong><a href="%1$s">%2$s</a></strong></td><td>%3$s</td><td>%4$s</td><td>%5$s</td><td class="acv-main-actions">%6$s</td></tr>',
			esc_url( $edit ),
			esc_html( '' !== $title ? $title : __( '(no title)', 'acadvizen-cms' ) ),
			$url ? '<code>' . esc_html( (string) wp_parse_url( $url, PHP_URL_PATH ) ) . '</code>' : '—',
			render_main_status_badge( $definition, $row ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside.
			esc_html( ! empty( $row['updated_at'] ) ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['updated_at'] ) ) : '' ),
			implode( ' | ', $actions ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts.
		);
	}
	echo '</tbody></table>';
	if ( $total > MAIN_PER_PAGE ) {
		echo '<p class="acv-main-pages">';
		for ( $p = 1; $p <= (int) ceil( $total / MAIN_PER_PAGE ); $p++ ) {
			printf( $p === $paged ? '<strong>%2$d</strong> ' : '<a href="%1$s">%2$d</a> ', esc_url( add_query_arg( 'paged', $p ) ), (int) $p );
		}
		echo '</p>';
	}
}

function render_main_field( string $key, array $field, $value, array $cities ): void {
	list( $label, $type ) = $field;
	$help     = (string) ( $field[2] ?? '' );
	$required = ! empty( $field[3] );
	$name     = 'acv_field[' . $key . ']';
	$id       = 'acv-field-' . $key;
	echo '<div class="acv-main-field acv-main-field--' . esc_attr( $type ) . '">';
	if ( 'checkbox' === $type ) {
		printf( '<label><input type="checkbox" name="%1$s" value="1" %2$s /> %3$s</label>', esc_attr( $name ), checked( ! empty( $value ), true, false ), esc_html( $label ) );
	} else {
		printf( '<label for="%1$s">%2$s%3$s</label>', esc_attr( $id ), esc_html( $label ), $required ? ' <span class="required">*</span>' : '' );
		switch ( $type ) {
			case 'textarea':
				printf( '<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( (string) $value ) );
				break;
			case 'lines':
				printf( '<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( implode( "\n", (array) $value ) ) );
				break;
			case 'image':
				printf( '<span class="acv-main-image"><input type="url" id="%1$s" name="%2$s" value="%3$s" placeholder="https://" /> <button type="button" class="button acv-media-pick" data-target="%1$s">%4$s</button></span>%5$s', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), esc_html__( 'Choose image', 'acadvizen-cms' ), $value ? '<img class="acv-main-thumb" src="' . esc_url( (string) $value ) . '" alt="" />' : '' );
				break;
			case 'color':
				printf( '<input type="color" id="%1$s" name="%2$s" value="%3$s" />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) ( $value ?: '#000000' ) ) );
				break;
			case 'rating':
				printf( '<input type="number" min="1" max="5" id="%1$s" name="%2$s" value="%3$s" />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ) );
				break;
			case 'datetime':
				$local = $value ? wp_date( 'Y-m-d\TH:i', strtotime( (string) $value ) ) : '';
				printf( '<input type="datetime-local" id="%1$s" name="%2$s" value="%3$s" /> <span class="description">%4$s</span>', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $local ), esc_html( wp_timezone_string() ) );
				break;
			case 'city':
				echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '"><option value="">' . esc_html__( '— none —', 'acadvizen-cms' ) . '</option>';
				foreach ( $cities as $city ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $city['id'] ), selected( (string) $value, (string) $city['id'], false ), esc_html( (string) $city['name'] ) );
				}
				echo '</select>';
				break;
			case 'blocks':
				printf( '<div id="acv-blocks" data-blocks="%1$s" data-plain="%2$s" data-target="%3$s"></div><input type="hidden" id="%3$s" name="%4$s" value="" />', esc_attr( (string) wp_json_encode( $value ?: array( 'blocks' => array() ) ) ), esc_attr( (string) ( $GLOBALS['acv_main_plain_article'] ?? '' ) ), esc_attr( $id ), esc_attr( $name ) );
				break;
			case 'url':
				printf( '<input type="url" id="%1$s" name="%2$s" value="%3$s" placeholder="https://" />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ) );
				break;
			default:
				printf( '<input type="text" id="%1$s" name="%2$s" value="%3$s" %4$s />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), $required ? 'required' : '' );
		}
	}
	if ( '' !== $help ) {
		echo '<p class="description">' . esc_html( $help ) . '</p>';
	}
	echo '</div>';
}

function render_main_edit( string $entity, array $definition, string $id ): void {
	$creating = '' === $id;
	$row      = array();
	if ( ! $creating ) {
		$result = main_content_request( array( 'op' => 'get', 'entity' => $entity, 'id' => $id ) );
		if ( ! $result['ok'] ) {
			render_main_notice();
			echo '<div class="notice notice-error"><p>' . esc_html( main_error_text( $result ) ) . '</p></div>';
			return;
		}
		$row = (array) $result['body']['data'];
	}
	$unsaved = get_transient( 'acv_cms_main_unsaved_' . get_current_user_id() );
	if ( is_array( $unsaved ) ) {
		delete_transient( 'acv_cms_main_unsaved_' . get_current_user_id() );
		$row = array_merge( $row, $unsaved ); // Keep what was typed after a refused save.
	}
	// A blog stored only as plain text (no blocks yet) opens with that text, split into paragraphs.
	$GLOBALS['acv_main_plain_article'] = 'blogs' === $entity ? (string) ( $row['content'] ?? '' ) : '';
	$cities = array();
	if ( 'locations' === $entity ) {
		$list   = main_content_request( array( 'op' => 'list', 'entity' => 'cities', 'limit' => 200 ) );
		$cities = $list['ok'] ? (array) $list['body']['data'] : array();
	}
	$status   = (string) ( $row['status'] ?? 'draft' );
	$is_draft = ! empty( $row['draft_of_id'] );
	$url      = main_public_url( $entity, (string) ( $row['slug'] ?? '' ) );
	$target   = 'blogs' === $entity && ! $creating ? main_blog_target( $id ) : TARGET_MAIN;

	/* translators: %s: content type */
	printf( '<h1>%1$s</h1>', esc_html( sprintf( $creating ? __( 'New %s', 'acadvizen-cms' ) : __( 'Edit %s', 'acadvizen-cms' ), strtolower( $definition['singular'] ) ) ) );
	printf( '<p><a href="%1$s">← %2$s</a></p>', esc_url( main_screen_url( array( 'entity' => $entity ) ) ), esc_html( $definition['label'] ) );
	render_main_notice();
	if ( ! render_main_connection_notice() ) {
		return;
	}
	if ( $is_draft ) {
		echo '<div class="notice notice-info"><p>' . esc_html__( 'This is a private draft copy of a live page. Visitors keep seeing the live page until you set the status to Published.', 'acadvizen-cms' ) . '</p></div>';
	}
	if ( 'blogs' === $entity && ! empty( $row['legacy_blocks'] ) ) {
		echo '<div class="notice notice-warning"><p>' . esc_html__( 'This blog\'s article is drawn from an older storage on the Main Website, so changes to the article below will not show there. Title, summary, images and SEO fields work as usual. Ask your developer to convert it.', 'acadvizen-cms' ) . '</p></div>';
	}
	?>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" id="acv-main-form" class="acv-main-grid">
		<input type="hidden" name="action" value="acv_cms_main_save" />
		<input type="hidden" name="entity" value="<?php echo esc_attr( $entity ); ?>" />
		<input type="hidden" name="id" value="<?php echo esc_attr( $id ); ?>" />
		<?php wp_nonce_field( 'acv_cms_main_save_' . $entity ); ?>
		<div class="acv-main-fields">
			<?php
			foreach ( $definition['fields'] as $key => $field ) {
				render_main_field( $key, $field, $row[ $key ] ?? null, $cities );
			}
			?>
		</div>
		<aside class="acv-main-side">
			<div class="acv-main-box">
				<h2><?php esc_html_e( 'Publish', 'acadvizen-cms' ); ?></h2>
				<p><strong><?php esc_html_e( 'Publish To', 'acadvizen-cms' ); ?></strong><br />
				<?php if ( ! empty( $definition['targets'] ) ) : ?>
					<select name="acv_target">
						<?php foreach ( target_labels() as $value => $label ) : ?>
							<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $target, $value ); ?>><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select>
					<span class="description"><?php esc_html_e( 'Main: www.acadvizen.com/blog. Enrollment: a post on enroll.acadvizen.com. Both: both, each in its own design.', 'acadvizen-cms' ); ?></span>
				<?php else : ?>
					<?php esc_html_e( 'Main Website', 'acadvizen-cms' ); ?>
					<span class="description"><?php esc_html_e( 'This kind of content exists only on www.acadvizen.com. Enrollment pages are edited in WordPress → Pages with Elementor.', 'acadvizen-cms' ); ?></span>
				<?php endif; ?>
				</p>
				<?php if ( 'status' === $definition['workflow'] ) : ?>
					<p><label for="acv-status"><strong><?php esc_html_e( 'Status', 'acadvizen-cms' ); ?></strong></label><br />
					<select id="acv-status" name="acv_status">
						<?php foreach ( main_status_labels() as $value => $label ) : ?>
							<?php if ( in_array( $value, main_allowed_statuses( $entity ), true ) || $value === $status ) : ?>
								<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?> <?php disabled( ! in_array( $value, main_allowed_statuses( $entity ), true ) ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endif; ?>
						<?php endforeach; ?>
					</select>
					<span class="description"><?php esc_html_e( 'Only Published is shown on the website. In review and Approved are for your team.', 'acadvizen-cms' ); ?></span></p>
				<?php elseif ( main_can( $entity, 'publish' ) ) : ?>
					<p><label><input type="checkbox" name="acv_active" value="1" <?php checked( ! empty( $row['is_active'] ) ); ?> /> <?php esc_html_e( 'Show on the Main Website', 'acadvizen-cms' ); ?></label></p>
				<?php endif; ?>
				<p class="acv-main-buttons">
					<?php submit_button( $creating ? __( 'Create', 'acadvizen-cms' ) : __( 'Save', 'acadvizen-cms' ), 'primary', 'submit', false ); ?>
					<?php if ( ! $creating && ! empty( $definition['preview'] ) ) : ?>
						<a class="button" href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'preview', 'id' => $id ) ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Preview (desktop, tablet, mobile)', 'acadvizen-cms' ); ?></a>
					<?php endif; ?>
				</p>
				<?php if ( $url && ! $creating && ( 'published' === $status || ! empty( $row['is_active'] ) ) && ! $is_draft ) : ?>
					<p><a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'View on www.acadvizen.com', 'acadvizen-cms' ); ?> ↗</a></p>
				<?php endif; ?>
				<?php if ( ! $creating && 'pages' === $entity && ! $is_draft && 'published' === $status ) : ?>
					<p><?php if ( ! empty( $row['draft_id'] ) ) : ?>
						<a class="button" href="<?php echo esc_url( main_screen_url( array( 'entity' => 'pages', 'view' => 'edit', 'id' => (string) $row['draft_id'] ) ) ); ?>"><?php esc_html_e( 'Continue the private draft', 'acadvizen-cms' ); ?></a>
					<?php else : ?>
						<a class="button" href="<?php echo esc_url( main_action_url( 'start_draft', 'pages', $id ) ); ?>"><?php esc_html_e( 'Prepare changes privately', 'acadvizen-cms' ); ?></a>
					<?php endif; ?>
					<br /><span class="description"><?php esc_html_e( 'This page is live: changes saved here, including sections, show immediately. A private draft keeps them hidden until you publish it.', 'acadvizen-cms' ); ?></span></p>
				<?php endif; ?>
				<?php if ( ! $creating && ! empty( $row['updated_at'] ) ) : ?>
					<p class="description">
						<?php
						/* translators: %s: date and time */
						echo esc_html( sprintf( __( 'Last change: %s', 'acadvizen-cms' ), wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['updated_at'] ) ) ) );
						?>
					</p>
				<?php endif; ?>
			</div>
		</aside>
	</form>
	<?php
	if ( 'pages' === $entity && ! $creating ) {
		$sections = main_content_request( array( 'op' => 'list', 'entity' => 'sections', 'page_id' => $id ) );
		?>
		<div class="acv-main-box acv-main-sections-box">
			<h2><?php esc_html_e( 'Sections', 'acadvizen-cms' ); ?></h2>
			<p class="description"><?php esc_html_e( 'The blocks this page is built from, in order, drawn with the Main Website\'s own design. Drag to reorder. Each section is saved on its own. Changes affect this page only.', 'acadvizen-cms' ); ?></p>
			<?php if ( $sections['ok'] ) : ?>
				<div id="acv-sections"
					data-page-id="<?php echo esc_attr( $id ); ?>"
					data-sections="<?php echo esc_attr( (string) wp_json_encode( (array) $sections['body']['data'] ) ); ?>"
					data-ajax="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"
					data-nonce="<?php echo esc_attr( wp_create_nonce( 'acv_cms_main_section' ) ); ?>"></div>
			<?php else : ?>
				<p class="notice notice-error"><?php echo esc_html( main_error_text( $sections ) ); ?></p>
			<?php endif; ?>
		</div>
		<?php
	}
	if ( ! $creating ) {
		$snapshots = list_main_snapshots( $entity, $id );
		echo '<div class="acv-main-box"><h2>' . esc_html__( 'Earlier versions', 'acadvizen-cms' ) . '</h2>';
		if ( ! $snapshots ) {
			echo '<p class="description">' . esc_html__( 'Versions are kept from the first save in this admin.', 'acadvizen-cms' ) . '</p>';
		} else {
			echo '<ul class="acv-main-versions">';
			foreach ( $snapshots as $index => $snapshot ) {
				printf(
					'<li>%1$s — %2$s %3$s</li>',
					esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $snapshot->post_date_gmt . ' UTC' ) ) ),
					esc_html( (string) get_the_author_meta( 'display_name', (int) $snapshot->post_author ) ),
					0 === $index ? '<em>' . esc_html__( '(current)', 'acadvizen-cms' ) . '</em>' : '<a class="button button-small" href="' . esc_url( main_action_url( 'restore_version', $entity, $id, array( 'snapshot' => $snapshot->ID ) ) ) . '" data-confirm="' . esc_attr__( 'Bring back this version? The current text is kept as a version too.', 'acadvizen-cms' ) . '">' . esc_html__( 'Restore', 'acadvizen-cms' ) . '</a>'
				);
			}
			echo '</ul>';
		}
		echo '</div>';
	}
}

/** Desktop / tablet / mobile preview of the Main Website's own rendering. */
function render_main_preview( string $entity, string $id ): void {
	$url = main_preview_url( $entity, $id );
	printf( '<h1>%s</h1>', esc_html__( 'Preview on the Main Website', 'acadvizen-cms' ) );
	if ( '' === $url ) {
		echo '<div class="notice notice-warning"><p>' . esc_html__( 'Preview needs the connection to the Main Website (shared secret).', 'acadvizen-cms' ) . '</p></div>';
		return;
	}
	?>
	<p class="acv-preview-toolbar" role="group" aria-label="<?php esc_attr_e( 'Device', 'acadvizen-cms' ); ?>">
		<button type="button" class="button button-primary" data-width="1280"><?php esc_html_e( 'Desktop', 'acadvizen-cms' ); ?></button>
		<button type="button" class="button" data-width="820"><?php esc_html_e( 'Tablet', 'acadvizen-cms' ); ?></button>
		<button type="button" class="button" data-width="390"><?php esc_html_e( 'Mobile', 'acadvizen-cms' ); ?></button>
		<a class="button" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Open in a new tab', 'acadvizen-cms' ); ?></a>
		<a href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) ) ); ?>"><?php esc_html_e( '← Back to editing', 'acadvizen-cms' ); ?></a>
	</p>
	<p class="description"><?php esc_html_e( 'Exactly how www.acadvizen.com draws this content, including unpublished changes. The link is valid for 15 minutes; reload this page for a new one.', 'acadvizen-cms' ); ?></p>
	<div class="acv-preview-stage"><iframe id="acv-preview-frame" title="<?php esc_attr_e( 'Main Website preview', 'acadvizen-cms' ); ?>" src="<?php echo esc_url( $url ); ?>" style="width:1280px"></iframe></div>
	<?php
}

function render_main_log(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), 403 );
	}
	echo '<div class="wrap acv-main"><h1>' . esc_html__( 'Main Website — activity', 'acadvizen-cms' ) . '</h1>';
	render_main_tabs( '' );
	$log = get_option( MAIN_CONTENT_LOG, array() );
	if ( ! $log ) {
		echo '<p>' . esc_html__( 'No changes yet.', 'acadvizen-cms' ) . '</p></div>';
		return;
	}
	echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'When', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Who', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'What', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Result', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( (array) $log as $entry ) {
		printf(
			'<tr><td>%1$s</td><td>%2$s</td><td>%3$s</td><td>%4$s</td></tr>',
			esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $entry['at'] ) ),
			esc_html( (string) $entry['user'] ),
			esc_html( $entry['op'] . ' ' . $entry['entity'] . ( '' !== (string) $entry['id'] ? ' ' . substr( (string) $entry['id'], 0, 8 ) : '' ) ),
			$entry['ok'] ? '<span class="acv-main-badge acv-main-badge--ok">' . esc_html__( 'Done', 'acadvizen-cms' ) . '</span>' : '<span class="acv-main-badge acv-main-badge--error">' . esc_html( (string) $entry['error'] ) . '</span>'
		);
	}
	echo '</tbody></table></div>';
}

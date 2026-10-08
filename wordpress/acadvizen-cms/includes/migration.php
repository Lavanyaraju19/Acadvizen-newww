<?php
/**
 * Master Admin > Import Main Website: brings the existing www.acadvizen.com content and design into
 * WordPress so WordPress + Elementor become their source of truth.
 *
 * A migration bundle (JSON, produced from the live Main Website by tools/main-to-elementor) holds
 * media, menus, Elementor templates (header, footer, designs), Main Website global colours/fonts,
 * pages (as native Elementor designs) and records (tools, blogs, courses, locations, FAQs,
 * testimonials) with their SEO and Main Website addresses.
 *
 * The import is:
 *   - repeatable and idempotent: every item carries a source key (_acv_source); importing again
 *     updates the same WordPress item instead of creating a copy;
 *   - resumable: it runs in small steps from the admin screen and remembers where it stopped;
 *   - logged: every created/updated/skipped item is listed;
 *   - reversible: "Undo this import" deletes everything this bundle created (never anything else).
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const IMPORT_STATE_OPTION = 'acv_cms_import_state';
const IMPORT_LOG_OPTION   = 'acv_cms_import_log';
const META_SOURCE         = '_acv_source';
const META_IMPORT_BATCH   = '_acv_import_batch';
const IMPORT_STEPS        = array( 'media', 'terms', 'menus', 'kit', 'templates', 'settings', 'records', 'finish' );
const IMPORT_TIME_BUDGET  = 20;
const IMPORT_LOCK_OPTION  = 'acv_cms_import_lock';
const IMPORT_LOCK_TTL     = 150; // Longer than a step can run (set_time_limit 120).

function import_dir(): string {
	$uploads = wp_upload_dir();
	$dir     = trailingslashit( $uploads['basedir'] ) . 'acv-migration';
	if ( ! is_dir( $dir ) ) {
		wp_mkdir_p( $dir );
		file_put_contents( $dir . '/.htaccess', "Require all denied\nDeny from all\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $dir . '/index.php', "<?php\n// Silence.\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
	}
	return $dir;
}

function import_state(): array {
	$state = get_option( IMPORT_STATE_OPTION );
	return is_array( $state ) ? $state : array();
}

function save_import_state( array $state ): void {
	update_option( IMPORT_STATE_OPTION, $state, false );
}

function import_log( string $line ): void {
	$log   = (array) get_option( IMPORT_LOG_OPTION, array() );
	$log[] = gmdate( 'H:i:s' ) . '  ' . $line;
	update_option( IMPORT_LOG_OPTION, array_slice( $log, -800 ), false );
}

function load_bundle( array $state ): array {
	$file = (string) ( $state['file'] ?? '' );
	if ( '' === $file || ! is_readable( $file ) ) {
		return array();
	}
	$bundle = json_decode( (string) file_get_contents( $file ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	return is_array( $bundle ) ? $bundle : array();
}

/** Items of one step, in a stable order. */
function bundle_items( array $bundle, string $step ): array {
	switch ( $step ) {
		case 'media':
			return array_values( (array) ( $bundle['media'] ?? array() ) );
		case 'terms':
			return array_values( (array) ( $bundle['terms'] ?? array() ) );
		case 'menus':
			return array_values( (array) ( $bundle['menus'] ?? array() ) );
		case 'kit':
			return empty( $bundle['kit'] ) ? array() : array( $bundle['kit'] );
		case 'templates':
			return array_values( (array) ( $bundle['templates'] ?? array() ) );
		case 'settings':
			return empty( $bundle['settings'] ) ? array() : array( $bundle['settings'] );
		case 'records':
			return array_values( (array) ( $bundle['records'] ?? array() ) );
		case 'finish':
			return array( 'finish' );
	}
	return array();
}

/** The WordPress post already imported for this source key, or 0. */
function post_by_source( string $key, string $post_type = 'any' ): int {
	$ids = posts_by_source( $key, $post_type, 1 );
	return $ids ? $ids[0] : 0;
}

/**
 * A file name WordPress can store: the Media Library item takes its address (post_name, at most
 * 200 characters) from it, and some Main images are named after a whole sentence.
 */
function short_file_name( string $name, int $max = 120 ): string {
	if ( strlen( $name ) <= $max ) {
		return $name;
	}
	$dot  = strrpos( $name, '.' );
	$ext  = false !== $dot && strlen( $name ) - $dot <= 6 ? substr( $name, $dot ) : '';
	$base = substr( $name, 0, strlen( $name ) - strlen( $ext ) );
	return rtrim( substr( $base, 0, $max - strlen( $ext ) - 9 ), '-_.' ) . '-' . substr( md5( $base ), 0, 8 ) . $ext;
}

/** The items imported from one source key, oldest first. */
function posts_by_source( string $key, string $post_type = 'any', int $limit = 20 ): array {
	$ids = get_posts(
		array(
			'post_type'        => $post_type,
			'post_status'      => 'any',
			'fields'           => 'ids',
			'posts_per_page'   => $limit,
			'orderby'          => 'ID',
			'order'            => 'ASC',
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_SOURCE, 'value' => $key ) ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		)
	);
	return array_map( 'intval', (array) $ids );
}

/* Placeholders ---------------------------------------------------------------------------------- */

/**
 * Replaces bundle references with the WordPress items they became:
 *   acv-media://<key>      -> media URL          acv-media-id://<key> -> media ID (number)
 *   acv-template://<key>   -> template post ID   acv-menu://<key>     -> menu term ID
 *   acv-record://<key>     -> Main Website path of an imported record
 */
function resolve_placeholders( $value, array $map ) {
	if ( is_array( $value ) ) {
		foreach ( $value as $k => $v ) {
			$value[ $k ] = resolve_placeholders( $v, $map );
		}
		return $value;
	}
	if ( ! is_string( $value ) || false === strpos( $value, 'acv-' ) ) {
		return $value;
	}
	if ( preg_match( '#^acv-media-id://([a-z0-9_\-]+)$#i', $value, $m ) ) {
		return (int) ( $map['media'][ $m[1] ]['id'] ?? 0 );
	}
	return (string) preg_replace_callback(
		'#acv-(media|template|menu|record)://([a-z0-9_\-]+)#i',
		static function ( $m ) use ( $map ) {
			switch ( strtolower( $m[1] ) ) {
				case 'media':
					return (string) ( $map['media'][ $m[2] ]['url'] ?? '' );
				case 'template':
					return (string) ( $map['templates'][ $m[2] ] ?? 0 );
				case 'menu':
					return (string) ( $map['menus'][ $m[2] ] ?? 0 );
				case 'record':
					return (string) ( $map['paths'][ $m[2] ] ?? '/' );
			}
			return $m[0];
		},
		$value
	);
}

/* Steps ------------------------------------------------------------------------------------------ */

function import_media_item( array $item, array &$state ): string {
	$key = sanitize_key( (string) ( $item['key'] ?? '' ) );
	$url = esc_url_raw( (string) ( $item['url'] ?? '' ) );
	if ( '' === $key || '' === $url ) {
		return 'skipped media without key/url';
	}
	$existing = post_by_source( 'media:' . $key, 'attachment' );
	if ( $existing ) {
		$state['map']['media'][ $key ] = array( 'id' => $existing, 'url' => (string) wp_get_attachment_url( $existing ) );
		if ( isset( $item['alt'] ) ) {
			update_post_meta( $existing, '_wp_attachment_image_alt', sanitize_text_field( (string) $item['alt'] ) );
		}
		return "media {$key}: already imported (#{$existing})";
	}
	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';
	$tmp = download_url( $url, 60 );
	if ( is_wp_error( $tmp ) ) {
		$state['map']['media'][ $key ] = array( 'id' => 0, 'url' => $url );
		return "media {$key}: download failed ({$tmp->get_error_message()}); the original address is kept";
	}
	$name = short_file_name( sanitize_file_name( (string) ( $item['filename'] ?? basename( (string) wp_parse_url( $url, PHP_URL_PATH ) ) ) ) );
	$id   = media_handle_sideload( array( 'name' => $name, 'tmp_name' => $tmp ), 0, sanitize_text_field( (string) ( $item['title'] ?? '' ) ) );
	if ( is_wp_error( $id ) ) {
		wp_delete_file( $tmp );
		$state['map']['media'][ $key ] = array( 'id' => 0, 'url' => $url );
		return "media {$key}: not imported ({$id->get_error_message()}); the original address is kept";
	}
	update_post_meta( $id, META_SOURCE, 'media:' . $key );
	update_post_meta( $id, META_IMPORT_BATCH, $state['batch'] );
	update_post_meta( $id, '_acv_source_url', $url );
	if ( isset( $item['alt'] ) ) {
		update_post_meta( $id, '_wp_attachment_image_alt', sanitize_text_field( (string) $item['alt'] ) );
	}
	$state['map']['media'][ $key ] = array( 'id' => (int) $id, 'url' => (string) wp_get_attachment_url( $id ) );
	return "media {$key}: imported (#{$id})";
}

function import_term_item( array $item, array &$state ): string {
	$taxonomy = sanitize_key( (string) ( $item['taxonomy'] ?? '' ) );
	$name     = sanitize_text_field( (string) ( $item['name'] ?? '' ) );
	if ( ! taxonomy_exists( $taxonomy ) || '' === $name ) {
		return "skipped term {$name}";
	}
	$parent = 0;
	if ( ! empty( $item['parent'] ) ) {
		$parent_term = get_term_by( 'name', (string) $item['parent'], $taxonomy );
		$parent      = $parent_term ? (int) $parent_term->term_id : 0;
	}
	$term = get_term_by( 'slug', sanitize_title( (string) ( $item['slug'] ?? $name ) ), $taxonomy );
	if ( $term ) {
		return "term {$taxonomy}/{$name}: exists";
	}
	$created = wp_insert_term( $name, $taxonomy, array( 'slug' => sanitize_title( (string) ( $item['slug'] ?? $name ) ), 'parent' => $parent, 'description' => wp_kses_post( (string) ( $item['description'] ?? '' ) ) ) );
	if ( is_wp_error( $created ) ) {
		return "term {$name}: " . $created->get_error_message();
	}
	update_term_meta( (int) $created['term_id'], META_IMPORT_BATCH, $state['batch'] );
	return "term {$taxonomy}/{$name}: created";
}

function import_menu_item( array $item, array &$state ): string {
	$key  = sanitize_key( (string) ( $item['key'] ?? '' ) );
	$name = sanitize_text_field( (string) ( $item['name'] ?? $key ) );
	$menu = wp_get_nav_menu_object( $name );
	if ( $menu ) {
		// Rebuild the items so the menu matches the bundle exactly.
		foreach ( (array) wp_get_nav_menu_items( $menu->term_id ) as $old ) {
			wp_delete_post( (int) $old->ID, true );
		}
		$menu_id = (int) $menu->term_id;
		$verb    = 'updated';
	} else {
		$menu_id = (int) wp_create_nav_menu( $name );
		update_term_meta( $menu_id, META_IMPORT_BATCH, $state['batch'] );
		$verb = 'created';
	}
	$ids = array();
	foreach ( (array) ( $item['items'] ?? array() ) as $index => $link ) {
		$parent = isset( $link['parent'] ) ? (int) ( $ids[ (string) $link['parent'] ] ?? 0 ) : 0;
		$ids[ (string) ( $link['key'] ?? $index ) ] = (int) wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'     => sanitize_text_field( (string) ( $link['title'] ?? '' ) ),
				'menu-item-url'       => esc_url_raw( (string) ( $link['url'] ?? '#' ) ),
				'menu-item-status'    => 'publish',
				'menu-item-type'      => 'custom',
				'menu-item-parent-id' => $parent,
				'menu-item-position'  => $index + 1,
			)
		);
	}
	$state['map']['menus'][ $key ] = $menu_id;
	return "menu {$name}: {$verb} with " . count( $ids ) . ' items';
}

/**
 * Main Website global colours and fonts are added to Elementor's Site Settings (the active kit) as
 * custom colours/fonts. Main designs reference them, so changing one restyles the Main Website.
 * Existing (Enrollment) colours and fonts are untouched.
 */
function import_kit_item( array $item, array &$state ): string {
	$kit_id = (int) get_option( 'elementor_active_kit' );
	if ( ! $kit_id ) {
		return 'kit: no active Elementor kit';
	}
	$settings = get_post_meta( $kit_id, '_elementor_page_settings', true );
	$settings = is_array( $settings ) ? $settings : array();
	$added    = 0;
	foreach ( array( 'custom_colors' => 'colors', 'custom_typography' => 'typography' ) as $setting => $bundle_key ) {
		$current = isset( $settings[ $setting ] ) && is_array( $settings[ $setting ] ) ? $settings[ $setting ] : array();
		// Early test imports numbered their globals per bundle (acvmc01…), so the same number meant
		// different colours in different bundles. Globals are now keyed by value; drop the old ones.
		$current = array_values( array_filter( $current, static fn( $entry ) => ! preg_match( '/^acvm[ct]\d{2}$/', (string) ( $entry['_id'] ?? '' ) ) ) );
		$by_id   = array();
		foreach ( $current as $index => $entry ) {
			$by_id[ (string) ( $entry['_id'] ?? '' ) ] = $index;
		}
		foreach ( (array) ( $item[ $bundle_key ] ?? array() ) as $entry ) {
			$id = (string) ( $entry['_id'] ?? '' );
			if ( '' === $id ) {
				continue;
			}
			if ( isset( $by_id[ $id ] ) ) {
				continue; // Keep an administrator's later change to an imported global.
			}
			$current[] = $entry;
			++$added;
		}
		$settings[ $setting ] = array_values( $current );
	}
	update_post_meta( $kit_id, '_elementor_page_settings', $settings );
	delete_post_meta( $kit_id, '_elementor_css' );
	return "kit: {$added} Main Website colours/fonts added";
}

function save_elementor_document( int $post_id, array $item, array $map ): void {
	$data = resolve_placeholders( (array) ( $item['elementor_data'] ?? array() ), $map );
	update_post_meta( $post_id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $post_id, '_elementor_data', wp_slash( (string) wp_json_encode( $data ) ) );
	update_post_meta( $post_id, '_elementor_version', defined( 'ELEMENTOR_VERSION' ) ? ELEMENTOR_VERSION : '3.0.0' );
	if ( ! empty( $item['elementor_template_type'] ) ) {
		update_post_meta( $post_id, '_elementor_template_type', sanitize_key( (string) $item['elementor_template_type'] ) );
	}
	$page_settings = resolve_placeholders( (array) ( $item['page_settings'] ?? array() ), $map );
	if ( $page_settings ) {
		update_post_meta( $post_id, '_elementor_page_settings', $page_settings );
	}
	delete_post_meta( $post_id, '_elementor_css' );
	delete_post_meta( $post_id, '_elementor_element_cache' );
}

function import_template_item( array $item, array &$state ): string {
	$key       = sanitize_key( (string) ( $item['key'] ?? '' ) );
	$post_type = in_array( $item['post_type'] ?? '', array( 'elementor_library', 'elementor-hf' ), true ) ? $item['post_type'] : 'elementor_library';
	$existing  = post_by_source( 'template:' . $key, $post_type );
	$postarr   = array(
		'post_type'   => $post_type,
		'post_title'  => sanitize_text_field( (string) ( $item['title'] ?? $key ) ),
		'post_status' => 'publish',
	);
	if ( $existing ) {
		$postarr['ID'] = $existing;
	}
	$id = $existing ? wp_update_post( $postarr, true ) : wp_insert_post( $postarr, true );
	if ( is_wp_error( $id ) ) {
		return "template {$key}: " . $id->get_error_message();
	}
	$id = (int) $id;
	update_post_meta( $id, META_SOURCE, 'template:' . $key );
	if ( ! $existing ) {
		update_post_meta( $id, META_IMPORT_BATCH, $state['batch'] );
	}
	$state['map']['templates'][ $key ] = $id;
	if ( 'elementor_library' === $post_type ) {
		$type = sanitize_key( (string) ( $item['elementor_template_type'] ?? 'section' ) );
		wp_set_object_terms( $id, $type, 'elementor_library_type' );
	} else {
		update_post_meta( $id, 'ehf_template_type', sanitize_key( (string) ( $item['hfe_type'] ?? 'type_header' ) ) );
		update_post_meta( $id, 'ehf_target_include_locations', array( 'rule' => array( 'basic-global' ), 'specific' => array() ) );
		update_post_meta( $id, 'ehf_target_exclude_locations', array() );
		update_post_meta( $id, 'ehf_target_user_roles', array( '' ) );
	}
	set_publish_target( $id, sanitize_publish_target( (string) ( $item['target'] ?? TARGET_MAIN ) ) );
	save_elementor_document( $id, $item, $state['map'] );
	if ( ! empty( $item['popup_display'] ) && is_array( $item['popup_display'] ) ) {
		// Elementor Pro popup triggers, e.g. "On page load after 90 seconds":
		// array( 'triggers' => array( 'page_load' => 'yes', 'page_load_delay' => 90 ) ).
		update_post_meta( $id, '_elementor_popup_display_settings', $item['popup_display'] );
	}
	if ( ! empty( $item['conditions'] ) && is_array( $item['conditions'] ) ) {
		// Display conditions may name records imported later in this bundle: applied when it finishes.
		$state['pending_conditions'][ $id ] = array_values( array_map( 'strval', $item['conditions'] ) );
	}
	return "template {$key}: " . ( $existing ? 'updated' : 'created' ) . " (#{$id})";
}

/**
 * Elementor Pro display conditions of imported templates ("include/singular/page/acv-record://…"),
 * resolved now that every record exists. Pro keeps a cache of all conditions; it is rebuilt.
 */
function apply_pending_conditions( array &$state ): string {
	$done = 0;
	foreach ( (array) ( $state['pending_conditions'] ?? array() ) as $template_id => $conditions ) {
		$resolved = array();
		foreach ( (array) $conditions as $condition ) {
			// acv-record-id://<record key> -> that record's post ID.
			$condition = (string) preg_replace_callback(
				'#acv-record-id://([a-z0-9_-]+)#',
				static fn( $m ) => (string) post_by_source( 'record:' . $m[1] ),
				$condition
			);
			if ( preg_match( '#^(include|exclude)/[a-z_/]+(?:/[1-9]\d*)?$#', $condition ) ) {
				$resolved[] = $condition;
			}
		}
		update_post_meta( (int) $template_id, '_elementor_conditions', $resolved );
		++$done;
	}
	unset( $state['pending_conditions'] );
	if ( $done && class_exists( '\ElementorPro\Modules\ThemeBuilder\Module' ) ) {
		\ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager()->get_cache()->regenerate();
	}
	return $done ? "display conditions set on {$done} template(s)" : '';
}

function import_settings_item( array $item, array &$state ): string {
	$designs = array();
	foreach ( (array) ( $item['design_templates'] ?? array() ) as $type => $template_key ) {
		$id = (int) resolve_placeholders( 'acv-template://' . sanitize_key( (string) $template_key ), $state['map'] );
		if ( $id && in_array( $type, DESIGN_TYPES, true ) ) {
			$designs[ $type ] = $id;
		}
	}
	if ( $designs ) {
		update_option( DESIGN_TEMPLATES_OPTION, array_merge( (array) get_option( DESIGN_TEMPLATES_OPTION, array() ), $designs ), false );
	}
	if ( isset( $item['main_css'] ) ) {
		update_option( MAIN_CSS_OPTION, merge_main_css( (string) get_option( MAIN_CSS_OPTION, '' ), wp_strip_all_tags( (string) $item['main_css'] ) ), false );
	}
	return 'settings: ' . count( $designs ) . ' content-type designs' . ( isset( $item['main_css'] ) ? ', Main Website CSS' : '' );
}

/**
 * Main Website CSS from a bundle. Parts that belong to one family are marked
 * "/* acv:NAME *\/ … /* acv:end *\/" (e.g. the blog article typography, only in the blogs bundle);
 * a marked part already saved that the incoming bundle does not carry is kept, so importing the
 * bundles in any order leaves every family styled. The rest is replaced by the incoming CSS.
 */
function merge_main_css( string $existing, string $incoming ): string {
	$pattern = '#/\* acv:([a-z0-9-]+) \*/.*?/\* acv:end \*/#s';
	preg_match_all( $pattern, $incoming, $in );
	$present = array_flip( $in[1] );
	preg_match_all( $pattern, $existing, $old, PREG_SET_ORDER );
	foreach ( $old as $block ) {
		if ( ! isset( $present[ $block[1] ] ) ) {
			$incoming .= "\n" . $block[0];
			$present[ $block[1] ] = true;
		}
	}
	return $incoming;
}

function import_record_item( array $item, array &$state ): string {
	$key       = sanitize_key( (string) ( $item['key'] ?? '' ) );
	$post_type = sanitize_key( (string) ( $item['post_type'] ?? 'page' ) );
	if ( '' === $key || ! post_type_exists( $post_type ) ) {
		return "skipped record {$key} ({$post_type})";
	}
	$copies   = posts_by_source( 'record:' . $key, $post_type );
	$existing = $copies ? array_shift( $copies ) : 0;
	// Imports that overlapped (before the import lock) could create a record twice: the first is
	// kept, the others go to the Trash (each copy's own published page goes with it).
	foreach ( $copies as $copy ) {
		wp_trash_post( $copy );
	}
	$postarr  = array(
		'post_type'    => $post_type,
		'post_title'   => wp_strip_all_tags( (string) ( $item['title'] ?? $key ) ),
		'post_name'    => sanitize_title( (string) ( $item['slug'] ?? $key ) ),
		'post_status'  => in_array( $item['status'] ?? '', array( 'publish', 'draft' ), true ) ? $item['status'] : 'publish',
		'post_content' => (string) resolve_placeholders( (string) ( $item['content'] ?? '' ), $state['map'] ),
		'post_excerpt' => sanitize_textarea_field( (string) ( $item['excerpt'] ?? '' ) ),
		'menu_order'   => (int) ( $item['order'] ?? 0 ),
	);
	if ( ! empty( $item['date'] ) ) {
		$postarr['post_date']     = get_date_from_gmt( gmdate( 'Y-m-d H:i:s', (int) strtotime( (string) $item['date'] ) ) );
		$postarr['post_date_gmt'] = gmdate( 'Y-m-d H:i:s', (int) strtotime( (string) $item['date'] ) );
	}
	if ( $existing ) {
		$postarr['ID'] = $existing;
	}
	// Set the address and target before the first save, so the very first render uses them.
	$id = $existing ? wp_update_post( wp_slash( $postarr ), true ) : wp_insert_post( wp_slash( $postarr ), true );
	if ( is_wp_error( $id ) ) {
		return "record {$key}: " . $id->get_error_message();
	}
	$id = (int) $id;
	update_post_meta( $id, META_SOURCE, 'record:' . $key );
	if ( ! $existing ) {
		update_post_meta( $id, META_IMPORT_BATCH, $state['batch'] );
	}
	set_publish_target( $id, sanitize_publish_target( (string) ( $item['target'] ?? TARGET_MAIN ) ) );
	if ( ! empty( $item['main_path'] ) && '' !== normalize_main_path( (string) $item['main_path'] ) ) {
		update_post_meta( $id, META_MAIN_PATH, normalize_main_path( (string) $item['main_path'] ) );
		$state['map']['paths'][ $key ] = normalize_main_path( (string) $item['main_path'] );
	}
	if ( ! empty( $item['replace'] ) ) {
		update_post_meta( $id, META_MAIN_REPLACE, '1' );
	}
	if ( ! empty( $item['homepage'] ) && 'page' === $post_type ) {
		update_post_meta( $id, META_MAIN_HOMEPAGE, '1' );
	}
	foreach ( (array) ( $item['meta'] ?? array() ) as $meta_key => $meta_value ) {
		$meta_key = sanitize_key( (string) $meta_key );
		if ( 0 === strpos( $meta_key, '_acv_' ) || 0 === strpos( $meta_key, 'rank_math_' ) ) {
			update_post_meta( $id, $meta_key, is_array( $meta_value ) ? $meta_value : (string) resolve_placeholders( (string) $meta_value, $state['map'] ) );
		}
	}
	if ( ! empty( $item['featured_media'] ) ) {
		$media_id = (int) ( $state['map']['media'][ sanitize_key( (string) $item['featured_media'] ) ]['id'] ?? 0 );
		if ( $media_id ) {
			set_post_thumbnail( $id, $media_id );
		}
	}
	foreach ( (array) ( $item['terms'] ?? array() ) as $taxonomy => $names ) {
		if ( taxonomy_exists( (string) $taxonomy ) ) {
			wp_set_object_terms( $id, array_map( 'strval', (array) $names ), (string) $taxonomy );
		}
	}
	apply_seo( $id, (array) ( $item['seo'] ?? array() ), $state['map'] );
	if ( ! empty( $item['elementor_data'] ) ) {
		save_elementor_document( $id, $item, $state['map'] );
		update_post_meta( $id, '_wp_page_template', sanitize_text_field( (string) ( $item['page_template'] ?? 'elementor_header_footer' ) ) );
	}
	// The Main Website's read time belongs to the text imported now (see reading_minutes()); set
	// before the last save so the render it queues already shows it.
	if ( isset( $item['meta']['_acv_reading_minutes'] ) ) {
		update_post_meta( $id, '_acv_reading_minutes_for', md5( (string) get_post_field( 'post_content', $id, 'raw' ) ) );
	}
	// One more save so the Render Bridge publishes the final state (with design, address, SEO).
	wp_update_post( array( 'ID' => $id ) );
	return "record {$post_type} {$key}: " . ( $existing ? 'updated' : 'created' ) . " (#{$id}" . ( isset( $state['map']['paths'][ $key ] ) ? ' -> ' . $state['map']['paths'][ $key ] : '' ) . ')'
		. ( $copies ? '; duplicate moved to the Trash: #' . implode( ', #', $copies ) : '' );
}

/**
 * SEO from the Main Website, stored where Rank Math (this website's SEO plugin) reads it, so it is
 * edited in the normal Rank Math box. Structured data (JSON-LD) is kept as-is.
 */
function apply_seo( int $post_id, array $seo, array $map ): void {
	$fields = array(
		'title'               => 'rank_math_title',
		'description'         => 'rank_math_description',
		'canonical'           => 'rank_math_canonical_url',
		'focus_keyword'       => 'rank_math_focus_keyword',
		'og_title'            => 'rank_math_facebook_title',
		'og_description'      => 'rank_math_facebook_description',
		'og_image'            => 'rank_math_facebook_image',
		'twitter_title'       => 'rank_math_twitter_title',
		'twitter_description' => 'rank_math_twitter_description',
	);
	foreach ( $fields as $field => $meta_key ) {
		if ( isset( $seo[ $field ] ) && '' !== (string) $seo[ $field ] ) {
			update_post_meta( $post_id, $meta_key, sanitize_text_field( (string) resolve_placeholders( (string) $seo[ $field ], $map ) ) );
		}
	}
	// The share image as a Media Library item (Rank Math publishes og:image from it).
	$image_id = isset( $seo['og_image_id'] ) ? (int) resolve_placeholders( (string) $seo['og_image_id'], $map ) : 0;
	if ( $image_id > 0 ) {
		update_post_meta( $post_id, 'rank_math_facebook_image_id', $image_id );
		update_post_meta( $post_id, 'rank_math_facebook_image', (string) wp_get_attachment_url( $image_id ) );
		update_post_meta( $post_id, 'rank_math_twitter_use_facebook', 'on' );
	}
	if ( isset( $seo['noindex'] ) ) {
		update_post_meta( $post_id, 'rank_math_robots', $seo['noindex'] ? array( 'noindex', 'follow' ) : array( 'index', 'follow' ) );
	}
	if ( ! empty( $seo['json_ld'] ) ) {
		update_post_meta( $post_id, '_acv_json_ld', wp_slash( is_string( $seo['json_ld'] ) ? $seo['json_ld'] : (string) wp_json_encode( $seo['json_ld'] ) ) );
	}
}

/**
 * One import step at a time. The import screen retries a step after a connection problem while the
 * server may still be running it; two overlapping steps would both create the same new record.
 */
function acquire_import_lock(): bool {
	$now = time();
	if ( add_option( IMPORT_LOCK_OPTION, (string) $now, '', false ) ) {
		return true;
	}
	$held = (int) get_option( IMPORT_LOCK_OPTION, 0 );
	if ( $held > 0 && $now - $held < IMPORT_LOCK_TTL ) {
		return false;
	}
	// Left by a step that died (fatal error, killed process): steps never run this long.
	update_option( IMPORT_LOCK_OPTION, (string) $now, false );
	return true;
}

function run_import_step(): array {
	if ( ! acquire_import_lock() ) {
		$state = import_state();
		return array(
			'done'      => false,
			'busy'      => true,
			'step'      => IMPORT_STEPS[ (int) ( $state['step'] ?? 0 ) ] ?? 'done',
			'processed' => (int) ( $state['processed'] ?? 0 ),
			'total'     => (int) ( $state['total'] ?? 0 ),
			'log'       => array(),
		);
	}
	try {
		return run_import_batch();
	} finally {
		delete_option( IMPORT_LOCK_OPTION );
	}
}

function run_import_batch(): array {
	$state = import_state();
	if ( empty( $state['file'] ) || ! empty( $state['done'] ) ) {
		return array( 'done' => true, 'message' => __( 'Nothing to import.', 'acadvizen-cms' ) );
	}
	// An import (and every re-import) would otherwise add a full revision, Elementor data included,
	// of each of its hundreds of records; Undo import is the way back from an import.
	add_filter( 'wp_revisions_to_keep', '__return_zero' );
	$bundle  = load_bundle( $state );
	$started = time();
	$lines   = array(); // Every line of this step goes back to the import screen.
	wp_raise_memory_limit( 'admin' );
	if ( function_exists( 'set_time_limit' ) ) {
		set_time_limit( 120 ); // phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged
	}
	while ( time() - $started < IMPORT_TIME_BUDGET ) {
		$step  = IMPORT_STEPS[ (int) $state['step'] ] ?? null;
		if ( null === $step ) {
			$state['done'] = true;
			break;
		}
		$items = bundle_items( $bundle, $step );
		$index = (int) $state['index'];
		if ( $index >= count( $items ) ) {
			$state['step']  = (int) $state['step'] + 1;
			$state['index'] = 0;
			continue;
		}
		$item = $items[ $index ];
		try {
			switch ( $step ) {
				case 'media':
					$line = import_media_item( (array) $item, $state );
					break;
				case 'terms':
					$line = import_term_item( (array) $item, $state );
					break;
				case 'menus':
					$line = import_menu_item( (array) $item, $state );
					break;
				case 'kit':
					$line = import_kit_item( (array) $item, $state );
					break;
				case 'templates':
					$line = import_template_item( (array) $item, $state );
					break;
				case 'settings':
					$line = import_settings_item( (array) $item, $state );
					break;
				case 'records':
					$line = import_record_item( (array) $item, $state );
					break;
				default:
					$conditions = apply_pending_conditions( $state );
					flush_target_caches();
					queue_site_rerender( 'global' );
					$line = 'finished: every imported Main Website page is being published' . ( $conditions ? "; {$conditions}" : '' );
			}
		} catch ( \Throwable $e ) {
			$line = "{$step} #{$index}: error " . $e->getMessage();
		}
		import_log( $line );
		$lines[]        = gmdate( 'H:i:s' ) . '  ' . $line;
		$state['index'] = $index + 1;
		$state['processed'] = (int) ( $state['processed'] ?? 0 ) + 1;
	}
	save_import_state( $state );
	return array(
		'done'      => ! empty( $state['done'] ),
		'step'      => IMPORT_STEPS[ (int) $state['step'] ] ?? 'done',
		'processed' => (int) ( $state['processed'] ?? 0 ),
		'total'     => (int) ( $state['total'] ?? 0 ),
		'log'       => $lines,
	);
}

function bundle_total( array $bundle ): int {
	$total = 0;
	foreach ( IMPORT_STEPS as $step ) {
		$total += count( bundle_items( $bundle, $step ) );
	}
	return $total;
}

/** Deletes everything one import created (posts, media, menus, terms). Never touches other content. */
function undo_import( string $batch ): int {
	$deleted = 0;
	$ids     = get_posts(
		array(
			'post_type'        => 'any',
			'post_status'      => 'any',
			'fields'           => 'ids',
			'posts_per_page'   => -1,
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => META_IMPORT_BATCH, 'value' => $batch ) ), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		)
	);
	$attachments = get_posts( array( 'post_type' => 'attachment', 'post_status' => 'inherit', 'fields' => 'ids', 'posts_per_page' => -1, 'meta_key' => META_IMPORT_BATCH, 'meta_value' => $batch ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	foreach ( array_unique( array_merge( $ids, $attachments ) ) as $id ) {
		$deleted += ( 'attachment' === get_post_type( $id ) ? wp_delete_attachment( (int) $id, true ) : wp_delete_post( (int) $id, true ) ) ? 1 : 0;
	}
	foreach ( get_terms( array( 'hide_empty' => false, 'meta_key' => META_IMPORT_BATCH, 'meta_value' => $batch, 'taxonomy' => array( 'nav_menu', 'acv_city', 'acv_blog_category' ) ) ) as $term ) { // phpcs:ignore WordPress.DB.SlowDBQuery
		if ( 'nav_menu' === $term->taxonomy ) {
			wp_delete_nav_menu( $term->term_id );
		} else {
			wp_delete_term( $term->term_id, $term->taxonomy );
		}
		++$deleted;
	}
	return $deleted;
}

/* Admin screen ----------------------------------------------------------------------------------- */

function render_import_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$state  = import_state();
	$log    = (array) get_option( IMPORT_LOG_OPTION, array() );
	$notice = isset( $_GET['acv_notice'] ) ? sanitize_text_field( wp_unslash( $_GET['acv_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	?>
	<div class="wrap acv-cms-import">
		<h1><?php esc_html_e( 'Import Main Website', 'acadvizen-cms' ); ?></h1>
		<p><?php esc_html_e( 'Brings the existing www.acadvizen.com pages, designs, header, footer, menus, tools, blogs, courses and locations into WordPress, so they are edited here with Elementor. Importing again updates the same items; "Undo this import" removes everything it created.', 'acadvizen-cms' ); ?></p>
		<?php if ( '' !== $notice ) : ?>
			<div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
		<?php endif; ?>
		<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="acv_cms_import_upload" />
			<?php wp_nonce_field( 'acv_cms_import_upload' ); ?>
			<p><label><?php esc_html_e( 'Migration bundle (.json)', 'acadvizen-cms' ); ?> <input type="file" name="acv_bundle" accept=".json,application/json" required /></label>
			<?php submit_button( __( 'Upload bundle', 'acadvizen-cms' ), 'secondary', 'submit', false ); ?></p>
		</form>
		<?php if ( ! empty( $state['file'] ) ) : ?>
			<h2><?php esc_html_e( 'Current import', 'acadvizen-cms' ); ?></h2>
			<p id="acv-import-status">
				<?php
				echo esc_html(
					sprintf(
						/* translators: 1: bundle name, 2: items processed, 3: total items */
						__( 'Bundle %1$s: %2$d of %3$d items processed.', 'acadvizen-cms' ),
						(string) ( $state['name'] ?? '' ),
						(int) ( $state['processed'] ?? 0 ),
						(int) ( $state['total'] ?? 0 )
					)
				);
				echo ! empty( $state['done'] ) ? ' ' . esc_html__( 'Finished.', 'acadvizen-cms' ) : '';
				?>
			</p>
			<p>
				<button type="button" class="button button-primary" id="acv-import-start" <?php disabled( ! empty( $state['done'] ) ); ?>><?php echo empty( $state['processed'] ) ? esc_html__( 'Start import', 'acadvizen-cms' ) : esc_html__( 'Continue import', 'acadvizen-cms' ); ?></button>
			</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Delete everything this import created?', 'acadvizen-cms' ) ); ?>');">
				<input type="hidden" name="action" value="acv_cms_import_undo" />
				<?php wp_nonce_field( 'acv_cms_import_undo' ); ?>
				<?php submit_button( __( 'Undo this import', 'acadvizen-cms' ), 'delete', 'submit', false ); ?>
			</form>
		<?php endif; ?>
		<h2><?php esc_html_e( 'Log', 'acadvizen-cms' ); ?></h2>
		<pre id="acv-import-log" style="max-height:420px;overflow:auto;background:#fff;border:1px solid #ccd0d4;padding:8px"><?php echo esc_html( implode( "\n", array_slice( $log, -200 ) ) ); ?></pre>
	</div>
	<script>
	(function(){
		var btn = document.getElementById('acv-import-start');
		if (!btn) return;
		btn.addEventListener('click', function(){
			btn.disabled = true;
			var status = document.getElementById('acv-import-status'), log = document.getElementById('acv-import-log');
			var step = function(){
				var body = new FormData();
				body.append('action', 'acv_cms_import_step');
				body.append('_wpnonce', <?php echo wp_json_encode( wp_create_nonce( 'acv_cms_import_step' ) ); ?>);
				fetch(ajaxurl, { method: 'POST', body: body, credentials: 'same-origin' }).then(function(r){ return r.json(); }).then(function(j){
					var d = j && j.data ? j.data : {};
					status.textContent = 'Step: ' + d.step + ' — ' + d.processed + ' of ' + d.total + ' items processed.' + (d.done ? ' Finished.' : '');
					if (d.log) { log.textContent += '\n' + d.log.join('\n'); log.scrollTop = log.scrollHeight; }
					if (!d.done) { setTimeout(step, d.busy ? 3000 : 300); }
				}).catch(function(){ status.textContent += ' (connection problem — retrying)'; setTimeout(step, 5000); });
			};
			step();
		});
	})();
	</script>
	<?php
}

function handle_import_upload(): void {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acv_cms_import_upload' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$file = $_FILES['acv_bundle'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	$back = admin_url( 'admin.php?page=' . MENU_SLUG . '-import' );
	if ( ! is_array( $file ) || UPLOAD_ERR_OK !== (int) $file['error'] || ! is_uploaded_file( (string) $file['tmp_name'] ) ) {
		wp_safe_redirect( add_query_arg( 'acv_notice', rawurlencode( __( 'Upload failed.', 'acadvizen-cms' ) ), $back ) );
		exit;
	}
	$bundle = json_decode( (string) file_get_contents( (string) $file['tmp_name'] ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( ! is_array( $bundle ) || 'acadvizen-main-migration' !== ( $bundle['format'] ?? '' ) ) {
		wp_safe_redirect( add_query_arg( 'acv_notice', rawurlencode( __( 'This file is not an Acadvizen migration bundle.', 'acadvizen-cms' ) ), $back ) );
		exit;
	}
	$batch  = sanitize_key( (string) ( $bundle['batch'] ?? 'main-' . gmdate( 'YmdHis' ) ) );
	$target = import_dir() . '/' . $batch . '-' . wp_generate_password( 8, false ) . '.json';
	move_uploaded_file( (string) $file['tmp_name'], $target );
	$previous = import_state();
	save_import_state(
		array(
			'file'      => $target,
			'name'      => sanitize_text_field( (string) ( $bundle['name'] ?? $batch ) ),
			'batch'     => $batch,
			'step'      => 0,
			'index'     => 0,
			'processed' => 0,
			'total'     => bundle_total( $bundle ),
			'done'      => false,
			// Keep what earlier imports created, so references to them still resolve.
			'map'       => (array) ( $previous['map'] ?? array() ),
		)
	);
	import_log( "bundle uploaded: {$batch} (" . bundle_total( $bundle ) . ' items)' );
	wp_safe_redirect( add_query_arg( 'acv_notice', rawurlencode( __( 'Bundle uploaded. Click "Start import".', 'acadvizen-cms' ) ), $back ) );
	exit;
}

function handle_import_step(): void {
	if ( ! current_user_can( 'manage_options' ) || ! check_ajax_referer( 'acv_cms_import_step', '_wpnonce', false ) ) {
		wp_send_json_error( array( 'message' => 'forbidden' ), 403 );
	}
	wp_send_json_success( run_import_step() );
}

function handle_import_undo(): void {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acv_cms_import_undo' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$state   = import_state();
	$deleted = undo_import( (string) ( $state['batch'] ?? '' ) );
	import_log( "undo: {$deleted} items deleted for " . ( $state['batch'] ?? '' ) );
	$state['done'] = true;
	save_import_state( $state );
	queue_site_rerender( 'global' );
	wp_safe_redirect( add_query_arg( 'acv_notice', rawurlencode( sprintf( /* translators: %d: items */ __( 'Undone: %d items deleted.', 'acadvizen-cms' ), $deleted ) ), admin_url( 'admin.php?page=' . MENU_SLUG . '-import' ) ) );
	exit;
}

<?php
/**
 * Designs for Main Website content. Elementor is the design source of truth:
 *
 * - Each content type (courses, locations, tools, blogs) has a design template: an Elementor
 *   template chosen in Master Admin > Website Design. It shows every record of that type that has
 *   no Elementor design of its own. Editing the template republishes every record that uses it.
 *   "Edit with Elementor" on a single record gives that record its own design instead.
 * - [acv_field], [acv_url], [acv_loop] and [acv_breadcrumbs] place record data and lists inside
 *   Elementor designs. They work in Heading, Text Editor, Button and Shortcode widgets and in
 *   link fields ([acv_url]).
 * - "Main Website CSS" is added to every page rendered for the Main Website, for effects that
 *   Elementor's controls do not offer.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const DESIGN_TEMPLATES_OPTION = 'acv_cms_design_templates';
const MAIN_CSS_OPTION         = 'acv_cms_main_css';
const DESIGN_TYPES            = array( 'acv_course', 'acv_location', 'acv_tool', 'acv_blog' );
const MAIN_ONLY_TYPES         = array( 'acv_tool', 'acv_blog' );

function design_type_labels(): array {
	return array(
		'acv_course'   => __( 'Courses', 'acadvizen-cms' ),
		'acv_location' => __( 'Locations & service pages', 'acadvizen-cms' ),
		'acv_tool'     => __( 'Tools', 'acadvizen-cms' ),
		'acv_blog'     => __( 'Main Blogs', 'acadvizen-cms' ),
	);
}

/** The published Elementor template that shows records of this type, or 0. */
function design_template_for( string $post_type ): int {
	$map = (array) get_option( DESIGN_TEMPLATES_OPTION, array() );
	$id  = (int) ( $map[ $post_type ] ?? 0 );
	return ( $id > 0 && 'elementor_library' === get_post_type( $id ) && 'publish' === get_post_status( $id ) ) ? $id : 0;
}

/** True when the record was designed in Elementor itself (its own design wins over the template). */
function has_own_elementor_design( int $post_id ): bool {
	$data = (string) get_post_meta( $post_id, '_elementor_data', true );
	return 'builder' === get_post_meta( $post_id, '_elementor_edit_mode', true ) && '' !== $data && '[]' !== $data;
}

function uses_design_template( \WP_Post $post ): bool {
	return in_array( $post->post_type, DESIGN_TYPES, true ) && ! has_own_elementor_design( $post->ID ) && design_template_for( $post->post_type ) > 0;
}

/**
 * the_content of a record without its own design: the type's design template, rendered by
 * Elementor with the record as the current post (so [acv_field] reads this record).
 */
function render_design_template_content( $content ) {
	static $rendering = false;
	$post = get_post();
	if ( $rendering || ! $post instanceof \WP_Post || ! is_singular() || (int) get_queried_object_id() !== (int) $post->ID || ! uses_design_template( $post ) ) {
		return $content;
	}
	if ( ! class_exists( '\\Elementor\\Plugin' ) ) {
		return $content;
	}
	$rendering = true;
	$html      = \Elementor\Plugin::instance()->frontend->get_builder_content_for_display( design_template_for( $post->post_type ), true );
	$rendering = false;
	return '' !== (string) $html ? run_acv_shortcodes_in_widget( (string) $html ) : $content;
}

/**
 * Records shown by a design (or their own Elementor design) use the full-width "Elementor Header
 * & Footer" layout: the website header and footer, and the design edge to edge (no theme title).
 */
function full_width_template_for_designed_records( $template ) {
	$post = get_queried_object();
	if ( ! is_singular() || ! $post instanceof \WP_Post || ! in_array( $post->post_type, DESIGN_TYPES, true ) ) {
		return $template;
	}
	if ( ! uses_design_template( $post ) && ! has_own_elementor_design( $post->ID ) ) {
		return $template;
	}
	$file = defined( 'ELEMENTOR_PATH' ) ? ELEMENTOR_PATH . 'modules/page-templates/templates/header-footer.php' : '';
	return ( '' !== $file && is_readable( $file ) ) ? $file : $template;
}

/* Fields -------------------------------------------------------------------------------------- */

/**
 * Field aliases per type: [acv_field name="website"] reads _acv_tool_url on a tool.
 */
function field_meta_key( string $post_type, string $name ): string {
	$name = sanitize_key( $name );
	if ( 0 === strpos( $name, '_acv_' ) ) {
		return $name;
	}
	$aliases = array(
		'acv_tool'     => array( 'website' => '_acv_tool_url', 'category' => '_acv_tool_category', 'brand_color' => '_acv_tool_brand_color' ),
		'acv_course'   => array( 'duration' => '_acv_course_duration', 'mode' => '_acv_course_mode', 'fee' => '_acv_course_fee', 'cta_label' => '_acv_course_cta_label', 'cta_url' => '_acv_course_cta_url' ),
		'acv_location' => array( 'address' => '_acv_location_address', 'phone' => '_acv_location_phone', 'map_url' => '_acv_location_map_url' ),
	);
	if ( isset( $aliases[ $post_type ][ $name ] ) ) {
		return $aliases[ $post_type ][ $name ];
	}
	return '_acv_' . preg_replace( '/^acv_/', '', $post_type ) . '_' . $name;
}

/** The Main Website URL of a record (or its WordPress URL when it is not on the Main Website). */
function record_main_url( \WP_Post $post ): string {
	$path = targets_main( get_publish_target( $post->ID ) ) ? main_path_for( $post ) : '';
	return '' !== $path ? $path : (string) get_permalink( $post );
}

/**
 * A record's main text, with its shortcodes run. Opening a design template in Elementor makes the
 * template itself the "record", and its own text contains [acv_field name="content"], so content
 * already being expanded is never expanded inside itself (that recursed until PHP crashed).
 */
function record_content( \WP_Post $post ): string {
	static $expanding = array();
	if ( 'elementor_library' === $post->post_type ) {
		return '<p><em>' . esc_html__( 'The content of each record appears here.', 'acadvizen-cms' ) . '</em></p>';
	}
	if ( isset( $expanding[ $post->ID ] ) ) {
		return '';
	}
	$expanding[ $post->ID ] = true;
	try {
		return add_heading_anchors( do_shortcode( wpautop( shortcode_unautop( (string) $post->post_content ) ) ) );
	} finally {
		unset( $expanding[ $post->ID ] );
	}
}

/**
 * Minutes to read an article. An imported article keeps the Main Website's own figure until its
 * text is edited here (the stored figure belongs to the text it was imported with).
 */
function reading_minutes( \WP_Post $post ): int {
	$imported = (int) get_post_meta( $post->ID, '_acv_reading_minutes', true );
	if ( $imported > 0 && get_post_meta( $post->ID, '_acv_reading_minutes_for', true ) === md5( (string) $post->post_content ) ) {
		return $imported;
	}
	return max( 1, (int) ceil( str_word_count( wp_strip_all_tags( (string) $post->post_content ) ) / 220 ) );
}

function field_value( \WP_Post $post, string $name, array $atts = array() ): string {
	switch ( $name ) {
		case 'title':
			return esc_html( get_the_title( $post ) );
		case 'url':
			return esc_url( record_main_url( $post ) );
		case 'slug':
			return esc_html( $post->post_name );
		case 'excerpt':
			return esc_html( has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_trim_words( wp_strip_all_tags( $post->post_content ), 30 ) );
		case 'content':
			return record_content( $post );
		case 'date':
			return esc_html( get_the_date( (string) ( $atts['format'] ?? '' ), $post ) );
		case 'modified':
			return esc_html( get_the_modified_date( (string) ( $atts['format'] ?? '' ), $post ) );
		case 'author':
			$author = (string) get_post_meta( $post->ID, META_AUTHOR_NAME, true );
			return esc_html( '' !== $author ? $author : get_the_author_meta( 'display_name', (int) $post->post_author ) );
		case 'image':
			return has_post_thumbnail( $post ) ? (string) get_the_post_thumbnail( $post, sanitize_key( (string) ( $atts['size'] ?? 'large' ) ), array( 'loading' => 'lazy' ) ) : '';
		case 'image_url':
			return has_post_thumbnail( $post ) ? esc_url( (string) get_the_post_thumbnail_url( $post, sanitize_key( (string) ( $atts['size'] ?? 'large' ) ) ) ) : '';
		case 'categories':
			$terms = get_the_terms( $post, POST_TYPE === $post->post_type ? 'acv_blog_category' : 'acv_city' );
			return is_array( $terms ) ? esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) ) : '';
		case 'reading_time':
			return esc_html( (string) reading_minutes( $post ) );
	}
	$value = get_post_meta( $post->ID, field_meta_key( $post->post_type, $name ), true );
	if ( is_array( $value ) ) {
		$value = implode( ', ', array_map( 'strval', $value ) );
	}
	return esc_html( (string) $value );
}

/** [acv_field name="title|url|excerpt|content|date|author|image|image_url|categories|<field>" fallback=""] */
function shortcode_field( $atts ): string {
	$atts = shortcode_atts( array( 'name' => 'title', 'fallback' => '', 'format' => '', 'size' => 'large', 'id' => 0 ), $atts, 'acv_field' );
	$post = $atts['id'] ? get_post( (int) $atts['id'] ) : get_post();
	if ( ! $post instanceof \WP_Post ) {
		return esc_html( (string) $atts['fallback'] );
	}
	$value = field_value( $post, sanitize_key( (string) $atts['name'] ), $atts );
	return '' !== $value ? $value : esc_html( (string) $atts['fallback'] );
}

/** [acv_url] — the current record's Main Website URL; usable inside link fields (no spaces). */
function shortcode_url(): string {
	$post = get_post();
	return $post instanceof \WP_Post ? esc_url( record_main_url( $post ) ) : '';
}

/**
 * Elementor escapes link and text settings and does not run shortcodes inside headings, buttons
 * or links; run ours (only ours) in the rendered widget so they work in any widget.
 */
function run_acv_shortcodes_in_widget( $content ) {
	if ( ! is_string( $content ) || ( false === strpos( $content, '[acv_' ) && false === strpos( $content, '#acv-field-' ) ) ) {
		return $content;
	}
	$content = (string) preg_replace_callback(
		'/\[acv_(?:field|url|loop|breadcrumbs|toc|lead_form)\b[^\]]*\]/',
		static fn( $m ) => do_shortcode( html_entity_decode( $m[0], ENT_QUOTES ) ),
		$content
	);
	// URL tokens for link and image fields, which Elementor escapes: href="#acv-field-website".
	return (string) preg_replace_callback(
		'/(["\'])[^"\']*#acv-field-([a-z0-9_]+)\1/',
		static function ( $m ) {
			return $m[1] . esc_url( field_url_value( sanitize_key( $m[2] ) ) ) . $m[1];
		},
		$content
	);
}

/** The URL behind a #acv-field-<name> token for the current record. */
function field_url_value( string $name ): string {
	$post = get_post();
	if ( ! $post instanceof \WP_Post ) {
		return '';
	}
	if ( 'image_url' === $name ) {
		return (string) get_the_post_thumbnail_url( $post, 'large' );
	}
	if ( 'url' === $name ) {
		return record_main_url( $post );
	}
	// Share links carry the record's full Main Website address.
	$shares = array(
		'share_linkedin' => 'https://www.linkedin.com/sharing/share-offsite/?url=%s',
		'share_x'        => 'https://twitter.com/intent/tweet?url=%s&text=%s',
		'share_whatsapp' => 'https://wa.me/?text=%2$s%%20%1$s',
		'share_facebook' => 'https://www.facebook.com/sharer/sharer.php?u=%s',
	);
	if ( isset( $shares[ $name ] ) ) {
		$path = targets_main( get_publish_target( $post->ID ) ) ? main_path_for( $post ) : '';
		$full = '' !== $path ? main_url_for_path( $path ) : (string) get_permalink( $post );
		return sprintf( $shares[ $name ], rawurlencode( $full ), rawurlencode( wp_strip_all_tags( get_the_title( $post ) ) ) );
	}
	return html_entity_decode( field_value( $post, $name ), ENT_QUOTES );
}

/** [acv_toc] — table of contents of the current record's headings (h2, h3), linked by anchor. */
function shortcode_toc(): string {
	$post = get_post();
	if ( ! $post instanceof \WP_Post || ! preg_match_all( '/<h([23])[^>]*>(.*?)<\/h\1>/is', (string) $post->post_content, $m, PREG_SET_ORDER ) ) {
		return '';
	}
	$items = '';
	foreach ( $m as $heading ) {
		$text   = wp_strip_all_tags( $heading[2] );
		$items .= '<li class="acv-toc__h' . esc_attr( $heading[1] ) . '"><a href="#' . esc_attr( sanitize_title( $text ) ) . '">' . esc_html( $text ) . '</a></li>';
	}
	return '<nav class="acv-toc"><ol>' . $items . '</ol></nav>';
}

/** Headings in record content get anchors so [acv_toc] links work. */
function add_heading_anchors( string $html ): string {
	return (string) preg_replace_callback(
		'/<h([23])(\s[^>]*)?>(.*?)<\/h\1>/is',
		static function ( $h ) {
			if ( false !== strpos( (string) ( $h[2] ?? '' ), ' id=' ) ) {
				return $h[0];
			}
			return '<h' . $h[1] . ( $h[2] ?? '' ) . ' id="' . esc_attr( sanitize_title( wp_strip_all_tags( $h[3] ) ) ) . '">' . $h[3] . '</h' . $h[1] . '>';
		},
		$html
	);
}

/* Lists ---------------------------------------------------------------------------------------- */

/**
 * [acv_loop type="acv_tool" template="123" limit="12" columns="3" columns_tablet="2"
 *  columns_mobile="1" gap="20" orderby="title" order="ASC" exclude_current="yes"
 *  same="category" link="no"]
 * Shows records of a type, each drawn with an Elementor template (a card designed in Elementor).
 */
function shortcode_loop( $atts ): string {
	$atts = shortcode_atts(
		array(
			'type'            => 'acv_tool',
			'template'        => 0,
			'limit'           => 12,
			'columns'         => 3,
			'columns_tablet'  => 2,
			'columns_mobile'  => 1,
			'gap'             => 20,
			'orderby'         => 'menu_order title',
			'order'           => 'ASC',
			'exclude_current' => 'yes',
			'same'            => '',
			'link'            => 'no',
			// Search box + category list above the grid, filtering in the browser.
			'filter'             => 'no',
			'filter_field'       => 'category',
			'filter_first'       => '',
			'filter_groups'      => '',
			'filter_placeholder' => __( 'Search…', 'acadvizen-cms' ),
			'filter_all'         => __( 'All Categories', 'acadvizen-cms' ),
			'filter_count'       => __( 'Showing %1$s of %2$s', 'acadvizen-cms' ),
			'filter_note'        => '', // A short line at the right of the count, e.g. a tip.
		),
		$atts,
		'acv_loop'
	);
	$type     = sanitize_key( (string) $atts['type'] );
	$template = (int) $atts['template'];
	if ( ! in_array( $type, array_merge( DESIGN_TYPES, array( 'acv_faq', 'acv_testimonial' ) ), true ) || $template <= 0 || ! class_exists( '\\Elementor\\Plugin' ) ) {
		return '';
	}
	$current = get_post();
	$args    = array(
		'post_type'           => $type,
		'post_status'         => 'publish',
		'posts_per_page'      => max( 1, min( 100, (int) $atts['limit'] ) ),
		'orderby'             => loop_orderby( (string) $atts['orderby'] ),
		'order'               => 'DESC' === strtoupper( (string) $atts['order'] ) ? 'DESC' : 'ASC',
		'ignore_sticky_posts' => true,
		'no_found_rows'       => true,
	);
	if ( $current instanceof \WP_Post && 'yes' === $atts['exclude_current'] ) {
		$args['post__not_in'] = array( $current->ID );
	}
	if ( '' !== $atts['same'] && $current instanceof \WP_Post ) {
		$key   = field_meta_key( $type, (string) $atts['same'] );
		$value = get_post_meta( $current->ID, $key, true );
		if ( '' !== (string) $value ) {
			$args['meta_query'] = array( array( 'key' => $key, 'value' => $value ) ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
		}
	}
	$query = new \WP_Query( $args );
	// exclude_current="after": the first `limit` records are taken and the record being viewed is
	// then left out of them, as the Main Website's related tools do (six of the same category,
	// minus the current one). "yes" leaves it out before counting.
	if ( $current instanceof \WP_Post && 'after' === $atts['exclude_current'] ) {
		$query->posts      = array_values( array_filter( $query->posts, static fn( $p ) => (int) $p->ID !== (int) $current->ID ) );
		$query->post_count = count( $query->posts );
	}
	if ( ! $query->have_posts() ) {
		return '';
	}
	$class = 'acv-loop-' . substr( md5( (string) wp_json_encode( $atts ) ), 0, 8 );
	$cols  = array( max( 1, (int) $atts['columns'] ), max( 1, (int) $atts['columns_tablet'] ), max( 1, (int) $atts['columns_mobile'] ) );
	$out   = sprintf(
		'<style>.%1$s{display:grid;gap:%2$dpx;grid-template-columns:repeat(%3$d,minmax(0,1fr))}@media(max-width:1024px){.%1$s{grid-template-columns:repeat(%4$d,minmax(0,1fr))}}@media(max-width:767px){.%1$s{grid-template-columns:repeat(%5$d,minmax(0,1fr))}}.%1$s>.acv-loop__item>a{display:block;color:inherit;text-decoration:none}.%1$s>.acv-loop__item>a,.%1$s>.acv-loop__item>.elementor,.%1$s>.acv-loop__item>a>.elementor,.%1$s>.acv-loop__item>.elementor>.e-con,.%1$s>.acv-loop__item>a>.elementor>.e-con{height:100%%}</style><div class="acv-loop %1$s">',
		esc_attr( $class ),
		max( 0, (int) $atts['gap'] ),
		$cols[0],
		$cols[1],
		$cols[2]
	);
	global $post;
	$saved      = $post;
	$filter     = shortcode_flag( $atts['filter'] );
	$filter_key = field_meta_key( $type, (string) $atts['filter_field'] );
	$categories = array();
	$items      = '';
	while ( $query->have_posts() ) {
		$query->the_post();
		$card = run_acv_shortcodes_in_widget( (string) \Elementor\Plugin::instance()->frontend->get_builder_content_for_display( $template, true ) );
		$data = '';
		if ( $filter ) {
			$category     = (string) get_post_meta( get_the_ID(), $filter_key, true );
			$categories[] = $category;
			$data         = ' data-acv-cat="' . esc_attr( $category ) . '" data-acv-text="' . esc_attr( strtolower( get_the_title() . ' ' . wp_strip_all_tags( get_the_excerpt() ) ) ) . '"';
		}
		$items .= '<div class="acv-loop__item"' . $data . '>' . ( 'yes' === $atts['link'] ? '<a href="' . esc_url( record_main_url( get_post() ) ) . '">' . $card . '</a>' : $card ) . '</div>';
	}
	$post = $saved; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	wp_reset_postdata();
	$before = $filter ? loop_filter_html( $class, $atts, $categories, $query->post_count ) : '';
	return $before . $out . $items . '</div>';
}

/** "date:DESC title:ASC" -> array( 'date' => 'DESC', 'title' => 'ASC' ); plain values are kept. */
function loop_orderby( string $orderby ) {
	if ( false === strpos( $orderby, ':' ) ) {
		return sanitize_text_field( $orderby );
	}
	$out = array();
	foreach ( preg_split( '/[\s,]+/', trim( $orderby ) ) as $part ) {
		list( $key, $dir ) = array_pad( explode( ':', $part, 2 ), 2, 'ASC' );
		$key = sanitize_key( $key );
		if ( '' !== $key ) {
			$out[ $key ] = 'DESC' === strtoupper( $dir ) ? 'DESC' : 'ASC';
		}
	}
	return $out;
}

const LOOP_FILTER_SCRIPT = <<<'JS'
(function(){if(window.acvLoopFilter)return;window.acvLoopFilter=1;
function run(box){var grid=document.querySelector('.'+box.dataset.for);if(!grid)return;var q=box.querySelector('input'),s=box.querySelector('select'),n=box.querySelector('.acv-loop-filter__shown');
var items=[].slice.call(grid.children);var apply=function(){var t=(q.value||'').trim().toLowerCase(),v=s.value,shown=0;
items.forEach(function(it){var c=it.getAttribute('data-acv-cat')||'',ok=(!t||(it.getAttribute('data-acv-text')||'').indexOf(t)>-1)&&(v===''||(v.charAt(0)==='!'?c!==v.slice(1):c===v));it.style.display=ok?'':'none';if(ok)shown++});if(n)n.textContent=shown};
q.addEventListener('input',apply);s.addEventListener('change',apply)}
var init=function(){[].forEach.call(document.querySelectorAll('.acv-loop-filter[data-for]'),run)};document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init()})();
JS;

// The theme sizes every form field (select width:100%, a fixed height), which would squeeze the
// search box beside the category list: both are sized here explicitly.
const LOOP_FILTER_CSS = '.acv-loop-filter{margin:0 0 24px;padding:20px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.03)}.acv-loop-filter__row{display:flex;gap:16px}.acv-loop-filter input,.acv-loop-filter select{font:inherit;font-size:14px;line-height:20px;height:auto;color:#e2e8f0;background-color:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;margin:0;box-shadow:none}.acv-loop-filter input{flex:1 1 auto;width:auto;min-width:0;padding-left:40px;padding-right:40px}.acv-loop-filter select{flex:0 0 auto;width:auto;padding-right:40px}.acv-loop-filter input::placeholder{color:#64748b}.acv-loop-filter select option{color:#0f172a}.acv-loop-filter__meta{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;margin:12px 0 0;font-size:12px;color:#94a3b8}.acv-loop-filter__meta p{margin:0}.acv-loop-filter__count strong{color:#e2e8f0}@media(max-width:767px){.acv-loop-filter__row{flex-direction:column}}';

/**
 * The search box and category list of [acv_loop filter="yes"]. filter_first lists categories to
 * show first; filter_groups adds grouped choices, "Label=Value" or "Label=!Value" (everything else).
 */
function loop_filter_html( string $grid_class, array $atts, array $categories, int $total ): string {
	static $assets = false;
	$options = array( '' => (string) $atts['filter_all'] );
	foreach ( array_filter( array_map( 'trim', explode( ',', (string) $atts['filter_first'] ) ) ) as $first ) {
		$options[ $first ] = $first;
	}
	foreach ( array_filter( array_map( 'trim', explode( ',', (string) $atts['filter_groups'] ) ) ) as $group ) {
		list( $label, $value ) = array_pad( explode( '=', $group, 2 ), 2, '' );
		if ( '' !== trim( $label ) && '' !== trim( $value ) ) {
			$options[ trim( $value ) ] = trim( $label );
		}
	}
	foreach ( array_unique( array_filter( $categories, 'strlen' ) ) as $category ) {
		$options[ $category ] = $options[ $category ] ?? $category;
	}
	$select = '';
	foreach ( $options as $value => $label ) {
		$select .= '<option value="' . esc_attr( (string) $value ) . '">' . esc_html( (string) $label ) . '</option>';
	}
	$count = sprintf( esc_html( (string) $atts['filter_count'] ), '<strong class="acv-loop-filter__shown">' . (int) $total . '</strong>', '<strong>' . (int) $total . '</strong>' );
	$out   = '<div class="acv-loop-filter" data-for="' . esc_attr( $grid_class ) . '"><div class="acv-loop-filter__row">'
		. '<input type="search" placeholder="' . esc_attr( (string) $atts['filter_placeholder'] ) . '" aria-label="' . esc_attr( (string) $atts['filter_placeholder'] ) . '" />'
		. '<select aria-label="' . esc_attr( (string) $atts['filter_all'] ) . '">' . $select . '</select></div>'
		. '<div class="acv-loop-filter__meta"><p class="acv-loop-filter__count">' . $count . '</p>'
		. ( '' !== (string) ( $atts['filter_note'] ?? '' ) ? '<p class="acv-loop-filter__note">' . esc_html( (string) $atts['filter_note'] ) . '</p>' : '' )
		. '</div></div>';
	if ( ! $assets ) {
		$assets = true;
		$out   .= '<style>' . LOOP_FILTER_CSS . '</style><script>' . LOOP_FILTER_SCRIPT . '</script>';
	}
	return $out;
}

/** [acv_breadcrumbs] — Home › section › current record, with Main Website addresses. */
function shortcode_breadcrumbs(): string {
	$post = get_post();
	if ( ! $post instanceof \WP_Post ) {
		return '';
	}
	$sections = array(
		'acv_tool'   => array( __( 'Tools', 'acadvizen-cms' ), '/tools' ),
		'acv_blog'   => array( __( 'Blog', 'acadvizen-cms' ), '/blog' ),
		'acv_course' => array( __( 'Courses', 'acadvizen-cms' ), '/courses' ),
	);
	$items = array( '<a href="/">' . esc_html__( 'Home', 'acadvizen-cms' ) . '</a>' );
	if ( isset( $sections[ $post->post_type ] ) ) {
		$items[] = '<a href="' . esc_url( $sections[ $post->post_type ][1] ) . '">' . esc_html( $sections[ $post->post_type ][0] ) . '</a>';
	}
	$items[] = '<span aria-current="page">' . esc_html( get_the_title( $post ) ) . '</span>';
	return '<nav class="acv-breadcrumbs" aria-label="' . esc_attr__( 'Breadcrumb', 'acadvizen-cms' ) . '">' . implode( '<span class="acv-breadcrumbs__sep" aria-hidden="true">&#8250;</span>', $items ) . '</nav>';
}

/*
 * [acv_lead_form] — the Main Website's lead form. It sends the same request as the Main Website's
 * own form (POST /api/cms/leads on the Main Website), so enquiries keep arriving in Main Admin >
 * Leads. Attributes: form_type, page_slug (default: this page's address), source, message="yes"
 * for a message box, submit, success, name_label, email_label, phone_label, message_label,
 * modes="online:Online,classroom:Classroom" (sent as learning_mode), consent="<checkbox text>"
 * (must be ticked), require_all="yes" (name, email and phone all required).
 */
const LEAD_FORM_SCRIPT = <<<'JS'
(function(){if(window.acvLeadForms)return;window.acvLeadForms=1;
document.addEventListener('submit',function(e){var f=e.target;if(!f||!f.matches||!f.matches('form.acv-lead-form'))return;e.preventDefault();
var s=f.querySelector('.acv-lead-form__status'),b=f.querySelector('button[type=submit]'),v=function(n){var i=f.elements[n];return i?String(i.value||'').trim():''};
var say=function(k,t){s.textContent=t;s.className='acv-lead-form__status is-'+k};
if(f.dataset.requireAll==='1'?(!v('full_name')||!v('email')||!v('phone')):(!v('full_name')&&!v('email')&&!v('phone'))){say('error',f.dataset.requireAll==='1'?'Please complete all required fields.':'Please add at least name, email, or phone.');return}
if(f.elements.consent&&!f.elements.consent.checked){say('error','Please accept the Privacy Policy consent.');return}
var label=b.textContent;b.disabled=true;b.textContent='Submitting...';say('','');
var body={full_name:v('full_name'),email:v('email'),phone:v('phone'),page_slug:f.dataset.pageSlug||'',source:f.dataset.source||'website',form_type:f.dataset.formType||'inquiry'},p={};
if(f.elements.message)p.message=v('message');if(f.elements.experience_level)p.experience_level=v('experience_level');if(f.elements.learning_mode)p.learning_mode=f.elements.learning_mode.value;if(f.elements.consent)p.consent=true;
if(Object.keys(p).length)body.payload=p;
fetch('/api/cms/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json().catch(function(){return{}})}).then(function(j){
if(!j||!j.success)throw new Error(j&&j.error||'Unable to submit right now. Please try again.');f.reset();say('success',f.dataset.success);
if(typeof window.fbq==='function'){try{window.fbq('track','Lead',{content_name:'Lead Capture Card',form_type:body.form_type,page_slug:body.page_slug})}catch(x){}}
}).catch(function(x){say('error',x.message||'Unable to submit right now. Please try again.')}).then(function(){b.disabled=false;b.textContent=label})});})();
JS;

const LEAD_FORM_CSS = '.acv-lead-form{display:grid;gap:12px;grid-template-columns:1fr 1fr}.acv-lead-form input,.acv-lead-form textarea{font:inherit;font-size:14px;color:#f1f5f9;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 12px;width:100%;box-sizing:border-box}.acv-lead-form input::placeholder,.acv-lead-form textarea::placeholder{color:#64748b}.acv-lead-form .acv-lead-form__wide{grid-column:1/-1}.acv-lead-form button{grid-column:1/-1;font:inherit;font-size:14px;font-weight:600;color:#020617;background:#5eead4;border:0;border-radius:999px;padding:12px 24px;cursor:pointer}.acv-lead-form button:hover{background:#99f6e4}.acv-lead-form button:disabled{opacity:.6}.acv-lead-form__status{grid-column:1/-1;margin:0;text-align:center;font-size:14px}.acv-lead-form__status.is-error{color:#fda4af}.acv-lead-form__status.is-success{color:#6ee7b7}.acv-lead-form__modes{display:flex;gap:8px}.acv-lead-form__modes label{flex:1;cursor:pointer}.acv-lead-form__modes input{position:absolute;opacity:0;width:1px;height:1px}.acv-lead-form__modes span{display:block;text-align:center;font-size:14px;border:1px solid #20415f;background:#0b2036;color:#cbd5e1;border-radius:12px;padding:10px 12px}.acv-lead-form__modes input:checked+span{border-color:#5eead4;background:rgba(94,234,212,.2);color:#ccfbf1}.acv-lead-form__modes input:focus-visible+span{outline:2px solid #5eead4}.acv-lead-form__consent{display:flex;gap:12px;align-items:flex-start;font-size:12px;color:#cbd5e1}.acv-lead-form__consent input{width:16px;height:16px;margin-top:2px;flex:none}.acv-lead-form__field{display:grid;gap:8px;align-content:start;font-size:14px;font-weight:500;color:#e2e8f0}.acv-lead-form select{font:inherit;font-size:14px;line-height:20px;height:auto;color:#f1f5f9;background-color:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;width:100%;margin:0;box-sizing:border-box}.acv-lead-form select option{color:#0f172a}.acv-lead-form__field input,.acv-lead-form__field textarea,.acv-lead-form__field select{padding:12px 16px;font-weight:400;line-height:20px;height:auto;margin:0}.acv-lead-form.acv-lead-form--labels{gap:24px}.acv-lead-form--labels button{border-radius:12px}@media(max-width:639px){.acv-lead-form{grid-template-columns:1fr}}';

function shortcode_lead_form( $atts ): string {
	static $assets_printed = false;
	$post = get_post();
	$path = $post instanceof \WP_Post ? main_path_for( $post ) : '';
	// Same page_slug as the Main Website's forms: "courses/<slug>" for courses, else the address.
	if ( $post instanceof \WP_Post && 'acv_course' === $post->post_type ) {
		$path = ltrim( $path, '/' );
	}
	$a = shortcode_atts(
		array(
			'form_type'     => 'inquiry',
			'page_slug'     => $path,
			'source'        => 'website',
			'message'       => 'no',
			'submit'        => __( 'Request a Callback', 'acadvizen-cms' ),
			'success'       => __( 'Thanks - our admissions team will reach out shortly.', 'acadvizen-cms' ),
			'name_label'    => __( 'Your name', 'acadvizen-cms' ),
			'email_label'   => __( 'Email', 'acadvizen-cms' ),
			'phone_label'   => __( 'Phone number', 'acadvizen-cms' ),
			'message_label' => __( 'How can we help you?', 'acadvizen-cms' ),
			'modes'         => '',
			'consent'       => '',
			'require_all'   => 'no',
			// labels="above": each field's label shown above it, as the Main Website's contact form;
			// fields: the order of name, email, phone, experience and message, "a+b" for two side by side.
			'labels'        => '',
			'fields'        => 'name,email,phone,message',
			// The "Fresher / Experienced" choice (fields="…,experience,…"), sent as experience_level.
			'experience_label'   => __( 'Fresher / Experienced', 'acadvizen-cms' ),
			'experience_options' => __( 'Fresher,Experienced', 'acadvizen-cms' ),
		),
		$atts,
		'acv_lead_form'
	);
	// modes="online:Online,classroom:Classroom" -> one choice sent as payload.learning_mode.
	$modes = '';
	foreach ( array_filter( array_map( 'trim', explode( ',', (string) $a['modes'] ) ) ) as $i => $pair ) {
		list( $value, $text ) = array_pad( array_map( 'trim', explode( ':', $pair, 2 ) ), 2, '' );
		$modes .= '<label><input type="radio" name="learning_mode" value="' . esc_attr( sanitize_key( $value ) ) . '"' . ( 0 === $i ? ' checked' : '' ) . ' /><span>' . esc_html( '' !== $text ? $text : $value ) . '</span></label>';
	}
	$out = '<form class="acv-lead-form' . ( 'above' === $a['labels'] ? ' acv-lead-form--labels' : '' ) . '" novalidate data-form-type="' . esc_attr( $a['form_type'] ) . '" data-page-slug="' . esc_attr( $a['page_slug'] ) . '" data-source="' . esc_attr( $a['source'] ) . '" data-success="' . esc_attr( $a['success'] ) . '"' . ( shortcode_flag( $a['require_all'] ) ? ' data-require-all="1"' : '' ) . '>'
		. lead_form_fields( $a )
		. ( '' !== $modes ? '<div class="acv-lead-form__modes acv-lead-form__wide" role="radiogroup">' . $modes . '</div>' : '' )
		. ( '' !== trim( (string) $a['consent'] ) ? '<label class="acv-lead-form__consent acv-lead-form__wide"><input type="checkbox" name="consent" value="1" /><span>' . esc_html( $a['consent'] ) . '</span></label>' : '' )
		. '<button type="submit">' . esc_html( $a['submit'] ) . '</button>'
		. '<p class="acv-lead-form__status" role="status" aria-live="polite"></p></form>';
	if ( ! $assets_printed ) {
		$assets_printed = true;
		$out           .= '<style id="acv-lead-form-css">' . LEAD_FORM_CSS . '</style><script id="acv-lead-form-js">' . LEAD_FORM_SCRIPT . '</script>';
	}
	return $out;
}

/**
 * The name, email, phone, experience and (when asked for) message fields, in the order of
 * fields="…" ("phone+email": two side by side); with labels="above" each label is above its field.
 */
function lead_form_fields( array $a ): string {
	$above   = 'above' === $a['labels'];
	$options = '';
	foreach ( array_filter( array_map( 'trim', explode( ',', (string) $a['experience_options'] ) ), 'strlen' ) as $option ) {
		$options .= '<option value="' . esc_attr( $option ) . '">' . esc_html( $option ) . '</option>';
	}
	$html = array(
		'name'       => array( 'name_label', '<input name="full_name" autocomplete="name"%s />', false ),
		'email'      => array( 'email_label', '<input name="email" type="email" autocomplete="email"%s />', false ),
		'phone'      => array( 'phone_label', '<input name="phone" type="tel" autocomplete="tel"%s />', true ),
		'experience' => array( 'experience_label', '<select name="experience_level"%s>' . $options . '</select>', true ),
		'message'    => array( 'message_label', '<textarea name="message" rows="' . ( $above ? 6 : 4 ) . '"%s></textarea>', true ),
	);
	$out  = '';
	$seen = array();
	foreach ( array_map( 'trim', explode( ',', (string) $a['fields'] ) ) as $group ) {
		$keys = array_values( array_filter( array_map( 'trim', explode( '+', $group ) ), static function ( $key ) use ( $html, $a, $seen ) {
			return isset( $html[ $key ] ) && ! isset( $seen[ $key ] ) && ( 'message' !== $key || shortcode_flag( $a['message'] ) );
		} ) );
		foreach ( $keys as $key ) {
			$seen[ $key ] = true;
			list( $label_key, $tag, $wide ) = $html[ $key ];
			// Side by side: each half of the row; alone: as the field's own width rule says.
			$wide  = 1 === count( $keys ) && ( $above || $wide );
			$label = (string) $a[ $label_key ];
			if ( $above ) {
				$out .= '<label class="acv-lead-form__field' . ( $wide ? ' acv-lead-form__wide' : '' ) . '"><span>' . esc_html( $label ) . '</span>' . sprintf( $tag, '' ) . '</label>';
			} elseif ( 'experience' === $key ) {
				$out .= sprintf( $tag, ( $wide ? ' class="acv-lead-form__wide"' : '' ) . ' aria-label="' . esc_attr( $label ) . '"' );
			} else {
				$out .= sprintf( $tag, ( $wide ? ' class="acv-lead-form__wide"' : '' ) . ' placeholder="' . esc_attr( $label ) . '" aria-label="' . esc_attr( $label ) . '"' );
			}
		}
	}
	return $out;
}

/* Main Website CSS ----------------------------------------------------------------------------- */

/** True when this request renders something for the Main Website (a bridge render or its preview). */
function is_main_design_request(): bool {
	if ( is_bridge_render() ) {
		return true;
	}
	$object = get_queried_object();
	if ( ! $object instanceof \WP_Post ) {
		return false;
	}
	$target = get_publish_target( $object->ID );
	return TARGET_MAIN === $target || ( isset( $_GET['elementor-preview'] ) && targets_main( $target ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
}

/**
 * "Read more": a Text Editor with the CSS class acv-readmore (Advanced > CSS Classes) shows its
 * first --acv-lines lines (6 unless set) and a "Read more" / "Read less" toggle, as the Main
 * Website's homepage cards. Toggle look: --acv-more-color, --acv-more-size, --acv-more-gap.
 */
const READ_MORE_CSS = '.acv-readmore:not(.is-open) p{display:-webkit-box;-webkit-line-clamp:var(--acv-lines,6);-webkit-box-orient:vertical;overflow:hidden}'
	. '.elementor .acv-readmore .acv-readmore__toggle,.elementor .acv-readmore .acv-readmore__toggle:hover,.elementor .acv-readmore .acv-readmore__toggle:focus{display:inline-flex;align-items:center;gap:8px;margin:var(--acv-more-gap,16px) 0 0;padding:0;border:0;background:none;box-shadow:none;font:inherit;font-size:var(--acv-more-size,14px);font-weight:600;line-height:20px;color:var(--acv-more-color,#fff);cursor:pointer}'
	. '.acv-readmore__toggle svg{width:16px;height:16px;transition:transform .2s}.acv-readmore.is-open .acv-readmore__toggle svg{transform:rotate(180deg)}';

const READ_MORE_SCRIPT = <<<'JS'
(function(){var init=function(){[].forEach.call(document.querySelectorAll('.acv-readmore'),function(w){if(w.querySelector('.acv-readmore__toggle')||!w.querySelector('p'))return;
var b=document.createElement('button'),more=w.getAttribute('data-more')||'Read more',less=w.getAttribute('data-less')||'Read less';b.type='button';b.className='acv-readmore__toggle';
var set=function(){var open=w.classList.contains('is-open');b.innerHTML='<span></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';b.firstChild.textContent=open?less:more;b.setAttribute('aria-expanded',open?'true':'false')};
b.addEventListener('click',function(){w.classList.toggle('is-open');set()});set();(w.querySelector('.elementor-widget-container')||w).appendChild(b)})};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init()})();
JS;

/**
 * Main Website pages are drawn edge to edge by their Elementor design, like the Next.js pages
 * they replace: the theme's own page container adds no width limit or side padding there (also
 * on phones, where the theme pads it with "#content .ast-container", an ID rule).
 */
const MAIN_BASE_CSS = '.site-content>.ast-container,.site-content .ast-container,body #content.site-content .ast-container{max-width:none;padding-left:0;padding-right:0}'
	// As on the Main Website (Tailwind's reset): text blocks add no paragraph spacing of their own and
	// links take the text colour. Blog article text (.acv-prose) keeps its own spacing.
	. '.elementor-widget-text-editor:not(.acv-prose) :is(p,li,blockquote){margin:0}.elementor-widget-text-editor:not(.acv-prose) a{color:inherit}'
	// The theme colours every heading tag directly, which would hide the title colours chosen in
	// an Elementor Accordion (they are set on the title row and inherited by its h2-h5).
	. '.elementor .e-n-accordion-item-title-text{color:inherit}'
	. READ_MORE_CSS;


function print_main_css(): void {
	if ( ! is_main_design_request() ) {
		return;
	}
	add_action( 'wp_footer', __NAMESPACE__ . '\\print_read_more_script' );
	$css = (string) get_option( MAIN_CSS_OPTION, '' );
	echo '<style id="acv-main-website-css">' . MAIN_BASE_CSS . wp_strip_all_tags( $css ) . "</style>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS with tags stripped.
}

function print_read_more_script(): void {
	echo '<script id="acv-read-more-js">' . READ_MORE_SCRIPT . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed script.
}

/* Sitemaps: Main-only types never appear in this website's sitemaps. ------------------------- */

/**
 * Page-builder internals that are never pages of their own: header/footer templates, Elementor
 * templates, popups, forms, mega-menu items, floating buttons. Rank Math lists them in the
 * sitemap by default (e.g. /elementor-hf/header/, /metform-form/blank-form/).
 */
const SITEMAP_EXCLUDED_TYPES = array( 'elementor-hf', 'elementor_library', 'popupkit-campaigns', 'metform-form', 'wpr_mega_menu', 'e-floating-buttons' );

function exclude_main_only_types_from_rank_math( $exclude, $type ) {
	return in_array( $type, MAIN_ONLY_TYPES, true ) || in_array( $type, SITEMAP_EXCLUDED_TYPES, true ) ? true : $exclude;
}

function exclude_main_only_types_from_core_sitemap( array $post_types ): array {
	foreach ( array_merge( MAIN_ONLY_TYPES, SITEMAP_EXCLUDED_TYPES ) as $type ) {
		unset( $post_types[ $type ] );
	}
	return $post_types;
}

/** The logo on the WordPress login screen leads to the Main Website (not wordpress.org). */
function login_logo_url(): string {
	$main = main_site_url();
	return '' !== $main ? $main . '/' : home_url( '/' );
}

function login_logo_text(): string {
	return 'Acadvizen';
}

/* Website Design screen ------------------------------------------------------------------------ */

function render_design_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$templates = get_posts( array( 'post_type' => 'elementor_library', 'post_status' => 'publish', 'posts_per_page' => 200, 'orderby' => 'title', 'order' => 'ASC' ) );
	$map       = (array) get_option( DESIGN_TEMPLATES_OPTION, array() );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Website Design', 'acadvizen-cms' ); ?></h1>
		<?php if ( isset( $_GET['saved'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Saved. Every Main Website page that uses these designs is being republished automatically.', 'acadvizen-cms' ); ?></p></div>
		<?php endif; ?>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="acv_cms_save_design" />
			<?php wp_nonce_field( 'acv_cms_save_design' ); ?>
			<h2><?php esc_html_e( 'Design of each content type', 'acadvizen-cms' ); ?></h2>
			<p><?php esc_html_e( 'Pick the Elementor template that shows every record of a type. Edit that template in Elementor to redesign all of them at once. A record you open with "Edit with Elementor" gets its own design instead.', 'acadvizen-cms' ); ?></p>
			<table class="form-table" role="presentation">
				<?php foreach ( design_type_labels() as $type => $label ) : ?>
					<tr>
						<th scope="row"><label for="acv-design-<?php echo esc_attr( $type ); ?>"><?php echo esc_html( $label ); ?></label></th>
						<td>
							<select id="acv-design-<?php echo esc_attr( $type ); ?>" name="acv_design[<?php echo esc_attr( $type ); ?>]">
								<option value="0"><?php esc_html_e( '— Theme default —', 'acadvizen-cms' ); ?></option>
								<?php foreach ( $templates as $template ) : ?>
									<option value="<?php echo esc_attr( (string) $template->ID ); ?>" <?php selected( (int) ( $map[ $type ] ?? 0 ), $template->ID ); ?>><?php echo esc_html( $template->post_title ); ?></option>
								<?php endforeach; ?>
							</select>
							<?php if ( design_template_for( $type ) ) : ?>
								<a class="button button-small" href="<?php echo esc_url( admin_url( 'post.php?post=' . design_template_for( $type ) . '&action=elementor' ) ); ?>"><?php esc_html_e( 'Edit design with Elementor', 'acadvizen-cms' ); ?></a>
							<?php endif; ?>
						</td>
					</tr>
				<?php endforeach; ?>
			</table>
			<h2><?php esc_html_e( 'Main Website CSS', 'acadvizen-cms' ); ?></h2>
			<p><?php esc_html_e( 'Added to every page published to the Main Website, for effects Elementor\'s controls do not offer (for example glass blur or glows). Most design changes are better made in Elementor.', 'acadvizen-cms' ); ?></p>
			<textarea name="acv_main_css" rows="14" class="large-text code" spellcheck="false"><?php echo esc_textarea( (string) get_option( MAIN_CSS_OPTION, '' ) ); ?></textarea>
			<?php submit_button( __( 'Save and republish', 'acadvizen-cms' ) ); ?>
		</form>
	</div>
	<?php
}

function handle_save_design(): void {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'acv_cms_save_design' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$map = array();
	foreach ( DESIGN_TYPES as $type ) {
		$id = isset( $_POST['acv_design'][ $type ] ) ? absint( $_POST['acv_design'][ $type ] ) : 0;
		if ( $id && 'elementor_library' === get_post_type( $id ) ) {
			$map[ $type ] = $id;
		}
	}
	update_option( DESIGN_TEMPLATES_OPTION, $map, false );
	$css = isset( $_POST['acv_main_css'] ) ? wp_strip_all_tags( wp_unslash( (string) $_POST['acv_main_css'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- CSS; tags stripped.
	update_option( MAIN_CSS_OPTION, $css, false );
	queue_site_rerender( 'global' );
	wp_safe_redirect( add_query_arg( 'saved', '1', admin_url( 'admin.php?page=' . MENU_SLUG . '-design' ) ) );
	exit;
}

function register_design_shortcodes(): void {
	add_shortcode( 'acv_field', __NAMESPACE__ . '\shortcode_field' );
	add_shortcode( 'acv_url', __NAMESPACE__ . '\shortcode_url' );
	add_shortcode( 'acv_loop', __NAMESPACE__ . '\shortcode_loop' );
	add_shortcode( 'acv_breadcrumbs', __NAMESPACE__ . '\shortcode_breadcrumbs' );
	add_shortcode( 'acv_toc', __NAMESPACE__ . '\shortcode_toc' );
	add_shortcode( 'acv_lead_form', __NAMESPACE__ . '\shortcode_lead_form' );
}

/**
 * A Main page carrying the Main Website's own structured data (imported with it) prints only that,
 * as the Main Website did; Rank Math's generated schema would add a second, different graph
 * (Article, EducationalOrganization…). Pages without imported data keep Rank Math's schema.
 */
function main_json_ld_replaces_rank_math( $data ) {
	$object = get_queried_object();
	if ( $object instanceof \WP_Post && is_main_design_request() && '' !== (string) get_post_meta( $object->ID, '_acv_json_ld', true ) ) {
		return array();
	}
	return $data;
}

/** Structured data (JSON-LD) imported from the Main Website, printed for the Main Website only. */
function print_imported_json_ld(): void {
	$object = get_queried_object();
	if ( ! $object instanceof \WP_Post || ! is_main_design_request() ) {
		return;
	}
	$json = (string) get_post_meta( $object->ID, '_acv_json_ld', true );
	if ( '' === $json || null === json_decode( $json ) ) {
		return;
	}
	echo '<script type="application/ld+json">' . str_replace( '</', '<\/', $json ) . "</script>\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- validated JSON, closing tags neutralised.
}

/**
 * Elementor's element cache bakes "static" widgets (Heading, Button, …) into the cached document.
 * A widget showing record fields differs per record, so it must be rendered every time.
 */
function mark_record_fields_dynamic( $is_dynamic, $raw_data ) {
	if ( $is_dynamic ) {
		return $is_dynamic;
	}
	$settings = is_array( $raw_data ) && isset( $raw_data['settings'] ) ? (string) wp_json_encode( $raw_data['settings'] ) : '';
	return false !== strpos( $settings, '[acv_' ) || false !== strpos( $settings, '#acv-field-' );
}

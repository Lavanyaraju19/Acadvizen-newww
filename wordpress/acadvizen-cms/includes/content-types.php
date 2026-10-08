<?php
/**
 * Structured Acadvizen content managed in the Master Admin.
 *
 * - Courses and Locations are full pages: designed in Elementor, given a "Publish To" target and
 *   published to the Main Website through the Render Bridge (like pages), with structured
 *   details in their own fields.
 * - Cities & Areas organise Locations (City > Area).
 * - FAQs, Testimonials and Tools are reusable records. Administrators place them in any Elementor
 *   page with the Shortcode widget ([acv_faqs], [acv_testimonials], [acv_tools]); WordPress
 *   renders them, so they look the same on both websites and need no Main Website code.
 *
 * Nothing here changes existing pages: the shortcodes only output where an administrator adds them.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const CONTENT_NONCE_ACTION = 'acv_cms_save_content';
const CONTENT_NONCE_FIELD  = 'acv_cms_content_nonce';

function content_field_definitions(): array {
	return array(
		'acv_course'      => array(
			'_acv_course_duration'  => array( __( 'Duration', 'acadvizen-cms' ), 'text', __( 'e.g. 4 months', 'acadvizen-cms' ) ),
			'_acv_course_mode'      => array( __( 'Mode', 'acadvizen-cms' ), 'text', __( 'e.g. Classroom & Online', 'acadvizen-cms' ) ),
			'_acv_course_fee'       => array( __( 'Fee (as shown to visitors)', 'acadvizen-cms' ), 'text', __( 'e.g. ₹45,000 or "Contact us"', 'acadvizen-cms' ) ),
			'_acv_course_features'  => array( __( 'Key features (one per line)', 'acadvizen-cms' ), 'lines', '' ),
			'_acv_course_cta_label' => array( __( 'Button text', 'acadvizen-cms' ), 'text', __( 'e.g. Enroll Now', 'acadvizen-cms' ) ),
			'_acv_course_cta_url'   => array( __( 'Button link', 'acadvizen-cms' ), 'url', 'https://enroll.acadvizen.com/' ),
			'_acv_course_locations' => array( __( 'Available at these locations', 'acadvizen-cms' ), 'posts:acv_location', '' ),
		),
		'acv_location'    => array(
			'_acv_location_address' => array( __( 'Address', 'acadvizen-cms' ), 'lines', '' ),
			'_acv_location_phone'   => array( __( 'Phone', 'acadvizen-cms' ), 'text', '' ),
			'_acv_location_map_url' => array( __( 'Google Maps link', 'acadvizen-cms' ), 'url', '' ),
			'_acv_location_courses' => array( __( 'Courses offered here', 'acadvizen-cms' ), 'posts:acv_course', '' ),
		),
		'acv_faq'         => array(
			'_acv_faq_global' => array( __( 'Show on every page that lists FAQs', 'acadvizen-cms' ), 'checkbox', '' ),
			'_acv_faq_for'    => array( __( 'Show on these pages, courses or locations', 'acadvizen-cms' ), 'posts:page,acv_course,acv_location', '' ),
		),
		'acv_testimonial' => array(
			'_acv_testimonial_role'   => array( __( 'Role / company', 'acadvizen-cms' ), 'text', __( 'e.g. SEO Executive at Infosys', 'acadvizen-cms' ) ),
			'_acv_testimonial_rating' => array( __( 'Rating (1–5)', 'acadvizen-cms' ), 'rating', '' ),
		),
		'acv_tool'        => array(
			'_acv_tool_url'      => array( __( 'Website', 'acadvizen-cms' ), 'url', '' ),
			'_acv_tool_category' => array( __( 'Category', 'acadvizen-cms' ), 'text', __( 'e.g. SEO', 'acadvizen-cms' ) ),
			'_acv_tool_brand_color' => array( __( 'Brand colour', 'acadvizen-cms' ), 'text', __( 'e.g. #F9AB00', 'acadvizen-cms' ) ),
		),
	);
}

function register_content_types(): void {
	$page_like = array(
		'public'              => true,
		'publicly_queryable'  => true,
		'exclude_from_search' => false,
		'has_archive'         => false,
		'show_ui'             => true,
		'show_in_menu'        => MENU_SLUG,
		'show_in_nav_menus'   => true,
		'show_in_rest'        => false,
		'capability_type'     => 'page',
		'map_meta_cap'        => true,
		'hierarchical'        => false,
		'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions' ),
	);
	register_post_type(
		'acv_course',
		array_merge(
			$page_like,
			array(
				'labels'  => content_labels( __( 'Courses', 'acadvizen-cms' ), __( 'Course', 'acadvizen-cms' ) ),
				'rewrite' => array( 'slug' => 'course', 'with_front' => false ),
			)
		)
	);
	register_post_type(
		'acv_location',
		array_merge(
			$page_like,
			array(
				'labels'  => content_labels( __( 'Locations', 'acadvizen-cms' ), __( 'Location', 'acadvizen-cms' ) ),
				'rewrite' => array( 'slug' => 'location', 'with_front' => false ),
			)
		)
	);

	$record = array(
		'public'             => false,
		'publicly_queryable' => false,
		'show_ui'            => true,
		'show_in_menu'       => MENU_SLUG,
		'show_in_rest'       => false,
		'rewrite'            => false,
		'query_var'          => false,
		'capability_type'    => 'post',
		'map_meta_cap'       => true,
	);
	register_post_type(
		'acv_faq',
		array_merge(
			$record,
			array(
				'labels'   => content_labels( __( 'FAQs', 'acadvizen-cms' ), __( 'FAQ', 'acadvizen-cms' ), __( 'Question', 'acadvizen-cms' ) ),
				'supports' => array( 'title', 'editor', 'page-attributes', 'revisions' ),
			)
		)
	);
	register_post_type(
		'acv_testimonial',
		array_merge(
			$record,
			array(
				'labels'   => content_labels( __( 'Testimonials', 'acadvizen-cms' ), __( 'Testimonial', 'acadvizen-cms' ), __( 'Student name', 'acadvizen-cms' ) ),
				'supports' => array( 'title', 'editor', 'thumbnail', 'page-attributes', 'revisions' ),
			)
		)
	);
	// Tools are Main Website pages (www.acadvizen.com/tools/<slug>) as well as reusable records
	// for [acv_tools]; Main-only, so this website never serves them to visitors.
	register_post_type(
		'acv_tool',
		array_merge(
			$page_like,
			array(
				'labels'              => content_labels( __( 'Tools', 'acadvizen-cms' ), __( 'Tool', 'acadvizen-cms' ), __( 'Tool name', 'acadvizen-cms' ) ),
				'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'page-attributes', 'revisions' ),
				'exclude_from_search' => true,
				'show_in_nav_menus'   => false,
				'rewrite'             => array( 'slug' => 'tool', 'with_front' => false ),
			)
		)
	);

	register_taxonomy(
		'acv_city',
		array( 'acv_location' ),
		array(
			'labels'            => array(
				'name'          => __( 'Cities & Areas', 'acadvizen-cms' ),
				'singular_name' => __( 'City or Area', 'acadvizen-cms' ),
				'parent_item'   => __( 'City (leave empty to add a city)', 'acadvizen-cms' ),
				'add_new_item'  => __( 'Add City or Area', 'acadvizen-cms' ),
				'menu_name'     => __( 'Cities & Areas', 'acadvizen-cms' ),
			),
			'hierarchical'      => true,
			'public'            => false,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => false,
			'rewrite'           => false,
		)
	);
	register_taxonomy(
		'acv_blog_category',
		array( POST_TYPE ),
		array(
			'labels'            => array(
				'name'          => __( 'Blog Categories', 'acadvizen-cms' ),
				'singular_name' => __( 'Blog Category', 'acadvizen-cms' ),
				'menu_name'     => __( 'Blog Categories', 'acadvizen-cms' ),
			),
			'hierarchical'      => true,
			'public'            => false,
			'show_ui'           => true,
			'show_admin_column' => true,
			'show_in_rest'      => false,
			'rewrite'           => false,
		)
	);
}

function content_labels( string $plural, string $singular, string $title_placeholder = '' ): array {
	return array(
		'name'           => $plural,
		'singular_name'  => $singular,
		'menu_name'      => $plural,
		'all_items'      => $plural,
		/* translators: %s: content type name */
		'add_new_item'   => sprintf( __( 'Add New %s', 'acadvizen-cms' ), $singular ),
		/* translators: %s: content type name */
		'edit_item'      => sprintf( __( 'Edit %s', 'acadvizen-cms' ), $singular ),
		/* translators: %s: content type name */
		'not_found'      => sprintf( __( 'No %s yet.', 'acadvizen-cms' ), strtolower( $plural ) ),
		'featured_image' => __( 'Image', 'acadvizen-cms' ),
		'acv_title'      => $title_placeholder,
	);
}

/**
 * "Question", "Student name" etc. instead of "Add title" on record screens.
 */
function title_placeholder( string $placeholder, \WP_Post $post ): string {
	$object = get_post_type_object( $post->post_type );
	return $object && ! empty( $object->labels->acv_title ) ? $object->labels->acv_title : $placeholder;
}

function register_content_meta_boxes( string $post_type ): void {
	$definitions = content_field_definitions();
	if ( isset( $definitions[ $post_type ] ) ) {
		add_meta_box( 'acv-cms-details', __( 'Details', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_content_fields', $post_type, 'normal', 'high' );
	}
}

function render_content_fields( \WP_Post $post ): void {
	wp_nonce_field( CONTENT_NONCE_ACTION, CONTENT_NONCE_FIELD );
	$fields = content_field_definitions()[ $post->post_type ] ?? array();
	echo '<table class="form-table" role="presentation">';
	foreach ( $fields as $key => list( $label, $type, $placeholder ) ) {
		$value = get_post_meta( $post->ID, $key, true );
		$id    = 'acv-' . sanitize_html_class( $key );
		echo '<tr><th scope="row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label></th><td>';
		if ( 'lines' === $type ) {
			printf( '<textarea class="large-text" rows="4" id="%1$s" name="%2$s">%3$s</textarea>', esc_attr( $id ), esc_attr( $key ), esc_textarea( (string) $value ) );
		} elseif ( 'checkbox' === $type ) {
			printf( '<input type="checkbox" id="%1$s" name="%2$s" value="1" %3$s />', esc_attr( $id ), esc_attr( $key ), checked( '1', $value, false ) );
		} elseif ( 'rating' === $type ) {
			printf( '<select id="%1$s" name="%2$s"><option value="">—</option>', esc_attr( $id ), esc_attr( $key ) );
			for ( $i = 5; $i >= 1; $i-- ) {
				printf( '<option value="%1$d" %2$s>%1$d</option>', (int) $i, selected( (string) $i, (string) $value, false ) );
			}
			echo '</select>';
		} elseif ( 0 === strpos( $type, 'posts:' ) ) {
			$selected = array_map( 'intval', (array) $value );
			$choices  = get_posts(
				array(
					'post_type'      => explode( ',', substr( $type, 6 ) ),
					'post_status'    => array( 'publish', 'draft', 'pending', 'future', 'private' ),
					'posts_per_page' => 300,
					'orderby'        => 'title',
					'order'          => 'ASC',
				)
			);
			printf( '<select multiple size="6" style="min-width:320px" id="%1$s" name="%2$s[]">', esc_attr( $id ), esc_attr( $key ) );
			foreach ( $choices as $choice ) {
				printf( '<option value="%1$d" %2$s>%3$s</option>', (int) $choice->ID, selected( in_array( (int) $choice->ID, $selected, true ), true, false ), esc_html( get_the_title( $choice ) . ' (' . get_post_type_object( $choice->post_type )->labels->singular_name . ')' ) );
			}
			echo '</select><p class="description">' . esc_html__( 'Hold Ctrl (Windows) or Cmd (Mac) to choose more than one.', 'acadvizen-cms' ) . '</p>';
		} else {
			printf( '<input type="%1$s" class="regular-text" id="%2$s" name="%3$s" value="%4$s" placeholder="%5$s" />', 'url' === $type ? 'url' : 'text', esc_attr( $id ), esc_attr( $key ), esc_attr( (string) $value ), esc_attr( $placeholder ) );
		}
		echo '</td></tr>';
	}
	echo '</table>';
	if ( 'acv_faq' === $post->post_type ) {
		echo '<p class="description">' . esc_html__( 'Type the question as the title and the answer in the editor. Use "Order" (Page Attributes) to sort. Add the FAQs to any Elementor page with the Shortcode widget: [acv_faqs]', 'acadvizen-cms' ) . '</p>';
	} elseif ( 'acv_testimonial' === $post->post_type ) {
		echo '<p class="description">' . esc_html__( 'Type the student name as the title and their words in the editor. Add testimonials to any Elementor page with the Shortcode widget: [acv_testimonials]', 'acadvizen-cms' ) . '</p>';
	} elseif ( 'acv_tool' === $post->post_type ) {
		echo '<p class="description">' . esc_html__( 'Set the logo as the image. Add tools to any Elementor page with the Shortcode widget: [acv_tools] or [acv_tools category="SEO"]', 'acadvizen-cms' ) . '</p>';
	} else {
		echo '<p class="description">' . esc_html__( 'Design this page with "Edit with Elementor". Show these details anywhere in the design with the Shortcode widget:', 'acadvizen-cms' ) . ' <code>[' . esc_html( 'acv_course' === $post->post_type ? 'acv_course_details' : 'acv_location_details' ) . ']</code></p>';
	}
}

function save_content_fields( int $post_id, \WP_Post $post ): void {
	$fields = content_field_definitions()[ $post->post_type ] ?? null;
	if ( ! $fields || wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST[ CONTENT_NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ CONTENT_NONCE_FIELD ] ) ), CONTENT_NONCE_ACTION ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( $fields as $key => list( , $type ) ) {
		$raw = isset( $_POST[ $key ] ) ? wp_unslash( $_POST[ $key ] ) : null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( 'checkbox' === $type ) {
			update_post_meta( $post_id, $key, $raw ? '1' : '' );
		} elseif ( 0 === strpos( $type, 'posts:' ) ) {
			update_post_meta( $post_id, $key, array_values( array_filter( array_map( 'absint', (array) $raw ) ) ) );
		} elseif ( 'url' === $type ) {
			update_post_meta( $post_id, $key, esc_url_raw( (string) $raw ) );
		} elseif ( 'lines' === $type ) {
			update_post_meta( $post_id, $key, sanitize_textarea_field( (string) $raw ) );
		} elseif ( 'rating' === $type ) {
			$rating = absint( $raw );
			update_post_meta( $post_id, $key, $rating >= 1 && $rating <= 5 ? (string) $rating : '' );
		} else {
			update_post_meta( $post_id, $key, sanitize_text_field( (string) $raw ) );
		}
	}
}

/* ---------------------------------------------------------------------------------------------
 * Shortcodes (rendered by WordPress, so they work identically on both websites)
 * ------------------------------------------------------------------------------------------- */

function shortcode_styles(): string {
	static $printed = false;
	if ( $printed ) {
		return '';
	}
	$printed = true;
	return '<style id="acv-cms-shortcodes">'
		. '.acv-faqs details{border-bottom:1px solid rgba(127,127,127,.25);padding:12px 0}.acv-faqs summary{cursor:pointer;font-weight:600}.acv-faqs .acv-answer{margin-top:8px}'
		. '.acv-grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}.acv-card{border:1px solid rgba(127,127,127,.25);border-radius:12px;padding:18px}'
		. '.acv-card img{max-width:100%;height:auto;border-radius:8px}.acv-tool img{max-height:48px;width:auto}.acv-rating{letter-spacing:2px}'
		. '.acv-details dt{font-weight:600;margin-top:10px}.acv-details dd{margin:2px 0 0}.acv-details ul{margin:6px 0 0 18px}'
		. '</style>';
}

/**
 * Yes/no shortcode attribute: "yes", "1", "true" and "on" mean yes (any case); anything else means no.
 */
function shortcode_flag( $value ): bool {
	return in_array( strtolower( trim( (string) $value ) ), array( 'yes', '1', 'true', 'on' ), true );
}

function shortcode_faqs( $atts ): string {
	$atts  = shortcode_atts( array( 'for' => 'current', 'limit' => 50, 'schema' => 'yes' ), $atts, 'acv_faqs' );
	$owner = 'current' === $atts['for'] ? (int) get_queried_object_id() : absint( $atts['for'] );
	$faqs  = get_posts(
		array(
			'post_type'      => 'acv_faq',
			'post_status'    => 'publish',
			'posts_per_page' => min( 200, max( 1, (int) $atts['limit'] ) ),
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'ASC' ),
		)
	);
	$faqs  = array_values(
		array_filter(
			$faqs,
			static function ( $faq ) use ( $owner, $atts ) {
				$for = array_map( 'intval', (array) get_post_meta( $faq->ID, '_acv_faq_for', true ) );
				$is_global = '1' === get_post_meta( $faq->ID, '_acv_faq_global', true );
				return 'all' === $atts['for'] || $is_global || ( $owner && in_array( $owner, $for, true ) );
			}
		)
	);
	if ( ! $faqs ) {
		return '';
	}
	$out    = shortcode_styles() . '<div class="acv-faqs">';
	$schema = array();
	foreach ( $faqs as $faq ) {
		$answer   = wpautop( wp_kses_post( $faq->post_content ) );
		$out     .= '<details><summary>' . esc_html( get_the_title( $faq ) ) . '</summary><div class="acv-answer">' . $answer . '</div></details>';
		$schema[] = array(
			'@type'          => 'Question',
			'name'           => wp_strip_all_tags( get_the_title( $faq ) ),
			'acceptedAnswer' => array( '@type' => 'Answer', 'text' => wp_strip_all_tags( $faq->post_content ) ),
		);
	}
	$out .= '</div>';
	if ( shortcode_flag( $atts['schema'] ) ) {
		$out .= '<script type="application/ld+json">' . wp_json_encode( array( '@context' => 'https://schema.org', '@type' => 'FAQPage', 'mainEntity' => $schema ) ) . '</script>';
	}
	return $out;
}

function shortcode_testimonials( $atts ): string {
	$atts  = shortcode_atts( array( 'limit' => 6 ), $atts, 'acv_testimonials' );
	$items = get_posts(
		array(
			'post_type'      => 'acv_testimonial',
			'post_status'    => 'publish',
			'posts_per_page' => min( 50, max( 1, (int) $atts['limit'] ) ),
			'orderby'        => array( 'menu_order' => 'ASC', 'date' => 'DESC' ),
		)
	);
	if ( ! $items ) {
		return '';
	}
	$out = shortcode_styles() . '<div class="acv-grid acv-testimonials">';
	foreach ( $items as $item ) {
		$rating = (int) get_post_meta( $item->ID, '_acv_testimonial_rating', true );
		$out   .= '<figure class="acv-card acv-testimonial">'
			. ( has_post_thumbnail( $item ) ? get_the_post_thumbnail( $item, 'thumbnail', array( 'loading' => 'lazy' ) ) : '' )
			. ( $rating ? '<div class="acv-rating" aria-label="' . esc_attr( $rating . ' out of 5' ) . '">' . str_repeat( '★', $rating ) . '</div>' : '' )
			. '<blockquote>' . wpautop( wp_kses_post( $item->post_content ) ) . '</blockquote>'
			. '<figcaption><strong>' . esc_html( get_the_title( $item ) ) . '</strong>'
			. ( get_post_meta( $item->ID, '_acv_testimonial_role', true ) ? '<br />' . esc_html( get_post_meta( $item->ID, '_acv_testimonial_role', true ) ) : '' )
			. '</figcaption></figure>';
	}
	return $out . '</div>';
}

function shortcode_tools( $atts ): string {
	$atts  = shortcode_atts( array( 'category' => '', 'limit' => 48 ), $atts, 'acv_tools' );
	$query = array(
		'post_type'      => 'acv_tool',
		'post_status'    => 'publish',
		'posts_per_page' => min( 200, max( 1, (int) $atts['limit'] ) ),
		'orderby'        => array( 'menu_order' => 'ASC', 'title' => 'ASC' ),
	);
	if ( '' !== $atts['category'] ) {
		$query['meta_query'] = array( array( 'key' => '_acv_tool_category', 'value' => sanitize_text_field( $atts['category'] ) ) );
	}
	$items = get_posts( $query );
	if ( ! $items ) {
		return '';
	}
	$out = shortcode_styles() . '<div class="acv-grid acv-tools">';
	foreach ( $items as $item ) {
		$url  = (string) get_post_meta( $item->ID, '_acv_tool_url', true );
		$name = esc_html( get_the_title( $item ) );
		$out .= '<div class="acv-card acv-tool">'
			. ( has_post_thumbnail( $item ) ? get_the_post_thumbnail( $item, 'medium', array( 'loading' => 'lazy' ) ) : '' )
			. '<h4>' . ( $url ? '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . $name . '</a>' : $name ) . '</h4>'
			. wpautop( wp_kses_post( $item->post_content ) )
			. '</div>';
	}
	return $out . '</div>';
}

function linked_titles( int $post_id, string $meta_key ): string {
	$links = array();
	foreach ( array_map( 'intval', (array) get_post_meta( $post_id, $meta_key, true ) ) as $linked_id ) {
		$linked = get_post( $linked_id );
		if ( $linked && 'publish' === $linked->post_status ) {
			$links[] = '<a href="' . esc_url( get_permalink( $linked ) ) . '">' . esc_html( get_the_title( $linked ) ) . '</a>';
		}
	}
	return implode( ', ', $links );
}

function shortcode_course_details( $atts ): string {
	$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'acv_course_details' );
	$id   = absint( $atts['id'] ) ? absint( $atts['id'] ) : (int) get_queried_object_id();
	if ( 'acv_course' !== get_post_type( $id ) ) {
		return '';
	}
	$rows = array(
		__( 'Duration', 'acadvizen-cms' ) => esc_html( (string) get_post_meta( $id, '_acv_course_duration', true ) ),
		__( 'Mode', 'acadvizen-cms' )     => esc_html( (string) get_post_meta( $id, '_acv_course_mode', true ) ),
		__( 'Fee', 'acadvizen-cms' )      => esc_html( (string) get_post_meta( $id, '_acv_course_fee', true ) ),
		__( 'Locations', 'acadvizen-cms' ) => linked_titles( $id, '_acv_course_locations' ),
	);
	$features = array_filter( array_map( 'trim', explode( "\n", (string) get_post_meta( $id, '_acv_course_features', true ) ) ) );
	$out      = shortcode_styles() . '<dl class="acv-details acv-course-details">';
	foreach ( $rows as $label => $value ) {
		if ( '' !== $value ) {
			$out .= '<dt>' . esc_html( $label ) . '</dt><dd>' . $value . '</dd>';
		}
	}
	if ( $features ) {
		$out .= '<dt>' . esc_html__( 'What you will learn', 'acadvizen-cms' ) . '</dt><dd><ul><li>' . implode( '</li><li>', array_map( 'esc_html', $features ) ) . '</li></ul></dd>';
	}
	$out  .= '</dl>';
	$label = (string) get_post_meta( $id, '_acv_course_cta_label', true );
	$url   = (string) get_post_meta( $id, '_acv_course_cta_url', true );
	if ( $label && $url ) {
		$out .= '<p><a class="elementor-button acv-course-cta" href="' . esc_url( $url ) . '">' . esc_html( $label ) . '</a></p>';
	}
	return $out;
}

function shortcode_location_details( $atts ): string {
	$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'acv_location_details' );
	$id   = absint( $atts['id'] ) ? absint( $atts['id'] ) : (int) get_queried_object_id();
	if ( 'acv_location' !== get_post_type( $id ) ) {
		return '';
	}
	$terms   = get_the_terms( $id, 'acv_city' );
	$address = (string) get_post_meta( $id, '_acv_location_address', true );
	$phone   = (string) get_post_meta( $id, '_acv_location_phone', true );
	$map     = (string) get_post_meta( $id, '_acv_location_map_url', true );
	$courses = linked_titles( $id, '_acv_location_courses' );
	$out     = shortcode_styles() . '<dl class="acv-details acv-location-details">';
	if ( $terms && ! is_wp_error( $terms ) ) {
		$out .= '<dt>' . esc_html__( 'City / Area', 'acadvizen-cms' ) . '</dt><dd>' . esc_html( implode( ', ', wp_list_pluck( $terms, 'name' ) ) ) . '</dd>';
	}
	if ( $address ) {
		$out .= '<dt>' . esc_html__( 'Address', 'acadvizen-cms' ) . '</dt><dd>' . nl2br( esc_html( $address ) ) . ( $map ? '<br /><a href="' . esc_url( $map ) . '" target="_blank" rel="noopener">' . esc_html__( 'Open in Google Maps', 'acadvizen-cms' ) . '</a>' : '' ) . '</dd>';
	}
	if ( $phone ) {
		$out .= '<dt>' . esc_html__( 'Phone', 'acadvizen-cms' ) . '</dt><dd><a href="' . esc_url( 'tel:' . preg_replace( '/[^\d+]/', '', $phone ) ) . '">' . esc_html( $phone ) . '</a></dd>';
	}
	if ( $courses ) {
		$out .= '<dt>' . esc_html__( 'Courses offered', 'acadvizen-cms' ) . '</dt><dd>' . $courses . '</dd>';
	}
	return $out . '</dl>';
}

function register_shortcodes(): void {
	add_shortcode( 'acv_faqs', __NAMESPACE__ . '\\shortcode_faqs' );
	add_shortcode( 'acv_testimonials', __NAMESPACE__ . '\\shortcode_testimonials' );
	add_shortcode( 'acv_tools', __NAMESPACE__ . '\\shortcode_tools' );
	add_shortcode( 'acv_course_details', __NAMESPACE__ . '\\shortcode_course_details' );
	add_shortcode( 'acv_location_details', __NAMESPACE__ . '\\shortcode_location_details' );
}

/**
 * FAQs, testimonials and tools appear inside pages; when they change, pages showing them on the
 * Main Website must be re-rendered too.
 */
function after_record_saved( int $post_id, $post ): void {
	if ( $post instanceof \WP_Post && in_array( $post->post_type, array( 'acv_faq', 'acv_testimonial', 'acv_tool' ), true ) && 'auto-draft' !== $post->post_status ) {
		queue_site_rerender( 'content' );
	}
}

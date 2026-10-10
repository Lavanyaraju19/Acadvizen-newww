<?php
// LOCAL TEST ONLY (wp eval-file e2e-actions.php <action> …): admin actions through the same APIs
// the WordPress and Elementor editors use, so every normal hook fires.
use function Acadvizen\CMS\{set_publish_target, render_for_main, live_version_for_post, list_versions, rollback_to_version, queue_main_render, get_publish_target};

wp_set_current_user( 1 );
$a = $args;

/** An Elementor layout: a two-column container with a background colour, a heading and a text. */
function acv_e2e_layout( string $title, string $color, string $columns = '2' ): array {
	$col = static fn( string $id, array $widgets ) => array( 'id' => $id, 'elType' => 'container', 'isInner' => true, 'settings' => array( 'content_width' => 'full' ), 'elements' => $widgets );
	return array(
		array(
			'id'       => 'root',
			'elType'   => 'container',
			'settings' => array( 'background_background' => 'classic', 'background_color' => $color, 'flex_direction' => '2' === $columns ? 'row' : 'column', 'padding' => array( 'unit' => 'px', 'top' => '160', 'right' => '20', 'bottom' => '40', 'left' => '20', 'isLinked' => false ) ),
			'elements' => array(
				$col( 'colA', array( array( 'id' => 'h1', 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => array( 'title' => $title, 'header_size' => 'h1' ), 'elements' => array() ) ) ),
				$col( 'colB', array( array( 'id' => 't1', 'elType' => 'widget', 'widgetType' => 'text-editor', 'settings' => array( 'editor' => '<p>Layout ' . $columns . ' columns</p>' ), 'elements' => array() ) ) ),
			),
		),
	);
}

function acv_e2e_save( int $id, string $title, string $color, string $columns, string $status ): void {
	$document = \Elementor\Plugin::$instance->documents->get( $id, false );
	// Exactly what "Publish"/"Update" (or "Save Draft") in the Elementor editor sends.
	$document->save( array( 'elements' => acv_e2e_layout( $title, $color, $columns ), 'settings' => array( 'post_status' => $status ) ) );
}

switch ( $a[0] ?? '' ) {
	case 'page': // page <type> <slug> <title> <target> <status> <color>
		$id = wp_insert_post( array( 'post_type' => $a[1], 'post_title' => $a[3], 'post_name' => $a[2], 'post_status' => 'draft' ) );
		update_post_meta( $id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $id, '_elementor_template_type', 'wp-page' );
		update_post_meta( $id, '_wp_page_template', 'elementor_header_footer' );
		set_publish_target( $id, $a[4] );
		acv_e2e_save( $id, $a[3], $a[6], '2', $a[5] );
		echo $id;
		break;
	case 'edit': // edit <id> <title> <color> <columns> [status]
		acv_e2e_save( (int) $a[1], $a[2], $a[3], $a[4], $a[5] ?? 'publish' );
		break;
	case 'target':
		set_publish_target( (int) $a[1], $a[2] );
		wp_update_post( array( 'ID' => (int) $a[1] ) );
		break;
	case 'slug':
		wp_update_post( array( 'ID' => (int) $a[1], 'post_name' => $a[2] ) );
		break;
	case 'preview':
		$r = render_for_main( get_post( (int) $a[1] ), 'preview' );
		echo $r['ok'] ? ( false !== strpos( $r['html'], $a[2] ) ? 'ok-shows' : 'ok-missing' ) : 'error-' . $r['error'];
		break;
	case 'city-area': // city-area <city> <area> -> "<cityId> <areaId>"
		$city = wp_insert_term( $a[1], 'acv_city' );
		$area = wp_insert_term( $a[2], 'acv_city', array( 'parent' => $city['term_id'] ) );
		echo $city['term_id'] . ' ' . $area['term_id'];
		break;
	case 'assign-term':
		wp_set_object_terms( (int) $a[1], array( (int) $a[2] ), 'acv_city' );
		break;
	case 'term-info':
		$t = get_term( (int) $a[1], 'acv_city' );
		echo $t->name . ' parent=' . ( $t->parent ? get_term( $t->parent, 'acv_city' )->name : '-' );
		break;
	case 'versions':
		echo wp_json_encode( array_map( static fn( $v ) => (int) $v['version'], list_versions( (int) $a[1] ) ) );
		break;
	case 'rollback':
		$target = array_values( array_filter( list_versions( (int) $a[1] ), static fn( $v ) => (int) $v['version'] === (int) $a[2] ) )[0] ?? null;
		echo $target && rollback_to_version( (int) $a[1], (int) $target['id'] ) ? 'rolled-back' : 'rollback-failed';
		break;
	case 'fail':
		'on' === $a[1] ? update_option( 'local_force_render_error', 1 ) : delete_option( 'local_force_render_error' );
		break;
	case 'retry':
		queue_main_render( (int) $a[1], 'publish' );
		break;
	case 'state':
		$live = live_version_for_post( (int) $a[1] );
		echo get_post_meta( (int) $a[1], '_acv_main_state', true ) . '|' . ( $live ? $live['version'] : '-' ) . '|' . get_post_meta( (int) $a[1], '_acv_main_error', true ) . '|' . get_publish_target( (int) $a[1] );
		break;
	case 'kit-primary': // kit-primary [color] -> prints the previous colour
		$kit      = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		$settings = $kit->get_settings();
		foreach ( $settings['system_colors'] as &$c ) {
			if ( 'primary' === $c['_id'] ) {
				echo $c['color'];
				if ( isset( $a[1] ) ) {
					$c['color'] = $a[1];
				}
			}
		}
		if ( isset( $a[1] ) ) {
			$kit->save( array( 'settings' => $settings ) );
		}
		break;
	case 'trash':
		wp_trash_post( (int) $a[1] );
		break;
	case 'delete':
		wp_delete_post( (int) $a[1], true );
		break;
	case 'delete-term':
		wp_delete_term( (int) $a[1], 'acv_city' );
		break;
}

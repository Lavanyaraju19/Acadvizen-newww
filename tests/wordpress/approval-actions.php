<?php
// LOCAL TEST ONLY (wp eval-file approval-actions.php <action> …): server-side steps of
// tests/wordpress/approval-acceptance.mjs that a browser cannot reach directly. Each action runs as
// the given WordPress user, through the plugin's own functions, so every guard and hook applies.
use function Acadvizen\CMS\{approval_state, review_candidate, publish_approved, verify_publication, guard_elementor_save, set_publish_target, archives_of, current_fingerprint, document_compatibility, submit_candidate};

$a      = $args;
$action = array_shift( $a );
$as     = static function ( string $login ): void {
	$user = get_user_by( 'login', $login );
	wp_set_current_user( $user ? $user->ID : 0 );
};
$out = static function ( $value ): void {
	echo is_string( $value ) ? $value : wp_json_encode( $value );
};

switch ( $action ) {
	case 'ensure-editor': // ensure-editor <login> <password-file>
		if ( ! get_user_by( 'login', $a[0] ) ) {
			wp_insert_user( array( 'user_login' => $a[0], 'user_pass' => trim( (string) file_get_contents( $a[1] ) ), 'user_email' => $a[0] . '@example.invalid', 'role' => 'editor' ) );
		}
		$out( 'ok' );
		break;
	case 'caps': // caps <login> -> can review? can publish code?
		$as( $a[0] );
		$out( array( 'review' => current_user_can( 'acv_review_publication' ), 'code' => current_user_can( 'unfiltered_html' ) ) );
		break;
	case 'target': // target <id> <main|enrollment|both>
		$as( 'dualhost' );
		Acadvizen\CMS\approval_bypass( true );
		set_publish_target( (int) $a[0], $a[1] );
		Acadvizen\CMS\approval_bypass( false );
		clean_post_cache( (int) $a[0] );
		$out( 'ok' );
		break;
	case 'design': // design <id> <json> : store a design directly (for widgets the editor cannot add)
		update_post_meta( (int) $a[0], '_elementor_data', wp_slash( $a[1] ) );
		update_post_meta( (int) $a[0], '_elementor_edit_mode', 'builder' );
		$out( 'ok' );
		break;
	case 'new-draft': // new-draft <login> <title> <slug>
		$as( $a[0] );
		$id = wp_insert_post( array( 'post_type' => 'page', 'post_title' => $a[1], 'post_name' => $a[2], 'post_status' => 'draft' ) );
		update_post_meta( $id, '_elementor_edit_mode', 'builder' );
		update_post_meta( $id, '_wp_page_template', 'elementor_header_footer' );
		$out( (string) $id );
		break;
	case 'submit': // submit <login> <id>
		$as( $a[0] );
		$out( submit_candidate( get_post( (int) $a[1] ) ) );
		break;
	case 'state': // state <id>
		$out( approval_state( (int) $a[0] ) + array( 'post_status' => get_post_status( (int) $a[0] ), 'fingerprint' => current_fingerprint( get_post( (int) $a[0] ) ) ) );
		break;
	case 'compat': // compat <id>
		$out( document_compatibility( get_post( (int) $a[0] ) ) );
		break;
	case 'review': // review <login> <id> <approve|reject> [code_ok]
		$as( $a[0] );
		$out( review_candidate( (int) $a[1], $a[2], ! empty( $a[3] ), 'from test' ) );
		break;
	case 'publish': // publish <login> <id>
		$as( $a[0] );
		$out( (string) publish_approved( (int) $a[1] ) );
		break;
	case 'verify': // verify <id> [attempt] : runs the check now (as the scheduled job does)
		$pub = get_post_meta( (int) $a[0], '_acv_publication', true );
		$out( is_array( $pub ) ? verify_publication( (int) $a[0], (string) $pub['hash'], (int) ( $a[1] ?? 1 ) ) : array() );
		break;
	case 'publication': // publication <id>
		$out( get_post_meta( (int) $a[0], '_acv_publication', true ) );
		break;
	case 'live-save': // live-save <login> <id> : an Elementor save of a live document (must be refused)
		$as( $a[0] );
		$document = \Elementor\Plugin::$instance->documents->get( (int) $a[1], false );
		try {
			$document->save( array( 'elements' => array(), 'settings' => array( 'post_status' => 'publish' ) ) );
			$out( 'saved' );
		} catch ( \Exception $e ) {
			$out( 'refused: ' . $e->getMessage() );
		}
		break;
	case 'kit-save': // kit-save <login> : a global styles save
		$as( $a[0] );
		$kit = \Elementor\Plugin::$instance->kits_manager->get_active_kit();
		try {
			guard_elementor_save( $kit, array( 'settings' => array() ) );
			$out( 'allowed' );
		} catch ( \Exception $e ) {
			$out( 'refused: ' . $e->getMessage() );
		}
		break;
	case 'archives': // archives <id>
		$out( archives_of( (int) $a[0] ) );
		break;
	case 'rollback': // rollback <login> <id> <archive>
		$as( $a[0] );
		$out( Acadvizen\CMS\rollback_to_archive( (int) $a[1], (int) $a[2] ) );
		break;
	case 'working-copy': // working-copy <id> -> its open working copy id (0 when none)
		$out( (string) (int) get_post_meta( (int) $a[0], '_acv_working_copy', true ) );
		break;
	case 'render-fail': // render-fail <1|0> : the local failure switch (mu-plugin local-failure-switch.php)
		1 === (int) $a[0] ? update_option( 'local_force_render_error', 1 ) : delete_option( 'local_force_render_error' );
		$out( 'ok' );
		break;
	case 'enroll-fail': // enroll-fail <1|0> : the local Enrollment outage switch (mu-plugin local-failure-switch.php)
		1 === (int) $a[0] ? update_option( 'local_force_enroll_error', 1 ) : delete_option( 'local_force_enroll_error' );
		$out( 'ok' );
		break;
	case 'set-date': // set-date <id> <unix time> : the publish date an editor sets in the editor (before submitting)
		Acadvizen\CMS\approval_bypass( true );
		wp_update_post( array( 'ID' => (int) $a[0], 'post_date_gmt' => gmdate( 'Y-m-d H:i:s', (int) $a[1] ), 'post_date' => get_date_from_gmt( gmdate( 'Y-m-d H:i:s', (int) $a[1] ) ), 'edit_date' => true ) );
		Acadvizen\CMS\approval_bypass( false );
		$out( 'ok' );
		break;
	case 'scheduled-job': // scheduled-job <id> -> the time its publish job is due (0 when none)
		$out( (string) (int) wp_next_scheduled( Acadvizen\CMS\SCHEDULE_HOOK, array( (int) $a[0] ) ) );
		break;
	case 'drop-scheduled-job': // drop-scheduled-job <id> : simulates a lost WP-Cron job
		wp_clear_scheduled_hook( Acadvizen\CMS\SCHEDULE_HOOK, array( (int) $a[0] ) );
		$out( 'ok' );
		break;
	case 'run-scheduled': // run-scheduled <id> : runs the due job now (as WP-Cron does at its time)
		wp_clear_scheduled_hook( Acadvizen\CMS\SCHEDULE_HOOK, array( (int) $a[0] ) );
		Acadvizen\CMS\publish_scheduled( (int) $a[0] );
		$out( 'ok' );
		break;
	case 'unschedule': // unschedule <login> <id>
		$as( $a[0] );
		$out( Acadvizen\CMS\cancel_schedule( (int) $a[1] ) );
		break;
	case 'retry': // retry <login> <id> : "Check again"
		$as( $a[0] );
		$out( Acadvizen\CMS\retry_publication( (int) $a[1] ) ? 'retrying' : 'nothing_failed' );
		break;
	case 'count-titled': // count-titled <exact title> -> how many documents (any status) carry it
		$out( (string) count( get_posts( array( 'post_type' => array_values( array_diff( get_post_types(), array( 'attachment', 'revision', 'nav_menu_item' ) ) ), 'post_status' => 'any', 'title' => $a[0], 'posts_per_page' => -1, 'fields' => 'ids' ) ) ) );
		break;
	case 'approval-enabled': // approval-enabled -> approval-on / approval-off (the wp-config switch; here the local option)
		$out( Acadvizen\CMS\approval_enabled() ? 'approval-on' : 'approval-off' );
		break;
	case 'retry-render': // retry-render <id>
		Acadvizen\CMS\queue_main_render( (int) $a[0], 'retry' );
		$out( 'ok' );
		break;
	case 'set-homepage-flag': // set-homepage-flag <id> : marks a document as the Main homepage directly (test setup)
		Acadvizen\CMS\approval_bypass( true );
		update_post_meta( (int) $a[0], '_acv_main_homepage', '1' );
		Acadvizen\CMS\approval_bypass( false );
		$out( 'ok' );
		break;
	case 'homepage-flag': // homepage-flag <id> -> '1' or ''
		$out( (string) get_post_meta( (int) $a[0], '_acv_main_homepage', true ) );
		break;
	case 'site-box-save': // site-box-save <login> <id> <homepage 0|1> : the "Publish To" box of the edit screen, as submitted
		$as( $a[0] );
		$_POST = array(
			Acadvizen\CMS\SITE_NONCE_FIELD => wp_create_nonce( Acadvizen\CMS\SITE_NONCE_ACTION ),
			'acv_cms_site_target'          => Acadvizen\CMS\get_publish_target( (int) $a[1] ),
			'acv_cms_main_path'            => (string) get_post_meta( (int) $a[1], '_acv_main_path', true ),
		) + ( '1' === $a[2] ? array( 'acv_cms_main_homepage' => '1' ) : array() );
		Acadvizen\CMS\save_site_publish_box( (int) $a[1], get_post( (int) $a[1] ) );
		$out( 'ok' );
		break;
	case 'path-taken': // path-taken <path> <id> -> 'yes' when another document uses the Main address
		$out( Acadvizen\CMS\is_main_path_taken( $a[0], (int) $a[1] ) ? 'yes' : 'no' );
		break;
	case 'import-record': // import-record <login> <json item> : one record of a migration bundle, as Import Main Website runs it
		$as( $a[0] );
		$state = array( 'batch' => 'approval-test', 'map' => array() );
		$out( Acadvizen\CMS\import_record_item( json_decode( $a[1], true ), $state ) );
		break;
	case 'by-source': // by-source <key> -> ids the importer finds for a source key
		$out( Acadvizen\CMS\posts_by_source( 'record:' . $a[0] ) );
		break;
	case 'import-bundle': // import-bundle <login> <bundle file> : Import Main Website, as its screen runs it (upload, then steps until done)
		$as( $a[0] );
		$bundle = json_decode( (string) file_get_contents( $a[1] ), true );
		$target = Acadvizen\CMS\import_dir() . '/' . sanitize_key( (string) $bundle['batch'] ) . '-test.json';
		copy( $a[1], $target );
		$previous = Acadvizen\CMS\import_state();
		Acadvizen\CMS\save_import_state( array( 'file' => $target, 'name' => 'test', 'batch' => sanitize_key( (string) $bundle['batch'] ), 'step' => 0, 'index' => 0, 'processed' => 0, 'total' => Acadvizen\CMS\bundle_total( $bundle ), 'done' => false, 'map' => (array) ( $previous['map'] ?? array() ) ) );
		$lines = array();
		for ( $i = 0; $i < 50; $i++ ) {
			$step  = Acadvizen\CMS\run_import_batch();
			$lines = array_merge( $lines, (array) ( $step['log'] ?? array( (string) ( $step['message'] ?? '' ) ) ) );
			if ( ! empty( $step['done'] ) ) {
				break;
			}
		}
		$out( array( 'batch' => sanitize_key( (string) $bundle['batch'] ), 'lines' => $lines ) );
		break;
	case 'undo-import': // undo-import <login> <batch>
		$as( $a[0] );
		$out( (string) Acadvizen\CMS\undo_import( $a[1] ) );
		break;
	case 'unpublish': // unpublish <login> <id> : a reviewer takes a live page off line (status Draft)
		$as( $a[0] );
		$result = wp_update_post( array( 'ID' => (int) $a[1], 'post_status' => 'draft' ), true );
		$out( is_wp_error( $result ) ? $result->get_error_message() : get_post_status( (int) $a[1] ) );
		break;
	case 'cleanup': // cleanup <title-marker>
		Acadvizen\CMS\approval_bypass( true );
		$ids = get_posts( array( 'post_type' => array_values( array_diff( get_post_types(), array( 'attachment', 'revision', 'nav_menu_item' ) ) ), 'post_status' => 'any', 's' => $a[0], 'posts_per_page' => 200, 'fields' => 'ids' ) );
		foreach ( $ids as $id ) {
			foreach ( archives_of( (int) $id ) as $archive ) {
				wp_delete_post( $archive, true );
			}
			wp_delete_post( (int) $id, true );
		}
		Acadvizen\CMS\approval_bypass( false );
		$out( (string) count( $ids ) );
		break;
	default:
		$out( 'unknown action' );
}

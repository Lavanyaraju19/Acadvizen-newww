<?php
/**
 * LOCAL TEST HARNESS ONLY — never deployed.
 * When the option "local_force_render_error" is set, signed Render Bridge requests get a 500,
 * so the publish-failure path (retries, "Failed", previous version kept live) can be tested.
 */
add_action(
	'template_redirect',
	static function () {
		if ( get_option( 'local_force_render_error' ) && isset( $_SERVER['HTTP_X_ACADVIZEN_RENDER_SIGNATURE'] ) ) {
			status_header( 500 );
			exit( 'Simulated server error' );
		}
	},
	-1
);

/*
 * When the option "local_force_enroll_error" is set, the approval verifier's own requests for
 * Enrollment pages (they carry ?acv_verify=…) get a 503, so an Enrollment failure during a
 * publication can be tested (tests/wordpress/approval-acceptance.mjs). Visitors are not affected.
 */
add_action(
	'template_redirect',
	static function () {
		if ( get_option( 'local_force_enroll_error' ) && isset( $_GET['acv_verify'] ) && ! isset( $_SERVER['HTTP_X_ACADVIZEN_RENDER_SIGNATURE'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			status_header( 503 );
			exit( 'Simulated Enrollment outage' );
		}
	},
	-1
);

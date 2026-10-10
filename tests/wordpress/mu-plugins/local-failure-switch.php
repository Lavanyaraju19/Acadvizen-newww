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

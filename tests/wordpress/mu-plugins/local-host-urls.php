<?php
/**
 * LOCAL TEST HARNESS ONLY — never deployed.
 * Inside the WordPress container, "localhost" is the container itself. Requests WordPress makes to
 * the local Main build (localhost:3100) or to its own public address (localhost:8088) — for example
 * Import Main Website downloading the Main pages' images — go to the Docker host and to the web
 * server instead. On production these addresses are real hosts and nothing is rewritten.
 */
add_filter(
	'pre_http_request',
	static function ( $pre, $args, $url ) {
		if ( false !== $pre || ! empty( $args['_acv_local_rewritten'] ) || ! is_string( $url ) ) {
			return $pre;
		}
		if ( 0 === strpos( $url, 'http://localhost:3100' ) ) {
			$to = 'http://host.docker.internal:3100' . substr( $url, strlen( 'http://localhost:3100' ) );
		} elseif ( 0 === strpos( $url, 'http://localhost:8088' ) ) {
			$to                       = 'http://wordpress' . substr( $url, strlen( 'http://localhost:8088' ) );
			$args['headers']          = (array) ( $args['headers'] ?? array() );
			$args['headers']['Host']  = 'localhost:8088';
		} else {
			return $pre;
		}
		$args['_acv_local_rewritten'] = true;
		return wp_remote_request( $to, $args );
	},
	10,
	3
);

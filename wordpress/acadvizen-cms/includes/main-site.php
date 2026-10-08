<?php
/**
 * Signed HTTP calls from WordPress to the Main Website.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SLUG_CHECK_TIMEOUT = 5;
const NOTIFY_TIMEOUT     = 10;

/**
 * POSTs a JSON body to a Main Website endpoint with the shared signature headers.
 *
 * @return array{ok: bool, status: int, body: array, error: string}
 */
function post_to_main( string $path, array $payload, int $timeout ): array {
	if ( ! is_configured() ) {
		$error = production_isolation_error();
		return array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => '' !== $error ? $error : 'not_configured' );
	}

	$body      = wp_json_encode( $payload );
	$timestamp = time();
	$response  = wp_remote_post(
		main_internal_url() . $path,
		array(
			'timeout'     => $timeout,
			'redirection' => 0,
			'headers'     => array(
				'Content-Type'          => 'application/json',
				'X-Acadvizen-Timestamp' => (string) $timestamp,
				'X-Acadvizen-Signature' => sign_payload( $body, $timestamp, webhook_secret() ),
				'User-Agent'            => 'AcadvizenCMS/' . VERSION . '; ' . home_url(),
			) + main_request_headers(),
			'body'        => $body,
		)
	);

	if ( is_wp_error( $response ) ) {
		return array( 'ok' => false, 'status' => 0, 'body' => array(), 'error' => $response->get_error_code() . ': ' . $response->get_error_message() );
	}

	$status  = (int) wp_remote_retrieve_response_code( $response );
	$decoded = json_decode( (string) wp_remote_retrieve_body( $response ), true );
	$decoded = is_array( $decoded ) ? $decoded : array();
	$ok      = $status >= 200 && $status < 300 && ! empty( $decoded['ok'] );

	return array(
		'ok'     => $ok,
		'status' => $status,
		'body'   => $decoded,
		'error'  => $ok ? '' : 'http_' . $status . ( isset( $decoded['error'] ) && is_string( $decoded['error'] ) ? ': ' . $decoded['error'] : '' ),
	);
}

/**
 * Asks the Main Website whether /blog/<slug> is already used by existing Main content.
 *
 * @return array{checked: bool, conflict: bool, reason: string}
 */
function check_main_slug( string $slug ): array {
	$result = post_to_main( '/api/wordpress/slug-check', array( 'content_type' => 'blog', 'slug' => $slug ), SLUG_CHECK_TIMEOUT );
	if ( ! $result['ok'] ) {
		return array( 'checked' => false, 'conflict' => false, 'reason' => '' );
	}
	return normalize_slug_status( $result['body']['slug_status'] ?? null );
}

function normalize_slug_status( $status ): array {
	if ( ! is_array( $status ) || empty( $status['checked'] ) ) {
		return array( 'checked' => false, 'conflict' => false, 'reason' => '' );
	}
	return array(
		'checked'  => true,
		'conflict' => ! empty( $status['conflict'] ),
		'reason'   => isset( $status['reason'] ) && is_string( $status['reason'] ) ? sanitize_key( $status['reason'] ) : '',
	);
}

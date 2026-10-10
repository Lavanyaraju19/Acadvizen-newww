<?php
// LOCAL TEST HARNESS ONLY (never deployed): the Main dev server runs on the Docker host, which
// resolves to a private IP that WordPress' URL validation rejects by default.
add_filter( 'http_request_host_is_external', '__return_true' );
// The local Main dev server listens on port 3100 (production uses 443, which is allowed by default).
add_filter( 'http_allowed_safe_ports', static fn( $ports ) => array_merge( $ports, array( 3100 ) ) );

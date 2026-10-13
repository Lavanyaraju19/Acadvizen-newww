<?php
// LOCAL TEST ONLY (throwaway Docker WordPress; never deployed): approval before publishing is on
// while the option "local_approval_on" is set (tests/wordpress/approval-acceptance.mjs sets it for
// its run), as wp-config.php would turn it on in production (ACADVIZEN_CMS_APPROVAL).
if ( get_option( 'local_approval_on' ) && ! defined( 'ACADVIZEN_CMS_APPROVAL' ) ) {
	define( 'ACADVIZEN_CMS_APPROVAL', true );
}

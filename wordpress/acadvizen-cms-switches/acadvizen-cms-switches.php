<?php
/**
 * Plugin Name:       Acadvizen CMS Switches
 * Description:       Turns the Acadvizen Master Admin's optional features on or off from Settings → Acadvizen CMS Switches, where wp-config.php cannot be edited. A feature defined in wp-config.php always wins. Deactivating this plugin turns every feature it switched on off again.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.0
 * Author:            Acadvizen
 * License:           GPL-2.0-or-later
 * Text Domain:       acadvizen-cms-switches
 */

namespace Acadvizen\Switches;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const OPTION = 'acv_cms_switches';
const SAVE   = 'acv_cms_switches_save';

/** The Master Admin's optional features (wordpress/acadvizen-cms/includes/config.php OPTIONAL_FEATURES). */
function features(): array {
	return array(
		'RENDER_BRIDGE'   => __( 'Publish To on Elementor pages and posts (Main Website, Enrollment Website, Both). Turn on only while the Main Website reads WordPress.', 'acadvizen-cms-switches' ),
		'APPROVAL'        => __( 'Review before publishing: Draft → Review → Approved → Published.', 'acadvizen-cms-switches' ),
		'SITE_TEMPLATES'  => __( 'Headers, footers and Theme Builder templates follow Publish To, so each website shows only its own.', 'acadvizen-cms-switches' ),
		'SITEMAP_CLEANUP' => __( 'Keeps page-builder internals out of the sitemaps and restores lost Rank Math sitemap addresses every hour.', 'acadvizen-cms-switches' ),
		'LOGIN_BRANDING'  => __( 'The login logo reads "Acadvizen" and links to the Main Website.', 'acadvizen-cms-switches' ),
	);
}

function saved(): array {
	$on = get_option( OPTION, array() );
	return is_array( $on ) ? $on : array();
}

// Define the switched-on features now. WordPress loads plugins in folder-name order, and
// "acadvizen-cms-switches/" sorts before "acadvizen-cms/", so the Master Admin sees them while it loads.
define( __NAMESPACE__ . '\\LOADED_LATE', function_exists( 'Acadvizen\\CMS\\feature_enabled' ) );
foreach ( array_keys( features() ) as $acv_feature ) {
	if ( ! empty( saved()[ $acv_feature ] ) && ! defined( 'ACADVIZEN_CMS_' . $acv_feature ) ) {
		define( 'ACADVIZEN_CMS_' . $acv_feature, true );
	}
}

/** 'switch' (on here), 'wp-config' (set in wp-config.php: this screen cannot change it) or 'off'. */
function state( string $feature ): string {
	if ( ! empty( saved()[ $feature ] ) ) {
		return 'switch';
	}
	return defined( 'ACADVIZEN_CMS_' . $feature ) ? 'wp-config' : 'off';
}

add_action(
	'admin_menu',
	static function () {
		add_options_page( __( 'Acadvizen CMS Switches', 'acadvizen-cms-switches' ), __( 'Acadvizen CMS Switches', 'acadvizen-cms-switches' ), 'manage_options', 'acadvizen-cms-switches', __NAMESPACE__ . '\\render_page' );
	}
);

function render_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	echo '<div class="wrap"><h1>' . esc_html__( 'Acadvizen CMS Switches', 'acadvizen-cms-switches' ) . '</h1>';
	if ( isset( $_GET['saved'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		echo '<div class="notice notice-success"><p>' . esc_html__( 'Saved. The change applies from the next page you open.', 'acadvizen-cms-switches' ) . '</p></div>';
	}
	if ( LOADED_LATE ) {
		echo '<div class="notice notice-error"><p>' . esc_html__( 'This plugin loaded after Acadvizen Master Admin, so its switches have no effect. Deactivate and activate this plugin once to restore the loading order.', 'acadvizen-cms-switches' ) . '</p></div>';
	}
	echo '<p>' . esc_html__( 'Each switch turns on one optional feature of Acadvizen Master Admin. Turning one off restores the previous behaviour; nothing is deleted.', 'acadvizen-cms-switches' ) . '</p>';
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '">';
	wp_nonce_field( SAVE );
	echo '<input type="hidden" name="action" value="' . esc_attr( SAVE ) . '"><table class="form-table" role="presentation">';
	foreach ( features() as $feature => $label ) {
		$state = state( $feature );
		echo '<tr><th scope="row">' . esc_html( ucwords( strtolower( str_replace( '_', ' ', $feature ) ) ) ) . '</th><td><label>';
		if ( 'wp-config' === $state ) {
			echo '<input type="checkbox" checked disabled> ' . esc_html( $label ) . ' <em>' . esc_html__( '(set in wp-config.php)', 'acadvizen-cms-switches' ) . '</em>';
		} else {
			echo '<input type="checkbox" name="acv_switch[' . esc_attr( $feature ) . ']" value="1" ' . checked( 'switch', $state, false ) . '> ' . esc_html( $label );
		}
		echo '</label></td></tr>';
	}
	echo '</table>';
	submit_button( __( 'Save switches', 'acadvizen-cms-switches' ) );
	echo '</form></div>';
}

add_action(
	'admin_post_' . SAVE,
	static function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to change these switches.', 'acadvizen-cms-switches' ), 403 );
		}
		check_admin_referer( SAVE );
		$posted = isset( $_POST['acv_switch'] ) && is_array( $_POST['acv_switch'] ) ? wp_unslash( $_POST['acv_switch'] ) : array();
		$on     = array();
		foreach ( array_keys( features() ) as $feature ) {
			if ( ! empty( $posted[ $feature ] ) ) {
				$on[ $feature ] = true;
			}
		}
		update_option( OPTION, $on, true );
		wp_safe_redirect( admin_url( 'options-general.php?page=acadvizen-cms-switches&saved=1' ) );
		exit;
	}
);

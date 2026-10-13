<?php
/**
 * Widget and integration compatibility: what a design uses, whether each website can show it, and
 * what blocks or needs a reviewer's attention before it may be approved or published.
 *
 * Rendering itself is never re-implemented: Enrollment pages are drawn by WordPress + Elementor, and
 * Main pages by the same WordPress + Elementor through the Render Bridge, so any widget that is
 * installed and active renders on both. What can differ per website is what happens AFTER the page
 * is drawn: browser code that calls back into WordPress (forms, carts, logins, live search) only works
 * on www.acadvizen.com for the endpoints the Main Website forwards (lib/wordpress/proxyPolicy.js).
 *
 * Classes (per widget type used, per destination):
 *   ok       renders and works there.
 *   review   renders; a reviewer must confirm a behaviour the system cannot check by itself
 *            (an add-on's interactive parts, content that differs per visitor, custom CSS/attributes).
 *   code     runs or injects markup/code an administrator typed (HTML, shortcode …): only a reviewer
 *            who may publish unfiltered HTML can accept it.
 *   blocked  cannot be reproduced there (widget not installed or not active, commerce or login on
 *            Main …): approval and publishing are refused, with the reason and the fix.
 *
 * New widgets need no code change here: an installed widget is classified by these rules; a widget
 * that needs a specific treatment is added to WIDGET_RULES (or with the acv_cms_widget_rules filter).
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const COMPAT_OK      = 'ok';
const COMPAT_REVIEW  = 'review';
const COMPAT_CODE    = 'code';
const COMPAT_BLOCKED = 'blocked';

/** Widgets that behave differently per website, or run typed code. Keyed by widget type or "prefix*". */
function widget_rules(): array {
	$rules = array(
		// Typed code or markup.
		'html'                  => array( 'all' => COMPAT_CODE, 'why' => 'HTML typed into the page (can contain scripts)' ),
		'shortcode'             => array( 'all' => COMPAT_CODE, 'why' => 'runs a WordPress shortcode' ),
		'code-highlight'        => array( 'all' => COMPAT_REVIEW, 'why' => 'shows code as text' ),
		'wp-widget-custom_html' => array( 'all' => COMPAT_CODE, 'why' => 'HTML typed into a WordPress widget' ),
		// Forms: their submissions are forwarded by the Main Website (proxyPolicy.js built-in rules).
		'form'                  => array( 'all' => COMPAT_OK, 'why' => 'Elementor Pro form (submissions forwarded to WordPress)' ),
		'mf-*'                  => array( 'all' => COMPAT_OK, 'why' => 'MetForm (submissions forwarded to WordPress)' ),
		'metform'               => array( 'all' => COMPAT_OK, 'why' => 'MetForm (submissions forwarded to WordPress)' ),
		// Work only where WordPress itself answers the visitor.
		'login'                 => array( 'main' => COMPAT_BLOCKED, 'why' => 'signs visitors in to WordPress, which is not the Main Website', 'fix' => 'link to the Enrollment login page instead' ),
		'woocommerce-*'         => array( 'main' => COMPAT_BLOCKED, 'why' => 'shop, cart and checkout run on the Enrollment website only', 'fix' => 'publish this page to Enrollment, or link to the shop there' ),
		'wc-*'                  => array( 'main' => COMPAT_BLOCKED, 'why' => 'shop, cart and checkout run on the Enrollment website only', 'fix' => 'publish this page to Enrollment, or link to the shop there' ),
		'shopengine-*'          => array( 'main' => COMPAT_BLOCKED, 'why' => 'shop, cart and checkout run on the Enrollment website only', 'fix' => 'publish this page to Enrollment, or link to the shop there' ),
		'search-form'           => array( 'main' => COMPAT_REVIEW, 'why' => 'searches the WordPress website, not the Main Website' ),
		'wp-widget-search'      => array( 'main' => COMPAT_REVIEW, 'why' => 'searches the WordPress website, not the Main Website' ),
		'sitemap'               => array( 'main' => COMPAT_REVIEW, 'why' => 'lists WordPress pages, not Main Website pages' ),
		'archive-posts'         => array( 'main' => COMPAT_REVIEW, 'why' => 'lists WordPress posts; on Main it shows them as they were at publishing time' ),
		'posts'                 => array( 'main' => COMPAT_REVIEW, 'why' => 'lists WordPress posts; on Main it shows them as they were at publishing time' ),
	);
	return (array) apply_filters( 'acv_cms_widget_rules', $rules );
}

/** Providers whose widgets are known to draw without calling back into WordPress for their basics. */
const KNOWN_PROVIDERS = array( 'elementor', 'elementor-pro', 'header-footer-elementor', 'essential-addons-for-elementor-lite', 'elementskit-lite', 'royal-elementor-addons', 'unlimited-elements-for-elementor', 'metform', 'timeline-widget-addon-for-elementor', 'cool-timeline', 'acadvizen-cms' );

/**
 * Every widget type a design uses (counted), plus page-level features worth a reviewer's look.
 * Pure: works on the decoded _elementor_data array.
 *
 * @return array{widgets: array<string,int>, features: string[]}
 */
function document_widget_usage( array $elements ): array {
	$widgets  = array();
	$features = array();
	$walk     = static function ( array $items ) use ( &$walk, &$widgets, &$features ): void {
		foreach ( $items as $element ) {
			if ( ! is_array( $element ) ) {
				continue;
			}
			if ( 'widget' === ( $element['elType'] ?? '' ) && '' !== (string) ( $element['widgetType'] ?? '' ) ) {
				$type             = (string) $element['widgetType'];
				$widgets[ $type ] = ( $widgets[ $type ] ?? 0 ) + 1;
			}
			$settings = is_array( $element['settings'] ?? null ) ? $element['settings'] : array();
			if ( ! empty( $settings['__dynamic__'] ) ) {
				$features['dynamic'] = 'dynamic content (filled in when the page is drawn)';
			}
			if ( '' !== trim( (string) ( $settings['custom_css'] ?? '' ) ) ) {
				$features['custom_css'] = 'custom CSS on an element';
			}
			if ( '' !== trim( (string) ( $settings['_attributes'] ?? '' ) ) ) {
				$features['attributes'] = 'custom HTML attributes on an element';
			}
			if ( ! empty( $settings['motion_fx_motion_fx_scrolling'] ) || ! empty( $settings['motion_fx_motion_fx_mouse'] ) ) {
				$features['motion_fx'] = 'motion effects (scrolling or mouse)';
			}
			if ( ! empty( $settings['_animation'] ) || ! empty( $settings['animation'] ) ) {
				$features['motion'] = 'animations or motion effects';
			}
			if ( ! empty( $element['elements'] ) && is_array( $element['elements'] ) ) {
				$walk( $element['elements'] );
			}
		}
	};
	$walk( $elements );
	ksort( $widgets );
	return array( 'widgets' => $widgets, 'features' => $features );
}

/** The rule for one widget type (exact name first, then "prefix*" rules). */
function widget_rule( string $type ): array {
	$rules = widget_rules();
	if ( isset( $rules[ $type ] ) ) {
		return $rules[ $type ];
	}
	foreach ( $rules as $key => $rule ) {
		if ( '*' === substr( $key, -1 ) && 0 === strpos( $type, substr( $key, 0, -1 ) ) ) {
			return $rule;
		}
	}
	return array();
}

/**
 * One widget type on one destination ('main' or 'enrollment').
 *
 * @param array|null $installed null when no active plugin registers the widget; else provider/version.
 * @return array{status: string, why: string, fix: string}
 */
function classify_widget( string $type, ?array $installed, string $destination ): array {
	if ( null === $installed ) {
		return array(
			'status' => COMPAT_BLOCKED,
			'why'    => sprintf( 'the "%s" widget is not available (its plugin is not installed or not active)', $type ),
			'fix'    => 'activate the plugin that provides it, or remove the widget from the design',
		);
	}
	$rule   = widget_rule( $type );
	$status = (string) ( $rule[ $destination ] ?? $rule['all'] ?? '' );
	if ( '' === $status ) {
		$provider = (string) ( $installed['provider'] ?? '' );
		$status   = 'main' === $destination && ! in_array( $provider, KNOWN_PROVIDERS, true ) ? COMPAT_REVIEW : COMPAT_OK;
		$rule     = COMPAT_REVIEW === $status ? array( 'why' => sprintf( 'from "%s": check its interactive parts in the Main preview', $provider ) ) : array();
	}
	return array( 'status' => $status, 'why' => (string) ( $rule['why'] ?? '' ), 'fix' => (string) ( $rule['fix'] ?? '' ) );
}

/** The worst of several classes (blocked > code > review > ok). */
function worst_compat( array $statuses ): string {
	foreach ( array( COMPAT_BLOCKED, COMPAT_CODE, COMPAT_REVIEW ) as $status ) {
		if ( in_array( $status, $statuses, true ) ) {
			return $status;
		}
	}
	return COMPAT_OK;
}

/**
 * Every widget registered on this WordPress, with the plugin that provides it.
 *
 * @return array<string, array{title: string, provider: string, version: string}>
 */
function installed_widgets(): array {
	static $cache = null;
	if ( null !== $cache ) {
		return $cache;
	}
	$cache = array();
	if ( ! class_exists( '\\Elementor\\Plugin' ) || ! isset( \Elementor\Plugin::$instance->widgets_manager ) ) {
		return $cache;
	}
	$plugins_dir = wp_normalize_path( WP_PLUGIN_DIR ) . '/';
	$versions    = array();
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}
	foreach ( get_plugins() as $file => $data ) {
		$versions[ dirname( $file ) ] = (string) ( $data['Version'] ?? '' );
	}
	foreach ( (array) \Elementor\Plugin::$instance->widgets_manager->get_widget_types() as $name => $widget ) {
		$file     = wp_normalize_path( (string) ( new \ReflectionClass( $widget ) )->getFileName() );
		$provider = 0 === strpos( $file, $plugins_dir ) ? strtok( substr( $file, strlen( $plugins_dir ) ), '/' ) : 'theme or custom code';
		$cache[ (string) $name ] = array(
			'title'    => method_exists( $widget, 'get_title' ) ? (string) $widget->get_title() : (string) $name,
			'provider' => (string) $provider,
			'version'  => (string) ( $versions[ $provider ] ?? '' ),
		);
	}
	return $cache;
}

/**
 * The compatibility report of one design for its destinations.
 *
 * @param array    $elements     decoded _elementor_data
 * @param string[] $destinations 'main' and/or 'enrollment'
 * @param array|null $installed  installed_widgets() (passed in by tests)
 * @return array{status: string, items: array, features: string[]}
 */
/** Element settings only Elementor Pro draws; without Pro they are ignored (the page shows without them). */
const PRO_ONLY_FEATURES = array(
	'custom_css' => 'custom CSS on an element',
	'attributes' => 'custom HTML attributes on an element',
	'motion_fx'  => 'motion effects (scrolling or mouse)',
);

function compatibility_report( array $elements, array $destinations, ?array $installed = null, ?bool $pro = null ): array {
	$installed = $installed ?? installed_widgets();
	$pro       = $pro ?? defined( 'ELEMENTOR_PRO_VERSION' );
	$usage     = document_widget_usage( $elements );
	$items     = array();
	$statuses  = array();
	foreach ( $usage['widgets'] as $type => $count ) {
		foreach ( $destinations as $destination ) {
			$verdict    = classify_widget( $type, $installed[ $type ] ?? null, $destination );
			$items[]    = array_merge( $verdict, array( 'widget' => $type, 'count' => $count, 'destination' => $destination, 'provider' => (string) ( $installed[ $type ]['provider'] ?? '' ), 'version' => (string) ( $installed[ $type ]['version'] ?? '' ) ) );
			$statuses[] = $verdict['status'];
		}
	}
	$features = $usage['features'];
	if ( in_array( 'main', $destinations, true ) && isset( $features['dynamic'] ) ) {
		$statuses[] = COMPAT_REVIEW; // On Main it shows as drawn at publishing time, not per visitor.
	}
	if ( isset( $features['custom_css'] ) || isset( $features['attributes'] ) || isset( $features['motion_fx'] ) ) {
		$statuses[] = COMPAT_REVIEW;
	}
	if ( ! $pro ) {
		// Never silent: say plainly which parts of the design will not show on either website.
		foreach ( PRO_ONLY_FEATURES as $key => $label ) {
			if ( isset( $features[ $key ] ) ) {
				$features[ $key ] = $label . ': NOT SHOWN, Elementor Pro is not active (the page appears without these styles)';
			}
		}
	}
	return array( 'status' => worst_compat( $statuses ), 'items' => $items, 'features' => array_values( $features ) );
}

/** Admin screen: every widget installed here and how each website handles it. */
function render_compatibility_page(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$labels = array(
		COMPAT_OK      => __( 'Works', 'acadvizen-cms' ),
		COMPAT_REVIEW  => __( 'Works; reviewer checks it', 'acadvizen-cms' ),
		COMPAT_CODE    => __( 'Typed code: reviewer with code rights only', 'acadvizen-cms' ),
		COMPAT_BLOCKED => __( 'Cannot be published there', 'acadvizen-cms' ),
	);
	echo '<div class="wrap"><h1>' . esc_html__( 'Widget compatibility', 'acadvizen-cms' ) . '</h1>';
	echo '<p>' . esc_html__( 'Every Elementor widget installed on this WordPress and what happens when a design that uses it is published. Both websites are drawn by this WordPress and Elementor, so any installed widget looks the same on both; the difference is what works after the page is drawn (forms, carts, sign-in, search).', 'acadvizen-cms' ) . '</p>';
	echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'Widget', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Plugin (version)', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Enrollment website', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Main website', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Why', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( installed_widgets() as $type => $info ) {
		$e = classify_widget( $type, $info, 'enrollment' );
		$m = classify_widget( $type, $info, 'main' );
		printf(
			'<tr><td><strong>%1$s</strong><br /><code>%2$s</code></td><td>%3$s %4$s</td><td>%5$s</td><td>%6$s</td><td>%7$s</td></tr>',
			esc_html( $info['title'] ),
			esc_html( $type ),
			esc_html( $info['provider'] ),
			esc_html( '' !== $info['version'] ? '(' . $info['version'] . ')' : '' ),
			esc_html( $labels[ $e['status'] ] ),
			esc_html( $labels[ $m['status'] ] ),
			esc_html( trim( $m['why'] . ( '' !== $m['fix'] ? ' — ' . $m['fix'] : '' ) ) )
		);
	}
	echo '</tbody></table></div>';
}

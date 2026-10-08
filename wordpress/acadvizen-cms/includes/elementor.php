<?php
/**
 * Elementor editor integration: a "Publish To" section in Elementor's own Page Settings panel
 * (gear icon), so administrators choose the website without leaving Elementor. The value is
 * stored as normal Elementor page settings and mirrored to post meta in publisher.php.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const ELEMENTOR_TARGET_SETTING = 'acv_publish_target';

function register_elementor_controls( $document ): void {
	if ( ! class_exists( '\\Elementor\\Controls_Manager' ) || ! is_object( $document ) || ! method_exists( $document, 'get_main_id' ) ) {
		return;
	}
	$post = get_post( (int) $document->get_main_id() );
	if ( ! $post instanceof \WP_Post || ( ! is_site_post_type( $post->post_type ) && ! is_template_post_type( $post->post_type ) ) ) {
		return;
	}

	$is_template = is_template_post_type( $post->post_type );
	$document->start_controls_section(
		'acv_publish_section',
		array(
			'label' => __( 'Publish To (Acadvizen)', 'acadvizen-cms' ),
			'tab'   => \Elementor\Controls_Manager::TAB_SETTINGS,
		)
	);
	$document->add_control(
		ELEMENTOR_TARGET_SETTING,
		array(
			'label'   => $is_template ? __( 'Use this template on', 'acadvizen-cms' ) : __( 'Website', 'acadvizen-cms' ),
			'type'    => \Elementor\Controls_Manager::SELECT,
			'options' => target_labels(),
			'default' => get_publish_target( $post->ID ),
		)
	);
	$document->add_control(
		'acv_publish_help',
		array(
			'type' => \Elementor\Controls_Manager::RAW_HTML,
			'raw'  => wp_kses_post( $is_template ? template_target_help() : site_target_help( $post ) ),
		)
	);
	$document->end_controls_section();
}

function site_target_help( \WP_Post $post ): string {
	$path = main_path_for( $post );
	$html = '<p>' . esc_html__( 'Enrollment: shown on enroll.acadvizen.com only. Main: shown on www.acadvizen.com only. Both: shown on both websites.', 'acadvizen-cms' ) . '</p>';
	if ( '' !== $path && is_configured() ) {
		$html .= '<p>' . esc_html__( 'Main Website address:', 'acadvizen-cms' ) . ' <code>' . esc_html( main_url_for_path( $path ) ) . '</code></p>';
	}
	$html .= '<p>' . esc_html__( 'After you click Publish or Update, the Main Website updates automatically within about a minute. Check the status under Acadvizen Master Admin → Publishing.', 'acadvizen-cms' ) . '</p>';
	return $html;
}

function template_target_help(): string {
	return '<p>' . esc_html__( 'Choose where this header, footer or template is used. "Both Websites" keeps today\'s behaviour. Changing a template republishes every Main Website page automatically.', 'acadvizen-cms' ) . '</p>';
}

/**
 * Lets courses and locations be designed with Elementor like pages.
 */
function enable_elementor_for_content_types(): void {
	foreach ( array( 'acv_course', 'acv_location', 'acv_tool', 'acv_blog' ) as $post_type ) {
		add_post_type_support( $post_type, 'elementor' );
	}
}

/**
 * Master Admin > Global Styles opens an Elementor page with "acv-open=global-styles": open Site
 * Settings > Global Colors once the editor can open it (Elementor 4 ignores its own "#e:run:" link;
 * the panel cannot open until the editor has fully started, so it is retried every 6 seconds).
 */
function enqueue_editor_helpers(): void {
	wp_add_inline_script( 'elementor-editor', EDITOR_OPEN_GLOBAL_STYLES_JS );
}

const EDITOR_OPEN_GLOBAL_STYLES_JS = '(function(){if(!/[?&]acv-open=global-styles(&|$)/.test(location.search))return;var n=0,t=setInterval(function(){n++;try{var d=window.elementor&&elementor.documents&&elementor.documents.getCurrent&&elementor.documents.getCurrent();if(d&&d.config&&d.config.type==="kit"){clearInterval(t);setTimeout(function(){try{$e.route("panel/global/global-colors")}catch(e){}},800);return}if(window.$e&&d&&elementor.getPanelView&&elementor.getPanelView().getCurrentPageView&&n%12===0){$e.run("panel/global/open")}}catch(e){}if(n>360)clearInterval(t)},500)})();';

<?php
/**
 * Admin screens: the "Acadvizen CMS" menu, list columns, status badges, notices and Retry.
 *
 * Everything here is admin-only; nothing is loaded on the public Enrollment website.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The ordinary WordPress admin is the editing experience: Pages, Posts-like content types (Main Blogs, Courses,
 * Locations, Tools, FAQs, Testimonials: their own top-level menus, see standard_menu_args()), Media, Menus,
 * Templates and Elementor stay where WordPress and Elementor put them, and "Publish To" is chosen in Elementor's
 * Page Settings. This menu only holds what WordPress itself has no screen for: Approvals (the review queue),
 * Publishing status, Versions & Rollback, Main's own content screens and, for administrators, the design and
 * setup tools. Its old Dashboard page stays reachable at its address (links and tools use it) but is not listed.
 */
function register_admin_menu(): void {
	add_menu_page(
		__( 'Approvals & Publishing', 'acadvizen-cms' ),
		__( 'Approvals & Publishing', 'acadvizen-cms' ),
		'edit_posts',
		MENU_SLUG,
		__NAMESPACE__ . '\render_dashboard_page',
		'dashicons-yes-alt',
		3
	);
	// Screen hooks are named after the menu title ("load-acadvizen-master-admin_page_…"); code that hooks into these
	// screens (e.g. the stalled-publish repair in acadvizen-cms.php) keeps working with the new label.
	$GLOBALS['admin_page_hooks'][ MENU_SLUG ] = 'acadvizen-master-admin'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	add_submenu_page( MENU_SLUG, __( 'Overview', 'acadvizen-cms' ), __( 'Overview', 'acadvizen-cms' ), 'edit_posts', MENU_SLUG, __NAMESPACE__ . '\render_dashboard_page' );

	$native = native_publishing_ui();
	if ( $native ) {
		add_submenu_page( MENU_SLUG, __( 'Publishing', 'acadvizen-cms' ), __( 'Publishing status', 'acadvizen-cms' ), 'edit_pages', MENU_SLUG . '-publishing', __NAMESPACE__ . '\render_publishing_page' );
		add_submenu_page( MENU_SLUG, __( 'Versions & Rollback', 'acadvizen-cms' ), __( 'Versions & Rollback', 'acadvizen-cms' ), 'edit_pages', MENU_SLUG . '-versions', __NAMESPACE__ . '\render_versions_page' );
	}
	// Elementor's Site Settings change both websites: an administrator's tool, not an everyday menu item.
	if ( (int) get_option( 'elementor_active_kit' ) ) {
		add_submenu_page( MENU_SLUG, __( 'Global Styles (both websites)', 'acadvizen-cms' ), __( 'Global Styles (both websites)', 'acadvizen-cms' ), 'manage_options', global_styles_url() );
	}
	if ( $native ) {
		add_submenu_page( MENU_SLUG, __( 'Website Design', 'acadvizen-cms' ), __( 'Website Design', 'acadvizen-cms' ), 'manage_options', MENU_SLUG . '-design', __NAMESPACE__ . 'ender_design_page' );
		add_submenu_page( MENU_SLUG, __( 'Import Main Website', 'acadvizen-cms' ), __( 'Import Main Website', 'acadvizen-cms' ), 'manage_options', MENU_SLUG . '-import', __NAMESPACE__ . 'ender_import_page' );
	}
	add_submenu_page( MENU_SLUG, __( 'Settings', 'acadvizen-cms' ), __( 'Settings', 'acadvizen-cms' ), 'manage_options', MENU_SLUG . '-settings', __NAMESPACE__ . '\render_settings_page' );
}

/**
 * Menu arguments that give a content type its own top-level WordPress menu, next to Pages, like Posts:
 * the ordinary place a WordPress user looks for it (its categories / areas appear under it automatically).
 */
function standard_menu_args( string $post_type ): array {
	$menus = array(
		POST_TYPE         => array( 'dashicons-welcome-write-blog', '20.1' ),
		'acv_course'      => array( 'dashicons-welcome-learn-more', '20.2' ),
		'acv_location'    => array( 'dashicons-location', '20.3' ),
		'acv_tool'        => array( 'dashicons-admin-tools', '20.4' ),
		'acv_faq'         => array( 'dashicons-editor-help', '20.5' ),
		'acv_testimonial' => array( 'dashicons-format-quote', '20.6' ),
	);
	list( $icon, $position ) = $menus[ $post_type ] ?? array( 'dashicons-admin-page', null );
	return array_filter( array( 'show_in_menu' => true, 'menu_icon' => $icon, 'menu_position' => $position ), static fn( $v ) => null !== $v );
}

/**
 * Elementor Site Settings (global colours & fonts) the way Elementor's own menu opens them: an
 * Elementor page in the editor with the Site Settings panel open. Opening the kit itself as the
 * edited document cannot be saved in Elementor 4 (its save fails in the editor).
 */
/**
 * Site Settings (global colours and fonts) open in Elementor over a page. A big page (the Main
 * homepage has hundreds of elements) takes minutes to load in the editor, so Global Styles uses a
 * small private page made for it: never published, on neither website.
 */
const GLOBAL_STYLES_CANVAS_OPTION = 'acv_cms_global_styles_canvas';

function global_styles_canvas_id(): int {
	$id = (int) get_option( GLOBAL_STYLES_CANVAS_OPTION, 0 );
	if ( $id && 'page' === get_post_type( $id ) && 'private' === get_post_status( $id ) ) {
		return $id;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return 0;
	}
	$id = wp_insert_post(
		array(
			'post_type'   => 'page',
			'post_status' => 'private',
			'post_title'  => __( 'Global Styles (editing page, never published)', 'acadvizen-cms' ),
		),
		true
	);
	if ( is_wp_error( $id ) ) {
		return 0;
	}
	$sample = array(
		array(
			'id'       => 'acvgs01',
			'elType'   => 'container',
			'settings' => array( 'content_width' => 'boxed', 'padding' => array( 'unit' => 'px', 'top' => '40', 'right' => '20', 'bottom' => '40', 'left' => '20', 'isLinked' => false ) ),
			'elements' => array(
				array( 'id' => 'acvgs02', 'elType' => 'widget', 'widgetType' => 'heading', 'settings' => array( 'title' => __( 'Global colours and fonts', 'acadvizen-cms' ) ), 'elements' => array() ),
				array( 'id' => 'acvgs03', 'elType' => 'widget', 'widgetType' => 'text-editor', 'settings' => array( 'editor' => '<p>' . esc_html__( 'Change colours and fonts in Site Settings on the left, then click Publish. The changes apply to every page that uses them, on both websites. This page itself is never published.', 'acadvizen-cms' ) . '</p>' ), 'elements' => array() ),
			),
		),
	);
	update_post_meta( $id, '_elementor_edit_mode', 'builder' );
	update_post_meta( $id, '_elementor_template_type', 'wp-page' );
	update_post_meta( $id, '_elementor_data', wp_slash( (string) wp_json_encode( $sample ) ) );
	update_post_meta( $id, '_wp_page_template', 'elementor_header_footer' );
	update_option( GLOBAL_STYLES_CANVAS_OPTION, (int) $id, false );
	return (int) $id;
}

/** The Global Styles page stays private, whatever button saves it in Elementor. */
function keep_global_styles_canvas_private( array $data, array $postarr ): array {
	$id = (int) ( $postarr['ID'] ?? 0 );
	if ( $id && $id === (int) get_option( GLOBAL_STYLES_CANVAS_OPTION, 0 ) && 'trash' !== ( $data['post_status'] ?? '' ) ) {
		$data['post_status'] = 'private';
	}
	return $data;
}

/**
 * 'load-post.php': opening Global Styles drops the editing page's autosave. Elementor otherwise
 * shows "This is just a draft…" over the bottom of the panel - on top of Site Settings' own
 * Save Changes button. The page only hosts Site Settings, so an autosave of it holds nothing.
 */
function forget_global_styles_canvas_autosave(): void {
	$post_id = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! $post_id || 'global-styles' !== ( $_GET['acv-open'] ?? '' ) || $post_id !== (int) get_option( GLOBAL_STYLES_CANVAS_OPTION, 0 ) || ! current_user_can( 'edit_post', $post_id ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	foreach ( wp_get_post_revisions( $post_id, array( 'check_enabled' => false ) ) as $revision ) {
		if ( wp_is_post_autosave( $revision ) ) {
			wp_delete_post_revision( $revision->ID );
		}
	}
}

function global_styles_url(): string {
	$canvas = global_styles_canvas_id();
	if ( $canvas ) {
		return global_styles_url_for( $canvas, (int) get_option( 'elementor_active_kit' ) );
	}
	$recent = get_posts(
		array(
			'post_type'        => 'page',
			'post_status'      => 'publish',
			'posts_per_page'   => 1,
			'orderby'          => 'modified',
			'order'            => 'DESC',
			'fields'           => 'ids',
			'no_found_rows'    => true,
			'suppress_filters' => true,
			'meta_query'       => array( array( 'key' => '_elementor_edit_mode', 'value' => 'builder' ) ),
		)
	);
	return global_styles_url_for( $recent ? (int) $recent[0] : 0, (int) get_option( 'elementor_active_kit' ) );
}

function global_styles_url_for( int $page_id, int $kit_id ): string {
	return $page_id
		? 'post.php?post=' . $page_id . '&action=elementor&acv-open=global-styles'
		: 'post.php?post=' . $kit_id . '&action=elementor';
}

/**
 * WordPress adds the content types' own menu items after everything above, so they would land
 * below Settings. Group the menu by task instead: content, design, publishing, settings.
 */
function order_admin_menu(): void {
	global $submenu;
	if ( ! empty( $submenu[ MENU_SLUG ] ) ) {
		$global_styles = '';
		foreach ( $submenu[ MENU_SLUG ] as $row ) {
			if ( false !== strpos( (string) ( $row[2] ?? '' ), 'action=elementor' ) ) {
				$global_styles = (string) $row[2];
			}
		}
		$rows = sorted_submenu( $submenu[ MENU_SLUG ], admin_menu_order( $global_styles ) );
		// With Approvals listed, the old overview page leaves the menu (its address keeps working) and the top-level
		// "Approvals & Publishing" link opens Approvals, the first item.
		if ( array_filter( $rows, static fn( $r ) => APPROVALS_PAGE === ( $r[2] ?? '' ) ) ) {
			$rows = array_values( array_filter( $rows, static fn( $r ) => MENU_SLUG !== ( $r[2] ?? '' ) ) );
		}
		$submenu[ MENU_SLUG ] = $rows; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
	}
}

/** Menu slugs in display order ($global_styles: the Global Styles link, which varies). */
function admin_menu_order( string $global_styles = '' ): array {
	return array(
		APPROVALS_PAGE,
		MENU_SLUG . '-publishing',
		MENU_SLUG . '-versions',
		MAIN_CONTENT_PAGE,
		$global_styles,
		MENU_SLUG . '-design',
		COMPAT_PAGE,
		MENU_SLUG . '-import',
		MENU_SLUG . '-settings',
		MENU_SLUG,
	);
}

/**
 * Sorts submenu rows (WordPress format: [label, capability, slug, ...]) by $order; rows whose slug
 * is not listed keep their relative order after the listed ones.
 */
function sorted_submenu( array $items, array $order ): array {
	$rank = array_flip( array_values( $order ) );
	$rows = array_values( $items );
	$keys = array_keys( $rows );
	usort(
		$keys,
		static function ( $a, $b ) use ( $rows, $rank ) {
			$ra = $rank[ $rows[ $a ][2] ?? '' ] ?? PHP_INT_MAX;
			$rb = $rank[ $rows[ $b ][2] ?? '' ] ?? PHP_INT_MAX;
			return $ra === $rb ? $a <=> $b : $ra <=> $rb;
		}
	);
	return array_map( static fn( $k ) => $rows[ $k ], $keys );
}

function is_plugin_screen(): bool {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen ) {
		return false;
	}
	$types = array_merge( array( POST_TYPE, 'acv_faq', 'acv_testimonial', 'acv_tool' ), SITE_POST_TYPES, TEMPLATE_POST_TYPES );
	return in_array( $screen->post_type, $types, true ) || false !== strpos( $screen->id, MENU_SLUG );
}

function enqueue_admin_assets(): void {
	if ( is_plugin_screen() ) {
		wp_enqueue_style( 'acadvizen-cms-admin', plugins_url( 'assets/admin.css', __DIR__ ), array(), VERSION );
	}
}

function render_dashboard_page(): void {
	if ( ! current_user_can( 'edit_posts' ) ) {
		return;
	}
	if ( ! native_publishing_ui() ) {
		render_content_api_dashboard();
		return;
	}
	$live     = list_live_versions();
	$failed   = get_posts(
		array(
			'post_type'      => SITE_POST_TYPES,
			'post_status'    => 'any',
			'posts_per_page' => 20,
			'fields'         => 'ids',
			'meta_query'     => array( array( 'key' => META_MAIN_STATE, 'value' => STATE_FAILED ) ),
		)
	);
	$cards    = array(
		array( __( 'Pages', 'acadvizen-cms' ), 'edit.php?post_type=page', 'post-new.php?post_type=page', __( 'Design pages with Elementor and choose the website.', 'acadvizen-cms' ) ),
		array( __( 'Blogs', 'acadvizen-cms' ), 'edit.php?post_type=' . POST_TYPE, 'post-new.php?post_type=' . POST_TYPE, __( 'Articles for www.acadvizen.com/blog.', 'acadvizen-cms' ) ),
		array( __( 'Courses', 'acadvizen-cms' ), 'edit.php?post_type=acv_course', 'post-new.php?post_type=acv_course', __( 'Course pages with details, designed in Elementor.', 'acadvizen-cms' ) ),
		array( __( 'Locations', 'acadvizen-cms' ), 'edit.php?post_type=acv_location', 'post-new.php?post_type=acv_location', __( 'Centre / area pages, organised by city.', 'acadvizen-cms' ) ),
	);
	?>
	<div class="wrap acv-cms-dashboard">
		<h1><?php esc_html_e( 'Acadvizen Master Admin', 'acadvizen-cms' ); ?></h1>
		<p class="acv-cms-lead"><?php esc_html_e( 'Manage both websites from here. Design with Elementor as usual, then choose "Publish To": Enrollment Website (enroll.acadvizen.com), Main Website (www.acadvizen.com) or Both. Clicking Publish or Update does the rest.', 'acadvizen-cms' ); ?></p>

		<?php if ( ! is_configured() && current_user_can( 'manage_options' ) ) : ?>
			<div class="notice notice-warning inline"><p><?php esc_html_e( 'The connection to the Main Website is not set up yet, so nothing can be published there. Please contact your developer.', 'acadvizen-cms' ); ?></p></div>
		<?php endif; ?>
		<?php if ( $failed ) : ?>
			<div class="notice notice-error inline"><p>
				<?php
				/* translators: %d: number of pages */
				echo esc_html( sprintf( _n( '%d page could not be published to the Main Website.', '%d pages could not be published to the Main Website.', count( $failed ), 'acadvizen-cms' ), count( $failed ) ) );
				?>
				<a href="<?php echo esc_url( admin_url( 'admin.php?page=' . MENU_SLUG . '-publishing' ) ); ?>"><?php esc_html_e( 'See Publishing', 'acadvizen-cms' ); ?></a>
			</p></div>
		<?php endif; ?>

		<div class="acv-cms-cards">
			<?php foreach ( $cards as list( $title, $list_url, $new_url, $text ) ) : ?>
				<div class="acv-cms-card">
					<h2><?php echo esc_html( $title ); ?></h2>
					<p><?php echo esc_html( $text ); ?></p>
					<p>
						<a class="button button-primary" href="<?php echo esc_url( admin_url( $new_url ) ); ?>"><?php esc_html_e( 'Add new', 'acadvizen-cms' ); ?></a>
						<a class="button" href="<?php echo esc_url( admin_url( $list_url ) ); ?>"><?php esc_html_e( 'See all', 'acadvizen-cms' ); ?></a>
					</p>
				</div>
			<?php endforeach; ?>
			<div class="acv-cms-card">
				<h2><?php esc_html_e( 'Main Website', 'acadvizen-cms' ); ?></h2>
				<p>
					<?php
					/* translators: %d: number of pages */
					echo esc_html( sprintf( _n( '%d page designed here is live on www.acadvizen.com.', '%d pages designed here are live on www.acadvizen.com.', count( $live ), 'acadvizen-cms' ), count( $live ) ) );
					?>
				</p>
				<p><a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=' . MENU_SLUG . '-publishing' ) ); ?>"><?php esc_html_e( 'Publishing status', 'acadvizen-cms' ); ?></a></p>
			</div>
		</div>

		<div class="acv-cms-card acv-cms-wide">
			<h2><?php esc_html_e( 'What "Publish To" means', 'acadvizen-cms' ); ?></h2>
			<ul>
				<li><strong><?php esc_html_e( 'Enrollment Website', 'acadvizen-cms' ); ?></strong> &mdash; <?php esc_html_e( 'shown on enroll.acadvizen.com only (this is how every existing page works today).', 'acadvizen-cms' ); ?></li>
				<li><strong><?php esc_html_e( 'Main Website', 'acadvizen-cms' ); ?></strong> &mdash; <?php esc_html_e( 'shown on www.acadvizen.com only, exactly as designed in Elementor.', 'acadvizen-cms' ); ?></li>
				<li><strong><?php esc_html_e( 'Both Websites', 'acadvizen-cms' ); ?></strong> &mdash; <?php esc_html_e( 'shown on both websites. You design it once.', 'acadvizen-cms' ); ?></li>
			</ul>
			<p class="description"><?php esc_html_e( 'Global colours, fonts, headers, footers, menus and templates are shared: when you change them, every Main Website page is republished automatically.', 'acadvizen-cms' ); ?></p>
			<p class="description"><?php echo esc_html( affected_pages_summary( array_column( list_live_versions(), 'main_path' ) ) ); ?></p>
		</div>
	</div>
	<?php
}

/**
 * The dashboard while the Render Bridge is off (the Main Website does not read WordPress pages):
 * only what works in that mode. Main Website content is edited on the Main Website screens, blogs
 * in Posts ("Publish To" chooses the website), Enrollment pages with Elementor as before. The
 * Elementor-for-Main screens (Publish To on pages, Publishing, Versions, Website Design) are hidden
 * in this mode, so nothing here links to them.
 */
function render_content_api_dashboard(): void {
	$cards = array(
		array( __( 'Main Website', 'acadvizen-cms' ), __( 'The content of www.acadvizen.com: pages, homepage, courses, city pages, header, footer, menus, media and SEO.', 'acadvizen-cms' ), array( array( __( 'Open', 'acadvizen-cms' ), 'admin.php?page=' . MAIN_CONTENT_PAGE, true ) ) ),
		array( __( 'Blogs', 'acadvizen-cms' ), __( 'Write in Posts. "Publish To" on each post chooses the Enrollment Website, the Main Website or Both.', 'acadvizen-cms' ), array( array( __( 'Add new', 'acadvizen-cms' ), 'post-new.php', true ), array( __( 'See all', 'acadvizen-cms' ), 'edit.php', false ) ) ),
		array( __( 'Enrollment pages', 'acadvizen-cms' ), __( 'Pages of enroll.acadvizen.com, designed with Elementor as before.', 'acadvizen-cms' ), array( array( __( 'Add new', 'acadvizen-cms' ), 'post-new.php?post_type=page', true ), array( __( 'See all', 'acadvizen-cms' ), 'edit.php?post_type=page', false ) ) ),
	);
	if ( approval_enabled() ) {
		$cards[] = array( __( 'Approvals', 'acadvizen-cms' ), __( 'Changes waiting for a reviewer, and what was published.', 'acadvizen-cms' ), array( array( __( 'Open', 'acadvizen-cms' ), 'admin.php?page=' . APPROVALS_PAGE, true ) ) );
	}
	?>
	<div class="wrap acv-cms-dashboard">
		<h1><?php esc_html_e( 'Acadvizen Master Admin', 'acadvizen-cms' ); ?></h1>
		<p class="acv-cms-lead"><?php esc_html_e( 'Manage both websites from here. The Main Website (www.acadvizen.com) is edited under Main Website; blogs in Posts, where "Publish To" chooses the website; Enrollment pages with Elementor as before.', 'acadvizen-cms' ); ?></p>
		<?php if ( ! is_configured() && current_user_can( 'manage_options' ) ) : ?>
			<div class="notice notice-warning inline"><p><?php esc_html_e( 'The connection to the Main Website is not set up yet, so nothing can be published there. Please contact your developer.', 'acadvizen-cms' ); ?></p></div>
		<?php endif; ?>
		<div class="acv-cms-cards">
			<?php foreach ( $cards as list( $title, $text, $buttons ) ) : ?>
				<div class="acv-cms-card">
					<h2><?php echo esc_html( $title ); ?></h2>
					<p><?php echo esc_html( $text ); ?></p>
					<p>
						<?php foreach ( $buttons as list( $label, $url, $primary ) ) : ?>
							<a class="button<?php echo $primary ? ' button-primary' : ''; ?>" href="<?php echo esc_url( admin_url( $url ) ); ?>"><?php echo esc_html( $label ); ?></a>
						<?php endforeach; ?>
					</p>
				</div>
			<?php endforeach; ?>
		</div>
	</div>
	<?php
}

function render_sync_log(): void {
	$log = get_option( LOG_OPTION, array() );
	if ( ! is_array( $log ) || ! $log ) {
		echo '<p>' . esc_html__( 'No updates sent yet.', 'acadvizen-cms' ) . '</p>';
		return;
	}
	$labels = array(
		'ok'              => __( 'Main Website updated', 'acadvizen-cms' ),
		'retry_scheduled' => __( 'Failed, will retry automatically', 'acadvizen-cms' ),
		'failed'          => __( 'Failed', 'acadvizen-cms' ),
		'not_configured'  => __( 'Connection not set up', 'acadvizen-cms' ),
	);
	?>
	<table class="widefat striped">
		<thead><tr>
			<th><?php esc_html_e( 'When', 'acadvizen-cms' ); ?></th>
			<th><?php esc_html_e( 'Blog address', 'acadvizen-cms' ); ?></th>
			<th><?php esc_html_e( 'Change', 'acadvizen-cms' ); ?></th>
			<th><?php esc_html_e( 'Result', 'acadvizen-cms' ); ?></th>
			<th><?php esc_html_e( 'Technical detail (for developers)', 'acadvizen-cms' ); ?></th>
		</tr></thead>
		<tbody>
		<?php foreach ( $log as $entry ) : ?>
			<tr>
				<td><?php echo esc_html( wp_date( 'j M Y, H:i', (int) $entry['time'] ) ); ?></td>
				<td><code>/blog/<?php echo esc_html( $entry['slug'] ); ?></code></td>
				<td><?php echo esc_html( 'remove' === $entry['action'] ? __( 'Removed from Main', 'acadvizen-cms' ) : __( 'Published / updated', 'acadvizen-cms' ) ); ?></td>
				<td><?php echo esc_html( $labels[ $entry['outcome'] ] ?? $entry['outcome'] ); ?></td>
				<td><code><?php echo esc_html( $entry['detail'] ); ?></code></td>
			</tr>
		<?php endforeach; ?>
		</tbody>
	</table>
	<?php
}

/**
 * Plain-language status for one blog. Used in the list column and the edit screen.
 */
function render_status_badge( \WP_Post $post ): void {
	$target      = get_publish_target( $post->ID );
	$status      = (string) get_post_meta( $post->ID, META_SYNC_STATUS, true );
	$slug_status = get_post_meta( $post->ID, META_SLUG_STATUS, true );
	$conflict    = is_array( $slug_status ) && ! empty( $slug_status['conflict'] ) && ( $slug_status['slug'] ?? '' ) === $post->post_name;

	if ( 'publish' !== $post->post_status ) {
		$badge = array( 'muted', __( 'Not published yet', 'acadvizen-cms' ) );
	} elseif ( TARGET_ENROLLMENT === $target && '' === $status ) {
		$badge = array( 'ok', __( '✓ Saved for Enrollment (not shown on any existing Enrollment page)', 'acadvizen-cms' ) );
	} elseif ( targets_main( $target ) && ! is_main_compatible_slug( $post->post_name ) ) {
		$badge = array( 'error', __( '⚠ The Slug can only use lowercase letters, numbers and hyphens', 'acadvizen-cms' ) );
	} elseif ( targets_main( $target ) && $conflict ) {
		$badge = array( 'error', __( '⚠ Web address already used on Main Website, not shown there', 'acadvizen-cms' ) );
	} elseif ( STATUS_NOT_CONFIGURED === $status ) {
		$badge = array( 'error', __( '⚠ Main Website connection not set up (contact your developer)', 'acadvizen-cms' ) );
	} elseif ( STATUS_FAILED === $status ) {
		$badge = array( 'error', __( '⚠ Main Website update failed', 'acadvizen-cms' ) );
	} elseif ( STATUS_PENDING === $status ) {
		$badge = array( 'pending', __( '… Updating Main Website', 'acadvizen-cms' ) );
	} elseif ( STATUS_SYNCED === $status && targets_main( $target ) ) {
		$badge = array( 'ok', __( '✓ Live on Main Website', 'acadvizen-cms' ) );
	} elseif ( STATUS_SYNCED === $status ) {
		$badge = array( 'ok', __( '✓ Removed from Main Website', 'acadvizen-cms' ) );
	} else {
		$badge = array( 'muted', __( 'Not on Main Website', 'acadvizen-cms' ) );
	}

	printf( '<span class="acv-cms-badge acv-cms-badge--%1$s">%2$s</span>', esc_attr( $badge[0] ), esc_html( $badge[1] ) );

	if ( in_array( $status, array( STATUS_FAILED, STATUS_PENDING ), true ) && current_user_can( 'edit_post', $post->ID ) ) {
		printf(
			' <a class="button button-small" href="%1$s">%2$s</a>',
			esc_url( retry_url( $post->ID ) ),
			esc_html__( 'Retry', 'acadvizen-cms' )
		);
	}
}

function retry_url( int $post_id ): string {
	return wp_nonce_url( admin_url( 'admin-post.php?action=acv_cms_retry_sync&post_id=' . $post_id ), 'acv_cms_retry_' . $post_id );
}

function handle_retry_request(): void {
	$post_id = isset( $_GET['post_id'] ) ? absint( $_GET['post_id'] ) : 0;
	check_admin_referer( 'acv_cms_retry_' . $post_id );
	$post = get_post( $post_id );
	if ( ! $post || POST_TYPE !== $post->post_type || ! current_user_can( 'edit_post', $post_id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	queue_sync( $post_id );
	// Without a referrer: the blog list that exists in this mode (Posts while the Render Bridge is off).
	$back = wp_get_referer() ? wp_get_referer() : admin_url( native_publishing_ui() ? 'edit.php?post_type=' . POST_TYPE : 'edit.php' );
	wp_safe_redirect( add_query_arg( 'acv_cms_retried', '1', $back ) );
	exit;
}

function list_columns( array $columns ): array {
	$date = $columns['date'] ?? null;
	unset( $columns['date'] );
	$columns['acv_publish_to'] = __( 'Publish To', 'acadvizen-cms' );
	$columns['acv_main_status'] = __( 'Main Website', 'acadvizen-cms' );
	if ( $date ) {
		$columns['date'] = $date;
	}
	return $columns;
}

function render_list_column( string $column, int $post_id ): void {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return;
	}
	if ( 'acv_publish_to' === $column ) {
		$labels = array(
			TARGET_MAIN       => __( 'Main Website', 'acadvizen-cms' ),
			TARGET_ENROLLMENT => __( 'Enrollment Website', 'acadvizen-cms' ),
			TARGET_BOTH       => __( 'Both Websites', 'acadvizen-cms' ),
		);
		echo esc_html( $labels[ get_publish_target( $post_id ) ] );
	} elseif ( 'acv_main_status' === $column ) {
		render_status_badge( $post );
	}
}

/**
 * Prominent warnings on the blog edit screen and list.
 */
function render_admin_notices(): void {
	if ( ! is_plugin_screen() ) {
		return;
	}

	if ( isset( $_GET['acv_cms_retried'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		echo '<div class="notice notice-info is-dismissible"><p>' . esc_html__( 'Trying the Main Website update again. Refresh this page in a minute to see the result.', 'acadvizen-cms' ) . '</p></div>';
	}

	$screen = get_current_screen();
	if ( ! $screen || 'post' !== $screen->base ) {
		return;
	}
	$post = get_post();
	if ( ! $post || POST_TYPE !== $post->post_type || 'publish' !== $post->post_status || ! targets_main( get_publish_target( $post->ID ) ) ) {
		return;
	}

	$address     = '/blog/' . $post->post_name;
	$slug_status = get_post_meta( $post->ID, META_SLUG_STATUS, true );
	$is_current  = is_array( $slug_status ) && ( $slug_status['slug'] ?? '' ) === $post->post_name;

	if ( ! is_main_compatible_slug( $post->post_name ) ) {
		printf(
			'<div class="notice notice-error acv-cms-notice"><p><strong>%1$s</strong> %2$s</p></div>',
			esc_html__( 'This blog is not shown on the Main Website.', 'acadvizen-cms' ),
			esc_html__( 'Its Slug may only contain lowercase letters (a–z), numbers and hyphens. Please edit the Slug box below and click Update.', 'acadvizen-cms' )
		);
	} elseif ( $is_current && ! empty( $slug_status['conflict'] ) ) {
		$reasons = array(
			'existing_blog'  => __( 'An existing blog on the Main Website already uses this address.', 'acadvizen-cms' ),
			'existing_draft' => __( 'An unpublished blog on the Main Website already uses this address, so it stays reserved for that blog.', 'acadvizen-cms' ),
			'redirect'       => __( 'This address on the Main Website already forwards visitors to another page.', 'acadvizen-cms' ),
			'reserved'       => __( 'This address is reserved by the Main Website.', 'acadvizen-cms' ),
			'alias'          => __( 'This address already points to another blog on the Main Website.', 'acadvizen-cms' ),
		);
		printf(
			'<div class="notice notice-error acv-cms-notice acv-cms-notice--conflict"><p><strong>%1$s</strong></p><p>%2$s %3$s</p><p>%4$s</p></div>',
			/* translators: %s: blog address such as /blog/my-post */
			esc_html( sprintf( __( 'Web address %s is already used on the Main Website.', 'acadvizen-cms' ), $address ) ),
			esc_html( $reasons[ $slug_status['reason'] ?? '' ] ?? $reasons['existing_blog'] ),
			esc_html__( 'The existing Main Website page stays as it is, and this blog will NOT be shown there.', 'acadvizen-cms' ),
			esc_html__( 'To show this blog on the Main Website, change its Slug (box below) to something unique and click Update.', 'acadvizen-cms' )
		);
	} elseif ( is_configured() && ( ! $is_current || empty( $slug_status['checked'] ) ) ) {
		printf(
			'<div class="notice notice-warning acv-cms-notice"><p>%s</p></div>',
			esc_html__( 'We could not confirm with the Main Website that this web address is free. If an existing Main Website blog uses the same address, the existing one will be kept. Click Update to check again.', 'acadvizen-cms' )
		);
	}

	$status = (string) get_post_meta( $post->ID, META_SYNC_STATUS, true );
	if ( STATUS_FAILED === $status ) {
		printf(
			'<div class="notice notice-error acv-cms-notice"><p><strong>%1$s</strong> %2$s <a class="button button-small" href="%3$s">%4$s</a></p></div>',
			esc_html__( '⚠ Main Website update failed.', 'acadvizen-cms' ),
			esc_html__( 'Your blog is saved safely in WordPress. The Main Website will pick up the change automatically within a few minutes, or you can try again now.', 'acadvizen-cms' ),
			esc_url( retry_url( $post->ID ) ),
			esc_html__( 'Retry', 'acadvizen-cms' )
		);
	}
}

/**
 * The Slug and Excerpt boxes are hidden by default on new screens; Main Blogs need both.
 */
function unhide_core_meta_boxes( array $hidden, $screen ): array {
	if ( $screen instanceof \WP_Screen && POST_TYPE === $screen->post_type ) {
		$hidden = array_values( array_diff( $hidden, array( 'slugdiv', 'postexcerpt' ) ) );
	}
	return $hidden;
}

/**
 * The default "Post published. View post" messages link to a URL that does not exist here.
 */
function post_updated_messages( array $messages ): array {
	$saved                  = __( 'Blog saved.', 'acadvizen-cms' );
	$messages[ POST_TYPE ] = array(
		0  => '',
		1  => __( 'Blog updated.', 'acadvizen-cms' ),
		4  => __( 'Blog updated.', 'acadvizen-cms' ),
		5  => $saved,
		6  => __( 'Blog published.', 'acadvizen-cms' ),
		7  => $saved,
		8  => __( 'Blog submitted.', 'acadvizen-cms' ),
		9  => __( 'Blog scheduled.', 'acadvizen-cms' ),
		10 => __( 'Draft saved.', 'acadvizen-cms' ),
	);
	return $messages;
}

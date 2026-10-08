<?php
/**
 * Admin UI for Elementor-designed pages, courses, locations and templates:
 * "Publish To" box, list columns, Duplicate, Publishing status, Versions & Rollback, Settings.
 *
 * Every action checks a nonce and the user's capability for the specific post.
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const SITE_NONCE_ACTION = 'acv_cms_site_target';
const SITE_NONCE_FIELD  = 'acv_cms_site_nonce';

function register_site_meta_boxes( string $post_type ): void {
	if ( is_site_post_type( $post_type ) || is_template_post_type( $post_type ) ) {
		add_meta_box( 'acv-cms-website', __( 'Publish To', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_site_publish_box', $post_type, 'side', 'high' );
	}
}

function render_site_publish_box( \WP_Post $post ): void {
	wp_nonce_field( SITE_NONCE_ACTION, SITE_NONCE_FIELD );
	$current     = get_publish_target( $post->ID );
	$is_template = is_template_post_type( $post->post_type );
	$help        = $is_template
		? array(
			TARGET_ENROLLMENT => __( 'Used on enroll.acadvizen.com only.', 'acadvizen-cms' ),
			TARGET_MAIN       => __( 'Used on www.acadvizen.com only.', 'acadvizen-cms' ),
			TARGET_BOTH       => __( 'Used on both websites (today\'s behaviour).', 'acadvizen-cms' ),
		)
		: array(
			TARGET_ENROLLMENT => __( 'Shown on enroll.acadvizen.com only.', 'acadvizen-cms' ),
			TARGET_MAIN       => __( 'Shown on www.acadvizen.com only, exactly as designed in Elementor. Not shown on enroll.acadvizen.com.', 'acadvizen-cms' ),
			TARGET_BOTH       => __( 'Shown on both websites. Design once, published to both.', 'acadvizen-cms' ),
		);
	?>
	<fieldset class="acv-cms-targets">
		<legend class="screen-reader-text"><?php esc_html_e( 'Publish To', 'acadvizen-cms' ); ?></legend>
		<?php foreach ( target_labels() as $value => $label ) : ?>
			<label class="acv-cms-target">
				<input type="radio" name="acv_cms_site_target" value="<?php echo esc_attr( $value ); ?>" <?php checked( $current, $value ); ?> />
				<strong><?php echo esc_html( $label ); ?></strong>
				<span class="description"><?php echo esc_html( $help[ $value ] ); ?></span>
			</label>
		<?php endforeach; ?>
	</fieldset>
	<?php if ( $is_template ) : ?>
		<p class="acv-cms-note"><?php esc_html_e( 'Saving a template republishes every Main Website page automatically.', 'acadvizen-cms' ); ?></p>
		<?php
		return;
	endif;

	$path = main_path_for( $post );
	if ( targets_main( $current ) ) {
		if ( '' === $path ) {
			echo '<p class="acv-cms-badge acv-cms-badge--error">' . esc_html__( 'This page\'s address (Slug) uses characters the Main Website cannot use. Use lowercase letters, numbers and hyphens.', 'acadvizen-cms' ) . '</p>';
		} elseif ( is_configured() ) {
			echo '<p class="acv-cms-address">' . esc_html__( 'Main Website address:', 'acadvizen-cms' ) . '<br /><code>' . esc_html( main_url_for_path( $path ) ) . '</code></p>';
		}
	}
	echo '<div class="acv-cms-status-box">';
	render_site_status( $post );
	echo '</div>';

	if ( current_user_can( 'manage_options' ) ) :
		?>
		<details class="acv-cms-advanced" <?php echo ( get_post_meta( $post->ID, META_MAIN_REPLACE, true ) || get_post_meta( $post->ID, META_MAIN_HOMEPAGE, true ) || get_post_meta( $post->ID, META_MAIN_PATH, true ) ) ? 'open' : ''; ?>>
			<summary><?php esc_html_e( 'Main Website options (administrators)', 'acadvizen-cms' ); ?></summary>
			<?php if ( 'page' === $post->post_type ) : ?>
				<label><input type="checkbox" name="acv_cms_main_homepage" value="1" <?php checked( '1', get_post_meta( $post->ID, META_MAIN_HOMEPAGE, true ) ); ?> />
				<?php esc_html_e( 'Use as the Main Website homepage (www.acadvizen.com/)', 'acadvizen-cms' ); ?></label><br />
			<?php endif; ?>
			<label for="acv-cms-main-path"><?php esc_html_e( 'Main Website address (optional)', 'acadvizen-cms' ); ?></label><br />
			<input type="text" id="acv-cms-main-path" name="acv_cms_main_path" class="widefat" placeholder="<?php echo esc_attr( '/about' ); ?>" value="<?php echo esc_attr( (string) get_post_meta( $post->ID, META_MAIN_PATH, true ) ); ?>" />
			<p class="description"><?php esc_html_e( 'Leave empty to use the address of this page. Set it to keep an existing www.acadvizen.com address, for example /about.', 'acadvizen-cms' ); ?></p>
			<label><input type="checkbox" name="acv_cms_main_replace" value="1" <?php checked( '1', get_post_meta( $post->ID, META_MAIN_REPLACE, true ) ); ?> />
			<?php esc_html_e( 'Replace an existing Main Website page at the same address', 'acadvizen-cms' ); ?></label>
			<p class="description"><?php esc_html_e( 'Without this, an existing Main Website page always keeps its address. Untick to bring the existing page back.', 'acadvizen-cms' ); ?></p>
		</details>
		<?php
	endif;
}

/**
 * Plain-language status per website. For "Both" each website is shown separately.
 */
function render_site_status( \WP_Post $post ): void {
	$target = get_publish_target( $post->ID );
	$lines  = array();

	if ( targets_enrollment( $target ) ) {
		$lines[] = 'publish' === $post->post_status
			? array( 'ok', __( 'Enrollment: Published', 'acadvizen-cms' ) )
			: array( 'muted', __( 'Enrollment: Draft', 'acadvizen-cms' ) );
	}
	if ( targets_main( $target ) || live_version_for_post( $post->ID ) ) {
		$lines[] = main_status_line( $post );
	}
	foreach ( $lines as list( $class, $text ) ) {
		printf( '<span class="acv-cms-badge acv-cms-badge--%1$s">%2$s</span><br />', esc_attr( $class ), esc_html( $text ) );
	}
	$state = (string) get_post_meta( $post->ID, META_MAIN_STATE, true );
	if ( in_array( $state, array( STATE_FAILED, STATE_PUBLISHING ), true ) && current_user_can( 'edit_post', $post->ID ) ) {
		printf( '<a class="button button-small" href="%1$s">%2$s</a> ', esc_url( site_action_url( 'acv_cms_retry_render', $post->ID ) ), esc_html__( 'Retry', 'acadvizen-cms' ) );
	}
	if ( live_version_for_post( $post->ID ) || list_versions( $post->ID ) ) {
		printf( '<a href="%1$s">%2$s</a>', esc_url( admin_url( 'admin.php?page=' . MENU_SLUG . '-versions&post_id=' . $post->ID ) ), esc_html__( 'Versions & rollback', 'acadvizen-cms' ) );
	}
}

/**
 * @return array{0: string, 1: string} badge class, text
 */
function main_status_line( \WP_Post $post ): array {
	$target   = get_publish_target( $post->ID );
	$state    = (string) get_post_meta( $post->ID, META_MAIN_STATE, true );
	$live     = live_version_for_post( $post->ID );
	$status   = get_post_meta( $post->ID, META_SLUG_STATUS, true );
	$conflict = is_array( $status ) && ! empty( $status['conflict'] ) && ( $status['path'] ?? '' ) === main_path_for( $post )
		&& '1' !== get_post_meta( $post->ID, META_MAIN_REPLACE, true ) && '1' !== get_post_meta( $post->ID, META_MAIN_HOMEPAGE, true );

	if ( ! targets_main( $target ) || 'publish' !== $post->post_status ) {
		if ( STATE_PUBLISHING === $state ) {
			return array( 'pending', __( 'Main: Removing…', 'acadvizen-cms' ) );
		}
		return $live ? array( 'pending', __( 'Main: Still live (removal pending)', 'acadvizen-cms' ) ) : array( 'muted', __( 'Main: Not published', 'acadvizen-cms' ) );
	}
	if ( $conflict ) {
		return array( 'error', __( 'Main: Address already used by an existing Main Website page — not shown', 'acadvizen-cms' ) );
	}
	switch ( $state ) {
		case STATE_PUBLISHING:
			if ( '' !== (string) get_post_meta( $post->ID, META_MAIN_ERROR, true ) ) {
				// A render attempt failed and an automatic retry is scheduled (after 1, then 5 minutes).
				return array( 'pending', $live ? __( 'Main: Publishing… a first attempt failed, trying again automatically (previous version still live)', 'acadvizen-cms' ) : __( 'Main: Publishing… a first attempt failed, trying again automatically', 'acadvizen-cms' ) );
			}
			return array( 'pending', __( 'Main: Publishing…', 'acadvizen-cms' ) );
		case STATE_FAILED:
			return array( 'error', $live ? __( 'Main: Update failed — previous version still live', 'acadvizen-cms' ) : __( 'Main: Publishing failed', 'acadvizen-cms' ) );
		case STATE_ROLLED_BACK:
			/* translators: %d: version number */
			return array( 'pending', sprintf( __( 'Main: Rolled back to version %d', 'acadvizen-cms' ), (int) ( $live['version'] ?? 0 ) ) );
		case STATE_PUBLISHED:
			/* translators: 1: version number, 2: time */
			return array( 'ok', sprintf( __( 'Main: Published (version %1$d, %2$s)', 'acadvizen-cms' ), (int) ( $live['version'] ?? 0 ), human_time_diff( (int) get_post_meta( $post->ID, META_MAIN_AT, true ) ) . ' ' . __( 'ago', 'acadvizen-cms' ) ) );
	}
	return array( 'muted', __( 'Main: Not published yet', 'acadvizen-cms' ) );
}

function save_site_publish_box( int $post_id, \WP_Post $post ): void {
	if ( ! ( is_site_post_type( $post->post_type ) || is_template_post_type( $post->post_type ) ) || wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST[ SITE_NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ SITE_NONCE_FIELD ] ) ), SITE_NONCE_ACTION ) || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	if ( isset( $_POST['acv_cms_site_target'] ) ) {
		set_publish_target( $post_id, sanitize_key( wp_unslash( $_POST['acv_cms_site_target'] ) ) );
	}
	if ( ! current_user_can( 'manage_options' ) || is_template_post_type( $post->post_type ) ) {
		return;
	}
	update_post_meta( $post_id, META_MAIN_REPLACE, empty( $_POST['acv_cms_main_replace'] ) ? '' : '1' );
	if ( isset( $_POST['acv_cms_main_path'] ) ) {
		$typed = normalize_main_path( sanitize_text_field( wp_unslash( $_POST['acv_cms_main_path'] ) ) );
		if ( '' === $typed ) {
			delete_post_meta( $post_id, META_MAIN_PATH );
		} elseif ( ! is_main_path_taken( $typed, $post_id ) ) {
			update_post_meta( $post_id, META_MAIN_PATH, $typed );
		}
	}
	if ( 'page' === $post->post_type ) {
		$make_home = ! empty( $_POST['acv_cms_main_homepage'] );
		if ( $make_home ) {
			// Only one page can be the Main homepage; the previous one goes back to its own address.
			foreach ( get_posts( array( 'post_type' => 'page', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => -1, 'meta_key' => META_MAIN_HOMEPAGE, 'meta_value' => '1', 'exclude' => array( $post_id ) ) ) as $other ) { // phpcs:ignore WordPress.DB.SlowDBQuery
				delete_post_meta( (int) $other, META_MAIN_HOMEPAGE );
				queue_main_render( (int) $other, 'publish' );
			}
		}
		update_post_meta( $post_id, META_MAIN_HOMEPAGE, $make_home ? '1' : '' );
	}
	flush_target_caches();
}

/* ------------------------------------------------------------------------------------------ */

function site_action_url( string $action, int $post_id, array $extra = array() ): string {
	return wp_nonce_url( add_query_arg( array_merge( array( 'action' => $action, 'post_id' => $post_id ), $extra ), admin_url( 'admin-post.php' ) ), $action . '_' . $post_id );
}

function verify_site_action( string $action ): \WP_Post {
	$post_id = isset( $_REQUEST['post_id'] ) ? absint( $_REQUEST['post_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	check_admin_referer( $action . '_' . $post_id );
	$post = get_post( $post_id );
	if ( ! $post || ! current_user_can( 'edit_post', $post_id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	return $post;
}

function redirect_back( string $notice, string $fallback = '' ): void {
	$back = wp_get_referer() ? wp_get_referer() : ( $fallback ? $fallback : admin_url( 'admin.php?page=' . MENU_SLUG . '-publishing' ) );
	wp_safe_redirect( add_query_arg( 'acv_notice', $notice, remove_query_arg( 'acv_notice', $back ) ) );
	exit;
}

function handle_retry_render(): void {
	$post = verify_site_action( 'acv_cms_retry_render' );
	queue_main_render( $post->ID, 'publish' );
	redirect_back( 'retried' );
}

function handle_rollback(): void {
	$post       = verify_site_action( 'acv_cms_rollback' );
	$version_id = isset( $_REQUEST['version_id'] ) ? absint( $_REQUEST['version_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	redirect_back( rollback_to_version( $post->ID, $version_id ) ? 'rolled_back' : 'rollback_failed' );
}

function handle_republish_all(): void {
	check_admin_referer( 'acv_cms_republish_all' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	run_site_rerender( 'manual' );
	redirect_back( 'republishing' );
}

/**
 * Shows a stored version exactly as the Main Website served it. The response is sandboxed
 * (no access to the admin's session), so scripts in the page cannot act as the logged-in user.
 */
function handle_preview_version(): void {
	$post       = verify_site_action( 'acv_cms_preview_version' );
	$version_id = isset( $_REQUEST['version_id'] ) ? absint( $_REQUEST['version_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$html = version_html( $post->ID, $version_id );
	if ( '' === $html ) {
		wp_die( esc_html__( 'Version not found.', 'acadvizen-cms' ), 404 );
	}
	while ( ob_get_level() > 0 ) {
		ob_end_clean();
	}
	nocache_headers();
	header( 'Content-Type: text/html; charset=utf-8' );
	header( 'X-Robots-Tag: noindex' );
	// The stored page runs in a sandboxed iframe without allow-same-origin: the browser gives it an
	// opaque origin, so its scripts can never act with the administrator's session. (A CSP sandbox
	// header is not enough on its own: the host replaces Content-Security-Policy on every response.)
	printf(
		'<!doctype html><html><head><meta charset="utf-8"><title>%1$s</title><style>html,body{margin:0;height:100%%}iframe{border:0;width:100%%;height:100%%;display:block}</style></head><body><iframe sandbox="allow-scripts allow-popups" referrerpolicy="no-referrer" srcdoc="%2$s"></iframe></body></html>',
		esc_html( sprintf( /* translators: %d: version number */ __( 'Version %d preview', 'acadvizen-cms' ), $version_id ) ),
		esc_attr( preview_document_for_wordpress( (string) $html ) )
	);
	exit;
}

function handle_duplicate(): void {
	$source = verify_site_action( 'acv_cms_duplicate' );
	$type   = get_post_type_object( $source->post_type );
	if ( ! $type || ! current_user_can( $type->cap->create_posts ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$copy_id = wp_insert_post(
		wp_slash(
			array(
				'post_type'      => $source->post_type,
				/* translators: %s: original title */
				'post_title'     => sprintf( __( '%s (copy)', 'acadvizen-cms' ), $source->post_title ),
				'post_content'   => $source->post_content,
				'post_excerpt'   => $source->post_excerpt,
				'post_parent'    => $source->post_parent,
				'menu_order'     => $source->menu_order,
				'post_status'    => 'draft',
				'comment_status' => $source->comment_status,
				'ping_status'    => $source->ping_status,
			)
		),
		true
	);
	if ( is_wp_error( $copy_id ) ) {
		wp_die( esc_html( $copy_id->get_error_message() ) );
	}
	$skip = array( '_edit_lock', '_edit_last', '_wp_old_slug', META_MAIN_STATE, META_MAIN_ERROR, META_MAIN_AT, META_MAIN_NOTIFY, META_RENDER_EVENT, META_PINNED, META_SLUG_STATUS, META_MAIN_HOMEPAGE, META_MAIN_REPLACE );
	foreach ( get_post_meta( $source->ID ) as $key => $values ) {
		if ( in_array( $key, $skip, true ) ) {
			continue;
		}
		foreach ( $values as $value ) {
			add_post_meta( $copy_id, $key, wp_slash( maybe_unserialize( $value ) ) );
		}
	}
	foreach ( get_object_taxonomies( $source->post_type ) as $taxonomy ) {
		wp_set_object_terms( $copy_id, wp_get_object_terms( $source->ID, $taxonomy, array( 'fields' => 'ids' ) ), $taxonomy );
	}
	wp_safe_redirect( admin_url( 'post.php?action=edit&post=' . $copy_id ) );
	exit;
}

function site_row_actions( array $actions, \WP_Post $post ): array {
	if ( is_site_post_type( $post->post_type ) && current_user_can( 'edit_post', $post->ID ) ) {
		$actions['acv_duplicate'] = '<a href="' . esc_url( site_action_url( 'acv_cms_duplicate', $post->ID ) ) . '">' . esc_html__( 'Duplicate', 'acadvizen-cms' ) . '</a>';
		$live                     = live_version_for_post( $post->ID );
		if ( $live && is_configured() ) {
			$actions['acv_view_main'] = '<a href="' . esc_url( main_url_for_path( $live['main_path'] ) ) . '" target="_blank" rel="noopener">' . esc_html__( 'View on Main Website', 'acadvizen-cms' ) . '</a>';
		}
	}
	return $actions;
}

function site_list_columns( array $columns ): array {
	$date = $columns['date'] ?? null;
	unset( $columns['date'] );
	$columns['acv_site_target'] = __( 'Publish To', 'acadvizen-cms' );
	$columns['acv_site_status'] = __( 'Website status', 'acadvizen-cms' );
	if ( $date ) {
		$columns['date'] = $date;
	}
	return $columns;
}

function render_site_list_column( string $column, int $post_id ): void {
	$post = get_post( $post_id );
	if ( ! $post ) {
		return;
	}
	if ( 'acv_site_target' === $column ) {
		echo esc_html( target_labels()[ get_publish_target( $post_id ) ] );
	} elseif ( 'acv_site_status' === $column ) {
		render_site_status( $post );
	}
}

function render_site_admin_notices(): void {
	if ( ! is_plugin_screen() ) {
		return;
	}
	$messages = array(
		'retried'         => array( 'info', __( 'Publishing to the Main Website again. Refresh in a minute to see the result.', 'acadvizen-cms' ) ),
		'rolled_back'     => array( 'success', __( 'Rolled back. The Main Website now shows the version you chose. Editing and updating the page will publish a new version.', 'acadvizen-cms' ) ),
		'rollback_failed' => array( 'error', __( 'That version could not be restored.', 'acadvizen-cms' ) ),
		'republishing'    => array( 'info', __( 'Republishing every Main Website page in the background. This can take a few minutes.', 'acadvizen-cms' ) ),
	);
	$notice   = isset( $_GET['acv_notice'] ) ? sanitize_key( wp_unslash( $_GET['acv_notice'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $messages[ $notice ] ) ) {
		printf( '<div class="notice notice-%1$s is-dismissible"><p>%2$s</p></div>', esc_attr( $messages[ $notice ][0] ), esc_html( $messages[ $notice ][1] ) );
	}

	$screen = get_current_screen();
	$post   = ( $screen && 'post' === $screen->base ) ? get_post() : null;
	if ( ! $post || ! is_site_post_type( $post->post_type ) || 'publish' !== $post->post_status || ! targets_main( get_publish_target( $post->ID ) ) ) {
		return;
	}
	list( $class, $text ) = main_status_line( $post );
	if ( 'error' === $class ) {
		$status = get_post_meta( $post->ID, META_SLUG_STATUS, true );
		$extra  = ( is_array( $status ) && ! empty( $status['conflict'] ) )
			? __( 'The existing Main Website page keeps this address and this page is not shown there. Change the page\'s Slug, or ask an administrator to tick "Replace an existing Main Website page" in the Publish To box.', 'acadvizen-cms' )
			: __( 'Your page is saved safely in WordPress. If a previous version was published, the Main Website keeps showing it. Click Retry in the Publish To box, or contact your developer if this keeps happening.', 'acadvizen-cms' );
		printf( '<div class="notice notice-error acv-cms-notice acv-cms-notice--conflict"><p><strong>%1$s</strong></p><p>%2$s</p></div>', esc_html( $text ), esc_html( $extra ) );
	}
}

/* ------------------------------------------------------------------------------------------ */

function render_publishing_page(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		return;
	}
	$posts = get_posts(
		array(
			'post_type'      => SITE_POST_TYPES,
			'post_status'    => array( 'publish', 'draft', 'pending', 'future', 'private', 'trash' ),
			'posts_per_page' => 300,
			'orderby'        => 'modified',
			'order'          => 'DESC',
			'meta_query'     => array(
				'relation' => 'OR',
				array( 'key' => META_TARGET, 'value' => array( TARGET_MAIN, TARGET_BOTH ), 'compare' => 'IN' ),
				array( 'key' => META_MAIN_STATE, 'compare' => 'EXISTS' ),
			),
		)
	);
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Publishing', 'acadvizen-cms' ); ?></h1>
		<p><?php esc_html_e( 'Everything designed here that is published to the Main Website, and its current status.', 'acadvizen-cms' ); ?></p>
		<?php if ( current_user_can( 'manage_options' ) ) : ?>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="margin:12px 0">
				<input type="hidden" name="action" value="acv_cms_republish_all" />
				<?php wp_nonce_field( 'acv_cms_republish_all' ); ?>
				<button class="button"><?php esc_html_e( 'Republish all Main Website pages now', 'acadvizen-cms' ); ?></button>
				<span class="description"><?php esc_html_e( 'Normally not needed: changes to global styles, headers, footers, menus and templates do this automatically.', 'acadvizen-cms' ); ?></span>
			</form>
		<?php endif; ?>
		<table class="widefat striped">
			<thead><tr>
				<th><?php esc_html_e( 'Page', 'acadvizen-cms' ); ?></th>
				<th><?php esc_html_e( 'Publish To', 'acadvizen-cms' ); ?></th>
				<th><?php esc_html_e( 'Main Website address', 'acadvizen-cms' ); ?></th>
				<th><?php esc_html_e( 'Status', 'acadvizen-cms' ); ?></th>
				<th><?php esc_html_e( 'Technical detail (for developers)', 'acadvizen-cms' ); ?></th>
			</tr></thead>
			<tbody>
			<?php if ( ! $posts ) : ?>
				<tr><td colspan="5"><?php esc_html_e( 'Nothing is published to the Main Website yet. Open a page, choose "Main Website" or "Both Websites" in the Publish To box, and click Publish or Update.', 'acadvizen-cms' ); ?></td></tr>
			<?php endif; ?>
			<?php foreach ( $posts as $post ) : ?>
				<?php $live = live_version_for_post( $post->ID ); ?>
				<tr>
					<td><a href="<?php echo esc_url( (string) get_edit_post_link( $post->ID ) ); ?>"><?php echo esc_html( get_the_title( $post ) ? get_the_title( $post ) : __( '(no title)', 'acadvizen-cms' ) ); ?></a>
						<br /><small><?php echo esc_html( get_post_type_object( $post->post_type )->labels->singular_name ); ?></small></td>
					<td><?php echo esc_html( target_labels()[ get_publish_target( $post->ID ) ] ); ?></td>
					<td><?php echo $live ? '<a href="' . esc_url( main_url_for_path( $live['main_path'] ) ) . '" target="_blank" rel="noopener"><code>' . esc_html( $live['main_path'] ) . '</code></a>' : '&mdash;'; ?></td>
					<td><?php render_site_status( $post ); ?></td>
					<td><code><?php echo esc_html( (string) get_post_meta( $post->ID, META_MAIN_ERROR, true ) ); ?></code></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>

		<?php if ( current_user_can( 'manage_options' ) ) : ?>
			<h2><?php esc_html_e( 'Recent publishing activity', 'acadvizen-cms' ); ?></h2>
			<?php render_publish_log(); ?>
			<h2><?php esc_html_e( 'Recent blog updates', 'acadvizen-cms' ); ?></h2>
			<?php render_sync_log(); ?>
		<?php endif; ?>
	</div>
	<?php
}

function render_publish_log(): void {
	$log    = (array) get_option( PUBLISH_LOG_OPTION, array() );
	$labels = array(
		'rendered'      => __( 'Published to Main', 'acadvizen-cms' ),
		'render_retry'  => __( 'Publishing failed, retrying', 'acadvizen-cms' ),
		'render_failed'   => __( 'Publishing failed', 'acadvizen-cms' ),
		'render_requeued' => __( 'Publishing was interrupted; started again automatically', 'acadvizen-cms' ),
		'main_notified' => __( 'Main Website refreshed', 'acadvizen-cms' ),
		'notify_retry'  => __( 'Main Website refresh failed, retrying', 'acadvizen-cms' ),
		'notify_failed' => __( 'Main Website refresh failed (it refreshes by itself within 5 minutes)', 'acadvizen-cms' ),
		'rolled_back'   => __( 'Rolled back', 'acadvizen-cms' ),
	);
	if ( ! $log ) {
		echo '<p>' . esc_html__( 'No activity yet.', 'acadvizen-cms' ) . '</p>';
		return;
	}
	echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'When', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Address', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Result', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Detail', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( $log as $entry ) {
		printf(
			'<tr><td>%1$s</td><td><code>%2$s</code></td><td>%3$s</td><td><code>%4$s</code></td></tr>',
			esc_html( wp_date( 'j M Y, H:i', (int) $entry['time'] ) ),
			esc_html( $entry['path'] ),
			esc_html( $labels[ $entry['outcome'] ] ?? $entry['outcome'] ),
			esc_html( $entry['detail'] )
		);
	}
	echo '</tbody></table>';
}

function render_versions_page(): void {
	$post_id = isset( $_GET['post_id'] ) ? absint( $_GET['post_id'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$post    = $post_id ? get_post( $post_id ) : null;
	echo '<div class="wrap"><h1>' . esc_html__( 'Versions & Rollback', 'acadvizen-cms' ) . '</h1>';

	if ( ! $post || ! current_user_can( 'edit_post', $post_id ) ) {
		echo '<p>' . esc_html__( 'Every time a page is published to the Main Website, the published result is kept as a version. Choose a page:', 'acadvizen-cms' ) . '</p><ul>';
		foreach ( list_live_versions() as $row ) {
			if ( current_user_can( 'edit_post', (int) $row['post_id'] ) ) {
				printf( '<li><a href="%1$s">%2$s</a> <code>%3$s</code></li>', esc_url( admin_url( 'admin.php?page=' . MENU_SLUG . '-versions&post_id=' . (int) $row['post_id'] ) ), esc_html( get_the_title( (int) $row['post_id'] ) ), esc_html( $row['main_path'] ) );
			}
		}
		echo '</ul></div>';
		return;
	}

	printf( '<h2>%s</h2>', esc_html( get_the_title( $post ) ) );
	echo '<p>' . esc_html__( 'Choose "Make live" to show an earlier version on the Main Website (rollback). WordPress keeps that version live until the page is edited and updated again. Elementor\'s own Revisions (History panel) are still available for editing.', 'acadvizen-cms' ) . '</p>';
	echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'Version', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Published', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Reason', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Address', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Size', 'acadvizen-cms' ) . '</th><th></th></tr></thead><tbody>';
	$reasons = array(
		'publish'  => __( 'Page published / updated', 'acadvizen-cms' ),
		'template' => __( 'Header, footer or template changed', 'acadvizen-cms' ),
		'global'   => __( 'Global design changed', 'acadvizen-cms' ),
		'content'  => __( 'FAQs / testimonials / tools changed', 'acadvizen-cms' ),
		'refresh'       => __( 'Daily refresh', 'acadvizen-cms' ),
		'manual'        => __( 'Republished by an administrator', 'acadvizen-cms' ),
		'global-styles' => __( 'Global colours / fonts changed', 'acadvizen-cms' ),
		'menu'          => __( 'Menu changed', 'acadvizen-cms' ),
		'recovered'     => __( 'Interrupted publish completed automatically', 'acadvizen-cms' ),
	);
	foreach ( list_versions( $post->ID ) as $row ) {
		$actions = '<a class="button button-small" target="_blank" rel="noopener" href="' . esc_url( site_action_url( 'acv_cms_preview_version', $post->ID, array( 'version_id' => (int) $row['id'] ) ) ) . '">' . esc_html__( 'Preview', 'acadvizen-cms' ) . '</a> ';
		$actions .= $row['is_live']
			? '<strong>' . esc_html__( 'Live on Main Website', 'acadvizen-cms' ) . '</strong>'
			: '<a class="button button-small button-primary" href="' . esc_url( site_action_url( 'acv_cms_rollback', $post->ID, array( 'version_id' => (int) $row['id'] ) ) ) . '" onclick="return confirm(\'' . esc_js( __( 'Show this version on the Main Website?', 'acadvizen-cms' ) ) . '\')">' . esc_html__( 'Make live', 'acadvizen-cms' ) . '</a>';
		printf(
			'<tr><td>%1$d</td><td>%2$s</td><td>%3$s</td><td><code>%4$s</code></td><td>%5$s</td><td>%6$s</td></tr>',
			(int) $row['version'],
			esc_html( wp_date( 'j M Y, H:i', strtotime( $row['created_at'] . ' UTC' ) ) ),
			esc_html( $reasons[ $row['reason'] ] ?? $row['reason'] ),
			esc_html( $row['main_path'] ),
			esc_html( size_format( (int) $row['bytes'] ) ),
			$actions // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts above.
		);
	}
	echo '</tbody></table></div>';
}

function render_settings_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$test = null;
	if ( isset( $_POST['acv_cms_test_connection'] ) && check_admin_referer( 'acv_cms_test_connection' ) ) {
		$test = post_to_main( '/api/wordpress/slug-check', array( 'content_type' => 'page', 'path' => '/acadvizen-connection-test' ), SLUG_CHECK_TIMEOUT );
	}
	$rows = array(
		__( 'Main Website address', 'acadvizen-cms' )    => main_site_url() ? main_site_url() : ( '' !== production_isolation_error()
			? __( 'Blocked: this is not the production Enrollment website, so it may not use the production Main Website. Set ACADVIZEN_CMS_MAIN_URL to a staging Main Website.', 'acadvizen-cms' )
			: __( 'Not set (ACADVIZEN_CMS_MAIN_URL in wp-config.php)', 'acadvizen-cms' ) ),
		__( 'This website', 'acadvizen-cms' )            => is_production_enrollment_site() ? __( 'Production Enrollment website', 'acadvizen-cms' ) : __( 'Staging / copy (cannot reach the production Main Website)', 'acadvizen-cms' ),
		__( 'Shared secret', 'acadvizen-cms' )           => strlen( webhook_secret() ) >= MIN_SECRET_LENGTH ? __( 'Set', 'acadvizen-cms' ) : __( 'Missing or too short (ACADVIZEN_CMS_WEBHOOK_SECRET, at least 32 characters)', 'acadvizen-cms' ),
		__( 'Rendering address', 'acadvizen-cms' )       => loopback_base(),
		__( 'Background jobs (WP-Cron)', 'acadvizen-cms' ) => ( defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON ) ? __( 'Run by a server cron job', 'acadvizen-cms' ) : __( 'Run by WordPress on page visits', 'acadvizen-cms' ),
		__( 'Plugin version', 'acadvizen-cms' )          => VERSION,
	);
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Acadvizen Master Admin — Settings', 'acadvizen-cms' ); ?></h1>
		<p><?php esc_html_e( 'These values are set by your developer in wp-config.php and cannot be changed here. Secrets are never shown.', 'acadvizen-cms' ); ?></p>
		<table class="form-table" role="presentation">
			<?php foreach ( $rows as $label => $value ) : ?>
				<tr><th scope="row"><?php echo esc_html( $label ); ?></th><td><code><?php echo esc_html( $value ); ?></code></td></tr>
			<?php endforeach; ?>
		</table>
		<form method="post">
			<?php wp_nonce_field( 'acv_cms_test_connection' ); ?>
			<button class="button" name="acv_cms_test_connection" value="1"><?php esc_html_e( 'Test connection to the Main Website', 'acadvizen-cms' ); ?></button>
		</form>
		<?php if ( null !== $test ) : ?>
			<div class="notice notice-<?php echo $test['ok'] ? 'success' : 'error'; ?> inline"><p>
				<?php echo $test['ok'] ? esc_html__( 'Connected. The Main Website accepted a signed request.', 'acadvizen-cms' ) : esc_html__( 'Not connected:', 'acadvizen-cms' ) . ' <code>' . esc_html( $test['error'] ) . '</code>'; ?>
			</p></div>
		<?php endif; ?>
	</div>
	<?php
}

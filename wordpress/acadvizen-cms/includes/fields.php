<?php
/**
 * Edit-screen boxes for Main Blogs: "Publish To" and "Blog details".
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const NONCE_ACTION = 'acv_cms_save_blog';
const NONCE_FIELD  = 'acv_cms_blog_nonce';

function register_meta_boxes(): void {
	add_meta_box( 'acv-cms-publish-to', __( 'Publish To', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_publish_to_box', POST_TYPE, 'side', 'high' );
	add_meta_box( 'acv-cms-blog-details', __( 'Blog details for the Main Website', 'acadvizen-cms' ), __NAMESPACE__ . '\\render_details_box', POST_TYPE, 'normal', 'high' );
}

function render_publish_to_box( \WP_Post $post ): void {
	wp_nonce_field( NONCE_ACTION, NONCE_FIELD );
	$current = get_publish_target( $post->ID );

	$options = array(
		TARGET_MAIN       => array(
			__( 'Main Website', 'acadvizen-cms' ),
			__( 'Shows this blog on www.acadvizen.com/blog.', 'acadvizen-cms' ),
		),
		TARGET_ENROLLMENT => array(
			__( 'Enrollment Website', 'acadvizen-cms' ),
			__( 'Saves this blog for Enrollment use only. It will NOT appear on www.acadvizen.com, and it is NOT added to any existing Enrollment page.', 'acadvizen-cms' ),
		),
		TARGET_BOTH       => array(
			__( 'Both Websites', 'acadvizen-cms' ),
			__( 'Shows this blog on www.acadvizen.com/blog AND marks it for Enrollment use. The existing Enrollment website pages and design are NOT changed.', 'acadvizen-cms' ),
		),
	);
	?>
	<fieldset class="acv-cms-targets">
		<legend class="screen-reader-text"><?php esc_html_e( 'Publish To', 'acadvizen-cms' ); ?></legend>
		<?php foreach ( $options as $value => $labels ) : ?>
			<label class="acv-cms-target">
				<input type="radio" name="acv_cms_publish_target" value="<?php echo esc_attr( $value ); ?>" <?php checked( $current, $value ); ?> />
				<strong><?php echo esc_html( $labels[0] ); ?></strong>
				<span class="description"><?php echo esc_html( $labels[1] ); ?></span>
			</label>
		<?php endforeach; ?>
	</fieldset>
	<p class="acv-cms-note">
		<?php esc_html_e( 'Publishing here never edits the existing enroll.acadvizen.com pages, menus, forms or design.', 'acadvizen-cms' ); ?>
	</p>
	<div class="acv-cms-status-box">
		<strong><?php esc_html_e( 'Main Website status:', 'acadvizen-cms' ); ?></strong><br />
		<?php render_status_badge( $post ); ?>
	</div>
	<?php
}

function render_details_box( \WP_Post $post ): void {
	$main      = main_site_url() ? main_site_url() : 'https://www.acadvizen.com';
	$slug      = $post->post_name ? $post->post_name : __( '(created when you publish)', 'acadvizen-cms' );
	$fields    = array(
		'author'          => get_post_meta( $post->ID, META_AUTHOR_NAME, true ),
		'category'        => get_post_meta( $post->ID, META_CATEGORY, true ),
		'seo_title'       => get_post_meta( $post->ID, META_SEO_TITLE, true ),
		'seo_description' => get_post_meta( $post->ID, META_SEO_DESCRIPTION, true ),
		'noindex'         => get_post_meta( $post->ID, META_NOINDEX, true ),
	);
	?>
	<p class="acv-cms-address">
		<?php esc_html_e( 'Web address on the Main Website:', 'acadvizen-cms' ); ?>
		<code><?php echo esc_html( $main . '/blog/' . $slug ); ?></code><br />
		<span class="description"><?php esc_html_e( 'To change the last part of the address, edit the "Slug" box below and click Update.', 'acadvizen-cms' ); ?></span>
	</p>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row"><label for="acv-cms-author"><?php esc_html_e( 'Author name', 'acadvizen-cms' ); ?></label></th>
			<td><input type="text" class="regular-text" id="acv-cms-author" name="acv_cms_author_name" value="<?php echo esc_attr( $fields['author'] ); ?>" placeholder="Acadvizen" /></td>
		</tr>
		<tr>
			<th scope="row"><label for="acv-cms-category"><?php esc_html_e( 'Category', 'acadvizen-cms' ); ?></label></th>
			<td><input type="text" class="regular-text" id="acv-cms-category" name="acv_cms_category" value="<?php echo esc_attr( $fields['category'] ); ?>" placeholder="<?php esc_attr_e( 'e.g. SEO', 'acadvizen-cms' ); ?>" /></td>
		</tr>
		<tr>
			<th scope="row"><label for="acv-cms-seo-title"><?php esc_html_e( 'Google title (optional)', 'acadvizen-cms' ); ?></label></th>
			<td>
				<input type="text" class="large-text" id="acv-cms-seo-title" name="acv_cms_seo_title" maxlength="70" value="<?php echo esc_attr( $fields['seo_title'] ); ?>" />
				<p class="description"><?php esc_html_e( 'Shown as the blue link in Google. Leave empty to use the blog title.', 'acadvizen-cms' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="acv-cms-seo-description"><?php esc_html_e( 'Google description (optional)', 'acadvizen-cms' ); ?></label></th>
			<td>
				<textarea class="large-text" rows="3" id="acv-cms-seo-description" name="acv_cms_seo_description" maxlength="170"><?php echo esc_textarea( $fields['seo_description'] ); ?></textarea>
				<p class="description"><?php esc_html_e( 'Shown under the link in Google. Leave empty to use the Excerpt.', 'acadvizen-cms' ); ?></p>
			</td>
		</tr>
		<tr>
			<th scope="row"><?php esc_html_e( 'Hide from Google', 'acadvizen-cms' ); ?></th>
			<td>
				<label><input type="checkbox" name="acv_cms_noindex" value="1" <?php checked( '1', $fields['noindex'] ); ?> />
				<?php esc_html_e( 'Do not show this blog in Google search results', 'acadvizen-cms' ); ?></label>
			</td>
		</tr>
	</table>
	<p class="description">
		<?php esc_html_e( 'Tip: the "Excerpt" box is the short summary shown on the blog list. The "Cover image" is the picture shown at the top of the blog.', 'acadvizen-cms' ); ?>
	</p>
	<?php
}

/**
 * Saves the boxes. Runs on save_post_acv_blog; slug checks and Main Website updates happen
 * afterwards in after_blog_saved(), once WordPress has finished saving everything.
 */
function save_meta_boxes( int $post_id, \WP_Post $post ): void {
	if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return;
	}
	if ( ! isset( $_POST[ NONCE_FIELD ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ NONCE_FIELD ] ) ), NONCE_ACTION ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	$text_fields = array(
		'acv_cms_publish_target'  => META_TARGET,
		'acv_cms_author_name'     => META_AUTHOR_NAME,
		'acv_cms_category'        => META_CATEGORY,
		'acv_cms_seo_title'       => META_SEO_TITLE,
		'acv_cms_seo_description' => META_SEO_DESCRIPTION,
	);
	foreach ( $text_fields as $field => $meta_key ) {
		if ( isset( $_POST[ $field ] ) ) {
			// Sanitized by the callback registered in register_post_meta().
			update_post_meta( $post_id, $meta_key, wp_unslash( $_POST[ $field ] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		}
	}
	update_post_meta( $post_id, META_NOINDEX, empty( $_POST['acv_cms_noindex'] ) ? '' : '1' );
}

<?php
/**
 * Main Website content in this (central) WordPress admin: Acadvizen Master Admin → Main Website.
 *
 * The Main Website keeps its content in its own database and draws it with its own design. This
 * screen edits exactly those records (pages and their sections, blogs, tools, locations, cities,
 * testimonials) through the Main Website's signed content API (/api/wordpress/content); WordPress
 * never stores or renders them itself. Pages designed in Elementor and published through the Render
 * Bridge remain available alongside (Publish To on WordPress pages).
 */

namespace Acadvizen\CMS;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const MAIN_CONTENT_PAGE     = 'acadvizen-cms-main';
const MAIN_CONTENT_PATH     = '/api/wordpress/content';
const MAIN_CONTENT_TIMEOUT  = 20;
const MAIN_CONTENT_LOG      = 'acv_cms_main_content_log';
const MAIN_SNAPSHOT_TYPE    = 'acv_main_snapshot';
const MAIN_SNAPSHOT_KEEP    = 20;
const MAIN_BLOG_MIRROR_META = '_acv_main_blog_id';
const MAIN_BLOG_TARGETS     = 'acv_cms_main_blog_targets';
const MAIN_PER_PAGE         = 50;
const MAIN_PREVIEW_SECONDS  = 900;
const MAIN_OWNERS           = 'acv_cms_main_owners';

/* Content types ------------------------------------------------------------------------------- */

function main_seo_fields(): array {
	return array(
		'seo_title'            => array( __( 'SEO title', 'acadvizen-cms' ), 'text', __( 'Shown in Google and the browser tab. Leave empty to use the title.', 'acadvizen-cms' ) ),
		'seo_description'      => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', __( 'One or two sentences for search results.', 'acadvizen-cms' ) ),
		'canonical_url'        => array( __( 'Canonical address', 'acadvizen-cms' ), 'url', __( 'Only if this content also exists at another address. Usually empty.', 'acadvizen-cms' ) ),
		'og_image'             => array( __( 'Share image', 'acadvizen-cms' ), 'image', __( 'Shown when the page is shared on social media.', 'acadvizen-cms' ) ),
		'noindex'              => array( __( 'Hide from search engines', 'acadvizen-cms' ), 'checkbox', '' ),
		'exclude_from_sitemap' => array( __( 'Leave out of the sitemap', 'acadvizen-cms' ), 'checkbox', '' ),
	);
}

/**
 * The Main Website types edited here. "fields" mirror lib/wordpress/contentApi.js on the Main
 * Website, which validates every value again; "path" is the public address pattern.
 */
function main_entities(): array {
	$schedule = array(
		'scheduled_publish_at'   => array( __( 'Publish automatically on', 'acadvizen-cms' ), 'datetime', __( 'Optional. The page appears on this date (status must be Published).', 'acadvizen-cms' ) ),
		'scheduled_unpublish_at' => array( __( 'Remove automatically on', 'acadvizen-cms' ), 'datetime', __( 'Optional.', 'acadvizen-cms' ) ),
	);
	return array(
		'pages'          => array(
			'label'    => __( 'Pages', 'acadvizen-cms' ),
			'singular' => __( 'Page', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'status',
			'trash'    => true,
			'preview'  => true,
			'sections' => true,
			'path'     => '/%s',
			'fields'   => array(
				'title'       => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'        => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/<address>. Lowercase letters, numbers and hyphens.', 'acadvizen-cms' ), true ),
				'description' => array( __( 'Short description', 'acadvizen-cms' ), 'textarea', __( 'Shown as the page text while the page has no sections.', 'acadvizen-cms' ) ),
			) + main_seo_fields() + $schedule,
		),
		'blogs'          => array(
			'label'    => __( 'Blogs', 'acadvizen-cms' ),
			'singular' => __( 'Blog', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'status',
			'trash'    => true,
			'preview'  => true,
			'targets'  => true,
			'path'     => '/blog/%s',
			'fields'   => array(
				'title'          => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'           => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/blog/<address>', 'acadvizen-cms' ), true ),
				'description'    => array( __( 'Summary', 'acadvizen-cms' ), 'textarea', __( 'Shown on the blog list and under the title.', 'acadvizen-cms' ) ),
				'excerpt'        => array( __( 'Excerpt', 'acadvizen-cms' ), 'textarea', '' ),
				'featured_image' => array( __( 'Cover image', 'acadvizen-cms' ), 'image', '' ),
				'author_id'      => array( __( 'Author', 'acadvizen-cms' ), 'relation', __( 'Shown on the article and on the author\'s page.', 'acadvizen-cms' ), false, array( 'entity' => 'authors' ) ),
				'category_id'    => array( __( 'Main category', 'acadvizen-cms' ), 'relation', __( 'The article is listed on this category\'s page.', 'acadvizen-cms' ), false, array( 'entity' => 'blog_categories' ) ),
				'categories'     => array( __( 'Categories', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
				'tags'           => array( __( 'Tags', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
				'content_json'   => array( __( 'Article', 'acadvizen-cms' ), 'blocks', '' ),
			) + main_seo_fields() + $schedule,
		),
		'tools_extended' => array(
			'label'    => __( 'Tools', 'acadvizen-cms' ),
			'singular' => __( 'Tool', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => true,
			'path'     => '/tools/%s',
			'fields'   => array(
				'name'        => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'        => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/tools/<address>', 'acadvizen-cms' ), true ),
				'category'    => array( __( 'Category', 'acadvizen-cms' ), 'text', __( 'e.g. SEO, Gen AI', 'acadvizen-cms' ) ),
				'description' => array( __( 'Description', 'acadvizen-cms' ), 'textarea', '' ),
				'logo_url'    => array( __( 'Logo', 'acadvizen-cms' ), 'image', '' ),
				'brand_color' => array( __( 'Brand colour', 'acadvizen-cms' ), 'color', '' ),
				'website_url' => array( __( 'Website', 'acadvizen-cms' ), 'url', '' ),
			),
		),
		'city_pages'     => array(
			'label'    => __( 'City pages', 'acadvizen-cms' ),
			'singular' => __( 'City page', 'acadvizen-cms' ),
			'title'    => 'city_name',
			'workflow' => 'active',
			'trash'    => true,
			'preview'  => false,
			'sections' => true,
			'path'     => '/digital-marketing-course-in-%s',
			'fields'   => array(
				'city_name'            => array( __( 'City', 'acadvizen-cms' ), 'text', '', true ),
				'slug'                 => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/digital-marketing-course-in-<address>', 'acadvizen-cms' ), true ),
				'hero_title'           => array( __( 'Heading', 'acadvizen-cms' ), 'text', '' ),
				'hero_subtitle'        => array( __( 'Subheading', 'acadvizen-cms' ), 'text', '' ),
				'hero_description'     => array( __( 'Introduction', 'acadvizen-cms' ), 'textarea', '' ),
				'hero_image_url'       => array( __( 'Top image', 'acadvizen-cms' ), 'image', '' ),
				'about_title'          => array( __( 'About heading', 'acadvizen-cms' ), 'text', '' ),
				'about_description'    => array( __( 'About text', 'acadvizen-cms' ), 'textarea', '' ),
				'about_image_url'      => array( __( 'About image', 'acadvizen-cms' ), 'image', '' ),
				'features'             => array( __( 'Features', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'title' => '', 'text' => '', 'list' => array() ) ) ),
				'stats'                => array( __( 'Figures', 'acadvizen-cms' ), 'json', __( 'Up to four are shown at the top.', 'acadvizen-cms' ), false, array( 'shape' => 'array', 'template' => array( 'label' => '', 'value' => '', 'icon' => '' ) ) ),
				'testimonials'         => array( __( 'Testimonials', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'name' => '', 'quote' => '', 'role' => '', 'company' => '', 'rating' => 5 ) ) ),
				'faqs'                 => array( __( 'Questions and answers', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'question' => '', 'answer' => '' ) ) ),
				'contact_phone'        => array( __( 'Phone', 'acadvizen-cms' ), 'text', '' ),
				'contact_email'        => array( __( 'Email', 'acadvizen-cms' ), 'text', '' ),
				'contact_address'      => array( __( 'Address', 'acadvizen-cms' ), 'textarea', '' ),
				'seo_title'            => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'seo_description'      => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'canonical_url'        => array( __( 'Canonical address', 'acadvizen-cms' ), 'url', __( 'Only if this content also exists at another address. Usually empty.', 'acadvizen-cms' ) ),
				'exclude_from_sitemap' => array( __( 'Leave out of the sitemap', 'acadvizen-cms' ), 'checkbox', '' ),
			),
		),
		'service_pages'  => array(
			'label'    => __( 'Service pages', 'acadvizen-cms' ),
			'singular' => __( 'Service page', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'active',
			'trash'    => false,
			'sections' => true,
			'path'     => '/%s',
			'fields'   => array(
				'title'            => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'             => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/<address>, e.g. google-ads-course-in-mysuru. Cannot be the address of a page.', 'acadvizen-cms' ), true ),
				'hero_title'       => array( __( 'Heading', 'acadvizen-cms' ), 'text', '' ),
				'hero_subtitle'    => array( __( 'Subheading', 'acadvizen-cms' ), 'text', '' ),
				'overview'         => array( __( 'Overview', 'acadvizen-cms' ), 'textarea', '' ),
				'curriculum'       => array( __( 'Curriculum', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'title' => '' ) ) ),
				'benefits'         => array( __( 'Why choose this programme', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'title' => '', 'description' => '' ) ) ),
				'faqs'             => array( __( 'Questions and answers', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'question' => '', 'answer' => '' ) ) ),
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'order_index'      => array( __( 'Position', 'acadvizen-cms' ), 'number', '' ),
			),
		),
		'courses'        => array(
			'label'    => __( 'Courses', 'acadvizen-cms' ),
			'singular' => __( 'Course', 'acadvizen-cms' ),
			'title'    => 'title',
			'workflow' => 'active',
			'trash'    => true,
			'path'     => '/courses/%s',
			'fields'   => array(
				'title'               => array( __( 'Title', 'acadvizen-cms' ), 'text', '', true ),
				'slug'                => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/courses/<address>', 'acadvizen-cms' ), true ),
				'subtitle'            => array( __( 'Subtitle', 'acadvizen-cms' ), 'text', '' ),
				'badge'               => array( __( 'Badge', 'acadvizen-cms' ), 'text', __( 'e.g. Most popular', 'acadvizen-cms' ) ),
				'short_description'   => array( __( 'Short description', 'acadvizen-cms' ), 'textarea', __( 'Shown on the course list and at the top of the course page.', 'acadvizen-cms' ) ),
				'description'         => array( __( 'Description', 'acadvizen-cms' ), 'textarea', '' ),
				'image_url'           => array( __( 'Main image', 'acadvizen-cms' ), 'image', '' ),
				'thumbnail_url'       => array( __( 'Thumbnail', 'acadvizen-cms' ), 'image', '' ),
				'duration_value'      => array( __( 'Duration', 'acadvizen-cms' ), 'number', __( 'A number, e.g. 6', 'acadvizen-cms' ) ),
				'duration_unit'       => array( __( 'Duration unit', 'acadvizen-cms' ), 'text', __( 'e.g. months', 'acadvizen-cms' ) ),
				'learning_mode'       => array( __( 'Learning mode', 'acadvizen-cms' ), 'text', __( 'e.g. Online and classroom', 'acadvizen-cms' ) ),
				'learning_hours'      => array( __( 'Learning hours', 'acadvizen-cms' ), 'number', '' ),
				'projects_count'      => array( __( 'Projects', 'acadvizen-cms' ), 'number', '' ),
				'case_studies_count'  => array( __( 'Case studies', 'acadvizen-cms' ), 'number', '' ),
				'ai_tools_count'      => array( __( 'AI tools', 'acadvizen-cms' ), 'number', '' ),
				'certification_count' => array( __( 'Certifications', 'acadvizen-cms' ), 'number', '' ),
				'internship'          => array( __( 'Includes an internship', 'acadvizen-cms' ), 'checkbox', '' ),
				'placement_support'   => array( __( 'Includes placement support', 'acadvizen-cms' ), 'checkbox', '' ),
				'skills'              => array( __( 'Skills', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
				'curriculum'          => array( __( 'Curriculum', 'acadvizen-cms' ), 'json', __( 'Modules in order, each with its topics.', 'acadvizen-cms' ), false, array( 'shape' => 'array', 'template' => array( 'title' => '', 'topics' => array() ) ) ),
				'brochure_url'        => array( __( 'Brochure (PDF link)', 'acadvizen-cms' ), 'url', '' ),
				'primary_cta_label'   => array( __( 'Main button text', 'acadvizen-cms' ), 'text', '' ),
				'primary_cta_url'     => array( __( 'Main button link', 'acadvizen-cms' ), 'link', '' ),
				'secondary_cta_label' => array( __( 'Second button text', 'acadvizen-cms' ), 'text', '' ),
				'secondary_cta_url'   => array( __( 'Second button link', 'acadvizen-cms' ), 'link', '' ),
				'order_index'         => array( __( 'Position on the course list', 'acadvizen-cms' ), 'number', __( 'Lower numbers come first.', 'acadvizen-cms' ) ),
				'is_featured'         => array( __( 'Featured', 'acadvizen-cms' ), 'checkbox', '' ),
				'meta_title'          => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description'    => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'canonical_url'       => array( __( 'Canonical address', 'acadvizen-cms' ), 'url', __( 'Only if this content also exists at another address. Usually empty.', 'acadvizen-cms' ) ),
				'og_image_url'        => array( __( 'Social sharing image', 'acadvizen-cms' ), 'image', '' ),
				'noindex'             => array( __( 'Hide from search engines (noindex)', 'acadvizen-cms' ), 'checkbox', '' ),
				'exclude_from_sitemap' => array( __( 'Leave out of the sitemap', 'acadvizen-cms' ), 'checkbox', '' ),
			),
		),
		'course_details' => array(
			'label'    => __( 'Course sections', 'acadvizen-cms' ),
			'singular' => __( 'Course section', 'acadvizen-cms' ),
			'title'    => 'section_title',
			'workflow' => 'none',
			'trash'    => false,
			'path'     => '',
			'parent'   => array( 'field' => 'course_id', 'entity' => 'courses', 'label' => __( 'Course', 'acadvizen-cms' ) ),
			'fields'   => array(
				'course_id'     => array( __( 'Course', 'acadvizen-cms' ), 'parent_select', '', true ),
				'section_title' => array( __( 'Section heading', 'acadvizen-cms' ), 'text', '', true ),
				'content'       => array( __( 'Text', 'acadvizen-cms' ), 'textarea', '' ),
				'order_index'   => array( __( 'Position', 'acadvizen-cms' ), 'number', __( 'Lower numbers come first.', 'acadvizen-cms' ) ),
			),
		),
		'media'          => array(
			'label'      => __( 'Media library', 'acadvizen-cms' ),
			'singular'   => __( 'Image', 'acadvizen-cms' ),
			'title'      => 'name',
			'workflow'   => 'none',
			'trash'      => false,
			'creatable'  => false,
			'deletable'  => false,
			'path'       => '',
			'list_thumb' => 'url',
			'fields'     => array(
				'name'     => array( __( 'Name', 'acadvizen-cms' ), 'text', '' ),
				'alt_text' => array( __( 'Description for screen readers and search engines (alt text)', 'acadvizen-cms' ), 'text', '' ),
				'caption'  => array( __( 'Caption', 'acadvizen-cms' ), 'text', '' ),
			),
		),
		'locations'      => array(
			'label'    => __( 'Locations', 'acadvizen-cms' ),
			'singular' => __( 'Location', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '/digital-marketing-courses-%s',
			'sections' => true,
			'fields'   => array(
				'name'             => array( __( 'Name', 'acadvizen-cms' ), 'text', __( 'e.g. Jayanagar', 'acadvizen-cms' ), true ),
				'slug'             => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/digital-marketing-courses-<address>', 'acadvizen-cms' ), true ),
				'city_id'          => array( __( 'City', 'acadvizen-cms' ), 'city', __( 'The city this area belongs to.', 'acadvizen-cms' ) ),
				'location_type'    => array( __( 'Type', 'acadvizen-cms' ), 'text', __( 'e.g. area, branch', 'acadvizen-cms' ) ),
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'intro_text'       => array( __( 'Introduction', 'acadvizen-cms' ), 'textarea', '' ),
				'why_text'         => array( __( 'Why study here', 'acadvizen-cms' ), 'textarea', '' ),
				'demand_text'      => array( __( 'Local demand', 'acadvizen-cms' ), 'textarea', '' ),
				'address'          => array( __( 'Address', 'acadvizen-cms' ), 'textarea', '' ),
				'phone'            => array( __( 'Phone', 'acadvizen-cms' ), 'text', '' ),
				'whatsapp'         => array( __( 'WhatsApp', 'acadvizen-cms' ), 'text', '' ),
				'opening_hours'    => array( __( 'Opening hours', 'acadvizen-cms' ), 'text', '' ),
			),
		),
		'cities'         => array(
			'label'    => __( 'Cities', 'acadvizen-cms' ),
			'singular' => __( 'City', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '/digital-marketing-course-in-%s',
			'fields'   => array(
				'name'             => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'             => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/digital-marketing-course-in-<address>', 'acadvizen-cms' ), true ),
				'state'            => array( __( 'State', 'acadvizen-cms' ), 'text', '' ),
				'country'          => array( __( 'Country', 'acadvizen-cms' ), 'text', '' ),
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', '' ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'intro_text'       => array( __( 'Introduction', 'acadvizen-cms' ), 'textarea', '' ),
				'highlights'       => array( __( 'Highlights', 'acadvizen-cms' ), 'lines', __( 'One per line.', 'acadvizen-cms' ) ),
			),
		),
		'homepage_hero'   => array(
			'label'     => __( 'Banner', 'acadvizen-cms' ),
			'singular'  => __( 'Homepage banner', 'acadvizen-cms' ),
			'title'     => 'heading',
			'workflow'  => 'none',
			'trash'     => false,
			'creatable' => false,
			'singleton' => true,
			'group'     => 'home',
			'path'      => '',
			'fields'    => array(
				'badge_text' => array( __( 'Badge above the heading', 'acadvizen-cms' ), 'text', __( 'Empty: the built-in badge.', 'acadvizen-cms' ) ),
				'heading'    => array( __( 'Heading', 'acadvizen-cms' ), 'text', __( 'Empty: the built-in heading.', 'acadvizen-cms' ) ),
				'subheading' => array( __( 'Text under the heading', 'acadvizen-cms' ), 'textarea', __( 'Empty: the built-in text.', 'acadvizen-cms' ) ),
			),
		),
		'homepage_cta'    => array(
			'label'     => __( 'Closing call to action', 'acadvizen-cms' ),
			'singular'  => __( 'Closing call to action', 'acadvizen-cms' ),
			'title'     => 'title',
			'workflow'  => 'none',
			'trash'     => false,
			'creatable' => false,
			'singleton' => true,
			'group'     => 'home',
			'path'      => '',
			'fields'    => array(
				'title'       => array( __( 'Heading', 'acadvizen-cms' ), 'text', '' ),
				'description' => array( __( 'Text', 'acadvizen-cms' ), 'textarea', '' ),
				'button_text' => array( __( 'Button text', 'acadvizen-cms' ), 'text', '' ),
				'button_link' => array( __( 'Button link', 'acadvizen-cms' ), 'link', __( 'A page address such as /courses.', 'acadvizen-cms' ) ),
			),
		),
		'home_sections'   => array(
			'label'      => __( 'Sections', 'acadvizen-cms' ),
			'singular'   => __( 'Homepage section', 'acadvizen-cms' ),
			'title'      => 'title',
			'workflow'   => 'active',
			'trash'      => false,
			'creatable'  => false,
			'group'      => 'home',
			'path'       => '',
			'key_labels' => array( 'who_for' => __( 'Who is this for', 'acadvizen-cms' ), 'blog_section' => __( 'From the blog', 'acadvizen-cms' ), 'registration_popup' => __( 'Registration pop-up', 'acadvizen-cms' ) ),
			'fields'     => array(
				'title'      => array( __( 'Heading', 'acadvizen-cms' ), 'text', '' ),
				'subtitle'   => array( __( 'Subheading', 'acadvizen-cms' ), 'text', '' ),
				'body'       => array( __( 'Text', 'acadvizen-cms' ), 'textarea', '' ),
				'items_json' => array( __( 'Items', 'acadvizen-cms' ), 'json', __( 'Who is this for: a description shorter than the built-in one is not shown (the longer text wins).', 'acadvizen-cms' ), false, array( 'shape' => 'array', 'template' => array( 'title' => '', 'desc' => '' ) ) ),
				'cta_json'   => array( __( 'Button', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'object', 'template' => array() ) ),
			),
		),
		'home_lists'      => array(
			'label'     => __( 'Lists', 'acadvizen-cms' ),
			'singular'  => __( 'Homepage list', 'acadvizen-cms' ),
			'title'     => 'title',
			'workflow'  => 'active',
			'trash'     => false,
			'creatable' => false,
			'group'     => 'home',
			'path'      => '',
			'fields'    => array(
				'items_json' => array( __( 'Items', 'acadvizen-cms' ), 'json', __( 'Exactly what the homepage shows, in this order. Hide the list to bring back the built-in one.', 'acadvizen-cms' ), false, array( 'shape' => 'array', 'template' => array() ) ),
			),
		),
		'authors'         => array(
			'label'    => __( 'Authors', 'acadvizen-cms' ),
			'singular' => __( 'Author', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'none',
			'trash'    => false,
			'group'    => 'blog',
			'path'     => '/blog/author/%s',
			'fields'   => array(
				'name'   => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'   => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/blog/author/<address>', 'acadvizen-cms' ), true ),
				'bio'    => array( __( 'About the author', 'acadvizen-cms' ), 'textarea', '' ),
				'avatar' => array( __( 'Photo', 'acadvizen-cms' ), 'image', '' ),
			),
		),
		'blog_categories' => array(
			'label'    => __( 'Categories', 'acadvizen-cms' ),
			'singular' => __( 'Category', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'none',
			'trash'    => false,
			'group'    => 'blog',
			'path'     => '/blog/category/%s',
			'fields'   => array(
				'name'        => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug'        => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/blog/category/<address>', 'acadvizen-cms' ), true ),
				'description' => array( __( 'Description', 'acadvizen-cms' ), 'textarea', '' ),
			),
		),
		'blog_tags'       => array(
			'label'    => __( 'Tags', 'acadvizen-cms' ),
			'singular' => __( 'Tag', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'none',
			'trash'    => false,
			'group'    => 'blog',
			'path'     => '/blog/tag/%s',
			'fields'   => array(
				'name' => array( __( 'Name', 'acadvizen-cms' ), 'text', '', true ),
				'slug' => array( __( 'Address', 'acadvizen-cms' ), 'slug', __( 'www.acadvizen.com/blog/tag/<address>', 'acadvizen-cms' ), true ),
			),
		),
		'header_settings' => array(
			'label'     => __( 'Header', 'acadvizen-cms' ),
			'singular'  => __( 'Header', 'acadvizen-cms' ),
			'title'     => 'announcement_text',
			'workflow'  => 'none',
			'trash'     => false,
			'creatable' => false,
			'singleton' => true,
			'group'     => 'site',
			'path'      => '',
			'fields'    => array(
				'announcement_enabled'    => array( __( 'Show the announcement bar above the menu', 'acadvizen-cms' ), 'checkbox', '' ),
				'announcement_text'       => array( __( 'Announcement text', 'acadvizen-cms' ), 'text', '' ),
				'announcement_link'       => array( __( 'Announcement link', 'acadvizen-cms' ), 'link', __( 'Optional. A page address such as /courses, or https://…', 'acadvizen-cms' ) ),
				'announcement_bg_color'   => array( __( 'Announcement background colour', 'acadvizen-cms' ), 'color', __( 'Empty: the website default.', 'acadvizen-cms' ) ),
				'announcement_text_color' => array( __( 'Announcement text colour', 'acadvizen-cms' ), 'color', __( 'Empty: the website default.', 'acadvizen-cms' ) ),
				'phone_number'            => array( __( 'Phone number', 'acadvizen-cms' ), 'text', '' ),
				'email_address'           => array( __( 'Email address', 'acadvizen-cms' ), 'text', '' ),
				'social_items'            => array( __( 'Social links', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'platform' => '', 'url' => '' ), 'hint' => __( 'Platform: linkedin, instagram, facebook or youtube. The address of your profile.', 'acadvizen-cms' ) ) ),
				'header_border_color'     => array( __( 'Header border colour', 'acadvizen-cms' ), 'color', __( 'Empty: the website default.', 'acadvizen-cms' ) ),
			),
		),
		'footer_settings' => array(
			'label'     => __( 'Footer', 'acadvizen-cms' ),
			'singular'  => __( 'Footer', 'acadvizen-cms' ),
			'title'     => 'copyright_text',
			'workflow'  => 'none',
			'trash'     => false,
			'creatable' => false,
			'singleton' => true,
			'group'     => 'site',
			'path'      => '',
			'fields'    => array(
				'contact_phone'       => array( __( 'Phone', 'acadvizen-cms' ), 'text', '' ),
				'contact_email'       => array( __( 'Email', 'acadvizen-cms' ), 'text', '' ),
				'contact_address'     => array( __( 'Address', 'acadvizen-cms' ), 'textarea', __( 'One line per row.', 'acadvizen-cms' ) ),
				'social_items'        => array( __( 'Social links', 'acadvizen-cms' ), 'json', '', false, array( 'shape' => 'array', 'template' => array( 'platform' => '', 'url' => '' ), 'hint' => __( 'Platform: linkedin, instagram, facebook or youtube. The address of your profile.', 'acadvizen-cms' ) ) ),
				'copyright_text'      => array( __( 'Copyright line', 'acadvizen-cms' ), 'text', __( '{year} and {company} are filled in automatically.', 'acadvizen-cms' ) ),
				'logo_alt'            => array( __( 'Logo description (for screen readers)', 'acadvizen-cms' ), 'text', '' ),
				'footer_bg_color'     => array( __( 'Background colour', 'acadvizen-cms' ), 'color', __( 'Empty: the website default.', 'acadvizen-cms' ) ),
				'footer_border_color' => array( __( 'Border colour', 'acadvizen-cms' ), 'color', __( 'Empty: the website default.', 'acadvizen-cms' ) ),
			),
		),
		'menus'           => array(
			'label'      => __( 'Menus', 'acadvizen-cms' ),
			'singular'   => __( 'Menu link', 'acadvizen-cms' ),
			'title'      => 'title',
			'workflow'   => 'active',
			'trash'      => false,
			'group'      => 'site',
			'path'       => '',
			'list_extra' => 'url',
			'filter'     => array( 'menu_location' => array( 'header' => __( 'Header menu', 'acadvizen-cms' ), 'footer' => __( 'Footer links', 'acadvizen-cms' ), 'legal' => __( 'Legal links', 'acadvizen-cms' ) ) ),
			'fields'     => array(
				'menu_location'   => array( __( 'Menu', 'acadvizen-cms' ), 'choice', __( 'Header: the main navigation. Footer: the footer link list. Legal: the small links at the very bottom.', 'acadvizen-cms' ), true, array( 'options' => array( 'header' => __( 'Header menu', 'acadvizen-cms' ), 'footer' => __( 'Footer links', 'acadvizen-cms' ), 'legal' => __( 'Legal links', 'acadvizen-cms' ) ) ) ),
				'title'           => array( __( 'Text', 'acadvizen-cms' ), 'text', __( 'In the header, a link titled "Courses" opens the course menu.', 'acadvizen-cms' ), true ),
				'url'             => array( __( 'Link', 'acadvizen-cms' ), 'link', __( 'A page address such as /courses, or https://…, #section, mailto: or tel:.', 'acadvizen-cms' ), true ),
				'parent_id'       => array( __( 'Show under', 'acadvizen-cms' ), 'menu_parent', __( 'Optional: makes this a drop-down item under another link of the same menu.', 'acadvizen-cms' ) ),
				'order_index'     => array( __( 'Position', 'acadvizen-cms' ), 'number', __( 'Lower numbers come first.', 'acadvizen-cms' ) ),
				'target'          => array( __( 'Opens in', 'acadvizen-cms' ), 'choice', '', false, array( 'options' => array( '_self' => __( 'The same tab', 'acadvizen-cms' ), '_blank' => __( 'A new tab', 'acadvizen-cms' ) ) ) ),
				'desktop_visible' => array( __( 'Show on computers and tablets', 'acadvizen-cms' ), 'checkbox', '', false, array( 'empty_means_on' => true ) ),
				'mobile_visible'  => array( __( 'Show on phones', 'acadvizen-cms' ), 'checkbox', '', false, array( 'empty_means_on' => true ) ),
			),
		),
		'seo_metadata'    => array(
			'label'        => __( 'SEO overrides', 'acadvizen-cms' ),
			'singular'     => __( 'SEO override', 'acadvizen-cms' ),
			'title'        => 'page_slug',
			'workflow'     => 'none',
			'trash'        => false,
			'creatable'    => false,
			'group'        => 'site',
			'path'         => '/%s',
			'delete_label' => __( 'Remove override', 'acadvizen-cms' ),
			'delete_note'  => __( 'Remove this override? The page\'s own SEO fields apply again.', 'acadvizen-cms' ),
			'fields'       => array(
				'meta_title'       => array( __( 'SEO title', 'acadvizen-cms' ), 'text', __( 'Shown instead of the page\'s own SEO title.', 'acadvizen-cms' ) ),
				'meta_description' => array( __( 'SEO description', 'acadvizen-cms' ), 'textarea', '' ),
				'canonical_url'    => array( __( 'Canonical address', 'acadvizen-cms' ), 'url', '' ),
				'og_image'         => array( __( 'Social sharing image', 'acadvizen-cms' ), 'image', '' ),
			),
		),
		'redirects'       => array(
			'label'       => __( 'Redirects', 'acadvizen-cms' ),
			'singular'    => __( 'Redirect', 'acadvizen-cms' ),
			'title'       => 'from_path',
			'workflow'    => 'active',
			'trash'       => false,
			'group'       => 'site',
			'path'        => '',
			'delete_note' => __( 'Delete this redirect permanently? Visitors to the old address will see "page not found" unless a page exists there.', 'acadvizen-cms' ),
			'fields'      => array(
				'from_path'   => array( __( 'Old address', 'acadvizen-cms' ), 'link', __( 'The address visitors should no longer land on, e.g. /old-seo-course. A new redirect starts switched off: check it, then tick "Show on the Main Website" and save.', 'acadvizen-cms' ), true ),
				'to_path'     => array( __( 'Send visitors to', 'acadvizen-cms' ), 'link', __( 'An address on www.acadvizen.com (e.g. /seo-course-in-bangalore) or a full web address.', 'acadvizen-cms' ), true ),
				'status_code' => array( __( 'Kind of redirect', 'acadvizen-cms' ), 'choice', __( 'Permanent tells search engines the page has moved for good.', 'acadvizen-cms' ), false, array( 'options' => array( '301' => __( 'Permanent (301)', 'acadvizen-cms' ), '302' => __( 'Temporary (302)', 'acadvizen-cms' ) ) ) ),
			),
		),
		'site_settings'   => array(
			'label'     => __( 'Site settings', 'acadvizen-cms' ),
			'singular'  => __( 'Site settings', 'acadvizen-cms' ),
			'title'     => 'company_name',
			'workflow'  => 'none',
			'trash'     => false,
			'creatable' => false,
			'singleton' => true,
			'group'     => 'site',
			'path'      => '',
			'fields'    => array(
				'company_name' => array( __( 'Company name', 'acadvizen-cms' ), 'text', __( 'Used in the header, the footer and the copyright line.', 'acadvizen-cms' ) ),
				'social_links' => array( __( 'Social profiles (fallback)', 'acadvizen-cms' ), 'json', __( 'Used when the header and footer have no social link of that kind.', 'acadvizen-cms' ), false, array( 'shape' => 'object', 'template' => array( 'linkedin' => '', 'instagram' => '', 'facebook' => '', 'youtube' => '' ) ) ),
				'ui_copy'      => array( __( 'Website labels', 'acadvizen-cms' ), 'json', __( 'Small texts of the header and footer. Leave a label empty to keep the website default.', 'acadvizen-cms' ), false, array( 'shape' => 'object', 'template' => array( 'nav_brand_label' => '', 'nav_menu_label' => '', 'nav_close_label' => '', 'nav_dashboard_label' => '', 'nav_signout_label' => '', 'footer_nav_heading' => '', 'footer_legal_heading' => '', 'footer_contact_heading' => '', 'footer_locations_title' => '' ) ) ),
			),
		),
		'testimonials'   => array(
			'label'    => __( 'Testimonials', 'acadvizen-cms' ),
			'singular' => __( 'Testimonial', 'acadvizen-cms' ),
			'title'    => 'name',
			'workflow' => 'active',
			'trash'    => false,
			'path'     => '',
			'fields'   => array(
				'name'      => array( __( 'Student name', 'acadvizen-cms' ), 'text', '', true ),
				'role'      => array( __( 'Role', 'acadvizen-cms' ), 'text', __( 'e.g. SEO Executive', 'acadvizen-cms' ) ),
				'company'   => array( __( 'Company', 'acadvizen-cms' ), 'text', '' ),
				'course'    => array( __( 'Course', 'acadvizen-cms' ), 'text', '' ),
				'rating'    => array( __( 'Rating (1–5)', 'acadvizen-cms' ), 'rating', '' ),
				'quote'     => array( __( 'Quote', 'acadvizen-cms' ), 'textarea', '' ),
				'image_url' => array( __( 'Photo', 'acadvizen-cms' ), 'image', '' ),
			),
		),
	);
}

function main_entity( string $key ): ?array {
	return main_entities()[ $key ] ?? null;
}

/** Capability per action, reusing WordPress roles: Authors write blogs, Editors run the rest. */
function main_can( string $entity, string $action ): bool {
	$blog = 'blogs' === $entity;
	$caps = array(
		'edit'    => $blog ? 'edit_posts' : 'edit_pages',
		'approve' => $blog ? 'edit_others_posts' : 'edit_others_pages',
		'publish' => $blog ? 'publish_posts' : 'publish_pages',
		'delete'  => $blog ? 'delete_others_posts' : 'delete_others_pages',
	);
	return isset( $caps[ $action ] ) && current_user_can( $caps[ $action ] );
}

/**
 * Like WordPress's own posts: Editors and Administrators work on every record, Authors and
 * Contributors only on the ones they created here. Records created elsewhere have no owner here.
 */
function main_manages_record( string $entity, string $id ): bool {
	if ( '' === $id || main_can( $entity, 'approve' ) ) {
		return true;
	}
	$owners = (array) get_option( MAIN_OWNERS, array() );
	return get_current_user_id() > 0 && (int) ( $owners[ $entity . ':' . $id ] ?? 0 ) === get_current_user_id();
}

function main_can_record( string $entity, string $action, string $id ): bool {
	return main_can( $entity, $action ) && main_manages_record( $entity, $id );
}

function remember_main_owner( string $entity, string $id, int $user_id ): void {
	$owners = (array) get_option( MAIN_OWNERS, array() );
	if ( $user_id > 0 ) {
		$owners[ $entity . ':' . $id ] = $user_id;
	} else {
		unset( $owners[ $entity . ':' . $id ] );
	}
	update_option( MAIN_OWNERS, $owners, false );
}

/** The first content type this user may work on (Pages for Editors, Blogs for Authors). */
/** Records of a type, as id => title (choices for relations, e.g. a blog's author). */
function main_relation_options( string $entity ): array {
	static $cache = array();
	$definition = main_entity( $entity );
	if ( ! $definition ) {
		return array();
	}
	if ( ! isset( $cache[ $entity ] ) ) {
		$list             = main_content_request( array( 'op' => 'list', 'entity' => $entity, 'limit' => 200 ) );
		$cache[ $entity ] = array();
		foreach ( $list['ok'] ? (array) $list['body']['data'] : array() as $row ) {
			$row                                    = (array) $row;
			$cache[ $entity ][ (string) $row['id'] ] = (string) ( $row[ $definition['title'] ] ?? $row['id'] );
		}
	}
	return $cache[ $entity ];
}

/** Records a child type can belong to (e.g. the courses of course sections), as id => title. */
function main_parent_options( array $definition ): array {
	return empty( $definition['parent'] ) ? array() : main_relation_options( (string) $definition['parent']['entity'] );
}

function main_default_entity(): string {
	foreach ( array_keys( main_entities() ) as $key ) {
		if ( main_can( $key, 'edit' ) ) {
			return $key;
		}
	}
	return 'pages';
}

/**
 * Refuses the Main Website screen before WordPress starts the page, so a refusal is a real 403
 * (a check inside the screen runs after the admin header has been sent with status 200).
 */
function guard_main_screen(): void {
	if ( ! isset( $_GET['page'] ) || MAIN_CONTENT_PAGE !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	$view   = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'list'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$entity = isset( $_GET['entity'] ) ? sanitize_key( wp_unslash( $_GET['entity'] ) ) : main_default_entity(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$id     = isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$ok     = 'log' === $view ? current_user_can( 'edit_pages' ) : ( main_entity( $entity ) && main_can_record( $entity, 'edit', $id ) );
	if ( ! $ok ) {
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), '', array( 'response' => 403, 'back_link' => true ) );
	}
}

function main_status_labels(): array {
	return array(
		'draft'     => __( 'Draft', 'acadvizen-cms' ),
		'review'    => __( 'In review', 'acadvizen-cms' ),
		'approved'  => __( 'Approved', 'acadvizen-cms' ),
		'published' => __( 'Published', 'acadvizen-cms' ),
		'archived'  => __( 'Archived', 'acadvizen-cms' ),
	);
}

/** Statuses this user may choose: review for writers, approval for editors, publishing with the publish capability. */
function main_allowed_statuses( string $entity ): array {
	$allowed = array( 'draft', 'review' );
	if ( main_can( $entity, 'approve' ) ) {
		$allowed[] = 'approved';
	}
	if ( main_can( $entity, 'publish' ) ) {
		$allowed[] = 'published';
		$allowed[] = 'archived';
	}
	return $allowed;
}

function main_public_url( string $entity, string $slug ): string {
	$definition = main_entity( $entity );
	if ( ! $definition || '' === $definition['path'] || '' === $slug ) {
		return '';
	}
	return main_site_url() . sprintf( $definition['path'], rawurlencode( $slug ) );
}

/* The signed connection --------------------------------------------------------------------- */

/**
 * One call to the Main Website's content API.
 *
 * @return array{ok: bool, status: int, body: array, error: string}
 */
function main_content_request( array $args ): array {
	$user    = wp_get_current_user();
	$payload = array_merge(
		array(
			'purpose'    => 'content',
			'request_id' => wp_generate_uuid4(),
			'actor'      => array( 'wp_user_id' => (int) $user->ID, 'login' => (string) $user->user_login ),
		),
		$args
	);
	$result = post_to_main( MAIN_CONTENT_PATH, $payload, MAIN_CONTENT_TIMEOUT );
	if ( ! in_array( $args['op'] ?? '', array( 'list', 'get' ), true ) ) {
		main_content_log(
			array(
				'at'     => time(),
				'user'   => (string) $user->user_login,
				'op'     => (string) ( $args['op'] ?? '' ),
				'entity' => (string) ( $args['entity'] ?? '' ),
				'id'     => (string) ( $result['body']['data']['id'] ?? $args['id'] ?? '' ),
				'ok'     => (bool) $result['ok'],
				'error'  => $result['ok'] ? '' : main_error_text( $result ),
			)
		);
	}
	return $result;
}

function main_content_log( array $entry ): void {
	$log = get_option( MAIN_CONTENT_LOG, array() );
	$log = is_array( $log ) ? $log : array();
	array_unshift( $log, $entry );
	update_option( MAIN_CONTENT_LOG, array_slice( $log, 0, 300 ), false );
}

/** Plain-language reason for a failed call, with the Main Website's validation details. */
function main_error_text( array $result ): string {
	$messages = array(
		'not_configured'       => __( 'The connection to the Main Website is not set up (shared secret or address missing).', 'acadvizen-cms' ),
		'content_api_disabled' => __( 'The Main Website has not switched on editing from WordPress yet (WORDPRESS_CONTENT_API_ENABLED).', 'acadvizen-cms' ),
		'slug_taken'           => __( 'This address is already used by another record.', 'acadvizen-cms' ),
		'validation_failed'    => __( 'Some fields are not valid.', 'acadvizen-cms' ),
		'broken_links'         => __( 'Not published: the page links to addresses that do not exist on the Main Website.', 'acadvizen-cms' ),
		'in_trash'             => __( 'This record is in the trash. Restore it first.', 'acadvizen-cms' ),
		'not_in_trash'         => __( 'Move the record to the trash before deleting it permanently.', 'acadvizen-cms' ),
		'still_active'         => __( 'Hide the record from the Main Website before deleting it permanently.', 'acadvizen-cms' ),
		'duplicate_request'    => __( 'This change was already received.', 'acadvizen-cms' ),
		'redirect_not_allowed' => __( 'This address belongs to the website itself (for example the admin) and cannot be redirected.', 'acadvizen-cms' ),
		'redirect_loop'        => __( 'This redirect would send visitors in a circle.', 'acadvizen-cms' ),
		'redirect_exists'      => __( 'There is already a redirect from this address. Edit that one instead.', 'acadvizen-cms' ),
		'redirect_chain'       => __( 'This would create a chain of redirects. Point straight to the final address, or change the other redirect.', 'acadvizen-cms' ),
		'redirect_hides_page'  => __( 'A published page or blog lives at this address and would disappear behind the redirect. Unpublish it first if that is intended.', 'acadvizen-cms' ),
		'edit_conflict'        => __( 'Not saved: someone changed this on the Main Website (for example in its own admin) after you opened it. What you typed is kept below. Check the live version first; clicking Save again will replace their change with yours.', 'acadvizen-cms' ),
		'unsupported_section_type' => __( 'This kind of section cannot be added here.', 'acadvizen-cms' ),
	);
	$code  = (string) ( $result['body']['error'] ?? '' );
	$local = (string) ( $result['error'] ?? '' );
	// Codes raised on this side (not configured, ...) arrive without a response body.
	if ( '' === $code && isset( $messages[ $local ] ) ) {
		$code = $local;
	}
	if ( isset( $messages[ $code ] ) ) {
		$text = $messages[ $code ];
	} elseif ( '' !== $code ) {
		$text = $code;
	} elseif ( 0 === (int) ( $result['status'] ?? 0 ) && '' !== $local ) {
		// No answer at all (network error, timeout): say what it means for the editor, keep the detail.
		$text = __( 'The Main Website could not be reached, so nothing was changed there. Check the internet connection and click Save again in a minute.', 'acadvizen-cms' ) . ' (' . $local . ')';
	} else {
		$text = $local;
	}
	$details = $result['body']['details'] ?? array();
	if ( is_array( $details ) && $details ) {
		$text .= ' ' . implode( '; ', array_map( static fn( $d ) => is_string( $d ) ? $d : (string) wp_json_encode( $d ), array_slice( $details, 0, 8 ) ) );
	}
	return '' !== $text ? $text : __( 'The Main Website did not answer.', 'acadvizen-cms' );
}

/** A link to the Main Website's preview of a record, valid for 15 minutes (lib/wordpress/previewToken.js). */
function main_preview_url( string $entity, string $id ): string {
	if ( ! in_array( $entity, array( 'pages', 'blogs' ), true ) || strlen( webhook_secret() ) < MIN_SECRET_LENGTH ) {
		return '';
	}
	$expires = time() + MAIN_PREVIEW_SECONDS;
	return main_site_url() . '/preview/wordpress/' . rawurlencode( $entity ) . '/' . rawurlencode( $id ) . '?exp=' . $expires . '&sig=' . main_preview_signature( $entity, $id, $expires );
}

/** Same scheme as signPreview() in lib/wordpress/previewToken.js. */
function main_preview_signature( string $entity, string $id, int $expires ): string {
	return hash_hmac( 'sha256', "preview-content.{$entity}.{$id}.{$expires}", webhook_secret() );
}

/* Version history (each successful save is kept, so an earlier version can be restored) --------- */

function register_main_snapshot_type(): void {
	register_post_type(
		MAIN_SNAPSHOT_TYPE,
		array(
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_rest'       => false,
			'rewrite'            => false,
			'query_var'          => false,
			'can_export'         => false,
			'supports'           => array(),
		)
	);
}

function save_main_snapshot( string $entity, string $id, array $record, string $status ): void {
	$snapshot_id = wp_insert_post(
		array(
			'post_type'    => MAIN_SNAPSHOT_TYPE,
			'post_status'  => 'private',
			'post_title'   => $entity . ' ' . $id,
			'post_content' => wp_slash( (string) wp_json_encode( array( 'record' => $record, 'status' => $status ) ) ),
		)
	);
	if ( ! $snapshot_id || is_wp_error( $snapshot_id ) ) {
		return;
	}
	update_post_meta( $snapshot_id, '_acv_entity', $entity );
	update_post_meta( $snapshot_id, '_acv_record_id', $id );
	foreach ( array_slice( list_main_snapshots( $entity, $id ), MAIN_SNAPSHOT_KEEP ) as $old ) {
		wp_delete_post( (int) $old->ID, true );
	}
}

function list_main_snapshots( string $entity, string $id ): array {
	return get_posts(
		array(
			'post_type'      => MAIN_SNAPSHOT_TYPE,
			'post_status'    => 'private',
			'posts_per_page' => 50,
			'orderby'        => 'ID',
			'order'          => 'DESC',
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery
				array( 'key' => '_acv_entity', 'value' => $entity ),
				array( 'key' => '_acv_record_id', 'value' => $id ),
			),
		)
	);
}

/* Blogs on the Enrollment website (Publish To: Enrollment / Both) ------------------------------- */

function main_blog_targets(): array {
	$targets = get_option( MAIN_BLOG_TARGETS, array() );
	return is_array( $targets ) ? $targets : array();
}

function main_blog_target( string $id ): string {
	return (string) ( main_blog_targets()[ $id ] ?? TARGET_MAIN );
}

/** The article as WordPress post content, from the same blocks the Main Website draws. */
function main_blog_html( array $blocks, string $cover = '' ): string {
	$html = '' !== $cover ? '<figure class="wp-block-image"><img src="' . esc_url( $cover ) . '" alt="" /></figure>' : '';
	foreach ( $blocks as $block ) {
		$type = $block['block_type'] ?? '';
		$c    = is_array( $block['content_json'] ?? null ) ? $block['content_json'] : array();
		if ( 'heading' === $type ) {
			$level = in_array( (int) ( $c['level'] ?? 2 ), array( 2, 3, 4 ), true ) ? (int) $c['level'] : 2;
			$html .= "<h{$level}>" . esc_html( (string) ( $c['text'] ?? '' ) ) . "</h{$level}>";
		} elseif ( 'paragraph' === $type ) {
			$html .= '<p>' . wp_kses_post( (string) ( $c['text'] ?? '' ) ) . '</p>';
		} elseif ( 'list' === $type ) {
			$html .= '<ul>' . implode( '', array_map( static fn( $item ) => '<li>' . wp_kses_post( (string) $item ) . '</li>', (array) ( $c['items'] ?? array() ) ) ) . '</ul>';
		} elseif ( 'image' === $type && ! empty( $c['src'] ) ) {
			$caption = (string) ( $c['caption'] ?? '' );
			$html   .= '<figure class="wp-block-image"><img src="' . esc_url( (string) $c['src'] ) . '" alt="' . esc_attr( (string) ( $c['alt'] ?? '' ) ) . '" />' . ( '' !== $caption ? '<figcaption>' . esc_html( $caption ) . '</figcaption>' : '' ) . '</figure>';
		}
	}
	return $html;
}

function find_enrollment_blog_copy( string $main_id ): int {
	$ids = get_posts( array( 'post_type' => 'post', 'post_status' => 'any', 'fields' => 'ids', 'posts_per_page' => 1, 'meta_key' => MAIN_BLOG_MIRROR_META, 'meta_value' => $main_id ) ); // phpcs:ignore WordPress.DB.SlowDBQuery
	return $ids ? (int) $ids[0] : 0;
}

/** 'published' or 'draft' for the Enrollment copy of a blog, or '' when it has none. */
function enrollment_copy_status( string $main_id ): string {
	$copy = find_enrollment_blog_copy( $main_id );
	if ( ! $copy ) {
		return '';
	}
	return 'publish' === get_post_status( $copy ) ? 'published' : 'draft';
}

/**
 * The status an editor sees for a blog. An "Enrollment only" blog is always a draft on the Main
 * Website, so its own status would read "Draft" even while it is live on Enrollment; the status that
 * matters there is the Enrollment copy's.
 */
function main_blog_display_status( string $target, string $main_status, string $copy_status ): string {
	return TARGET_ENROLLMENT === $target && '' !== $copy_status ? $copy_status : $main_status;
}

/**
 * The status the Enrollment copy gets when a blog is saved.
 * - Main / Both: the copy follows the Main Website record.
 * - Enrollment only: only an explicit, allowed choice changes it. Saving without a Status (or with
 *   one this role may not set) keeps the copy as it is, so editing a live article never unpublishes it.
 */
function enrollment_status_for_save( string $target, string $requested, bool $may_publish, array $allowed, string $main_status, string $copy_status ): string {
	if ( TARGET_ENROLLMENT !== $target ) {
		return $main_status;
	}
	$unchanged = '' !== $copy_status ? $copy_status : $main_status;
	if ( 'published' === $requested ) {
		return $may_publish ? 'published' : $unchanged;
	}
	if ( '' === $requested || ! in_array( $requested, $allowed, true ) ) {
		return $unchanged;
	}
	return $requested;
}

/**
 * The Rank Math robots value for the Enrollment copy of a blog, mirroring the blog's "Hide from search
 * engines" choice (same convention as the importer), or null when the record does not say.
 */
function enrollment_copy_robots( array $record ): ?array {
	if ( ! array_key_exists( 'noindex', $record ) ) {
		return null;
	}
	return $record['noindex'] ? array( 'noindex', 'follow' ) : array( 'index', 'follow' );
}

/**
 * Keeps the Enrollment website's copy of a blog in step with its Publish To choice: Enrollment
 * and Both publish a normal WordPress post (drawn by the Enrollment theme); Main alone takes the
 * copy off Enrollment (draft). The copy is identified by the Main record id, so it is never duplicated.
 *
 * @return string '' or an error message.
 */
function sync_enrollment_blog_copy( string $main_id, array $record, string $target, string $status ): string {
	$copy_id = find_enrollment_blog_copy( $main_id );
	if ( ! targets_enrollment( $target ) ) {
		if ( $copy_id ) {
			blog_sync_writing( true );
			wp_update_post( array( 'ID' => $copy_id, 'post_status' => 'draft' ) );
			blog_sync_writing( false );
		}
		return '';
	}
	$post = array(
		'post_type'    => 'post',
		'post_title'   => (string) ( $record['title'] ?? '' ),
		'post_name'    => (string) ( $record['slug'] ?? '' ),
		'post_excerpt' => (string) ( $record['excerpt'] ?? $record['description'] ?? '' ),
		'post_content' => main_blog_html( (array) ( $record['content_json']['blocks'] ?? array() ), (string) ( $record['featured_image'] ?? '' ) ),
		'post_status'  => 'published' === $status ? 'publish' : 'draft',
	);
	if ( $copy_id ) {
		$post['ID'] = $copy_id;
	}
	// Stored before WordPress fires save_post, so Rank Math's robots tag, sitemap and Instant Indexing
	// (which skips noindex posts) already see the blog's choice when the copy goes live.
	$robots = enrollment_copy_robots( $record );
	if ( null !== $robots ) {
		$post['meta_input'] = array( 'rank_math_robots' => $robots );
	}
	// Written by this plugin, not typed by an editor: the push to Main must not run for it.
	blog_sync_writing( true );
	$result = $copy_id ? wp_update_post( wp_slash( $post ), true ) : wp_insert_post( wp_slash( $post ), true );
	blog_sync_writing( false );
	if ( is_wp_error( $result ) ) {
		return $result->get_error_message();
	}
	update_post_meta( (int) $result, MAIN_BLOG_MIRROR_META, $main_id );
	mark_copy_aligned( (int) $result, (string) ( $record['updated_at'] ?? '' ) );
	return '';
}

/* Reading the edit form ------------------------------------------------------------------------- */

/** The record as typed in the form, in the shape the Main Website expects. */
/** A CSS colour as stored on Main (#hex, rgb()/rgba(), transparent), or '' (= the website default). */
function main_clean_color( string $raw ): string {
	$value = trim( $raw );
	return preg_match( '/^(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+|\d{1,3}%)\s*)?\)|transparent)$/i', $value ) ? $value : '';
}

function main_record_from_post( array $definition ): array {
	$record = array();
	foreach ( $definition['fields'] as $key => $field ) {
		$type = $field[1];
		if ( 'checkbox' === $type ) {
			$record[ $key ] = ! empty( $_POST['acv_field'][ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified by the caller.
			continue;
		}
		$config = (array) ( $field[4] ?? array() );
		if ( ! isset( $_POST['acv_field'][ $key ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
			continue;
		}
		$raw = wp_unslash( $_POST['acv_field'][ $key ] ); // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- sanitised per type below.
		switch ( $type ) {
			case 'textarea':
				$record[ $key ] = sanitize_textarea_field( (string) $raw );
				break;
			case 'url':
			case 'image':
				$record[ $key ] = main_clean_url( (string) $raw );
				break;
			case 'slug':
				$record[ $key ] = sanitize_title( (string) $raw );
				break;
			case 'lines':
				$record[ $key ] = array_values( array_filter( array_map( 'sanitize_text_field', preg_split( '/\r\n|\r|\n/', (string) $raw ) ) ) );
				break;
			case 'rating':
				$record[ $key ] = '' === (string) $raw ? null : max( 1, min( 5, (int) $raw ) );
				break;
			case 'color':
				// Empty stays empty: the website then uses its own default colour.
				$record[ $key ] = main_clean_color( (string) $raw );
				break;
			case 'link':
				$record[ $key ] = trim( sanitize_text_field( (string) $raw ) );
				break;
			case 'number':
				$record[ $key ] = '' === trim( (string) $raw ) ? null : (int) $raw;
				break;
			case 'choice':
				$options        = array_keys( (array) ( $config['options'] ?? array() ) );
				$record[ $key ] = in_array( (string) $raw, $options, true ) ? (string) $raw : null;
				break;
			case 'menu_parent':
			case 'parent_select':
			case 'relation':
				$record[ $key ] = '' === (string) $raw ? null : sanitize_text_field( (string) $raw );
				break;
			case 'json':
				// Sent only when changed in the editor. Decoded as objects so an empty {} stays {}.
				$decoded = json_decode( (string) $raw );
				if ( null === $decoded && 'null' !== trim( (string) $raw ) ) {
					continue 2;
				}
				$record[ $key ] = $decoded;
				continue 2;
			case 'datetime':
				$record[ $key ] = '' === (string) $raw ? null : get_gmt_from_date( str_replace( 'T', ' ', (string) $raw ) . ':00', 'c' );
				break;
			case 'blocks':
				// Sent only when the article was changed in the editor (an untouched article, or a
				// page where the editor script did not run, leaves the stored article as it is).
				$decoded = json_decode( (string) $raw, true );
				if ( ! is_array( $decoded ) || ! isset( $decoded['blocks'] ) || ! is_array( $decoded['blocks'] ) ) {
					continue 2;
				}
				$record[ $key ] = array( 'blocks' => array_values( $decoded['blocks'] ) );
				break;
			case 'city':
				$record[ $key ] = '' === (string) $raw ? null : sanitize_text_field( (string) $raw );
				break;
			default:
				$record[ $key ] = sanitize_text_field( (string) $raw );
		}
		if ( '' === $record[ $key ] && ! in_array( $type, array( 'slug' ), true ) ) {
			$record[ $key ] = null;
		}
	}
	return $record;
}

/** An https address, or a site-relative path as the Main Website stores many images ("/blog-images/…"). */
function main_clean_url( string $raw ): string {
	$raw = trim( $raw );
	if ( '' === $raw ) {
		return '';
	}
	if ( preg_match( '#^/(?!/)[^\s<>"\']*$#', $raw ) ) {
		return $raw;
	}
	return (string) esc_url_raw( $raw, array( 'https' ) );
}

/* Saving and actions ---------------------------------------------------------------------------- */

function main_flash( string $type, string $message ): void {
	set_transient( 'acv_cms_main_notice_' . get_current_user_id(), array( $type, $message ), 120 );
}

function main_screen_url( array $args = array() ): string {
	return add_query_arg( array_merge( array( 'page' => MAIN_CONTENT_PAGE ), $args ), admin_url( 'admin.php' ) );
}

function handle_main_save(): void {
	$entity     = isset( $_POST['entity'] ) ? sanitize_key( wp_unslash( $_POST['entity'] ) ) : '';
	$definition = main_entity( $entity );
	check_admin_referer( 'acv_cms_main_save_' . $entity );
	$id = isset( $_POST['id'] ) ? sanitize_text_field( wp_unslash( $_POST['id'] ) ) : '';
	if ( ! $definition || ! main_can_record( $entity, 'edit', $id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$record = main_record_from_post( $definition );
	$back   = static fn( $record_id ) => main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $record_id ) );

	// The first change made here to existing Main content keeps the content as it was before, so
	// "Restore" can always undo it (versions otherwise start with the first save in this admin).
	if ( '' !== $id && ! list_main_snapshots( $entity, $id ) ) {
		$before = main_content_request( array( 'op' => 'get', 'entity' => $entity, 'id' => $id ) );
		if ( $before['ok'] ) {
			$before_row = (array) $before['body']['data'];
			save_main_snapshot( $entity, $id, array_intersect_key( $before_row, $definition['fields'] ), (string) ( $before_row['status'] ?? '' ) );
		}
	}

	$request = array( 'op' => 'save', 'entity' => $entity, 'id' => '' !== $id ? $id : null, 'record' => $record );
	if ( '' !== $id && isset( $_POST['acv_expected_updated_at'] ) ) {
		$request['expected_updated_at'] = sanitize_text_field( wp_unslash( $_POST['acv_expected_updated_at'] ) );
	}
	$saved = main_content_request( $request );
	if ( ! $saved['ok'] ) {
		main_flash( 'error', main_error_text( $saved ) );
		set_transient( 'acv_cms_main_unsaved_' . get_current_user_id(), $record, 300 );
		wp_safe_redirect( '' !== $id ? $back( $id ) : main_screen_url( array( 'entity' => $entity, 'view' => 'edit' ) ) );
		exit;
	}
	$row    = (array) $saved['body']['data'];
	if ( '' === $id ) {
		remember_main_owner( $entity, (string) $row['id'], get_current_user_id() );
	}
	$id     = (string) $row['id'];
	$status = (string) ( $row['status'] ?? '' );
	$notes  = array();
	// Set when one destination failed after Main saved, so the notice is a warning, never plain success.
	$partial = false;

	// Status / visibility, limited by this user's role.
	if ( 'status' === $definition['workflow'] && isset( $_POST['acv_status'] ) ) {
		$wanted = sanitize_key( wp_unslash( $_POST['acv_status'] ) );
		if ( 'blogs' === $entity && isset( $_POST['acv_target'] ) && TARGET_ENROLLMENT === sanitize_key( wp_unslash( $_POST['acv_target'] ) ) && 'published' === $wanted ) {
			$wanted  = 'draft'; // Enrollment only: never public on the Main Website.
			$notes[] = __( 'Kept as a draft on the Main Website because Publish To is "Enrollment Website".', 'acadvizen-cms' );
		}
		if ( $wanted !== $status ) {
			if ( ! in_array( $wanted, main_allowed_statuses( $entity ), true ) ) {
				$notes[] = __( 'Your role cannot set that status; the content was saved without changing it.', 'acadvizen-cms' );
			} else {
				$changed = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'status' => $wanted ) );
				if ( $changed['ok'] ) {
					$row    = (array) $changed['body']['data'];
					$status = (string) ( $row['status'] ?? $wanted );
					if ( ! empty( $changed['body']['merged_into'] ) ) {
						$id      = (string) $changed['body']['merged_into'];
						$notes[] = __( 'Your draft copy was published onto the live page.', 'acadvizen-cms' );
					}
				} else {
					main_flash( 'error', __( 'Saved, but the status was not changed: ', 'acadvizen-cms' ) . main_error_text( $changed ) );
					wp_safe_redirect( $back( $id ) );
					exit;
				}
			}
		}
	} elseif ( 'active' === $definition['workflow'] && main_can( $entity, 'publish' ) ) {
		$wanted = ! empty( $_POST['acv_active'] );
		if ( (bool) ( $row['is_active'] ?? false ) !== $wanted ) {
			$changed = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'active' => $wanted ) );
			if ( ! $changed['ok'] ) {
				main_flash( 'error', __( 'Saved, but showing/hiding failed: ', 'acadvizen-cms' ) . main_error_text( $changed ) );
				wp_safe_redirect( $back( $id ) );
				exit;
			}
			$row = (array) $changed['body']['data'];
		}
	}

	// Blogs: Publish To (Main / Enrollment / Both).
	if ( ! empty( $definition['targets'] ) && isset( $_POST['acv_target'] ) ) {
		$target            = sanitize_publish_target( sanitize_key( wp_unslash( $_POST['acv_target'] ) ) );
		$targets           = main_blog_targets();
		$targets[ $id ]    = $target;
		update_option( MAIN_BLOG_TARGETS, $targets, false );
		$requested         = isset( $_POST['acv_status'] ) ? sanitize_key( wp_unslash( $_POST['acv_status'] ) ) : '';
		$enrollment_status = enrollment_status_for_save( $target, $requested, main_can( $entity, 'publish' ), main_allowed_statuses( $entity ), $status, enrollment_copy_status( $id ) );
		$error             = sync_enrollment_blog_copy( $id, array_merge( $record, $row ), $target, $enrollment_status );
		$notes[]           = '' === $error
			? ( targets_enrollment( $target ) ? __( 'Enrollment Website: updated.', 'acadvizen-cms' ) : '' )
			: __( 'Enrollment Website copy failed: ', 'acadvizen-cms' ) . $error . ' ' . __( 'Fix the problem and click Save again; the Main Website already has this version.', 'acadvizen-cms' );
		$partial           = '' !== $error;
	}

	// The whole saved record (not only the fields sent), so restoring a version brings everything back.
	save_main_snapshot( $entity, $id, array_intersect_key( array_merge( $record, $row ), $definition['fields'] ), $status );
	$revalidated = (array) ( $saved['body']['revalidation'] ?? array() );
	$message     = __( 'Saved on the Main Website.', 'acadvizen-cms' );
	if ( isset( $revalidated['ok'] ) && ! $revalidated['ok'] ) {
		$message .= ' ' . __( 'The page cache could not be refreshed; the change shows within 5 minutes.', 'acadvizen-cms' );
	}
	main_flash( $partial ? 'warning' : 'success', trim( $message . ' ' . implode( ' ', array_filter( $notes ) ) ) );
	wp_safe_redirect( $back( $id ) );
	exit;
}

/** Trash, restore, permanent delete, private draft copy, version restore (each a confirmed button). */
function handle_main_action(): void {
	$entity     = isset( $_REQUEST['entity'] ) ? sanitize_key( wp_unslash( $_REQUEST['entity'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$id         = isset( $_REQUEST['id'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$do         = isset( $_REQUEST['do'] ) ? sanitize_key( wp_unslash( $_REQUEST['do'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$definition = main_entity( $entity );
	check_admin_referer( "acv_cms_main_{$do}_{$entity}_{$id}" );
	$need = array( 'trash' => 'edit', 'restore' => 'edit', 'delete' => 'delete', 'start_draft' => 'edit', 'restore_version' => 'edit', 'show' => 'publish', 'hide' => 'publish', 'import_menus' => 'publish', 'import_home' => 'publish' );
	if ( ! $definition || ! isset( $need[ $do ] ) || ! main_can_record( $entity, $need[ $do ], $id ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$list = main_screen_url( array( 'entity' => $entity ) );
	switch ( $do ) {
		case 'trash':
		case 'restore':
			$result = main_content_request( array( 'op' => $do, 'entity' => $entity, 'id' => $id ) );
			if ( $result['ok'] && 'blogs' === $entity && 'trash' === $do ) {
				sync_enrollment_blog_copy( $id, array(), TARGET_MAIN, 'draft' );
			}
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? ( 'trash' === $do ? __( 'Moved to the trash and removed from the Main Website.', 'acadvizen-cms' ) : __( 'Restored as a draft.', 'acadvizen-cms' ) ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'show':
		case 'hide':
			$result = main_content_request( array( 'op' => 'set_status', 'entity' => $entity, 'id' => $id, 'active' => 'show' === $do ) );
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? ( 'show' === $do ? __( 'Now shown on the Main Website.', 'acadvizen-cms' ) : __( 'Hidden from the Main Website.', 'acadvizen-cms' ) ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'delete':
			$result = main_content_request( array( 'op' => 'delete', 'entity' => $entity, 'id' => $id, 'confirm' => true ) );
			if ( $result['ok'] ) {
				remember_main_owner( $entity, $id, 0 );
				foreach ( list_main_snapshots( $entity, $id ) as $snapshot ) {
					wp_delete_post( (int) $snapshot->ID, true );
				}
			}
			if ( $result['ok'] && 'blogs' === $entity ) {
				$copy = find_enrollment_blog_copy( $id );
				if ( $copy ) {
					wp_trash_post( $copy );
				}
			}
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'Deleted permanently.', 'acadvizen-cms' ) : main_error_text( $result ) );
			wp_safe_redirect( $list );
			exit;
		case 'import_home':
			$result = main_content_request( array( 'op' => 'import_homepage_defaults', 'entity' => 'home_lists' ) );
			if ( $result['ok'] ) {
				$imported = (array) ( $result['body']['data']['imported'] ?? array() );
				main_flash(
					'success',
					$imported
						/* translators: %d: number of lists */
						? sprintf( __( 'Copied %d lists the homepage shows today. The homepage looks the same; you can now edit them.', 'acadvizen-cms' ), count( $imported ) )
						: __( 'Nothing to copy: every list has already been copied.', 'acadvizen-cms' )
				);
			} else {
				main_flash( 'error', main_error_text( $result ) );
			}
			wp_safe_redirect( $list );
			exit;
		case 'import_menus':
			$result = main_content_request( array( 'op' => 'import_menu_defaults', 'entity' => 'menus' ) );
			if ( $result['ok'] ) {
				$imported = (array) ( $result['body']['data']['imported'] ?? array() );
				$message  = $imported
					/* translators: %s: list like "header: 5, footer: 5" */
					? sprintf( __( 'Copied the links shown today (%s). The website looks the same; you can now edit them.', 'acadvizen-cms' ), implode( ', ', array_map( static fn( $k, $v ) => $k . ': ' . $v, array_keys( $imported ), $imported ) ) )
					: __( 'Nothing to copy: every menu already has its own links.', 'acadvizen-cms' );
				main_flash( 'success', $message );
			} else {
				main_flash( 'error', main_error_text( $result ) );
			}
			wp_safe_redirect( $list );
			exit;
		case 'start_draft':
			$result = main_content_request( array( 'op' => 'start_draft', 'entity' => 'pages', 'id' => $id ) );
			main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'Private draft copy ready. Your changes stay private until you publish the draft.', 'acadvizen-cms' ) : main_error_text( $result ) );
			wp_safe_redirect( $result['ok'] ? main_screen_url( array( 'entity' => 'pages', 'view' => 'edit', 'id' => (string) $result['body']['data']['id'] ) ) : $list );
			exit;
		case 'restore_version':
			$snapshot_id = isset( $_REQUEST['snapshot'] ) ? absint( $_REQUEST['snapshot'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$snapshot    = get_post( $snapshot_id );
			$data        = $snapshot && MAIN_SNAPSHOT_TYPE === $snapshot->post_type && get_post_meta( $snapshot_id, '_acv_record_id', true ) === $id ? json_decode( $snapshot->post_content, true ) : null;
			if ( ! is_array( $data ) || ! is_array( $data['record'] ?? null ) ) {
				main_flash( 'error', __( 'That version could not be found.', 'acadvizen-cms' ) );
			} else {
				$result = main_content_request( array( 'op' => 'save', 'entity' => $entity, 'id' => $id, 'record' => array_intersect_key( $data['record'], $definition['fields'] ) ) );
				if ( $result['ok'] ) {
					$status = (string) ( $result['body']['data']['status'] ?? '' );
					save_main_snapshot( $entity, $id, array_intersect_key( array_merge( $data['record'], (array) $result['body']['data'] ), $definition['fields'] ), $status );
					if ( 'blogs' === $entity ) {
						// The Enrollment copy follows the restored version too, keeping its own status for an
						// "Enrollment only" blog (restoring never changes a status).
						$restore_target = main_blog_target( $id );
						$copy_status    = enrollment_status_for_save( $restore_target, '', false, array(), $status, enrollment_copy_status( $id ) );
						sync_enrollment_blog_copy( $id, array_merge( $data['record'], (array) $result['body']['data'] ), $restore_target, $copy_status );
					}
				}
				main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'The earlier version is back. Its status was not changed.', 'acadvizen-cms' ) : main_error_text( $result ) );
			}
			wp_safe_redirect( main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) ) );
			exit;
	}
}

function main_action_url( string $do, string $entity, string $id, array $extra = array() ): string {
	return wp_nonce_url( add_query_arg( array_merge( array( 'action' => 'acv_cms_main_action', 'do' => $do, 'entity' => $entity, 'id' => $id ), $extra ), admin_url( 'admin-post.php' ) ), "acv_cms_main_{$do}_{$entity}_{$id}" );
}

/** Section editing for a page (admin-ajax): save, delete, reorder. */
function ajax_main_section(): void {
	check_ajax_referer( 'acv_cms_main_section', 'nonce' );
	$parent = isset( $_POST['parent'] ) ? sanitize_key( wp_unslash( $_POST['parent'] ) ) : 'pages';
	if ( ! in_array( $parent, array( 'pages', 'city_pages', 'service_pages', 'locations' ), true ) ) {
		wp_send_json_error( array( 'message' => 'invalid_parent' ), 400 );
	}
	if ( ! main_can_record( $parent, 'edit', isset( $_POST['page_id'] ) ? sanitize_text_field( wp_unslash( $_POST['page_id'] ) ) : '' ) ) {
		wp_send_json_error( array( 'message' => __( 'You are not allowed to do this.', 'acadvizen-cms' ) ), 403 );
	}
	$op      = isset( $_POST['op'] ) ? sanitize_key( wp_unslash( $_POST['op'] ) ) : '';
	$page_id = isset( $_POST['page_id'] ) ? sanitize_text_field( wp_unslash( $_POST['page_id'] ) ) : '';
	$args    = array( 'entity' => 'sections', 'parent' => $parent, 'page_id' => $page_id );
	if ( 'save' === $op ) {
		// Decoded as objects so an empty {} (e.g. a section with no design settings) is re-sent as {}, not [].
		$record = json_decode( (string) wp_unslash( $_POST['record'] ?? '' ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- validated by the Main Website.
		$args  += array( 'op' => 'save', 'id' => sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) ) ?: null, 'record' => is_object( $record ) ? get_object_vars( $record ) + array( 'page_id' => $page_id ) : array() );
	} elseif ( 'delete' === $op ) {
		$args += array( 'op' => 'delete', 'id' => sanitize_text_field( wp_unslash( $_POST['id'] ?? '' ) ) );
	} elseif ( 'reorder' === $op ) {
		$ids   = json_decode( (string) wp_unslash( $_POST['ids'] ?? '' ), true ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		$args += array( 'op' => 'reorder_sections', 'ids' => is_array( $ids ) ? array_values( array_map( 'sanitize_text_field', $ids ) ) : array() );
	} else {
		wp_send_json_error( array( 'message' => 'invalid_op' ), 400 );
	}
	$result = main_content_request( $args );
	if ( ! $result['ok'] ) {
		wp_send_json_error( array( 'message' => main_error_text( $result ) ), 400 );
	}
	wp_send_json_success( $result['body']['data'] ?? array() );
}

/** Upload of one image into the Main Website media library (validated again by the Main Website). */
function handle_main_upload(): void {
	check_admin_referer( 'acv_cms_main_upload' );
	if ( ! main_can( 'media', 'edit' ) ) {
		wp_die( esc_html__( 'You are not allowed to do this.', 'acadvizen-cms' ), 403 );
	}
	$back = main_screen_url( array( 'entity' => 'media' ) );
	$file = $_FILES['acv_file'] ?? null; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- checked below and by the Main Website.
	if ( ! is_array( $file ) || UPLOAD_ERR_OK !== (int) ( $file['error'] ?? UPLOAD_ERR_NO_FILE ) || ! is_uploaded_file( (string) $file['tmp_name'] ) ) {
		main_flash( 'error', __( 'No image was received. Choose a file and try again.', 'acadvizen-cms' ) );
		wp_safe_redirect( $back );
		exit;
	}
	if ( (int) $file['size'] > 3 * 1024 * 1024 ) {
		main_flash( 'error', __( 'The image is larger than 3 MB. Make it smaller and try again.', 'acadvizen-cms' ) );
		wp_safe_redirect( $back );
		exit;
	}
	$type   = wp_check_filetype_and_ext( (string) $file['tmp_name'], (string) $file['name'] );
	$result = main_content_request(
		array(
			'op'           => 'upload',
			'entity'       => 'media',
			'filename'     => sanitize_file_name( (string) $file['name'] ),
			'content_type' => (string) ( $type['type'] ?: $file['type'] ),
			'alt_text'     => isset( $_POST['acv_alt'] ) ? sanitize_text_field( wp_unslash( $_POST['acv_alt'] ) ) : '',
			'data'         => base64_encode( (string) file_get_contents( (string) $file['tmp_name'] ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- sent to the Main Website as data.
		)
	);
	main_flash( $result['ok'] ? 'success' : 'error', $result['ok'] ? __( 'Image added to the Main Website library.', 'acadvizen-cms' ) : main_error_text( $result ) );
	wp_safe_redirect( $back );
	exit;
}

/** The Main Website media library, for the image picker (search by name or alt text). */
function ajax_main_media(): void {
	check_ajax_referer( 'acv_cms_main_media', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => __( 'You are not allowed to do this.', 'acadvizen-cms' ) ), 403 );
	}
	$result = main_content_request( array( 'op' => 'list', 'entity' => 'media', 'search' => isset( $_POST['search'] ) ? sanitize_text_field( wp_unslash( $_POST['search'] ) ) : '', 'limit' => 60 ) );
	if ( ! $result['ok'] ) {
		wp_send_json_error( array( 'message' => main_error_text( $result ) ), 400 );
	}
	wp_send_json_success( array_map( static fn( $row ) => array( 'url' => (string) ( (array) $row )['url'], 'name' => (string) ( ( (array) $row )['name'] ?? '' ), 'alt' => (string) ( ( (array) $row )['alt_text'] ?? '' ) ), (array) $result['body']['data'] ) );
}

/* Screens ------------------------------------------------------------------------------------- */

function enqueue_main_editor_assets( string $hook ): void {
	if ( false === strpos( $hook, MAIN_CONTENT_PAGE ) ) {
		return;
	}
	wp_enqueue_media();
	wp_enqueue_style( 'acadvizen-cms-main-editor', plugins_url( 'assets/main-editor.css', __DIR__ ), array(), VERSION );
	wp_enqueue_script( 'acadvizen-cms-main-editor', plugins_url( 'assets/main-editor.js', __DIR__ ), array(), VERSION, true );
	wp_localize_script( 'acadvizen-cms-main-editor', 'acvMainLibrary', array( 'ajax' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'acv_cms_main_media' ) ) );
}

function render_main_notice(): void {
	$key    = 'acv_cms_main_notice_' . get_current_user_id();
	$notice = get_transient( $key );
	if ( is_array( $notice ) ) {
		delete_transient( $key );
		$type = in_array( $notice[0], array( 'error', 'warning' ), true ) ? $notice[0] : 'success';
		printf( '<div class="notice notice-%1$s is-dismissible acv-cms-flash"><p>%2$s</p></div>', esc_attr( $type ), esc_html( (string) $notice[1] ) );
	}
}

function render_main_content_page(): void {
	$entity = isset( $_GET['entity'] ) ? sanitize_key( wp_unslash( $_GET['entity'] ) ) : main_default_entity(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$view   = isset( $_GET['view'] ) ? sanitize_key( wp_unslash( $_GET['view'] ) ) : 'list'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( 'log' === $view ) {
		render_main_log();
		return;
	}
	$definition = main_entity( $entity );
	if ( ! $definition || ! main_can_record( $entity, 'edit', isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), 403 );
	}
	echo '<div class="wrap acv-main">';
	if ( 'preview' === $view ) {
		render_main_preview( $entity, isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	} elseif ( 'edit' === $view ) {
		render_main_edit( $entity, $definition, isset( $_GET['id'] ) ? sanitize_text_field( wp_unslash( $_GET['id'] ) ) : '' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	} else {
		render_main_list( $entity, $definition );
	}
	echo '</div>';
}

function render_main_tabs( string $current ): void {
	$tab = static function ( string $key, array $definition ) use ( $current ): void {
		if ( main_can( $key, 'edit' ) ) {
			printf( '<a class="nav-tab%1$s" href="%2$s">%3$s</a>', $key === $current ? ' nav-tab-active' : '', esc_url( main_screen_url( array( 'entity' => $key ) ) ), esc_html( $definition['label'] ) );
		}
	};
	echo '<nav class="nav-tab-wrapper">';
	foreach ( main_entities() as $key => $definition ) {
		if ( '' === ( $definition['group'] ?? '' ) ) {
			$tab( $key, $definition );
		}
	}
	printf( '<a class="nav-tab" href="%1$s">%2$s</a>', esc_url( main_screen_url( array( 'view' => 'log' ) ) ), esc_html__( 'Activity', 'acadvizen-cms' ) );
	echo '</nav>';
	if ( main_can( 'pages', 'edit' ) ) {
		foreach ( array( 'home' => __( 'Homepage:', 'acadvizen-cms' ), 'blog' => __( 'Blog:', 'acadvizen-cms' ), 'site' => __( 'Whole website:', 'acadvizen-cms' ) ) as $group => $group_label ) {
			echo '<nav class="nav-tab-wrapper acv-main-subtabs"><span class="acv-main-subtabs-label">' . esc_html( $group_label ) . '</span>';
			foreach ( main_entities() as $key => $definition ) {
				if ( ( $definition['group'] ?? '' ) === $group ) {
					$tab( $key, $definition );
				}
			}
			echo '</nav>';
		}
	}
}

function render_main_connection_notice(): bool {
	if ( is_configured() ) {
		return true;
	}
	$reason = production_isolation_error();
	printf(
		'<div class="notice notice-warning"><p><strong>%1$s</strong> %2$s</p></div>',
		esc_html__( 'Not connected to the Main Website.', 'acadvizen-cms' ),
		esc_html( '' !== $reason ? $reason : __( 'Your developer adds the Main Website address and shared secret in wp-config.php. Until then this screen cannot show or change Main Website content.', 'acadvizen-cms' ) )
	);
	return false;
}

function render_main_status_badge( array $definition, array $row ): string {
	if ( ! empty( $row['deleted_at'] ) ) {
		return '<span class="acv-main-badge acv-main-badge--muted">' . esc_html__( 'In trash', 'acadvizen-cms' ) . '</span>';
	}
	if ( 'none' === $definition['workflow'] ) {
		return '<span class="acv-main-badge acv-main-badge--ok">' . esc_html__( 'In use on Main', 'acadvizen-cms' ) . '</span>';
	}
	if ( 'status' === $definition['workflow'] ) {
		$status = (string) ( $row['status'] ?? 'draft' );
		if ( ! empty( $definition['targets'] ) && ! empty( $row['id'] ) && TARGET_ENROLLMENT === main_blog_target( (string) $row['id'] ) ) {
			$status = main_blog_display_status( TARGET_ENROLLMENT, $status, enrollment_copy_status( (string) $row['id'] ) );
		}
		$label  = main_status_labels()[ $status ] ?? $status;
		if ( 'published' === $status && ! empty( $row['scheduled_publish_at'] ) && strtotime( (string) $row['scheduled_publish_at'] ) > time() ) {
			/* translators: %s: date */
			$label = sprintf( __( 'Scheduled for %s', 'acadvizen-cms' ), wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['scheduled_publish_at'] ) ) );
		}
		return '<span class="acv-main-badge acv-main-badge--' . esc_attr( 'published' === $status ? 'ok' : 'muted' ) . '">' . esc_html( $label ) . '</span>';
	}
	return ! empty( $row['is_active'] )
		? '<span class="acv-main-badge acv-main-badge--ok">' . esc_html__( 'Shown on Main', 'acadvizen-cms' ) . '</span>'
		: '<span class="acv-main-badge acv-main-badge--muted">' . esc_html__( 'Hidden', 'acadvizen-cms' ) . '</span>';
}

function render_main_list( string $entity, array $definition ): void {
	$search  = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$status  = isset( $_GET['status'] ) ? sanitize_key( wp_unslash( $_GET['status'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$trashed = ! empty( $_GET['trashed'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$paged   = max( 1, isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1 ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	printf( '<h1 class="wp-heading-inline">%s</h1>', esc_html__( 'Main Website', 'acadvizen-cms' ) . ' — ' . esc_html( $definition['label'] ) );
	if ( false !== ( $definition['creatable'] ?? true ) ) {
		printf( ' <a class="page-title-action" href="%1$s">%2$s</a>', esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'edit' ) ) ), esc_html__( 'Add new', 'acadvizen-cms' ) );
	}
	echo '<hr class="wp-header-end" />';
	render_main_notice();
	echo '<p class="description">' . esc_html__( 'This is the content www.acadvizen.com shows. Saving here updates the Main Website directly; its design stays as it is.', 'acadvizen-cms' ) . '</p>';
	render_main_tabs( $entity );
	if ( ! render_main_connection_notice() ) {
		return;
	}
	if ( 'blogs' === $entity ) {
		maybe_pull_on_blogs_screen(); // Blogs changed in Main's own admin reach their Enrollment copies.
		render_blog_pull_line();
	}

	$args = array( 'op' => 'list', 'entity' => $entity, 'search' => $search, 'limit' => MAIN_PER_PAGE, 'offset' => ( $paged - 1 ) * MAIN_PER_PAGE );
	$parent_id = isset( $_GET['parent_id'] ) ? sanitize_text_field( wp_unslash( $_GET['parent_id'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( ! empty( $definition['parent'] ) ) {
		$options = main_parent_options( $definition );
		echo '<form method="get" class="acv-main-filters"><input type="hidden" name="page" value="' . esc_attr( MAIN_CONTENT_PAGE ) . '" /><input type="hidden" name="entity" value="' . esc_attr( $entity ) . '" />';
		echo '<label>' . esc_html( (string) $definition['parent']['label'] ) . ' <select name="parent_id" onchange="this.form.submit()"><option value="">' . esc_html__( '— choose —', 'acadvizen-cms' ) . '</option>';
		foreach ( $options as $option_id => $option_label ) {
			printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $option_id ), selected( $parent_id, (string) $option_id, false ), esc_html( (string) $option_label ) );
		}
		echo '</select></label> <noscript><input type="submit" class="button" value="' . esc_attr__( 'Show', 'acadvizen-cms' ) . '" /></noscript></form>';
		if ( '' === $parent_id || ! isset( $options[ $parent_id ] ) ) {
			echo '<p class="acv-main-empty">' . esc_html__( 'Choose a course to see its sections.', 'acadvizen-cms' ) . '</p>';
			return;
		}
		$args['parent_id'] = $parent_id;
		printf( '<p><a class="button" href="%1$s">%2$s</a></p>', esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'parent_id' => $parent_id ) ) ), esc_html__( 'Add a section to this course', 'acadvizen-cms' ) );
	}
	$filters = array();
	foreach ( (array) ( $definition['filter'] ?? array() ) as $filter_field => $filter_options ) {
		$wanted = isset( $_GET[ 'f_' . $filter_field ] ) ? sanitize_key( wp_unslash( $_GET[ 'f_' . $filter_field ] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '' !== $wanted && isset( $filter_options[ $wanted ] ) ) {
			$filters[ $filter_field ] = $wanted;
		}
	}
	if ( $filters ) {
		$args['filter'] = $filters;
	}
	if ( 'media' === $entity && main_can( 'media', 'edit' ) ) {
		?>
		<form method="post" enctype="multipart/form-data" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" class="acv-main-box acv-main-upload">
			<input type="hidden" name="action" value="acv_cms_main_upload" />
			<?php wp_nonce_field( 'acv_cms_main_upload' ); ?>
			<p><strong><?php esc_html_e( 'Add an image to the Main Website library', 'acadvizen-cms' ); ?></strong><br /><span class="description"><?php esc_html_e( 'JPEG, PNG, WebP, GIF or AVIF, at most 3 MB.', 'acadvizen-cms' ); ?></span></p>
			<p><input type="file" name="acv_file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" required />
			<label><?php esc_html_e( 'Alt text', 'acadvizen-cms' ); ?> <input type="text" name="acv_alt" size="40" /></label>
			<?php submit_button( __( 'Upload', 'acadvizen-cms' ), 'secondary', 'submit', false ); ?></p>
		</form>
		<?php
	}
	if ( 'home_lists' === $entity && main_can( 'home_lists', 'publish' ) ) {
		echo '<div class="acv-main-box acv-main-import"><p>' . esc_html__( 'The homepage shows built-in lists until an edited version exists. To change one, first copy what the homepage shows today: it looks exactly the same afterwards, and you can then edit, reorder or remove items. Hiding a list brings back the built-in one.', 'acadvizen-cms' ) . '</p>';
		printf( '<p><a class="button" href="%1$s" data-confirm="%2$s">%3$s</a></p></div>', esc_url( main_action_url( 'import_home', 'home_lists', 'all' ) ), esc_attr__( 'Copy the lists the homepage shows today? Lists already copied are not changed.', 'acadvizen-cms' ), esc_html__( 'Copy what the homepage shows today', 'acadvizen-cms' ) );
	}
	if ( 'menus' === $entity && main_can( 'menus', 'publish' ) ) {
		echo '<div class="acv-main-box acv-main-import"><p>' . esc_html__( 'A menu that has no links here shows the website\'s built-in links. To change those, first copy them here: the website looks exactly the same afterwards, and you can then edit, reorder or hide each link.', 'acadvizen-cms' ) . '</p>';
		printf( '<p><a class="button" href="%1$s" data-confirm="%2$s">%3$s</a></p></div>', esc_url( main_action_url( 'import_menus', 'menus', 'all' ) ), esc_attr__( 'Copy the links the website shows today into menus that have none yet? Menus that already have links are not changed.', 'acadvizen-cms' ), esc_html__( 'Copy the links shown today', 'acadvizen-cms' ) );
	}
	if ( $status ) {
		$args['status'] = $status;
	}
	if ( $trashed ) {
		$args['trashed'] = true;
	}
	$result = main_content_request( $args );
	?>
	<form method="get" class="acv-main-filters">
		<input type="hidden" name="page" value="<?php echo esc_attr( MAIN_CONTENT_PAGE ); ?>" />
		<input type="hidden" name="entity" value="<?php echo esc_attr( $entity ); ?>" />
		<?php if ( 'status' === $definition['workflow'] ) : ?>
			<select name="status" aria-label="<?php esc_attr_e( 'Status', 'acadvizen-cms' ); ?>">
				<option value=""><?php esc_html_e( 'All statuses', 'acadvizen-cms' ); ?></option>
				<?php foreach ( main_status_labels() as $value => $label ) : ?>
					<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?>><?php echo esc_html( $label ); ?></option>
				<?php endforeach; ?>
			</select>
		<?php endif; ?>
			<?php foreach ( (array) ( $definition['filter'] ?? array() ) as $filter_field => $filter_options ) : ?>
				<select name="<?php echo esc_attr( 'f_' . $filter_field ); ?>" aria-label="<?php esc_attr_e( 'Show', 'acadvizen-cms' ); ?>">
					<option value=""><?php esc_html_e( 'All', 'acadvizen-cms' ); ?></option>
					<?php foreach ( $filter_options as $option => $option_label ) : ?>
						<option value="<?php echo esc_attr( (string) $option ); ?>" <?php selected( $filters[ $filter_field ] ?? '', (string) $option ); ?>><?php echo esc_html( (string) $option_label ); ?></option>
					<?php endforeach; ?>
				</select>
			<?php endforeach; ?>
			<?php if ( empty( $definition['singleton'] ) ) : ?>
			<input type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search title or address', 'acadvizen-cms' ); ?>" />
			<?php endif; ?>
		<?php submit_button( __( 'Filter', 'acadvizen-cms' ), 'secondary', '', false ); ?>
		<?php if ( $definition['trash'] ) : ?>
			<a href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity ) + ( $trashed ? array() : array( 'trashed' => 1 ) ) ) ); ?>"><?php echo $trashed ? esc_html__( '← Back to all', 'acadvizen-cms' ) : esc_html__( 'Trash', 'acadvizen-cms' ); ?></a>
		<?php endif; ?>
	</form>
	<?php
	if ( ! $result['ok'] ) {
		echo '<div class="notice notice-error"><p>' . esc_html( main_error_text( $result ) ) . '</p></div>';
		return;
	}
	$rows  = (array) ( $result['body']['data'] ?? array() );
	$total = (int) ( $result['body']['total'] ?? count( $rows ) );
	if ( ! main_can( $entity, 'approve' ) ) {
		$rows  = array_values( array_filter( $rows, static fn( $row ) => main_manages_record( $entity, (string) ( (array) $row )['id'] ) ) );
		$total = count( $rows );
		echo '<p class="description">' . esc_html__( 'You see the items you created here. Editors and Administrators see all of them.', 'acadvizen-cms' ) . '</p>';
	}
	if ( ! $rows ) {
		echo '<p class="acv-main-empty">' . esc_html( $trashed ? __( 'The trash is empty.', 'acadvizen-cms' ) : __( 'Nothing here yet. Use "Add new" to create the first one.', 'acadvizen-cms' ) ) . '</p>';
		return;
	}
	echo '<table class="widefat striped acv-main-table"><thead><tr><th>' . esc_html__( 'Title', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Address on www.acadvizen.com', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Status', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Last change', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Actions', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( $rows as $row ) {
		$row     = (array) $row;
		$id      = (string) $row['id'];
		$title   = ! empty( $definition['singleton'] ) ? (string) $definition['singular'] : (string) ( $row[ $definition['title'] ] ?? '' );
		if ( 'seo_metadata' === $entity ) {
			$url = main_public_url( 'pages', (string) ( $row['page_slug'] ?? '' ) );
		}
		if ( ! empty( $definition['key_labels'][ $row['section_key'] ?? '' ] ) ) {
			$title = $definition['key_labels'][ $row['section_key'] ] . ( '' !== $title ? ' — ' . $title : '' );
		}
		if ( ! empty( $definition['list_extra'] ) && ! empty( $row[ $definition['list_extra'] ] ) ) {
			$title .= ' → ' . (string) $row[ $definition['list_extra'] ];
		}
		if ( ! empty( $row['menu_location'] ) && isset( $definition['filter']['menu_location'][ $row['menu_location'] ] ) ) {
			$title = $definition['filter']['menu_location'][ $row['menu_location'] ] . ': ' . $title;
		}
		$url     = main_public_url( $entity, (string) ( $row['slug'] ?? '' ) );
		$edit    = main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) );
		$actions = array();
		if ( empty( $row['deleted_at'] ) ) {
			$actions[] = '<a href="' . esc_url( $edit ) . '">' . esc_html__( 'Edit', 'acadvizen-cms' ) . '</a>';
			if ( ! empty( $definition['preview'] ) ) {
				$actions[] = '<a href="' . esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'preview', 'id' => $id ) ) ) . '">' . esc_html__( 'Preview', 'acadvizen-cms' ) . '</a>';
			}
			if ( $url && ( 'published' === ( $row['status'] ?? '' ) || ! empty( $row['is_active'] ) ) ) {
				$actions[] = '<a href="' . esc_url( $url ) . '" target="_blank" rel="noopener">' . esc_html__( 'View live', 'acadvizen-cms' ) . '</a>';
			}
			if ( 'active' === $definition['workflow'] && main_can( $entity, 'publish' ) ) {
				$do        = empty( $row['is_active'] ) ? 'show' : 'hide';
				$actions[] = '<a href="' . esc_url( main_action_url( $do, $entity, $id ) ) . '">' . esc_html( 'show' === $do ? __( 'Show on Main', 'acadvizen-cms' ) : __( 'Hide', 'acadvizen-cms' ) ) . '</a>';
			}
			if ( $definition['trash'] ) {
				$actions[] = '<a class="acv-danger" href="' . esc_url( main_action_url( 'trash', $entity, $id ) ) . '" data-confirm="' . esc_attr__( 'Move to the trash? It disappears from the Main Website.', 'acadvizen-cms' ) . '">' . esc_html__( 'Trash', 'acadvizen-cms' ) . '</a>';
			}
		} else {
			$actions[] = '<a href="' . esc_url( main_action_url( 'restore', $entity, $id ) ) . '">' . esc_html__( 'Restore', 'acadvizen-cms' ) . '</a>';
		}
		$deletable = $definition['trash'] ? ! empty( $row['deleted_at'] ) : empty( $row['is_active'] );
		if ( false === ( $definition['deletable'] ?? true ) ) {
			$deletable = false;
		}
		if ( $deletable && main_can( $entity, 'delete' ) ) {
			$actions[] = '<a class="acv-danger" href="' . esc_url( main_action_url( 'delete', $entity, $id ) ) . '" data-confirm="' . esc_attr( (string) ( $definition['delete_note'] ?? __( 'Delete permanently? This cannot be undone.', 'acadvizen-cms' ) ) ) . '">' . esc_html( (string) ( $definition['delete_label'] ?? __( 'Delete permanently', 'acadvizen-cms' ) ) ) . '</a>';
		}
		printf(
			'<tr><td>%7$s<strong><a href="%1$s">%2$s</a></strong></td><td>%3$s</td><td>%4$s</td><td>%5$s</td><td class="acv-main-actions">%6$s</td></tr>',
			esc_url( $edit ),
			esc_html( '' !== $title ? $title : __( '(no title)', 'acadvizen-cms' ) ),
			$url ? '<code>' . esc_html( (string) wp_parse_url( $url, PHP_URL_PATH ) ) . '</code>' : '—',
			render_main_status_badge( $definition, $row ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside.
			esc_html( ! empty( $row['updated_at'] ) ? wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['updated_at'] ) ) : '' ),
			implode( ' | ', $actions ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- built from escaped parts.
			! empty( $definition['list_thumb'] ) && ! empty( $row[ $definition['list_thumb'] ] ) ? '<img class="acv-main-thumb acv-main-thumb--list" src="' . esc_url( (string) $row[ $definition['list_thumb'] ] ) . '" alt="" loading="lazy" /> ' : ''
		);
	}
	echo '</tbody></table>';
	if ( $total > MAIN_PER_PAGE ) {
		echo '<p class="acv-main-pages">';
		for ( $p = 1; $p <= (int) ceil( $total / MAIN_PER_PAGE ); $p++ ) {
			printf( $p === $paged ? '<strong>%2$d</strong> ' : '<a href="%1$s">%2$d</a> ', esc_url( add_query_arg( 'paged', $p ) ), (int) $p );
		}
		echo '</p>';
	}
}

function render_main_field( string $key, array $field, $value, array $cities ): void {
	list( $label, $type ) = $field;
	$help     = (string) ( $field[2] ?? '' );
	$required = ! empty( $field[3] );
	$name     = 'acv_field[' . $key . ']';
	$id       = 'acv-field-' . $key;
	echo '<div class="acv-main-field acv-main-field--' . esc_attr( $type ) . '">';
	$config = (array) ( $field[4] ?? array() );
	if ( 'checkbox' === $type ) {
		// Some settings are on while empty (e.g. a menu link is visible unless switched off).
		$on = ! empty( $config['empty_means_on'] ) ? false !== $value : ! empty( $value );
		printf( '<label><input type="checkbox" name="%1$s" value="1" %2$s /> %3$s</label>', esc_attr( $name ), checked( $on, true, false ), esc_html( $label ) );
	} else {
		printf( '<label for="%1$s">%2$s%3$s</label>', esc_attr( $id ), esc_html( $label ), $required ? ' <span class="required">*</span>' : '' );
		switch ( $type ) {
			case 'textarea':
				printf( '<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( (string) $value ) );
				break;
			case 'lines':
				printf( '<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>', esc_attr( $id ), esc_attr( $name ), esc_textarea( implode( "\n", (array) $value ) ) );
				break;
			case 'image':
				printf( '<span class="acv-main-image"><input type="url" id="%1$s" name="%2$s" value="%3$s" placeholder="https://" /> <button type="button" class="button acv-media-pick" data-target="%1$s">%4$s</button> <button type="button" class="button acv-main-library-pick" data-target="%1$s">' . esc_html__( 'Main library', 'acadvizen-cms' ) . '</button></span>%5$s', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), esc_html__( 'Choose image', 'acadvizen-cms' ), $value ? '<img class="acv-main-thumb" src="' . esc_url( (string) $value ) . '" alt="" />' : '' );
				break;
			case 'color':
				// A text field (empty = the website default) with a colour picker next to it.
				printf( '<span class="acv-color"><input type="text" id="%1$s" name="%2$s" value="%3$s" placeholder="%4$s" pattern="(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+|\d{1,3}%%)\s*)?\)|transparent)" size="22" /> <input type="color" class="acv-color-pick" data-target="%1$s" value="%5$s" aria-label="%6$s" /></span>', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), esc_attr__( 'default', 'acadvizen-cms' ), esc_attr( preg_match( '/^#[0-9a-fA-F]{6}$/', (string) $value ) ? (string) $value : '#000000' ), esc_attr__( 'Pick a colour', 'acadvizen-cms' ) );
				break;
			case 'link':
				printf( '<input type="text" id="%1$s" name="%2$s" value="%3$s" placeholder="/page-address" %4$s />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), $required ? 'required' : '' );
				break;
			case 'number':
				printf( '<input type="number" min="0" max="10000" step="1" id="%1$s" name="%2$s" value="%3$s" />', esc_attr( $id ), esc_attr( $name ), esc_attr( null === $value ? '' : (string) $value ) );
				break;
			case 'choice':
				printf( '<select id="%1$s" name="%2$s" %3$s>', esc_attr( $id ), esc_attr( $name ), $required ? 'required' : '' );
				if ( ! $required ) {
					echo '<option value="">' . esc_html__( '— default —', 'acadvizen-cms' ) . '</option>';
				}
				foreach ( (array) ( $config['options'] ?? array() ) as $option => $option_label ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $option ), selected( (string) $value, (string) $option, false ), esc_html( (string) $option_label ) );
				}
				echo '</select>';
				break;
			case 'relation':
				echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '"><option value="">' . esc_html__( '— none —', 'acadvizen-cms' ) . '</option>';
				foreach ( main_relation_options( (string) ( $config['entity'] ?? '' ) ) as $option_id => $option_label ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $option_id ), selected( (string) $value, (string) $option_id, false ), esc_html( (string) $option_label ) );
				}
				echo '</select>';
				break;
			case 'parent_select':
				echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" required><option value="">' . esc_html__( '— choose —', 'acadvizen-cms' ) . '</option>';
				foreach ( (array) ( $GLOBALS['acv_main_parent_options'] ?? array() ) as $option_id => $option_label ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $option_id ), selected( (string) $value, (string) $option_id, false ), esc_html( (string) $option_label ) );
				}
				echo '</select>';
				break;
			case 'menu_parent':
				echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '"><option value="">' . esc_html__( '— top level —', 'acadvizen-cms' ) . '</option>';
				foreach ( (array) ( $GLOBALS['acv_main_menu_parents'] ?? array() ) as $parent ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $parent['id'] ), selected( (string) $value, (string) $parent['id'], false ), esc_html( (string) $parent['title'] . ' (' . $parent['menu_location'] . ')' ) );
				}
				echo '</select>';
				break;
			case 'json':
				printf(
					'<div class="acv-json" data-value="%1$s" data-shape="%2$s" data-template="%3$s" data-hint="%4$s" data-target="%5$s"></div><input type="hidden" id="%5$s" name="%6$s" value="" />',
					esc_attr( (string) wp_json_encode( $value ) ),
					esc_attr( (string) ( $config['shape'] ?? 'array' ) ),
					esc_attr( (string) wp_json_encode( $config['template'] ?? new \stdClass() ) ),
					esc_attr( (string) ( $config['hint'] ?? '' ) ),
					esc_attr( $id ),
					esc_attr( $name )
				);
				break;
			case 'rating':
				printf( '<input type="number" min="1" max="5" id="%1$s" name="%2$s" value="%3$s" />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ) );
				break;
			case 'datetime':
				$local = $value ? wp_date( 'Y-m-d\TH:i', strtotime( (string) $value ) ) : '';
				printf( '<input type="datetime-local" id="%1$s" name="%2$s" value="%3$s" /> <span class="description">%4$s</span>', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $local ), esc_html( wp_timezone_string() ) );
				break;
			case 'city':
				echo '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '"><option value="">' . esc_html__( '— none —', 'acadvizen-cms' ) . '</option>';
				foreach ( $cities as $city ) {
					printf( '<option value="%1$s" %2$s>%3$s</option>', esc_attr( (string) $city['id'] ), selected( (string) $value, (string) $city['id'], false ), esc_html( (string) $city['name'] ) );
				}
				echo '</select>';
				break;
			case 'blocks':
				printf( '<div id="acv-blocks" data-blocks="%1$s" data-plain="%2$s" data-target="%3$s"></div><input type="hidden" id="%3$s" name="%4$s" value="" />', esc_attr( (string) wp_json_encode( $value ?: array( 'blocks' => array() ) ) ), esc_attr( (string) ( $GLOBALS['acv_main_plain_article'] ?? '' ) ), esc_attr( $id ), esc_attr( $name ) );
				break;
			case 'url':
				printf( '<input type="url" id="%1$s" name="%2$s" value="%3$s" placeholder="https://" />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ) );
				break;
			default:
				printf( '<input type="text" id="%1$s" name="%2$s" value="%3$s" %4$s />', esc_attr( $id ), esc_attr( $name ), esc_attr( (string) $value ), $required ? 'required' : '' );
		}
	}
	if ( '' !== $help ) {
		echo '<p class="description">' . esc_html( $help ) . '</p>';
	}
	echo '</div>';
}

function render_main_edit( string $entity, array $definition, string $id ): void {
	$creating = '' === $id;
	$row      = array();
	if ( ! $creating ) {
		$result = main_content_request( array( 'op' => 'get', 'entity' => $entity, 'id' => $id ) );
		if ( ! $result['ok'] ) {
			render_main_notice();
			echo '<div class="notice notice-error"><p>' . esc_html( main_error_text( $result ) ) . '</p></div>';
			return;
		}
		$row = (array) $result['body']['data'];
	}
	$unsaved = get_transient( 'acv_cms_main_unsaved_' . get_current_user_id() );
	if ( is_array( $unsaved ) ) {
		delete_transient( 'acv_cms_main_unsaved_' . get_current_user_id() );
		$row = array_merge( $row, $unsaved ); // Keep what was typed after a refused save.
	}
	// A blog stored only as plain text (no blocks yet) opens with that text, split into paragraphs.
	$GLOBALS['acv_main_plain_article'] = 'blogs' === $entity ? (string) ( $row['content'] ?? '' ) : '';
	if ( ! empty( $definition['parent'] ) ) {
		$GLOBALS['acv_main_parent_options'] = main_parent_options( $definition );
		if ( $creating && isset( $_GET['parent_id'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$row[ $definition['parent']['field'] ] = sanitize_text_field( wp_unslash( $_GET['parent_id'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}
	}
	if ( 'home_lists' === $entity && ! empty( $row['list_shape'] ) ) {
		$shape                                  = (array) $row['list_shape'];
		$definition['fields']['items_json'][4] = array(
			'shape'    => ! empty( $shape['strings'] ) ? 'strings' : 'array',
			'template' => array_fill_keys( array_map( 'strval', (array) ( $shape['fields'] ?? array() ) ), '' ),
		);
	}
	if ( 'menus' === $entity ) {
		$parents                          = main_content_request( array( 'op' => 'list', 'entity' => 'menus', 'limit' => 200 ) );
		$GLOBALS['acv_main_menu_parents'] = $parents['ok'] ? array_values( array_filter( array_map( static fn( $r ) => (array) $r, (array) $parents['body']['data'] ), static fn( $r ) => (string) $r['id'] !== $id && empty( $r['parent_id'] ) ) ) : array();
	}
	$cities = array();
	if ( 'locations' === $entity ) {
		$list   = main_content_request( array( 'op' => 'list', 'entity' => 'cities', 'limit' => 200 ) );
		$cities = $list['ok'] ? (array) $list['body']['data'] : array();
	}
	$status   = (string) ( $row['status'] ?? 'draft' );
	$is_draft = ! empty( $row['draft_of_id'] );
	$url      = main_public_url( $entity, (string) ( $row['slug'] ?? '' ) );
	$target   = 'blogs' === $entity && ! $creating ? main_blog_target( $id ) : TARGET_MAIN;
	if ( 'blogs' === $entity && ! $creating ) {
		$status = main_blog_display_status( $target, $status, enrollment_copy_status( $id ) );
	}

	/* translators: %s: content type */
	printf( '<h1>%1$s</h1>', esc_html( sprintf( $creating ? __( 'New %s', 'acadvizen-cms' ) : __( 'Edit %s', 'acadvizen-cms' ), strtolower( $definition['singular'] ) ) ) );
	printf( '<p><a href="%1$s">← %2$s</a></p>', esc_url( main_screen_url( array( 'entity' => $entity ) ) ), esc_html( $definition['label'] ) );
	render_main_notice();
	if ( ! render_main_connection_notice() ) {
		return;
	}
	if ( $is_draft ) {
		echo '<div class="notice notice-info"><p>' . esc_html__( 'This is a private draft copy of a live page. Visitors keep seeing the live page until you set the status to Published.', 'acadvizen-cms' ) . '</p></div>';
	}
	if ( 'pages' === $entity && ! empty( $row['seo_override']['id'] ) ) {
		printf(
			'<div class="notice notice-warning"><p>%1$s <a href="%2$s">%3$s</a> · <a href="%4$s" data-confirm="%5$s">%6$s</a></p></div>',
			esc_html__( 'An SEO override for this address is in use: search engines see its title and description, not the SEO fields below.', 'acadvizen-cms' ),
			esc_url( main_screen_url( array( 'entity' => 'seo_metadata', 'view' => 'edit', 'id' => (string) $row['seo_override']['id'] ) ) ),
			esc_html__( 'Edit the override', 'acadvizen-cms' ),
			esc_url( main_action_url( 'delete', 'seo_metadata', (string) $row['seo_override']['id'] ) ),
			esc_attr__( 'Remove this override? The page\'s own SEO fields apply again.', 'acadvizen-cms' ),
			esc_html__( 'Remove it', 'acadvizen-cms' )
		);
	}
	if ( 'blogs' === $entity && ! empty( $row['legacy_blocks'] ) ) {
		echo '<div class="notice notice-warning"><p>' . esc_html__( 'This blog\'s article is drawn from an older storage on the Main Website, so changes to the article below will not show there. Title, summary, images and SEO fields work as usual. Ask your developer to convert it.', 'acadvizen-cms' ) . '</p></div>';
	}
	?>
	<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" id="acv-main-form" class="acv-main-grid">
		<input type="hidden" name="action" value="acv_cms_main_save" />
		<input type="hidden" name="entity" value="<?php echo esc_attr( $entity ); ?>" />
		<input type="hidden" name="id" value="<?php echo esc_attr( $id ); ?>" />
		<?php if ( ! $creating && array_key_exists( 'updated_at', $row ) ) : ?>
			<?php // The version opened here: a save is refused if the record changed elsewhere meanwhile. ?>
			<input type="hidden" name="acv_expected_updated_at" value="<?php echo esc_attr( (string) ( $row['updated_at'] ?? '' ) ); ?>" />
		<?php endif; ?>
		<?php wp_nonce_field( 'acv_cms_main_save_' . $entity ); ?>
		<div class="acv-main-fields">
			<?php
			foreach ( $definition['fields'] as $key => $field ) {
				render_main_field( $key, $field, $row[ $key ] ?? null, $cities );
			}
			?>
		</div>
		<aside class="acv-main-side">
			<div class="acv-main-box">
				<h2><?php esc_html_e( 'Publish', 'acadvizen-cms' ); ?></h2>
				<p><strong><?php esc_html_e( 'Publish To', 'acadvizen-cms' ); ?></strong><br />
				<?php if ( ! empty( $definition['targets'] ) ) : ?>
					<select name="acv_target">
						<?php foreach ( target_labels() as $value => $label ) : ?>
							<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $target, $value ); ?>><?php echo esc_html( $label ); ?></option>
						<?php endforeach; ?>
					</select>
					<span class="description"><?php esc_html_e( 'Main: www.acadvizen.com/blog. Enrollment: a post on enroll.acadvizen.com. Both: both, each in its own design.', 'acadvizen-cms' ); ?></span>
				<?php else : ?>
					<?php esc_html_e( 'Main Website', 'acadvizen-cms' ); ?>
					<span class="description"><?php esc_html_e( 'This kind of content exists only on www.acadvizen.com. Enrollment pages are edited in WordPress → Pages with Elementor.', 'acadvizen-cms' ); ?></span>
				<?php endif; ?>
				</p>
				<?php if ( 'status' === $definition['workflow'] ) : ?>
					<p><label for="acv-status"><strong><?php esc_html_e( 'Status', 'acadvizen-cms' ); ?></strong></label><br />
					<select id="acv-status" name="acv_status">
						<?php foreach ( main_status_labels() as $value => $label ) : ?>
							<?php if ( in_array( $value, main_allowed_statuses( $entity ), true ) || $value === $status ) : ?>
								<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $status, $value ); ?> <?php disabled( ! in_array( $value, main_allowed_statuses( $entity ), true ) ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endif; ?>
						<?php endforeach; ?>
					</select>
					<span class="description"><?php esc_html_e( 'Only Published is shown on the website. In review and Approved are for your team.', 'acadvizen-cms' ); ?></span></p>
				<?php elseif ( 'active' === $definition['workflow'] && main_can( $entity, 'publish' ) ) : ?>
					<p><label><input type="checkbox" name="acv_active" value="1" <?php checked( ! empty( $row['is_active'] ) ); ?> /> <?php esc_html_e( 'Show on the Main Website', 'acadvizen-cms' ); ?></label></p>
				<?php elseif ( 'none' === $definition['workflow'] ) : ?>
					<p class="description"><?php esc_html_e( 'Used on every page of www.acadvizen.com. Saving updates the website within a minute.', 'acadvizen-cms' ); ?></p>
				<?php endif; ?>
				<p class="acv-main-buttons">
					<?php submit_button( $creating ? __( 'Create', 'acadvizen-cms' ) : __( 'Save', 'acadvizen-cms' ), 'primary', 'submit', false ); ?>
					<?php if ( ! $creating && ! empty( $definition['preview'] ) ) : ?>
						<a class="button" href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'preview', 'id' => $id ) ) ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Preview (desktop, tablet, mobile)', 'acadvizen-cms' ); ?></a>
					<?php endif; ?>
				</p>
				<?php if ( $url && ! $creating && ( 'published' === $status || ! empty( $row['is_active'] ) ) && ! $is_draft ) : ?>
					<p><a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'View on www.acadvizen.com', 'acadvizen-cms' ); ?> ↗</a></p>
				<?php endif; ?>
				<?php if ( ! $creating && 'pages' === $entity && ! $is_draft && 'published' === $status ) : ?>
					<p><?php if ( ! empty( $row['draft_id'] ) ) : ?>
						<a class="button" href="<?php echo esc_url( main_screen_url( array( 'entity' => 'pages', 'view' => 'edit', 'id' => (string) $row['draft_id'] ) ) ); ?>"><?php esc_html_e( 'Continue the private draft', 'acadvizen-cms' ); ?></a>
					<?php else : ?>
						<a class="button" href="<?php echo esc_url( main_action_url( 'start_draft', 'pages', $id ) ); ?>"><?php esc_html_e( 'Prepare changes privately', 'acadvizen-cms' ); ?></a>
					<?php endif; ?>
					<br /><span class="description"><?php esc_html_e( 'This page is live: changes saved here, including sections, show immediately. A private draft keeps them hidden until you publish it.', 'acadvizen-cms' ); ?></span></p>
				<?php endif; ?>
				<?php if ( ! $creating && ! empty( $row['updated_at'] ) ) : ?>
					<p class="description">
						<?php
						/* translators: %s: date and time */
						echo esc_html( sprintf( __( 'Last change: %s', 'acadvizen-cms' ), wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( (string) $row['updated_at'] ) ) ) );
						?>
					</p>
				<?php endif; ?>
			</div>
		</aside>
	</form>
	<?php
	if ( ! empty( $definition['sections'] ) && ! $creating ) {
		$sections = main_content_request( array( 'op' => 'list', 'entity' => 'sections', 'parent' => $entity, 'page_id' => $id ) );
		?>
		<div class="acv-main-box acv-main-sections-box">
			<h2><?php esc_html_e( 'Sections', 'acadvizen-cms' ); ?></h2>
			<p class="description"><?php esc_html_e( 'The blocks this page is built from, in order, drawn with the Main Website\'s own design. Drag to reorder. Each section is saved on its own. Changes affect this page only.', 'acadvizen-cms' ); ?></p>
			<?php if ( $sections['ok'] ) : ?>
				<div id="acv-sections"
					data-page-id="<?php echo esc_attr( $id ); ?>"
					data-parent="<?php echo esc_attr( $entity ); ?>"
					data-positions="<?php echo esc_attr( 'pages' === $entity ? '' : 'top,after_intro,before_faq,end' ); ?>"
					data-sections="<?php echo esc_attr( (string) wp_json_encode( (array) $sections['body']['data'] ) ); ?>"
					data-ajax="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"
					data-nonce="<?php echo esc_attr( wp_create_nonce( 'acv_cms_main_section' ) ); ?>"></div>
			<?php else : ?>
				<p class="notice notice-error"><?php echo esc_html( main_error_text( $sections ) ); ?></p>
			<?php endif; ?>
		</div>
		<?php
	}
	if ( ! $creating ) {
		$snapshots = list_main_snapshots( $entity, $id );
		echo '<div class="acv-main-box"><h2>' . esc_html__( 'Earlier versions', 'acadvizen-cms' ) . '</h2>';
		if ( ! $snapshots ) {
			echo '<p class="description">' . esc_html__( 'No earlier versions yet. The first change you save here keeps the version before it, so it can always be undone.', 'acadvizen-cms' ) . '</p>';
		} else {
			echo '<ul class="acv-main-versions">';
			foreach ( $snapshots as $index => $snapshot ) {
				printf(
					'<li>%1$s — %2$s %3$s</li>',
					esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $snapshot->post_date_gmt . ' UTC' ) ) ),
					esc_html( (string) get_the_author_meta( 'display_name', (int) $snapshot->post_author ) ),
					0 === $index ? '<em>' . esc_html__( '(current)', 'acadvizen-cms' ) . '</em>' : '<a class="button button-small" href="' . esc_url( main_action_url( 'restore_version', $entity, $id, array( 'snapshot' => $snapshot->ID ) ) ) . '" data-confirm="' . esc_attr__( 'Bring back this version? The current text is kept as a version too.', 'acadvizen-cms' ) . '">' . esc_html__( 'Restore', 'acadvizen-cms' ) . '</a>'
				);
			}
			echo '</ul>';
		}
		echo '</div>';
	}
}

/** Desktop / tablet / mobile preview of the Main Website's own rendering. */
function render_main_preview( string $entity, string $id ): void {
	$url = main_preview_url( $entity, $id );
	printf( '<h1>%s</h1>', esc_html__( 'Preview on the Main Website', 'acadvizen-cms' ) );
	if ( '' === $url ) {
		echo '<div class="notice notice-warning"><p>' . esc_html__( 'Preview needs the connection to the Main Website (shared secret).', 'acadvizen-cms' ) . '</p></div>';
		return;
	}
	?>
	<p class="acv-preview-toolbar" role="group" aria-label="<?php esc_attr_e( 'Device', 'acadvizen-cms' ); ?>">
		<button type="button" class="button button-primary" data-width="1280"><?php esc_html_e( 'Desktop', 'acadvizen-cms' ); ?></button>
		<button type="button" class="button" data-width="820"><?php esc_html_e( 'Tablet', 'acadvizen-cms' ); ?></button>
		<button type="button" class="button" data-width="390"><?php esc_html_e( 'Mobile', 'acadvizen-cms' ); ?></button>
		<a class="button" href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener"><?php esc_html_e( 'Open in a new tab', 'acadvizen-cms' ); ?></a>
		<a href="<?php echo esc_url( main_screen_url( array( 'entity' => $entity, 'view' => 'edit', 'id' => $id ) ) ); ?>"><?php esc_html_e( '← Back to editing', 'acadvizen-cms' ); ?></a>
	</p>
	<p class="description"><?php esc_html_e( 'Exactly how www.acadvizen.com draws this content, including unpublished changes. The link is valid for 15 minutes; reload this page for a new one.', 'acadvizen-cms' ); ?></p>
	<div class="acv-preview-stage"><iframe id="acv-preview-frame" title="<?php esc_attr_e( 'Main Website preview', 'acadvizen-cms' ); ?>" src="<?php echo esc_url( $url ); ?>" style="width:1280px"></iframe></div>
	<?php
}

function render_main_log(): void {
	if ( ! current_user_can( 'edit_pages' ) ) {
		wp_die( esc_html__( 'You are not allowed to see this.', 'acadvizen-cms' ), 403 );
	}
	echo '<div class="wrap acv-main"><h1>' . esc_html__( 'Main Website — activity', 'acadvizen-cms' ) . '</h1>';
	render_main_tabs( '' );
	$log = get_option( MAIN_CONTENT_LOG, array() );
	if ( ! $log ) {
		echo '<p>' . esc_html__( 'No changes yet.', 'acadvizen-cms' ) . '</p></div>';
		return;
	}
	echo '<table class="widefat striped"><thead><tr><th>' . esc_html__( 'When', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Who', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'What', 'acadvizen-cms' ) . '</th><th>' . esc_html__( 'Result', 'acadvizen-cms' ) . '</th></tr></thead><tbody>';
	foreach ( (array) $log as $entry ) {
		printf(
			'<tr><td>%1$s</td><td>%2$s</td><td>%3$s</td><td>%4$s</td></tr>',
			esc_html( wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), (int) $entry['at'] ) ),
			esc_html( (string) $entry['user'] ),
			esc_html( $entry['op'] . ' ' . $entry['entity'] . ( '' !== (string) $entry['id'] ? ' ' . substr( (string) $entry['id'], 0, 8 ) : '' ) ),
			$entry['ok'] ? '<span class="acv-main-badge acv-main-badge--ok">' . esc_html__( 'Done', 'acadvizen-cms' ) . '</span>' : '<span class="acv-main-badge acv-main-badge--error">' . esc_html( (string) $entry['error'] ) . '</span>'
		);
	}
	echo '</tbody></table></div>';
}

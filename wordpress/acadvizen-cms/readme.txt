=== Acadvizen Master Admin ===
Requires at least: 6.5
Requires PHP: 8.0
Stable tag: 0.3.0

One WordPress admin for both Acadvizen websites. Design with Elementor, choose "Publish To"
(Enrollment, Main or Both), publish. Pages for www.acadvizen.com are rendered by WordPress and
Elementor (Render Bridge) and served by the Main Website at their own address.

Full architecture, security model, configuration and limitations:
docs/ACADVIZEN_MASTER_ADMIN.md in the Main Website repository.

== What it adds ==

* "Acadvizen Master Admin" menu: Dashboard, Pages, Templates, Header & Footer, Menus, Global
  Styles, Main Blogs, Courses, Locations, Cities & Areas, Blog Categories, FAQs, Testimonials,
  Tools, Media, SEO, Redirects, Publishing, Versions & Rollback, Settings. Existing screens are
  linked, not replaced.
* "Publish To" on pages, courses, locations and templates (edit screen and Elementor's
  Page Settings panel). Existing pages default to Enrollment, so nothing changes until chosen.
* Render Bridge: signed self-render of Main/Both pages, stored as versions with rollback,
  signed notification to the Main Website, retries, plain-language status. Only Publish/Update
  publishes (Elementor autosaves do not); an interrupted publish restarts by itself. Versions
  are stored compressed, 5 per page; one site-wide re-render and one job per page wait at a time.
* Main Website migration: Import Main Website (bundles from tools/main-to-elementor; repeatable,
  Undo import, no revisions), Website Design (one Elementor template per content type, Main
  Website CSS), design shortcodes [acv_field] [acv_url] [acv_loop] [acv_breadcrumbs] [acv_toc],
  and [acv_lead_form] (the Main lead form: same request to the Main Website's /api/cms/leads).
* Structured content: Courses and Locations (Elementor-designed, with details), Cities & Areas,
  FAQs, Testimonials and Tools (placed with shortcodes [acv_faqs] [acv_testimonials] [acv_tools]
  [acv_course_details] [acv_location_details]), Main Blogs (acv_blog) for www.acadvizen.com/blog.
  [acv_faqs] lists the FAQs ticked "Show on every page that lists FAQs" plus those assigned to
  the page being shown; [acv_faqs for="all"] lists every FAQ; schema="no" omits FAQPage schema.
* Main-only content is never served publicly by this website (404, no canonical redirect,
  excluded from search and sitemaps).
* Nothing is registered under the existing acadvizen/v1 namespace.

== API (acadvizen-cms/v1) ==

    GET /blogs, /blogs/<slug>        public: published Main/Both blogs
    GET /manifest, /render?path=     signed requests from the Main Website only

== Configuration (wp-config.php) ==

    define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
    define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '<same value as WORDPRESS_CMS_WEBHOOK_SECRET on Main, 32+ chars>' );
    // optional: ACADVIZEN_CMS_MAIN_INTERNAL_URL, ACADVIZEN_CMS_LOOPBACK_URL,
    //           ACADVIZEN_CMS_MAIN_BYPASS_TOKEN (staging: protected Vercel preview)

Production isolation: only enroll.acadvizen.com may use acadvizen.com / www.acadvizen.com as
the Main Website. A copy (e.g. staging cms.acadvizen.com) configured with a production Main
address is treated as not connected and sends nothing there.

== Uninstall ==

Deactivating changes nothing for existing Enrollment pages. Deleting the plugin removes only its
own data (logs, jobs, version table); content is kept.

=== Acadvizen Master Admin ===
Requires at least: 6.5
Requires PHP: 8.0
Stable tag: 0.7.9

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

Optional features change what the Enrollment website already does, so they are off until set to
true (Master Admin > Settings shows their state):

    define( 'ACADVIZEN_CMS_SITE_TEMPLATES', true );  // headers/footers/Theme Builder templates follow "Publish To"
    define( 'ACADVIZEN_CMS_SITEMAP_CLEANUP', true ); // drop builder internals from sitemaps; restore lost Rank Math rules
    define( 'ACADVIZEN_CMS_LOGIN_BRANDING', true );  // login logo reads "Acadvizen", links to the Main Website

Without SITE_TEMPLATES every website uses the header and footer that Header Footer Elementor /
Elementor Pro choose today: turn it on before a Main-only or Enrollment-only template is used.
Main-only content (tools, Main blogs) is always kept out of this website's sitemaps.

Activation and deactivation rebuild the rewrite rules saved in the database only (soft flush);
the plugin never writes .htaccess.

Production isolation: only enroll.acadvizen.com may use acadvizen.com / www.acadvizen.com as
the Main Website. A copy (e.g. a staging or backup copy) configured with a production Main
address is treated as not connected and sends nothing there.

== Uninstall ==

Deactivating changes nothing for existing Enrollment pages. Deleting the plugin removes only its
own data (logs, jobs, version table); content is kept.

== Changelog ==

= 0.7.9 =
* "Publish" and "Update" in the editor publish for administrators and reviewers, as in normal
  WordPress. Their own change is recorded as approved by them and published to its chosen websites at
  once (or scheduled, when it has a future date), then checked on each website as before. Editors,
  Authors and Contributors still submit for approval. Blocked widgets are still refused, and typed code
  still needs the right to publish code. ACADVIZEN_CMS_REVIEWERS_SUBMIT (true) keeps the two-step flow.
  (24 Oct 2026: 35 submissions on the live site, none approved, so nothing the team published went live.)
* A publication whose next check was lost (WP-Cron can drop a job) is checked again: hourly, and when
  Approvals or Publishing opens. 23 Oct 2026: /contact was live but showed "Publishing" for 1.5 days.
* Popups and other Theme Builder templates published through Approvals now appear: Elementor Pro's
  display-conditions cache is rebuilt when a template goes on or off the websites or its conditions
  change, and once after this update (then the Main pages are redrawn). 23 Oct 2026: the Main
  homepage's Quick Registration popup was approved and published but never shown.

= 0.7.8 =
* The admin menu follows standard WordPress: Main Blogs, Courses, Locations, Tools, FAQs and
  Testimonials are top-level menus next to Posts and Pages, edited with Elementor as before.
* The plugin's own menu is renamed "Approvals & Publishing" and opens Approvals. It keeps Publishing
  status, Versions & Rollback, Main Website, Global Styles, Website Design, Widget compatibility,
  Import and Settings. Duplicate links to Pages, Templates, Media, Menus, SEO and Redirects are gone
  (they stay in their usual WordPress menus). The old overview page is no longer listed; its address
  still works. Screen names, publishing, approvals, versions, previews, retries and rollback are
  unchanged.

= 0.7.7 =
* Media in use cannot be deleted: an image or file that published, scheduled or waiting-for-approval
  content shows (featured image, or anywhere in its Elementor design, by ID or file address) is kept,
  and the person deleting it is told which content uses it. Undo import keeps such files quietly.
  (22 Oct 2026: 322 just-imported blog images were deleted while 48 of those blogs were live.)
* Imported files get a recognisable Media Library title ("Main Website: …") instead of none.

= 0.7.6 =
* Approvals marks a waiting or approved item that changed since it was submitted (the page itself,
  or a shared style, header, footer or template it uses) and offers "Submit the current version
  again" in place of Approve / Publish, which would be refused for it.
* Elementor's editor previews a Main-only page, working copy or Main design inside the Main
  Website's header and footer (Enrollment's header and its "ADMISSIONS OPEN" bar were shown).
* Header Footer Elementor templates follow the Theme Builder rule: once the Main Website has its
  own header and footer, a header or footer shared with Both is never used on a Main page.
* "Hide from search engines" (Master Admin) is published as noindex everywhere: the Main render's
  noindex flag, the page's robots tag (Rank Math and WordPress) and both sitemaps. Before, a page
  ticked there could be published to the Main Website as "index, follow".
* A record can be drawn by a design chosen for it (_acv_design_template), e.g. the area course
  pages; [acv_loop] gains layout="row" and same_design="yes".

= 0.7.5 =
* Every response of the plugin's REST routes, errors included, is marked not cacheable for
  LiteSpeed before the route runs (a signed 404 from /render was cached and served to anonymous
  visitors).
* The recurring jobs are re-created on each manifest request when WP-Cron has lost them.

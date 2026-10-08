# Acadvizen Master Admin and Elementor Render Bridge

One WordPress and one `/wp-admin/` manage both websites. The Enrollment website is that WordPress's public address (enroll.acadvizen.com); the Master CMS is its admin address (`https://cms.acadvizen.com/wp-admin/`, section 1). The administrator designs with Elementor, chooses **Publish To** (Enrollment, Main or Both) and publishes. Pages for www.acadvizen.com are rendered by WordPress and Elementor. Next.js serves the result at the page's own address; it never re-creates Elementor widgets.

> **Status (2026-10-03).** Verified end to end on staging: `cms.acadvizen.com` (a copy of enroll) publishing to a Vercel preview of this branch. The stack is WordPress 7.0.6, Astra 4.13.6, Elementor 4.3.3, Elementor Pro, Header Footer Elementor, Max Mega Menu, Contact Form 7 and Rank Math. **Not yet deployed to production**; see section 11. Section 14 has the verification record.

## 1. Architecture

```
                         enroll.acadvizen.com  (WordPress + Elementor, ONE /wp-admin)
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ Admin designs in Elementor ── Publish To: Enrollment | Main | Both ── Publish │
   │                                                                               │
   │  Enrollment / Both ──► normal WordPress page on enroll.acadvizen.com          │
   │                                                                               │
   │  Main / Both ──► acadvizen-cms plugin (Render Bridge, WordPress side)         │
   │     1. WP-Cron job requests the page from this WordPress with a signed        │
   │        "Main render" header → full theme/Elementor/plugin pipeline runs       │
   │     2. output adjusted for Main: links to Main pages → www.acadvizen.com,     │
   │        CSS/JS/fonts/SVG → /_acv/c|i/…, REST → /_acv/rest/…, admin-ajax →      │
   │        /_acv/ajax, images/video/documents → absolute https WordPress URLs,    │
   │        Elementor CSS files inlined (self-contained version)                   │
   │     3. stored as a new VERSION (table wp_acv_render_versions), made live      │
   │     4. signed webhook → www.acadvizen.com/api/wordpress/revalidate            │
   └──────────────────────────────┬────────────────────────────────────────────────┘
                                  │ signed GET /wp-json/acadvizen-cms/v1/manifest | /render
                                  ▼
                       www.acadvizen.com  (Next.js on Vercel)
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ src/middleware.js: is this address a WordPress-rendered page? (manifest)     │
   │   yes → internal rewrite to app/wp-render (serves the stored document +      │
   │         Main analytics). Existing Main routes win unless "Replace" is ticked.│
   │   no  → existing Next.js routes, Supabase, /admin … unchanged                │
   │ next.config.mjs rewrites (only when enabled):                                │
   │   /_acv/c/*, /_acv/i/* (CSS/JS/fonts/SVG) → CDN-cached static route handler  │
   │   /_acv/rest/* → allowlisted form endpoints only (lib/wordpress/proxyPolicy) │
   │   /_acv/ajax → allowlisted admin-ajax actions only                           │
   └───────────────────────────────────────────────────────────────────────────────┘
```

Why this design:

- **WordPress stays the rendering authority.** Next.js serves the HTML, CSS and JS that WordPress produced. Any widget Elementor, Elementor Pro or an add-on can render therefore works without React code or a widget list, including future widgets. On staging, six pages covering 32 widget types were compared pixel by pixel (section 14).
- **PHP-only behaviour stays in WordPress.** Forms, the enquiry API and form plugins run in WordPress. The browser calls them on the same origin, and Next.js forwards only allowlisted endpoints.
- **Publishing never depends on the Main Website being up.** WordPress keeps the last good version and retries.

**Why `/_acv/…` and not `/wp-…` on the Main Website.** Vercel's platform protection answers any request whose path *contains* `wp-content`, `wp-includes`, `wp-json/…` or `admin-ajax` with `403` (`X-Vercel-Mitigated: deny`). This happens before the app runs. The project has no firewall rules of its own; the configuration was read on 2026-10-03 and has `versions: []`. The bridge therefore uses a neutral prefix, so **no firewall change is needed**, and every `/wp-*` path on www stays blocked.

**Why static files are cached and media is direct.** Vercel does not CDN-cache external rewrites. The WordPress host also rate-limits sustained bursts from the few addresses Vercel uses; on staging this produced `429` for CSS files. So:

- **CSS, JS, fonts and SVG** are served by `app/api/wordpress/proxy/static/…` with `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400`. That route retries 429/5xx, times out at 15 s and caps files at 4 MB, redirecting larger ones to WordPress. Measured on the preview: 29 of 30 repeat requests were `X-Vercel-Cache: HIT`. Fonts stay same-origin, so no CORS is needed.
- **Images, video and documents** are loaded by browsers directly from WordPress (absolute `https://` URLs). Each visitor uses their own address, and LiteSpeed serves them with long-lived caching.

**http/https.** enroll and its staging copy store `http://` as the WordPress Address but redirect every request to `https://`. The publisher's loopback render follows exactly that same-URL scheme upgrade and nothing else (`is_https_upgrade_of`).

**Visitor IP for forms.** WordPress sees Main's form requests coming from Vercel. The enquiry plugin limits submissions per IP, so without a fix it would apply one shared limit to *all* Main visitors. The proxy therefore sends the visitor's IP with an HMAC signature (`x-acadvizen-client-ip`, `-ts`, `-sig`). The plugin uses that IP only when the signature verifies; a forged header is ignored. This was verified on staging: through Main, a second submission from another visitor returned `201`, a direct repeat returned `429`, and a forged header had no effect.

### One WordPress, two addresses: the Master CMS and the Enrollment website

The Master CMS (`https://cms.acadvizen.com/wp-admin/`) and the Enrollment website (`https://enroll.acadvizen.com/`) are **one WordPress installation and one database**, reached on two addresses. This was chosen after comparing three designs:

| Design | Verdict |
|---|---|
| **One WordPress, two addresses** (admin on `cms`, public site on `enroll`) | **Chosen.** Enrollment keeps its own database: pages, forms, leads, WooCommerce, users, plugins and Theme Builder are untouched, and "Publish to Enrollment" is a normal WordPress publish. Nothing is copied between systems, so nothing can drift. |
| Two WordPress installations, `cms` pushing pages to `enroll` | Rejected. Elementor designs reference posts, templates, popups, forms, menus and media **by ID**. Every push would have to remap them between two databases whose IDs diverge (enroll creates leads and orders all the time), and WooCommerce/MetForm/ShopEngine data would need a sync of its own. That is fragile. |
| `enroll` serving HTML rendered on `cms` | Rejected. Forms, carts, nonces and logged-in features would point at the wrong site. |

`wordpress/mu-plugins/acadvizen-cms-hosts.php` makes the two addresses work. It is inert unless both `ACADVIZEN_CMS_ADMIN_URL` and `ACADVIZEN_CMS_PUBLIC_URL` are defined, and on any other address (a staging copy):

- **Each address works on its own.** wp-admin, the Elementor editor and its preview, theme and plugin files all use the address the request arrived on. Elementor needs the editor and its preview on one origin.
- **Media always has the public address**, so what is saved while working on `cms` (image URLs in designs, generated Elementor CSS) is exactly what `enroll` serves.
- **`cms` is not a third public website.** Visitors there are sent to the same path on `enroll` (302), and every response is `noindex`. Login, wp-admin, REST, WP-Cron, previews, the Elementor editor and the Main Website's signed render requests are served normally.
- **On `enroll`,** links saved as `cms` addresses point to `enroll`, and `/wp-admin/` moves to `cms`. Front-end AJAX (`admin-ajax.php`), `admin-post.php`, forms and customer logins stay on `enroll`.
- **Main renders always run on the public address,** and both addresses count as WordPress's own when pages are prepared for www. A page renders the same whichever address started the job, and no `cms` URL reaches www.
- **Production identity follows the public address,** but only when the request arrived on one of the two addresses. A staging copy carrying production's `wp-config.php` is therefore still refused a production Main (PHP test "guard … [CMS + public address]").

Verified on the local Docker WordPress with both addresses, 12/12 checks:

- login stays on `cms`;
- media saved on `cms` uses the public address;
- Elementor's preview is same-origin;
- the public page shows the design with no `cms` URLs, and its image loads;
- `cms` sends visitors to `enroll`, and `enroll`'s wp-admin goes to `cms`;
- previews work on `cms`;
- a second edit reaches `enroll`;
- cleanup.

Staging on Hostinger cannot show this until a second hostname is attached to the staging site (section 11).

### Who owns what

| Area | Owner |
|---|---|
| Page design, templates (HFE and Elementor Pro Theme Builder), header/footer, menus, global colours/fonts, popups, forms, media, SEO fields (Rank Math) | WordPress + Elementor |
| Existing Main routes (`/about`, `/courses/*`, `/blog/*`, city pages…), Supabase data, `/admin`, auth, APIs | Next.js (unchanged) |
| Pages designed in Elementor and published to Main | WordPress renders them; Next.js serves them at their own address |
| Structured blogs (`acv_blog`) | WordPress content, rendered by the existing Next.js blog pages |
| Enquiry API `POST /wp-json/acadvizen/v1/enquiry` | The existing "Acadvizen Course Enquiries" plugin. **Unchanged.** Main reaches it as `/_acv/rest/acadvizen/v1/enquiry` |

### Address rules on www.acadvizen.com

- A WordPress page is served at its WordPress path (`/neet-coaching`, `/course/seo`, `/location/jayanagar`).
- Existing Main routes always win: every app route folder, the programmatic `digital-marketing-course(s)-*` pages and existing Supabase CMS pages. The exception is when an administrator ticks **"Replace an existing Main Website page at the same address"** in WordPress. The Main homepage (`/`) is always an explicit choice ("Use as the Main Website homepage").
- Application paths can never be replaced: `/admin`, `/api`, `/login`, `/register`, `/dashboard`, `/preview`, `/_acv`, `/wp-*` and similar.
- When a page's address changes, the old Main address 301-redirects to the new one.

## 2. Publishing workflows

| Publish To | enroll.acadvizen.com | www.acadvizen.com |
|---|---|---|
| Enrollment (default for every existing page) | normal WordPress page | not shown |
| Main | 404 for visitors, including `?p=` / `?page_id=` (editors can still preview); excluded from search and sitemaps | rendered version at the page's address |
| Both | normal WordPress page | rendered version |

Status per page appears in the Pages list, the editor's Publish To box and **Acadvizen Master Admin → Publishing**. For "Both", each website is shown separately, e.g. `Enrollment: Published` / `Main: Update failed — previous version still live`.

Measured on staging (Hostinger shared hosting → Vercel preview), 2026-10-05 to 10-07, after the queue fixes:

| Action | Visible after |
|---|---|
| Edit and publish one Main page | 4–61 s (15 s course, 47–61 s new page) |
| The same, while a full site re-render of ~320 pages is running | 58–70 s on Main (was over 15 minutes before the queue fixes) |
| Publish to Enrollment | 1–2 s |
| Publish to Both | Enrollment 1–2 s, Main 38–70 s |
| Rollback ("Make live") | 4–6 s |
| Two quick edits of one page | the newer one wins in 20 s; the older one never reappears |
| FAQ / testimonial record → the page that lists it | 4 s / 1 s |
| New blog post / tool record edit / SEO title | 58 s / 51 s / 75 s |
| Header / footer template (checked on the homepage) | 53–138 s / 158–199 s |
| Global colour (Site Settings), shared service-page design | 527–570 s / 555 s for the checked page; every page is re-rendered, the most-visited first |
| Full re-render of every Main page | about 33 pages a minute (154 waiting renders done in 5 minutes) |

### Global changes

**Master Admin → Global Styles** opens Elementor's Site Settings → Global Colors over a small private page made for it ("Global Styles (editing page, never published)"; it stays private whatever is clicked). Change colours or fonts there and click **Save Changes** at the bottom of the Site Settings panel. Measured on staging: Site Settings open in about 25 seconds. (Opening Site Settings over a big page such as the Main homepage took over 3 minutes; opening the kit directly as a document cannot be saved in Elementor 4.3.)

These republish every Main page automatically, debounced by 30 seconds, then one page every 2 seconds, most-visited first (the homepage, then pages, courses, locations, tools and blog posts):
- Elementor Site Settings (the active kit), however it is saved, including the global colour/typography REST API;
- Header Footer Elementor templates, Elementor library and Theme Builder templates;
- menus, Customizer, theme switch, theme or plugin updates, Elementor "Clear Files & Data";
- FAQ, testimonial and tool records.

A page an administrator rolled back keeps its version until it is edited again.

### Templates per website

- **Header Footer Elementor** header, footer and before-footer templates.
- **Elementor Pro Theme Builder** templates: header, footer, single, archive, popup and others.

Both can be given a Publish To target. A template set to "Main" is skipped on enroll and used on Main; "Enrollment" works the other way round; "Both" (the default for every existing template) applies everywhere. This was verified on staging with a Theme Builder footer in both directions. Loop items are not location-based and simply render where they are used.

### Structured content

- **Courses and Locations** are Elementor-designed pages with a Publish To target and detail fields (`[acv_course_details]`, `[acv_location_details]`).
- **FAQs, Testimonials, Tools** are reusable records placed with `[acv_faqs]`, `[acv_testimonials]`, `[acv_tools]`. `[acv_faqs]` lists FAQs ticked "Show on every page that lists FAQs" plus FAQs assigned to the page being viewed; `for="all"` lists all of them. FAQPage schema is included unless `schema="no"`.
- **Main Blogs** (`acv_blog`) feed the existing Next.js `/blog` pages through `GET /wp-json/acadvizen-cms/v1/blogs`.

### Main Website content in WordPress (migration)

The existing Main Website (built in Next.js from Supabase) is brought into WordPress once, then edited only in WordPress. Every page keeps its address.

| Main Website | In WordPress | Edit it in |
|---|---|---|
| Tools `/tools/<slug>` | Tools records (`acv_tool`) + one shared design | the record (name, logo, website, text); **Website Design → Tools → Edit design with Elementor** for all tool pages at once |
| Blog `/blog/<slug>` and `/blog` | Main Blogs (`acv_blog`) + one shared design; the `/blog` page lists them with `[acv_loop]` | the post; the shared design as above |
| Service pages (`/seo-course-in-jayanagar` and the other single-heading pages) | Locations (`acv_location`) + one shared design | the record; the shared design |
| Area pages (`/digital-marketing-courses-*`), courses, homepage, About, Contact, Placement and the other pages | one WordPress page or course each, with its own Elementor design | Edit with Elementor |
| Header, footer | Header Footer Elementor templates set to "Main" | Elementor |
| Navigation | menu **Main Website Menu** | Appearance → Menus |
| Colours and fonts | Site Settings → Global Colors / Fonts named "Main #xxxxxx" / "Main 16/24 400 (…)" | Master Admin → Global Styles |
| SEO title, description, canonical, share image | Rank Math fields of each record (the share image is a Media Library item) | the record's Rank Math box |
| Structured data (JSON-LD) | the Main Website's own blocks, imported with each record and printed on its Main page; Rank Math adds no second schema to those pages (pages created later keep Rank Math's schema) | Rank Math → Schema for new pages |
| Lead forms | `[acv_lead_form]` | the widget's shortcode text |

**Website Design** (Master Admin → Website Design) chooses the Elementor template that draws every record of a type, and holds the Main Website CSS for effects Elementor has no control for. Saving republishes every page that uses them. A record opened with "Edit with Elementor" gets its own design instead of the shared one.

**Shortcodes for designs:**

| Shortcode | Shows |
|---|---|
| `[acv_field name="title"]` | a field of the record being shown: `title`, `excerpt`, `content`, `date`, `modified`, `author`, `image`, `categories`, `reading_time` or any detail field. In links and images use `#acv-field-website`, `#acv-field-image_url`, `#acv-field-url` or `#acv-field-share_linkedin` (also `_x`, `_whatsapp`, `_facebook`) as the address |
| `[acv_loop type="acv_tool" template="…" limit="6" columns="3" same="category"]` | a grid of records drawn with a loop template (cards); `columns_tablet`, `columns_mobile`, `gap`, `orderby` (one key with `order`, or several: `orderby="date:DESC title:ASC"`, the Main Website's order), `link`, `exclude_current="no"`. `filter="yes"` adds a working search box and category list above the grid (as on `/tools`): `filter_field`, `filter_first="Gen AI"`, `filter_groups="Digital Marketing=!Gen AI"` (a choice for everything except Gen AI), `filter_placeholder`, `filter_all`, `filter_count`, `filter_note` (a short line beside the count) |
| `[acv_breadcrumbs]`, `[acv_toc]` | breadcrumb trail; table of contents of the article |
| CSS class `acv-readmore` on a Text Editor (Advanced → CSS Classes) | shows the first 6 lines and a "Read more" / "Read less" toggle (Main pages); another number of lines: Custom CSS `selector{--acv-lines:4}`; another label: Attributes `data-more|Show more` |
| `[acv_lead_form form_type="location_enquiry" message="yes"]` | the Main Website lead form (below) |

**Lead forms.** `[acv_lead_form]` sends exactly what the Main Website's own lead forms send (`POST /api/cms/leads` on the Main Website), so enquiries keep arriving in **Main Admin → Leads** with the same `form_type`, `source` and page. Options: `form_type`, `source`, `page_slug` (default: the page's address; `courses/<slug>` for courses, as before), `message="yes"`, `submit`, `success`, `name_label`, `email_label`, `phone_label`, `message_label`, `modes="online:Online,classroom:Classroom"` (choice sent as `learning_mode`), `consent="<checkbox text>"` (must be ticked), `require_all="yes"` (name, email and phone all required), `labels="above"` (each label above its field), `fields="name,phone+email,experience,message"` (order; `a+b` side by side), `experience_label`, `experience_options="Fresher,Experienced"` (the "Fresher / Experienced" choice, sent as `experience_level`).

**Homepage "Quick Registration" popup.** An Elementor Pro popup (Templates → Popups, "Quick Registration popup (Main homepage)", Publish To: Main) shown on the Main homepage, opening 90 seconds after the page loads (Popup settings → Triggers → On Page Load), as on the Main Website. Its form is `[acv_lead_form form_type="registration" source="home-popup" …]` with the learning-mode choice and consent box. On the Main Website these registrations were saved to Admin → Registrations; they now arrive in Admin → Leads (form type `registration`, source `home-popup`), like the same form on the course landing pages. The Meta Pixel `Lead` event is sent as before. It works on the Main Website only (the WordPress preview shows the form but cannot submit). The WordPress enquiry API `POST /wp-json/acadvizen/v1/enquiry` is separate and unchanged.

**Import Main Website** (Master Admin) loads a bundle made by `tools/main-to-elementor` (see its README). Importing is safe to repeat: every item carries a source key, so a second import updates what the first created instead of duplicating it; an administrator's later changes to imported colours/fonts are kept; **Undo import** removes everything one import created.

**One place to edit.** With `WORDPRESS_OWNS_PUBLIC_CONTENT=true` on the Main Website, the Main `/admin` can no longer change content that WordPress now manages: its content APIs answer `423 Locked` with "This content is managed in the WordPress Master Admin (Acadvizen Master Admin). Edit it there with WordPress and Elementor." Leads, users, uploads, LMS data and the other application data stay in the Main `/admin`.

## 3. Versions and rollback

- Every successful render is a version, and one version per page is live. Identical renders are not stored twice. The last 5 versions are kept per page, stored compressed (a page of about 600 KB takes roughly a tenth of that).
- **Database size.** Hostinger limits each database (3 GB on this plan) and, once it is exceeded, refuses every write: WordPress can still be read but nothing can be saved or published. This happened on staging on 2026-10-03, at 3.09 GB: about 2 GB were post revisions (mostly Elementor data copied into every revision, carried over from enroll), about 0.85 GB uncompressed versions. Versions are now compressed and fewer, imports create no revisions, and a site-wide re-render waits as one job instead of one per change. Before production, check enroll's database size in hPanel and limit revisions (for example `define( 'WP_POST_REVISIONS', 10 );` in `wp-config.php`); see section 11.
- Only **Publish / Update** publishes. Elementor's autosave (every minute while editing) and "Save Draft" on a published page change nothing on Main and do not undo a rollback (verified on staging: an idle autosave created no version; a rolled-back page stayed rolled back).
- A failed render never replaces the live version. It retries after 1 and 5 minutes, then shows "Failed" with a Retry button. While a retry is waiting the status reads "Publishing… a first attempt failed, trying again automatically (previous version still live)". This was verified on staging with a forced failure: the status showed "Update failed — previous version still live", the old version kept being served, and Retry recovered (12 s). A newer edit made while an older job is still retrying wins; the older job never overwrites it.
- **Interrupted publishing repairs itself.** WP-Cron keeps all jobs in one stored list, and two requests saving it at once can drop a job. This happened twice on staging under load: once a single page's render, once the site-wide re-render after a header change (which left pages showing the old header). Two safeguards now cover this:
  - a page that is still "Publishing…", has no job waiting and has seen no activity for 3 minutes is queued again;
  - every site-wide re-render request is also recorded outside WP-Cron; if its job has not run after 2 minutes, it is run.

  Both checks run at most once a minute, triggered by the Main Website's regular manifest requests, by the admin screens that show publishing status, and hourly. The Publishing log shows "Publishing was interrupted; started again automatically". Verified on staging: the stuck location published 43 s after the Locations list was opened; a deliberately deleted site-wide re-render job was recovered without any admin action (section 14).
- **Versions & Rollback → Make live** restores any earlier version. Elementor CSS was inlined when the version was stored, so it looks exactly as it did. The page stays rolled back until it is edited and updated again.
- **Preview** shows a stored version inside a sandboxed iframe (`sandbox="allow-scripts allow-popups"`, no same-origin access), so page scripts can't act as the logged-in administrator. An iframe is used because Hostinger adds its own `Content-Security-Policy` header, which overrides a CSP sandbox header. Inside the sandbox, cookies and web storage are unavailable; the preview supplies harmless stand-ins and always shows entrance-animated elements, so content is visible. Icon fonts (Font Awesome/eicons) are refused by the browser in the sandbox, so icons can be missing **in the preview only**; the live page is unaffected.
- WordPress/Elementor revisions remain the editing history; versions are the publishing history.

## 4. Cache and revalidation

- Next.js caches the manifest and each page document in the data cache, tagged `wordpress:manifest` and `wordpress:page:<path>`. There is a 5-minute time-based safety refresh.
- The signed webhook revalidates exactly the changed page(s), the manifest and `/sitemap.xml`.
- The middleware memoises the manifest for 30 seconds per instance. Content changes to existing pages are immediate; a *new* address can take up to about 30 seconds to start routing.
- WordPress sends `X-LiteSpeed-Cache-Control: no-cache` on bridge renders and on the plugin's API, so LiteSpeed never serves a stale render to the publisher.
- Versions are refreshed twice a day, which keeps time-based widgets and form nonces (valid 12–24 hours) fresh.

## 5. Security

- **Signatures:** HMAC-SHA256 over `"<unix timestamp>.<message>"` with a shared secret (≥32 characters). Requests outside a 5-minute window are rejected. Messages are purpose-prefixed (`render.`, `manifest.`, `loopback.`, `client-ip.`, JSON webhook bodies), so a signature for one purpose can't be replayed for another.
- **Main-only pages on enroll:** rendered only for a signed loopback request; visitors get 404. No canonical redirect is issued, and the pages are excluded from search and from the core and Rank Math sitemaps.
- **Internal routes on Main:** `/wp-render` and `/api/wordpress/bridge-manifest` require a token derived from the secret, which only the middleware sends.
- **Form proxy:** forwards only allowlisted endpoints. Cookies and Authorization headers are never forwarded, `Set-Cookie` is dropped, requests are rate-limited (30 per minute per IP), and bodies are capped at 4 MB. Static asset routes accept only static file extensions under `wp-content` / `wp-includes`, never private areas.
- **WordPress admin:** every action checks a capability and a nonce. Replace and homepage options require `manage_options`.
- **Production isolation:** see section 6.
- **Secrets:** live only in `wp-config.php` and Vercel environment variables. They are never stored in the database, shown in the admin, logged or sent to browsers.

Verified on staging:
- **37 of 37 security probes passed.** They covered:
  - missing, wrong, expired, other-purpose and other-secret signatures on the manifest, render and webhook;
  - a path-traversal render;
  - forged loopback headers;
  - `/wp-render` and the bridge manifest reached directly or with a forged token;
  - REST routes outside the allowlist (users, the plugin manifest, CF7 form lists) through the proxy.
- **Permission checks passed.** A temporary Editor can publish but cannot see or force Replace/homepage, cannot open Settings, and cannot run admin actions without a valid nonce.

## 6. Configuration

WordPress `wp-config.php`:

```php
define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '<random, at least 32 characters>' );
// Optional:
// define( 'ACADVIZEN_CMS_MAIN_INTERNAL_URL', 'https://…' ); // server-to-server address of Main, if different
// define( 'ACADVIZEN_CMS_LOOPBACK_URL', 'http://127.0.0.1' ); // if the site cannot request its own public URL
// define( 'ACADVIZEN_CMS_MAIN_BYPASS_TOKEN', '…' ); // staging only: Vercel "Protection Bypass for Automation" secret of a protected preview
// The Master CMS address and the public Enrollment address of this one WordPress
// (with wordpress/mu-plugins/acadvizen-cms-hosts.php in wp-content/mu-plugins/):
define( 'ACADVIZEN_CMS_ADMIN_URL', 'https://cms.acadvizen.com' );
define( 'ACADVIZEN_CMS_PUBLIC_URL', 'https://enroll.acadvizen.com' );
```

The WordPress Address and Site Address settings stay `enroll.acadvizen.com`.

**Production isolation (built in).** Only the website whose address is `enroll.acadvizen.com` may use `acadvizen.com` / `www.acadvizen.com` as its Main Website. On any other copy, such as the staging site `cms.acadvizen.com`, a production Main address is refused. The plugin then behaves as "not connected", sends no webhooks and links nothing to production, and Settings says why ("Blocked: …", Test connection `blocked_production_target`). This was verified live on staging on 2026-10-03, with zero requests to production hosts. Staging must point at a staging Main Website and use a different secret from production.

On a protected Vercel preview, the middleware's own manifest request uses Vercel's `VERCEL_AUTOMATION_BYPASS_SECRET` automatically, when "Protection Bypass for Automation" is enabled for the project.

Vercel variables are server-only, never `NEXT_PUBLIC_`. They must also be set at build time, because `next.config.mjs` reads them.

| Variable | Secret | Purpose |
|---|---|---|
| `WORDPRESS_CONTENT_ENABLED` | no | `true` turns the integration on; anything else turns it off |
| `WORDPRESS_CMS_API_URL` | no | `https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1` |
| `WORDPRESS_CMS_WEBHOOK_SECRET` | **yes** | same value as `ACADVIZEN_CMS_WEBHOOK_SECRET` |
| `WORDPRESS_PROXY_EXTRA_REST_ROUTES` | no | optional extra form endpoints, e.g. `POST plugin/v1/submit/*` |
| `WORDPRESS_PROXY_EXTRA_AJAX_ACTIONS` | no | optional extra admin-ajax actions |

The default allowlist covers:
- the enquiry API;
- Contact Form 7 (`contact-form-7/v1/contact-forms/*/feedback`);
- Elementor Pro forms (`elementor_pro_forms_send_form`);
- MetForm.

On the site today, MetForm is used on 0 of 49 pages.

## 7. Performance

- **Main pages** are served by the Main Website from its Next.js data cache; WordPress is not contacted during a visitor's page view. Like every other page on www today, the HTML itself is sent `Cache-Control: no-store` (not CDN-cached), so each view runs the Main function: 0.75–1.6 s measured for bridged pages of 306–811 KB on the staging preview. Static files are CDN-cached (MISS once, then HIT; section 1).
- **Cold Elementor CSS is the cause of the occasional very slow WordPress page.** After Elementor → Tools → "Clear Files & Data", the first uncached view of each page regenerates that page's CSS. This was measured on staging on 2026-10-03:

  | Page | 1st view after clear | 2nd view | 3rd view |
  |---|---|---|---|
  | `/placement-2/` | 39.7 s | 3.5 s | 3.6 s |
  | `/mastery-in-ai-digital-leadership-program/` | 11.5 s | 2.3 s | 2.3 s |
  | `/` | 4.4 s | 1.7 s | 1.8 s |
  | `/branches/` | 2.0 s | 1.2 s | 1.1 s |

  `/branches/` itself is not slow: cold 2.0 s, warm 1.1–1.6 s on staging, and 0.8 s TTFB on production. The single 80 s observation was not reproducible. Avoid "Clear Files & Data" at busy times, or warm the heaviest pages afterwards.
- The bridge's render requests have a 45-second limit. A page that is cold *and* heavy can exceed it once; the automatic retry one minute later finds the CSS warm, and the live version is kept meanwhile.
- "Clear Files & Data" also triggers the site-wide re-render. In the staging test above, all 8 Main/Both pages re-rendered within about 5 minutes of the clear (07:15–07:20), with no failures and no timeouts.

## 8. Rollback of the integration itself

- **Main:** set `WORDPRESS_CONTENT_ENABLED=false` (or remove it) and redeploy, or promote the previous production deployment in Vercel. Every route returns to exactly the pre-integration behaviour. A build with the integration off was compared with production: the same status and titles on every route checked, and the same 83 `/blog` links.
- **WordPress:** deactivate "Acadvizen Master Admin". Existing Enrollment pages are unaffected. **Note:** pages set to "Main" are then no longer hidden on enroll (they are normal WordPress pages underneath). Set them to Draft first if they must not appear there.
- **One page:** Versions & Rollback → Make live, or untick Replace/Homepage to bring an existing Main page back.

## 9. Known limitations

- Versions are taken at publish/refresh time. Widgets that must differ per visitor or per request (e.g. "logged-in user" content, random order) show the published state.
- Elementor Pro popups attached to a page by display conditions are rendered when the page is rendered. Contact Form 7 forms inside Elementor Pro popups are not initialised by CF7's script; this is the same on enroll today and not caused by the bridge. They still submit through the REST endpoint.
- Publishing runs on WP-Cron, which WordPress starts on the next request it receives. The open editor, the admin screens, enroll's visitors and the Main Website's own manifest requests all provide such requests, so on staging single publishes ran within seconds. A site-wide re-render needs WP-Cron to keep running; on staging (almost no traffic) it stalled between visits until a cron call every minute was added (see below). A real server cron removes that dependency: in Hostinger hPanel → Advanced → Cron Jobs, run `wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php` every minute (production deployment step).
- A page's first request after a cold Vercel cache needs WordPress to be reachable. Once cached, pages keep being served if WordPress is down (stale-while-revalidate).
- A site-wide re-render (header, footer, menu, global colours/fonts, shared designs) renders every Main page again, one after another. Measured on staging (Hostinger shared hosting, a cron call every minute, 2026-10-07): an import of the pages bundle plus the full re-render of every Main page (~600 renders) finished in 19 minutes, about 30 pages a minute. The homepage and main pages are done first, blog posts last. Publishing a single page during one is not held up behind it: its job is placed ahead of the pages still waiting (WP-Cron runs the oldest jobs first).
- **Editing very long pages in Elementor is slow on staging.** The converted Main homepage has about 600 Elementor elements: on staging the editor takes 1½–2 minutes to open, and the first one or two changes take up to a minute while Elementor finishes preparing the page; after that, changes are instant. Smaller pages are quick (Contact: 18 s to open, 1 s per change; About: 16 s, 6 s). The converter keeps pages lean (Elementor Accordion and Image Carousel widgets instead of hundreds of separate elements; spacing rules in the Main Website CSS instead of per-element CSS). Splitting the homepage into saved Elementor templates would make it faster still to edit.
- Vercel's data cache stores items up to 2 MB. The converted Main homepage is the largest page: 1.59 MB as served on staging (About 0.73 MB, a tool page 0.66 MB), served in 1.5–2.1 s. Check the size (Versions & Rollback shows it) before adding a lot more to the homepage; over 2 MB a page is fetched from WordPress on every visit instead of cached.

## 10. Staging environment (cms.acadvizen.com)

`cms.acadvizen.com` is a Hostinger "Copy Website" copy of enroll, used **only as staging**. It is not a second CMS.

- **WordPress:** the plugin is installed and connected to the Vercel preview alias `acadvizen-cms-staging.vercel.app`. The preview has its own staging-only webhook secret and `ACADVIZEN_CMS_MAIN_BYPASS_TOKEN`; its env is set per deployment, not in the project's Preview environment.
- **Isolation mu-plugin** `wordpress/staging/acadvizen-staging-isolation.php` (staging host only; it does nothing on any other host). It provides:
  - noindex everywhere (meta, `X-Robots-Tag`, robots.txt `Disallow: /`);
  - production tracking IDs removed (Google Ads AW-17912622133, GA4, GTM);
  - all email short-circuited and logged;
  - outgoing HTTP limited to the staging host, the staging Main and wordpress.org/elementor.com, with production hosts always blocked;
  - auto-updates off;
  - a "Purge server page cache" admin action;
  - a log at Tools → Staging isolation log.
- **Enquiries submitted on staging** are stored in the staging database only. Their email notification is blocked and logged.
- **Credentials** are kept outside the repository in `C:\Users\HP\.acadvizen-staging.env` and `C:\Users\HP\.acadvizen-vercel.env`. Use an FTP account restricted to the staging directory.
- **Known staging notices:** an Elementor Pro "License Mismatch" (the licence is tied to enroll's domain), and Rank Math's prompt about the new course/location post types. Because of the licence mismatch, Elementor marks Pro widgets (Form, Slides, Animated Headline, Pro Gallery, Flip Box, Call to Action…) **locked** in the staging editor, so *new* Pro widgets cannot be added on staging. Existing Pro widgets render normally and were tested through the bridge (popup with a Pro form and file upload, slides, mega menu, gallery, animated headline). Do not press "Reactivate License" on staging: it could move the licence away from enroll.

## 11. Production deployment procedure

Prepared and rehearsed on staging; **not executed**. Each phase is separate, in this order, and has its own way back. "Check" lines are the smoke tests for that phase.

**Phase 0 — Live-site fixes (independent of the cutover; found on production 9 Oct 2026)**

Enrollment, in `https://enroll.acadvizen.com/wp-admin/`:

1. **Sitemaps answer 404.** The sitemap itself works (`/index.php?sitemap=1` returns XML); its addresses lost their rewrite rules.
   - Settings → Permalinks → **Save Changes** (change nothing). Then Rank Math → Sitemap Settings → **Save Changes**.
   - Check: `https://enroll.acadvizen.com/sitemap_index.xml`, `/page-sitemap.xml` and `/post-sitemap.xml` return XML (200).
2. **Sitemap lists page-builder internals** (`/elementor-hf/header/`, `/metform-form/blank-form/`, popups, mega-menu items).
   - Rank Math → Sitemap Settings → Post Types: turn off **Include in Sitemap** for Header Footer templates, PopupKit campaigns, MetForm forms and WPR mega menu.
   - Once the Acadvizen Master Admin plugin is active, it leaves these out itself.
3. **Redirects for renamed pages.** Rank Math → Redirections → Add New, type **301 Permanent**:
   - `/contact-us/` → `/digital-marketing-course-enquiry/` (the same page, #973, renamed). The site-wide footer still links to the old address on 60 pages.
   - `/advanced-digital-marketing-course-in-mangalore/` → `/ai-integrated-digital-marketing-course-in-mangalore/` (the current Mangalore page; the old page #6814 is now the RR Nagar page).
   - `/social-media-influencer-marketing/` → `/learn-digital-marketing/` (the old page #3874 now lives there; choose another course page if that is not the right destination).
   - `/about-us/` already redirects (WordPress, old slug).
   - Check: each old address answers 301 with the new address in `Location`, and the new address answers 200.
4. **Footer "Apply Now" button** (Templates → Theme Builder → Footer #1799, desktop and mobile buttons): link → `https://enroll.acadvizen.com/digital-marketing-course-enquiry/`. Remove the `#:~:text=…` fragment.
5. **Test content published on the live site:**
   - the page "Test" (`/test/`, indexable, in the sitemap) → Status: Draft;
   - the untitled post `/3570-2/` (in the sitemap, noindex) → Draft.
6. **Site address** (after the Phase A backup): Settings → General → WordPress Address (URL) is `http://enroll.acadvizen.com`; set `https://enroll.acadvizen.com`, the same as the Site Address.
   - Today the site's own `Content-Security-Policy: upgrade-insecure-requests` header makes browsers load those `http://` files over https.
7. **Logo alt text:** Media Library → the header logo image ("ChatGPT Image Sep 7, 2026…") → Alternative Text: `Acadvizen`.

Main, in `https://www.acadvizen.com/admin`:

8. **Test records published on the live site:**
   - Courses → "Local E2E Course" (`courses`, slug `local-e2e-course-1779297401`) → unpublish;
   - Tools → "Local E2E Tool" (`tools_extended`, slug `local-e2e-tool-1779297401`) → unpublish.
   - Check: both addresses answer 404, and `/courses`, the city pages, `/tools` and `/sitemap.xml` no longer mention "Local E2E".
   - The migration leaves them out regardless (records, menu links, cards and tiles).
9. **robots.txt:** Admin → Robots.txt → the Sitemap line → `https://www.acadvizen.com/sitemap.xml`. Today it names `https://acadvizen.com/api/cms/sitemap/generate`, which works after a redirect.

**Phase A — Prepare (no visible change)**

1. **Merge** this branch. Do not deploy yet.
2. **Back up:**
   - enroll: hPanel → Websites → enroll → Backups → generate and download files and database;
   - Main: note the current Vercel production deployment, which can be promoted back in one click;
   - Supabase: Dashboard → Database → Backups; check that today's backup exists.
3. **Database headroom.** Open hPanel → Databases and read enroll's size; the plan limit is 3 GB, and over it every database write is refused.
   - Staging, a copy of enroll, holds 2.07 GB of old revisions; the migration adds about 0.3–0.4 GB (pages, designs, 5 compressed versions per page).
   - After the backup, remove old revisions with a reviewed tool (for example WP-Optimize → "Clean all post revisions").
   - Add `define( 'WP_POST_REVISIONS', 10 );` to `wp-config.php`.
   - Continue only below 2.0 GB.
4. **Free the address `cms.acadvizen.com` for production.** Today it is the staging copy.
   - Move staging to its own address, for example `staging-cms.acadvizen.com`: hPanel → Websites → the staging site → change domain, or Copy Website to the new subdomain.
   - Then update `STAGING_HOST` in `wordpress/staging/acadvizen-staging-isolation.php`, the staging site's WordPress Address, and the staging Vercel preview's `WORDPRESS_CMS_API_URL`.
5. **Give the production WordPress its CMS address.**
   - hPanel → Websites → enroll → Domains → add `cms.acadvizen.com` to enroll's files (alias / additional domain), with SSL.
   - DNS already points `cms` and `enroll` at the same server (147.93.17.189), so **no DNS change** is needed.
   - Check: `https://cms.acadvizen.com/wp-login.php` shows enroll's login.

**Phase B — WordPress (enroll)**

6. **Upload** `wordpress/acadvizen-cms/` to `wp-content/plugins/` and `wordpress/mu-plugins/acadvizen-cms-hosts.php` to `wp-content/mu-plugins/`. Do **not** upload `wordpress/staging/`.
7. **`wp-config.php`:** add the following, then activate "Acadvizen Master Admin":
   - `ACADVIZEN_CMS_MAIN_URL` = `https://www.acadvizen.com`;
   - a **new** `ACADVIZEN_CMS_WEBHOOK_SECRET` (32+ random characters, never the staging one);
   - `ACADVIZEN_CMS_ADMIN_URL` = `https://cms.acadvizen.com`;
   - `ACADVIZEN_CMS_PUBLIC_URL` = `https://enroll.acadvizen.com`.

   Every existing page defaults to Enrollment.

   *Check:*
   - `https://cms.acadvizen.com/wp-admin/` logs in and stays on `cms`;
   - `https://cms.acadvizen.com/` sends visitors to `enroll` and answers `X-Robots-Tag: noindex`;
   - `https://enroll.acadvizen.com/wp-admin/` moves to `cms`;
   - enroll's pages, forms and `POST /wp-json/acadvizen/v1/enquiry` are unchanged (the enroll inventory script: 61 sitemap URLs, same status and title).
8. **Server cron.** hPanel → Advanced → Cron Jobs → every minute: `wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php`. Keep WordPress's own cron enabled too, so a publish starts at once. *Check:* the cron log in hPanel shows a run every minute.
9. **Enrollment logo → Main Website:** Templates → Header Footer Elementor → "Header" (#960) → Site Logo → Link: Custom URL `https://www.acadvizen.com/` → Publish. (Verified on staging.)

**Phase C — Main (Vercel)**

10. **Production env:**
    - `WORDPRESS_CMS_API_URL=https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1`. Use the **public** address: media is served from it, and Main's CSP allows exactly that origin.
    - `WORDPRESS_CMS_WEBHOOK_SECRET`: the same new secret.
    - Leave `WORDPRESS_CONTENT_ENABLED` unset.

    Deploy. This ships the title fix and the Meta pixel rule.
    - The contact form starts saving enquiries to Admin → Leads (form type `contact`); until now it saved nothing.
    - The sitemap no longer lists the two addresses that redirect.
    - Everything else is unchanged.

    **How to deploy** (production has been deployed from `headless-wordpress`, although the Vercel production branch is `main`): push the branch, then Vercel → project `acadvizen-newww-ua9d` → Deployments → the new `headless-wordpress` preview → ⋯ → **Promote to Production**.

    **Way back:** promote the deployment of commit `a8cc4d5` (built 9 Sep, `acadvizen-newww-ua9d-bwm78ffcd…`) the same way. This branch changes no Supabase schema, so rolling back is safe for the data.

    *Check:*
    - `/`, `/about`, `/blog`, `/courses`, `/contact`, `/login`, `/admin`, `/sitemap.xml`, `/robots.txt`;
    - titles show "| Acadvizen" once;
    - the Meta pixel fires (`connect.facebook.net`);
    - `node tools/verify-production.mjs`: the Main title and sitemap checks pass.
11. **Turn the bridge on:** `WORDPRESS_CONTENT_ENABLED=true`, redeploy. Master Admin → Settings → Test connection → "Connected".

**Phase D — Migrate the Main Website's content**

12. **Build fresh bundles** from the live Main Website (`tools/main-to-elementor/README.md`) and import them in Master Admin → Import Main Website, in this order: tools, blogs, pages.
    - The import is resumable and keyed by source, so rerunning updates instead of duplicating; Undo is available.
    - Wait until Publishing shows an empty queue. On staging this took 19 minutes (about 30 pages a minute, with the server cron of step 8).

    *Check:* `node tools/verify-production.mjs --cutover` passes. It is read-only and checks every sitemap URL, titles, canonicals, logos, sitemaps, redirects, test content and the CMS.
13. **Lock duplicate authoring:** `WORDPRESS_OWNS_PUBLIC_CONTENT=true` on Vercel, then redeploy. `/admin` then refuses edits to migrated public content (423); leads, users and courses are unaffected.

**Ways back**

- Main: promote the previous deployment, or unset `WORDPRESS_CONTENT_ENABLED`; every route returns to the Next.js pages.
- WordPress: Master Admin → Import → Undo removes imported records; deactivating the plugin leaves Enrollment as it was.
- CMS address: remove `cms.acadvizen.com` from enroll's domains and the two `ACADVIZEN_CMS_*_URL` constants.
- Database: restore the backup from step 2.

No Vercel firewall change, DNS change or CRM/email change is required.

## 12. Troubleshooting

| Symptom | Check |
|---|---|
| Test connection "Not connected: not_configured" | Both `wp-config.php` constants are set, and the secret is at least 32 characters |
| "Not connected: blocked_production_target" | This copy is not enroll.acadvizen.com; point it at a staging Main |
| "Not connected" with an HTTP status | `WORDPRESS_CONTENT_ENABLED=true` and the same secret on Vercel, then redeploy (build-time variables) |
| Page stuck on "Publishing…" | Opening the Pages list or the Publishing screen restarts an interrupted publish after 3 minutes (also hourly). If it persists: WP-Cron runs (Hostinger: real cron or site traffic); Retry |
| "Publishing… a first attempt failed, trying again automatically" | Nothing to do; the previous version stays live. If it ends in "Update failed", read the detail on the Publishing page and use Retry |
| "Update failed — previous version still live" | Error text on the Publishing page; often a cold, heavy page (section 7). Retry |
| New page 404 on Main for under a minute | Manifest memo (30 s) and the queue; wait, then reload |
| Missing styling on Main | `/_acv/c/…` requests in the browser's network tab; a 404 means a non-static extension was requested |
| Enquiry "Too many requests" for everyone on Main | The secret on both sides matches (signed visitor IP) |
| Change visible on enroll but not on Main | Publishing log for the re-render; a rolled-back page keeps its version until edited |

## 13. Repository files

- **WordPress plugin:** `wordpress/acadvizen-cms/` (readme.txt inside). Staging-only mu-plugin: `wordpress/staging/`.
- **Main:**
  - `src/middleware.js` and `next.config.mjs`;
  - `app/wp-render/` and `app/api/wordpress/` (revalidate, slug-check, bridge-manifest, proxy rest/ajax/static);
  - `lib/wordpress/`, `lib/analyticsConfig.js`;
  - the blog pages in `app/(public)/blog/`.
- **Tests:**
  - `tests/unit/wordpress-*.test.js` (`npm run test:unit`);
  - `tests/php/run.php` (`docker run --rm -v "$PWD:/app" -w /app php:8.3-cli php tests/php/run.php`).

## 14. Verification record (staging, 2026-10-02 / 03)

| Gate | Result |
|---|---|
| Automated | 127 Node unit tests, 70 PHP tests, PHP lint, ESLint, `tsc --noEmit`, `next build` with the integration off and on: all pass |
| Staging hygiene | Cache purged; noindex; no production tracking; email and outgoing requests contained |
| Visual parity WordPress vs Main | 6 pages covering 32 widget types: 15 of 18 screenshot comparisons identical (0 px), 3 differ only by animation frames (animated headline, logo marquee) |
| Publishing A–H | Enrollment-only, Main-only, Both, slug change (301), Replace on/off, homepage on/off, trash (404), restore |
| Versions | Edit, rollback, persistence, next edit unpins, failure isolation, Retry |
| Security / permissions | 37/37 probes; role checks; sandboxed preview (no same-origin access) |
| Forms | Elementor Pro form with a file upload, Contact Form 7, enquiry API contract unchanged, signed visitor IP |
| Global changes | Colours, fonts, header, menu, Theme Builder footer targeting both ways, FAQ record |
| Content types | Course (Both), Location (Main-only, 404 on enroll), Main blog post and list, trash → 404 |
| Cold start / `/branches/` | After "Clear Files & Data": first views 2.0–39.7 s, then back to warm; `/branches/` 2.0 s cold; the site-wide re-render that followed finished with no failures (section 7) |
| Production isolation | Staging pointed at www: blocked, 0 production requests, config restored byte-identical |
| Regression, enroll copy | 49 pages: same status, titles, widget and form counts, header and menu. Robots/canonical/Ads-tag differences come from the staging noindex mu-plugin (Rank Math drops canonicals on noindex pages) |
| Regression, Main | Preview vs production: same status and titles on 16 routes, same 83 `/blog` links; `/wp-*` still refused |
| Production (read-only) | enroll and www healthy; enquiry route still `POST`-only; plugin not installed; nothing changed |

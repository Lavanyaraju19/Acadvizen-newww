# Implementation

## Architecture

```
enroll.acadvizen.com/wp-admin  (one central admin: WordPress + Elementor + "Acadvizen Master Admin")
   │  Publish To: Enrollment | Main | Both
   ├─ Enrollment / Both ─► normal WordPress page on enroll.acadvizen.com (unchanged behaviour)
   └─ Main / Both ──────► the plugin renders the page through WordPress/Elementor, stores a version,
                          sends a signed webhook to www.acadvizen.com/api/wordpress/revalidate
www.acadvizen.com (Next.js on Vercel)
   ├─ existing routes, Supabase content and /admin: unchanged
   └─ when WORDPRESS_CONTENT_ENABLED=true: reads the signed manifest/render API and serves those
      pages at their own addresses (cached; served even if WordPress is down)
```

**Visual editor.** Elementor is the visual editor for both websites; there is no second, custom builder (`docs/ACADVIZEN_VISUAL_BUILDER.md` has the full requirement matrix). Main's `/admin` section builder remains for the content not yet imported. `WORDPRESS_OWNS_PUBLIC_CONTENT=true` locks Main's `/admin` for imported content, so there is never more than one place to edit.

## Main Website content: the hybrid, structured connection (plugin 0.6.0)

The owner chose "Hybrid":
- **Main's existing content** is edited from WordPress **as the records it already is**, and Main keeps drawing it with its own components.
- **Elementor and the Render Bridge** are used only for **new free-form** pages.

Nothing is copied or converted, so the live design cannot drift.

```
enroll.acadvizen.com/wp-admin → Acadvizen Master Admin → Main Website
   Content:        Pages · Blogs · Tools · City pages · Service pages · Courses · Course sections ·
                   Media library · Locations · Cities · Testimonials · Activity
   Homepage:       Banner · Closing call to action · Sections · Lists
   Blog:           Authors · Categories · Tags
   Whole website:  Header · Footer · Menus · SEO overrides · Site settings
   │  signed POST (HMAC-SHA256 over "<ts>.<body>", 5-minute window, purpose "content",
   │  request_id claimed once in Supabase) — no database credentials in WordPress
   ▼
www.acadvizen.com/api/wordpress/content   (off unless WORDPRESS_CONTENT_API_ENABLED=true)
   │  validates every field against what Main draws, sanitises rich text, writes Supabase
   │  with the server key, records audit_log, revalidates the affected pages
   ▼
Supabase (the same tables Main's /admin writes)
   ▼
Main's existing routes and components — unchanged
```

### What each area manages (only what the public site draws)

| Area | Main tables | Public rendering |
|---|---|---|
| Pages and their sections | `pages`, `sections` | `DynamicPageRenderer`; private draft copies for live pages |
| Blogs, authors, categories, tags | `blogs`, `authors`, `blog_categories`, `blog_tags` | `BlogLayout`, `/blog/author|category|tag/<slug>`; Publish To Main / Enrollment / Both |
| Tools | `tools_extended` | `/tools/<slug>` |
| Courses, course sections | `courses`, `course_details` | `ImmersiveCourseRenderer` (curriculum, skills, counts, buttons); live lists through `courses_feed` sections |
| City pages, service pages, locations (+ their sections, with a position) | `city_pages`, `service_pages`, `locations`, `city_page_sections`, `service_page_sections`, `location_sections` | `CityPageRenderer`, `ServicePageRenderer`, `LocationPageRenderer` |
| Homepage | `homepage_hero`, `homepage_cta`, `home_sections` (3 drawn sections, and the 8 lists as `home_list_*` rows) | `HomePage`; a list edited here wins over the built-in one (`lib/homepageDefaults.js`) |
| Header, footer, menus, site labels | `header_settings`, `footer_settings`, `menus`, `site_settings` | `PublicLayout`, `Navbar`; built-in links in `lib/navigationDefaults.js` |
| SEO overrides | `seo_metadata` | Preferred over a page's own SEO fields; shown on the page editor |
| Media library | `media` + storage bucket `site-assets` | Image fields everywhere ("Main library" picker) |

### Main-side parts

| Part | Files | What it does |
|---|---|---|
| Content API | `app/api/wordpress/content/route.js`, `lib/wordpress/contentApi.js` | Operations: `list`, `get`, `save`, `set_status`, `trash`, `restore`, `delete` (confirmed), section save/delete/reorder, `start_draft`, `import_menu_defaults`, `import_homepage_defaults`, `upload`. It refuses unknown fields, section types, style keys and positions. Required columns are never set to null. Records in use cannot be deleted |
| Replay protection | `createRequestClaimer`, migration `202610110001_wordpress_content_request_ids.sql` | Request IDs are claimed in a shared table, so a replay is refused on every server instance. Without the table, changes are refused (503) |
| Rich text | `lib/wordpress/richHtml.js` | Allow-list sanitiser: no scripts, styles, frames or event attributes, and safe links only |
| Staged editing | `lib/pageDrafts.js`, `lib/draftAddressChange.js` (shared with Main `/admin`) | Private draft copies; publishing merges the copy onto the live page. An address change takes effect at publication, with a 301 redirect and its SEO moved |
| Preview | `app/preview/wordpress/[entity]/[id]/page.jsx`, `lib/wordpress/previewToken.js` | A signed, 15-minute, `noindex` preview drawn by Main's own components |
| Uploads | `uploadMedia` in `contentApi.js` | JPEG, PNG, WebP, GIF or AVIF only (no SVG), at most 3 MB. The declared type must match the file signature. Files go to `site-assets/wordpress/YYYY/MM/` with a `media` row |
| Error reporting | `dbFail` | WordPress gets a generic error. The server log gets the database code and message, never the content |

### WordPress-side parts

| Part | Files | What it does |
|---|---|---|
| Screens | `includes/main-content.php`, `assets/main-editor.js`, `assets/main-editor.css` | Lists (with filters, a parent choice and thumbnails) and edit forms. Field types: text, links, colours (hex, rgb, rgba, transparent; empty means the website default), numbers, choices, relations, images, structured lists, article blocks and page sections. Also device preview, versions, the Activity log and both import buttons |
| Versions | private post type `acv_main_snapshot` (20 kept per record) | Each save stores the complete record. The first change of an existing record also keeps the version before it |
| Permissions | `main_can`, `main_manages_record`, `guard_main_screen` | Editors and Administrators work on everything; Authors work on their own articles; Contributors save drafts or submit for review. Refusals are a real 403 |
| Blogs on Enrollment | `sync_enrollment_blog_copy` | Publish To Enrollment or Both keeps a WordPress post in step |

### Defects found and fixed during this work

| Defect | Affected | Where fixed | Live? |
|---|---|---|---|
| A live page answered 404 while a private draft copy existed | Main (live build) | `src/middleware.js`, `lib/cmsPagePrivacy.js` | **Released** (release 1) |
| Next.js 15.5.22 critical advisories | Main | Next.js 15.5.27 | **Released** (release 2) |
| Menu links multiplied across page views (shared arrays) | Main (latent: no menu rows yet) | `lib/menuTree.js` (`groupMenuRows`) | **Released** (release 3) |
| Discarding a draft copy deleted the live page's SEO override; renaming a draft's address redirected the live page early | Main `/admin` | Page routes, `lib/draftAddressChange.js` | **Released** (release 3) |
| City page feature cards never appeared (`features` vs `cards`) | Main (latent: no city pages yet) | `components/cms/CityPageRenderer.jsx` | **Released** (release 4) |
| Replay protection only per server instance | Content API | Durable claims in Supabase | Code **released** (release 4); migration not applied |
| Colour fields wrote black when left empty; rgba colours were lost | Plugin | `main_clean_color`, colour field | Plugin 0.6.0 |
| Homepage lists in the database did not match what the homepage draws | Main data model | `home_list_*` lists in the drawn shape | **Released** (release 4) |

### Known limitations (not changed)

- **Rich-text sections:** Main's renderer draws only the heading and text. Stored `list`, `cta` and `subheading` are not shown.
- **Three-column sections:** the renderer reads `column.heading`, but production stores `title`.
- **"Who is this for" descriptions:** the longer of the edited and the built-in text is shown.
- **Page versions:** they cover the page's own fields. Section changes are protected by the private draft copy.
- **Media:** files are never deleted from WordPress; delete them in Main's own `/admin` if needed.

## Components and their state

| Component | Files | State |
|---|---|---|
| WordPress plugin "Acadvizen Master Admin" | `wordpress/acadvizen-cms/` | Production runs **0.4.0** (active). **0.6.0** is built (all Main Website screens), not installed: needs a WordPress administrator login |
| Main Website structured connection | see the section above | Main side **deployed** (release 4, `dpl_EuZnhizEMjYzDATZg45okXUgs1WY`), **switched off** (503); plugin side LOCAL verified, not installed |
| Signed API `acadvizen-cms/v1` | `includes/rest.php`, `includes/config.php` | `/blogs` (public, published Main/Both blogs only), `/manifest` and `/render` (HMAC-SHA256, 5-minute window, purpose-bound). PRODUCTION: refusals verified (13/13) |
| Render Bridge (publish, versions, rollback, retries) | `includes/publisher.php`, `render-bridge.php`, `versions.php` | LOCAL and STAGING verified; production waits for the connection |
| Preview on the Main Website | `render-bridge.php`, `admin-site.php`, `elementor.php` | 0.4.0; LOCAL verified |
| Affected-pages list | `versions.php` (`affected_pages_summary`), `admin-site.php`, `admin.php`, `design.php` | 0.4.1; LOCAL verified |
| Optional features (`SITE_TEMPLATES`, `SITEMAP_CLEANUP`, `LOGIN_BRANDING`) | `includes/config.php` | Off by default; production: off |
| Main integration | `src/middleware.js`, `app/wp-render/`, `app/api/wordpress/` (revalidate, slug-check, bridge-manifest, proxy, content), `lib/wordpress/` | Live release 4 (`45d78b9`, `dpl_EuZnhizEMjYzDATZg45okXUgs1WY`), **switched off** (no `WORDPRESS_*` variables) |
| Import of existing Main content | `tools/main-to-elementor/` + Master Admin → Import Main Website | Ready. **Not run on production**. Dry run: 86 blogs, 67 tools, 134 pages (`CONTENT-INVENTORY.md`) |
| Unpublished-tool page fix | `lib/publicToolQuery.js`, `app/lib/contentMeta.js`, `app/(public)/tools/[slug]/page.jsx` | **Live** (release 4); verified (the test tool page is no longer presented) |
| Supabase migrations | `supabase/migrations/202610100001_…`, `…0002_…` | **Applied in production** (all their columns exist; seen on 11 Oct, applied by someone else) |
| Supabase migration (replay protection) | `supabase/migrations/202610110001_wordpress_content_request_ids.sql` | Tested locally; **not applied**: needs database access (Supabase SQL editor or a database password) |
| Release and test tools | `tools/build-cms-plugin.mjs`, `tools/cms-api-smoke.mjs`, `tools/verify-production.mjs`, `tests/wordpress/` | In the repository |

## Configuration (names only)

| Where | Name | Purpose | Production now |
|---|---|---|---|
| `wp-config.php` | `ACADVIZEN_CMS_MAIN_URL` | `https://www.acadvizen.com` | Not set (assumed; not visible) |
| `wp-config.php` | `ACADVIZEN_CMS_WEBHOOK_SECRET` | Shared secret, 32+ random characters, new for production | Not set: signed routes refuse everything |
| `wp-config.php` | `ACADVIZEN_CMS_SITE_TEMPLATES` / `SITEMAP_CLEANUP` / `LOGIN_BRANDING` | Optional features | Off |
| Vercel (Production) | `WORDPRESS_CMS_API_URL` | `https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1` | Not set |
| Vercel (Production) | `WORDPRESS_CMS_WEBHOOK_SECRET` | The same secret | Not set |
| Vercel (Production) | `WORDPRESS_CONTENT_ENABLED` | `true` switches the integration on (build-time) | Not set (off) |
| Vercel (Production) | `WORDPRESS_CONTENT_API_ENABLED` | `true` opens `/api/wordpress/content` to signed requests (needs `WORDPRESS_CMS_WEBHOOK_SECRET`) | Not set (off: the route answers 503 `content_api_disabled`) |
| Vercel (Production) | `SUPABASE_SERVICE_ROLE_KEY` | Server key the content API writes with (already used by Main's `/admin`); without it every save fails | To be confirmed (names visible only to the owner) |
| Vercel (Production) | `WORDPRESS_OWNS_PUBLIC_CONTENT` | `true` after the import (locks Main `/admin` for imported content) | Not set |
| hPanel cron | `wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php` every minute | Runs publishing jobs on time | Unknown |

## Publishing workflow as implemented

1. **Validate:** WordPress capabilities and nonces; the address must be usable on Main; existing Main routes win unless "Replace" is ticked; application paths can never be replaced.
2. **Draft:** WordPress statuses. Draft, Pending Review, Scheduled and Private are never sent to Main.
3. **Preview:** Elementor Preview (Enrollment look) and **Preview on the Main Website** (Main look, stores nothing).
4. **Review and approval:** WordPress roles. Contributors and Authors submit, Editors and Administrators publish. There is no separate "Approved" state.
5. **Publish:** a WordPress Publish/Update queues a render. The render is stored as a version and the signed webhook revalidates the page, the manifest and the sitemap.
6. **Record:** status per website, the Publishing log, and Versions.
7. **Failure:** automatic retries after 1 and 5 minutes, then "Failed" with Retry. The previous version stays live; a newer save always wins.

## Not implemented

- A side-by-side draft/live comparison.
- An "Approved" state.
- Scheduled publishing to Main tested end to end.
- A list of affected **Enrollment** pages for a template change (only Main pages are listed).
- Arbitrary new application features without code.

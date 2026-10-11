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

## Main Website content: the hybrid, structured connection (plugin 0.5.0)

Chosen by the owner ("Hybrid"): Main's **existing** content is edited from WordPress **as the records it already is**, and Main keeps drawing it with its own components. Elementor and the Render Bridge stay for **new free-form** pages only. Nothing is copied or converted, so the live design cannot drift.

```
enroll.acadvizen.com/wp-admin → Acadvizen Master Admin → Main Website
   (Pages · Blogs · Tools · Locations · Cities · Testimonials · Activity)
   │  signed POST (HMAC-SHA256 over "<ts>.<body>", 5-minute window, purpose "content",
   │  request_id used once) — no database credentials in WordPress
   ▼
www.acadvizen.com/api/wordpress/content   (off unless WORDPRESS_CONTENT_API_ENABLED=true)
   │  validates every field against Main's own schema, sanitises rich text,
   │  writes Supabase with the server key, records audit_log, revalidates the pages
   ▼
Supabase (pages + sections, blogs, tools_extended, locations, cities, testimonials)
   ▼
Main's existing routes and components (DynamicPageRenderer, BlogLayout, …) — unchanged
```

| Part | Files | What it does |
|---|---|---|
| Content API (Main) | `app/api/wordpress/content/route.js`, `lib/wordpress/contentApi.js` | list, get, save, set_status, trash, restore, delete (confirmed, trashed or hidden only), section save/delete/reorder, start_draft. Unknown fields, unknown section types and unknown style keys are refused, never stored |
| Rich text | `lib/wordpress/richHtml.js` | Allow-list sanitiser for article and section HTML (no scripts, styles, frames or event attributes; safe links only) |
| Staged editing of live pages | `lib/pageDrafts.js` (shared with Main's own `/admin` routes) | "Prepare changes privately" makes a private draft copy of a live page; publishing it merges it onto the live page through the existing `publish_page_draft` function and its broken-link guard |
| Preview | `app/preview/wordpress/[entity]/[id]/page.jsx`, `lib/wordpress/previewToken.js`, `next.config.mjs` | Signed, 15-minute, `noindex` preview drawn by Main's own components; may be framed only by the WordPress admin |
| Admin screens (WordPress) | `wordpress/acadvizen-cms/includes/main-content.php`, `assets/main-editor.js`, `assets/main-editor.css` | Lists, edit forms, article block editor, section editor (only the fields and design settings Main actually draws), device preview, versions, Activity log |
| Versions | private post type `acv_main_snapshot` (20 kept per record) | Each save stores the complete record; "Restore" puts it back (status unchanged) |
| Blogs on Enrollment | `includes/main-content.php` (`sync_enrollment_blog_copy`) | Publish To = Enrollment / Both keeps a WordPress post in step on enroll.acadvizen.com; Main / Enrollment-only keep the other side private |
| Permissions | `main_can`, `main_manages_record` | WordPress roles: Editors and Administrators work on everything; Authors publish **their own** articles; Contributors save drafts or submit for review; pages, tools, locations, cities and testimonials need the page capabilities (Editor and up). Refusals happen before the screen is drawn (HTTP 403) |

**Fixed on the way (Main, pre-existing, in the live build `d48492b`).** `src/middleware.js` looked up a page's privacy by slug and took the first row. A live page's private draft copy shares its slug, so while a draft existed the **live page could answer 404** (Main's own `/admin` "start draft" triggers it too). The lookup now ignores draft copies. Not deployed.

**Known limitations (pre-existing in Main's renderer, not changed):** the rich-text section draws only its heading and text (stored `list`, `cta` and `subheading` are not shown); the three-column section reads `column.heading` while production stores `title`, so those titles are not shown. The editor offers only what is drawn and lists any other stored keys as "kept as it is".

Page **versions** cover the page's own fields (title, address, SEO, status). Section changes are protected by the private draft copy instead: nothing reaches the live page until the draft is published.

## Components and their state

| Component | Files | State |
|---|---|---|
| WordPress plugin "Acadvizen Master Admin" | `wordpress/acadvizen-cms/` | Production runs **0.4.0** (active). **0.5.0** is built (Main Website screens, affected-pages list), not installed |
| Main Website structured connection | see the section above | LOCAL verified (`TEST-RESULTS.md`); not deployed, switched off by default |
| Signed API `acadvizen-cms/v1` | `includes/rest.php`, `includes/config.php` | `/blogs` (public, published Main/Both blogs only), `/manifest` and `/render` (HMAC-SHA256, 5-minute window, purpose-bound). PRODUCTION: refusals verified (13/13) |
| Render Bridge (publish, versions, rollback, retries) | `includes/publisher.php`, `render-bridge.php`, `versions.php` | LOCAL and STAGING verified; production waits for the connection |
| Preview on the Main Website | `render-bridge.php`, `admin-site.php`, `elementor.php` | 0.4.0; LOCAL verified |
| Affected-pages list | `versions.php` (`affected_pages_summary`), `admin-site.php`, `admin.php`, `design.php` | 0.4.1; LOCAL verified |
| Optional features (`SITE_TEMPLATES`, `SITEMAP_CLEANUP`, `LOGIN_BRANDING`) | `includes/config.php` | Off by default; production: off |
| Main integration | `src/middleware.js`, `app/wp-render/`, `app/api/wordpress/` (revalidate, slug-check, bridge-manifest, proxy), `lib/wordpress/` | Deployed (`d48492b`), **switched off** (no `WORDPRESS_*` variables) |
| Import of existing Main content | `tools/main-to-elementor/` + Master Admin → Import Main Website | Ready. **Not run on production**. Dry run: 86 blogs, 67 tools, 134 pages (`CONTENT-INVENTORY.md`) |
| Unpublished-tool page fix | `lib/publicToolQuery.js`, `app/lib/contentMeta.js`, `app/(public)/tools/[slug]/page.jsx` | Committed (`930e29c`), not deployed |
| Supabase migrations | `supabase/migrations/202610100001_…`, `…0002_…` | Prepared and tested on a throwaway database, not applied |
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

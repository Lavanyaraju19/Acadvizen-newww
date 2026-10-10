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

## Components and their state

| Component | Files | State |
|---|---|---|
| WordPress plugin "Acadvizen Master Admin" | `wordpress/acadvizen-cms/` | Production runs **0.4.0** (active). **0.4.1** is built (affected-pages list), not installed |
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

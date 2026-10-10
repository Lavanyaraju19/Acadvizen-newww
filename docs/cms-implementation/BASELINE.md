# Production baseline — 10 October 2026, 14:52–15:05 UTC

Every value below was read from the live systems, read-only. No secret values were read or recorded. The raw data is in `evidence/`.

## Code and deployments

| Item | Value |
|---|---|
| Repository / branch | `Lavanyaraju19/Acadvizen-newww`, `headless-wordpress` |
| GitHub (`origin/headless-wordpress`) | `d48492b` |
| Local, not pushed | 8 commits ahead (`f0d54ff` … `6e9f637`); working tree clean |
| Main production (Vercel `acadvizen-newww-ua9d`) | `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56`, commit `d48492b`, READY, serving `www.acadvizen.com` and `acadvizen.com` |
| Vercel production variables | 7. **None** of `WORDPRESS_CMS_API_URL`, `WORDPRESS_CMS_WEBHOOK_SECRET`, `WORDPRESS_CONTENT_ENABLED`, `WORDPRESS_OWNS_PUBLIC_CONTENT` is set: the WordPress integration on Main is **off** |

## Enrollment WordPress (`enroll.acadvizen.com`)

| Item | Value | Evidence |
|---|---|---|
| WordPress / PHP | 7.0.7 / 8.3.35 | `?ver=` on core files; `X-Powered-By` |
| Server, cache | LiteSpeed on Hostinger; page cache active (`X-LiteSpeed-Cache: hit`) | response headers |
| Elementor / Elementor Pro | 4.3.3 / 4.3.0 | asset versions |
| Other plugins (seen through their REST namespaces) | Header Footer Elementor, Rank Math, Contact Form 7, MetForm, WooCommerce (0 products), GetGenie, Jetpack, Site Kit, ShopEngine, Hostinger tools, WPR add-ons | `/wp-json/` |
| **Acadvizen Master Admin** | **Installed and active, 0.4.0.** It was found active at 14:52 UTC on 10 Oct; it was absent at 14:26 UTC. It was installed by someone with WordPress admin access, not by the engineer. `acadvizen-cms/v1` and its 4 routes are registered. `readme.txt` and `assets/admin.css` are byte-identical to the verified 0.4.0 package | `/wp-json/`; file hashes; `evidence/cms-api-smoke-production.log` |
| Plugin API | 13/13: `/blogs` answers (0 Main blogs); unsigned, malformed and wrong-secret requests to `/manifest` and `/render` answer **HTTP 401** | `evidence/cms-api-smoke-production.log` |
| Enquiry API | `POST /wp-json/acadvizen/v1/enquiry` registered (not called) | route list |
| Shared secret in `wp-config.php` | Not visible from outside. The plugin's signed routes refusing every request is consistent with "not set" | — |
| Content (public) | 53 pages, 7 posts, 786 media files, 10 categories, 0 products | `evidence/inventory-enrollment-production.json` |
| Sitemap | `/sitemap_index.xml` answers XML again after the plugin was activated. The index lists post, page and 4 builder-internal sitemaps (header/footer templates, popups, MetForm, mega menu) | `evidence/verify-production-after-plugin-install.log` |
| WordPress admin access for the engineer | **None.** Two sets of credentials were rejected earlier; not retried, to avoid a lockout | — |

## Main website (`www.acadvizen.com`)

| Item | Value |
|---|---|
| Public addresses | 314 in `/sitemap.xml`, **all 200**: 87 under `/blog/` (86 posts + 1 author page), 67 tools, 1 course, plus pages, location and service pages |
| Content source | Supabase. Read through the Main admin API, read-only: **140 pages** (134 published, 6 draft), **88 blogs** (86 published, 2 draft), 68 tools (67 active), 13 locations, 2 cities, 10 page templates, 2 testimonials, 4 course categories, 2 course rows, 1 author, 1 redirect, 1 each of homepage/global/sitemap settings, 338 media items. Other content tables: 0 rows (the API cannot tell an empty table from a missing one) |
| Leads | 2 (count only; never exported) |
| `/admin` | Loads with the authorised admin account. Leads and Tools APIs answer 200 |
| Forms | `/contact` posts to `/api/cms/leads` (storage verified on 10 Oct with one approved test enquiry, since deleted) |

## Known issues at baseline

| Issue | Status | Changed by this work? |
|---|---|---|
| Admin → Leads: saving a status fails (HTTP 500): the `leads` table lacks `updated_at` | Open; migration `202610100001` prepared and tested, **not applied** | No |
| `tools_extended` lacks `order_index` | Open; migration `202610100002` prepared, not applied | No (the list works without it) |
| Test tool page `/tools/local-e2e-tool-1779297401` still shows its name (unpublished, out of the sitemap) | Fixed in `930e29c`, **not deployed** | Fix pending deploy |
| A **published** blog "Dummy dm course" (`/blog/dummy-dm-course`) | Open: owner to decide (it may be the client's own) | No |
| A draft test blog `e2e-acadvizen-staging-blog-…` in Supabase (404 publicly) | Harmless; owner may delete | No |
| Enrollment (pre-existing): sitemap lists builder internals and `/test/`, `/3570-2/`; three renamed pages answer 404 instead of 301; footer "Apply Now" → `/contact-us/` (404); logo links to Enrollment, not Main | Open; needs WordPress admin | No |
| On phones, Enrollment's enquiry popup opens over the home page on load | Observed (`evidence/baseline-enrollment-home-mobile.png`) | No |

## Evidence files

- `evidence/inventory-main-production.json`: every Main CMS record (metadata only).
- `evidence/inventory-enrollment-production.json`: every public Enrollment page and post.
- `evidence/import-dry-run-production.json`: what an import would create.
- `evidence/cms-api-smoke-production.log`, `evidence/verify-production-after-plugin-install.log`.
- `evidence/baseline-*.png`: home pages of both websites, desktop and mobile, 10 Oct 15:05 UTC.

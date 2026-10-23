# Acadvizen websites — handover report

**Decision on 10 October 2026: CONDITIONALLY READY — NOT YET APPROVED FOR CLIENT HANDOVER.**

**Update 15:05 UTC:** the plugin is now **installed and active on the live Enrollment website** (0.4.0, verified; API refusals 13/13 on production). It is **not yet connected to Main**: no secret, no Vercel variables, integration off. Nobody can publish from WordPress to the Main website yet. Current status and acceptance matrix: `docs/cms-implementation/CLIENT-HANDOVER.md`. Installing it needs the production WordPress admin and the hosting account, which only the owner holds. The live Main website is healthy. Two of its admin functions wait on a database update that only the Supabase owner can run (section 11).

Every result is labelled by where it was observed:
- **PRODUCTION**: the live websites and services;
- **STAGING** *(historical, retired)*: the copy formerly at `cms.acadvizen.com` and its preview Main website. It is not a CMS address and nothing depends on it; the only admin is `https://enroll.acadvizen.com/wp-admin/`;
- **LOCAL**: the development machine.

Staging and local results support the work. They are not proof that production works.

Related documents:
- `docs/ACADVIZEN_CLIENT_SUMMARY.md`: one-page summary;
- `docs/cms-implementation/ADMIN-USER-GUIDE.md`: how to publish and redesign (for editors);
- `docs/ACADVIZEN_VISUAL_BUILDER.md`: what the visual builder does, with evidence and limits;
- `docs/ACADVIZEN_MASTER_ADMIN.md`: technical guide and deployment procedure;
- `docs/ACADVIZEN_ACCESS_AUDIT.md`: who can access what.

---

## 1. Summary

Acadvizen runs two public websites:
- **Main**, `https://www.acadvizen.com`: Next.js on Vercel, with its own `/admin` for leads, users, courses and other application data. Its design, routes and admin stay as they are.
- **Enrollment**, `https://enroll.acadvizen.com`: WordPress with Elementor, enquiry forms and the enquiry API. Its design and workflows stay as they are.

This project makes **Enrollment's WordPress admin** (`https://enroll.acadvizen.com/wp-admin/`) the one place to edit shared content. Each item gets a **Publish To** choice: Enrollment, Main, or Both. The work is done by a WordPress plugin, "Acadvizen Master Admin", together with an integration in the Main website that stays switched off until the plugin is live and tested.

| | Status |
|---|---|
| Plugin and Main integration | Built; tested LOCAL and STAGING |
| Plugin installed on production Enrollment | **No** (section 5) |
| Integration switched on for Main | **No**, deliberately |
| Main website fixes | Live (section 3) |
| Production publishing tests | **Not run**: they need the installed plugin |

## 2. How publishing works (once connected)

| Publish To | enroll.acadvizen.com | www.acadvizen.com |
|---|---|---|
| Enrollment Website (default for every existing page) | normal WordPress page | not shown |
| Main Website | not shown to visitors (404), kept out of search and sitemaps | WordPress renders the page; Main serves it at its own address |
| Both Websites | normal WordPress page | rendered page |

- Main's existing pages always win, unless an administrator explicitly ticks "Replace" (the Main homepage is its own explicit choice).
- Application addresses can never be replaced: `/admin`, `/api`, `/login` and similar.
- Each page keeps its last 5 published versions. A failed publish never replaces the live version. An earlier version can be made live again with one click.
- Main reads WordPress only through signed requests:
  - HMAC-SHA256 with a shared secret of at least 32 characters;
  - valid for 5 minutes;
  - bound to the exact request.

  Without the secret, the plugin refuses every such request.

Blogs ("Main Blogs") feed Main's existing `/blog` pages through `GET /wp-json/acadvizen-cms/v1/blogs`. It lists published Main/Both blogs only; drafts are never included.

## 3. What is live today (PRODUCTION, checked 10 October 2026, 12:14–12:54 UTC)

| Item | Value |
|---|---|
| Main production deployment | `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56`, commit `d48492b` (branch `headless-wordpress`), READY, serving `www.acadvizen.com` and `acadvizen.com` |
| WordPress integration on Main | **Off.** Vercel production has 7 variables and no `WORDPRESS_*` variable |
| Plugin on Enrollment | **Installed and active, 0.4.0** (found active at 14:52 UTC; not installed by the engineer). `acadvizen-cms/v1` with 4 routes registered. Publicly served files are byte-identical to the 0.4.0 package |
| Enquiry API `POST /wp-json/acadvizen/v1/enquiry` | Registered (POST) |
| `cms.acadvizen.com` | *Historical:* the former **staging** copy. Retired; not a CMS address and not needed by anything |

Main fixes live since 9–10 October:
- titles show "| Acadvizen" once;
- the `/contact` form stores enquiries in Admin → Leads;
- the sitemap lists only working addresses;
- Admin → Leads shows lead names on the current database;
- Admin → Tools lists all 68 tools again (it listed none, because the database lacks a column the screen sorted by).

## 4. Release and package

| Item | Value | Evidence |
|---|---|---|
| Repository | `github.com/Lavanyaraju19/Acadvizen-newww`, branch `headless-wordpress` | Git |
| Live on Main | `d48492b` | Vercel API |
| Local, **not pushed** | `f0d54ff` (plugin: three optional features off by default; no `.htaccess` writes); `930e29c` (unpublished tools hidden from their pages; release tools; more tests); `745387d` (verifier fix); `82570e0` (documentation); `d11830b` ("Preview on the Main Website"; local end-to-end tests in `tests/wordpress`); `a795fb0` (plugin 0.4.0); plus this documentation | `git rev-list`: local is ahead of `origin/headless-wordpress` |
| Plugin package | `dist/acadvizen-cms-0.4.0-a795fb0/acadvizen-cms.zip`, 98,730 bytes, plugin version 0.4.0 | `node tools/build-cms-plugin.mjs` |
| Package SHA-256 | `01d62f3feae0b5b723ca096b9ae0eca89fb491271d06acf48e8871a6f60e6809` | All 21 files byte-identical to `a795fb0` |

The build is reproducible. It keeps the repository's line endings and stamps every entry with the commit date. The earlier 0.3.0 packages (`cf8f2806…`, `188dce51…`) are superseded and were removed from `dist/`.

**Plugin defaults for the first install.** Three behaviours that would change Enrollment's existing pages are **off** until `wp-config.php` turns them on:

| Flag | What it would change |
|---|---|
| `ACADVIZEN_CMS_SITE_TEMPLATES` | Headers and footers follow Publish To |
| `ACADVIZEN_CMS_SITEMAP_CLEANUP` | Builder internals are removed from the sitemap, and lost Rank Math sitemap rules are restored |
| `ACADVIZEN_CMS_LOGIN_BRANDING` | The login logo |

On activation the plugin only rebuilds WordPress's saved address rules in the database. It never writes `.htaccess`.

## 5. Blockers and owner actions (in order)

| # | Action | Who | Where | Verification after |
|---|---|---|---|---|
| 1 | **Back up Enrollment** (files and database), record the date and the database size. Confirm Supabase backups | Owner | hPanel → Websites → **enroll.acadvizen.com** (not cms) → Backups; hPanel → Databases; Supabase → Database → Backups | Backup listed with date and scope; database size under 2.0 GB (limit 3 GB) |
| 2 | **Apply the two Supabase migrations** (section 11) | Supabase owner | Supabase → SQL Editor | Section 11 checks |
| 3 | **Install the plugin.** Plugins → Add New → Upload Plugin → `acadvizen-cms.zip` (0.4.0, SHA-256 above) → Activate. Add nothing else yet | Owner, or a working administrator account given to the engineer | `https://enroll.acadvizen.com/wp-admin/` | `node tools/cms-api-smoke.mjs`: 4 routes, the enquiry route and 4 refusals (401). Then the enrollment checks in section 8 |
| 4 | **Secret and Main address in wp-config.php.** Generate a new random secret of at least 32 characters, locally (for example `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`). Never paste it in chat, email or the repository, and never reuse the staging secret. Add `define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );` and `define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '…' );` | Owner | hPanel → File Manager → `wp-config.php` | Master Admin → Settings: "Shared secret: Set" |
| 5 | **Vercel production variables**: `WORDPRESS_CMS_API_URL` = `https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1` (not the wp-admin address in the access checklist) and `WORDPRESS_CMS_WEBHOOK_SECRET` = the same secret. Leave `WORDPRESS_CONTENT_ENABLED` unset | Owner (or engineer with written approval) | Vercel → `acadvizen-newww-ua9d` → Settings → Environment Variables → Production | `WORDPRESS_CMS_WEBHOOK_SECRET=… node tools/cms-api-smoke.mjs` on the engineer's machine: signed checks pass. The secret is read from the environment, never printed |
| 6 | **Server cron**, every minute: `wget -q -O /dev/null https://enroll.acadvizen.com/wp-cron.php` | Owner | hPanel → Advanced → Cron Jobs | Cron log shows runs |
| 7 | **Deploy the local commits** (section 9), then switch on `WORDPRESS_CONTENT_ENABLED=true` and redeploy | Engineer, after written approval | Git / Vercel | `node tools/verify-production.mjs --cutover` |
| 8 | **Production publishing tests** with a temporary page "ACV TEST — delete me" (section 7), then delete it | Engineer | WordPress + Main | Section 7 matrix all PASS |
| 9 | **Enrollment fixes** (section 10) | Owner, or engineer with admin access | Enrollment wp-admin | `node tools/verify-production.mjs`: Enrollment checks pass |
| 10 | **Rotate credentials** shared in chat during the project: production WordPress, Main admin, staging WordPress and FTP, the staging webhook secret, the Vercel token | Each account owner | Each service | — |

Estimated time once access exists:
- steps 3–6: about 30 minutes;
- steps 7–8: about 2 hours;
- step 9: about 30 minutes.

## 6. Requirements matrix

| Requirement | Status | Evidence | Action taken | Remaining blocker | Acceptance test |
|---|---|---|---|---|---|
| Main keeps its design, routes, SEO and `/admin` | **Met (PRODUCTION)** | `verify-production` 10 Oct 12:54 UTC: all 314 sitemap URLs answer 200; titles, canonicals, logo and key routes pass | Fixes deployed 9–10 Oct; integration off | — | `node tools/verify-production.mjs` Main checks |
| Enrollment keeps its design, forms, enquiry API | **Met (PRODUCTION, read-only)** | Nothing installed; enquiry route registered | Nothing changed on Enrollment | — | Section 8 after install |
| WordPress admin is the central editor | **Built, not live** | LOCAL `tests/wordpress` 44/44 (10 Oct, release build); STAGING lifecycle 18/18 (earlier build); PHP 205/205 | Package 0.4.0 ready | Steps 1, 3 | Section 7 |
| Visual builder (layouts, styles, responsive, templates, global styles) | **Elementor, for both websites; built, not live** | `docs/ACADVIZEN_VISUAL_BUILDER.md` (implementation matrix); LOCAL A/D/F and responsive render check | No second builder, by design | Steps 1–8; the Main content import | Section 7, rows 3, 15, 16 |
| Preview before publishing, as on Main | **Implemented (LOCAL)** | Draft, pending and scheduled pages render with Main's design, nothing stored; browser test 8/8 plus the frame check; anonymous and forged requests 404 | New in 0.4.0 | Steps 1–8 | Section 7, row 2 |
| Publish to Main updates Main | **Not tested in PRODUCTION** | LOCAL A (16–37 s); STAGING PASS (28–70 s) | — | Steps 1–8 | Section 7, rows 3–5 |
| Enrollment-only content never reaches Main | **Not tested in PRODUCTION** | LOCAL B; STAGING PASS | — | Steps 1–8 | Section 7, row 9 |
| Main-only content creates no public Enrollment page | **Not tested in PRODUCTION** | LOCAL A/E; STAGING PASS (404 on enroll; not in sitemap) | Main-only types always kept out of Enrollment's sitemap | Steps 1–8 | Section 7, row 4 |
| Both | **Not tested in PRODUCTION** | LOCAL C; STAGING PASS | — | Steps 1–8 | Section 7, row 10 |
| Rollback restores text and design | **Not tested in PRODUCTION** | LOCAL F | — | Steps 1–8 | Section 7, row 8 |
| Main stays up if WordPress is down | **LOCAL** | WordPress stopped: Main routes and a published WordPress page answered 200 with content | — | — | Section 7, row 17 |
| Signed API: unsigned, malformed, wrong-secret, expired and wrong-path requests refused | **STAGING (HTTP) + LOCAL** | `cms-api-smoke`: STAGING 13/13; LOCAL 18/18 including correctly signed, expired and wrong-path requests; PHP signature and render-mode tests | Tests and smoke tool added | Production: steps 3–5 | `cms-api-smoke.mjs` with and without the secret |
| Existing Supabase data, leads and blogs preserved | **Met (PRODUCTION)** | Leads 2 (real) unchanged; only identified test records touched | Test lead deleted (by id); test course and tool unpublished | — | Admin → Leads |
| Leads: status can be saved | **Fails in PRODUCTION** | Earlier: HTTP 500 `record "new" has no field "updated_at"`. LOCAL: on a throwaway Postgres shaped like production the same error reproduces, and after the migration the update succeeds | Migrations `202610100001` and `202610100002` written and tested (run twice, rows kept) | Step 2 | Section 11 |
| Admin → Tools lists tools | **Met (PRODUCTION)** | 68 tools listed after `d48492b` | Fallback ordering | Step 2 restores the configured order | Admin → Tools |
| Test content removed | **Partly** | Course: unpublished, name on no page. Tool: unpublished (`is_active: false`), out of the sitemap and `/tools`; its own page still shows its name with `index, follow` | Fix `930e29c` (verified LOCAL: test tool and unknown slugs noindex; 67/67 real tools indexable) | Deploy (step 7) | `verify-production`: "test record … not presented" |
| Enrollment sitemap, redirects, footer, logo | **Fail (PRODUCTION, pre-existing)** | 8 Enrollment checks fail | Exact fixes written (section 10) | Owner WordPress access | `verify-production` Enrollment checks |
| Backups and restore | **Not verified** | — | Procedure written (section 9) | Step 1 | Backup listed with date |
| Documentation | **Done** (describes current state) | This file and the related documents | Rewritten 10 Oct | Results of steps 1–9 must be added | — |

## 7. Production publishing test matrix

These are the production acceptance tests still required. Each uses a temporary page titled "ACV TEST — delete me" and is deleted afterwards. The LOCAL column refers to `tests/wordpress` scenarios (release build 0.4.0, 10 Oct 2026). The STAGING column refers to an earlier build.

| # | Test | PRODUCTION | LOCAL | STAGING |
|---|---|---|---|---|
| 1 | Plugin active, no PHP errors, admin reachable; `.htaccess` unchanged; optional features off | NOT RUN (blocked: step 3) | PASS (L) | PASS |
| 2 | Draft not public anywhere; **Preview on the Main Website** shows it with Main's design | NOT RUN | PASS (A, E) | — (new) |
| 3 | Publish to Main: shown on Main with title, body, layout, colours, address, SEO and canonical | NOT RUN | PASS (A) | PASS |
| 4 | Main-only: 404 on Enrollment, not in its sitemap | NOT RUN | PASS (A, E) | PASS |
| 5 | Edit title and body → update reaches Main | NOT RUN | PASS (C, 7–33 s) | PASS (4–61 s) |
| 6 | Change the address → old address 301 to the new one | NOT RUN | PASS (E) | PASS |
| 7 | Unpublish / trash → gone from Main and the sitemap | NOT RUN | PASS (C: target change; cleanup: delete) | PASS |
| 8 | Rollback (Make live) restores text and design; the next edit replaces it | NOT RUN | PASS (F) | PASS |
| 9 | Enrollment-only does not reach Main | NOT RUN | PASS (B) | PASS |
| 10 | Both: shown on both, a change reaches both | NOT RUN | PASS (C) | PASS |
| 11 | Signed API refusals (missing, malformed, wrong, expired, wrong path); signed requests accepted | NOT RUN (HTTP 404: plugin absent) | PASS, 18/18 HTTP | PASS, 13/13 HTTP |
| 12 | Drafts never in `/blogs` or the manifest | NOT RUN | PASS (smoke: published blogs only) | PASS |
| 13 | Enquiry submission still works | NOT RUN (no approval for another live enquiry) | — | PASS (contract unchanged) |
| 14 | Temporary content removed afterwards | — | PASS | PASS |
| 15 | Global colour change reaches Main and Enrollment; a page's own settings are kept | NOT RUN (affects the live sites: do it only as a deliberate, approved change) | PASS (D) | PASS |
| 16 | City → area → area page, published to Main | NOT RUN | PASS (E) | PASS (locations) |
| 17 | A failed render keeps the live version; a retry recovers | NOT RUN (needs a failure simulation, so not on production) | PASS (H) | PASS |

## 8. Checks right after installing the plugin

1. `node tools/cms-api-smoke.mjs`. Expect PASS for:
   - the namespace and its 4 routes;
   - the enquiry route;
   - `/blogs` (empty list, `no-store`);
   - 4 refusals (401).
2. Home page, a course page, an enquiry page and `/branches/` look and answer as before. Compare with a screenshot taken before the install.
3. `node tools/verify-production.mjs`. The Enrollment results should be unchanged from before the install (the 8 known failures stay until section 10 is done).
4. Master Admin → Settings:
   - "Optional features: SITEMAP_CLEANUP off, LOGIN_BRANDING off, SITE_TEMPLATES off";
   - "Shared secret: Set" (after step 4).
5. `https://enroll.acadvizen.com/sitemap_index.xml`. If it answers 404, open Settings → Permalinks → Save. This has happened before the plugin existed (intermittent 404s on 8 and 10 October).

## 9. Deployment and rollback

**Deploy the local commits to Main** (not done; needs written approval):
1. Check that you are on `headless-wordpress` at the expected commit, with a clean tree.
2. Run `npm run test:unit`, `php tests/php/run.php`, `npx tsc --noEmit` and `npx next build`.
3. `git push origin headless-wordpress`.
4. Vercel → project `acadvizen-newww-ua9d` → Deployments → the new `headless-wordpress` deployment → ⋯ → **Promote to Production**. Or create a production deployment of that commit through the Vercel API, as was done for `d48492b`.
5. Check: `node tools/verify-production.mjs`. The test tool check should now pass.

**Rollback:**

| What | How |
|---|---|
| Main | Vercel → Deployments → promote the previous production deployment. Current: `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56` (`d48492b`). Earlier READY deployments: `dpl_F9QmBR5vWeHyEwWvxF9kyvqFb8N2` (`af233d1`) and `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD` (`a8cc4d5`). None of these commits change the database schema |
| Main integration | Unset `WORDPRESS_CONTENT_ENABLED` and redeploy; every route returns to the Next.js pages |
| Plugin | Plugins → Deactivate. This removes its scheduled jobs and rebuilds the address rules; content is kept. If needed, Delete, which also removes its table of published versions |
| Enrollment database or files | Restore the hPanel backup from step 1 |
| Supabase migrations | Both only add columns. Leave them in place; the code works with and without them |

A rollback has **not** been rehearsed on production. Promoting an older Main deployment as a test would re-introduce the defects it fixed for the length of the test.

## 10. Enrollment fixes (exact values; pre-existing issues)

- **Sitemap addresses** (`/sitemap_index.xml` answers 404 again on 10 Oct; the sitemap itself works at `/?sitemap=1`): Settings → Permalinks → **Save Changes**, then Rank Math → Sitemap Settings → Save.
- **Rank Math → Sitemap Settings → Post Types:** turn off Header Footer templates, PopupKit campaigns, MetForm forms and WPR mega menu. Alternatively, once the plugin is installed, define `ACADVIZEN_CMS_SITEMAP_CLEANUP` (this also restores lost sitemap rules hourly).
- **Rank Math → Redirections → Add New** (301 Permanent):
  - `/contact-us/` → `/digital-marketing-course-enquiry/`;
  - `/advanced-digital-marketing-course-in-mangalore/` → `/ai-integrated-digital-marketing-course-in-mangalore/`;
  - `/social-media-influencer-marketing/` → `/learn-digital-marketing/`.
- **Templates → Theme Builder → Footer #1799:** both "Apply Now" buttons → `https://enroll.acadvizen.com/digital-marketing-course-enquiry/`.
- **Pages:** "Test" (`/test/`) → Draft. **Posts:** the untitled post `/3570-2/` → Draft.
- **Header #960 → Site Logo → Link:** `https://acadvizen.com/`; logo image alternative text "Acadvizen".

## 11. Supabase migrations (owner action)

Production's `leads` and `tools_extended` tables are older than the code expects (read on 10 Oct through the Main admin API):
- `leads` has only `id, name, email, phone, status, created_at`;
- `tools_extended` has no `order_index`.

| File | Changes | Safe? | Needed for |
|---|---|---|---|
| `supabase/migrations/202610100001_leads_add_missing_columns.sql` | Adds `full_name`, `page_slug`, `source`, `form_type`, `payload` (jsonb, default `{}`), `updated_at` (default now()). Copies `name` into `full_name` | Additive and repeatable (`if not exists`); deletes nothing; the table has 2 rows | **Saving a lead's status** (today HTTP 500: the update trigger writes `updated_at`). Storing the page, source, form type and message of new leads |
| `supabase/migrations/202610100002_tools_extended_order_index.sql` | Adds `order_index integer not null default 0` | Additive and repeatable | The admin's configured tool order (the list already works without it, in creation order) |

**How to apply:**
1. Confirm the Supabase backup (step 1).
2. Supabase → SQL Editor: paste the contents of the first file and Run, then the second.

**Checks after applying:**
- `select column_name from information_schema.columns where table_schema='public' and table_name='leads' order by 1;` lists the six new columns.
- Admin → Leads: change a lead's status and change it back. Both saves succeed.
- Admin → Tools still lists 68 tools.

The deployed code works before and after the migrations.

## 12. Test evidence (10 October 2026)

| Test | Method | Result | Where |
|---|---|---|---|
| PHP lint | `php -l` on every WordPress, test and harness PHP file (PHP 8.1.29) | 25 files, 0 errors | LOCAL |
| PHP plugin tests | `php tests/php/run.php` | **205 passed, 0 failed.** Includes optional features off by default, signed routes, the missing secret, render-request modes (publish vs preview, other page, other address, expiry) and the statuses that can be previewed | LOCAL |
| Node unit tests | `npm run test:unit` | **148 passed, 0 failed, 0 skipped** | LOCAL |
| TypeScript | `npx tsc --noEmit` | 0 errors | LOCAL |
| ESLint | `npx next lint` | 0 errors, 10 warnings. All pre-existing and unchanged by this work: `<img>` instead of `next/image` in 9 places, one hook dependency | LOCAL |
| Production build | `npx next build` (integration off; also built with it on for the local scenarios) | Compiled successfully | LOCAL |
| Plugin package | `node tools/build-cms-plugin.mjs` | 0.4.0: 21 files, byte-identical to `a795fb0`; nothing else in the archive; reproducible | LOCAL |
| **End-to-end scenarios** | `node tests/wordpress/scenarios.mjs` (Docker WordPress 7.1 with Elementor 4.3.3, HFE, Rank Math, CF7, MetForm, Astra; local Main production build with the integration on), 13:48–13:57 UTC | **44 passed, 0 failed**: L lifecycle, A Main only, B Enrollment only, C Both, D global colour, E city/area, F rollback, H failure and retry. All test content removed | LOCAL |
| Preview on the Main Website | Browser as administrator, plus HTTP | Button present; 200; draft shown; sandbox without same-origin; noindex; tampered nonce 403; no overflow at 390 px. Anonymous and forged-signature requests 404. A publish render of a draft is refused (409) | LOCAL |
| Responsive settings on Main | Render of a draft with a mobile-only heading size and "hide on tablet" | Desktop size, `@media (max-width:767px)` rule and the tablet class are all in the Main document | LOCAL |
| WordPress unavailable | WordPress container stopped | Main `/`, `/about`, `/courses`, `/blog`, `/tools`, `/contact` 200; a published WordPress page still served with content | LOCAL |
| API smoke with secret | `cms-api-smoke.mjs` against the local plugin | 18/18, including correctly signed, expired and wrong-path requests | LOCAL |
| Supabase migrations | Throwaway Postgres 16 shaped like production (old tables and trigger), each migration run twice | Before: the production error reproduced. After: status update works, rows kept, name copied, full insert stored, `order_index` added | LOCAL |
| Plugin load, default | Main file loaded with stubs | No optional-feature hooks; REST routes registered | LOCAL |
| Tool page fix | Local production server on production data | Test tool and unknown slugs `noindex`, no test name; 67/67 sitemap tools `index` | LOCAL |
| CMS API smoke | `node tools/cms-api-smoke.mjs` | STAGING 13/13 (12:22 UTC). PRODUCTION: before the install 3 pass / 10 fail; **after the install (14:52 and 15:05 UTC) 13/13** | STAGING / PRODUCTION |
| Live websites | `node tools/verify-production.mjs` (12:54 UTC) | 27 pass, 9 fail, 4 informational. Main: 1 fail, the test tool page (fix not deployed). Enrollment: 8 pre-existing fails (section 10) | PRODUCTION |
| Admin and Leads | Main admin session, read-only API | `/admin` loads; Leads 200 (2 leads); Tools 200 (68) | PRODUCTION |
| Test tool unpublished | Admin → Tools, untick Active, Save (only the exact slug) | `is_active: false`; sitemap mentions 1 → 0 | PRODUCTION |
| Publishing lifecycle | Temporary staging page, deleted afterwards | 18/18 (9 and 10 Oct, before the optional-feature flags) | STAGING |

The staging site still runs an earlier build of the plugin, from before `f0d54ff`, in which the three optional features were always on. The 0.4.0 package was tested on the local WordPress, not on staging.

## 13. Known issues not caused by this project

- **Unknown course and tool addresses on Main answer 200** with a generic "Details" page (soft 404). The tool fix adds `noindex` for tools. Course addresses also serve location pages, so courses were left unchanged rather than risk hiding real pages.
- **Enrollment `/my-account/`, `/cart/`, `/checkout/` answer 404.** WooCommerce has no products and nothing links to these addresses.
- **Enrollment's WordPress Address uses `http://`.** Browsers upgrade the requests to https. Change it to `https://` after the backup.
- **Main "Related Blogs" is empty** on the article checked.

## 14. Re-verify at any time

```
node tools/verify-production.mjs             # live websites, read-only
node tools/cms-api-smoke.mjs                 # the plugin's API on production Enrollment
node tools/verify-production.mjs --cutover   # after the integration is switched on
node tools/build-cms-plugin.mjs              # rebuild and verify the plugin package
```

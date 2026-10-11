# Production readiness audit: Acadvizen central CMS

## Update, 12 October 2026 (after the implementation and releases)

The audit below is from 11 October, 09:30 UTC. Since then:

**Released and verified on production** (`PRODUCTION-RELEASE-AND-ROLLBACK.md`):
1. The draft-copy 404 fix.
2. Next.js 15.5.27 (critical advisories closed).
3. The menu-duplication and draft address/SEO fixes.

4. The Main side of the central CMS, switched off (release 4).

The live deployment is `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (commit `45d78b9`).

**Built and tested locally (114/114 browser checks, 194 unit and 242 PHP tests):** central editing of every Main area in plugin 0.6.0:
- pages, the homepage, courses, blogs with authors, categories and tags;
- tools, locations, cities, city and service pages;
- header, footer, menus;
- the media library, SEO overrides and site labels.

Also: durable replay protection, address-conflict checks, and logging of database errors.

**Fixed (latent or live defects):** see `TEST-RESULTS.md` → "Defects found and fixed".

**Still open:**
- **The exposed Supabase service-role key** in the public GitHub history. The owner has decided not to rotate it for now. This is an accepted, **unresolved** risk, so security cannot be marked as passed.
- **Production WordPress access:** the pasted password was refused earlier. Hostinger hPanel is behind a Cloudflare check that the automated browser cannot pass (not bypassed).
- **Main admin access:** the checklist password is now refused.
- **Enrollment and Supabase backups:** not confirmed.
- **The replay-protection migration:** not applied (needs database access).
- **`npm audit`:** 6 high-severity advisories remain in other packages (nodemailer, sharp, tiptap/prosemirror, nanoid, source-map-js).
- **Enrollment:** sitemaps return 404, plus three redirects, `/contact-us/` and the logo link.

**Answers to the 11 October checklist that changed:**
- The local credentials file now **exists** (Hostinger login only; access limited to the owner's Windows user).
- Next.js: **upgraded on production**.
- The middleware 404 fix: **released and verified**.

**Audit time:** 11 October 2026, completed 09:30 UTC.
**Type:** read-only. Nothing was deployed, pushed, installed, migrated, published or deleted on either website or service.
**Labels:**
- **PRODUCTION**: observed on the live systems during this audit.
- **LOCAL**: observed on the local test stack only.
- **CODE**: established by reading the source.

Statuses: PRESENT, MISSING, INVALID, INACCESSIBLE, UNVERIFIED for access items; PASS, FAIL, PARTIAL, BLOCKED, NOT TESTED for checks.

## 1. Executive summary

- **Do not hand over yet. Rotate a leaked key first.**
  - A production Supabase **service-role key** is in this repository's Git history: `scripts/apply-migration.js`, `scripts/cleanup-test-data.js` and `scripts/restore-pages.js` in commits `07fb544` (26 July) and `e0207ee` (3 August).
  - Those commits are on GitHub `main` and two other branches. The repository is **public** (the unauthenticated GitHub API answers 200).
  - The leaked key matches the service-role key in the local `.env.local`, compared by hash only. It belongs to the production project and expires in 2036.
  - With it, anyone can read, change or delete every Main record, including leads (personal data). It must be **rotated in Supabase** and replaced in Vercel and `.env.local` before anything else.
- **Main is live and healthy on its old build.**
  - Live build: `d48492b` (deployment `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56`).
  - All 314 sitemap URLs answer 200, with canonicals in place (PRODUCTION).
  - The WordPress integration is **off**: no `WORDPRESS_*` variables are set in Vercel.
- **The central editing of Main content (plugin 0.5.0) exists only on this computer.**
  - It passed 55/55 acceptance checks (LOCAL).
  - It is not pushed, deployed, installed or configured.
  - Production runs plugin **0.4.0**.
- **The live 404 defect is real, but nothing is broken right now.**
  - The defect: a published page answers 404 while a private draft exists.
  - It is fixed in `f9fa6df`, which is **not deployed**.
  - At audit time no live page was affected: all sitemap URLs answered 200.
- **Full central management is not implemented, even locally.** Still edited only in Main's own `/admin`:
  - homepage, courses, header, footer, menus;
  - city, area and service pages;
  - the media library, redirects and forms.
- **Production acceptance testing is BLOCKED.** Missing:
  - a production WordPress login (the credentials file does not exist);
  - a confirmed Enrollment backup;
  - a confirmed Supabase backup;
  - the shared secret;
  - your release approval.

## 2. Architecture and deployment

```
enroll.acadvizen.com (WordPress, Hostinger)      www.acadvizen.com (Next.js, Vercel project acadvizen-newww-ua9d)
  Acadvizen Master Admin plugin                      reads Supabase project hhfc… (pages, sections, blogs, tools, …)
    0.4.0 installed (Render Bridge, Elementor)       /api/wordpress/content  (0.5.0 hybrid editing; off unless enabled)
    0.5.0 built locally (Main Website screens) ───►  /preview/wordpress/…     (signed preview)
                                                      middleware privacy check (404 defect, fix f9fa6df not live)
```

- **Main:**
  - stays Next.js;
  - the WordPress screens edit Main's existing Supabase records through a signed API;
  - Main draws them with its own components, so its URLs and design stay unchanged.
- **Enrollment:** stays WordPress and Elementor. Elementor (Render Bridge) is only for **new** free-form Main pages, and it is off in production.

| Item | Value | Level |
|---|---|---|
| Live Main deployment | `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56`. Created 10 Oct 2026, 11:17 UTC; Ready. Aliases: www.acadvizen.com and acadvizen.com | PRODUCTION (Vercel CLI) |
| Live Main commit | `d48492b`. The deployment id is the one recorded as `d48492b` on 10 Oct; GitHub `origin/headless-wordpress` is also at `d48492b` | PRODUCTION |
| Earlier production deployments | 4 more Ready production deployments, from 2 to 32 days old, so a rollback target exists | PRODUCTION |
| Local branch | `headless-wordpress`, clean working tree, **13 commits ahead** of GitHub (`f0d54ff` … `20bf32d`), 0 behind | LOCAL |
| Reported commits | `f9fa6df` (middleware fix, 1 file), `7710f96` (content API, 12 files), `a4178c6` (plugin 0.5.0, 9 files), `20bf32d` (docs, 16 files). All exist; **none on GitHub** | LOCAL |
| Plugin artefact | `dist/acadvizen-cms-0.5.0-a4178c6/acadvizen-cms.zip`. Present; SHA-256 `d1ddf7dc96ef3f77b242cc27717919b77bea8dee483d51248afa7f5dc9d2bb6a`; 24 files, byte-identical to `a4178c6`; `dist/` is git-ignored | LOCAL |
| Installed plugin | **0.4.0** (`Stable tag` in the public `readme.txt`; namespace `acadvizen-cms/v1` registered) | PRODUCTION |

## 3. Access and configuration checklist

No secret values were displayed. Vercel shows values as "Hidden" and none were pulled into the repository. The Vercel CLI wrote a development `.env.local` into a scratch folder outside the repository; it was deleted unread.

| Area | Item | Status | Evidence / how to grant |
|---|---|---|---|
| GitHub | Repository `Lavanyaraju19/Acadvizen-newww`, branch `headless-wordpress` | PRESENT | `git remote`; origin head `d48492b` |
| GitHub | Push permission | PRESENT | `git push --dry-run` authenticated and would fast-forward `d48492b..20bf32d`; nothing was sent |
| GitHub | `gh` CLI | MISSING (not logged in) | Not needed for release; `gh auth login` if PRs are wanted |
| GitHub | Unpushed work | 13 commits | `git log origin/headless-wordpress..HEAD` |
| GitHub | Uncommitted work | None | `git status` clean (before this report was written) |
| GitHub | Secrets tracked in current files | None found | Scan for JWT, service-role and token shapes; only `.env.example*` are tracked |
| GitHub | **Secrets in history** | **FAIL: production service-role key in a public repository** | `07fb544`, `e0207ee` (`scripts/*.js`); same key as `.env.local` (hash match) |
| Vercel | Team and project access | PRESENT | CLI user `lavanyaraju581-6438`, project `acadvizen-newww-ua9d` |
| Vercel | Production variables (names) | PRESENT: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `vercel env ls` |
| Vercel | `SUPABASE_SERVICE_ROLE_KEY` | PRESENT (Production); value UNVERIFIED | Needed by the content API to write. **Must be replaced after rotation** |
| Vercel | `WORDPRESS_CMS_WEBHOOK_SECRET` | MISSING | Needed for signed calls. 32+ random characters, identical to WordPress `ACADVIZEN_CMS_WEBHOOK_SECRET` |
| Vercel | `WORDPRESS_CONTENT_API_ENABLED` | MISSING (correct for now) | Code reads `=== 'true'` at run time (`app/api/wordpress/content/route.js:21`). Set only after the prerequisites |
| Vercel | `WORDPRESS_CMS_API_URL` | MISSING | Also needed for the hybrid editor: without it Main's CSP blocks images chosen from the WordPress media library and blocks the WordPress preview frame (`next.config.mjs:26`, `:30`) |
| Vercel | `WORDPRESS_CONTENT_ENABLED` | MISSING (correct) | Render Bridge; keep off |
| Vercel | Deploy and rollback | PRESENT | Owner account; earlier Ready production deployments exist; **Promote** not rehearsed |
| WordPress | Production login | **BLOCKED** | `C:\Users\HP\.acadvizen-production.env` **does not exist**. Create a dedicated Administrator; save `WP_PROD_USER` and `WP_PROD_PASS` there (never in chat) |
| WordPress | Plugin installed and active | PRESENT (0.4.0) | Public `readme.txt`; REST namespace registered |
| WordPress | Signed routes refuse unsigned or forged calls | PASS | `tools/cms-api-smoke.mjs`: 13/13 (401 for unsigned, malformed and wrong-secret calls) |
| WordPress | `ACADVIZEN_CMS_WEBHOOK_SECRET` in `wp-config.php` | UNVERIFIED (behaviour suggests not set) | Needs a server file view (hPanel File Manager) |
| WordPress | Public `/blogs` route exposes only published content | CODE: PASS. PRODUCTION: NOT TESTED | Needs content to exist |
| WordPress | Enquiry route `/wp-json/acadvizen/v1/enquiry` | PASS (registered) | No submission sent (needs approval) |
| Supabase | Project identified | PRESENT (`hhfc…`, same in `.env.local` and the leaked key) | — |
| Supabase | Migrations `202610100001` (leads columns) and `202610100002` (`tools_extended.order_index`) | **Applied** (all their columns exist) | Schema probe with the public key, `limit=0`, no rows read. Not applied by me; applied by someone after 10 Oct |
| Supabase | Staged drafts (`pages.draft_of_id`), `audit_log`, `published` columns used by the API | PRESENT | Same probe |
| Supabase | RLS and authorisation for the content API | CODE: the API uses the service-role key (bypasses RLS); access is gated by the HMAC signature, the allow-listed fields and the operation rules | — |
| Supabase | Dashboard and backups | **BLOCKED** | Dashboard login had a CAPTCHA (not bypassed). The owner must check **Database → Backups** (daily backups or PITR) |
| Backups | Enrollment database and files | **BLOCKED** | hPanel is behind a Cloudflare challenge (not bypassed). The owner must create a backup in hPanel → Backups and confirm its date and scope |
| Backups | Main code | PRESENT | Git plus earlier Vercel deployments |

## 4. The draft-versus-published 404 defect

| Question | Answer |
|---|---|
| Original failure | `src/middleware.js` `fetchCmsPagePrivacy` looked up `pages` by slug with `limit=1` and took the first row. A private draft copy (`draft_of_id`) has the **same slug**. If that row came first, the middleware returned a plain-text 404 for the live page. It also happens when a draft is started in Main's own `/admin`. Reproduced LOCAL (404 on every request with a draft present) |
| Fix in the branch | Yes, `f9fa6df`. The query adds `draft_of_id=is.null`, and falls back to the old query if the column is missing (HTTP 400) |
| Regression coverage | LOCAL acceptance check **B3** now requires status 200 **and** unchanged content while a draft exists (PASS, run `202610110809`). **No unit test** for the middleware |
| In the intended release | Yes, but on the branch it sits on top of 4 other unpushed releases' worth of commits. An isolated release needs a branch from `d48492b` with only `f9fa6df` cherry-picked |
| In production | **No.** GitHub and the live deployment are at `d48492b` |
| Read-only production evidence | At audit time all 314 sitemap URLs answered 200, so no live page was affected at that moment. Whether a draft exists in production right now is UNVERIFIED (drafts are hidden from the public key) |

## 5. Feature completeness

Columns: implemented locally / tested locally / configured in production / deployed / verified live. "WP" means the WordPress central admin. Everything not listed as done in WP is still edited in Main's `/admin`.

| Feature | Impl. | Tested | Configured | Deployed | Live | Evidence and remaining work |
|---|---|---|---|---|---|---|
| Existing Main pages (sections) | Yes (WP 0.5.0) | Yes | No | No | No | Acceptance A, B, E (55/55 LOCAL). Release, then production acceptance |
| **Homepage** | **No** (Main `/admin` homepage builder; about 13 `homepage_*` tables) | — | — | — | — | Build WP screens over the homepage tables |
| **Courses** (`courses`, `course_details`) | **No** | — | — | — | — | Build. Course landing pages stored as `pages` (e.g. `/seo-course-in-bangalore`) **are** covered |
| Blogs, versions, restore | Yes | Yes (D/E, H1, H2) | No | No | No | — |
| Tools | Yes | Yes (E6, E7) | No | No | No | — |
| Cities, locations | Yes | **List only** (A2); create, edit and delete not exercised | No | No | No | Add acceptance steps |
| Area, city and service pages (`city_pages`, `location_sections`, `service_pages`) | **No** | — | — | — | — | Build |
| Testimonials | Yes | API only (H9), not through the screen | No | No | No | Add a UI step |
| **Header and footer** (`header_settings`, `footer_settings`) | **No** | — | — | — | — | Build. The Elementor header and footer apply only to bridged pages (bridge off) |
| **Navigation and menus** (`menus`, `menu_versions`) | **No** | — | — | — | — | Build |
| Sections and design settings | Yes (only what Main renders) | Yes (B2, E10, E11) | No | No | No | Pre-existing renderer gaps: rich-text list/CTA, three-column `title` |
| Desktop, tablet and mobile preview | Yes | Yes (B5: 1280/820/390 px) | No (`WORDPRESS_CMS_API_URL` needed for framing) | No | No | — |
| Media | **Partial**: WP media picker inserts URLs; Main's own media library not managed | Not tested (no image chosen in the run) | No (CSP needs `WORDPRESS_CMS_API_URL`) | No | No | Add a test; decide whether Main's media library moves |
| SEO title, description, canonical, noindex, sitemap exclusion | Yes | noindex tested (E2) | No | No | No | A per-slug `seo_metadata` row overrides page SEO (1 row exists in production). Show or override in WP |
| Main / Enrollment / Both | Yes for blogs; pages are Main records; Elementor pages via the Render Bridge (0.4.0) | Yes (D1–D3; bridge scenarios A–C on 0.4.0) | No | Plugin 0.4.0 only | No | — |
| Draft, review, publish, unpublish, trash, restore, rollback | Yes | Yes (B, E4, E5, E12, B8, H2). **Delete permanently via the screen not tested**; scheduling field present, **not tested** | No | No | No | Add the two tests |
| Roles and author restrictions | Yes | Yes (H3–H5; PHP permission and ownership tests) | No | No | No | — |
| Audit history and errors | Yes (Activity log in WP; `audit_log` rows on Main) | Activity log tested (J2); `audit_log` rows not inspected | No | No | No | — |
| Cache revalidation | Yes (`revalidateCmsMutation`) | Yes, implicitly (B7, E9: change visible at once) | No | No | No | Verify on Vercel's cache |
| Publishing webhooks (Render Bridge) | Yes | LOCAL scenarios (0.4.0) | No secret | 0.4.0 | Refusals only (13/13) | — |
| Enquiry forms and leads | Unchanged | — | — | Live | Route registered (PASS); Main `/contact` form present (PASS) | One approved test enquiry |
| URL, SEO and design preservation | By design | B9: 0.000 % pixels differ (LOCAL) | — | — | Current baseline OK: 314 URLs 200, canonicals OK (PRODUCTION) | Re-check after release |

## 6. Test commands and results (this audit)

| Command | Exit | Result | Level |
|---|---|---|---|
| `npm run test:unit` | 0 | 158 pass, 0 fail | LOCAL |
| `php -l` on every PHP file (PHP 8.2, Docker) | 0 | 26 files, 0 errors | LOCAL |
| `php tests/php/run.php` | 0 | 228 pass, 0 fail | LOCAL |
| `npx tsc --noEmit` | 0 | 0 errors | LOCAL |
| `npx next lint` | 0 | 0 errors, 10 pre-existing warnings | LOCAL |
| `npx next build` (integration off) | 0 | compiled | LOCAL |
| `npm audit --omit=dev` | 1 | **1 critical, 6 high, 29 moderate** (see section 8) | LOCAL |
| `node tools/cms-api-smoke.mjs` | 0 | 13/13 | PRODUCTION (read-only) |
| `node tools/verify-production.mjs` | 1 | 26 pass, **10 fail**, 4 info (see section 8) | PRODUCTION (read-only) |
| `tests/wordpress/structured-acceptance.mjs` | 0 | 55/55 (run `202610110809`, earlier today; not re-run). 43 steps used a DOM-event fallback instead of a real click | LOCAL |

What the tests cover:

| Area | Covered by |
|---|---|
| Publishing targets | D1–D3 |
| Permissions | H3–H5, PHP |
| Draft isolation | B3 |
| Version restore | B8, H2 |
| Slug conflicts | I1, unit |
| Signature and replay | unit, H8, H9 |
| Cache revalidation | B7, E9 |
| Rollback | B8–B9 |

None of these has run against production.

## 7. Deployment and plugin version status

| Component | Local | GitHub | Live |
|---|---|---|---|
| Main code | `20bf32d` | `d48492b` | `d48492b` |
| Middleware 404 fix | `f9fa6df` | no | no |
| Content API and preview | `7710f96` | no | no |
| Unpublished-tool page fix | `930e29c` | no | no |
| WordPress plugin | 0.5.0 (`a4178c6`, ZIP verified) | source not pushed | **0.4.0** |
| Supabase migrations `202610100001`, `202610100002` | in repo | not pushed | **applied** |

## 8. Security and known issues

| Severity | Issue | Evidence | Action |
|---|---|---|---|
| **Critical** | Production Supabase service-role key in a **public** repository's history | Section 3 | Rotate in Supabase (new secret API key, or JWT secret rotation, which also changes the public key). Update Vercel and `.env.local`, then redeploy. Review recent data changes. Optionally purge history and ask GitHub to clear cached views. Rotation is what actually closes the hole |
| **Critical (applicability to confirm)** | Next.js **15.5.22** has critical advisories: GHSA-p293-qw3h-jr36 (RCE on Windows-hosted servers) and GHSA-2xp9-vwfh-vxw4 (RCE in image optimisation with AVIF), plus cache-poisoning advisories | `npm audit` | Upgrade to a patched 15.5.x (≥ 15.5.27), rebuild, regression test. On Vercel the first advisory likely does not apply; the second depends on Vercel's image service. Upgrade regardless |
| High | `nodemailer`, `sharp`, `@tiptap/core`, `prosemirror-view`, `nanoid`, `source-map-js` advisories | `npm audit` | `npm audit fix` (non-breaking), then test |
| High (live) | Published page can answer 404 while a draft exists | Section 4 | Release `f9fa6df` |
| Medium | Replay protection of the new content API is in memory per server instance. On Vercel a captured request could be replayed to another instance within the 5-minute window | `lib/wordpress/webhook.js:22` | Store request ids in a table with a unique key before enabling. Exposure is low: requests are HTTPS server-to-server |
| Medium (live, SEO) | Enrollment `/sitemap_index.xml`, `/page-sitemap.xml` and `/post-sitemap.xml` answer **404**; robots.txt still points at the index | PRODUCTION, 3 of 3 attempts | Rank Math → Sitemap settings; flush permalinks (Enrollment admin) |
| Low (live) | Enrollment: 3 redirects answer 404, `/contact-us/` linked from the homepage is 404, the logo links to the Enrollment home | `verify-production.mjs` | Pre-existing; Enrollment admin fixes |
| Low (live) | Main `/tools/local-e2e-tool-1779297401` (an unpublished test tool) still shows its name (soft 404) | `verify-production.mjs` | Fixed in `930e29c`, not deployed |
| Low | A per-slug `seo_metadata` row silently overrides page SEO set in WP | CODE `app/(public)/[slug]/page.jsx:32` | Show the override in WP |
| Info | The CMS login logo links to the staging site (`acadvizen-cms-staging.vercel.app`) | PRODUCTION | Point it to www when cms.acadvizen.com is retired or repointed |

## 9. Blockers to production release, in order

1. **Rotate the leaked Supabase service-role key** (owner: Supabase dashboard). Then update `SUPABASE_SERVICE_ROLE_KEY` in Vercel and `.env.local`, and redeploy.
2. **Production WordPress login.** Create `C:\Users\HP\.acadvizen-production.env` with `WP_PROD_USER` and `WP_PROD_PASS` for a dedicated Administrator.
3. **Enrollment backup.** The owner creates a full hPanel backup (database and files) and confirms its date and size. The backup must be downloadable or listed as restorable.
4. **Supabase backup.** The owner confirms that daily backups or PITR exist, with the latest backup time.
5. **Release approval for the isolated 404 fix.** Branch from `d48492b`, cherry-pick `f9fa6df`, deploy, verify, and keep the previous deployment for Promote. This is independent of everything below.
6. **Next.js security upgrade:** a patched 15.5.x, regression-tested.
7. **Shared secret.** Generate one value and set it in `wp-config.php` (`ACADVIZEN_CMS_WEBHOOK_SECRET`, plus `ACADVIZEN_CMS_MAIN_URL`) and in Vercel (`WORDPRESS_CMS_WEBHOOK_SECRET`, `WORDPRESS_CMS_API_URL`). Leave `WORDPRESS_CONTENT_API_ENABLED` unset until step 9.
8. **Persistent replay protection** for the content API: a code change, tested locally.
9. **Release the content API and install plugin 0.5.0**, after review. Then set `WORDPRESS_CONTENT_API_ENABLED=true` and run the production acceptance with labelled, reversible content (`TEST-PLAN.md`), plus one approved test enquiry.
10. **Build the missing central-management features**: homepage, courses, header, footer, menus, area and service pages, media decision. Test them locally, then in production.

## 10. Release plan (each step needs your approval)

| # | Step | Verify | Way back |
|---|---|---|---|
| 1 | Key rotation (owner) | Main pages and `/admin` still work; the old key is refused | — |
| 2 | Isolated deploy: `d48492b` + `f9fa6df` | All sitemap URLs 200. On a non-critical page you choose: start a draft in Main `/admin`, edit it; the live page stays 200 and unchanged; publish it; discard | Promote `dpl_ApR7…` |
| 3 | Next.js patch release | `verify-production.mjs` no worse than the baseline | Promote previous |
| 4 | Backups confirmed (owner) | Dates and scope recorded in `BASELINE.md` | — |
| 5 | Secret in `wp-config.php` and Vercel; plugin 0.5.0 uploaded over 0.4.0 | Smoke test with the secret; Main Website screens load; existing Elementor pages unchanged | Re-upload the 0.4.0 ZIP (`dist/`) |
| 6 | Deploy `7710f96` (and `930e29c`), then enable `WORDPRESS_CONTENT_API_ENABLED` | Production acceptance A–J on CMS PRODUCTION TEST content | Remove the variable and redeploy (the API answers 503) |
| 7 | One approved test enquiry | Stored in Leads, email received | Delete the test lead |

## 11. Rollback procedure

`ROLLBACK.md` applies. Additions for 0.5.0 and the content API:

| Situation | Step |
|---|---|
| A WordPress edit damaged a Main record | Edit screen → Earlier versions → **Restore**. For a page, the private-draft flow keeps the live page untouched until publishing |
| The content API misbehaves | Vercel: remove `WORDPRESS_CONTENT_API_ENABLED` and redeploy (or Promote the previous deployment). WordPress then shows "needs the connection" and no Main data can change |
| The plugin 0.5.0 misbehaves | Deactivate it, or re-upload 0.4.0. Main content is untouched (it lives in Supabase) |
| Data loss in Supabase | Supabase backup or PITR restore. **Not yet confirmed to exist** |

## 12. Non-technical admin acceptance checklist (to run on production after step 6)

Run as a real administrator, on **CMS PRODUCTION TEST** content and one approved page. Record each item with a screenshot.

- [ ] Acadvizen Master Admin → **Main Website** opens, showing Pages, Blogs, Tools, Locations, Cities, Testimonials and Activity.
- [ ] An existing page is found by search and shows its address and status.
- [ ] **Prepare changes privately** → edit one section → **Save section**. The live page stays the same and answers normally.
- [ ] **Preview** shows the change at desktop, tablet and mobile widths.
- [ ] Publish. The live page shows the change within a minute.
- [ ] **Restore** the earlier version. The live page is as before.
- [ ] A test blog published to **Main**, then **Enrollment**, then **Both**: each website checked.
- [ ] Trash and restore the test blog. It disappears, then returns as a draft.
- [ ] A test tool shown and hidden.
- [ ] An Author account cannot open Pages and sees only their own articles.
- [ ] A Contributor can only save drafts or submit for review.
- [ ] The Activity tab lists every change with the right name.
- [ ] One approved test enquiry arrives in Leads and by email.
- [ ] All test content is deleted, and its addresses answer "not found".

## 13. Remaining work before claiming full CMS completion

- Production evidence for everything in section 5. Today **nothing** about the new editing is verified live.
- WordPress screens for:
  - homepage;
  - courses and course details;
  - header and footer;
  - menus;
  - city, area and service pages;
  - a decision and implementation for Main's media library.
- Tests not yet written:
  - cities and locations through the screen;
  - testimonials through the screen;
  - **Delete permanently** through the screen;
  - scheduled publishing;
  - an image chosen from the media library;
  - a middleware unit test.
- Persistent replay protection; the Next.js and dependency upgrades.
- Enrollment SEO and redirect fixes (sitemaps, three redirects, `/contact-us/`, logo link).

## 14. Not verified in this audit

- Whether the Vercel `SUPABASE_SERVICE_ROLE_KEY` is the leaked one. Vercel hides the value; the leaked key matches the one in `.env.local`.
- Whether `ACADVIZEN_CMS_WEBHOOK_SECRET` is set in `wp-config.php` (needs server file access).
- Enrollment and Supabase backups (dashboards not accessible).
- Any authenticated WordPress check: roles, plugin settings, Elementor, form plugins.
- Whether a private draft exists in production right now.
- Who applied the two Supabase migrations, and when.
- Whether the Next.js critical advisories apply to this Vercel deployment.
- The production acceptance tests: NOT TESTED; they need the prerequisites above.

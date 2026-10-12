# Test results — 10 October 2026, updated 12 October 2026

The statuses used are PASS, PARTIAL, FAIL, BLOCKED and NOT TESTED. The level (Automated, LOCAL, PRODUCTION) is stated on every row.

## 11–12 October 2026: complete Main Website editing (plugin 0.6.0) and three production releases

### PRODUCTION (verified on the live site)

| Check | Result | Status |
|---|---|---|
| Release 1 (draft-copy 404 fix): live deployment, all sitemap URLs | `dpl_2ZCk4Vtf…`; 314/314 answer 200; `verify-production.mjs` same as before (26/10) | PASS |
| Release 2 (Next.js 15.5.27): live deployment, build log, URLs, errors | `dpl_9ZCRdZD4…`; build log "Next.js 15.5.27"; 314/314; 26/10; no error logs | PASS |
| Release 3 (menu duplication; draft address/SEO): live deployment, URLs, navigation | `dpl_9ZdvT6jS…`; 314/314; each navigation link once across repeated requests; no error logs | PASS |
| Release 4 (Main side of the central CMS, API off): pre-release comparison with the live site on production data | 314/314 URLs answer 200. Ten key pages at 1440 and 390 px: 0.001–0.098 % of pixels differ (/tools: 0.064 % once its grid had loaded; phone heights equal) | PASS |
| Release 4: live deployment | `dpl_EuZnhizE…` (**live**); all sitemap URLs answer 200; `verify-production.mjs` 27 passed / 9 failed (the tool page check now passes; the 9 are the known Enrollment issues); content API answers 503 `content_api_disabled`; no error logs | PASS |
| Plugin 0.6.0 package | `dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`, 24 files, byte-identical to commit `45d78b9`; scanned: no secrets, env files or logs | PASS |
| `npm audit --omit=dev` after the upgrade | 0 critical (was 1); 6 high remain in other packages | PARTIAL |
| Dependency fixes, 12 Oct (LOCAL, uncommitted, not deployed) | `npm audit fix` (19 patch/minor bumps, including sharp 0.35.5, nodemailer 9.1.1, prosemirror-view 1.42.6, nanoid, source-map-js) plus all tiptap packages ^3.28.0 → ^3.31.4 (same major). Production advisories went from 6 high + 27 moderate to **2 high, 0 moderate**. Left: `nodemailer` (the fix is major version 10) and the `sharp` copy that Next.js pins inside `next/node_modules` (needs a Next.js release). Previous lock file kept outside the repo | PARTIAL |
| Draft copy of a live page created through Main `/admin`, live page stays 200 (12 Oct, `prod-draft-404-test`, disposable noindex page `/cms-production-test-202610112251`) | **14/15.** Created as draft (404 while unpublished) → published (200) → private draft copy started and edited → live page 200 and unchanged on **10/10** requests → noindex robots → copy discarded, live page still 200 → test page deleted → address 404 → 0 test rows left. **One failure:** the noindex test page was listed in `sitemap.xml` (see the sitemap defect below) | PASS (draft fix); FAIL (sitemap) |
| Supabase migration `202610110001` (replay-protection table) | Applied on 12 Oct with `supabase db query --linked -f` (the table was confirmed missing first; `supabase db push` was **not** used). Verified: RLS on, 0 policies, no privileges for `anon`/`authenticated`, 0 rows, the anon REST call answers 401. Then recorded with `supabase migration repair --status applied 202610110001`. The 14 other unrecorded local migrations were left untouched | PASS |
| Supabase backups (project `hhfccftkfryesjirauwf`) | 8 daily physical backups, all COMPLETED, latest 11 Oct 2026 18:44 UTC. Point-in-time recovery is **off**. Storage files (images) are not part of these backups | PASS (with limits) |
| Plugin 0.6.0 installed; content API enabled; acceptance on production | Live plugin is still 0.4.0. No usable WordPress login (the password given was refused). Vercel variables are set (12 Oct), but the API stays off until the owner deploys; `wp-config.php` constants not yet set (owner) | BLOCKED (owner actions, `OWNER-ACTIONS.md`) |
| Release 9 before promotion: release build on production data compared with live | 314/314 sitemap URLs identical (status, title, description, robots, canonical, og:url); 20 key-page screenshots 0.000–0.094 % different (`/tools` with its 67-tool grid loaded) | PASS |
| Release 9 promoted (`dpl_4YpH3TaN…`, commit `dde1328`) | 314/314 URLs answer 200; `verify-production.mjs` 27/9, unchanged; the first promotion hit `git_info_fail` with no effect on live, and the retry succeeded | PASS |
| `tools/verify-content-api-live.mjs` | **16/16 PRODUCTION**: authentication (401 unsigned, wrong secret, stale), signed access, Main-only publishing of a disposable noindex page, sitemap exclusion, replay refused (409), cleanup (404, 0 rows) | PASS |
| Editor fix on production `/admin/popups` (nothing saved) | One click plus "word" gives `<p>word</p>` | PASS |
| WordPress sign-in, 12 Oct | Refused a fourth time ("password … incorrect"); not retried | BLOCKED (owner) |
| WordPress sign-in with the owner's **new** password, 12 Oct about 15:44 IST | **Succeeded.** Administrator rights confirmed (plugins, users, uploads). Site Health: "Everything is running smoothly", 0 critical issues. 35 plugins inventoried; Acadvizen Master Admin 0.4.0 active | PASS |
| Plugin 0.6.0 package before install | SHA-256 `93d5e391…` as documented; all 24 files byte-identical to the committed plugin; version 0.6.0 | PASS |
| Enrollment baseline before any change | 60 published pages/posts all 200. Two captures are identical in status, title, robots, canonical and Elementor; screenshots vary naturally by up to 1.6 % (sliders) | PASS (baseline) |
| Read-only production connection check, 12 Oct 13:56–13:57 UTC | Plugin Settings: Main Website address set, Shared secret **Set**, plugin 0.6.0, optional features off. **Main Website → Pages lists 50 Main pages** (signed WordPress → Main requests accepted). Signed content-API list: 200. Unsigned: 401. Bridge manifest: 404. `WORDPRESS_CMS_API_URL` set in Vercel at 13:54 UTC, after the live build (09:36 UTC), so not yet active: preview `frame-ancestors 'none'`. "Test connection": `http_503: wordpress_content_disabled` (fixed by release 10) | PASS (connection); FAIL until release 10 (Test connection, previews) |
| Main production secret matches the credentials-file secret (12 Oct evening) | Signed read-only request: HTTP **200**. The secret line in the credentials file now has the SSH host joined onto it (missing line break). Read naively it gave a 115-character value and a 401; read correctly, it is the 64-character value | PASS |
| WordPress "Test connection" on production (before release 10) | `/api/wordpress/slug-check` answers 503 `wordpress_content_disabled`, because it followed the reading switch. **Defect**, fixed locally in release 10 | FAIL (production), fix ready |
| WordPress preview frames on production | `/preview/wordpress/…` answers `frame-ancestors 'none'`, because `WORDPRESS_CMS_API_URL` is not set. **Defect** (configuration), fix documented: set the variable | FAIL (production), fix ready |
| Release 10, LOCAL, production-like configuration (content API on, `WORDPRESS_CMS_API_URL` set, reading off) | Unit **210/210** (11 new); TypeScript and ESLint 0 errors; build OK; PHP 242/242 and lint 20 files; "Test connection": **Connected**; preview `frame-ancestors 'self' <WordPress>`; bridge manifest 404 (reading stays off); content-API live tool 16/16; WordPress live tool 15/15; **pages/blogs 56/56**, including preview at 1280/820/390 px | PASS (LOCAL) |
| Pages/blogs suite interrupted twice | First by the blocked preview (as on production). Then twice by a private draft copy the interrupted run had left on the test page. The suite now always discards its own draft copy; the LOCAL leftover was removed with trash + delete, and the live page was unchanged | Fixed (test cleanup) |
| SSH access for `wp-config.php` | Refused by the engineer's permission system ("credential exploration"); not attempted | BLOCKED (owner decision) |
| WordPress sign-in with the owner's new dedicated account, 12 Oct about 16:30 IST | One attempt; signed in with administrator rights | PASS |
| **Plugin 0.6.0 installed on Enrollment** | Hash re-checked (`93d5e391…`). WordPress showed "current 0.4.0 / uploaded 0.6.0", then "Plugin updated successfully". The Plugins list shows Acadvizen Master Admin **0.6.0 active**, and the public readme says 0.6.0 | PASS |
| Enrollment preserved after the install | Full plugin list: the only change is Acadvizen Master Admin 0.4.0 → 0.6.0. Course Enquiries, Contact Form 7, MetForm and Elementor are unchanged and active. Site Health: 0 critical issues. **60/60 published pages identical to the baseline** (status, title, robots, canonical, Elementor); screenshots within the natural variation measured before. REST namespaces `acadvizen-cms/v1` and `acadvizen/v1` present; the enquiry route is registered (POST). Admin "error" boxes: 7 hidden empty templates from other plugins and WordPress, none visible | PASS |
| Connection from WordPress to Main | The plugin reports "Not connected to the Main Website": the `wp-config.php` constants are not set. No authorised file access (no SFTP; hPanel File Manager is behind a Cloudflare check that needs a person) | BLOCKED (owner) |
| Main only / Enrollment only / Both from the WordPress admin | Not run: they need the connection above | NOT TESTED (PRODUCTION) |
| hPanel route (one-click WP Admin plus File Manager), 12 Oct 16:08–16:23 IST | A visible Chrome window waited 15 minutes on hPanel's Cloudflare check. Nobody completed the check, so the login form never appeared and nothing was entered. The credentials file still holds the WordPress password refused at 15:53, with no integration account and no SFTP access | BLOCKED (owner) |
| Plugin 0.6.0 installation | **Not completed.** The upload reached WordPress's "already installed: replace?" screen. The replace click stalled in headless Chromium, then the saved session was found signed out. A fresh sign-in at about 15:53 IST was refused ("password … incorrect"), with the credentials file unchanged since 15:41. The account password was changed in WordPress in between, outside these steps. No further attempts. The plugin is still **0.4.0**, and all 60 Enrollment pages are identical to the baseline. WordPress deletes the unused uploaded package automatically | BLOCKED (owner) |
| `tools/verify-wordpress-live.mjs` (Main only / Enrollment only / Both) | Not run on production: needs WordPress access | NOT TESTED (PRODUCTION) |
| Secret scan: all history and the current tree | Service-role key, production database password and two admin passwords are in old public commits. The database password was also in 12 current scripts and has been removed (`8535030`). Guard, pre-commit hook and GitHub workflow added; the workflow passed | PARTIAL (history unresolved) |
| Vercel Production variables for the content API | `WORDPRESS_CMS_WEBHOOK_SECRET` (Sensitive) and `WORDPRESS_CONTENT_API_ENABLED` set through the Vercel API. The secret exists only in the private credentials file. Live API still 503 (no deployment yet) | PASS (configuration) |
| `tools/verify-content-api-live.mjs` against production before the deployment | Stops before any change: "content API still switched off (503)" | PASS (safe guard) |
| Enrollment backup files (10 Oct backup, downloaded 12 Oct) | Files archive read completely (95,489 entries; enroll.acadvizen.com 45,435 entries, 1.47 GB). Enrollment database dump: gzip OK, 108 tables, "Dump completed"; it is the database named in Enrollment's `wp-config.php`. No content printed or copied | PASS |

### Release 9 build, final LOCAL regression (12 Oct)

| Suite | Result | Status |
|---|---|---|
| Pages, blogs, permissions, security (`structured-acceptance.mjs`) | 56/56, including a new check that the test blog's Enrollment copy is deleted | PASS (LOCAL) |
| Site chrome / homepage / more content / courses | 18/18, 14/14, 15/15, 12/12 (courses on rerun) | PASS (LOCAL) |
| `tools/verify-content-api-live.mjs` | 16/16 | PASS (LOCAL) |
| `tools/verify-wordpress-live.mjs` | 15/15 (Main only, Enrollment only, Both, edit to both, cleanup in both trash cans, Elementor home still served) | PASS (LOCAL) |
| Unit / PHP / PHP lint / TypeScript / ESLint / build | 197/197, 242/242, 0, 0, 0 errors, compiled | PASS |

### Automated (main branch, commit `45d78b9`)

| Suite | Result | Status |
|---|---|---|
| Node unit tests (`npm run test:unit`) | 194 pass, 0 fail (content API 29 tests, page privacy 9, draft address change 4, menu grouping 2, navigation defaults 2, …) | PASS |
| PHP plugin tests | 242 pass, 0 fail, including a rendering test of every field of every Main Website type | PASS |
| PHP lint | 26 files, 0 errors | PASS |
| TypeScript, ESLint | 0 errors (10 old ESLint warnings) | PASS |
| Production build (integration off) | compiled, Next.js 15.5.27 | PASS |

### LOCAL browser acceptance (real WordPress admin, local Main build on local Supabase), final run

| Suite | Checks | Status |
|---|---|---|
| Pages, blogs, permissions, security (`structured-acceptance.mjs`) | 55/55 | PASS |
| Header, footer, menus, site labels (`site-chrome-acceptance.mjs`) | 18/18. The homepage after copying the menu links differs in 0.003–0.049 % of pixels (threshold 0.1 %); untouched rgba colours keep their values | PASS |
| Homepage (`homepage-acceptance.mjs`) | 14/14. After copying the 8 lists: 0.000–0.018 % of pixels differ. An FAQ edit shows and **Restore** brings it back; hiding a list restores the built-in one | PASS |
| Courses (`courses-acceptance.mjs`) | 12/12. Course page with curriculum and skills; "Live list: courses"; restore; course sections; hiding | PASS |
| City and service pages, SEO overrides, media (`more-content-acceptance.mjs`) | 15/15. City page with a feature and a section at the top; an address clash with a page is refused; the override changes and restores the title; upload, public URL, "Main library" picker | PASS |
| **Total** | **114/114** | **PASS (LOCAL)** |

In headless Chromium, some steps used the DOM-event fallback instead of a real click (counts in each run's `results-*.json`). Those steps prove what the screens do, not that each button is visibly clickable.

### Defects found and fixed by these tests

| Defect | Where | Effect before the fix |
|---|---|---|
| Menu rows grouped into shared arrays | Main `lib/siteCmsServer.js` (live code, latent) | Each page view appended the rows again: links multiplied and deleted links kept showing until a restart |
| City page feature cards passed as `features`, read as `cards` | Main `CityPageRenderer` | Feature cards never appeared on city pages |
| Discarding a draft copy deleted the live page's SEO override; renaming a draft copy redirected the live page early | Main `/admin` page routes (live) | The live page lost its SEO, or redirected to an unpublished address |
| Empty colour fields saved as black; rgba colours refused | Plugin | Saving an untouched header or footer would have changed its colours |
| A `%` in a colour pattern inside `printf` | Plugin | Every screen with a colour field crashed partway (PHP fatal error) |
| Empty values of required columns sent as null | Content API | Saving a course (or a menu link with "Opens in: default") failed |
| The first change of existing content had no earlier version | Plugin | "Restore" could not undo the first change |
| Section types list out of step with the renderer | Content API | Live-list sections (courses, tools…) could not be added; two listed types did not exist |
| Course section created without its course | Content API | An orphan record |
| A published page marked noindex (by its own flag or by an SEO override), or a noindex blog, was still listed in `sitemap.xml`. Found by the PRODUCTION draft test on 12 Oct. No live page or blog is noindex today, so no live URL is affected yet. Fixed locally in `lib/publicSitemap.js` (not deployed) | Main sitemap (live code, latent) | The sitemap would invite search engines to pages that tell them not to index |
| The rich-text editor was wrapped in a `<label>` on four Main `/admin` fields: popup content, and the city builder's hero description, about description and FAQ answer. A click inside a label also clicks its first button, here **Bold**. Found by the LOCAL editor smoke test after the dependency upgrade (12 Oct). Fixed locally: the wrappers are `<div>`s, and a regression test checks every screen (not deployed) | Main `/admin` (live code) | Each click into the text toggled bold and the first letter typed was lost |

## 11 October 2026: Main Website screens (hybrid structured editing, plugin 0.5.0)

### Automated

| Suite | Passed | Failed | Status |
|---|---|---|---|
| PHP plugin tests (`php tests/php/run.php`, PHP 8.2) | 228 (209 + 19 new: Main Website permissions, ownership, statuses, preview signature) | 0 | PASS |
| PHP lint (every WordPress, test and harness PHP file) | 26 files | 0 | PASS |
| Node unit tests (`npm run test:unit`) | 158 (148 + 10 new: content API) | 0 | PASS |
| TypeScript (`npx tsc --noEmit`) | 0 errors | — | PASS |
| ESLint (`npx next lint`) | 0 errors | warnings only, all pre-existing | PASS |
| Production build, integration off (`npx next build`) | compiled | — | PASS |

### LOCAL non-technical admin acceptance (`tests/wordpress/structured-acceptance.mjs`, run `202610110809`)

Real WordPress admin in a browser (Docker WordPress, plugin 0.5.0 source), local Main build, local Supabase holding a copy of a production page (12 sections), a production blog (75 blocks) and a production tool. Evidence: `evidence/local-structured/`.

| Group | Checks | Status |
|---|---|---|
| A Find the Main Website screens (mouse and keyboard), tabs, existing page | 4/4 | PASS |
| B Change a live page through a private copy, preview at 1280/820/390 px, publish, restore | 13/13. The live page answered 200, unchanged, while the draft existed. Restored page: **0.000 %** pixels differ (desktop 1440×6134, mobile 390×9691). An unchanged save: 0.000 % | PASS |
| D/E Blog to Main / Enrollment / Both, edit, versions and restore (H1, H2), trash and restore | 10/10 | PASS |
| E Tool show/hide; new page with three sections, design settings, publish, unpublish | 10/10 | PASS |
| I Address already used | 1/1 | PASS |
| H Permissions and security (Author, Contributor, forged status, preview tampering, unsigned, replay) | 11/11 | PASS |
| J Routes and Activity log | 5/5 | PASS |
| Z Cleanup | all test records removed, addresses 404 | PASS |
| **Total** | **55/55** | **PASS (LOCAL)** |

Note: headless Chromium on this machine stops painting wp-admin. In **43** steps a normal click did not happen within 4 s, and the test sent the same DOM event instead. Those steps prove what the screens do, but not that each button is visibly clickable. The run counts them in `results-202610110809.json` (`click_fallbacks`).

### Defects found and fixed during these runs

| Defect | Where | Effect before the fix |
|---|---|---|
| A live page's private draft copy made the **live page answer 404** (the privacy lookup took the first row with that address) | Main `src/middleware.js` (**in the live build `d48492b`**) | Any "start draft" on a live page (Main `/admin` too) could take the page offline until published. Fixed; not deployed |
| A page's draft could not be published ("address already used" by its own live page) | `lib/wordpress/contentApi.js` | Fixed before release |
| Sections with no design settings could not be saved (PHP sends `{}` as `[]`) | plugin and API | Fixed before release |
| Restoring an earlier blog version did not bring back the article (versions held only the fields sent) | plugin | Fixed: versions hold the whole record |
| An Author could edit or publish **any** Main blog | plugin | Fixed: Authors only their own, like WordPress posts |
| A refused screen answered 200 (the refusal ran after the page had started) | plugin | Fixed: real 403 before any output |
| Testimonials could not be saved (no `updated_at` column on Main) | `lib/wordpress/contentApi.js` | Fixed before release |

### PRODUCTION

Not run. The plugin 0.5.0 is not installed, the Main changes are not deployed, and the connection is off. This needs the owner's steps in `CLIENT-HANDOVER.md`. Every production row below remains as it was.

## Automated (plugin 0.4.1, commit `6e9f637`)

| Suite | Command | Passed | Failed | Skipped | Status |
|---|---|---|---|---|---|
| PHP plugin tests | `php tests/php/run.php` (PHP 8.1.29) | 209 | 0 | 0 | PASS |
| PHP lint | `php -l` on every WordPress, test and harness PHP file | 25 files | 0 | — | PASS |
| Node unit tests | `npm run test:unit` | 148 | 0 | 0 | PASS |
| TypeScript | `npx tsc --noEmit` | 0 errors | — | — | PASS (last run after `d11830b`; Main code unchanged since) |
| ESLint | `npx next lint` | 0 errors | — | 10 pre-existing warnings | PASS |
| Production build | `npx next build` (integration off) | compiled | — | — | PASS (same note as TypeScript) |
| Plugin package | `node tools/build-cms-plugin.mjs` | 0.4.1: 21 files byte-identical to `6e9f637`; reproducible | — | — | PASS |

## LOCAL end-to-end (`tests/wordpress`)

| Scenario | Checks | Plugin | Status |
|---|---|---|---|
| L Lifecycle: `.htaccess` untouched, recurring jobs removed and restored, API namespace, version table, optional features off | 8/8 | 0.4.1 | PASS |
| A Main only: draft not public, redesign previewed as on Main, published to Main with colour and layout, 404 on Enrollment, in Main's sitemap | 8/8 | 0.4.0 | PASS |
| B Enrollment only | 3/3 | 0.4.0 | PASS |
| C Both, a change on both, then Main only (removed from Enrollment) | 6/6 | 0.4.0 | PASS |
| D Global colour reaches Main and Enrollment; a page's own settings kept | 3/3 | 0.4.0 | PASS |
| E City → area, area page preview and publish, address change with a 301 | 6/6 | 0.4.0 | PASS |
| F Rollback restores text **and** design; the next update replaces it | 5/5 | 0.4.0 | PASS |
| H Failed render keeps the live version; retry recovers | 5/5 | 0.4.0 | PASS |
| Preview button, as administrator in a browser | 8/9; the 9th was a test-script defect (confirmed visible by a direct check in the frame) | 0.4.0 | PASS |
| Affected-pages list on the dashboard, Website Design and header template screens | 3/3 (80, 68 and 80 pages listed, no PHP errors) | 0.4.1 | PASS |
| Responsive settings in the Main render (mobile size, tablet visibility) | 3/3 | 0.4.0 | PASS |
| WordPress stopped: Main routes and a published WordPress page still served | 7/7 | 0.4.0 | PASS |
| API smoke with secret (signed, expired, wrong path, unsigned, wrong secret) | 18/18 | 0.4.0 | PASS |
| Supabase migrations on a throwaway Postgres shaped like production, each run twice | all checks | — | PASS |

The changes from 0.4.0 to 0.4.1 are admin display only (the affected-pages list). Scenarios A–H were run on 0.4.0; L and the affected-pages check on 0.4.1.

## PRODUCTION

| Test | Method | Result | Status |
|---|---|---|---|
| Plugin installed is the verified package | Hashes of the two publicly served text files vs the 0.4.0 package | Identical | PASS |
| Plugin API and refusals | `cms-api-smoke.mjs`, 14:52 and 15:05 UTC | 13/13; unsigned, malformed and wrong-secret requests answer HTTP 401 | PASS |
| Signed API with the production secret | `cms-api-smoke.mjs` with the secret | No secret configured | BLOCKED |
| Live websites | `verify-production.mjs`, 14:52 UTC | 28 pass, 8 fail. Main: 1 (test tool page; fix not deployed). Enrollment: 7, all pre-existing | PARTIAL |
| A Inventory in the central admin | — | Import not run (backup, WordPress login and approval needed). Read-only inventory and dry run done instead | BLOCKED |
| B Create page in the admin | — | No working WordPress admin login | BLOCKED |
| C Publish to Main | — | No login; no secret; integration off | BLOCKED |
| D Edit an existing page | — | As C, plus approval of the page | BLOCKED |
| E Blog CRUD | — | As C | BLOCKED |
| F Other types | — | As C | BLOCKED |
| G Destination isolation | — | As C | BLOCKED |
| H Revision and rollback | — | As C | BLOCKED |
| I Shared styles and templates | — | As C, plus an agreed window | BLOCKED |
| J Scheduling | — | As C, plus the server cron | BLOCKED (not tested at any level) |
| K Forms and enquiries | Route list | Enquiry route registered; no submission (needs approval) | PARTIAL |
| L Regression | `verify-production.mjs` | No worse than before the install; one check improved (Enrollment sitemap index answers again) | PASS |

**Totals:**
- Automated: 357 tests passed and 0 failed (209 PHP + 148 Node).
- LOCAL: the scenario suite passed 44/44, and the extra checks listed above passed 39 of 40 (the one failure was the test-script defect noted on the preview row).
- PRODUCTION:
  - PASS: plugin package, API refusals, regression;
  - PARTIAL: live websites (because of known issues), enquiry route only;
  - BLOCKED: 10 tests (the signed API with the secret, and A–J).

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
| Draft copy of a live page created through Main `/admin`, live page stays 200 | Main admin login refused ("Invalid email or password"), stopped after 2 tries | BLOCKED |
| Plugin 0.6.0 installed; content API enabled; acceptance on production | No WordPress login, migration not applied, no backup confirmed | BLOCKED |

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

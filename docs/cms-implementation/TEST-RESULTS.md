# Test results — 10 October 2026, updated 14 October 2026

The statuses used are PASS, PARTIAL, FAIL, BLOCKED and NOT TESTED. The level (Automated, LOCAL, PRODUCTION) is stated on every row.

## 14 October 2026: popup investigation, converter and importer defects, production audits, rehearsals #5–#7

All LOCAL unless marked PRODUCTION (read-only). Nothing was deployed, published or changed on production.

**Production, read-only:**

| Check | Result | Evidence |
|---|---|---|
| Main addresses (sitemap) | 314/314: status 200, canonical, not noindex, visible text. 6 needed a second read after a connection error or browser timeout | `evidence/route-audit/prod-visible-*.json` |
| Main internal links | 314 pages, 138 distinct targets, **0 broken**, 0 redirects | `evidence/route-audit/prod-links-20261013.json` |
| Enrollment internal links | 59 pages, 44 distinct targets: **1 broken** (`/?page_id=6342`, an unpublished page linked from a carousel on 4 pages including the homepage: O-42) | `evidence/route-audit/enroll-links-20261014.json` |
| Doubled "\| Acadvizen" titles | 0 of 314 | same as above |
| Elementor Pro on Enrollment | Active: the public homepage loads Pro 4.3.0 files, `hasPopUps: true`; owner confirmed on the Plugins screen | O-31 |
| `acadvizen/v1/enquiry` | Registered (POST) on production; nothing was submitted | `GET /wp-json/acadvizen/v1` |

**Popup `blocked_widgets` (O-31):** the tests use the local WordPress, which has no Elementor Pro, so the refusal was correct there. Detection hardened (Pro loaded and its popup type registered). With Pro: **not verified** (no staging; P2/P6).

**Defects found and fixed today:**

| Defect | Found by | Fix | Verified |
|---|---|---|---|
| Popup check trusted the Pro constant only | Investigation | `popup_blocker()` | PHP +3 |
| Robots from Main not copied (Rank Math defaults added) | Rehearsal #4 comparison | `robots_meta_from()` | PHP +3; rehearsal #7 |
| Homepage blog cards lost their text | Rehearsal #4 | Grid found by its link-wrapped post cards; homepage has its own card design and date format | Unit +6; rehearsal #7 (loop → homepage card #2099) |
| FAQ answers (`<details>`) shown open | Rehearsal #4 | Converted to a collapsed accordion | `/seo-course-in-bangalore`: 5 items, all closed |
| Header/footer captured from a page already served by WordPress | Rehearsal #4 | Captures read Main's own page (`?acv-main=1`); WordPress-only addresses skipped | Rehearsal #6/#7: header, footer and 6 other designs captured |
| A card used inside another design could never be verified | Rehearsal #5 | Verified on a page that draws it | Rehearsal #6/#7: 91/91 and 92/92 verified, tool card included |
| Importer wrote unresolvable card references as `template="0"` | Rehearsal #5 | Dependency order; existing designs resolved; `PROBLEM` reported | PHP +4; rehearsal #6/#7 references all resolved |
| Script-rewritten description captured instead of the server's | Rehearsal #6 | Server HTML preferred | Unit +1; rehearsal #7 descriptions identical |
| WordPress content on Main titled and indexed with Enrollment's pattern | Rehearsal #6 | Main defaults "Title \| Acadvizen" and "index, follow" when the page has no SEO settings of its own | PHP +3; `/elementor-bridge-proof` on local Main, before/after |
| Comparison tooling: browser timeouts recorded as empty pages; baseline not Main's own; line breaks and browser-only H1s counted as differences | Rehearsals #5/#6 | `text_unread` + "readable" check; `--main-own`; layout-tolerant text; H1 rule | Unit +5 |

**Course Modules (O-41):** the homepage section, hidden since 23 March, is shown again in code. Desktop and phone screenshots are kept locally: 5 modules, one column on phone. The five course landing pages on production have no such section (owner decision).

**Site-wide rehearsals (local copy, 103 addresses):**

| Run | Imported / waiting | Published | Verified | After publishing vs Main's own pages | Recovery (database restore) |
|---|---|---|---|---|---|
| #5 | 91 waiting, popup refused | 91 | 90 + 1 never verifiable (tool card: defect O-38) | baseline was not Main's own (O-40) | 102/103 (animated counter) |
| #6 | 91 waiting, popup refused | 91 | **91/91** | 87/103 identical (rules final); differences classified | **102/103** (measured by #7's baseline; #6's own after-restore read was cut off when my chain script restarted Main) |
| #7 | **92 waiting** (84 records + 8 designs), popup refused | **92** | **92/92** | **86/103** identical; 17 classified in `MAIN-ROUTE-CHECKLIST.md`: 9 WordPress-only pages, 5 "Play Video" (accepted), 1 fixed after the run, 1 unread after standby, 1 local test record | content identical on all 103 addresses; robots/title changed only by a plugin fix applied mid-run. Isolated restore: see below |

After rehearsal #7's verification, the designed site-wide redraw ran (a new header or footer redraws every Main page): 50 draws and 50 Main notifications, no failures, stalls or re-queues.

**Isolated backup and restore (14 Oct 05:55–06:02 UTC, `evidence/restore-rehearsal-20261014/`):**
- **Backup** of the local WordPress: database, 35.8 MB; all of `wp-content`, 432 MB, 8,940 files. SHA-256 verified before and after the restore.
- **Restored** into a separate stack (port 8089, its own volumes, Main address pointing nowhere):

  | Check | Result |
  |---|---|
  | Table row counts | Identical in 21/21 tables (6,966 rows) |
  | WordPress core | Verifies against its checksums |
  | Plugins | Identical (17) |
  | Users | 6/6 |
  | Administrator sign-in | Dashboard opens |
  | Media | 36/36 answer 200 |
  | Public pages | **87/87 identical** (status, title, canonical, robots, visible text) |
  | Plugin REST namespaces | Present |

  The isolated stack was removed afterwards; the backup is kept.

**Full suite on the final working tree** (14 Oct 06:02–06:59 UTC, `evidence/final-run/final-20261014/summary.txt`). Every step exited 0; nothing was skipped.

| Suite | Result |
|---|---|
| Unit (`node --test tests/unit/*.test.js`) | 273/273 |
| Types (`npx tsc --noEmit`) | 0 errors |
| Lint (`npx next lint`) | 0 errors, 10 warnings (existing) |
| PHP (`php tests/php/run.php`) | 319/319 |
| `php -l` | 23 files clean |
| Secret scan | Tracked files clean. Untracked and modified files: 0 matches (separate scan) |
| `npm audit --omit=dev` | 0 vulnerabilities |
| Production-equivalent build | Compiled (content API on, bridge off) |
| Image optimiser | 200, AVIF |
| Main `/admin` sign-in and notifications | 6/6 |
| Structured / site chrome / homepage / courses / more content | 56 / 18 / 14 / 12 / 15 |
| Permissions / scheduling | 9 / 7 |
| Both-failure / with Main stopped | 12 / 3 |
| Conflicts / blog sync / redirects | 9 / 18 / 11 |
| Blogs / pages / signed content API (live-workflow tools against the local stack) | 16 / 17 / 16 |
| Render Bridge build | Compiled |
| Bridge scenarios (Main, Enrollment, Both, destination changes, fallback) | 44/44 |
| Approval (exact revision, previews per website, verification, blocked widgets and popups, rollback, audit) | 47/47 |
| Reliability (Enrollment or both failing, retry of the failed website only, replay without duplicates, scheduling recovery) | 38/38 |
| Migration (`/soft-skills` moved to Elementor and back) | 13/13 |

All LOCAL. Staging and production runs of these suites wait for OWNER-ACTIONS P2–P5.

## 13 October 2026, 14:00–18:10 UTC: unified WordPress + Elementor (Option B): gaps closed, site-wide migration, final regression

**Final ordered run** (`evidence/final-run/final5/summary.txt`, exit codes captured first) plus individual reruns of three suites (`evidence/final-run/rerun6/`). All LOCAL; all exit 0.

| Suite | Result |
|---|---|
| Unit | 261/261 |
| Types | 0 errors |
| Lint | 0 errors, 10 warnings |
| PHP | 306/306 |
| `php -l` | 23 files clean |
| Secret scan | clean |
| `npm audit` | 0 vulnerabilities |
| Both builds | compiled |
| Main `/admin` | 6/6 |
| Structured | 56/56 |
| Site chrome | 18 |
| Homepage | 14 |
| Courses | 12 |
| More content | 15 |
| Permissions | 9 |
| Scheduling | 7 |
| Both-failure | 12, and 3 with Main stopped |
| Conflicts | 9 |
| Blog sync | 18 |
| Redirects | 11 |
| Blogs / pages / signed API | 16 / 17 / 16 |
| Bridge scenarios | 44/44 |
| **Approval** | **47/47** (rerun) |
| **Reliability** | **38/38** (rerun) |
| **Migration** | **13/13** (rerun) |

**Why three suites were rerun:**
- The first approval run failed A14: its test page had no design, and the new empty-design rule correctly refused it. Test fixed.
- The reliability run was disrupted: my concurrent reproduction switched approval off mid-run (7/11). Invalid; rerun alone.
- Migration Z expected the import to create templates that are now correctly left out. Test fixed.

**Site-wide migration of the local Main copy** (`evidence/sitewide-migration/`):
- **The run:** all 103 local Main addresses were converted with `tools/main-to-elementor`, imported under approval and approved by a reviewer with each website's preview confirmed. 87 items were published, and 86 verified.
- **The one item not verified:** a popup. It needs Elementor Pro, which isn't installed locally; that is now blocked at approval.
- **Compared address by address** with `tools/main-migration-compare.mjs`:
  - while waiting for approval: 103/103 identical;
  - after publishing: stays-Main addresses identical;
  - differences on migrated pages listed in `MAIN-ROUTE-CHECKLIST.md`: titles, robots, and sections shown only after a click.
- **Recovery:** the local database was restored three times from a checksummed backup; each time all 103 addresses came back identical. Main's 300-second cache delays this; see the release document.

**Production (read-only):** 314 Main addresses inventoried (`evidence/route-inventory/`), all 200, all with a canonical address and JSON-LD; 22 with forms. Nothing was deployed or changed.

**Defects found and fixed in this phase:**

| Defect | Found by | Fix |
|---|---|---|
| SEO edits after approval did not cancel it | Review against the brief | SEO fields are part of the revision fingerprint (R6, PHP) |
| Main navigation (menus) could be changed without a reviewer | Review | Main menus reviewer-only on every route (R7) |
| "Make live" of an earlier Main version needed only edit rights | Review | Reviewer-only under approval (R8) |
| Approval did not require checking each website's preview | Brief (Both) | Required per chosen website (A5, PHP) |
| "Check again" waited out automatic retry delays | R2 | Redraws immediately unless already published |
| Importer created a second page at an address an earlier page already served | Site-wide run | Adopts that page; plus the `main_address_in_use` rule |
| Converter emitted empty designs, and the importer published them over the working header and footer | Site-wide run | Converter leaves them out; importer refuses them; approval blocks empty designs |
| Converter migrated application routes the plan keeps on Main | Site-wide run | Kept unless `--include-app-routes` is given |
| Sections shown only after a click were dropped silently | Site-wide run | Listed in the converter notes (exactly the missing ones) |
| Templates could never verify (they have no page of their own) | Site-wide run | Revision marks printed where they are drawn; checked on a page that uses them |
| A popup submitted before its display conditions were set | Site-wide run | Resubmitted when the conditions are set |
| Popups approvable without Elementor Pro | Site-wide run | Blocked with the reason |
| Undo import left the working copies it created | Earlier run | Tagged and removed |
| Comparison tool: streamed `<title>` and `&#039;` | Its own self-checks | Fixed; unit tests |

## 13 October 2026, 11:13–12:53 UTC: plugin 0.7.0 final (Elementor + approval), final ordered regression

**Scope:** the complete working tree. Main release 11 includes the address fallback for just-removed pages. Plugin 0.7.0 includes approval, scheduling, retry, the registry, the importer under approval and the template fixes.

**Commands:**
- run script: `final-run4.sh`, with the exit code captured first on every line;
- summary: `evidence/final-run/final4/final-run4-summary.txt`;
- per-suite logs: `evidence/final-run/final4/`;
- reruns after late changes: `evidence/final-run/rerun5/`.

**LOCAL results** (local WordPress 7.0 with Elementor 4.3.3, local Main production build, local Supabase):

| # | Suite | Command | Result | Exit |
|---|---|---|---|---|
| 1 | Unit | `node --test tests/unit/*.test.js` | 258/258 | 0 |
| 1 | Types | `npx tsc --noEmit -p .` | 0 errors | 0 |
| 1 | Lint | `npx next lint` | 0 errors, 10 warnings | 0 |
| 1 | Secret guard | `node tools/check-secrets.mjs --all` | none found | 0 |
| 1 | Dependencies | `npm audit --omit=dev` | 0 vulnerabilities | 0 |
| 2 | PHP (plugin) | `php tests/php/run.php` | 302/302 (rerun after the last plugin change) | 0 |
| 2 | PHP syntax | `php -l` on every plugin file | 23 files, 0 errors (rerun) | 0 |
| 3 | Build, production-equivalent (bridge off) | `npx next build` | compiled (twice) | 0 |
| 3 | Build, Render Bridge on | `npx next build` | compiled | 0 |
| 4 | Main `/admin` sign-in and notifications | `newkey-admin-check.mjs` | 6/6 | 0 |
| 5 | Structured content (pages, blogs, roles, preview, security) | `tests/wordpress/structured-acceptance.mjs` | 56/56 (rerun; first run 55/56, harness defect below) | 0 |
| 5 | Site chrome (header, footer, menus, labels) | `site-chrome-acceptance.mjs` | 18/18 | 0 |
| 5 | Homepage | `homepage-acceptance.mjs` | 14/14 | 0 |
| 5 | Courses | `courses-acceptance.mjs` | 12/12 | 0 |
| 5 | City/service pages, SEO overrides, media | `more-content-acceptance.mjs` | 15/15 | 0 |
| 5 | Permissions (Author, Contributor) | `permissions-acceptance.mjs` | 9/9 | 0 |
| 5 | Scheduling (structured) | `scheduling-acceptance.mjs` | 7/7 | 0 |
| 5 | Edit conflicts | `conflict-acceptance.mjs` | 9/9 | 0 |
| 5 | Blog sync, both directions | `blog-sync-acceptance.mjs` | 18/18 | 0 |
| 5 | Redirects | `redirects-acceptance.mjs` | 11/11 (rerun; first run stopped at sign-in, below) | 0 |
| 6 | Both: partial failure | `both-failure-acceptance.mjs` | 12/12, and 3/3 with Main stopped | 0 |
| 6 | Blog targets, page workflow, signed API | `tools/verify-wordpress-live.mjs`, `verify-wordpress-pages-live.mjs`, `verify-content-api-live.mjs` (LOCAL) | 16/16, 17/17, 16/16 | 0 |
| 7 | Render Bridge scenarios (Main only, Enrollment only, Both, rollback, city pages, failure, global redesign, lifecycle) | `scenarios.mjs` | 44/44 (rerun; first run 43/44 and wrongly exited 0, below) | 0 |
| 8 | Approval with the real Elementor editor | `approval-acceptance.mjs` | 46/46 (rerun; first run 45/46, below) | 0 |
| 8 | Reliability under approval (Enrollment failing, both failing, replay, scheduling, approval off) | `approval-reliability-acceptance.mjs` | 29/29 | 0 |
| 9 | Migration of a real Main page into Elementor and back | `migration-acceptance.mjs` (bundle from `build-bundle.mjs --paths /soft-skills`) | 13/13 | 0 |

**Responsive:** on both websites, layout and font sizes were checked at 1440, 820 and 390 px (A8). The migrated page had no sideways scrolling at 390 px (M4). Screenshots: `evidence/approval/`, `evidence/migration/`.

**PRODUCTION (read-only, 13 Oct 11:10–11:20 UTC):**
- `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` Ready;
- bridge manifest 404 (Render Bridge off);
- content API refuses unsigned requests;
- plugin 0.6.1.

No production write, test content, deploy or install was made.

**Defects found and fixed in this phase:**

| Defect | Found by | Fix |
|---|---|---|
| Elementor kept serving the old design after a new revision was applied (stale element cache) | A8 | `apply_revision` clears the element cache and page assets |
| Enrollment verification could not reach WordPress behind a loopback address | A8 | Same Host header as the render loopback, no off-site redirects |
| The importer bypassed approval: it published records and overwrote live pages | Review | Under approval, new records are submitted and live ones go to working copies (A15) |
| Working copies and archives carried the importer's source key; a re-import could trash them as duplicates | Review | Source and batch keys are no longer copied (A15) |
| Ticking "Main homepage" on a draft or working copy took the flag from the live homepage at once | Review | The flag moves only when that page is published (A14) |
| A page's own copies counted as "another page" using its Main address | Review | Excluded (A15) |
| "Check again" did not retry a failed drawing | Review | It retries failed websites (A9, R1, R2) |
| Re-importing unchanged content reset an existing approval | Review | Submit keeps an approval for the same revision (PHP) |
| Scheduled publishing was not supported under approval | Prompt review | Implemented: scheduled, re-checked when due, Cancel schedule, lost jobs restored (R4, PHP) |
| Element styles that need Elementor Pro were dropped without a word when Pro is absent | M2 | The report states "NOT SHOWN, Elementor Pro is not active" (PHP, M2) |
| Header/footer templates (`elementor-hf`) were missed by archive lookups and by Undo import ("any" post type) | Migration run | Explicit type lists. Undo also removes the working copies an import made (M Z) |
| After unpublishing a "replace" page, Main answered **404** at that address for up to 30 s | M5 | `/wp-render` sends the visitor once to Main's own page (unit tests, M5) |
| Harness: one hung request stalled a suite for 28 min; no request deadlines | Scheduling run | 60–120 s deadlines on every request in the kit; login wait 120 s |
| Harness: `scenarios.mjs` exited 0 with a failed check; its wait helper never re-checked after a long round of jobs | Final run | `process.exitCode`, plus a final re-check |
| Harness: B1 read any `.notice-info` (Rank Math's notice also matched once Rank Math was set up locally) | Final run | Looks for its own notice text |

**Environment notes:**
- Local Rank Math was unregistered, so it produced no titles. Its registration was skipped locally, as the setup wizard does. Production's Rank Math was already active.
- The local stack restarted with the PC during the phase (Docker restarted); it was brought back and re-verified.

## 13 October 2026, 00:00–05:05 UTC: release 11, plugin 0.6.2 (local), final regression

All results with real exit codes are in `FINAL-ACCEPTANCE-TESTS.md` §E and `evidence/final-run/final-run-20261013.txt`.

**PRODUCTION (read-only):**
- 314/314 Main URLs identical to the pre-Release-10 snapshot;
- 60/60 Enrollment pages identical to both baselines;
- plugin public files identical to the 0.6.1 package;
- Test connection Connected;
- signed API negatives correct;
- bundle scan clean.

**LOCAL:**

| Area | Result |
|---|---|
| Unit | 243/243 |
| PHP | 258/258 |
| TypeScript, ESLint, `php -l`, secret guard, `npm audit` | clean (`npm audit` 0) |
| Production-equivalent build | compiled |
| WordPress suites on plugin 0.6.2 | structured 56, site chrome 18, homepage 14, courses 12, more-content 15, permissions 9, scheduling 7, Both-failure 12 (+3 with Main stopped), blog targets 16, page workflow 17, signed API 16 |
| New-style Supabase keys only | every suite passes (`evidence/newkeys-local/`) |
| Update rehearsal (WordPress 7.1.3 + 10 plugin updates) | clean, rollback identical (`evidence/o6-update-rehearsal/`) |
| Performance model | tool pages 6.2 → 1.9 s (`evidence/o4-performance/`) |

**Defects found and fixed:**
- Supabase key picker could accept a malformed key (`03d18dc`).
- Sequential menu queries (`df30076`) and repeated CMS lookup fallbacks (`436a822`).
- "Both" partial failure shown as success, and raw cURL errors (plugin 0.6.2, uncommitted).
- Five suites exiting 0 on failure, and the run script's exit codes (uncommitted).

## 13 October 2026 (IST): final regression and handover run (12 Oct 19:33–19:50 UTC)

Live during the run: deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` with plugin 0.6.1. No content was created on production. The production admin acceptance from 12 Oct (R10-x below) was reused, because the deployment and plugin are unchanged since then.

| ID | Level | Check | Result | Status |
|---|---|---|---|---|
| F-1 | PRODUCTION | 314 Main sitemap URLs vs the pre-Release-10 snapshot | 314 identical, 0 different | PASS |
| F-2 | PRODUCTION | Published Enrollment pages and posts vs the first baseline and vs the post-Release-10 capture | 60/60 identical, against both | PASS |
| F-3 | PRODUCTION | Content API: unsigned / wrong secret / stale / wrong purpose / unknown entity / signed read-only list | 401 / 401 / 401 / 400 / 400 / 200 | PASS |
| F-4 | PRODUCTION | Slug check: free / existing `/blog` / `/a/../b` | no conflict / "reserved" / 400 | PASS |
| F-5 | PRODUCTION | Preview framing; Render Bridge manifest; plugin `/manifest` unsigned; enquiry route | Enrollment origin on the preview route only, `'none'` elsewhere; 404; 401; POST registered (none sent) | PASS |
| F-6 | PRODUCTION | `/admin-login` 200; `/admin` signed out = noindex shell without data; notifications API signed out → 401 | As stated | PASS |
| F-7 | PRODUCTION | Public JavaScript: 30 chunks from 6 pages vs private values and patterns; source maps | 0 findings; `.map` 404 | PASS |
| F-8 | PRODUCTION | WordPress Settings → Test connection (saved integration session) | "Connected. The Main Website accepted a signed request." (19:46) | PASS |
| F-9 | PRODUCTION | Plugin provenance: the publicly served plugin files vs package `dd6fcf27…` | 4/4 byte-identical; plugin source unchanged since `2cc2148` | PASS |
| F-10 | PRODUCTION | TTFB, 3 runs each (19:45) | Main `/` 1.67–1.94 s, `/blog` 1.16–1.54 s, a course page 1.58–1.73 s, all cache MISS via `bom1::iad1`. Enrollment `/` 0.12–0.32 s (LiteSpeed hit) | Measured (O-4) |
| F-11 | Automated | Unit / TypeScript / ESLint / PHP / `php -l` / secret guard / audit | 214/214 / 0 / 0 errors, 10 warnings / 252/252 / 20 clean / clean / 2 high, pre-existing | PASS |
| F-12 | LOCAL | Structured 56/56; permissions 9/9; scheduling 7/7; blog tool 16/16; page tool 17/17 (0 fallbacks); API tool 16/16 | All pass | PASS (LOCAL) |
| F-13 | LOCAL | Production-equivalent build of the current tree | Compiled, exit 0 | PASS |

**Logs and evidence:**
- `evidence/final-run/fresh-run-20261012T1933.txt`;
- `evidence/local-structured/results-202610121933.json`.

**Commits created afterwards (local only, not pushed):** `f855e33` (release 11 key fallback + unit tests) and `8e27175` (acceptance tests).

## 12 October 2026 (evening): Release 10 live, plugin 0.6.1, production acceptance through the real WordPress admin

Raw run output: `evidence/production-r10/production-*-run-20261012.txt`. Screenshots: `evidence/production-r10/0*.jpg`.

| ID | Check (PRODUCTION unless stated) | Time (UTC) | Result | Status |
|---|---|---|---|---|
| R10-1 | Release gates: commit `80134d4` = tested tree; unit 210/210; secrets clean; Production variables correct; `WORDPRESS_CONTENT_ENABLED` absent; rollback deployment READY; 314/314 Main URLs 200 before | 16:01 | All met | PASS |
| R10-2 | Promote Preview `dpl_HRwdKQX…` → **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`** (`80134d4`) | 16:04 | READY; `www` and the apex domain both point to it | PASS |
| R10-3 | Main regression: every sitemap URL vs the pre-release snapshot | 16:07, 18:28 | 314/314 identical (status, title, description, robots, canonical) | PASS |
| R10-4 | Preview header | 16:08 | Preview route `frame-ancestors 'self' https://enroll.acadvizen.com`; `/`, `/about`, `/blog`, `/admin-login` `'none'` + `SAMEORIGIN` | PASS |
| R10-5 | API security (signed list 200; unsigned, wrong secret and stale 401); slug check (signed 200; unsigned and wrong secret 401; invalid path 400; `/about` reported as a reserved conflict); bridge manifest 404 | 16:08 | As expected; error bodies are codes only | PASS |
| R10-6 | WordPress Settings + **Test connection** (real button) | 16:10, 18:37 | "Connected. The Main Website accepted a signed request." Main URL set, shared secret Set, optional features off | PASS |
| R10-7 | Main Website → Pages in WordPress | 16:23 | 50 pages listed (about 22 s, as Enrollment is slow), 24 tabs, filter works | PASS |
| R10-8 | `verify-content-api-live.mjs` (signed API + Main-only API page + replay 409 + cleanup) | 16:34, 18:24 | 16/16, 16/16 | PASS |
| R10-9 | `verify-wordpress-pages-live.mjs`: the page workflow in the real admin | 16:35 (0.6.0), 18:20 (0.6.1) | 17/17, 17/17 (0 click fallbacks) | PASS |
| R10-10 | `verify-wordpress-live.mjs`: blogs Main only / Enrollment only / Both in the real admin, on plugin 0.6.0 | 16:40–18:06 | 14/15 in four runs: "Enrollment only" stayed 404. Diagnosis: the second POST in each run carried Status = draft (see R10-12) | FAIL → fixed |
| R10-11 | Direct reproduction: one save as "Enrollment only", and "Main only" followed by "Enrollment only" (labelled, cleaned) | 17:08, 17:11 | Copy `publish`, public 200 in about 10 s, Main 404; cleanup 404/404 | PASS |
| R10-12 | **Defect:** an "Enrollment only" blog showed Status "Draft" (the Main record), so the next save or a version restore unpublished its Enrollment copy | 18:05 | Fixed in plugin **0.6.1** (`2cc2148`); PHP 252/252 (10 new) | Fixed |
| R10-13 | Plugin 0.6.1 installed (hash re-checked; WordPress "0.6.0 → 0.6.1", "Plugin updated successfully") | 18:16 | Active; public readme 0.6.1; Enrollment home 200 | PASS |
| R10-14 | `verify-wordpress-live.mjs` on 0.6.1 | 18:17 | **16/16**: Main only, Enrollment only (one POST, copy `publish`, 200; **saving again keeps it live, shown as Published**), Both + edit to both, cleanup on both sites and both trashes, Elementor home 200 | PASS |
| R10-15 | Enrollment regression: 60 pages vs the baseline | 16:10, 18:28 | 60/60 identical; Site Health 0 critical; enquiry route (POST) registered; Course Enquiries, CF7, MetForm and Elementor active | PASS |
| R10-16 | Cleanup sweep | 18:30 | 0 test rows on Main (pages and blogs, list and trash); 0 Enrollment posts in any status including trash; not in the sitemap or the public post list | PASS |
| R10-17 | LOCAL, plugin 0.6.1 | 18:13 | Pages/blogs/permissions/security 56/56 (0 click fallbacks); blog tool 16/16 | PASS (LOCAL) |
| R10-18 | Author and Contributor permissions on production | — | No such accounts on production (creating users is a production change). LOCAL PASS | NOT TESTED (PRODUCTION) |
| R10-19 | Media upload, menus, header and footer, homepage lists, courses, city and service pages on production | — | Global, visitor-facing edits were not made on the live site. LOCAL PASS | NOT TESTED (PRODUCTION) |
| R10-20 | A Preview with WordPress and Supabase settings | — | No active non-production database; the staging WordPress runs plugin 0.3.0; production secrets must not go to Preview | BLOCKED |

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

# Final acceptance tests: Acadvizen Master Admin / headless CMS

**Last updated 13 October 2026.** Production checks ran against deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (commit `80134d4`) and plugin 0.6.1, which are unchanged since 12 Oct.

**Local results** are for the release-11 tree (`436a822` plus documents).

**Status labels:**
- `PASS — VERIFIED` (production)
- `PASS — VERIFIED IN STAGING ONLY` (none: no staging exists)
- `PASS — VERIFIED LOCALLY ONLY`
- `BLOCKED — EXTERNAL ACTION REQUIRED`
- `OWNER APPROVAL REQUIRED`
- `FAIL — FIX REQUIRED`

A local result is never counted as a production result.

**Production test content** was always labelled ("CMS PRODUCTION TEST …"), set to noindex, and removed through the admin's own Trash and Delete permanently. No new live test content was created on 12–13 Oct after Release 10's acceptance: that evidence remains valid because the deployment and plugin are unchanged.

## A. Content preservation (production, read-only)

| ID | Test | Result (UTC) | Status |
|---|---|---|---|
| AT-01 | All 314 Main sitemap URLs (status, title, description, robots, canonical) vs the snapshot taken before Release 10 | 314/314 identical: 298 in the capture of 12 Oct 23:46 – 13 Oct 00:29; 16 that timed out while this PC slept, re-compared at 02:55 | `PASS — VERIFIED` |
| AT-02 | 60 published Enrollment pages and posts (status, title, robots, canonical, Elementor markup) vs the first baseline (before any plugin change) and vs the post-Release-10 capture | 60/60 identical against both (12 Oct 23:45) | `PASS — VERIFIED` |
| AT-03 | Enrollment homepage | Duplicate block from revision 7941 (user ID 1), isolated precisely (`FINAL-OPEN-ISSUES.md` O-3). Not caused by the CMS | `OWNER APPROVAL REQUIRED` |
| AT-04 | Enquiry REST route | `acadvizen/v1/enquiry` POST registered (19:41); no enquiry sent | `PASS — VERIFIED` |
| AT-05 | Main `/admin-login`, home, robots, sitemap | 200 | `PASS — VERIFIED` |
| AT-06 | Render Bridge off | `/api/wordpress/bridge-manifest` 404; `WORDPRESS_CONTENT_ENABLED` absent in every Vercel environment (20:10) | `PASS — VERIFIED` |

## B. Connection and security (production)

| ID | Test | Result | Status |
|---|---|---|---|
| AT-10 | WordPress Settings → **Test connection** | "Connected. The Main Website accepted a signed request." (12 Oct 16:10, 18:37, 19:46) | `PASS — VERIFIED` |
| AT-11 | Content API: unsigned / wrong secret / stale / wrong purpose / unknown entity / signed read-only | 401 / 401 / 401 / 400 / 400 / 200 (19:41); with the reformatted credentials file 200 (21:1x) | `PASS — VERIFIED` |
| AT-12 | Replayed signed change | 409 `duplicate_request` (12 Oct run) | `PASS — VERIFIED` |
| AT-13 | Slug check: free / `/blog` / `/a/../b` | no conflict / "reserved" / 400 `invalid_path` | `PASS — VERIFIED` |
| AT-14 | Preview framing | Enrollment origin on the preview route only; `'none'` elsewhere | `PASS — VERIFIED` |
| AT-15 | Public JavaScript | 30 chunks from 6 pages: 0 private values or secret patterns; source maps 404 | `PASS — VERIFIED` |
| AT-16 | Plugin REST | `/manifest` unsigned 401; `/blogs` published only | `PASS — VERIFIED` |
| AT-17 | Main admin signed out | `/admin` = noindex shell without data; notifications GET/POST 401 | `PASS — VERIFIED` |
| AT-18 | Vercel variable scope | Production 10 names; Preview and Development only the two public `VITE_*` values | `PASS — VERIFIED` |
| AT-19 | Plugin provenance | 0.6.1 installed; 4 public files byte-identical to package `dd6fcf27…`; source unchanged since `2cc2148` | `PASS — VERIFIED` |

## C. Administrator workflows

| ID | Env | Test | Result | Status |
|---|---|---|---|---|
| AT-20 | PROD | Page workflow (17 steps: draft, private 404, sections, preview, publish, private copy, update, clash refused, unpublish, Trash, Delete permanently) | 17/17 on 0.6.0 and on 0.6.1 (12 Oct 16:35, 18:20) | `PASS — VERIFIED` |
| AT-21 | PROD | Blog **Main only** | Public on Main only, noindex | `PASS — VERIFIED` |
| AT-22 | PROD | Blog **Enrollment only** (one submission; re-save keeps it live) | As expected (0.6.1) | `PASS — VERIFIED` |
| AT-23 | PROD | Blog **Both**, including an edit | Public on both; the edit reaches both | `PASS — VERIFIED` |
| AT-24 | PROD | Main Website screen lists Main pages | 50 pages, filter works | `PASS — VERIFIED` |
| AT-25 | LOCAL | Pages, blogs, permissions, security suite | 56/56 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-26 | LOCAL | Header, footer, menus, site labels | 18/18 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-27 | LOCAL | Homepage lists, banner, call to action | 14/14 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-28 | LOCAL | City and service pages, SEO overrides, media upload and picker | 15/15 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-29 | LOCAL | Courses and course sections | 12/12 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-30 | STAGING | All of the above on a staging copy | No staging exists (O-5) | `BLOCKED — EXTERNAL ACTION REQUIRED` |

## D. Scheduling, roles, reliability, updates

| ID | Env | Test | Result | Status |
|---|---|---|---|---|
| AT-31 | LOCAL | Scheduled publish +3 min and removal +6 min through the admin | 7/7 (12 Oct, three runs) | `PASS — VERIFIED LOCALLY ONLY` |
| AT-32 | STAGING/PROD | Scheduling on a real site | Would publish test content on a timer; needs staging | `BLOCKED — EXTERNAL ACTION REQUIRED` |
| AT-33 | LOCAL | Author/Contributor against all 23 Main Website screens, Settings, media upload, plugin installer (direct requests) | 9/9: only Blogs opens; the rest refused (403) | `PASS — VERIFIED LOCALLY ONLY` |
| AT-34 | LOCAL | Role workflows (own articles, submit for review, forged status refused) | In AT-25 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-35 | PROD | Author/Contributor on production | No such accounts; creating users is a production change | `OWNER APPROVAL REQUIRED` |
| AT-36 | AUTO | Address rules (11 malformed forms, rename onto taken, reserved routes, clashes) | Content-API tests 31/31 | `PASS — VERIFIED LOCALLY ONLY` (logic); production slug check AT-13 |
| AT-37 | AUTO+PROD | Replay and duplicate delivery | Unit tests; AT-12 | `PASS — VERIFIED` |
| AT-38 | PROD | One POST per save, no double publish | Verified 12 Oct | `PASS — VERIFIED` |
| AT-39 | PROD | Revalidation after publish and update | Next request shows the change | `PASS — VERIFIED` |
| AT-40 | PROD | Cleanup of every test item | 0 test rows or posts left (12 Oct 18:30) | `PASS — VERIFIED` |
| AT-41 | PROD | Main rollback (Instant Rollback) | Targets Ready; exercise not authorised | `OWNER APPROVAL REQUIRED` |
| AT-42 | LOCAL | Main runs on the new Supabase key type only (`sb_publishable_`/`sb_secret_`, legacy unset) | Admin 6/6 and every WordPress suite (structured 56, chrome 18, homepage 14, courses 12, more 15, permissions 9, scheduling 7, blogs 16, pages 17, API 16) | `PASS — VERIFIED LOCALLY ONLY` (`evidence/newkeys-local/`) |
| AT-43 | LOCAL | WordPress 7.0.7 → 7.1.3 and 10 plugin updates on production versions (rehearsal) | 0 PHP errors after each of 3 groups; content identical; Connected; pages 17/17 and blogs 16/16 after updates; rollback identical to baseline | `PASS — VERIFIED LOCALLY ONLY` (`evidence/o6-update-rehearsal/`) |
| AT-44 | STAGING | Updates incl. Elementor Pro 4.3.1 and the Hostinger plugins on real content | Not available here | `BLOCKED — EXTERNAL ACTION REQUIRED` |
| AT-45 | LOCAL | Performance: database round trips per page (timing proxy, 200 ms per query) | Home 1035 → 581 ms; course pages ~970 → ~740 ms; tool page 6180 → 1916 ms | `PASS — VERIFIED LOCALLY ONLY` (`evidence/o4-performance/`) |

| AT-46 | LOCAL | **Both, one destination fails** (`tests/wordpress/both-failure-acceptance.mjs`): C0 Main unreachable, C1 Main refuses, C2 Enrollment copy fails, C3 retry | Plugin 0.6.1 code: C2 FAIL (partial failure in a green success box). Plugin 0.6.2: 12/12 + 3/3 (Main stopped) | `PASS — VERIFIED LOCALLY ONLY` (0.6.2, not installed) |

## E. Final run (LOCAL, 13 Oct 2026 UTC; real exit codes)

**Code under test:**
- Main = release-11 tree (`436a822`), production build with production switch settings (content API on, `WORDPRESS_CMS_API_URL` set, bridge off);
- WordPress 7.1.3 with the plugin from the working tree.

**Log:** `evidence/final-run/final-run-20261013.txt`.

| Command | Plugin | Exit | Result |
|---|---|---|---|
| `node --test tests/unit/*.test.js` | — | 0 | 243 tests, 243 pass |
| `npx tsc --noEmit -p .` | — | 0 | no errors |
| `npx next lint` | — | 0 | 0 errors, 10 pre-existing warnings |
| `php tests/php/run.php` (WordPress container) | 0.6.2 | 0 | 258/258 |
| `php -l` on every plugin file | 0.6.2 | 0 | 20 files, 0 errors |
| `node tools/check-secrets.mjs --all` | — | 0 | No secrets found |
| `npm audit --omit=dev` | — | 0 | 0 vulnerabilities |
| `npx next build` (production-equivalent) | — | 0 | Compiled |
| `/_next/image` with sharp 0.35.5 | — | — | 200 AVIF, 2336 bytes |
| Main `/admin` sign-in + notifications (scratchpad check) | — | 0 | 6/6 |
| `node tests/wordpress/structured-acceptance.mjs` | 0.6.2 | 0 | 56/56 |
| `node tests/wordpress/site-chrome-acceptance.mjs` | 0.6.2 | 0 | 18/18 |
| `node tests/wordpress/homepage-acceptance.mjs` | 0.6.2 | 0 | 14/14 |
| `node tests/wordpress/courses-acceptance.mjs` | 0.6.2 | 0 | 12/12 |
| `node tests/wordpress/more-content-acceptance.mjs` | 0.6.2 | 0 | 15/15 |
| `node tests/wordpress/permissions-acceptance.mjs` | 0.6.2 | 0 | 9/9 |
| `node tests/wordpress/scheduling-acceptance.mjs` | 0.6.2 | 0 | 7/7 |
| `node tests/wordpress/both-failure-acceptance.mjs` (+ `STEP=main-down`) | 0.6.2 | 0 | 12/12 (+ 3/3) |
| `node tools/verify-wordpress-live.mjs` (Main / Enrollment / Both blogs) | 0.6.2 | 0 | 16/16 |
| `node tools/verify-wordpress-pages-live.mjs` | 0.6.2 | 0 | 17/17, 0 click fallbacks |
| `node tools/verify-content-api-live.mjs` | 0.6.2 | 0 | 16/16 |

**Interruptions on the way (reported, not hidden):**
- The first full run (plugin 0.6.1 code, 02:50–03:47) had two interruptions:
  - structured crashed at login (transient stall);
  - homepage lost one check to `ERR_NETWORK_IO_SUSPENDED` (this PC slept).
- Individual reruns: homepage 14/14; structured crashed once at E12 (a 30-second timeout on the admin screen), then passed 56/56.
- A temporary keep-awake was used for the 0.6.2 regression.

**Test-tool fixes made on the way:**
- five suites now exit 1 on a failed check;
- the run script captures real exit codes;
- the kit reads the plugin's own notice.

## F. One Elementor CMS with approval (plugin 0.7.0; LOCAL; 13 Oct 2026 11:13–12:53 UTC)

Full command list, counts and exit codes are in `TEST-RESULTS.md` (13 Oct, final ordered regression). Logs: `evidence/final-run/final4/`, `evidence/final-run/rerun5/`.

| ID | Env | Test | Result | Status |
|---|---|---|---|---|
| AT-50 | LOCAL | Real Elementor editor: a page built from scratch (nested containers, typography, responsive sizes, button, uploaded image) | A0–A3 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-51 | LOCAL | "Publish" submits the exact revision; drafts and pending pages are not public | A2, A3 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-52 | LOCAL | Only reviewers approve (screen and direct call); a replayed approve link from another user is refused | A4, R3 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-53 | LOCAL | Any edit after approval cancels it; the cancelled revision cannot be published | A5; PHP | `PASS — VERIFIED LOCALLY ONLY` |
| AT-54 | LOCAL | Main only: published and verified by the revision mark; not on Enrollment | A6 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-55 | LOCAL | Enrollment only | Bridge scenario B; R1 page on Enrollment; A11 code page | `PASS — VERIFIED LOCALLY ONLY` |
| AT-56 | LOCAL | Both: verified on both; same layout and font sizes at 1440 / 820 / 390 px on both websites | A8 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-57 | LOCAL | Live pages protected (working copy; Elementor, REST and trash refused) | A7 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-58 | LOCAL | Main fails / Enrollment fails / both fail: honest per-website reporting; **Check again** recovers | A9, R1, R2 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-59 | LOCAL | Repeated or replayed publish: refused, nothing duplicated, no extra archive | R3 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-60 | LOCAL | Rollback to an earlier approved revision, verified on both; reviewers only | A10 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-61 | LOCAL | Missing widget blocked with reason; typed code needs an explicit code review; Pro-only styles reported as "NOT SHOWN" without Pro | A11, M2; PHP | `PASS — VERIFIED LOCALLY ONLY` |
| AT-62 | LOCAL | Global styles reviewer-only | A12 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-63 | LOCAL | Scheduled publishing: at its time only if unchanged; Cancel schedule; lost job restored; history | R4; PHP | `PASS — VERIFIED LOCALLY ONLY` |
| AT-64 | LOCAL | Approval switched off: nothing waiting goes live; live pages stay | R5 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-65 | LOCAL | Import Main Website under approval; re-import into a working copy; Main address and homepage rules | A14, A15 | `PASS — VERIFIED LOCALLY ONLY` |
| AT-66 | LOCAL | A real Main page (`/soft-skills`) moved into Elementor: content, H1, title, description and canonical identical; taken off line, Main's own page back in ~8 s; import undone | M0–M5, Z | `PASS — VERIFIED LOCALLY ONLY`. Visual differences: O-28 |
| AT-67 | LOCAL | Existing behaviour unaffected: all earlier suites (structured, chrome, homepage, courses, more-content, permissions, scheduling, conflicts, blog sync, redirects, Both failure, blogs, pages, signed API, bridge scenarios) | All pass (`TEST-RESULTS.md`) | `PASS — VERIFIED LOCALLY ONLY` |
| AT-68 | PROD | Any of AT-50 – AT-66 on production | Plugin 0.7.0 not installed, Render Bridge off: needs the owner's approval for each step (`DEPLOYMENT-REPORT.md`) | `OWNER APPROVAL REQUIRED` |
| AT-69 | PROD | Read-only state, 13 Oct 11:10–11:20 UTC | `dpl_8C59…` Ready; manifest 404; unsigned content API refused; plugin 0.6.1 | `PASS — VERIFIED` |

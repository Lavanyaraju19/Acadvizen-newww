# Final acceptance tests: Acadvizen Master Admin / headless CMS

Last updated 13 October 2026 (fresh production checks 12 Oct 19:33–19:47 UTC = 13 Oct 01:03–01:17 IST, against deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` and plugin 0.6.1). Each test lists where it ran:
- **PROD**: the live sites;
- **LOCAL**: local WordPress + local Main build + local Supabase;
- **AUTO**: automated tests.

Statuses are PASS, FAIL, BLOCKED or NOT TESTED. A LOCAL result is never counted as a production result.

Test content on PROD was always labelled ("CMS PRODUCTION TEST …"), set to noindex, and removed through the admin's own Trash and Delete permanently. Cleanup was then verified on both sites (AT-40).

## A. Content preservation (read-only)

| ID | Env | Test | Expected | Actual (time UTC) | Status | Evidence |
|---|---|---|---|---|---|---|
| AT-01 | PROD | All Main sitemap URLs: status, title, description, robots, canonical, against the snapshot taken before Release 10 | No change | 314/314 identical (12 Oct 16:07, 18:28, 18:52; fresh 19:33–19:41) | PASS | `TEST-RESULTS.md` R10-3 |
| AT-02 | PROD | All published Enrollment pages and posts: status, title, robots, canonical, Elementor markup, against the first baseline (before any plugin change) | No change | 60/60 identical, against both the first baseline and the post-Release-10 capture (12 Oct 18:52; fresh 19:41) | PASS | R10-15 |
| AT-03 | PROD | Enrollment homepage rendering | Same as baseline | Taller than the baseline: "Where Our Learners Build Their Careers" appears twice. Homepage revision 7941 (12 Oct 11:44:05 UTC, WordPress user ID 1, an Elementor edit) doubled it; revision 7940 had it once. The CMS (user ID 2) never edited the page | Explained (not caused by the CMS) | `FINAL-OPEN-ISSUES.md` O-3 |
| AT-04 | PROD | Enquiry REST route | Registered | `acadvizen/v1/enquiry` POST registered (19:41). No enquiry was sent | PASS | — |
| AT-05 | PROD | Main `/admin-login`, home, robots, sitemap | 200 | 200 (19:41) | PASS | — |
| AT-06 | PROD | Render Bridge stays off | Manifest unavailable | `/api/wordpress/bridge-manifest` 404 (19:41); `WORDPRESS_CONTENT_ENABLED` not among the Vercel Production variables (19:50) | PASS | — |

## B. Connection and security (PROD)

| ID | Test | Expected | Actual | Status | Evidence |
|---|---|---|---|---|---|
| AT-10 | WordPress Settings → **Test connection** (real button) | Connected | "Connected. The Main Website accepted a signed request." (16:10, 18:37; fresh 19:46 with the saved integration session) | PASS | `evidence/production-r10/01-wordpress-settings-connected.jpg` |
| AT-11 | Signed content API: unsigned, wrong secret, stale timestamp | 401 | 401 `missing_timestamp` / `invalid_signature` / `stale_timestamp`; wrong purpose 400; unknown entity 400; signed read-only list 200 (19:41) | PASS | R10-5; `FINAL-SECURITY-REPORT.md` §2 |
| AT-12 | Replayed signed change | Refused | 409 `duplicate_request` | PASS | `production-api-run-20261012.txt` |
| AT-13 | Slug check: signed free / existing `/blog` / invalid path | no conflict / conflict "reserved" / 400 `invalid_path` | As expected (19:41) | PASS | R10-5 |
| AT-14 | Preview framing header | Only the preview route, only the Enrollment origin | `frame-ancestors 'self' https://enroll.acadvizen.com` on `/preview/wordpress/…`; `'none'` elsewhere (19:41) | PASS | R10-4 |
| AT-15 | Public JavaScript on production contains no secrets | None | 30 chunks (1.35 MB) from 6 pages incl. `/admin`, vs 8 private values + 5 patterns: 0 findings, no non-anon JWT; source maps 404 (19:44) | PASS | `FINAL-SECURITY-REPORT.md` §2 |
| AT-16 | Plugin REST routes | Public routes expose published content only; private routes need a signature | `/blogs` returns only `publish` posts that are visible on Main; `/manifest` without a signature → 401 (19:41) | PASS | `includes/rest.php` |
| AT-17 | Main admin signed out | No data; APIs refused | `/admin` = noindex shell, no data; `/api/admin/notifications` GET and POST → 401 (19:41–19:44) | PASS | — |

## C. Administrator workflows in the real WordPress admin

| ID | Env | Test | Actual | Status | Evidence |
|---|---|---|---|---|---|
| AT-20 | PROD | Page workflow (17 steps): create draft, private (404), sections, **preview in the editor**, publish (200, noindex, canonical to itself, not in sitemap), private copy (live unchanged), publish copy (live updated, cache refreshed), address clash refused (nothing overwritten), unpublish (404), Trash, Delete permanently, 404 | 17/17 on plugin 0.6.0 and 17/17 on 0.6.1 (12 Oct 16:35, 18:20) | PASS | `production-pages-run-20261012.txt`, screenshots 02–06 |
| AT-21 | PROD | Blog **Main only** | Public on Main, absent from Enrollment, noindex | PASS | `production-blogs-run-20261012.txt` |
| AT-22 | PROD | Blog **Enrollment only** | One submission; Enrollment copy `publish`, 200; not on Main; **saving again keeps it live** (fixed in 0.6.1) | PASS | same |
| AT-23 | PROD | Blog **Both**, including an edit | Public on both; the edit reaches both | PASS | same |
| AT-24 | PROD | Main Website screen lists Main pages | 50 pages, 24 tabs, filter works | PASS | R10-7 |
| AT-25 | LOCAL | Pages/blogs/permissions/security suite (`structured-acceptance.mjs`) | 56/56 (fresh 19:35) | PASS (LOCAL) | `evidence/local-structured/results-202610121933.json` |
| AT-26 | LOCAL | Header, footer, menus, site labels (`site-chrome-acceptance.mjs`) | 18/18 (12 Oct) | PASS (LOCAL) | `evidence/local-site-chrome/` |
| AT-27 | LOCAL | Homepage lists, banner, call to action (`homepage-acceptance.mjs`) | 14/14 | PASS (LOCAL) | `evidence/local-homepage/` |
| AT-28 | LOCAL | City and service pages, SEO overrides, media upload and picker (`more-content-acceptance.mjs`) | 15/15 | PASS (LOCAL) | `evidence/local-more-content/` |
| AT-29 | LOCAL | Courses and course sections (`courses-acceptance.mjs`) | 12/12 | PASS (LOCAL) | `evidence/local-courses/` |
| AT-30 | PROD | Header, footer, menus, homepage, courses, city and service pages, media upload | Visitor-facing global edits; no isolated staging exists | — | NOT TESTED (PROD); BLOCKED for staging (O-5) |

## D. Scheduling, permissions, conflicts and reliability

| ID | Env | Test | Actual | Status |
|---|---|---|---|---|
| AT-31 | LOCAL | **Scheduled publishing end to end** (`tests/wordpress/scheduling-acceptance.mjs`): "Publish automatically on" +3 min, "Remove automatically on" +6 min | 7/7 on 12 Oct 19:03 and fresh 7/7 at 19:36–19:43. Appeared within seconds of its time, removed on time; editor shows the same local time; list shows "Scheduled for …"; cleaned up. Site time zone is UTC, the same as production | PASS (LOCAL) |
| AT-32 | PROD | Scheduled publishing on the live site | Would publish test content on a timer; staging needed | NOT TESTED (PROD) |
| AT-33 | LOCAL | **Role permissions by direct request** (`tests/wordpress/permissions-acceptance.mjs`): Author and Contributor against all 23 Main Website screens, plugin Settings, Main media upload, plugin installer | 9/9. Only Blogs opens; 22 screens refused; Settings, upload and installer → 403 | PASS (LOCAL) |
| AT-34 | LOCAL | Role workflows (suite H3–H5): Author publishes own articles only; Contributor drafts or submits for review only; forged "Published" refused | Included in AT-25 | PASS (LOCAL) |
| AT-35 | PROD | Author and Contributor on production | No such accounts on production; creating users is a production change | NOT TESTED (PROD) |
| AT-36 | AUTO | Address rules: 11 malformed forms (uppercase, trailing or leading slash, `..`, query, spaces, non-ASCII, double or edge hyphens) refused and nothing created; rename onto a taken address refused with both records unchanged; reserved routes; page/service-page clashes; draft-copy exemption | Content API tests 31/31 | PASS |
| AT-37 | AUTO + PROD | Replay and duplicate delivery | Unit tests; PROD AT-12 | PASS |
| AT-38 | PROD | Retry after a slow response does not double-publish | One POST per save. The earlier double POST was the test tool's retry, fixed in `367309f` | PASS |
| AT-39 | PROD | Revalidation after publish and update | Update visible on the next fresh request (AT-20 P10/P11; AT-23) | PASS |
| AT-40 | PROD | Cleanup of every test item | 0 test rows on Main (pages and blogs, list and trash); 0 Enrollment posts in any status; nothing in the sitemap (12 Oct 18:30) | PASS |
| AT-41 | — | Rollback by Instant Rollback to Release 9 | Target `dpl_4YpH3TaN…` READY; not executed (an exercise would change production) | NOT TESTED (documented) |
| AT-42 | PROD | Plugin provenance | Installed 0.6.1; the 4 publicly served plugin files are byte-identical to package `dd6fcf27…e32c`; plugin source unchanged since `2cc2148` (19:44). No version bump: nothing changed | PASS |

## E. Quality (AUTO / LOCAL, fresh run 12 Oct 19:33–19:47 UTC, current tree)

Log: `evidence/final-run/fresh-run-20261012T1933.txt`.

| ID | Command | Result |
|---|---|---|
| AT-50 | `node --test tests/unit/*.test.js` | 214 pass, 0 fail (exit 0); rerun after the comment-only edit before commit: 214/214 |
| AT-51 | `npx tsc --noEmit -p .` | exit 0 |
| AT-52 | `npx next lint` | 0 errors, 10 pre-existing warnings |
| AT-53 | `php tests/php/run.php` (in the WordPress container) | 252 pass, 0 fail |
| AT-54 | `php -l` on every plugin file | 20 files, 0 errors |
| AT-55 | `npm run build`, production switch settings | Compiled; exit 0 (19:47) |
| AT-56 | `npm run secrets:check`; pre-commit hook on both release-11 commits | No secrets found |
| AT-57 | `npm audit --omit=dev` | 2 high, pre-existing (`nodemailer` needs a major version; Next.js's own `sharp`) |
| AT-58 | Local browser suites | Structured 56/56, permissions 9/9, scheduling 7/7, blog tool 16/16, page tool 17/17 (0 click fallbacks), API tool 16/16 (all LOCAL) |

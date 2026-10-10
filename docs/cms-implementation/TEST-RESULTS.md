# Test results — 10 October 2026

The statuses used are PASS, PARTIAL, FAIL, BLOCKED and NOT TESTED. The level (Automated, LOCAL, PRODUCTION) is stated on every row.

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

# Client handover — Acadvizen central CMS (10 October 2026)

## Where things stand, in plain language

- **The central editor is installed on the live Enrollment website.** Acadvizen Master Admin 0.4.0 is active at `https://enroll.acadvizen.com/wp-admin/`. Its security checks were tested on the live site and refuse every request that is not properly signed. The Enrollment website looks and works as before.
- **It is not yet connected to the Main website.** Pages set to "Main Website" or "Both Websites" will not appear on www.acadvizen.com yet. Connecting needs four things from the owner: a backup, a secret code in two places, a server task, and approval to switch it on (below).
- **The existing Main website content is not in the editor yet.** The 86 blogs, 134 pages, 67 tools and the locations are still in the Main website's own database and are edited in `www.acadvizen.com/admin`. A one-time import brings them into WordPress. It has been checked as a dry run: no duplicates, and two address overlaps that are handled. It needs the backup and your approval first.
- **Everything else has been built and tested** on a local copy of both websites (44 of 44 checks), including:
  - publishing to Main, to Enrollment and to both;
  - redesigns, previews and global colours;
  - city and area pages;
  - restoring earlier versions;
  - recovery from failures.

  Those are tests on a copy, not on the live websites.

**Overall status: PARTIAL. The system is not ready for daily use on both websites.** It is ready for the connection steps below.

## How to use it (once connected)

Step-by-step guide: `ADMIN-USER-GUIDE.md`. It covers:
- signing in and finding pages and blogs;
- creating and editing content;
- the visual editor (Elementor);
- previews on desktop, tablet and mobile, including **Preview on the Main Website**;
- Publish To (Main, Enrollment or Both);
- checking that a change is live;
- restoring an earlier version;
- SEO and images;
- what to do when a publish fails.

## What you need to do, in order

| # | Action | Who | Time |
|---|---|---|---|
| 1 | Back up **enroll.acadvizen.com** (files and database) in hPanel → Websites → enroll.acadvizen.com → Backups. Note the date, and the database size (hPanel → Databases). Confirm the Supabase backup | Owner | 20 min |
| 2 | Run the two prepared database updates in Supabase → SQL Editor. This fixes saving a lead's status (`../ACADVIZEN_CLIENT_HANDOVER.md` §11) | Supabase owner | 10 min |
| 3 | Give the engineer a working WordPress administrator account, through a local file and never in chat. Or do steps 4–5 yourself | Owner | 5 min |
| 4 | Create a new secret code on your computer and add it in two places, with the Main address and API address: `wp-config.php` (hPanel → File Manager) and Vercel → Settings → Environment Variables (Production). Add the every-minute server cron (hPanel → Advanced → Cron Jobs). Never send the code in chat | Owner | 20 min |
| 5 | Optional: install plugin **0.4.1** (`dist/acadvizen-cms-0.4.1-6e9f637/acadvizen-cms.zip`, SHA-256 `47be3abf…33f6`). It adds the list of pages a shared change affects. Upload it over 0.4.0 in Plugins → Add New → Upload | Owner or engineer | 10 min |
| 6 | Approve pushing and deploying the 8 local commits (includes the test-tool page fix), then switching the connection on | Owner → engineer | 30 min |
| 7 | Production acceptance tests B–J (`TEST-PLAN.md`) with "CMS PRODUCTION TEST" pages, each recorded in `LIVE-PUBLISH-VERIFICATION.md` with screenshots, then deleted | Engineer | 2–3 h |
| 8 | Decide about the published blog "Dummy dm course", then approve the import of the existing Main content in small batches | Owner | — |
| 9 | Enrollment fixes: sitemap, three redirects, footer button, logo link, two test items (`../ACADVIZEN_CLIENT_HANDOVER.md` §10) | Owner or engineer | 30 min |
| 10 | Change every password that was shared in chat during the project | Each account owner | — |

## Acceptance matrix

Statuses are for **production**. LOCAL results are in the Evidence column.

| Feature | Main | Enrollment | Both | CRUD tested | Visual editing tested | Revision/rollback tested | Live verification | Evidence | Remaining issue |
|---|---|---|---|---|---|---|---|---|---|
| Plugin installed (verified package) | — | PASS | — | — | — | — | PASS | file hashes; smoke 13/13 | — |
| Signed API: unauthorised requests refused | PASS (refusals) | PASS | — | — | — | — | PASS | `evidence/cms-api-smoke-production.log` | Signed acceptance needs the secret: BLOCKED |
| Existing content visible in the central admin | BLOCKED | BLOCKED | — | NOT TESTED | — | — | BLOCKED | inventory + dry run | Main: import not run. Enrollment: in WordPress by design, not checked (no login) |
| Pages: create, edit, publish, unpublish, trash, delete | BLOCKED | BLOCKED | BLOCKED | LOCAL PASS (A, B, C, cleanup) | LOCAL PASS | LOCAL PASS (F) | BLOCKED | `TEST-RESULTS.md` | Connection, login |
| Blogs (Main Blogs) | BLOCKED | — | — | NOT TESTED this round (STAGING earlier) | — | — | BLOCKED | — | Import; connection |
| Courses / Locations / City→Area | BLOCKED | BLOCKED | BLOCKED | LOCAL PASS (E) | LOCAL PASS | — | BLOCKED | scenario E | As above |
| Tools, FAQs, testimonials | BLOCKED | BLOCKED | — | NOT TESTED this round | — | — | BLOCKED | — | As above |
| Visual editor (Elementor): layout, colours, typography, spacing | BLOCKED | BLOCKED | BLOCKED | — | LOCAL PASS (A, F) | — | BLOCKED | scenarios A, F | Login |
| Responsive (desktop, tablet, mobile) | BLOCKED | BLOCKED | — | — | LOCAL PASS | — | BLOCKED | render check | — |
| Preview on the Main Website | BLOCKED | — | — | — | LOCAL PASS | — | BLOCKED | browser test | Needs the secret |
| Global colours and fonts | BLOCKED | BLOCKED | BLOCKED | — | LOCAL PASS (D) | — | BLOCKED | scenario D | Agreed time window |
| Affected-pages list before saving | BLOCKED | — | — | — | LOCAL PASS | — | NOT TESTED | 0.4.1 local check | 0.4.1 not installed; Enrollment pages not listed |
| Headers and footers per website | PARTIAL | PARTIAL | PARTIAL | — | STAGING PASS (earlier) | — | NOT TESTED | — | Flag `SITE_TEMPLATES` off |
| Revisions and rollback | BLOCKED | — | — | — | — | LOCAL PASS (F) | BLOCKED | scenario F | Connection |
| Destination isolation (Main / Enrollment / Both) | BLOCKED | BLOCKED | BLOCKED | LOCAL PASS (A, B, C) | — | — | BLOCKED | scenarios A–C | Connection |
| Failure, retry, no duplicates | BLOCKED | — | — | LOCAL PASS (H) | — | — | BLOCKED | scenario H | Connection |
| Main stays up if WordPress is down | PARTIAL | — | — | — | — | — | NOT TESTED | LOCAL 7/7 | Not tested on production (it would mean stopping WordPress) |
| Scheduling | NOT TESTED | NOT TESTED | — | — | — | — | NOT TESTED | — | Test J |
| Review/approval workflow | PARTIAL | PARTIAL | — | — | — | — | NOT TESTED | — | Only WordPress's Pending Review; no "Approved" state |
| Import of existing Main content | BLOCKED | — | — | — | — | — | BLOCKED | dry run (86 / 67 / 134) | Backup, login, approval |
| Main lead storage (`/contact`) | PASS | — | — | — | — | — | PASS (10 Oct test enquiry) | handover §4 | — |
| Leads: change status | FAIL | — | — | — | — | — | FAIL | HTTP 500 | Migration `202610100001` (step 2) |
| Enrollment enquiry API | — | PARTIAL | — | — | — | — | PARTIAL | route registered | Live submission needs approval |
| Regression, Main | PARTIAL | — | — | — | — | — | PASS (314/314 URLs 200) | verify-production | Test tool page until deploy |
| Regression, Enrollment | — | PARTIAL | — | — | — | — | PASS (no change from install; sitemap index improved) | verify-production | 7 pre-existing issues |

## Evidence

- `BASELINE.md`, `CONTENT-INVENTORY.md`, `TEST-RESULTS.md`.
- `evidence/`:
  - production inventories, import dry run and smoke log;
  - live-websites log;
  - baseline screenshots of both home pages, desktop and mobile.
- **No admin screenshots from production:** the engineer has no WordPress login.
- **No screenshots of a live publication:** none has been possible yet.

## Can the client use it today?

**Not for publishing to the Main website.** Enrollment editing works as before, through the same WordPress admin. Publishing to Main, and editing the existing Main content in WordPress, start after steps 1–8.

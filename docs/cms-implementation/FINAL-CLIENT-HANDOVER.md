# Acadvizen central CMS: client handover (updated 19 October 2026)

## Status on 19 October 2026 (current)

**Verdict: in production and working for everyday content, with open items that need the owner's decisions (listed at the end of this section).** It is **not** labelled "complete": the Main-content import, plugin 0.7.3 and two Enrollment decisions are still waiting for approval.

**One admin for both websites:** `https://enroll.acadvizen.com/wp-admin/` (Acadvizen Master Admin). No other CMS address exists or is used.

**What is live (checked 18 Oct 22:2x UTC and 19 Oct, read-only):**

| Part | Live state |
|---|---|
| Main website | Vercel project `acadvizen-newww-ua9d`, deployment `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`, with the Render Bridge on), serving both `acadvizen.com` and `www.acadvizen.com`. Rollback target `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5` (`tools/release/enable-bridge.sh --undo`) |
| Enrollment website | Hostinger (LiteSpeed). Acadvizen Master Admin **0.7.2**; switches SITEMAP_CLEANUP, RENDER_BRIDGE, SITE_TEMPLATES and APPROVAL **on**, LOGIN_BRANDING off |
| Main unchanged since the release | 314/314 Main addresses identical to the 18 Oct post-release record (read-only crawl, 18 Oct 22:27–22:40 UTC) |
| Enrollment | Home, sitemaps, robots, REST (`/wp-json/`, `/wp-json/acadvizen-cms/v1/`) answer 200; redirects work (`/about-us/` → 301) |

**Capability status.**

The categories are:
- **L:** implemented and verified locally;
- **D:** deployed to production;
- **P:** verified end to end on production;
- **B:** blocked or not implemented.

| Capability | Status | Evidence (UTC) |
|---|---|---|
| Main pages from the admin: draft not public, preview, publish, private changes, address clash, unpublish (kept as draft), noindex/sitemap | **P** | 17/17, 18 Oct 18:23 |
| Content API authentication and authorisation (signed requests, refusals) | **P** | 16/16, 18 Oct 18:20 |
| Blogs to **Main only** | **P** on 0.7.1 (all functional checks; the only failure was "0.7.2 installed", before the install) | 12/13, 18 Oct 18:25 |
| Blogs to **Enrollment only** | **P** on 0.7.1 (same note) | 13/14, 18 Oct 18:26 |
| Blogs to **Both** | **P** on 0.7.2 | 17/17, 18 Oct 18:32 |
| Elementor pages to Main, Enrollment and Both, with address-clash refusal | **P** | 49/49, 18 Oct 17:47 (test pages #8402, #8416, #8430 kept as drafts) |
| Approval workflow (submit, approve exact revision, publish, working copy, reject, restore, unpublish) | **P** | 15/16, 18 Oct 17:54. Step 7 (reject) is proven by the approval history; the test's message reader was fixed afterwards. Local 47/47 (19 Oct, plugin 0.7.3) |
| Scheduled publishing (Main page appears and is removed on time) | **P** in UTC | 7/7, 18 Oct 21:23 |
| Scheduling in **Asia/Kolkata** | **L**; production site time zone is UTC (**B**: needs a setting change, see below) | 7/7 local, 18 Oct 23:02–23:09 UTC (19 Oct 04:32–04:39 IST), across the IST/UTC date boundary |
| Header, footer, menus | **P** | 17/18, 18 Oct 18:37 (the 1 failure is the test clicking twice; the copy happened) |
| Main redirects | **P** | 9/10, 18 Oct 18:46 (R2 failed on the test's own pattern; the redirect was correct) |
| Media upload | **P** | 4/4, 18 Oct 18:47 (attachment #8507) |
| Main registration popup (title change shows live) | **P** | 5/5, 18 Oct 21:28, original title restored |
| Enquiry forms (Main and Enrollment) | **P** | Enrollment 4/4, 18 Oct 18:42; Main 4/4, 18 Oct 18:43 |
| Render Bridge (Main addresses served from WordPress pages) | **D, P** | Live since 18 Oct 17:14; 314/314 identical; city pages 200 under concurrency |
| Failure handling for Both (Main down, Enrollment copy failure), retry without duplicates, conflict protection | **L** | both-failure 12/12 and main-down 3/3; conflict 9/9 (18 Oct) |
| Roles and permissions (Editor, Author, Contributor) | **L** (production has no Author or Contributor accounts) | 9/9 (18 Oct) |
| Courses, homepage banner and lists, city/service pages, tools, testimonials, SEO overrides | **L** | structured 56/56, homepage 14/14, courses 12/12, more-content 15/15 (18 Oct) |
| Importing Main's existing content into WordPress (Elementor designs + 286 records) | **L** (measured on a copy of production); **B** on production (needs approval) | `DATABASE-CAPACITY-AND-CLEANUP-PLAN.md` |
| 108 location pages show their own description after the import | **L** | Before the fix, 0/8 sampled pages showed their own text (all showed the Jayanagar text). After it, **108/108** on the production copy; the extraction rule was checked against all 108 live pages (108/108) |
| Plugin 0.7.3 (design-usage search 89 s → 1.45 s on production-sized data) | **L** | PHP 321/321, bridge 44/44, approval 47/47 (19 Oct 07:15–07:40). **B**: commit, package and install need approval |

**Local regression (full run, 18 Oct 21:29–22:19 UTC):**
- 924 passed, 0 failed across 19 suites: unit 279; PHP 321; structured 56; site-chrome 18; homepage 14; courses 12; more-content 15; permissions 9; scheduling 7; both-failure 12; conflict 9; blog-sync 18; redirects 11; WordPress live-suite (local) 16; pages (local) 17; content API (local) 16; bridge 44; approval 47; main-down 3.
- tsc 0 errors; lint 0 errors (10 warnings); production build OK.
- Since then: unit 283/283, with the 4 new location tests (19 Oct).

**Backup and recovery:**
- **Recovery point:** 17 Oct 09:43, `u713346627_xDzzw.20261017093050.sql.gz`, verified.
- **Restore test:** the backup was restored into an isolated copy in 2 min 40 s; 111/111 tables OK; WordPress booted and rendered the same pages.
- **No newer backup has been taken.** A fresh backup is the first step of any database work.

**Database storage (Hostinger showed 2,528 of 3,072 MB):**
- Importing Main's content needs about 35 MB now, and up to about 130–160 MB over time. It fits.
- The revision cleanup and its rebuild were simulated, with integrity and page checks passing. Deleting alone frees space inside the tables, not the files; a rebuild then needs about 310 MB of temporary space.
- Full figures and the exact, approval-gated procedure: `DATABASE-CAPACITY-AND-CLEANUP-PLAN.md`.

**Enrollment issues re-checked 19 Oct:**
- **Tablet and phone sideways scroll:** fixed (CSS published 18 Oct). There is no sideways scroll at 1440, 1024, 768 or 390.
- **"Missing logos":** not reproduced. The empty images are carousel slides that load as they scroll in; all 48 files answer 200.
- **Carousel link to an unpublished page:** still there (`?page_id=6342` → 404). Fixing it changes live content: owner decision.
- **`/test/`:** public and indexable, and in the sitemap (owner decision).
- **Logo link:** points to `acadvizen.com` (owner decision).

**Security:**
- No password, key or token was changed, rotated or disabled in this work.
- The WordPress credential shared earlier must be treated as exposed. It has **not** been rotated (not verified otherwise).
- The legacy Supabase keys were still accepted at the last check (15 Oct). They have not been re-checked since.
- No secret appears in this document, in Git or in the kept evidence. The isolated copy, which held production secrets, was deleted and the deletion verified.

**Hosting notes:**
- Two old Vercel projects (`acadvizen-newww`, `acadviden-qfxs`) still show `www.acadvizen.com` as their last production address, but only `acadvizen-newww-ua9d` holds the domain.
- The old project `acadviden` lists `enroll.acadvizen.com`, but DNS sends `enroll` to Hostinger, so it has no effect.
- A DNS record `cms` still points at the old Hostinger staging copy. Nothing depends on it.
- Removing any of these needs approval.

**Waiting for the owner (smallest set):**
1. Commit and push the current work, then build and install **plugin 0.7.3** (rollback: reinstall 0.7.2).
2. **Import Main's content** (one import, after a fresh verified backup), then run the production acceptance checks on the imported pages.
3. Optional: **revision cleanup** (procedure in `DATABASE-CAPACITY-AND-CLEANUP-PLAN.md`).
4. **Site time zone → Asia/Kolkata** (Settings → General), if the team wants to enter Indian times.
5. Enrollment content decisions: `/test/`, the logo link, and the carousel link to the unpublished page.
6. Credential rotation (WordPress admin, legacy Supabase keys), at a time chosen to avoid breaking integrations.
7. Optional clean-up of the old Vercel projects and the `cms` DNS record.

**Test items left on production (labelled, unpublished, not deleted):**
- Main leads `3a41e225`, `915005a0`, `da63da54`, and one Enrollment course enquiry;
- Elementor test pages #8402, #8416, #8430 and #8444 (drafts);
- Main test pages and blogs from 18 Oct (unpublished);
- the scheduled test page `/cms-test-scheduled-202610182115` (unpublished);
- media #8507.

## Status on 15 October 2026 (historical; superseded by the 19 October section above)

**Verdict: READY WITH EXPLICITLY ACCEPTED RISKS.** The sign-in checks M1–M3 passed on 15 Oct, 13:52–13:54 UTC (below). They were run by the engineer at the owner's request, with the existing admin session and the owner's stored credentials.

The owner accepted two open risks on 15 Oct. Neither is resolved:
- **Security (Owner-Accepted Risk, remediation deferred):**
  - the leaked legacy Supabase keys were **still accepted** by the production Supabase project at the last check (15 Oct, 13:03 UTC);
  - the Main admin account still signs in with the password stored on 12 Oct, so **its password has not changed since 12 Oct** (see "Security").
- **Database backup (Owner-Accepted Risk, interim):** there is no complete backup newer than 10 Oct. The next hosting backup is expected in about two days and must then be verified.

Publishing was verified on the live websites:
- **15 Oct (plugin 0.7.1):** Main pages, Enrollment-only blogs and Both blogs.
- **14 Oct (plugin 0.7.0):** Main-only blogs, last verified then.

Detailed evidence (logs, screenshots, comparisons) is held by the engineer outside the repository. `TEST-RESULTS.md` summarises it.

**Status by category (15 Oct)**

| Item | Category |
|---|---|
| Main pages from the Master Admin (17/17); Enrollment-only blogs (14/14); Both blogs (17/17); noindex, sitemap, feed and IndexNow behaviour; Main 314 / Enrollment 59 unchanged; plugin 0.7.1 install and rehearsed rollback; admin screens and destination choices (read-only check, see below) | **Verified** (production) |
| Main-only blogs | **Verified** (production, 14 Oct, plugin 0.7.0); not re-run on 0.7.1 |
| Failure handling for Both, scheduling (UTC and Asia/Kolkata), roles and permissions, approval workflow, all other Main content types | **Verified locally only** (by rule, or no production accounts) |
| Sign-in checks M1–M3: WordPress Master Admin, Enrollment Elementor, Main `/admin` sign-in and sign-out | **Verified** (production, 15 Oct 13:52–13:54 UTC) |
| Legacy Supabase keys and passwords in Git history | **Owner-Accepted Risk** (deferred) |
| No complete database backup since 10 Oct | **Owner-Accepted Risk** (interim, about two days) |
| Enrollment: 3 missing logos, sideways scroll at tablet width, carousel link to an unpublished page; Main `/admin` shows "session expired" to someone never signed in; the Master Admin menu mixes Enrollment shortcuts with Main Website | **Known Issue** (outside this release) |
| Approval workflow and Render Bridge (Elementor pages and popups for Main or Both) | **Not in this release** (off; owner decision) |

**Admin screens on production (15 Oct 13:33 UTC; signed in as an administrator, page loads only, nothing saved)**
- The dashboard and the Acadvizen Master Admin menu load.
- **Main Website** has 24 content tabs. The Pages and Blogs lists load from the live Main site (50 rows each, no errors).
- **New blog:** Publish To offers Enrollment Website / Main Website / Both Websites. Status offers Draft / In review / Approved / Published / Archived. "Hide from search engines" and the Heading / Paragraph / List / Image blocks are there.
- **New page and new course:** no Publish To (Main only). The page form has title, address, description, SEO fields, noindex, sitemap exclusion and schedule times.
- WordPress **Pages** shows "Edit with Elementor" for Enrollment pages. Elementor, Elementor Pro, Rank Math and Master Admin are active.
- A signed-out visitor is sent to the WordPress login. Main `/admin` sends a signed-out visitor to `/admin-login` (email and password).
- The Master Admin menu also holds **shortcuts to the Enrollment site's own tools**: Pages, Media, Templates, Header & Footer, Menus, Global Styles, SEO and Redirects. These change **Enrollment**. Main content is edited only under **Main Website**.

**Sign-in checks M1–M3 (15 Oct 2026, 13:52–13:54 UTC; nothing saved or published; no form submitted in WordPress)**

| Check | Steps | Result |
|---|---|---|
| M1 WordPress Master Admin | Signed-in WordPress admin → **Acadvizen Master Admin → Main Website** → **Blogs → Add new** → left without saving | **PASS**: Pages list loads (50 rows, no red error); Publish To offers **Enrollment Website / Main Website / Both Websites**; afterwards still exactly the 2 retained test blogs |
| M2 Enrollment Elementor | WordPress **Pages**, hover over the rows | **PASS**: 18 of 20 pages show "Edit with Elementor" (the other two are not Elementor pages). Nothing clicked |
| M3 Main admin | `https://www.acadvizen.com/admin-login`, one sign-in with the stored Main admin credentials, then **Sign out** | **PASS**: sign-in accepted, "Admin Dashboard" opens. After sign-out the session check answers 401 and `/admin` no longer opens the dashboard |

- **Afterwards:** the 59 Enrollment pages were identical, and the test items were unchanged.
- **For the client, later:** the same steps work as a quick daily check. Sign in at `https://enroll.acadvizen.com/wp-admin/` and `https://www.acadvizen.com/admin-login` with your own accounts.

**Production**

| Part | Value |
|---|---|
| Main website | `https://www.acadvizen.com` (bare domain → 308 → www) |
| Vercel project | `acadvizen-newww-ua9d` |
| Deployment | `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`, commit `7f1a75f` (checked 15 Oct 13:00 UTC; no production deployment since 14 Oct). Application code is identical to branch head `1bb4970`: later commits change only docs, tools, tests, `.gitignore` and the WordPress plugin |
| Enrollment website | `https://enroll.acadvizen.com` (WordPress 7.0.7 on Hostinger, Elementor + Pro, Rank Math) |
| Master Admin plugin | **0.7.1** (installed 15 Oct 08:40 UTC; package `acadvizen-cms-0.7.1-6fb8222`, sha256 `37bf4a16…7d049cab`) |
| Render Bridge | **off** |
| Approval workflow | **off** (owner decision) |

**What was verified on the live websites (15 Oct, 06:30–09:23 UTC; not re-run since the reported credential changes)**

| Workflow | Result |
|---|---|
| Main page from the Master Admin: draft, preview, publish, private copy, address clash refused, unpublish | 17/17 |
| Blog to **Enrollment only** | 14/14: live on Enrollment only; "Hide from search engines" gives `noindex, follow`; not in the sitemap; not sent to IndexNow; after unpublishing gone from the feed, blog list and sitemap |
| Blog to **Both** in one save | 17/17: both sites, noindex on both, out of both sitemaps, edit reaches both, unpublish removes both |
| Integrity | **Main, all 314 addresses identical:** after the Main test, after the plugin install, after Both, and at 13:17 UTC. **Enrollment, all 59 pages identical:** after each step and at 13:17 UTC. **After Enrollment-only,** Main was checked on 8 sample addresses (identical). Enquiry endpoint `acadvizen/v1/enquiry` registered (not called) |

**Verified on the test copy only (by rule, not on the live sites):**
- what happens when one website fails during a "Both" save (12/12);
- scheduling in UTC and Asia/Kolkata (7/7 each);
- roles and permissions (9/9);
- approval workflow (47/47 + 38/38);
- every other Main content type (structured 56/56, courses 12/12, homepage 14/14, header/footer/menus 18/18, other content 15/15).

**Supported destinations.** Only **Blogs** have Publish To (Main, Enrollment or Both). Everything else in Main Website is for the Main website only. Enrollment pages are still edited in Elementor, unchanged. Elementor pages and popups for Main or Both need the Render Bridge (off; owner decision).

**Security: remediation INCOMPLETE. Owner-Accepted Risk; remediation deferred by the owner on 15 Oct**

1. **Current files (branch head).**
   - `tools/check-secrets.mjs --all` over all tracked files: no secrets (15 Oct 13:25 UTC, including this document).
   - `npm audit --omit=dev`: 0 known advisories in the 120 production dependencies of the Main app (npm advisory database, 15 Oct 07:11 UTC; package files unchanged since 13 Oct). Development dependencies were not part of this check, and it is not a full security audit.
2. **Git history (public).** Gitleaks v8.21.2 over the full history (15 Oct 11:29 UTC, values redacted) reported 15 findings:
   - 7 are test fixtures. None equals a production secret (equality check).
   - 1 is an abbreviated example in an old report (false positive).
   - **7 are real production Supabase legacy JWT keys:** the service_role key (3 old scripts) and the anon key (4 places). None is in the current files.
   - A targeted search also found the **production database password** and the **Main admin password** in old commits.
3. **Production status of those credentials:**
   - **Legacy JWT keys:** at 15 Oct 12:59–13:03 UTC, after the owner reported the dashboard actions, the legacy anon key was **still accepted** by the production Supabase project (`hhfc…`). The legacy key set is therefore **not disabled**, and the leaked service_role key must be treated as **active**. It was not used for testing.
   - **Main admin password:** reported as changed on 15 Oct, but the Main admin account still signed in at 13:53 UTC with the password stored in the owner's credentials file on 12 Oct (check M3). **That account's password has not changed since 12 Oct.** Whether it equals the password in Git history was not checked; that needs a private equality check, with the owner's approval.
   - **Database password:** owner-reported as changed; **not independently verified**.
   - **New keys** (publishable and secret) work: the publishable key reads data, and the Master Admin lists drafts through Main's secret key. Main's code uses the new keys first, so disabling the legacy keys is not expected to affect it.
4. **Required to close this risk** (deferred by the owner; the risk stays open until then):
   1. **Owner, in the Supabase dashboard of project `hhfc…`:** disable the JWT-based legacy API keys. Then the engineer confirms that the legacy key is rejected and Main still works.
   2. **Owner:** change the Main admin password (unchanged since 12 Oct, see check M3) and update the private credentials file. Confirm the database password reset. The engineer can verify each by trying the old credential once (never displayed), only with the owner's approval.
5. **Removing the legacy variables from Vercel** (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL`) happens **only after** step 4.1 is verified, the dependency check is repeated, and the owner approves. It is not done yet.

**Backups and rollback**
- **Database backup readiness: NOT MET. Owner-Accepted Risk (interim, accepted 15 Oct for about two days).**
  - The last complete database backup is from 10 Oct 09:24. The 15 Oct export is incomplete (58 of 108 tables); no newer file existed at 13:00 UTC.
  - No fresh backup has been restored or test-restored.
  - The risk stays open until the next complete backup is downloaded and verified: all tables present, dump complete, ideally test-restored in an isolated copy. Database-affecting changes should wait until then.
  - (The owner had separately accepted the same risk for the plugin 0.7.1 install.)
- **Other copies:** a fresh WordPress content export (15 Oct, 998 items) and the files archive (14 Oct) are held privately. A content export is not a database backup.
- **Plugin rollback:** Plugins → Add New Plugin → Upload Plugin → `acadvizen-cms-0.7.0-62a13a4/acadvizen-cms.zip` → Install Now → Replace current with uploaded. Rehearsed on WordPress 7.0.7 / PHP 8.3. On 0.7.0, a **new** hidden blog's Enrollment copy would be published `index, follow` and submitted to IndexNow; copies saved under 0.7.1 keep their setting. Details: `FINAL-RELEASE-AND-ROLLBACK.md`.
- **Main rollback:** Vercel → `acadvizen-newww-ua9d` → Deployments → promote `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`, the only verified production deployment built with the new Supabase keys. Never promote `dpl_8C59…`, `dpl_EnsscA7x…` or `dpl_8buux…` (they depend on the legacy keys), and never use Redeploy on a preview. Details: `FINAL-RELEASE-AND-ROLLBACK.md`.

**Known issues outside the CMS (re-checked 15 Oct; unchanged; owner decision)**
- On Enrollment's course landing pages, 3 logo images are missing (404: `uploads/2026/09/pwc.png`, `zomato-1.png`, `uber-1.png`).
- The Enrollment homepage scrolls sideways at tablet width (768 px).
- A carousel slide on the Enrollment homepage and `/projects-2/` links to an unpublished page (`/?page_id=6342`, 404).
- Main `/admin` opened by someone who was never signed in shows "Admin session expired. Please sign in again." with **Back to Login**, which opens `/admin-login`. This works but is worded oddly (existing behaviour, unchanged).
- The Master Admin menu mixes Main Website with shortcuts to Enrollment's own tools (Pages, Media, Templates, Header & Footer, Menus, Global Styles, SEO, Redirects). "Pages" and "Redirects" exist for both sites; see "Admin screens on production" above.
- **Vercel housekeeping (outside this release; not blocking client use):**
  - the duplicate project `acadvizen-newww` is still connected to the repository (no domains). A push to `main` would also build there; its addresses stay on `.vercel.app`;
  - the old project `acadviden` still lists `enroll.acadvizen.com` (inactive; DNS points to Hostinger). It would matter only if the `enroll` DNS record were removed.

**Test items left on production (drafts, not public; deleting them needs owner approval)**
- Main page `cms-production-test-page-202610150630`.
- Blogs `cms-production-test-blog-202610150909` and `…-202610150919`, with their Enrollment posts 8289 and 8296 as drafts.

## Status on 14 October 2026 (historical; superseded by the 19 October section above)

**Verdict: NOT CLIENT READY.** The Main release and plugin 0.7.0 are live, and the existing CMS workflows are verified on production. Not yet live, and needing owner approval: Option B (Render Bridge, mandatory approval). The leaked legacy Supabase key is **still valid**: the owner deferred revocation for this release. Client-ready needs proof on a real staging site and then production, and that needs the owner's steps in `OWNER-ACTIONS.md`. The approval gate for Main is `MAIN-ACCEPTANCE-CHECKLIST.md`.

**Production (14 Oct, after the authorized Main release):**
- **Main** `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`, commit `7f1a75f`. 314/314 addresses identical before and after; Render Bridge **off**.
- **Live CMS workflows verified on production:**
  - signed content API 16/16;
  - Main pages from the Master Admin 17/17;
  - blogs to Main, Enrollment and Both: every workflow check passes.
- **Main uses only never-exposed Supabase keys.** The leaked legacy key still has to be disabled by the owner (P11).
- **Enrollment plugin 0.7.0 installed and verified on production** (14 Oct): every Master Admin link opens, Site Health Good, Enrollment pages unchanged, live workflows passing on 0.7.0.
- **Elementor Pro licence:** Active.

**Verified complete:**
- Production (12 Oct): editing Main pages and blogs from the Master Admin, published to Main, Enrollment or Both.
- LOCAL only:
  - one Elementor admin for both websites with mandatory approval: preview per website, exact-revision approval, verification, partial failure, "Check again", rollback, audit log;
  - site-wide migration of the local copy: 92 items approved, published and **92/92 verified**; every difference against Main's own pages classified;
  - recovery: database restore after each migration; an isolated backup restored into a separate stack (87/87 pages identical, row counts identical in 21/21 tables, sign-in, media 36/36);
  - today's converter, importer and SEO fixes (`FINAL-OPEN-ISSUES.md` O-31 to O-43).

**Not complete or blocked:**
- No staging site: Main, Enrollment and Both, failures, retry and rollback are proven on the local copy only.
- **Popups with Elementor Pro:** not verified. The local copy has no Pro; a popup is refused there, correctly. Needs staging with Pro.
- Migration of production's 109 Page Builder pages: unproven. The local copy has none drawn by Main itself.
- Fresh production backup and restore rehearsal: not done (owner access).
- Credentials exposed in Git history (O-1): Main has been moved off them (14 Oct). They stay valid until the owner disables the legacy Supabase keys and resets the database password (P11).

**Needs owner approval or action:** P1 to P11 in `OWNER-ACTIONS.md`, plus:
- O-41: Course Modules on the five course landing pages;
- O-42: the broken carousel link on the Enrollment homepage.

**Accepted limitations:**
- The video label "▶ Play Video" becomes Elementor's play button (O-36).
- Theme "Skip to content" link, keyboard only (O-35).
- Animated visitor counter differs on every load.
- After a header or footer change, other Main pages update within about 5–10 minutes (designed redraw).

## Status on 13 October 2026 (historical; superseded by the 19 October section above)

**(13 Oct wording, superseded:) BLOCKED for a full handover, by production authorization only.** On 14 Oct further defects were found and fixed locally: see the section above.

- **Live and verified:** editing Main pages and blogs from WordPress, and publishing to Main, Enrollment or Both.
- **Built and tested LOCAL, every suite passing:** the Elementor admin for both websites with mandatory approval.
- **Waiting for your go-ahead:** plugin 0.7.0, the approval and bridge switches, and the migration of Main pages (`OWNER-ACTIONS.md`).

| Area | Status |
|---|---|
| Editing Main **pages and blogs** from WordPress, on the live sites | `PASS — VERIFIED` |
| Header, footer, menus, homepage lists, courses, city and service pages, media, SEO overrides, scheduling, Author/Contributor roles | `PASS — VERIFIED LOCALLY ONLY` (no staging; O-5) |
| Existing content on both sites | `PASS — VERIFIED` unchanged: 314 Main addresses (status, title, description, robots, canonical; 12 Oct 23:46 – 13 Oct 02:55 UTC) and 60 Enrollment pages (status, title, robots, canonical, Elementor markup; 12 Oct 23:45 UTC) |
| Security of the old credentials in public Git history | `ACCEPTED RESIDUAL RISK`, by the owner's decision not to change them (`FINAL-SECURITY-REPORT.md`) |
| Release 11 (security readiness, faster pages, dependency fixes) | Committed locally; waiting for the owner's manual push and promote (`FINAL-RELEASE-AND-ROLLBACK.md` §3) |
| Open owner decisions | O-2 to O-6, O-8, O-11, O-14, O-20 to O-22, O-29 (`FINAL-OPEN-ISSUES.md`); the ordered list is in `OWNER-ACTIONS.md` |
| Does **Publish** update the live Main site? | **Yes**: pages and blogs, verified on production 12 Oct with labelled test content (removed afterwards) |
| Does **Publish** update the live Enrollment site? | **Yes, for blogs** with Publish To = Enrollment or Both (a normal WordPress post), verified on production 12 Oct. Enrollment pages are edited as before with Elementor |
| Does **Both** update both? | **Yes**, verified on production 12 Oct (publish and an edit reach both). Failure handling for Both verified locally only; the clearer partial-failure warning needs plugin 0.6.2 (O-14) |
| Production switches (observed 12 Oct) | WordPress → Main content connection **ON** (since 12 Oct, earlier approval); Render Bridge **OFF**. Your 13 Oct instruction asks for it off until you approve: see `FINAL-PUBLISHING-WORKFLOW.md` §1. Nothing changed by the engineer |
| Plugin | 0.6.1 live; **0.7.0** prepared locally, not installed: blogs editable in any editor and kept in step, edit-conflict protection, Redirects, clearer failure messages, **approval-first Elementor publishing** and the **widget compatibility registry** (`FINAL-FEATURE-INVENTORY.md` §F) |
| **One Elementor admin for both websites, with mandatory approval** | `PASS — VERIFIED LOCALLY ONLY` (final ordered run, 13 Oct 11:13–12:53 UTC). Covered by `approval-acceptance.mjs` 47/47, `approval-reliability-acceptance.mjs` 38/38, `migration-acceptance.mjs` 13/13 and the bridge scenarios 44/44:<ul><li>the real Elementor editor;</li><li>Main / Enrollment / Both, each verified on the public page;</li><li>approval tied to the exact revision; any edit cancels it; reviewers only;</li><li>audit history;</li><li>partial failure, retry and rollback;</li><li>blocked widgets and typed code;</li><li>desktop/tablet/phone layout on both websites.</li></ul>**Not on production:** it needs plugin 0.7.0, two wp-config switches and the Main switch (a production traffic change). Runbook in `MAIN-MIGRATION-PLAN.md`; state in `DEPLOYMENT-REPORT.md` |
| Moving Main's existing pages into Elementor | Tool and runbook ready. One real page (`/soft-skills`) moved end to end LOCAL: content, SEO and canonical identical; visually close, not identical (O-28). Production migration not started: `OWNER APPROVAL REQUIRED` at each step (`MAIN-MIGRATION-PLAN.md`) |

## 1. How it fits together

| Part | What it is | Who edits it |
|---|---|---|
| **Main website**: www.acadvizen.com | Next.js on Vercel; content in a Supabase database | From WordPress (**Acadvizen Master Admin → Main Website**), or Main's own `/admin` |
| **Enrollment website**: enroll.acadvizen.com | WordPress with Elementor | WordPress **Pages** / **Posts** with Elementor, exactly as before |
| **The connection** | WordPress sends each Main change to `www.acadvizen.com/api/wordpress/content`, signed with a shared secret. Main checks the signature, stores the change, and shows it **in Main's own design** | Automatic |

- WordPress never changes Main's design, and the Main website never changes Enrollment.
- The "Render Bridge" serves pages designed in Elementor at Main addresses when their **Publish To** includes the Main Website. It is **on** since 18 Oct; Main's own pages are unchanged (314/314).
- Leads, enquiries, students and users stay in Main's `/admin`.

## 2. Signing in

`https://enroll.acadvizen.com/wp-admin/`, with your own WordPress account.
- **Lost password:** use **Lost your password?**, which works only if your account email is current.
- **Otherwise:** the Hostinger account holder opens hPanel → Websites → enroll.acadvizen.com → **WP Admin** → Users → your account → **Set New Password**.

Then **Acadvizen Master Admin → Settings → Test connection** should say **Connected** (verified 12 Oct 19:46 UTC).

## 3. What you can edit, and where it appears

| Content | Screen | Appears on | Verified |
|---|---|---|---|
| Existing and new Main pages, with sections | Main Website → **Pages** | www.acadvizen.com/&lt;address&gt; | Live (17/17) |
| Blogs | Main Website → **Blogs** | Main, Enrollment, or Both (**Publish To**) | Live: Enrollment only 14/14, Both 17/17 (15 Oct, plugin 0.7.1); all three destinations 16/16 (14 Oct, plugin 0.7.0) |
| Header, footer, menus, site labels | Main Website → **Header**, **Footer**, **Menus**, **Site settings** | Every Main page | Local copy (18/18) |
| Homepage banner, call to action, lists | Main Website → **Banner**, **Closing call to action**, **Lists**, **Sections** | Main homepage | Local copy (14/14) |
| Courses and course sections | Main Website → **Courses**, **Course sections** | Main course pages | Local copy (12/12) |
| City pages, service pages, locations, cities, tools, testimonials, media, SEO overrides, blog authors/categories/tags | Main Website → those tabs | Main | Local copy (15/15 and the structured suite) |
| Blogs in the regular **Posts** editor (edit a linked post, or "Also publish on the Main Website") | Posts | Both websites | Local copy (18/18), plugin 0.7.0 |
| Redirects on the Main Website | Main Website → **Redirects** | Main | Local copy (11/11), plugin 0.7.0 |
| Enrollment pages | WordPress **Pages** + Elementor (unchanged) | Enrollment | — |

**Recommendation until staging exists:** use the live-verified **Pages** and **Blogs** screens for everyday work. Use the other screens carefully: preview first, change one thing at a time, and keep **Earlier versions → Restore** in mind. Those edits show to every visitor at once.

## 4. Everyday tasks

The full step-by-step guide is `ADMIN-USER-GUIDE.md`.

1. **Change a live page safely:**
   1. **Pages → Edit → Prepare changes privately.** Visitors keep seeing the live page.
   2. Edit the sections, clicking **Save section** under each.
   3. **Preview (desktop, tablet, mobile).**
   4. Set **Status** to **Published** and click **Save**.
2. **New page:** **Pages → Add new**, then the title, address, description and SEO, then **Save** (draft, private). Add sections, preview, then Published and **Save**.
3. **New blog:** **Blogs → Add new**, then set **Publish To** (Main, Enrollment, or Both) and **Status**, and **Save**.
4. **SEO:** each page and blog has an SEO title, description and **noindex**. **SEO overrides** change these for any address.
5. **Images:** **Media library → Upload** (images up to 3 MB; the type is checked), then pick them with **Choose from the Main library**. Write alt text.
6. **Scheduling:** "**Publish automatically on**" and "**Remove automatically on**", with Status **Published**. **Times are in UTC.** India is UTC+5:30, so 09:00 IST is entered as 03:30.
7. **Hide or remove:** Status **Draft** + **Save**, or **Trash**. **Restore** in the trash brings it back as a draft.
8. **Undo:** **Earlier versions → Restore** (the last 20 saves).

## 5. Who can do what

| Role | Main Website screens |
|---|---|
| Administrator, Editor | Everything |
| Author | **Blogs only**: their own articles, including publishing. Every other screen is refused |
| Contributor | **Blogs only**: drafts and "submit for review". Publishing is refused |

Verified locally only: production has no Author or Contributor accounts.

## 6. When something fails

- **A red message names the problem**, for example an address already in use, a broken link, or the Main website not reachable. Nothing was changed; the live site keeps the previous version.
- **"Enrollment Website copy failed"** (a yellow warning from plugin 0.7.0; inside the green message on 0.6.1) means the Main Website was updated but the Enrollment copy was not. Fix the cause and click **Save** again; that creates the Enrollment copy once, without duplicates.
- **Press Save once and wait.** The admin can take about 20 seconds. A change is never applied twice.
- **Test connection says "Not connected":** contact the administrator.
- **A page looks wrong:** **Earlier versions → Restore**. If the whole site is affected, the owner rolls back in Vercel (`FINAL-RELEASE-AND-ROLLBACK.md` §5).

## 7. Known limitations

- **Security:** credentials remain readable in public Git history.
  - The legacy Supabase keys were **still accepted** at the last check (15 Oct 13:03 UTC). Remediation was deferred by the owner on 15 Oct and the risk is open; see "Security" in the current status above.
  - The Main admin password has not changed since 12 Oct (check M3). The database password change is owner-reported and not independently verified.
- **Live-site checks** now cover pages, blogs, Elementor pages (Main / Enrollment / Both), approval, header/footer/menus, redirects, media, the popup, forms and scheduling (see the 19 October status). Courses, homepage lists, cities, tools and testimonials are verified on a copy of the site only.
- **Speed** (measured 13 Oct; not re-measured for this handover):
  - Main pages take 1.2–3 s to start loading.
  - **Tool pages (`/tools/…`) took 7.5–10.5 s.**
  - Release 11, now live, was designed to reduce this (tool pages about 6.2 → 1.9 s in the local model). Not yet measured on production.
  - A further step (function region) needs the owner's approval (O-4).
- **Enrollment homepage:** a section appeared twice after an Elementor edit on 12 Oct (O-3, reported 13 Oct; not re-checked for this handover). A ready correction is documented.
- **Scheduled times are in UTC.**

## 8. Support and recovery

| Need | Who / where |
|---|---|
| Access, connection, rollback, credentials | The site owner (Hostinger, Vercel, Supabase and GitHub account holder) |
| How to | `ADMIN-USER-GUIDE.md` |
| What was tested | `FINAL-ACCEPTANCE-TESTS.md` |
| Releases and rollback | `FINAL-RELEASE-AND-ROLLBACK.md` |
| Security | `FINAL-SECURITY-REPORT.md` |
| Open items and decisions | `FINAL-OPEN-ISSUES.md` |
| How publishing to Main, Enrollment and Both works, and what was verified | `FINAL-PUBLISHING-WORKFLOW.md`, `DESTINATION-GUIDE.md` |

**The handover set:**

| # | Document | For |
|---|---|---|
| 1 | `ADMIN-USER-GUIDE.md`, `ADMIN-QUICK-REFERENCE.md` | Editors: beginner's manual for every live screen, with each task labelled Production-verified / Local-only / Disabled / Unavailable / Unverified; one-page summary |
| 2 | `HOW-TO-PUBLISH.md` | Everyone: plain, non-technical steps |
| 3 | `REVIEWER-GUIDE.md` | Reviewers: approving, publishing, verification, rollback |
| 4 | `DESTINATION-GUIDE.md` | Main / Enrollment / Both: what each does, verification, failures |
| 5 | `WIDGET-COMPATIBILITY.md` | The widget classes, the rules, adding new widgets, the verified inventory |
| 6 | `FINAL-FEATURE-INVENTORY.md` | Every feature, where it is edited, what was verified |
| 7 | `FINAL-ACCEPTANCE-TESTS.md`, `TEST-RESULTS.md` | Test report with commands and results |
| 8 | `DEPLOYMENT-REPORT.md` | What is live, what is prepared, what a rollout involves |
| 9 | `FINAL-RELEASE-AND-ROLLBACK.md` | Backups and rollback, including approval-era rollback (§6) |
| 10 | `FINAL-SECURITY-REPORT.md` | Credentials, roles, typed code, third-party widgets (§3a) |
| 11 | `FINAL-OPEN-ISSUES.md` | Known issues and owner decisions |
| 12 | `FINAL-MAINTENANCE-GUIDE.md` | Plugins, Elementor licensing, updates, switches, routine tasks |
| — | `MAIN-MIGRATION-PLAN.md` | Inventory of Main addresses, architecture decision, production migration runbook |
| — | `MAIN-ROUTE-CHECKLIST.md` | All 314 production Main addresses with their migration target, live SEO facts and local evidence (site-wide migration run) |
| — | `MAIN-ACCEPTANCE-CHECKLIST.md` | The Main Website approval gate: each criterion, its evidence (PRODUCTION / STAGING / LOCAL) and what is still missing. Current verdict: not ready for approval |

**Live versions (checked 18 Oct 22:2x UTC):**
- Main: `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`), project `acadvizen-newww-ua9d`;
- Enrollment plugin: Acadvizen Master Admin **0.7.2** (package `acadvizen-cms-0.7.2-4f959ee`, sha256 `b8e30c92…`).

**Branch:** `headless-wordpress` at `4f959ee`, pushed. The working tree holds uncommitted work (plugin 0.7.3, exporter fix, new live-test tools, release scripts, docs). Committing it needs approval. Main's application code is unchanged, so no Main deployment is pending.

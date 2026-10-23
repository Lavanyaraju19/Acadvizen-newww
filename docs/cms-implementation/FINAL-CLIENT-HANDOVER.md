# Acadvizen central CMS: client handover (updated 21 October 2026)

## Status on 21 October 2026 (current; supersedes the sections below)

**Verdict: NOT READY.** Production is unchanged since 20 October, and on production 108 of 314 Main addresses are edited visually. A release candidate covering 310 of 314 addresses was built and checked on an isolated copy of production. It reaches the client only through owner-approved steps (end of this section). Release details: `RELEASE-REPORT-2026-10-21.md`. Every address: `MAIN-VISUAL-EDITING-INVENTORY.md`.

**What is live (read-only checks, 21 Oct):**
- **Enrollment:** Acadvizen Master Admin **0.7.4** (public readme "Stable tag: 0.7.4").
- **Main:** `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1`, with the Render Bridge **enabled**, as the owner instructed. Location pages answer with a WordPress render version; the other pages are drawn by Main.
- **Signed routes:** anonymous `/wp-json/acadvizen-cms/v1/manifest` and `/render` → 401 with `no-cache`.
- **Enrollment:** 58 of 59 addresses identical to the 15 Oct record; the one difference is the approved `/test/` unpublish.
- **No production change was made on 21 Oct:** no install, commit, push, deployment, cache purge, setting or content change.

**Prepared, waiting for approval:**
- **Plugin 0.7.6** (`dist/acadvizen-cms-0.7.6-worktree-c5b51b05c2a6/acadvizen-cms.zip`, sha256 `6356cd75…347fe52b`). It contains 0.7.5's two fixes:
  - signed error responses are never cached;
  - lost scheduled jobs are repaired from the manifest.
  It adds:
  - the Elementor editor shows Main pages with Main's own header and footer;
  - "Hide from search engines" is honoured on Main renders and in the sitemaps;
  - per-page design choice and the area-page fields.
  - **Proved in the copy:** cache headers 0.7.4 vs 0.7.6, job repair, and rollback 0.7.6 → 0.7.4 → 0.7.6.
- **The Main release-candidate bundle** `main-rc-20261021` (sha256 `1d795bc8…3d41638`):
  - homepage, 19 dedicated pages, 86 blogs and 67 tools with their shared designs;
  - 13 "-in-" city pages;
  - 13 area pages and 2 city course pages, with the area name, heading, introduction and a live "Nearby areas" list bound per page.

**Checked in the copy (21 Oct), against what www.acadvizen.com serves now:**
- **SEO and text:**
  - title, canonical, robots and description on all 310;
  - visible text on locations 108/108, -in- pages 13/13, area pages 13/13 and city course pages 2/2;
  - visible text on blogs 86/86, the homepage (145/145 lines), `/courses` (166/166) and `/placement` on phones (88/88).
- **Chrome:** only Main's header and footer on all 310; no Enrollment footer, popup, course bar or "ADMISSIONS OPEN" bar.
- **"Nearby areas":** identical to production on 13/13 area pages.
- **Layout:** desktop, tablet and phone, with no sideways scroll.
  - Known remaining differences: the alumni carousel on `/achievements` uses arrows instead of side tabs, page heights differ by 0–16%, and spacing differs slightly in places (inventory §2).
- **Real admin interface (copy, temporary admin):**
  - edit in Elementor → Publish (submits) → Approvals → Approve (administrator self-approval) → Publish approved revision → render job → the Main render shows the change;
  - shown for `/about`, `/tools` and the homepage;
  - shown for the shared "Tool page design" (one edit reached **67/67** tool pages and no other page);
  - shown for the "Area course page design" (**13/13** area pages, no other page).

**Security:** credential rotation remains **deferred by explicit client instruction**. The WordPress admin credential shared earlier and the legacy Supabase keys are still exposed, and that risk is not resolved. No secret appears in the code, documents or evidence.

**Waiting for the owner:**
1. **Install plugin 0.7.6** on Enrollment (Plugins → Add New → Upload → Replace current with uploaded); rollback with the 0.7.4 zip.
2. **Approve the cutover of each Main family** (homepage, dedicated pages, blogs, tools, -in- city pages, area pages). Each is imported as "waiting for approval", one page published and checked first, then the rest. Rollback per page or per family (inventory §4).
3. **Decide on `/companies`, `/internships`, `/resources`** (empty lists: stay on Main, or a list bound to Main's data after a Main release) **and `/blog/author/john-doe`** (placeholder author in the sitemap: remove on Main).
4. **Main fixes outside the CMS** (found by the 21 Oct crawl):
   - 8 links to tools without a record answer a noindex "Tool Details" page;
   - 5 tool logos (Framer, Carrd, Claude, Writesonic, QuillBot) are not images;
   - some tool logo addresses point to logo.clearbit.com, which no longer answers.
5. **Credential rotation** whenever the client allows it.

## Status on 20 October 2026 (superseded by 21 October above)

**Verdict: NOT READY.** The release work below is done and verified on production. The client's acceptance requirement is that **every** Main page be visually editable in the WordPress admin, and today that holds for 108 of 314 addresses (34.4%). The full inventory is `MAIN-VISUAL-EDITING-INVENTORY.md`. Completing it needs owner-approved production cutovers, listed at the end of this section.

**Live versions (checked 20 Oct 2026):**
- **Main:** Vercel project `acadvizen-newww-ua9d`, deployment `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`). The Render Bridge stays **enabled**, as the owner instructed.
- **Enrollment:** Acadvizen Master Admin **0.7.4**, installed 09:48:01 UTC.
  - Package: `acadvizen-cms-0.7.4-worktree-2cdb89872e37`, sha256 `14c1b94921c27da8e0b734cd5f85f38ad2ee759c0bd43364432e4b21211ca69f`, built reproducibly from the working tree.
  - 27 files: the same file list as 0.7.3, with 5 files changed (reviewed). 23 PHP files, 0 syntax errors, no secrets.
  - Only this plugin changed during the install.
  - Rollback: reinstall `acadvizen-cms-0.7.3-210db18` (sha256 `5d0aeeac…`) on Plugins → Add New → Upload → "Replace current with uploaded". 0.7.4 changes no database structure.

**What 0.7.4 fixed, verified on production:**
- **Signed routes no longer cached:**
  - anonymous `/wp-json/acadvizen-cms/v1/manifest` and `/render` → **401**, no LiteSpeed cache hit (09:48 and 11:14 UTC, after an hour of Main's real signed traffic);
  - signed manifest → 200 with no cache.
- **Main pages use only Main's own header, footer and popups:**
  - all 108 location pages contain the Main header (#8798), the Main footer (#8799) and the location design (#8800);
  - none contains Enrollment's footer #1799, popup #6147 or course bar (11:10 UTC).
- **The Approvals screen lists every waiting item:** 110 rows, including the team's #8516 and #8517.

**Found during the release, fixed in 0.7.5 (local only; installing it needs approval):**
- **Cached 404s:** a signed `/render` request for an address that is not live returned a 404 that LiteSpeed cached and then served to anonymous visitors.
  - Cleared with LiteSpeed **Purge All** at 09:50 UTC; "Purge By URL" does not match addresses with `?path=`.
  - 0.7.5 marks every response of the plugin's routes, errors included, as not cacheable.
- **Lost scheduled jobs:** the recurring jobs are also re-checked whenever Main asks for the manifest, so a job WP-Cron drops is repaired without anyone opening the admin.
- **Package:** `acadvizen-cms-0.7.5-worktree-a17a03213fd3`, sha256 `faba88a80466a825cebac5f61269f056ef0bdb839592d4103a610483997399f3` (only `rest.php` and the version changed against 0.7.4).

**The 108 location pages (imported once on 19 Oct; republished 20 Oct):**
- The 20 drafts moved to Trash on 19 Oct were restored (Trash → Restore).
- All 108 were submitted and approved, and published 10:36–11:03 UTC (the first page alone, checked, then the other 107).
- **Production verification, 11:09–11:12 UTC: 108/108 pass:**
  - status, title, canonical, robots, description, heading, own description, no other location's text;
  - Main header, served from WordPress;
  - compared with the pre-import baseline.
- **Appearance at 1440 and 390 px:** visually close to the original, not identical.
  - The page is about 150 px taller (spacing, footer link wrapping).
  - The theme's small "scroll to top" button appears at the bottom right. A one-line Main Website CSS rule hides it, but it is not applied without approval.
  - Hidden extras visitors do not see: "Skip to content", and the WordPress site title "enroll.acadvizen.com" inside a hidden header element.
- **Main crawl (11:26 UTC):**
  - the other 205 of 206 addresses are identical to the 18 Oct record; the remaining one timed out during the crawl and answered 200 on recheck;
  - the 108 location pages keep 100% of their original text.

**Both websites:**
- Production smoke test: **40 passed, 0 failed** (11:13 UTC).
- Enrollment: 58/59 baseline addresses identical; the one change is the intended `/test/` unpublish.
- No sideways scroll at 768 px and above; homepage links to unpublished pages: 0. The logo links to enroll.acadvizen.com.

**Enquiry forms (production, 10:37 UTC): 8/8.**
- Both forms refuse empty submissions, send to their endpoints (`/api/cms/leads` 200; `/wp-json/acadvizen/v1/enquiry` 201), show the confirmation, and store the entry.
- Two labelled test entries were created ("CMS ACCEPTANCE TEST 202610201037 - please ignore", example.com address); no real customer enquiry was sent.

**Local tests:**
- **0.7.5 (the working tree):** PHP 333/333; JavaScript 283/283; bridge scenarios **44/44**; approval suite 47/47.
- **Lifecycle scenario:** 5 runs × 8/8.
- **The intermittent lifecycle failure:**
  - **Cause:** WordPress keeps all scheduled jobs in one unlocked stored option, so a WP-Cron run that started before (de)activation can save back an older copy.
  - **Fix:** the test now waits up to 60 s and triggers the plugin's own repair; 0.7.5 also repairs jobs on every manifest request.
- **0.7.4 earlier today:** bridge scenarios 43/44, the failure being the timing race described above.

**Backup and recovery:**
- The designated backup set is Hostinger's weekly backup of **17 Oct 2026** (database dump completed 09:43:54).
- It was verified by three isolated restores (111/111 tables, WordPress serving pages).
- It is **not** a fresh 20 Oct backup: restoring it would lose every change since 17 Oct. Code changes are rolled back by reinstalling the previous plugin, and the import by Approvals (per page) or "Undo this import".

**Security:**
- **Credential rotation is deferred by explicit client instruction.** Two credentials are exposed and remain outstanding risks:
  - the WordPress admin credential shared earlier;
  - the legacy Supabase keys.
- No credential was changed, and no secret appears in this document, in Git or in the evidence.

**Test items on production (labelled, unpublished or kept):**
- Main leads `3a41e225`, `915005a0`, `da63da54`, `51a68cae`, and two Enrollment course enquiries;
- Elementor test pages #8402, #8416, #8430, #8444, #8646, #8672, #8679, #8697, #8712, #8727 (drafts);
- Main test pages and blogs; scheduled test pages `/cms-test-scheduled-202610182115` and `/cms-test-scheduled-202610190915`;
- media #8507.

**Waiting for the owner:**
1. **Install 0.7.5:** the cached-404 fix and job repair; rollback 0.7.4.
2. **Optional:** add `#ast-scroll-top{display:none!important}` to Main Website CSS (Master Admin → Design), so Main location pages have no theme scroll button.
3. **Full visual editing:** approve, family by family, importing the homepage, the 14 dedicated pages, blogs and tools as Elementor pages (each a production cutover, checked on a copy first). Also approve design and build of Elementor list templates for the data-driven pages (blog/tool lists, placements, city pages).
4. **Optional:** Hostinger's LiteSpeed route exclusion, blocked by Hostinger's 2FA on 19 Oct. It is no longer required once 0.7.5 is installed.

## Acceptance update of 19 October 2026, evening (superseded by the 20 October status above)

**Verdict: NOT READY.** This update supersedes any earlier statement below that suggests the Render Bridge or full-site Elementor editing on Main is currently accepted.

- Hostinger sign-in reached a suspicious-login 2FA challenge, but the browser remains on that challenge and the LiteSpeed controls are not accessible. No verification code was handled. WordPress remains publicly reachable, but the LiteSpeed cache toolbox previously returned 403. The already-authorized exclusion and purge of only `/wp-json/acadvizen-cms/v1/manifest` and `/wp-json/acadvizen-cms/v1/render` have not been performed. The latest body-discarding anonymous checks observed `/manifest` returning **200** with `Cache-Control: no-store, max-age=0` and `X-LiteSpeed-Cache: hit`; `/render?path=%2F` returned **401** with no cache-hit header. Until exclusions and targeted purge are completed and verified, a cache may bypass WordPress authentication.
- A read-only production smoke run reported **40 passed, 0 failed, 2 informational**. It observed **0 of 314** Main sitemap pages served with the WordPress CMS marker. This does not demonstrate full-site Elementor editing or publishing.
- Keep the Render Bridge disabled; do not assign routes or enable it until the cache/authentication risk, security review and end-to-end acceptance are resolved and the owner explicitly approves enabling it. Representative existing pages and templates, plus the complete route inventory, must pass before describing Main as fully Elementor-editable.
- The local 0.7.4 candidate passed **332/332 PHP tests**, **283/283 JavaScript tests**, and **24 PHP syntax checks**. Its reproducible local ZIP is `dist/acadvizen-cms-0.7.4-worktree-2cdb89872e37/acadvizen-cms.zip` (SHA-256 `14c1b94921c27da8e0b734cd5f85f38ad2ee759c0bd43364432e4b21211ca69f`); it has not been installed or deployed.
- The latest documented verified restore point is the 17 October database backup, restored in isolation with 111/111 tables passing checks. A fresh backup attempt on 19 October failed because SSH access was denied. The local August backup files are incomplete and are not a recovery point.

**Next production gate:** complete Hostinger's 2FA directly in the shared browser and reach the LiteSpeed cache controls; then apply only the two already-approved route exclusions and targeted purge, and verify anonymous manifest rejection without a cache hit and anonymous render rejection. Do not share the 2FA code, broaden the purge or change other production settings. A fresh verified database backup and a tested recovery plan are separately required before any installation, migration or route change.

## Main content import, 19 October 2026 (production; result: rolled back, waiting for plugin 0.7.4)

**Backups (designated by the owner: Hostinger's weekly set, 17 Oct 2026, in Downloads; originals untouched):**

| File | SHA-256 | Contents | Integrity |
|---|---|---|---|
| `u713346627_xDzzw.20261017093050.sql.gz` | `b2143d9f3e09df2d8788865276d49fc2c8d3932bfd5a515b2db7573a6108fec3` | **Production Enrollment database** (site address enroll.acadvizen.com), 111 `wp_` tables | gzip OK, "Dump completed 2026-10-17 9:43:54". **Selected** |
| `u713346627_od1Hd.20261017093050.sql.gz` | `c0e75462347dd1af753487de9e485fad9aec332c06176f37b9c9639a7c397dae` | Old staging site (cms.acadvizen.com), 109 tables | gzip OK, complete. A different database |
| `u713346627_kb4Ph.20261017093050.sql.gz` | `ec60b9f5023728cb534e0b764c5a558430422eaff0dbb2a589d465e2956e6594` | Small separate site (cms.acadvizen.com), 21 tables | gzip OK, complete. Not production |
| `u713346627.20261017093050.tar.gz` | `a10c7a54701b20438d6a33c8f659399d64b52b02e202b0f4aaea6e36c47c8b46` | Account files: Enrollment (45,351 entries incl. configuration and uploads), staging and preview sites | 95,443 entries, no errors. Its `.ssh` folder was never extracted |

**Restore tests:** xDzzw plus the Enrollment files were restored into an isolated, internet-less copy three times. Each time, 111/111 tables passed the check and WordPress served its pages. A load takes about 4 minutes. The copy was deleted afterwards and the deletion verified.

**Dry runs in the copy (×2, identical):**
- **Import:** 115 created, 0 updated, 0 skipped, 0 failed.
- **Publish:** 111 published.
- **Renders:** all 108 location renders matched live Main on title, canonical, robots, description, heading, own text and Main header.
- **Database:** +10.5 MB.
- **Enrollment:** 59/59 pages identical except one added Google Fonts stylesheet (Inter) from the shared kit; nothing visible.
- **Undo import:** removed everything the import created.

**Production import (exactly once):**
- **Bundle:** `main-20261019`, exported from live Main at 10:42–10:52 UTC. It holds the 108 location pages, the Main header and footer, and the location design. The homepage, other pages, blogs and tools were not included.
- **Import, 12:18:56–12:19:07 UTC:** 116 items processed. **Created 115, updated 0, skipped 0, failed 0.**
- **Publish, 12:42–13:07 UTC:** 111 items approved and published through Approvals (the 3 designs first, then 108 locations).

**Production verification of the 108 location pages, 14:23:55–14:26:09 UTC: 108/108 passed.**
- Status, title, canonical (including the existing MG Road exception), robots, description, heading, the page's own description and no other page's, Main header, served from WordPress.
- Report: `locations-after-import.json` in the engineer's evidence.

**Why it was rolled back:**
- **What visitors saw:** the screenshots showed Enrollment's own Elementor Pro footer (#1799, Publish To "Both") and popup (#6147) added to every imported Main page: a white "Overview · Course Program · our Mentors · Projects · Apply Now" bar.
- **Action:** the 108 pages were unpublished (kept as drafts) at 14:31–14:50 UTC.
- **Result, 14:51 UTC:** Main serves its own pages again, and 108/108 match the pre-import baseline. Main's code and deployment were never changed.

**Problems found during the import and fixed in plugin 0.7.4 (local, not installed):**
1. **LiteSpeed cache serves the plugin's signed data:**
   - LiteSpeed Cache cached the signed manifest as public for one week, overriding the plugin's no-cache header. As a result:
     - Main received a stale list of pages, and two pages did not appear until **Purge All** at 14:19 UTC;
     - an anonymous request still gets the cached manifest (`200`, `X-LiteSpeed-Cache: hit`; seen again 20 Oct 09:19 UTC; it is empty today).
   - **Fix:** the plugin calls LiteSpeed's own no-cache API.
2. **Enrollment's shared footer and popup appear on Main pages.** Once the Main Website has its own header and footer, Main renders use only Main-only headers, footers and popups. Enrollment is unchanged.
   - Isolated test: 0/108 renders contain #1799 or #6147, and 108/108 contain the Main header and footer.
3. **The Approvals screen listed only the newest 100 documents**, drafts included, so older waiting items disappeared. Today 20 of the imported drafts were moved to Trash (restorable) so the team's #8516 and #8517 show again.

**Local tests on 0.7.4:**
- PHP 332/332; approval suite 47/47.
- Bridge scenarios 43/44. The failing check is a plugin-lifecycle WP-Cron timing check, and a different one of the two fails on different runs (a known WP-Cron race with concurrent requests, as described in `publisher.php`).

**Current production state (20 Oct 2026):**
- **Main:** `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1`, serving its own pages (manifest empty).
- **Enrollment plugin:** 0.7.3.
- **Imported items in WordPress:**
  - the 3 Main-only designs are published (no effect without published pages);
  - 88 location pages are drafts and 20 are in Trash;
  - the menu and the kit colours/fonts remain.
- **Rollback of the whole import:** Master Admin → Import Main Website → **Undo this import**.

**To finish:**
1. **Approve plugin 0.7.4:** commit it, build the package and install it (rollback: 0.7.3).
2. Restore the 20 trashed drafts.
3. Re-approve and publish the 108 pages.
4. Purge LiteSpeed once.
5. Re-verify the 108 pages, anonymous access to `/manifest` (expect 401), both websites and the enquiry forms.

## Earlier production status on 19 October 2026 (superseded by latest acceptance update)

**Verdict:**
- **Everyday content work is live and verified end to end on production:**
  - Main pages and blogs;
  - Elementor pages to Main, Enrollment or Both, with approval, scheduling in India time, restore, and redirects.
- **Not complete:**
  - importing Main's existing content (the 108 location pages, tools, blogs and the page designs) is **blocked**, waiting for a fresh, verified database backup;
  - credential rotation is still open.

**One admin for both websites:** `https://enroll.acadvizen.com/wp-admin/` (Acadvizen Master Admin). No other CMS address exists or is used.

**Already in use:** on 19 Oct the client's team submitted two real changes for approval, "Performance Marketing Course" and "New Home". They were left untouched for the team's own reviewer.

**What is live (checked 19 Oct 2026, UTC):**

| Part | Live state |
|---|---|
| Main website | Vercel project `acadvizen-newww-ua9d`, deployment `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`, Render Bridge on), serving both `acadvizen.com` and `www.acadvizen.com`. Rollback target `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5` (`tools/release/enable-bridge.sh --undo`). Unchanged by this release (no Main code changed) |
| Enrollment website | Hostinger (LiteSpeed). **Acadvizen Master Admin 0.7.3**, installed 08:52:41 UTC (package `acadvizen-cms-0.7.3-210db18`, sha256 `5d0aeeac…`, from commit `210db18`); no other plugin changed (28 of 33 active, as before). Rollback: reinstall `acadvizen-cms-0.7.2-4f959ee` (sha256 `b8e30c92…`) on the same screen. Switches SITEMAP_CLEANUP, RENDER_BRIDGE, SITE_TEMPLATES and APPROVAL on; LOGIN_BRANDING off. Test connection: **Connected** |
| Site time zone | **Asia/Kolkata** since 09:14:47 UTC (was UTC+0). Stored times did not move |
| Code | Branch `headless-wordpress` at `210db18`, pushed |

**Capability status.**

The categories are:
- **L:** implemented and verified locally;
- **D:** deployed to production;
- **P:** verified end to end on production.
- **B:** blocked or not implemented.

All P results below are 19 Oct on plugin 0.7.3 unless dated otherwise. Every test item is labelled, kept out of search engines, and left unpublished (never deleted).

| Capability | Status | Evidence (UTC) |
|---|---|---|
| Main pages from the admin: draft not public, preview, publish, private changes, address clash, unpublish (kept as draft), noindex/sitemap | **P** | 17/17, 10:04 |
| Content API authentication and authorisation (signed requests, refusals) | **P** | 16/16, 10:01 |
| Blogs to **Main only** / **Enrollment only** / **Both** | **P** | 13/13, 10:05 / 14/14, 10:07 / 17/17, 10:09 |
| Elementor pages to **Main only**, **Enrollment only** and **Both**, each covering:<ul><li>draft and preview;</li><li>submit, self-approval and publish;</li><li>live at 1440/768/390;</li><li>working-copy change;</li><li>restore of the earlier version;</li><li>unpublish.</li></ul> | **P** | 58/58, 09:53–10:01 (test pages #8697, #8712, #8727, drafts) |
| Approval workflow, Both, covering:<ul><li>submit, approve exact revision, publish;</li><li>direct change refused;</li><li>working copy;</li><li>reject, resubmit;</li><li>restore;</li><li>unpublish.</li></ul> | **P** | 16/16, 09:46–09:51 (test page #8679, draft) |
| Administrator self-approval | **P** (allowed by design, marked "approved by the person who submitted it" in the history) | used in the runs above and for the homepage fix |
| Failure handling on production: a Both blog whose address Main already uses. Red message, no Enrollment copy, existing Main blog unchanged | **P** | 3/3, 10:10 |
| Failure handling that needs an outage (Main down, Enrollment copy failure, retry without duplicates) | **L** only: an outage cannot be caused safely on production | both-failure 12/12, main-down 3/3, conflict 9/9 (18 Oct) |
| Scheduled publishing in **Asia/Kolkata** (appears and is removed on time) | **P** | 7/7, 09:15–09:22. Entered 14:49 IST: public 4 s after the time, removed 3 s after |
| Main redirects (switched off/on, refusals for live pages, the admin, chains; cleanup) | **P** | 10/10, 10:12 |
| Header, footer, menus | **P** (18 Oct) | 17/18, 18 Oct 18:37 (the 1 failure is the test clicking twice; the copy happened) |
| Media upload | **P** (18 Oct) | 4/4, 18 Oct 18:47 (attachment #8507) |
| Main registration popup | **P** (18 Oct) | 5/5, 18 Oct 21:28 |
| Enquiry forms (Main and Enrollment) | **P** (18 Oct) | Enrollment 4/4, 18:42; Main 4/4, 18:43. Not repeated today, to avoid more test enquiries before the import |
| Render Bridge | **D, P** | live since 18 Oct 17:14 |
| Roles and permissions (Editor, Author, Contributor) | **L** (production has no Author or Contributor accounts) | 9/9 (18 Oct) |
| Courses, homepage banner and lists, city/service pages, tools, testimonials, SEO overrides | **L** | structured 56/56, homepage 14/14, courses 12/12, more-content 15/15 (18 Oct) |
| Plugin 0.7.3 (design-usage search 89 s → 1.45 s on production-sized data) | **D, P** | installed 08:52:41; the live runs above all ran on it |
| **Importing Main's existing content** (286 records, 9 designs, 464 images) | **L**; **B** on production | Measured on a copy of production (`DATABASE-CAPACITY-AND-CLEANUP-PLAN.md`). Blocked: no fresh backup could be taken (below) |
| **108 location pages** show their own description | **L**; **B** on production (needs the import) | Before the fix, 0/8 sampled pages showed their own text. After it, 108/108 on the production copy; the rule was checked against all 108 live Main pages (108/108) |

**Both websites compared with their baselines (19 Oct):**
- **Main:** 314/314 addresses identical to the 18 Oct post-release record (crawl 10:13–10:27; one address timed out during the crawl and was re-checked identical).
- **Enrollment:** 58 of the 59 addresses recorded on 15 Oct are identical (status, title, robots, canonical, Elementor). The one change is the intended `/test/` unpublish.
- **Production smoke test** (`tools/verify-production.mjs`): **40 passed, 0 failed**, 09:12.

**Enrollment decisions applied 19 Oct (owner approval):**
- **`/test/`** (page 2876, a September design draft) is now a **draft**: 404 to visitors and out of the sitemap (09:03). Its content is kept.
- **Homepage "Know More →" buttons** on the Nike, Spotify and Zomato case studies pointed to page 6342, the trashed old "Projects" page.
  - They now point to the live Projects page (`/projects-2/`, page 6412, which shows the same case studies).
  - Done through the approval workflow, 09:09–09:12; restorable from Approvals → Recent publications.
  - The visible text is identical, and the other 124 links are unchanged.
- **Enrollment logo** links to `https://enroll.acadvizen.com/`. It already did; no change was made.
- **Administrator self-approval** is allowed (see above).
- **Tablet and phone sideways scroll:** fixed on 18 Oct.
- **"Missing logos":** not reproduced. Those are carousel slides that load as they scroll in.

**Local regression:**
- **Full run, 18 Oct 21:29–22:19 UTC:** 924 passed, 0 failed across 19 suites; tsc 0 errors; lint 0 errors; production build OK.
- **On 0.7.3 (19 Oct):** unit 283/283, PHP 321/321, bridge 44/44, approval 47/47.
- **The Elementor live test with approval** (Main/Enrollment/Both + clash): local 61/61.

**Backup and recovery:**
- **Recovery point:** 17 Oct 09:43 (`u713346627_xDzzw.20261017093050.sql.gz`), verified.
  - Restored into an isolated copy in 2 min 40 s; 111/111 tables OK; WordPress booted and rendered the same pages.
- **A fresh backup could not be taken on 19 Oct:**
  - `tools/backup-enrollment.sh` was refused by the server at 08:57 UTC ("Permission denied (publickey,password)"). The SSH password stored on the engineer's machine is wrong, or SSH password sign-in is off.
  - The site has no backup plugin.
  - Because of this, **the Main-content import was not started**, as the owner required.

**Database storage (Hostinger showed 2,528 of 3,072 MB):**
- Importing Main's content needs about 35 MB now, and up to about 130–160 MB over time. It fits.
- The import matches every record by its key (or by the Main address it already serves), so running it again updates rather than duplicates. Import **once** anyway: a second run adds about 67 MB of history.
- The revision cleanup was simulated only: `DATABASE-CAPACITY-AND-CLEANUP-PLAN.md`.

**Security:**
- No password, key or token was changed, rotated or disabled.
- The WordPress credential shared earlier must be treated as exposed; it has **not** been rotated.
- The legacy Supabase keys were still accepted at the last check (15 Oct) and have not been re-checked.
- No secret appears in this document, in Git (the commit's own secret scan passed) or in the kept evidence. The isolated database copy was deleted, and the deletion verified.

**Hosting notes:**
- Only `acadvizen-newww-ua9d` holds the Main domains.
- Old projects `acadvizen-newww`, `acadviden-qfxs` and `acadviden` remain, along with a `cms` DNS record pointing at the old staging copy. None of them affects the live sites.
- Removing them needs separate approval.

**Waiting for the owner:**
1. **A fresh database backup:**
   - either hPanel → Backups → generate and download the Enrollment database backup (as on 17 Oct);
   - or correct the SSH password in the engineer's local `~/.acadvizen-production.env` yourself (never in chat).
   - Then the engineer verifies the backup, imports Main's content **once**, and checks the 108 location pages, both websites and the enquiry forms on production.
2. Credential rotation (WordPress admin, legacy Supabase keys), at a time chosen to avoid breaking integrations.
3. Optional, separately: revision cleanup; removal of old Vercel projects and the `cms` DNS record.

**Test items left on production (labelled, unpublished, not deleted):**
- **Leads and enquiries:** Main leads `3a41e225`, `915005a0`, `da63da54`, and one Enrollment course enquiry.
- **Elementor test pages (drafts):** #8402, #8416, #8430, #8444, #8646, #8672, #8679, #8697, #8712, #8727.
- **Main test pages and blogs** from 18 and 19 Oct (unpublished).
- **Scheduled test pages:** `/cms-test-scheduled-202610182115` and `/cms-test-scheduled-202610190915` (unpublished).
- **Media:** #8507.

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
6. **Scheduling:** "**Publish automatically on**" and "**Remove automatically on**", with Status **Published**. Times are **India time (Asia/Kolkata)**, the site time zone shown next to the field (since 19 Oct 2026; verified on production 7/7).
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
- **Scheduled times are in India time (Asia/Kolkata)** since 19 Oct 2026. Before that the site used UTC.

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

**Live versions (checked 19 Oct 2026):**
- Main: `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`), project `acadvizen-newww-ua9d`;
- Enrollment plugin: Acadvizen Master Admin **0.7.3** (package `acadvizen-cms-0.7.3-210db18`, sha256 `5d0aeeac…`); rollback package `acadvizen-cms-0.7.2-4f959ee` (sha256 `b8e30c92…`).

**Branch:** `headless-wordpress`, pushed (plugin 0.7.3 is commit `210db18`). Main's application code is unchanged, so no Main deployment is pending. Left uncommitted on purpose: the unused "Option C" files (`next.config.mjs` change, `wordpress/main-site/`, two planning documents) and local screenshots (kept out of Git by policy).

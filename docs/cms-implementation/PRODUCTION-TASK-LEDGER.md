# Production task ledger

This is the living list of every production task.

- **Updated:** 27 Oct 2026.
- **Production evidence:** the `PRODUCTION — …` labels below come only from the live websites. Local results are marked "local (supplementary)".
- **Starting point:** `PRODUCTION-AUDIT-2026-10-21.md`.

Status values: DONE · VERIFIED (production) · READY (built and tested, waiting for its gate) · BLOCKED (named dependency) · OPEN.

## Status on 23 Oct 2026, 17:40 UTC

| Gate | Status | Evidence |
|---|---|---|
| A Recovery | **ACCEPTED, WITH RESIDUAL RISK.** The 17 Oct backup set is verified and was test-restored on 19 Oct. No newer backup exists: SSH is not authorised, and hPanel needs the owner. Every change made since has its own undo: promote, plugin reinstall, Undo import, Restore or Draft. | A1 |
| B CMS | **VERIFIED IN PRODUCTION.** Plugin **0.7.7**: the media-in-use guard and imported image titles, on top of 0.7.6. Routes are 401 no-cache to anonymous requests; the enquiry route is intact; all other plugins are unchanged. | B5 and the incident table |
| C Content | **VERIFIED IN PRODUCTION.** **310/310** sitemap addresses are drawn by WordPress: 108 earlier, plus 202 migrated (blogs 86, tools 67, areas 15, cities 13, course 1, pages 20). The 4 Main-only pages are noindex and out of the sitemap. The 11 blog drafts are kept as drafts. Final crawl: 0 differences in status, title, canonical, robots or description against the 21 Oct record. | `evidence/production-20261023/main-crawl-final.json` |
| D Publishing | **VERIFIED IN PRODUCTION** for Main, Enrollment and Both: `verify-elementor-live` 58/58, `verify-approval-live` 16/16, and the stale-submission resubmit used on #11130. **NOT YET TESTED on production:** the Both partial-failure "clash" case (it needs the signing secret in the test's environment) and a fresh scheduling run (it passed 7/7 on 19 Oct). | D1 |
| E Integrity | **VERIFIED IN PRODUCTION.** Enrollment 58/59 identical to 15 Oct (`/test/` intended); Enrollment home documents unchanged; desktop, tablet and phone checks. Known differences are listed in the client manual, section 11. One **owner decision**: the Bangalore area placeholder block. | `evidence/production-20261023/` |
| F Deployment | **VERIFIED IN PRODUCTION.** Main `dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV` (`headless-wordpress@40f41a7`). Rollback: `bash tools/release/release-main.sh --undo`. | F1 |
| G Client readiness | **DONE.** `client-guide/QUICK-START.md` and `client-guide/OPERATING-MANUAL.md`, with 14 production screenshots (e-mails masked). | — |

**Still open:**
1. A fresh production backup (owner: hPanel, or authorise the `acadvizen-hostinger` SSH key).
2. The Bangalore placeholder block (owner decision).
3. `WORDPRESS_OWNS_PUBLIC_CONTENT` (owner decision: lock Main `/admin` for content WordPress now draws).
4. The Both partial-failure test and a scheduling re-run on production.
5. Commit and push the repository changes: plugin 0.7.7 source, release and migration tools, docs.
6. Rotate the shared admin account (used by both the team and the test runs) and the deferred credentials.

## Handover status, 27 Oct 2026

Record: [PRODUCTION-ACCEPTANCE-2026-10-26.md](PRODUCTION-ACCEPTANCE-2026-10-26.md). All times UTC.

### Completed and verified on production

| Item | Evidence |
|---|---|
| Correct Enrollment database backup (24 Oct 15:15), checksum, restore test | Q1 below; `evidence/backup-20261026/` |
| Plugin 0.7.10 live (direct publish for administrators, lost-check recovery, popups) | Q2–Q4 |
| Main release `dpl_JDZNEJ2c7UtvMBbc459sgYUdrpMj` and ownership lock `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` | Q6–Q7 |
| 18-item client demo: **18/18 PASS** | Acceptance §4 |
| #14 navigation editing: Contact title attribute set, live on Main in 171 s, Enrollment unaffected, restored. Menu identical to its original; pages back in about 5 min. Sweep 27 Oct 07:30Z: 0 of 310 Main addresses carry the hover text, all 310 answer 200 | `navigation-live.out`, `navigation/` |
| #16 failure and retry: failure reported with each website's reason, Main kept the previous version, Check again verified both in 56 s, page unpublished, redirect removed | `failure-retry-live-2.out` |
| LIVE suites: elementor 52/52, approval 16/16, scheduling 6/6, failure-retry 8/8 | `evidence/production-20261026/*.out` |
| Final regression (26–27 Oct): Main 320/320 identical to 23 Oct (sitemap 310, all drawn by WordPress); blog images 372/372; popup and dialog styles on the homepage; `/admin` 200; lock 423 (companies 401, leads 400: not locked); `/test/` 404; CMS API 401; enquiry route `POST` | `final-regression.txt` |
| Test pages: all labelled test pages are drafts and answer 404 on both websites; no test redirect left | Checked 26 Oct after each run |
| The team uses direct publishing: "New Home" and "demo" published by them 27 Oct 04:21–04:32Z (submit, approve, publish in one second) | Approvals history |

**Enrollment 58/59 identical to 23 Oct.** The 59th, `/mentors/`, now has the title "Mentors 1". That page is the team's own work ("Mentors 1" submissions 24 and 26 Oct; their publishing on 27 Oct), not a test change.

**Enrollment homepage outage, 27 Oct 06:51–08:29Z (found and fixed during the final check).**
- **Cause.** The team's own actions under the shared account (Approvals history, IST = UTC+5:30):
  - 04:21Z: Home1 (#6177) was unpublished;
  - 04:32Z: "demo" (#11892) was published and set as the homepage (Settings → Reading);
  - 06:51:25Z: **"Demo" was unpublished while it was the homepage**, so `/` answered 404;
  - 06:51:33Z: "Demo – Copy" was published over it, and Approvals correctly reported "Enrollment: Failed (HTTP 404)".
- **Not involved.** No test tool and no plugin step changed it: `apply_revision` never changes a page's status, and nothing in the plugin touches the homepage setting.
- **Fix (owner approved).** #11892 republished unchanged with Elementor → Publish at 08:29Z. `/` answered 200 in 2 s, and Approvals shows "Enrollment: Published (verified)" for the same approved revision `4dfd2da9e3fd`. The other 63 Enrollment sitemap addresses: 62 answer 200, and `/social-media-influencer-marketing/` is a Rank Math 301 to `/learn-digital-marketing/` (the team's redirect).
- **Left for the team.** The homepage's title is "Demo - Copy" (browser tab and search results); rename it in the editor.
- **Homepage guard.** A warning before unpublishing the page set as the homepage, and a refusal to publish a copy over an unpublished page, are proposed in `PROPOSAL-HOMEPAGE-UNPUBLISH-WARNING.md`. Not built.

### Final verification, 27 Oct 2026 (10:00Z)

Acceptance §6 has the details. Everything was read-only; no content, enquiry or lead was created.
- **Live versions:** Main `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` (Ready, production) and plugin 0.7.10 are still live.
- **Backup:** the checksum was recomputed and matches.
- **Administrator:**
  - the existing account (user #1, administrator, reviewer capability) is signed in and opens every CMS screen;
  - LIVE suites of 26 Oct cover editing, preview, the three destinations, scheduling, retry, approval, restore and unpublish.
- **Main:**
  - 320/320 addresses are identical to 23 Oct on status, sitemap, title, canonical, robots and description;
  - visible text is identical on 319/320 pages. The homepage differs only by the Quick Registration popup: without it, the text hash equals 23 Oct's;
  - blog images 372/372;
  - popup opens, closes, and nothing was submitted;
  - lock 423; leads and the other Main lists not locked;
  - in a browser, both homepages render at 1440 and 390 px with no page errors.
- **Enrollment:**
  - 56/59 pages identical to 23 Oct; the 3 differences are explained (homepage, `/test/`, `/mentors/`);
  - sitemap 64/65 answer 200; the 65th is the team's own 301.
- **Test content:** 54 test pages are drafts, and their 21 addresses answer 404 on both websites.
- **Not verified today:** signed-in use of Main `/admin`. Main's admin has its own sign-in, the saved sessions expired on 12 Oct, and no password was asked for. The Leads routes are verified intact (read 401, empty submission 400) and unaffected by the lock.

### Duplicate and test-content audit, 27 Oct 2026 (10:00–10:50Z)
Full record: [DUPLICATE-AUDIT-2026-10-27.md](DUPLICATE-AUDIT-2026-10-27.md).

**Removed: 76 items.** 75 went to the WordPress Trash (restorable for 30 days) and 1 test image was deleted (file kept); each record was saved locally first. The items:
- 54 labelled test pages and their archives;
- 17 test blog drafts (7 posts, 10 Main Blogs);
- #8512, a published 96 % copy of `/learn-digital-marketing/` hidden behind a 301;
- 3 empty abandoned drafts;
- 1 test image.

**Retained with a reason:** version archives, working copies, templated location pages, Main city/area pages, and the cross-site pages.

**Awaiting review: 9 groups (R1–R8).** The 5 pairs of published Enrollment pages, the retired homepages, the template drafts, 145 duplicate media copies, a canonical pointing at a 404, and the test blogs in Main's own database.

**Verified after the cleanup:**
- Main 320/320 identical to 23 Oct;
- Enrollment sitemap 64/64 answer 200;
- 0 broken internal links, 0 links to removed items;
- menus, redirects, homepage, popup, blog images 372/372, enquiry route, lock and queue all unchanged.

### Final completion, 29 Oct 2026 (28 Oct 19:20Z – 29 Oct 03:40Z): see FINAL-COMPLETION-REPORT-2026-10-29.md

| Item | Status |
|---|---|
| Backup | VERIFIED: latest existing set, 24 Oct 09:45:29Z (database and files). Checksums re-verified; restore-tested in an isolated container on 29 Oct. No fresh full backup: manual backups are locked; hPanel was not signed in. A content snapshot was taken 29 Oct 03:12Z (content only) |
| Working copy #9304 | DONE: no unique work; discarded to the Trash. New Home #8517 still in the Trash |
| Timeline image (media #743) | BLOCKED: the original exists in no backup, local folder or web archive. The team must re-upload it |
| Google Request indexing | BLOCKED: Google refuses sign-in in the automated browser. Owner step: URL Inspection → Request indexing |
| Main blog images, 86 posts | VERIFIED: 372 Enrollment images (439 in all), 0 failed, stable over 4 rounds; text identical. The lower counts came from the regression script's fetching, not reproduced, and nothing is missing |
| Both websites | VERIFIED: Main 319/320 metadata and text; Enrollment 57/59; sitemaps, robots, redirects, SEO heads, layouts at 3 widths, 6 popup buttons |
| Publishing workflow on 0.7.11 | VERIFIED: state machine 14/14; approval test (Both) all steps |
| Test artifacts | DONE: 0 outside the Trash |
| Home1 #6177 + copy #11884 | Information: trashed by the team, 29 Oct 02:10Z; not reversed |

### Production repair, 28 Oct 2026 evening (11:50Z – 29 Oct): see FINAL-REPORT-2026-10-28-EVENING.md

The 10:35Z "CLIENT-READY" state below did not hold through the afternoon. These changes and findings came afterwards; all fixes are verified on production.

| Item | Status |
|---|---|
| **Yoast SEO** activated next to Rank Math (after 10:18Z; all plugins had been deactivated and reactivated within the week). It broke titles and canonicals on both websites, and caused the Google "Demo - Copy" title | VERIFIED: Yoast deactivated (owner approved); titles and canonicals back to Rank Math on both websites; Main 319/320 identical to the 23 Oct baseline |
| Homepage #11892 titled "Demo - Copy" | VERIFIED: WordPress title "Home" via the CMS (owner approved, together with the team's carousel spacing tweak −0.4 → −0.5) |
| "Published page shows Draft" | VERIFIED: plugin **0.7.11** (working-copy status badge, list labels, identical copies not listed). Live state-machine test on production |
| "New" #9304 published 4× into the trashed New Home #8517 (each check failed) | VERIFIED: 0.7.11 refuses this; New Home stays in the Trash |
| Five buttons opening the never-published popup #2941 did nothing; the 27 Oct audit wrongly called #2941 unused | VERIFIED: #2941 restored to Draft; buttons now open #7696 (owner decision); each clicked live |
| Layout "changed after cleanup" | VERIFIED: no regression. The merged pages are identical to the chosen designs; the only difference is the removed "Courses 1"/"Career 1" title bar |
| LiteSpeed Do Not Cache URIs for sitemaps | VERIFIED: set (owner approved); sitemaps answered `no-cache` |
| Old addresses `/career/` (landed on the Mysore page) and `/paternship/` (404) | VERIFIED: Rank Math 301 to `/digital-marketing-jobs/` and `/partnership/`; one hop each |
| Session cookie printed by a test tool's error output | DONE: session signed out (cookie verified invalid); text removed; tools print first lines only |
| Google re-crawl of the homepage | OPEN (owner, Search Console): URL Inspection → Request indexing |
| Fresh database backup | OPEN (needs hosting access); latest verified backup is from 26 Oct |

### Final handover, 28 Oct 2026 (08:28–10:35Z): CLIENT-READY
Full report: [FINAL-HANDOVER-REPORT-2026-10-28.md](FINAL-HANDOVER-REPORT-2026-10-28.md).

**Done today:**
- "Mentors" and "Career" titles restored on the original pages;
- "Project 1" (placeholder text, published by mistake) unpublished, with a 301 to `/projects-2/`;
- 45 leftover working copies trashed;
- the Enrollment sitemap 404 fixed (permalinks re-saved, the three sitemap addresses purged from LiteSpeed).

**Live tests:**
- design test: Main, Enrollment and Both all passed (37/37 on the re-run, plus the Main journey);
- approval test 16/16;
- full regression clean;
- Main `/admin` and Leads verified signed in;
- PHP 359/359, JS 318/318, secret scan clean.

**Root cause of the duplicates: operational, not a code defect.** Publish only submitted for approval before 0.7.9, so new pages were created and WordPress silently suffixed their addresses. Prevention: 0.7.9's direct publish, the working copy linked by page id, Main's 409 / replay protection, and the "edit, don't duplicate" guidance.

**Open:** one LiteSpeed setting (do not cache the sitemap addresses). It needs the owner's authorization; the environment refused the change.

### Final completion, 28 Oct 2026 (19:00Z 27 Oct – 07:45Z 28 Oct)
Evidence: `evidence/production-20261028/` and `evidence/production-20261027/partner-carousel.out`, `media-delete.out`.

**State:** Git `66f9225` = origin; Main `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` (Ready); plugin 0.7.10. No code release: no code defect was found.

**Done (PASS):**
- **Partner carousel, 38/38 pages.** No missing Uber/PwC files, and the restored Zomato logo is present.
  - Live HTML checked on all 38.
  - In a browser at 1440 and 390 px: 8 slides, 8 logos loaded, 0 broken, no page errors, order kept.
- **#8516 "Performance Marketing Course"** published together with its page's carousel fix.
  - Verified unchanged since review (pending since 19 Oct, design identical to the reviewed export; the live page untouched since 12 Oct).
  - Live: the reviewed "Course Overview" text is shown and the wrong "45 Days" text is gone. The approval queue is now empty.
- **Duplicate images: all 48 deleted.**
  - The 25 remaining files were re-scanned on a fresh export, and all 25 were still unreferenced.
  - Each file and record was saved first; all 48 are also in the 24 Oct backup.
  - All 48 now answer 404; all 46 kept identical copies answer 200.
- **Full regression:**
  - Main: 320 addresses, 319 identical to 23 Oct + 1 intended (MG Road canonical); 310 drawn by WordPress.
  - Enrollment: 56/59 identical + 3 explained; sitemap 59/59 answer 200.
  - Sitemaps: no duplicates. Exact duplicate bodies: 0.
  - Blog images 372/372.
  - Routes 9/9 checks (admin, lock, Leads, lists, signed API, enquiry route, `/test/`).
  - Internal links: 242 targets from 369 pages, 0 broken.
  - Menus 4/4 clean.
  - Browser checks: 10 views plus the popup.

**Tool fixes during the run** (no effect on the websites):
- the page loop now records a page that cannot be opened twice and carries on;
- the save command has a 3-minute limit, so a hung save becomes a retry;
- a browser profile built during the outage cached broken scripts and was deleted;
- `tail -f` does not see appends from another process on this machine, so progress was read by polling the file.

**Resilience seen in practice:** network drops interrupted edits several times. In every case the change waited in the page's single working copy (not published, not lost), and the next run published it. No duplicate pages were created.

### Master production pass, 27–28 Oct 2026 (13:55–19:15Z)
Details: audit §8; matrix §7; acceptance §6.7.

**Verified state:**
- Git `ffcb299` before this pass;
- Main `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` (Ready);
- plugin 0.7.10.

No code release was needed: every fix was content, made through the normal workflow.

**PASS:**
- **Design test (`tools/verify-design-live.mjs`, 53/53).**
  - Main, Enrollment and Both: real Elementor editor; Publish and Update clicked on Elementor's top bar.
  - Measured in a fresh browser at 1440 and 390 px: typography, colours, padding, responsive layout, button, image.
  - Update kept the page id and address; a double Update made no duplicate.
  - Noindex, outside the sitemaps, linked from no menu.
  - Unpublished and trashed afterwards.
- **Five page pairs merged (owner decision):** the originals carry the new designs (100 % match; SEO kept); the "-1" addresses 301 to them.
- **Enrollment homepage SEO:** title, description and focus keyword, approved earlier on Home1, now on #11892.
- **Template drafts #5901, #2941, #383, #9207** trashed (no dependencies).
- **Zomato logo** restored at its original address (fixes 38 pages).
- **Focused regression** after the changes.

**Not finished:**

| Item | State | To finish |
|---|---|---|
| Uber/PwC carousel slides | 13/38 pages done; 25 remain, plus #3876 (with #8516) | Run `PROFILE_DIR=<dir> PAGES=6849,6857,6864,6904,6912,6917,6932,6939,6946,6971,6977,6982,6991,6996,7001,7005,7013,7045,7050,7055,7063,7617,7631,7676,3876 WP_STORAGE_STATE=<session> node tools/fix-partner-carousel-live.mjs` on a working connection. #3876 publishes #8516 (reviewed: approve) |
| 25 duplicate images | 23/48 deleted (backed up; the kept copies load) | The owner permits this environment to continue permanent media deletion, then `APPLY=1 … node tools/delete-duplicate-media-live.mjs` (it skips the 23 already deleted) |
| Full 375-page regression | Focused regression only | Re-run `final-27.mjs` and `dup-content.mjs` on a working connection |

**Blocker:** from 17:00Z the local connection fell to 26–64 KB/s, with drops and DNS failures (a cold editor load took more than 15 minutes). The websites answered normally.

### Duplicate audit stage 2, 27 Oct 2026 (11:00–12:10Z)
Details: audit §7.

**Done (all reversible):**
- **R7 fixed:** the canonical of Main `/social-media-marketing-course-in-mg-road` is now its own address, published through the normal workflow and verified (revision `73c0ef876568`).
- **R8:** 10 Main test blogs went to Main's own trash, via the Master Admin.
- **Trashed:**
  - 4 orphan working copies: #11935, #11894, #8533, #11850;
  - 4 empty template drafts: #958, #189, #9199, #9198;
  - the sandbox copy "Test" #2876 (all its text is live on `/placement-2/`).

**Media scan:** 160 duplicate files are in use and 48 are safe to delete (list in appendix A). Deleting them waits for a fresh backup.

**Owner or team decisions:**
- R1: per Enrollment page pair, which design? The original address stays canonical; the "-1" page gets unpublished with a 301.
- R2: keep Home1 #6177 as the way back? Is New Home abandoned (its live page is in the Trash)?
- R5: four template drafts with content.
- R6: a fresh backup, then delete the 48 media files.

**Checked after the changes:**
- Main 319/320 identical to 23 Oct (the one difference is the canonical fix);
- Enrollment sitemap 64/64 answer 200;
- 0 broken links; menus, redirects, popup, images, enquiry route, lock and queue unchanged.

**Security:** the exposed WordPress session was signed out.

### 1. Completed and production-verified
Everything in the "Completed and verified on production" table above, plus the 27 Oct final verification.

### 2. Supported, not fully tested
| Item | Note |
|---|---|
| 336 Elementor widgets marked "Works" but used by no Main page yet | Drawn by the same Elementor; check each in the Main preview before first use (matrix §2) |
| 8 widgets that work with a reviewer check (search, sitemap, post lists, Code Highlight, Hostinger Reach, Max Mega Menu) | Matrix §2 |
| Signed-in use of Main `/admin` after the 26 Oct lock | Route checks pass; a sign-in check needs Main's admin login |

### 3. Accepted limitations (documented, not defects to fix now)

| Limitation | Where documented |
|---|---|
| Hosting backups are weekly; manual backups are locked on the current Hostinger plan. The verified backup does not contain changes after 24 Oct 15:15 and must never be restored over the live website | Manual §10b |
| Elementor widgets: 79 refused on Main (shop, cart, login run on Enrollment only) | Matrix §2 |
| Small visual differences recorded at migration: `/blog` "SEP" dates, `/achievements` carousel arrows, homepage video controls, no `<h1>` on location pages, 3 over-long blog categories | Manual §11 |
| A change to a shared header, footer, menu or design redraws every Main page. Each page updates within minutes; the whole site takes longer | Manual §9 |

### 4. Client / team content decisions

| Item | Owner | Action |
|---|---|---|
| Enrollment homepage title "Demo - Copy", and no meta description | Client / team | Choose the title, then rename #11892 or set its Rank Math title, and Publish. No approved title is on record. Until 27 Oct, Home1's title was "Digital Marketing Course in Bangalore with AI \| Acadvizen" |
| #8516 "Performance Marketing Course": the only waiting item (19 Oct; typed HTML) | Team | A reviewer with code rights checks the code, then approves and publishes or rejects. Approved: 0, scheduled: 0 |
| 3 missing logos on `/learn-digital-marketing/` (`zomato-1.png`, `uber-1.png`, `pwc.png`; already absent in the 24 Oct files backup) | Team | Re-upload and reselect them in the page design |
| Bangalore "Feature title" placeholder block (Manual §11) | Owner | Keep omitted, or supply the text |

### 5. Future enhancements (not required for handover)

| Item | Where |
|---|---|
| Warning before the homepage is unpublished; refuse a copy published over an unpublished page | `PROPOSAL-HOMEPAGE-UNPUBLISH-WARNING.md` |

### 6. Genuine technical blockers
**None.**

### Not required
| Item | Status |
|---|---|
| Personal WordPress accounts | **NOT REQUIRED.** The agreed setup uses one existing Administrator account, which is sufficient. No account was created and no permission changed |

## Production completion, 26 Oct 2026

Full record: [PRODUCTION-ACCEPTANCE-2026-10-26.md](PRODUCTION-ACCEPTANCE-2026-10-26.md). All times UTC.

| # | Item | Status | Result |
|---|---|---|---|
| Q1 | Correct Enrollment database backup | **DONE** | Downloaded from hPanel after the owner's sign-in (Cloudflare and email code by the owner; no credential handled by us): `u713346627_xDzzw` backup of **24 Oct 15:15** (newest; weekly backups, manual ones locked on the plan) to `C:\Users\HP\Downloads\acadvizen-backup-20261026\`. sha256 `b9f1a0fb888fc8b83e6de8a9fc3228d71aaee5dbf0b9703163a8112648a1dad9`, gzip OK, dump complete, 111 tables. Restore-tested in a network-less throwaway MariaDB (307 s, exit 0; content matches live), container removed |
| Q2 | Plugin 0.7.9 | **LIVE** 08:03Z | Guarded install PASS. Contact's stuck "Publishing" became "Published (verified)"; 23 other lost checks were resumed and verified; the popup is back on the homepage |
| Q3 | Plugin 0.7.10 | **LIVE** 08:26Z | The popup opened as a block at the bottom of the page: Elementor's dialog styles were not linked on Main pages. 0.7.10 links them. Also: an administrator's explicit "Pending Review" stays a submission. Guarded install PASS (rollback 0.7.9) |
| Q4 | Popup verification | **PASS** | Overlay at 1440 and 390 px after ~96 s, closes, no errors; only on the homepage |
| Q5 | Production acceptance | **PASS** | elementor-live 52/52, approval-live 16/16, scheduling-live 6/6; SEO 320/320 vs 23 Oct; Enrollment 59/59; blog images 372/372; Main-only pages noindex; enquiry route `POST`; API 401 |
| Q6 | Main release | **LIVE** `dpl_JDZNEJ2c7UtvMBbc459sgYUdrpMj` (`b804b34`) 12:06Z | Main retries a quick WordPress refusal once: single 503s were seen during the site-wide redraw and stopped three control checks. The inventory tool also asks a 503 once more, recorded as `retried_503`. 310/310 identical after the release |
| Q7 | Ownership lock | **LIVE** `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` 12:51Z | `WORDPRESS_OWNS_PUBLIC_CONTENT=true`: pages 423; companies, internships, resources, authors 401; leads 400; `/admin` 200; 310/310 identical. Script fix: curl could not write to /dev/null with path conversion off (exit 23); probes write to the run folder |
| Q8 | Team activity, not touched | **RECORDED** | 26 Oct 05:51–07:17Z (11:21–12:47 IST), shared account: submissions of New Home, Mentors 1, About Us, Project 1; the live "New Home" removed by them at 06:48Z. Waiting items unchanged by us |
| Q9 | Open | see 27 Oct | #14 and #16 were completed on 26 Oct (see 27 Oct). Personal accounts: NOT REQUIRED (one existing Administrator account) |

## Final production completion prompt, 25 Oct 2026

Overall: **PARTIALLY COMPLETE.**

- **Production was not changed on 25 Oct.** All production work was read-only. The supplied database backup is not the Enrollment database, so the backup gate is not met.
- **Ready locally:** plugin **0.7.9**, which fixes the three causes of "Publish does not publish" found on production (`REQUIREMENT-CAPABILITY-MATRIX.md` §5a), plus the 0.7.8 menus.

| # | Item | Status | Result |
|---|---|---|---|
| N1 | Files backup `u713346627.20261024094529.tar.gz` | **VALID** | 3,827,657,355 bytes; sha256 `d404585a39bd1d27e89af3aa4e6cbd67c3aca63e3a1bb1191a453250b474b416`; every entry read (tar exit 0), 99,090 entries; newest file 24 Oct 15:16. Holds `enroll.acadvizen.com/public_html` (wp-config names database `u713346627_xDzzw`; 8,569 upload entries; Master Admin 0.7.7, all 28 files byte-identical to the rollback package `32cc3050…`). Not extracted over anything; only single files were read into a scratch folder, and the config copies were deleted. |
| N2 | Database backup `u713346627_kb4Ph.20261024094529.sql.gz` | **NOT USABLE FOR ENROLLMENT** | 30,097 bytes; sha256 `b789e4441c95daa8297792deab781e173f37da4db44b8ed4f193586442608178`; gzip OK, "Dump completed on 2026-10-24 9:47:39". It holds database `u713346627_kb4Ph`: 21 tables, `siteurl` `https://cms.acadvizen.com`, theme Twenty Twenty-Five, Hostinger plugins only. The Enrollment database is `u713346627_xDzzw` (111 tables on 17 Oct). **Owner:** hPanel → Backups → Databases → `u713346627_xDzzw`, 24 Oct (or newer) → download into Downloads. |
| N3 | Production baseline (read-only) | **RECORDED** | Main `dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV` Ready; plugin 0.7.7. Main sitemap 310; **320/320** addresses identical to 23 Oct in status, title, description, canonical and robots (23 timed out in the crawl and were rechecked directly: 200, drawn by WordPress). Enrollment 58/59 identical (`/test/` 404, noindex). The 4 Main-only pages are noindex and out of the sitemap; Main `/admin` 200; the enquiry route is `POST /acadvizen/v1/enquiry`; the plugin API answers 401 to anonymous requests. **All 372 WordPress images on the 86 live blog posts load (200).** The 310 Main pages use 11 Elementor widget types. |
| N4 | "Publish does not publish" | **ROOT CAUSES FOUND; FIX READY (LOCAL)** | P1: Publish only submits, and none of the team's 35 submissions on 24 Oct was approved. P2: a lost background check left `/contact` at "Publishing". P3: the Quick Registration popup is never shown because Pro's conditions cache is stale. Fix in plugin 0.7.9; see the matrix §5a. |
| N5 | Plugin 0.7.9 | **READY (LOCAL)** | Package `dist/acadvizen-cms-0.7.9-worktree-c7ec89e8ac0e` sha256 `5e1cd1a2…`, 28 files byte-identical to source. `plugin-release.json`: release 0.7.9, rollback 0.7.7 (identical to the plugin in the 24 Oct files backup). LOCAL tests, all passing: PHP 359/359, JS unit 312/312, direct-publish 11/11, approval 47/47, reliability 38/38, scheduling 7/7, Both failure 12/12. Secret scan: none. **Install gated on N2.** |
| N6 | Waiting queue on production | **RECORDED, NOT TOUCHED** | 9 waiting, all Enrollment, submitted by the shared account 19–24 Oct: #11453 Mentors 1, #11521 Career 1, #10936 Courses 1, #11011 Placement 1, #11457 Mentors, #11415 Branches, #11007 Partnership, **#9304 New Home**, **#8516 Performance Marketing Course**. #8517's edit screen redirects (302) to its working copy. Contact (Main) shows "Publishing" since 23 Oct but is live (render v7). None was approved, changed or removed by us. |
| N7 | Push | **DONE** | 25 Oct: `git push origin headless-wordpress`, `40f41a7..faeb17b` (e1b82ff, 40729e6, f108662, f715c73, faeb17b), normal push, no force. |
| N8 | Production acceptance, the 18-item demo, Both partial failure, accounts | **BLOCKED** | Gated on N2 (and, for the partial failure, the signing secret; for accounts, owner-approved names). |

## Final master implementation prompt, 24 Oct 2026

Overall: **PARTIALLY COMPLETE.**

- **Implemented and verified:** Elementor-to-Main visual control (Render Bridge, PRODUCTION), and everything below except the gated rows.
- **Not done:** the backup, push, 0.7.8 install, ownership lock, scheduling re-run, production partial-failure test and accounts. They wait for the fresh backup, owner permissions or owner details. **Nothing was changed on production on 24 Oct**: only one read-only screen read.

| # | Item | Status | Result |
|---|---|---|---|
| M1 | Custom dashboard out of the editing workflow | **READY (LOCAL), plugin 0.7.8** | Content types are normal top-level menus (Main Blogs with Blog Categories, Courses, Locations with Cities & Areas, Tools, FAQs, Testimonials). The plugin menu "Approvals & Publishing" opens Approvals. The overview page is unlisted but its address works. 9 links that duplicated standard WordPress, Rank Math, Elementor and UAE screens are gone. LOCAL: all screens 200; screen hook names unchanged (`acadvizen-master-admin_page_…`), so the stall repair still runs on Publishing. PHP **356/356**, lint clean. Package `dist/acadvizen-cms-0.7.8-worktree-de4acc818b53` sha256 `97cfea45…`, 28 files byte-identical to source; only `acadvizen-cms.php`, `includes/admin.php` and `readme.txt` differ from 0.7.7. `plugin-release.json`: release 0.7.8, rollback 0.7.7 (`32cc3050…`, the installed package). **Install gated on the backup.** |
| M2 | Elementor feature inventory | **PRODUCTION (read-only)** | Widget compatibility screen read with the owner's session: 437 widgets. On Main: 347 work, 8 work with a reviewer check, 3 typed code, 79 refused (WooCommerce, ShopEngine, Login). On Enrollment: 434 work. `evidence/production-widget-inventory-20261024.json`; summary in `REQUIREMENT-CAPABILITY-MATRIX.md` §2. |
| M3 | Requirement-to-capability matrix; publication contract | **DONE** | `REQUIREMENT-CAPABILITY-MATRIX.md` §3–§4. |
| M4 | Both partial failure | **LOCAL PASS; production BLOCKED** | Local A9 and `both-failure-acceptance` 12/12. Production needs the signing secret in the test environment; it was not extracted. |
| M5 | 3 over-long blog categories | **RECHECKED: no change needed** | Not shown publicly on either version of the three posts, nor on `/blog`. Main's category pages read Main's own database and are unchanged. Nothing was truncated. `REQUIREMENT-CAPABILITY-MATRIX.md` §5. |
| M6 | Push of `e1b82ff`, `40729e6`, `f108662` and the 24 Oct commit | **BLOCKED** | Owner authorised the push, but the command safety check refused `git push origin headless-wordpress` twice. It needs the allow rule `Bash(git push origin headless-wordpress)`, or the owner pushes. |
| M7 | Backup gate | **BLOCKED (owner)** | As in row 1 below. |

## Final handover directive, 23 Oct 2026, 17:50–18:20 UTC

| # | Task | Status | Evidence / blocker |
|---|---|---|---|
| 1 | Latest backup | **BLOCKED: owner action** | Newest available: the Hostinger set from **17 Oct 2026 09:30**, in `Downloads`. It holds the Enrollment database `u713346627_xDzzw.20261017093050.sql.gz` (sha256 `b2143d9f…`, gzip OK, "Dump completed", 111 tables, test-restored 19 Oct) and the account files `u713346627.20261017093050.tar.gz` (3.55 GB). The folder `Acadvizen-Private-Backups` holds older sets (14–15 Oct). It does **not** cover anything since 17 Oct (plugin 0.7.6/0.7.7, the 202 migrated pages, about 650 images). A fresh backup is not possible from here: the SSH key `acadvizen-hostinger` is refused again (17:52Z), and no key or password was changed. **Owner:** hPanel → Websites → enroll.acadvizen.com → Files → Backups → generate and download the database (`…_xDzzw`) and the files backup into `Downloads`; I then verify checksum, gzip, table count and a test restore. |
| 2 | Bangalore area page | **COMPLETE** | Live: 200, drawn by WordPress, no "Feature title", "Feature description" or "Why choose us"; canonical self, `index, follow`, in the sitemap. |
| 3 | `WORDPRESS_OWNS_PUBLIC_CONTENT` | **PREPARED; NOT APPLIED** (gated on 1, on the push, and on an allow rule) | Inspection found the lock would also have blocked the Main admin screens for `/companies`, `/internships`, `/resources` and blog authors/categories/tags (generic `entities` writes). **Fixed** in commit `40729e6`: those tables stay editable; leads were never locked (`/api/cms/leads`). Unit 312/312. Script `tools/release/set-content-ownership.sh <live id>`: it adds only this variable, redeploys, compares every address, probes (anonymous POST `/api/cms/pages` → 423; companies, internships, resources, authors, leads ≠ 423) and rolls back automatically. Probes today, lock off: pages 401, companies 401, leads 400. **Order:** backup → push → release `40729e6` with `release-main.sh` → `set-content-ownership.sh`. |
| 4 | Git | **COMMITTED LOCALLY; NOT PUSHED** (awaiting owner approval) | `e1b82ff`: 40 files, plugin 0.7.7 source (rebuilt package sha256 = installed `32cc3050…`), tools, tests, docs. `40729e6`: 3 files (ownership fix, test, script). Plus a docs commit for this update. Excluded: `next.config.mjs` (Option C hunk), `wordpress/main-site/`, the Option C docs, all PNG screenshots, evidence result files, `dist/`. Secret scan: none; `git diff --check` clean; repository hook "No secrets found". Unit 312/312, PHP 354/354, plugin PHP lint 0 failures. |
| 5 | Individual accounts | **NOT REQUIRED** (decided 27 Oct: one existing Administrator account). Was: documented; creation blocked | Users: 2 accounts, both Administrator (one shared by the team and the test runs). Implemented roles: Administrator, **Reviewer (approves publishing)** (plugin role: editor + approve/publish), Editor, Author, Contributor. Manual §10a: how to add people, change passwords, log out other sessions. No credential was changed. |
| 6 | Both partial-failure test | **BLOCKED** | It creates test content on production, so it waits for the fresh backup (directive rule 4). It also needs the signing secret in the test's environment, which was not exported from the private env file; nothing was bypassed. |
| 7 | Scheduling test | **BLOCKED** (gated on 1) | Last production result: 7/7 on 19 Oct 2026. |
| 8 | Final verification (read-only parts) | **COMPLETE for what needs no change** | Main `dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV` Ready; final crawl 17:2xZ: 310/310 sitemap addresses 200 and drawn by WordPress, 0 differences in status, title, canonical, robots or description against 21 Oct; the 4 Main-only pages 200, noindex, not in the sitemap; Enrollment 58/59 identical to 15 Oct (`/test/` intended); Main `/admin` 200; Enrollment `wp-login` 200; plugin 0.7.7; enquiry route present; `/manifest` and `/render` 401 no-store; env names present, ownership variable not set. Queue: #8516 (stale since 19 Oct), #10936, #11007 pending, untouched. **#9304:** last seen pending, untouched, 22 Oct 15:19Z; it left the queue by 23 Oct 15:35Z through the team's own action. The publish records of all 9 batches show the tools never acted on #9304, #8516 or #8517. |
| 9 | Ledger and guide | **COMPLETE** | Manual: new §10a (users, roles, passwords, sessions), §10b (backups, never restore over live), §10c (Main's own admin and the prepared lock). |

### Backup routes investigated, 23 Oct 2026, 18:37–18:55 UTC (no key, password or setting changed)

| Route | Result |
|---|---|
| Newer backup files on this computer | None. The newest is still Hostinger's 17 Oct 09:30 set; it does **not** cover the current production state and must never be restored over it. |
| SSH key `acadvizen-hostinger` (existing, unchanged) | Refused by the server (`Permission denied (publickey,password)`); not worked around. |
| Saved Hostinger browser session | None usable. hPanel shows Cloudflare's "Performing security verification" human check; not bypassed. |
| Hostinger API or automation | None configured. The private env file has only the hPanel login, and signing in with stored passwords is refused by the Claude Code safety classifier. |
| Hostinger plugins in WordPress (Hostinger, Hub, Tools, Reach) | No backup feature. The "Secure Backups" menu entry only advertises installing the Duplicator plugin; installing a new plugin on production before a backup would be an unreviewed production change, so it was not done. |
| Documented workflow (operating manual §10b) | hPanel → Websites → enroll.acadvizen.com → Files → Backups, with the owner signed in. **A sign-in window was reopened 18:4xZ for the owner** (Cloudflare check and 2FA need a person). |

Also verified on 23–24 Oct: the committed plugin source (`e1b82ff`) and the installed 0.7.7 package have identical contents (28/28 files byte-identical; the archive bytes differ only by entry timestamps, because the build stamps the latest plugin commit's date). Unit 312/312, PHP 354/354, plugin lint 0 failures. The 3 commits sit directly on `origin/headless-wordpress` (3 ahead, 0 behind), with no excluded files and no secret patterns. **Push, ownership lock and the production tests wait for the fresh backup**, as the directive requires.

## Gate A: Recovery

| ID | Requirement | Status | Root cause / fix | Test and evidence | Remaining dependency |
|---|---|---|---|---|---|
| A1 | Restorable backup before production changes | **RECOVERY POINT ACCEPTED (17 Oct)** per the owner's 22 Oct instruction; no new backup taken | The newest complete set is Hostinger's 17 Oct 09:43 backup in `Downloads`. Database `u713346627_xDzzw.20261017093050.sql.gz`: sha256 `b2143d9f…` matches the 19 Oct record, gzip OK, ends with "Dump completed", 111 tables, test-restored twice on 19 Oct (about 4 min). Files: `u713346627.20261017093050.tar.gz`, 3,549,698,076 bytes, sha `a10c7a54…`. **Residual risk:** a full database restore would lose everything since 17 Oct 09:43, including enquiries, the team's Approvals #8516/#8517, the 19–20 Oct imports and republish, and the timezone setting. So every planned step must have its own undo that needs no restore: Main by promote, plugin by reinstalling 0.7.4, imports by "Undo this import", tests as drafts that get deleted. SSH backup: `tools/backup-enrollment.sh` has never worked from this computer (15, 19, 21 Oct: password and key refused). | Optional, for a current recovery point: a new hPanel backup download, or the `acadvizen-hostinger` key authorised in hPanel |
| A2 | Rollback path for the plugin | READY | 0.7.4 package kept: `dist/acadvizen-cms-0.7.4-worktree-2cdb89872e37`, sha256 `14c1b949…ca69f` | Production runs 0.7.4 (Plugins screen, 13:56Z) | none |
| A3 | Rollback path for Main | READY | `vercel promote dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (the current live deployment) | `vercel inspect www.acadvizen.com`, 11:5xZ | none |

## Gate B: CMS

| ID | Requirement | Status | Root cause / fix | Test and evidence | Remaining dependency |
|---|---|---|---|---|---|
| B1 | Admin access for authenticated checks | **DONE** | The saved session had expired. The owner signed in through the normal login page at 13:55Z, and the session was saved. The stored password was not used: the safety check refused that. | Plugins, Approvals, Settings, Publishing and Versions screens read at 13:56–14:05Z | none |
| B2 | Production configuration | **VERIFIED** | Settings screen: Main address `https://www.acadvizen.com`; this site Production Enrollment; shared secret **set** (value never shown); switches SITEMAP_CLEANUP, SITE_TEMPLATES, RENDER_BRIDGE and APPROVAL on, LOGIN_BRANDING off; WP-Cron runs on page visits. Vercel production variable names are present. WordPress 7.0.7, PHP 8.3.35, Elementor 4.3.5, Elementor Pro 4.3.2, LiteSpeed Cache 7.9.1. Database 2.52 GB, site 3.95 GB. | `evidence/production-20261021/admin/` screenshots | none |
| B3 | REST routes and authorisation | **VERIFIED** | `acadvizen-cms/v1`: `/manifest`, `/render`, `/blogs`. Anonymous requests answer 401 with no-cache. | §1 of the audit | none |
| B4 | Stale submissions are easy to spot and regenerate | READY (in 0.7.6) | **Root cause:** the fingerprint includes the shared style kit (by design: an approval covers exactly what is published). So a kit change makes every waiting item stale, and the queue said so only after Approve was refused. **Fix:** the queue now marks stale rows ("Changed since it was submitted …"), hides Approve/Publish for them and offers **Submit the current version again**. That is the existing nonce- and capability-checked submit action, and it creates a new pending submission for the current fingerprint. | PHP 351/351, including 2 new tests (local, supplementary) | Install 0.7.6 (B5) |
| B5 | Install 0.7.6 on production | **VERIFIED IN PRODUCTION** (22 Oct 10:49:56Z) | `install-plugin.mjs`: package sha256 `6356cd75…` and version checked. **Run 1 (10:44Z):** stopped before any change; the "Replace current with uploaded" click timed out. Fix: open the button's own signed link. **Run 2 (10:46Z):** "Plugin updated successfully" (0.7.6). Its checks reported failures that were faults in the checks: (a) 10 plugins "changed", but they were update or notice rows with no name sharing `data-plugin`; (b) "Enrollment home has no header", but Enrollment's header 960 and footer 1035 are HFE templates typed `wp-post`, not `header`. Its rollback click then timed out (fixed: submit WordPress's own form). **Run 3 (--undo, 10:48Z):** installed 0.7.4, failed the same faulty checks, so it went back to 0.7.6 (10:49:56Z). **Checks fixed:** real plugin rows only; Enrollment home must keep the same set of Elementor documents as before. **Verification on 0.7.6, by hand:** public readme 0.7.6; Settings: plugin 0.7.6, Main address `https://www.acadvizen.com`, secret set; 34 named plugins with the same versions and states as 21 Oct, apart from Master Admin; `acadvizen-cms/v1` routes present, anonymous `/manifest` and `/render` 401 no-store; `acadvizen/v1/enquiry` present; Enrollment 58/59 identical to 15 Oct (`/test/` intended); Enrollment home and `/blogs/` in a browser at 1440/768/390 have the same Elementor documents as 21 Oct, heights within 66 px (rotating carousels); the 108 WordPress-drawn Main pages 108/108 unchanged. The approval fingerprint code (and every helper it uses) is identical in 0.7.4 and 0.7.6, so #8516/#8517 are not affected. | Rollback: `node tools/release/install-plugin.mjs --session <session> --undo` |

## Gate C: Content (Main pages editable from the Enrollment admin)

| ID | Requirement | Status | Root cause / fix | Test and evidence | Remaining dependency |
|---|---|---|---|---|---|
| C1 | 108 location/service pages | **VERIFIED** | Drawn by WordPress. Main header and footer, no Enrollment chrome, indexable, text equal to Main's own version | 21 Oct crawl and chrome check | none |
| C2 | The remaining Main addresses | **IN PROGRESS** (shell VERIFIED IN PRODUCTION; blogs importing) | **Inventory, 22 Oct 07:25–07:39Z (read-only on www):** all 314 sitemap addresses are accounted for. 108 are already drawn by WordPress (left out, so no stale overwrite). **202 are planned**, by family: blogs 86 (+ 11 drafts that stay drafts), tools 67, areas 15, `-in-` city pages 13, course 1, pages 20 (homepage, dedicated pages, lists). 4 stay on Main by design (C3, C4): `/blog/author/john-doe`, `/companies`, `/internships`, `/resources`. Plus the `shell` batch: the Main header, footer and location design changed since 19 Oct, including the footer width; they arrive as working copies and are approved and verified on their own. **Tool:** `tools/release/migrate-main.mjs`, with plans and bundles in `dist/main-migration/<family>/`. It runs plan, import, publish (only the IDs its import created, never rows already in the queue) and verify (every address against Main's own page: status, title, canonical, robots, H1, at least 97 % of the text, Main chrome only), and undo ("Undo this import", latest batch). Base Main CSS is byte-identical to 19 Oct. **Kit:** the new designs use 54 Main colours/fonts that production lacks. Importing them only adds entries, and Enrollment's are untouched. But it changes every approval fingerprint, so #8516/#8517 would need "Submit again". | Owner: (1) allow `Bash(node tools/release/migrate-main.mjs:*)`; (2) decide on the kit additions (accept that #8516/#8517 become stale, or let the team finish them first); (3) B5 installed first (the tool requires 0.7.6) **Kit decision resolved without touching the kit (22 Oct):** the migration writes the Main colour and font values into the designs (`tools/main-to-elementor/inline-globals.mjs`, 4 unit tests; all 5,432 references were Main-only; 0 left in any family bundle). The shared Elementor kit is not changed, so #8516/#8517 and Enrollment's styles are untouched. **Shell batch, 11:36–11:57Z: VERIFIED IN PRODUCTION.** Baseline before the batch: 108/108 live pages pass. Import: the Main menu was updated with identical items (same 8 entries as the live 19 Oct menu); working copies #9628/#9629/#9630 of header #8798, footer #8799 and location design #8800; the location design setting still points at the live #8800. Published 3/3 (only these IDs; the team's #9304 and #8516 were in the queue and untouched). All 108 pages re-rendered with the new header and footer (one shared markup, different from 21 Oct's). **Verify: 108/108 pass** (status, WordPress-drawn, title, canonical, robots, H1, text ≥ 97 %, Main chrome only). Visual check of MG Road at 1440: footer columns at the same x as Main's (the footer-width fix), text identical. A ~45 px larger gap under the hero heading existed before (21 Oct screenshot). **Tool fixes found on the way:** verify had collapsed each page into one text line (0 %); publish no longer infers "new" queue rows (it would have approved the team's #9304); drafts are skipped in publish. Pre-existing SEO observation: the location pages have no `<h1>` on Main or in WordPress. |
| C3 | `/companies`, `/internships`, `/resources` | READY (Main code) | Empty lists ("Check back soon") were indexable and in the sitemap. **Fix:** while a list has no active item, its page is noindex and left out of the sitemap. Page, links and design unchanged; it becomes indexable by itself when the first item is added in Main's admin. These pages show Main database tables, so they stay Main application routes (an exception for the owner to accept). | Local build: noindex when empty, `index, follow` and back in the sitemap with one active item (local, supplementary) | Main release (F1) |
| C4 | `/blog/author/john-doe` placeholder | READY (Main code) | An author without published posts was indexable and in the sitemap. **Fix:** such an author page is noindex and not in the sitemap. Authors with posts are unchanged. | Unit 307/307; local: empty author noindex and absent, author with a post indexable and listed | Main release (F1) |
| C5 | `/social-media-marketing-course-in-mg-road` canonical points to a 404 | OPEN | The location record's canonical is `…/social-media-marketing-course-mg-road/` (since ≤13 Oct). That address redirects (308) to a 404. **Fix:** set the record's canonical to its own address (`/social-media-marketing-course-in-mg-road`). | — | A1 (a production content change), then edit and approve through the normal workflow |
| C6 | `/test/` stays unpublished | **VERIFIED** | 404 and absent from every Enrollment sitemap | `enroll-compare.json` | none |

## Incident 22 Oct 2026: blog images deleted while live (FAILED, then RECOVERED and FIXED)

| When (UTC) | What happened | Evidence |
|---|---|---|
| 11:58–12:24 | Blogs batch `main-blogs-20261022` imported: 97 records (11 drafts), 2 designs, 344 images (all untitled, "(no title)" in the Media Library) | `dist/main-migration/blogs/attempt1/import-log.txt` |
| 12:25–13:01 | 2 designs + 48 blogs approved and published (drawn by WordPress on www) | `attempt1/publish-results.json` |
| ≈12:24–13:00 | **322 of the 344 imported images were deleted from the Media Library.** The migration tools have no delete step and none ran. The same admin account (`tharikar98`, shared with the team) was uploading and editing images for "New Home" in the same window. Who deleted them is not proven. | Media Library query: 22 of 344 left |
| 13:02–13:08 | The remaining 36 blogs were refused as **stale**: their fingerprint includes the images, so approval protection worked as designed | `attempt1/log.txt` |
| 13:20 | Live check: published blogs on www showed **broken images** (e.g. 4 of the first 5 images 404 on 3 pages) | — |
| 13:33 | **Rollback:** "Undo this import" for the batch (337 items deleted). All 86 blog addresses are drawn by Main again, answer 200, and their images load (200) | `migrate-main.mjs undo` |
| 13:44 | **Fix released as plugin 0.7.7** (`dist/acadvizen-cms-0.7.7-worktree-a102a1796267`, sha256 `32cc3050…`): (1) `includes/media-guard.php`, an image or file used by published, scheduled or waiting-for-approval content (featured image, or Elementor design by ID or file address) cannot be deleted; the person is told which content uses it, and Undo import keeps it quietly; (2) imported files are titled "Main Website: <alt or file name>". Tests: PHP 354/354 (+3); the database lookup was tested on real WordPress and MySQL (local): by ID, by file address, featured image, unpublished → released, other ID → no match, pending/scheduled protected, draft not. **Installed 13:45:15Z, PASS** (34 plugins unchanged, Enrollment home documents unchanged, routes and enquiry OK). | `~/acadvizen-release/plugin-…` |
| 13:49–15:05 | **Blogs attempt 2 (`main-blogs-20261022-a2`): VERIFIED IN PRODUCTION.** Import: 97 records, 319 images (all titled "Main Website: …"; 319/319 still present after the import and throughout a 30-minute watch while publishing), 11 drafts kept unsubmitted, 3 over-long category names (256–304 characters, WordPress limit 200) not stored. Published 88/88 (2 designs + 86 blogs); the team's #9304 and #8516 untouched. **Verify 86/86** (status, WordPress-drawn, title, canonical, robots, H1, text ≥ 97 %, Main chrome only), once the comparison decoded `&#038;`/`&#039;` like a browser. **All 349 WordPress images on the 86 live pages load (200).** | `dist/main-migration/blogs/verify.json` |
| 22 Oct 15:03–23 Oct 15:34 | **Tools (`main-tools-20261022`): VERIFIED IN PRODUCTION.** Import: 92 items, 2 designs, 67 records, 0 problems. Published 69/69 (team's #9304, #8516 untouched). **Verify 67/67** after two fixes to the check: (a) Main's own tool pages add their `<h1>` in the browser after loading, so where Main's server HTML has none, the H1 a visitor sees on Main's page, read in a real browser, must equal WordPress's (it does: e.g. "Photoshop" = "Photoshop"); WordPress now also has it in its server HTML; (b) the tracker blocker matched words in page addresses (`/tools/google-analytics`, `/tools/hotjar`); it now matches tracker hosts only. **All 20 WordPress images on the 67 pages load.** The first re-verify stalled overnight (computer asleep) and was restarted. | `dist/main-migration/tools/verify.json` |
| 23 Oct 15:15 | The saved wp-admin session had expired; the owner signed in again at 15:18 ("Remember Me" requested). Blogs re-checked publicly: 86/86 still drawn by WordPress, 349/349 images load. | — |
| 23 Oct 15:35–15:45 | **Areas (`main-areas-20261023`)**: import 20 items (3 designs, 15 records, 0 problems); published 18/18 (team's #11007, #10936, #8516 untouched). **Verify 14/15 pass.** `/digital-marketing-courses-bangalore` has 96.3 % of Main's text: on Main, a visible "Why choose us" section whose entries are the placeholder words "Feature title" / "Feature description" is not in the WordPress version (the shared area design does not have it). **OWNER DECISION:** keep (placeholder text removed) or restore Main's own page for that address (Pages/Locations → Quick Edit → Draft). Left published meanwhile. | `dist/main-migration/areas/verify.json` |
| 23 Oct 15:42–15:48 | **Cities (`main-cities-20261022`): VERIFIED IN PRODUCTION.** 13 records, 0 problems; published 13/13; **verify 13/13.** | `dist/main-migration/cities/verify.json` |
| 23 Oct 15:48–15:58 | **Course: VERIFIED IN PRODUCTION.** The record (#11130) became stale seconds after import (a one-off change right after the import submitted it; its image was not modified afterwards). Resubmitted it with "Submit the current version again" (it stayed current), then published; **verify 1/1** (drawn by WordPress 20 s after publishing). Follow-up: find which field the importer writes after submitting course records. | `dist/main-migration/course/` |
| 23 Oct 15:59–16:16 | **Pages (`main-pages-20261022`): FAILED, then ROLLED BACK.** Import 116 items (3 designs, 20 records; the homepage #11208 was missed by the tool's log parser, fixed). Published 23/23 (one, `/course-basic`, during a page-load timeout). **Verify 8/20:** homepage only 82.5 % of Main's text (the "Course Modules Built for Modern Marketing Execution" section and its modules missing); `/courses` H1 "Digital Marketing Courses" → "Courses"; five Bangalore course pages 96.1 % (FAQ answers missing); `/tools` 95.2 % ("Showing 0 of 0" counter); 3 pages not yet drawn. **"Undo this import"** (the response timed out; the server completed it): all 20 addresses drawn by Main again, 200; queue holds only the team's items; Enrollment home documents unchanged. Missing text saved: `dist/main-migration/pages/attempt1-missing-text.json`. **Next:** fix the exporter for these sections, then re-import as attempt 2. | — |

**Owner action recommended:** ask the team not to delete "Main Website: …" images. 0.7.7 now refuses it for images in use, but images not yet referenced (during an import) can still be deleted.

## Gate D: Publishing

| ID | Requirement | Status | Dependency |
|---|---|---|---|
| D1 | Main / Enrollment / Both publishing, approval, update, restore, unpublish | **VERIFIED IN PRODUCTION** (22 Oct, plugin 0.7.6) | `verify-elementor-live.mjs`, 11:12–11:21Z: **58/58 PASS**, Main, Enrollment and Both each with these steps: draft not public; preview signed in; Publish = submitted (not public); self-approved and published live on the chosen site(s) only; 1440/768/390 renders; noindex; an update waits in a working copy until approved; Restore of the previous version; Unpublish takes it off the public site. Test pages #9543, #9560, #9576 are kept as drafts; their addresses answer 404. `verify-approval-live.mjs`, 11:2xZ: **16/16 PASS** (a direct change to the live page is refused with 403; Reject keeps the live version; resubmit, approve, publish; Restore; Unpublish); test page #9594 kept as a draft. Evidence: `docs/cms-implementation/evidence/production-20261022/`. **Note:** the saved admin session is the `tharikar98` account, which the team also uses, so these test actions appear under that name in the Approvals history (all titled "CMS ACCEPTANCE …" or "CMS APPROVAL TEST …"). **#8516** ("Performance Marketing Course", Enrollment, submitted 19 Oct 12:14) is shown stale by 0.7.6: its fingerprint no longer matches, most likely since the 19 Oct import added Main kit entries (0.7.4 could not show staleness). Not touched. **#8517** ("New Home", Enrollment `/new-home/`) is being edited by the team; it left the queue after their own edit at 09:53:17Z. Not touched. Not yet run: the partial-failure clash case (needs the signing secret in the environment), scheduling on production. | none for these steps |
| D2 | Enquiry forms (no genuine submission) | NOT VERIFIED today. Rendering is verified; delivery was last tested 20 Oct. | D1 run |

## Gate E: Website integrity

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| E1 | 314 sitemap addresses answer 200 | **VERIFIED** | `main-crawl.json` |
| E2 | Pages whose text "changes between requests" | **ROOT CAUSE FOUND** | Not a content change. Next.js 15 streams the page title and canonical either in the `<head>` or later in the `<body>`, depending on timing. Googlebot got them in the body on 2 of 6 `/about` requests. **Fix:** `htmlLimitedBots: /.*/` in `next.config.mjs`, so metadata is always in the `<head>` (local build: title and canonical in the head on every page). Patch: `dist/main-release-20261021/metadata-in-head.patch`. Waiting for the Main release (F1). |
| E3 | Desktop, tablet and phone; `/placement` on mobile | **VERIFIED** | 13 pages × 3 widths; no sideways scroll possible; 0 broken images |
| E4 | Enrollment unchanged | **VERIFIED** | 58/59 identical to 15 Oct (the 59th is `/test/`, intended); logo links to enroll.acadvizen.com |

## Gate F: Deployment

| ID | Requirement | Status | Root cause | Dependency |
|---|---|---|---|---|
| F1 | Main release with C3, C4 and E2 | **VERIFIED IN PRODUCTION** (22 Oct 10:41Z) | 22 Oct: commit `40f41a7` (list pages, sitemap, tests, metadata hunk only, `tools/release/release-main.sh` + `main-release.json`) on top of `d0daf9b`; repository secret check passed; **pushed** `df809dc..40f41a7` to `origin/headless-wordpress`. Vercel built preview `dpl_FrKTHwgR5V11AJ75CU8QdLxDkE1r` from `headless-wordpress@40f41a7` (build log: Compiled successfully; only the old `<img>` lint warnings); status Ready, target preview. Production still `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (checked after the push). Read-only rehearsal of the release script's control step: 314/314 identical. Running `bash tools/release/release-main.sh dpl_FrKTHwgR5V11AJ75CU8QdLxDkE1r` was refused by the Claude Code classifier, as was a GET of the preview ("Production Deploy"). On 18 Oct the production deploy ran through an allow rule the owner added for `tools/release/enable-bridge.sh`. | Owner: add an allow rule for `Bash(bash tools/release/release-main.sh:*)` (same pattern as `enable-bridge.sh`). Rollback: `bash tools/release/release-main.sh --undo` (promotes `dpl_56BrUw…`) **Attempt 1, 22 Oct 08:29–09:09Z: STOPPED by its own safety check, nothing deployed.** The control read showed 2 blog addresses as status 0 (a dropped connection or timeout on a slow network: 29 min against 12 for the first read). Both answer 200 when read again. **Root cause:** `tools/main-route-inventory.mjs` did not retry a dropped connection. **Fix:** 3 attempts on a network error only; any HTTP answer is still recorded as is. Re-checked on both addresses: 200. **Attempt 2** started 09:1xZ. **Attempt 2, 09:11–09:59Z: released, then ROLLED BACK automatically, as designed.** The control check passed (314/314 identical). Redeployed as `dpl_4hur5NC1yZivhTNkBhLKuN5dQeCX` (09:48Z). After-read: 310 addresses, 0 not 200. The script's own checks were faulty: Git Bash rewrote the noindex address arguments (`/companies` → a Windows path), so `/blog/author/john-doe` was not excluded from the comparison, and the noindex check crashed. The script therefore promoted `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` back at 09:59:35Z; confirmed with `vercel inspect www.acadvizen.com`. With the exclusion done correctly, the after-read was **310/310 identical** to before, so the release changed nothing else. **Fix:** `MSYS_NO_PATHCONV`; output folder as a Windows path (`cygpath -m`); addresses passed in the environment; the check moved into `tools/release/check-intended.mjs`, which correctly FAILs on the old deployment (4 indexable pages, metadata outside the head on some reads). **Attempt 3** started about 10:15Z. **Attempt 3, 10:03–10:42Z: PASS.** Control 314/314 identical; redeployed as **`dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV`** (build log: `headless-wordpress@40f41a7`, Compiled successfully). After the release: 310 addresses, 0 not 200, all 310 identical to before; `check-intended.mjs` PASS (4 addresses: 200, noindex, out of the sitemap; title and canonical in the `<head>` on 11 pages × 2 visitors × 3 reads). Independent checks: `vercel inspect www.acadvizen.com` = `dpl_2B5h…`, Ready, production; Main `/admin` 200; sitemap 310 addresses; the 108 WordPress-drawn pages 108/108 with Main chrome, no Enrollment template, metadata in the `<head>`. Rollback: `bash tools/release/release-main.sh --undo` (promotes `dpl_56BrUw…`). Evidence: `~/acadvizen-release/main-20261022T1003Z/`. |

## Gate G: Client readiness

| ID | Requirement | Status | Dependency |
|---|---|---|---|
| G1 | Admin guide matching the deployed system | OPEN | After D1 and C2 |
| G2 | Walkthrough on production | OPEN | After D1 |

## Supplementary (local, not production evidence)

- **Full local regression, 21 Oct 13:05–15:20Z:** 21 of 22 suites pass. The exception is scheduling at 5/7: the scheduled page went live 645 s late on a busy machine, because local WP-Cron runs only on page visits. A quiet rerun at 15:23–15:30Z passed 7/7.
- **Other local suites:** unit 307/307, PHP 351/351, lint 0 errors, build OK.

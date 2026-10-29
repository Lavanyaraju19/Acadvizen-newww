# Production acceptance, 26 October 2026

**For:** the owner and the client's administrators.

**Covers:** the live websites after plugin **0.7.10**.

All results below were taken on the live websites:
- https://enroll.acadvizen.com (Enrollment WordPress);
- https://www.acadvizen.com (Main).

Test content was always a labelled, noindex page ("CMS ACCEPTANCE …", "CMS APPROVAL TEST …", "CMS SCHEDULE TEST …"). Each one was unpublished at the end and kept as a draft. **No real page, menu, enquiry or queue item was changed.**

Evidence is in `evidence/production-20261026/` and `evidence/backup-20261026/`.

## 1. Backup before any change

| | Result |
|---|---|
| Database | `u713346627_xDzzw` (the Enrollment database), hPanel backup of **24 Oct 2026 15:15**: the newest available. Backups are weekly; manual backups are locked on this hosting plan |
| File | `C:\Users\HP\Downloads\acadvizen-backup-20261026\u713346627_xDzzw.20261024094529.sql.gz`, 378,972,680 bytes |
| SHA-256 | `b9f1a0fb888fc8b83e6de8a9fc3228d71aaee5dbf0b9703163a8112648a1dad9` |
| Integrity | gzip OK; "Dump completed on 2026-10-24 9:50:15"; header names database `u713346627_xDzzw` |
| Restore test | Imported into a throwaway MariaDB 11 container with **no network** (307 s, exit 0), then removed. The import has 111 tables; siteurl enroll.acadvizen.com; theme Astra; Master Admin, Elementor Pro and MetForm active; 86 published and 11 draft Main blogs; 67 tools; 136 locations; popup #11322; queue items #8516, #9304, #11007 as live. Latest content change 24 Oct 15:11. `evidence/backup-20261026/restore-test-checks.txt` |
| Files | `u713346627.20261024094529.tar.gz` (same backup set), sha256 `d404585a…`, archive intact; holds `enroll.acadvizen.com/public_html` |
| Not covered | Changes after 24 Oct 15:15: the team's edits of 24 Oct afternoon and 26 Oct morning, and today's plugin updates. The plugin's own rollback covers the plugin. **Never restore this backup over the live website**; it would remove those changes |

The `u713346627_kb4Ph…` file supplied on 25 Oct belongs to another, almost empty WordPress (`cms.acadvizen.com`). It was not used.

## 2. What was released

| What | Version | Way back |
|---|---|---|
| Enrollment plugin "Acadvizen Master Admin" | **0.7.10** (08:26Z). 0.7.9 was installed at 08:03Z | `node tools/release/install-plugin.mjs --session <session> --undo` reinstalls 0.7.9; with the 0.7.7 package in `plugin-release.json`, 0.7.7 |
| Main Website | **`dpl_JDZNEJ2c7UtvMBbc459sgYUdrpMj`** from commit `b804b34` (12:06Z; retry of a quick WordPress refusal), then **`dpl_13s8yPa5GTauWxsi4hvchXrvPVVa`**: the same build with `WORDPRESS_OWNS_PUBLIC_CONTENT=true` (12:51Z) | lock: `bash tools/release/set-content-ownership.sh --undo dpl_JDZNEJ2c7UtvMBbc459sgYUdrpMj`; release: `bash tools/release/release-main.sh --undo` (back to `dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV`) |
| Git | `origin/headless-wordpress` (see the ledger for the final commit) | — |

Re-verified unchanged on 27 Oct: section 6.1.

Every install passed the guarded checks:
- Master Admin active at the new version; the other 33 plugins unchanged;
- the CMS API answers 401 to anonymous requests;
- the enquiry route `POST /acadvizen/v1/enquiry` is still registered;
- the Enrollment home has the same Elementor documents (1035, 1799, 6147, 6177, 7696, 960).

## 3. Results

| Suite (LIVE) | Result |
|---|---|
| `verify-elementor-live` (Main, Enrollment, Both: create → Save Draft → Preview → Publish → 1440/768/390 → Update → Restore → Unpublish) | **52/52** |
| `verify-approval-live` (Pending Review → approve → publish → live page protected → change waits → Reject → resubmit → publish → Restore → Unpublish) | **16/16** |
| `verify-scheduling-live` (future date → Publish = scheduled, not public → live at its time (+52 s) → Unpublish) | **6/6** |
| `verify-failure-retry-live` (Both: published → cause in place → next revision reported **failed** with each website's reason, Main keeps the previous version → cause removed → Check again → verified on both) | **8/8** |
| `verify-navigation-live` (Main menu item's title attribute set → live on Main pages in 171 s → restored; menu identical to the original) | **PASS, with two tool failures explained.** The run log itself reads "3 passed, 2 failed":<br>• check 2 read WordPress' update banner instead of the save message; the save was confirmed by reading the item back and by the change going live (check 3);<br>• the restore click timed out, so the restore went through the menu-item endpoint (Approvals history "navigation saved_by_reviewer", 16:03:58Z).<br>Checks 5–6 were completed outside the run: `menu-after.json` (16:03:59Z) is identical to `menu-before.json`. Re-verified 27 Oct: the live menu still equals it, and 0/320 pages carry the text. (`menus-cleared.png` is from an aborted earlier attempt, 15:58Z) |
| Final regression (26 Oct 16:10Z – 27 Oct) | Main 320/320 identical to 23 Oct; blog images 372/372; popup; `/admin` 200; lock 423 (companies 401, leads 400); enquiry `POST`; Enrollment 58/59 (`/mentors/` retitled "Mentors 1" by the team) |
| SEO and sitemap: 320 Main addresses against 23 Oct (status, title, description, canonical, robots, sitemap membership) | **320/320 identical**; sitemap 310; all 310 drawn by WordPress |
| Enrollment: 59 pages against 23 Oct | **59/59** on 26 Oct (`/test/` still 404). 27 Oct 08:30Z: home 200 again after the team's unpublish (section 5); 62 of 63 other sitemap addresses 200, plus one Rank Math 301 set up by the team |
| Blog images: every WordPress image on the 86 live blog posts | **372/372 load** |
| Main-only pages (`/blog/author/john-doe`, `/companies`, `/internships`, `/resources`) | 200, noindex, not in the sitemap |
| Routes | Main `/admin` 200; `/contact` 200; enquiry route `POST`; CMS API anonymous 401; Enrollment home 200 |
| Quick Registration popup (Main homepage) | Opens after ~96 s as a centred overlay at 1440 and 390 px; 6 form fields; closes with ×; no page errors; not on `/about`, `/blog`, `/contact` or a location page. Nothing was submitted. `popup-*-0710.png` |
| Main release (guarded) | Two identical control reads; after the switch **310/310 identical on every check**; the 4 Main-only addresses noindex and out of the sitemap |
| Ownership lock | Live: anonymous `POST /api/cms/pages` → **423**; companies, internships, resources, authors → 401 (not locked); leads → 400 (not locked); Main `/admin` 200; **310/310** addresses identical |
| Contact (Main) status | Was "Publishing" since 23 Oct; now **"Published (verified)"**. 23 other lost checks from the 22–23 Oct batches were resumed and verified |

| Suite (LOCAL, plugin 0.7.10) | Result |
|---|---|
| PHP unit / JS unit | 359/359 / 312/312 |
| `direct-publish-acceptance` | 13/13 |
| `approval-acceptance` | 47/47 |
| `approval-reliability-acceptance` / `scheduling-acceptance` / `both-failure-acceptance` | 38/38 / 7/7 / 12/12 (on 0.7.9) |

## 4. The 18-item client demo

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Sign in to Enrollment WordPress | **PASS** | The owner's sign-in (WordPress session of 26 Oct) |
| 2 | Open a Main page in the supported workflow | **PASS** (dedicated test pages; real pages were not edited) | elementor-live 6: the live page opens as its working copy |
| 3 | Open it in Elementor | **PASS** | elementor-live 1–6 |
| 4 | Harmless, reversible visual edit | **PASS** | heading V1 → V2 |
| 5 | Save the draft | **PASS** | elementor-live 2: not public anywhere |
| 6 | Preview the draft | **PASS** | elementor-live 3 |
| 7 | The preview shows the change | **PASS** | elementor-live 3 |
| 8 | Publish to Main | **PASS** | elementor-live main 4: live in 26 s |
| 9 | The live Main URL shows the exact change | **PASS** | elementor-live 5 at 1440/768/390: heading, image, button link |
| 10 | Update again; the change reaches Main | **PASS** | elementor-live 6: V2 live in 17–44 s; approval-live 8 |
| 11 | Enrollment unaffected | **PASS** | Main-only test absent from Enrollment; Enrollment 59/59 identical |
| 12 | Draft and published status | **PASS** | Draft not public; Approvals → Recent publications "Published (verified)" |
| 13 | Media editing | **PASS** (an image from the Media Library placed and shown on both websites) | elementor-live 5 `img:true` |
| 14 | Navigation editing | **PASS** (16:00–16:09Z) | Appearance → Menus → Main Website Menu → "Contact" → Title Attribute "Contact Acadvizen" (hover text only) → Save Menu. Live on `/`, `/about`, `/blog`, a location page after **171 s**; Enrollment not affected. Restored: the attribute cleared (the menu screen's restore click timed out, so the menu-item endpoint was used), the menu is **identical to its saved original** (8 items, every field), every page back to its original link in ~5 min. Sweep of 27 Oct 07:30Z: **0 of 310** sitemap addresses carry the hover attribute, all 310 answer 200 (one blog post contains the words "Contact Acadvizen" in its own article text; that is not the menu). `navigation-live.out`, `navigation/menu-before.json`, `navigation/menu-after.json`, `navigation/menus-set.png`. Template editing: the shared designs are edited the same way (Templates); the header/footer publication was verified on production on 18 Oct |
| 15 | Scheduling | **PASS** | scheduling-live 6/6 |
| 16 | Failure reporting and retry | **PASS** (`verify-failure-retry-live` 8/8, 15:17–15:56Z) | No secret and no test code on the server: a Both test page; a temporary Rank Math redirect on its own Enrollment address made the next revision impossible to show → Approvals reported **failed** with each website's reason (Enrollment: another revision shown; Main: drawing failed, http_307), never success; Main visitors kept the previous approved version (V1) → redirect removed → **Check again** → verified on both in 56 s, both showing V2 → page unpublished, redirect deleted. Also: lost checks recovered (Contact + 23). `failure-retry-live-2.out` (the first attempt, `failure-retry-live.out`, proved the failure report but its cleanup call was refused; the leftover redirect was removed at about 15:17Z, before the second run) |
| 17 | Rollback and restoration | **PASS** | elementor-live 7 and approval-live 9: Restore puts the earlier version back live |
| 18 | Everything without source code or the old dashboard | **PASS** | All steps through WordPress, Elementor and Approvals & Publishing |

## 5. Open items (as of 27 Oct 2026, 10:00Z)

No technical item is open. What remains is content owned by the client and the team (section 6.5).

| Item | Owner | Action |
|---|---|---|
| Enrollment homepage title "Demo - Copy" (browser tab and search results). The page has no meta description | Client / team | Choose the title, and a description. The record holds no approved title; Home1's title until 27 Oct was "Digital Marketing Course in Bangalore with AI \| Acadvizen". Then rename the page (or set its Rank Math title) and click Publish |
| 1 waiting approval item: #8516 "Performance Marketing Course" | Team | A reviewer with code rights checks its typed HTML, then approves and publishes or rejects it |
| 3 missing logo files on `/learn-digital-marketing/` (`zomato-1.png`, `uber-1.png`, `pwc.png`; also absent in the 24 Oct files backup) | Team | Re-upload the logos and select them in that page's design |
| Personal accounts | — | **NOT REQUIRED.** The existing Administrator account is sufficient for the agreed setup |

Earlier versions of this report listed 9 waiting items (#9304, #10936, …). On 27 Oct only #8516 is still waiting; the team handled the others through direct publishing on 26–27 Oct.

## 6. Final verification, 27 Oct 2026

Read-only unless stated; no enquiry, lead or content was created. Evidence (not in Git): `evidence/production-20261027/`:
- `final-regression.txt`;
- `render.txt` and `render/*.png`.

### 6.1 Deployed state

| What | Verified value | How |
|---|---|---|
| Main | `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa`, production, Ready (created 26 Oct 12:49Z). It is the redeploy of `dpl_JDZNEJ2c7UtvMBbc459sgYUdrpMj` (commit `b804b34`) with the ownership lock | `vercel inspect https://www.acadvizen.com`; release log of 26 Oct |
| Enrollment plugin | Acadvizen Master Admin **0.7.10**, active (34 plugins, 28 active) | WordPress plugins list; public `readme.txt` Stable tag 0.7.10 |
| Git | `origin/headless-wordpress` at `968d68b` before this update | `git fetch`; `git rev-parse` |
| Backup | `u713346627_xDzzw.20261024094529.sql.gz`, SHA-256 `b9f1a0fb…1dad9`, recomputed 27 Oct: match. It does not contain changes after 24 Oct 15:15 | `sha256sum` |

### 6.2 The existing Administrator

The agreed setup is **one existing Administrator account**, which already signs in to the Enrollment WordPress. The checks below ran under that account's own production session: user #1, role `administrator`, holding the plugin's `acv_review_publication` capability.

| # | Capability | Result | Evidence |
|---|---|---|---|
| 1 | Sign in to the Enrollment dashboard | **VERIFIED** 27 Oct | Session valid; `users/me` = administrator |
| 2 | The existing CMS workflow for Main content, without a second CMS | **VERIFIED** 27 Oct | Approvals, Publishing, Versions, Pages, Menus, Templates, Rank Math redirections, Settings → Reading all open (200) |
| 3 | Open and edit supported content in WordPress / Elementor | **VERIFIED** 26 Oct (LIVE) | `elementor-live.out` 52/52 |
| 4 | Preview drafts safely | **VERIFIED** 26 Oct | elementor-live 3 (draft not public) |
| 5 | Publish and update to the intended website | **VERIFIED** 26 Oct; again 27 Oct (#11892 republished, verified) | elementor-live; ledger 27 Oct |
| 6 | Main, Enrollment and Both destinations | **VERIFIED** 26 Oct | elementor-live (three test pages, one per destination) |
| 7 | Schedule; publication status; retry a failed check | **VERIFIED** 26 Oct | `scheduling-live.out` 6/6; `failure-retry-live-2.out` 8/8 |
| 8 | Approval and restore workflows | **VERIFIED** 26 Oct | `approval-live.out` 16/16 |
| 9 | Restore or unpublish safely | **VERIFIED** 26 Oct | elementor-live 7, approval-live 9; every test page unpublished (54 drafts, 21 addresses 404 on both websites, 27 Oct) |
| 10 | Main `/admin` and Leads | **Leads preserved: VERIFIED** 27 Oct. **Signed-in use of Main `/admin`: NOT VERIFIED today** | `/admin` and `/admin/leads` answer 200. The Leads API: anonymous read 401, anonymous empty submission 400 (validation, no lead created), not affected by the lock. Main's admin is a separate sign-in. The saved sessions expired on 12 Oct, and no password was requested |

**Elementor widgets:** proven live are the 11 widget types used by the 310 Main pages, plus the end-to-end types (Container, Heading, Text Editor, Button, Image). 336 more are supported but not individually tested on Main. 79 are refused on Main by design (shop, cart, login). Details: capability matrix §2.

### 6.3 Live regression

| Check | Result |
|---|---|
| Main: 320 addresses against the 23 Oct crawl (status, sitemap membership, served by WordPress, title, canonical, robots, description; entities decoded) | **320/320 identical**; sitemap 310, all drawn by WordPress |
| Main: visible text of every page against the 23 Oct crawl | **319/320 identical**. The homepage differs only by the Quick Registration popup: with the popup block removed, its text hash equals the 23 Oct hash (`540c9a391e9d`). That is the intended popup fix (§5a P3/P4) |
| Main homepage versions 21–25 (26 Oct 16:01Z → 27 Oct 07:36Z) | Same text. They were redrawn for the menu test and the team's template publications; no content change |
| Main-only pages `/blog/author/john-doe`, `/companies`, `/internships`, `/resources` | 200, `noindex, follow`, not in the sitemap |
| Test hover text from demo #14 | On 0 of 320 pages. The live "Main Website Menu" (#56) is identical to the original snapshot of 26 Oct (8 items, every field) |
| Popup (browser, 1440 px) | Opened after 92 s as a fixed overlay (450 × 368), 6 fields, closed with ×, nothing submitted |
| Browser rendering of the Main home, a blog post and a location page, and the Enrollment home and a page (1440 and 390 px) | Header, footer and navigation visible; no page errors; no horizontal scroll; Main images all load |
| Routes | Main `/admin` 200, `/contact` 200. Lock: anonymous `POST /api/cms/pages` **423**; companies, internships, resources, authors 401 (not locked); leads 400. Signed CMS routes 401 no-store. Enquiry route `POST`. Enrollment `/test/` 404 |
| Blog images on Main (86 posts) | **372/372** load |
| Enrollment: the 59 pages against 23 Oct | 56 identical. Three differ, all explained: `/` (the team's new homepage, §6.4); `/test/` 404 (intended); `/mentors/` retitled by the team |
| Enrollment sitemap | 65 addresses; 64 answer 200. `/social-media-influencer-marketing/` is a Rank Math 301 set up by the team |
| Test content | 54 labelled test pages, all drafts; their 21 addresses answer 404 on both websites (so no test redirect is left) |

### 6.4 Enrollment homepage

- **Status:** published, 200. Settings → Reading homepage = #11892, still assigned.
- **Content:** the team's design: the course-landing hero, the enquiry form and their "Admission open" popup. Its Elementor documents are 960, 1035, 1799, 6147, 7696 (header, footer and parts unchanged) and 11892 (the page).
- **SEO:** canonical `https://enroll.acadvizen.com/`; robots `index, follow`.
- **Title:** **"Demo - Copy - enroll.acadvizen.com"**, with **no meta description**.
- **Decision:** no approved replacement title is recorded, so the page was **not changed** (§5).

### 6.5 Approvals & Publishing queue (read 27 Oct 09:34Z)

| Section | Count | Items |
|---|---|---|
| Waiting for approval | **1** | #8516 "Performance Marketing Course": changes to a live Enrollment page, submitted 19 Oct (revision `e608ad03352d`). It contains typed HTML, so a reviewer must confirm the code |
| Approved, ready to publish | **0** | "None." |
| Scheduled | **0** | No page or post scheduled |
| Rejected | 0 in the last 100 history entries | — |
| Recent publications (last 20) | 16 verified, 4 failed | Failed: three test pages that were later unpublished; Home1 (#6177), which the team then unpublished. None needs action |

Nothing in the queue was approved, published, rejected or deleted during the handover.

### 6.8 Final regression, 28 Oct 2026 (07:25–07:45Z)
Evidence: `evidence/production-20261028/`.

| Suite | Result |
|---|---|
| Main, 320 addresses against 23 Oct | 319 identical + 1 intended (MG Road canonical); 310 sitemap addresses drawn by WordPress |
| Enrollment, 59 baseline pages | 56 identical; 3 explained (homepage robots order, `/test/` 404, `/mentors/` title) |
| Enrollment sitemap | 59 addresses, all 200 |
| Sitemaps / duplicates | No address listed twice; 0 exact duplicate bodies; 0 cross-site duplicates |
| Main-only pages | 4/4 noindex, outside the sitemap |
| Routes | `/admin` 200, lock 423, Leads read 401 and empty POST 400, lists 401, signed API 401, enquiry `POST`, `/test/` 404 |
| Blog images | 372/372 |
| Internal links / menus / queue | 242 targets from 369 pages, 0 broken; 4/4 menus clean; queue empty |
| Browser checks, 1440 and 390 px | 10 views: header, footer, navigation, 0 broken images, 0 page errors; popup opened and closed |
| Partner carousel | 38/38 pages; 8 logos loaded at both widths |

Nothing failed. Nothing was left unrun, except the parts covered by earlier LIVE evidence with the same plugin version: approval, scheduling, failure and retry (26 Oct).

### 6.7 Design publishing test on the live websites (27 Oct, 14:20–14:37Z)

`tools/verify-design-live.mjs`: **53 passed, 0 failed** (`evidence/production-20261027/design-live.out`, screenshots in `design-live/`).

The test pages were **#11999 (Main), #12028 (Enrollment) and #12062 (Both)**. Each was labelled and noindex, then unpublished and trashed at the end.

**Edit.** In the real Elementor editor:
- background colour;
- padding: 48 px desktop, 16 px phone;
- layout: row on desktop, column on phone;
- heading: 44/28 px, weight 700, colour;
- a paragraph;
- a button (label, colour, link);
- an image from the Media Library.

The settings were applied through Elementor's own editor commands. Publish and Update were mouse clicks on the editor's top bar.

**Checks:**
1. **Draft:** not public anywhere.
2. **Preview:** the measured design matched at 1440 and 390 px.
3. **Publish:** Main live in 48 s, Enrollment in 3 s, Both in 15 s and 2 s. The design was measured identical at both widths, in a fresh anonymous browser.
4. **Update** (text and two colours): live in 2–12 s, same page id and address.
5. **Double Update:** one page, one address.
6. **Isolation:** not in the sitemaps, not linked from the homepages.

**Partial failure for Both:** `verify-failure-retry-live` passed 8/8 on 26 Oct with this same plugin version (0.7.10, unchanged since).

### 6.6 Duplicate and test-content cleanup (10:00–10:50Z)

The audit and its results are in [DUPLICATE-AUDIT-2026-10-27.md](DUPLICATE-AUDIT-2026-10-27.md).

**Removed: 76.** 75 went to the Trash and 1 test image was deleted. They include all 54 test pages of these acceptance runs. The test pages named in sections 3–4 are therefore now in the WordPress Trash, not drafts. Their evidence files remain.

**Awaiting review:** 9 groups, owned by the owner or the team.

**After the cleanup:**
- Main 320/320 identical to 23 Oct;
- Enrollment sitemap 64, all 200;
- 0 broken internal links;
- menus, redirects, popup, blog images, enquiry route, lock and queue unchanged.

### 6.9 Re-verification, 29 Oct 2026 (02:30–03:20 UTC; plugin 0.7.11)

Recorded in [FINAL-COMPLETION-REPORT-2026-10-29.md](FINAL-COMPLETION-REPORT-2026-10-29.md), evidence `evidence/production-20261029/`:

- **Main, all 320 baseline addresses:** metadata 319/320 identical to the 23 Oct baseline (the other is the intended MG Road canonical); visible text 319/320 (the homepage popup).
- **Enrollment:** 57/59 identical (2 explained); sitemap 58/58 answer 200.
- **Live tests:**
  - state machine 14/14;
  - approval test (Both) all steps: approve, reject, resubmit, restore, unpublish.
- **Backup:** the 24 Oct backup set of section 1, re-verified (checksums, integrity) and restore-tested again on 29 Oct (237 s, 111 tables).
- **Changed since section 6.4:** Home1 #6177 is no longer a draft rollback. The team moved it to the Trash on 29 Oct 02:10 UTC (restorable).

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
| `verify-navigation-live` (Main menu item's title attribute set → live on Main pages in 171 s → restored; menu identical to the original) | **PASS**. Check 2's own message read was a false negative (it read WordPress' update banner); the save was confirmed by reading the item back. The restore went through the menu-item endpoint |
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

## 5. Open items

| Item | Why | One action needed |
|---|---|---|
| Enrollment homepage title | The final check of 27 Oct found the Enrollment homepage answering 404 since 06:51Z: the team had unpublished the page set as the homepage ("Demo", #11892). With the owner's approval, it was republished unchanged at 08:29Z: 200, and Approvals shows "Published (verified)" for the team's approved revision `4dfd2da9e3fd`. Details in the ledger. Its title still reads "Demo - Copy" | The team renames it in the editor |
| Personal accounts | No approved names, e-mails and roles; everyone uses the shared `tharikar98` Administrator account | Owner sends names, e-mails and roles |
| 9 waiting approval items (#8516, #9304, #10936, #11007, #11011, #11415, #11453, #11457, #11521, plus the team's 26 Oct submissions) | Other people's work; not touched | The team opens Approvals & Publishing and approves or rejects each, or re-opens the page and clicks Publish (0.7.10 publishes directly for administrators) |

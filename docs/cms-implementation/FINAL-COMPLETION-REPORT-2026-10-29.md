# Acadvizen: final completion report, 29 October 2026

- **Written:** 29 Oct 2026, 03:40 UTC (09:10 IST).
- **Covers work from:** 28 Oct 19:20 UTC to 29 Oct 03:40 UTC.
- **Follows:** [FINAL-REPORT-2026-10-28-EVENING.md](FINAL-REPORT-2026-10-28-EVENING.md) (commit `3130d97`), which is left as written.
- **Websites:**
  - Enrollment: https://enroll.acadvizen.com (WordPress/Elementor);
  - Main: https://www.acadvizen.com (Next.js, drawn from the same WordPress).
- **Shared admin:** https://enroll.acadvizen.com/wp-admin/.
- **Evidence:** `evidence/production-20261029/` unless another folder is named.

## Overall status: PARTIALLY COMPLETE

Every task that could be done from this environment is done and verified on the live websites. Two items are blocked outside it:

| Item | Exact blocker | Minimum action needed |
|---|---|---|
| Google **Request indexing** of https://enroll.acadvizen.com/ | Google refused to sign in inside the automated browser: "Couldn't sign you in. This browser or app may not be secure." (`search-console/gsc.log`, `gsc-signin-blocked.png`). This is Google's protection and was not worked around. No other tool here has Search Console access | In your own browser, signed in as a Search Console owner: open Search Console, choose the property covering enroll.acadvizen.com, then **URL Inspection** → paste `https://enroll.acadvizen.com/` → **Request indexing** (about one minute) |
| Timeline page image | The original file `ChatGPT-Image-Sep-3-2026-03_25_43-PM.png` (media #743) no longer exists. It is not in any backup (10, 14, 17 and 24 Oct), not on this computer, and not in the Internet Archive. It was deleted before 10 Oct (`timeline-image.txt`) | The team re-uploads the original image and selects it in the image widget on Timeline, or removes that widget |

## 1. Completed tasks and evidence

| # | Task | Result | Evidence |
|---|---|---|---|
| 1 | Fresh status audit | Branch `headless-wordpress` at `3130d97` (pushed). Plugin **0.7.11** live (public readme). The only uncommitted change is someone else's `next.config.mjs`, left untouched | `plugin-packages.txt` |
| 2 | Backup | **Done with the latest existing verified backup** (section 4) | `backup/` |
| 3 | Working copy #9304 | **Resolved:** no unique work (same design, settings, content and SEO as New Home #8517 and three of its archives). Discarded with the plugin's own action, so it is in the Trash and can be restored. **New Home #8517 stays in the Trash**; all its addresses answer 404 | `working-copy-9304.txt` |
| 4 | Timeline image | **Blocked:** the source cannot be found (see above). No substitute was used. The rest of the Timeline page renders at 3 widths with no other failed request | `timeline-image.txt`, `layout.out` |
| 5 | Main blog images | **All 86 posts audited**: 439 unique image addresses, of which 372 are Enrollment uploads (66 are on Supabase storage, 1 is on www). **All load (0 failed).** Visible text identical to the 23 Oct baseline for every post. The 372 to 319 to 303 discrepancy is explained in section 7 | `blog-images/` |
| 6 | Search Console | **Blocked** (above) | `search-console/` |
| 7 | Both websites live | Verified (section 5) | `regression-20261029.out`, `seo-heads.out`, `layout*.out`, `popups.out`, `redirects-robots.txt`, `main-text.out` |
| 8 | Publishing workflow | **14/14** state-machine test and **approval test all steps passed** on production (section 6) | `working-copy-live.out`, `approval-live.out` |
| 9 | Test artifacts | Test pages, their working copies and their 23 archived versions are in the Trash. **0 test records outside the Trash** | `inventory-20261029.json` |
| 10 | Inventory and duplicates | 378 page records (71 published, 1 private, 97 drafts, 209 in the Trash). **No published duplicates.** 8 working copies, all of published pages | `inventory-20261029.csv/.json` |
| 11 | Automated tests | PHP 367/367, JavaScript 318/318, PHP lint clean, secret scan clean | `automated-tests.out` |
| 12 | Documentation | Ledger, acceptance record, duplicate audit, capability matrix, operating manual and quick start updated; this report | — |

**Found during this work, not done by this work:** **Home1 #6177 (the homepage rollback draft) and its copy #11884 were moved to the Trash on 29 Oct at 02:10:33–38 UTC** through the admin. None of this work's tools touched WordPress at that time. Treated as the team's decision and not reversed; both stay restorable from the Trash for 30 days. `/home1/` still redirects to `/`. The earlier reports call Home1 "kept as rollback": that is no longer true.

## 2. Production changes in this period

| Change | When (UTC) | Verified |
|---|---|---|
| #9304 discarded to the Trash (plugin action) | 28 Oct 19:38 | yes |
| Test pages, copies and archives (CMS STATUS / APPROVAL TEST) moved to the Trash | 28 Oct 19:46 – 29 Oct 03:05 | yes |

There was no plugin or code deployment. **Plugin 0.7.11** (installed 28 Oct; package sha256 `d4265fed…a73b6`) is unchanged. The rollback package 0.7.10 (`0cd87f15…b0b778`) is in `dist/` and readable. **Main** is not redeployed (no Main code change). **Commit:** the commit that adds this report on `headless-wordpress`: tools `audit-main-blog-images.mjs` (new) and `verify-approval-live.mjs` (errors print one line), plus documents.

## 3. Search Console

- Not submitted: blocked by Google's sign-in protection (section "Overall status").
- Website side, re-verified 29 Oct:
  - the homepage answers 200 with one `<title>` ("Digital Marketing Course in Bangalore with AI | Acadvizen");
  - one canonical (`https://enroll.acadvizen.com/`);
  - robots `index, follow`;
  - listed in the sitemap;
  - robots.txt allows it.
- **Not claimed:** that Google has re-indexed it, or when it will.

## 4. Backup

| Question | Answer |
|---|---|
| Fresh backup created? | **No full backup.**<br>• Manual backups are locked on this Hostinger plan, which backs up weekly (recorded 26 Oct).<br>• The hPanel window for the owner's sign-in was opened twice (30 and 90 minutes); nobody signed in, so Hostinger's backup list was not read in this session (`backup/hpanel-attempts.txt`).<br>**Supplement:** a content snapshot was taken 29 Oct 03:12 UTC (WordPress's own export of pages, posts, Main blogs, locations, course, tools, templates, header/footer and menus; enquiries and form entries excluded), saved to `C:\Users\HP\Downloads\acadvizen-content-export-20261029\` with SHA-256 sums. **It is content only, not a full backup** |
| Newest existing backup found | Hostinger backup set **20261024094529 = 24 Oct 2026, 09:45:29 UTC (15:15 IST)** |
| Location and identifiers | Database: `C:\Users\HP\Downloads\acadvizen-backup-20261026\u713346627_xDzzw.20261024094529.sql.gz`, sha256 `b9f1a0fb…1dad9`.<br>Files: `C:\Users\HP\Downloads\u713346627.20261024094529.tar.gz`, sha256 `d404585a…b416` |
| Coverage | **Both:** the Enrollment WordPress database (`u713346627_xDzzw`), and the files of `domains/enroll.acadvizen.com/public_html` (WordPress, wp-config, plugins, themes, 8,569 upload entries) |
| Validation done on 29 Oct | Both checksums match the values recorded on 26 Oct; database gzip intact; files archive read completely (99,090 entries).<br>**Restore test:** imported into a throwaway MariaDB 11 container with no network (237 s, exit 0, 111 tables, site address, theme and pages present), then removed (`backup/restore-test-20261029.out`) |
| Suitable for | **Disaster recovery, or restoring single items** (a page, a file, a table) into a test copy. **Never restore it over the live site:** it predates everything since 24 Oct 15:15 IST (its homepage setting points to Home1 #6177) |
| Selected and why | The 24 Oct set: the newest one that is accessible, complete (files and database) and verified usable |
| Limitation | Settings changed after 24 Oct (Yoast deactivated, LiteSpeed exclusion, two redirects, plugin 0.7.11) are not in a full backup. Each has its own documented undo (evening report, section 8), and content changes are in the 29 Oct content snapshot.<br>Hostinger's next weekly backup should exist from about 31 Oct (hPanel → Websites → enroll.acadvizen.com → Files → Backups) |

## 5. Both websites, verified live (29 Oct 2026, 02:30–03:20 UTC)

| Check | Result |
|---|---|
| Main, all 320 baseline addresses | 320 × 200. Metadata (title, canonical, robots, description) identical to the 23 Oct baseline on **319/320**; the other is the intended MG Road canonical fix. Visible text **319/320**; the homepage differs only by its popup. Header and footer present on all 310 sitemap pages |
| Main Search Engine Optimisation (SEO) sample (8 addresses incl. home, about, courses, contact, blog, placement, a location page, a blog post) | One `<title>` each ("… \| Acadvizen"), one canonical (itself), no Yoast output, no "(Main)" or "enroll.acadvizen.com" in titles |
| Main sitemap and robots | `/sitemap.xml` 200, 310 addresses; robots.txt `Allow: /`, sitemap address (forwards once to www) lists the same 310 |
| Main protected routes (regression only) | `/admin` 200 (sign-in), `/admin/leads` 200, Leads API anonymous 401, content lock `POST /api/cms/pages` 423 |
| Main `/career` | 404 (no such Main page; the `/career/` canonical problem was on Enrollment and is fixed there) |
| Enrollment, 59 baseline pages | Identical to 23 Oct on 57; the 2 differences are explained (homepage robots-attribute order; `/test/` retired on purpose) |
| Enrollment SEO sample (10 addresses) | One `<title>` and one canonical each, Rank Math only, no Yoast |
| Enrollment sitemap and robots | 58 addresses, all 200, sitemaps sent with `no-cache`; robots.txt blocks only `/wp-admin/` and shop internals |
| Redirects | 11 retired or old addresses → one hop each to their equivalent; `/new-home/` and the former `#9304` address 404 (intended) |
| Layout | 14 Enrollment pages × 1440/768/390 px (home, About Us, Mentors, Placement, Careers, Courses, Partnership, Timeline, Social Media, Contact Us, Branches, Projects, Placement Support, PG Diploma): **no horizontal overflow, no broken image, no empty template section**, header/footer/forms present. The one failed request is the Timeline image above |
| Popups and buttons | 6 buttons clicked as a visitor (Explore Acadvizen ×3, Book Free Career Counselling, Contact Now, Book a Free Demo Class): **all open popup #7696** |
| Enquiry | Route `/wp-json/acadvizen/v1/enquiry` present (POST only); enquiry forms present on the homepage (2) and Contact Us (1). **No enquiry was submitted** |
| Signed CMS routes | manifest and render answer 401 to anonymous visitors, `no-store` |

Not covered: browser-console errors on Main pages (only Enrollment pages were rendered in a browser here), and form submission (not allowed).

## 6. Publishing workflow (production, from 28 Oct 19:39 UTC, plugin 0.7.11)

- **State machine, 14/14 PASS** (`working-copy-live.out`), Enrollment test page, noindexed:
  - draft not public;
  - preview leaves it Draft;
  - Publish → Published with one list row;
  - 3 updates: same ID and address, still Published, editor badge "no unpublished changes";
  - an unpublished change is labelled as such;
  - fresh session;
  - double publish creates no new page;
  - publishing a copy of a trashed page is refused.
- **Approval, all steps PASS** (`approval-live.out`), Publish To **Both**, noindexed test page:
  - draft not public on either site;
  - Publish by request → waiting;
  - approve → publish: live on Main and Enrollment;
  - a direct change to the live page is refused (403);
  - the change waits in the working copy;
  - Reject keeps the live version;
  - resubmit → approve → live on both;
  - Restore puts the earlier version back on both;
  - Unpublish → gone from both (404).
- **Clean-up:** every test record is in the Trash; none is in a sitemap; their addresses answer 404.

## 7. Main blog images: findings for all 86 posts

- **Current state** (`blog-images/main-blog-images-1.csv`, one row per post, and `.json` with every address and its HTTP status):
  - 86/86 posts answer 200;
  - 439 unique image addresses (372 Enrollment uploads, 66 Supabase, 1 www);
  - **0 failed**;
  - 712 `<img>` tags in post content;
  - each post also shows the same 3 thumbnails of other posts.
- **Stability:** 4 full rounds over 13 minutes (`blog-images/rounds.json`): 372 every round, **0 posts changed**. Cached against cache-busted renders (`blog-images/cached-vs-fresh.json`): 372 and 372, 0 posts with fewer images.
- **Text integrity:** visible text of all 86 posts identical to the 23 Oct baseline (`main-text.out`).
- **The discrepancy:**
  - 372 is also what the 27 Oct and 28 Oct morning checks counted;
  - the lower numbers (319 on 28 Oct evening, 303 in this morning's regression, 311 in a test at 02:50 UTC) came only from the regression script's way of fetching (a cache-busting query and 6 parallel requests, where a non-200 or failed fetch counts as an empty page). Those runs did not save their per-post lists;
  - two later targeted tests with the same fetching found no post with fewer images.

  **Conclusion:** no image was lost, and what visitors receive is complete and stable. The exact cause of the transient lower counts was **not reproduced and is not proven** (possibly failed fetches during the network outages of 28 Oct, or briefly degraded fresh renders). No content was restored, because nothing was found missing.

## 8. Tests

| Test | Result | Output |
|---|---|---|
| PHP (Docker, PHP 8.3) | 367/367 | `automated-tests.out` |
| PHP lint (all plugin files) | clean | `automated-tests.out` |
| JavaScript unit | 318/318 | `automated-tests.out` |
| Secret scan (all tracked files) | clean | `automated-tests.out` |
| Live state machine | 14/14 | `working-copy-live.out` |
| Live approval (Both) | all steps PASS | `approval-live.out` |
| Main build | **not run:** no Main code or shared build dependency changed (live smoke and full regression run instead) | — |
| Backup restore test | PASS | `backup/restore-test-20261029.out` |

## 9. Outstanding items

| Item | Status | Reason | Minimum action |
|---|---|---|---|
| Google Request indexing | **Blocked** | Google refuses sign-in in the automated browser | Owner: URL Inspection → `https://enroll.acadvizen.com/` → Request indexing |
| Timeline image | **Blocked** | Original file exists nowhere accessible | Team: upload the original and select it in the image widget (or remove the widget) |
| Fresh full Hostinger backup | Not created (manual backups locked; weekly schedule). **The 24 Oct set is used, verified and restore-tested** | Hosting plan | Optional: after about 31 Oct, check hPanel → Backups for the new weekly set and download it |
| Home1 in the Trash | Information | Trashed by the team, 29 Oct 02:10 UTC | If it should stay as the rollback: Pages → Trash → Restore (both #6177 and #11884) |
| ElementsKit Lite, EmailKit, Pixel Manager inactive | Owner decision (from 28 Oct) | Not used by any design | Decide; no effect seen on the websites |

## 10. Rollback

| Change | Undo |
|---|---|
| #9304 discarded | Pages → Trash → Restore |
| Test records | None needed (Trash) |
| Everything from 28 Oct | See the evening report, section 8 (Yoast, homepage title, button links, redirects, LiteSpeed, plugin 0.7.10 package) |
| Disaster recovery | The 24 Oct backup set (section 4), restored by Hostinger or into a new site. Never over the live site |

## 11. Evidence index (`docs/cms-implementation/evidence/production-20261029/`)

| Path | Contents |
|---|---|
| `backup/` | checksum and integrity check, files-archive sample, restore test, content-export checksums, hPanel attempts |
| `search-console/` | sign-in attempt log and Google's refusal screenshot |
| `timeline-image.txt` | source search for the missing image |
| `working-copy-9304.txt` | #9304 comparison and disposition |
| `inventory-20261029.csv/.json` | all 378 page records with classification |
| `blog-images/` | per-post audit (CSV/JSON), stability rounds, cached vs fresh, fetch-method comparison |
| `regression-20261029.out/.txt`, `main-text.out` | full Main and Enrollment regression, visible text |
| `seo-heads.out/.json`, `redirects-robots.txt` | titles, canonicals, robots, redirects, robots.txt |
| `layout.out`, `layout-rerun.out`, `layout/` | renders at 3 widths |
| `popups.out`, `popups/` | button click tests |
| `working-copy-live.out`, `approval-live.out` (+ folders) | live publishing tests |
| `automated-tests.out`, `plugin-packages.txt` | unit tests, lint, secret scan, packages |

No cookie, password, nonce or token appears in these files (scanned 29 Oct). The only e-mail address is the public business contact printed on the homepage, captured by the text comparison in `main-text-changes.json`; no account e-mail appears.

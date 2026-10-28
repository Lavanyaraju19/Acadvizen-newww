# Acadvizen: production repair and verification, 28 October 2026 (evening)

- **Written:** 28 Oct 2026, 19:30 UTC (29 Oct, 01:00 IST).
- **Covers work from:** 28 Oct, 11:50 UTC to 28 Oct, 19:30 UTC.
- **Websites:**
  - Enrollment: https://enroll.acadvizen.com (WordPress/Elementor);
  - Main: https://www.acadvizen.com (Next.js, drawn from the same WordPress through the Render Bridge).
- **Shared admin:** https://enroll.acadvizen.com/wp-admin/ (the only CMS for both websites).
- **Earlier report of the same day:** [FINAL-HANDOVER-REPORT-2026-10-28.md](FINAL-HANDOVER-REPORT-2026-10-28.md). It recorded the state at 10:35 UTC. This report records what changed afterwards and what was found and fixed; the earlier report is left as written.

## Overall verdict: PARTIALLY COMPLETE (two genuine external blockers)

Everything that can be done on the websites is fixed and verified on production:
- correct titles and single canonicals on both websites;
- the homepage is titled "Home";
- no duplicate pages;
- Draft/Published shown correctly (plugin 0.7.11, state-machine test 14/14 on production);
- dead popup buttons repaired;
- old addresses redirected in one hop;
- sitemaps not cached;
- New Home still in the Trash.

Two items cannot be completed from this environment:
1. **Google showing the old "Demo - Copy" title** clears only when Google recrawls the homepage. Requesting that needs the Search Console owner (section 2).
2. **A fresh full database backup** needs hosting (hPanel/SSH) access. The latest verified backup is from 26 Oct. Every change made today has its own undo (section 8), so none depends on that backup.

## 1. What was wrong, why, and what was done

| # | Observed | Root cause (evidence) | Fix | Verified on production |
|---|---|---|---|---|
| 1 | Google shows the Enrollment homepage as **"Demo - Copy"** | The homepage #11892 is titled "Demo - Copy" in WordPress. That was the team's name for the page they published as the homepage on 27 Oct, and its address is `/demo/`.<br>• **27 Oct:** for a few hours before its Rank Math title was set, the page's own title was the browser title Google read.<br>• **28 Oct, after 10:18 UTC:** Yoast SEO was activated (see #2) and printed "Demo - Copy - enroll.acadvizen.com" again, although Rank Math held the correct title | Yoast deactivated; the page's WordPress title changed to **"Home"** through the CMS (Publish, verified) | `<title>` = "Digital Marketing Course in Bangalore with AI \| Acadvizen"; one canonical `https://enroll.acadvizen.com/`; WordPress title "Home"; `/demo/` → 301 → `/` |
| 2 | Wrong titles on **every page of both websites**: "About (Main) - enroll.acadvizen.com", "Mentors - enroll.acadvizen.com" and so on, plus **two canonical tags** per page, several of them wrong:<br>• `/career/` (redirects to the **Mysore** page);<br>• `/about-us/`;<br>• `/paternship/`;<br>• `/performance-marketing-ad-tech-scaling/` on the Social Media page | **Yoast SEO 28.8 had been activated next to Rank Math.** It was installed but inactive in the 24 Oct file backup, and absent from every page's HTML up to this morning's regression (10:18 UTC).<br>The plugins list shows that **every plugin was deactivated and reactivated within the last week** (WordPress "Recently Active"); since then Yoast is active and ElementsKit Lite, EmailKit and Pixel Manager are inactive.<br>No page has any Yoast field filled in, so Yoast generated titles from raw WordPress titles and stale permalinks | **Yoast deactivated** (owner approved; still installed). ElementsKit Lite, EmailKit and Pixel Manager were left as they are: none is used by any design, and none shows on the public pages | Before/after head capture of 16 addresses: one `<title>` and one canonical each, all Rank Math. Main 320 addresses: 319 identical to the 23 Oct baseline, the other being the intended MG Road canonical fix (`evening/regression-evening.out`) |
| 3 | "Published page shows **Draft** in the CMS" | **Possibility C, with B.** Editing a live page always happens in a separate **working copy** (a draft record), by design. When an administrator publishes from Elementor, the copy's content goes to the live page, and the copy is set back to Draft so the editor can keep working. So:<br>• the editor shows "Draft" right after a successful Publish;<br>• the Pages list showed an extra "Draft" row with the same title next to the live page.<br>The authoritative record (the live page, same ID and address) stays **Published**: verified for every page published today (`approvals-history-redacted.json`). WordPress never reverts it (A: ruled out). No response is lost (D: ruled out; every publication was verified on its website by the plugin's own check) | **Plugin 0.7.11.**<br>• Each working copy reports its live page's real status: an Elementor badge (refreshed after each save), the edit-screen Approval box, and the Pages-list label.<br>• Copies identical to their live page are no longer listed as extra "Draft" rows.<br>• Copies with changes not yet live are labelled "Unpublished changes to a live page (the live page stays published)".<br>Status meanings are unchanged | Live state-machine test on production: **14/14 PASS** (`working-copy-0711-run4.out`; section 4) |
| 4 | A page titled **"New"** was "published" four times (09:47–10:16 UTC), and each time its check failed | **#9304 is the working copy of New Home #8517, which is in the Trash.** The plugin accepted it, applied the content to the trashed page, then reported "Failed" because a trashed page is never public. New Home **was not restored**: it is still in the Trash and its address is 404 | **0.7.11 refuses** to submit or publish a working copy whose live page is in the Trash or unpublished, and says why; nothing changes. **New Home #8517 stays in the Trash** (owner instruction); its working copy #9304 is left untouched for the team | Live test step 9: refusal, trashed page unchanged, 404, badge "is in the Trash: this working copy cannot be published" |
| 5 | **Buttons that do nothing** (found by this audit):<br>• "Explore Acadvizen" on Home, About Us and Courses;<br>• "Book Free Career Counselling" on Placement;<br>• "Contact Now" on Contact Us | They open popup **#2941 "Acadvizen Admission Popup", which was never published**; Elementor shows only published popups to visitors. **Correction to the 27 Oct audit:** it moved #2941 to the Trash as "unused", because its reference check did not decode Elementor's popup links. The buttons already did nothing while #2941 was a Draft: verified live after restoring it to Draft | #2941 restored to Draft (its pre-27 Oct state). With the owner's decision, the five buttons now open the **published admission popup #7696**, through the CMS (one Publish per page) | Each button clicked as a visitor: popup #7696 opens (`evening/popups/`). Pages keep their ID, address, title and Published status (`repoint-*.out`) |
| 6 | **"The Enrollment layout changed after the cleanup"** | **No layout regression was found.**<br>Every key Enrollment page was rendered at 1440, 768 and 390 px: no horizontal overflow, no failed CSS/JS/image/font request, no empty template section, and header, footer and forms present.<br>The five merged pages were compared with the "-1" designs the owner chose on 27 Oct:<br>• the stored Elementor designs are **element-for-element identical**;<br>• Mentors and Placement render to the **same pixel height** at desktop and phone;<br>• Courses, Partnership and Careers are 79 px (desktop) / 72 px (phone) shorter only because the "-1" pages displayed the theme's page-title bar ("Courses 1", "Career 1"), which the original pages hide (`hide_title`).<br>The other differences seen in screenshots were images and CSS that had not finished loading in the 27 Oct capture.<br>What did change since 26 Oct: the team's own homepage edits (8 publications on 28 Oct), the owner-approved "-1" designs, and an Elementor update 4.3.3 → 4.3.5 (between 26 and 27 Oct) | Nothing to restore. The one broken image (`/timeline/`) predates the cleanup: it is absent from the 24 Oct backup | `evening/layout/` (screenshots, `layout.json`), `layout.out`, `evening/layout2.out`, `layout/layout2.json` |
| 7 | Enrollment sitemaps returned "not found" (28 Oct morning, 4th time) | WordPress rewrite rules lost (cause outside the plugin), and LiteSpeed then cached the 404 for an hour | Earlier today: rules rebuilt and the cached 404 purged. **Now also:** LiteSpeed **Do Not Cache URIs** = `sitemap_index.xml`, `-sitemap` (owner approved; the field was empty; only that field changed) | Sitemaps answer 200 with `no-cache`; normal pages are still served from cache (`hit`) |
| 8 | Old addresses of live pages:<br>• `/career/` went to the unrelated **Mysore** course page (a WordPress guess);<br>• `/paternship/` answered 404 | Both are former addresses of the Career and Partnership pages: Yoast still held them as those pages' permalinks. No redirect existed | Rank Math 301 redirects `/career/` → `/digital-marketing-jobs/` and `/paternship/` → `/partnership/`; LiteSpeed purge of those two addresses | Plain requests, one hop each (`evening/redirects-final.txt`) |
| 9 | (Found during this work) Playwright error output printed the WordPress session cookie | A test tool's clean-up ran into a DNS failure, and Playwright's error includes the request headers | That session was **signed out on the server** (verified: the exposed cookie no longer works); the text was removed from the evidence file and the task log; the tool now prints only the first line of any error | No password, key or other credential involved; the owner signed in again through the normal login |

## 2. Google result, SEO and indexing

- **The exact Google result:** no screenshot or Search Console access was available in this environment. The website side was identified from evidence:
  - the homepage served the browser title "Demo - Copy - enroll.acadvizen.com" on 27 Oct and again from 28 Oct ~10:18 to 12:34 UTC;
  - the homepage is the only public record titled "Demo"/"Copy" (inventory, section 3).
- **Intended destination:** https://enroll.acadvizen.com/, title "Digital Marketing Course in Bangalore with AI | Acadvizen" (Rank Math).
- **Website-side fixes (verified):**
  - the correct title and description;
  - one canonical tag;
  - robots `index, follow`;
  - listed in the page sitemap;
  - `/demo/` → 301 → `/`;
  - the WordPress title is "Home";
  - no other public page is titled Demo or Copy;
  - caches purged by LiteSpeed on the plugin change and by each Publish; fresh responses checked.
- **Search Console: not done (no access here).** Google refreshes the snippet on its next crawl. To speed it up, the owner (Search Console property owner) can open **URL Inspection → https://enroll.acadvizen.com/ → Request indexing**. Do the same for any Main page whose old "(Main) - enroll.acadvizen.com" title appears in results. Until Google recrawls, its results may still show the old title; **that delay is on Google's side and is not verified here.**
- **Robots and sitemaps:**
  - robots.txt unchanged;
  - no `noindex` was added anywhere except on the temporary test pages;
  - Enrollment sitemap index and page/post sitemaps answer 200 and are no longer cached;
  - the Enrollment sitemap lists 58 addresses, all answering 200 (`evening/regression-evening-enrollment.out`); retired addresses, drafts and Trash items are not listed; the 20 Main-only "(Main)" records are excluded by design and answer 404 on Enrollment.

## 3. Page inventory and duplicates

Full inventory: `evidence/production-20261028/evening/inventory-20261029.csv` (and `.json`). One row per WordPress page record in every status, with:
- ID, title, address, status, parent and homepage role;
- Elementor use, Publish To and Main address;
- working-copy and archive links;
- Rank Math title, canonical and robots;
- sitemap presence, menu references, design fingerprint and classification.

On 28 Oct, 19:10 UTC, there were **364 page records** in WordPress:

| Group | Count | Notes |
|---|---|---|
| Published | 71 | 69 pages + the homepage #11892 + the posts page "Blogs" #5436. 20 of the 69 are Main-only records ("… (Main)", #11325–#11344), drawn only on www.acadvizen.com; their Enrollment addresses answer 404 by design |
| Private | 1 | #7838 "Global Styles (editing page, never published)", the editor page of the shared styles |
| Drafts | 113 | 100 archived versions (kept for Restore, hidden from lists); 10 working copies; 3 standalone drafts: #3570 "Members" (old, never public), #6177 "Home1" (homepage rollback), #11578 "Project 1" (unfinished; its address 301-redirects to `/projects-2/`) |
| Trash | 179 | 51 pages (retired duplicates, test pages, New Home #8517), 80 working copies, 48 archived versions; restorable until WordPress empties the Trash (30 days after each item) |

Templates (Elementor library): 57 records (30 published, 2 drafts including popup #2941, 11 in the Trash, 14 attachments).
Rank Math redirections: 12. These are the 10 existing ones plus `/career/` → `/digital-marketing-jobs/` and `/paternship/` → `/partnership/`, added today: both are former addresses of those pages, and `/career/` was landing on the unrelated Mysore page.

Working copies that can no longer be published, because their live page is not published:
- #9304 "New" (of New Home #8517, in the Trash);
- #11884 "Home1" (of the Home1 draft #6177).

- **Homepage:** Settings → Reading = page **#11892** (title now "Home"), served at `/`, Published, `index, follow`, in the sitemap. **Home1 #6177** is a Draft kept as the rollback of the previous homepage, not public; its old addresses redirect to `/`.
- **About Us:** **#969** at `/about-us-digital-marketing-institute-jayanagar/`, Published, one canonical (itself). `/about-us/` forwards there in one 301 (WordPress). The Main Website's About page is a separate record, #11327 "About (Main)", drawn only on www.acadvizen.com/about.
- **New Home #8517:** in the Trash, address 404, not restored (owner instruction). Its working copy #9304 "New" remains a draft; 0.7.11 now refuses to publish it while #8517 is in the Trash.
- **Confirmed public duplicates now:** **none.** No two published records share a normalised title or an identical design.
- Justified exceptions: `/placement-2/` "Placement Support" #3647 and `/projects-2/` "Projects" #6412 have "-2" addresses but are distinct pages, kept by the 27 Oct audit. Changing their addresses would break existing links.
- The homepage keeps the address `/demo/` internally. It is served at `/`, and `/demo/` 301-redirects there.

## 4. Draft/Published: state machine as tested on production

Test page "CMS STATUS TEST …" (Enrollment only, noindexed before it was ever public, moved to the Trash afterwards), plugin 0.7.11, administrator account, `tools/verify-working-copy-live.mjs`:

| Step | Expected | Result (28 Oct, 18:59–19:07 UTC, run 5) |
|---|---|---|
| Create draft | one Draft record, not public | PASS: #12835 Draft, public 404 |
| Preview | admin sees the draft; status stays Draft; not public | PASS: preview 200; Draft; public 404 |
| Publish (administrator, direct) | Published; live shows the content; Pages list shows one row, not labelled Draft | PASS |
| Update ×3 | same page ID and address, still Published, live content updated; same working copy; editor badge "Published … no unpublished changes"; list shows only the live page | PASS ×3 |
| Unpublished change (Save Draft in the copy) | live unchanged; the copy is listed as "Unpublished changes to a live page"; badge "not live yet" | PASS |
| Fresh browser session | live row not "Draft"; status endpoint: live Published, changes pending | PASS |
| Publish twice (retry) | still one page listed; live shows the latest; Published | PASS |
| Live page moved to the Trash, then Publish of its working copy | refused; page stays in the Trash, unchanged, 404; History "refused"; badge "is in the Trash" | PASS |
| Clean-up | test page and copy in the Trash; not in the sitemap; 404 | done |

**14/14 PASS.** Earlier runs on the same day:
- runs 1 and 2 were cut off by local DNS failures;
- run 3 (13/14) failed one assertion that expected a reason code which the History table does not show;
- run 4 (13/14) read the editor badge before its post-save refresh arrived. The server status was correct in the same run.

Both assertions were corrected in the tool. All outputs are kept.

**Approve, Reject, Restore, Unpublish** were not re-run on 0.7.11; that code is unchanged. Their last production run was the 16/16 approval test on 28 Oct (0.7.10).

**Enrollment, Main and Both.** Earlier on 28 Oct (09:33–09:54 UTC, plugin 0.7.10, same publishing code apart from 0.7.11's additions), all on production:
- design test: Main / Enrollment / Both 37/37;
- approval test: Both 16/16 (submit, approve, reject, resubmit, restore, unpublish; per-website verification, partial failure reported per website);
- recorded in [FINAL-HANDOVER-REPORT-2026-10-28.md](FINAL-HANDOVER-REPORT-2026-10-28.md).

0.7.11 changes only what is shown about working copies, and adds a refusal for copies of non-published pages. The per-destination publishing and verification code is unchanged.

## 5. Live verification (both websites)

Checked 28 Oct 2026, 15:15–19:15 UTC, anonymous visitor, fresh responses:

| Address | HTTP / final | Title (single) | Canonical (single) | Notes |
|---|---|---|---|---|
| enroll `/` | 200 | Digital Marketing Course in Bangalore with AI \| Acadvizen | `https://enroll.acadvizen.com/` | Front page #11892 "Home"; `index, follow`; in the sitemap; "Explore Acadvizen" opens popup #7696 |
| enroll `/about-us-digital-marketing-institute-jayanagar/` | 200 | About Us - enroll.acadvizen.com | itself | `/about-us/` → 1 hop here; button opens #7696 |
| enroll `/mentors/`, `/placement/`, `/digital-marketing-jobs/`, `/courses/`, `/partnership/` | 200 | own Rank Math titles | itself | Designs identical to the owner-chosen "-1" designs; `-1`/`-2` and old addresses → 1 hop |
| enroll `/digital-marketing-course-enquiry/` (Contact Us) | 200 | — | itself | "Contact Now" opens #7696 |
| enroll sitemap index, page and post sitemaps | 200, `no-cache` | — | — | 58 addresses, all 200 |
| enroll `/wp-json/acadvizen/v1/enquiry` | route present, POST only | — | — | not submitted (no real enquiries) |
| enroll `/wp-json/acadvizen-cms/v1/manifest`, `render` | 401 anonymous, `no-store` | — | — | signed routes protected |
| www `/` | 200 | Acadvizen: Digital Marketing Course in Bangalore with AI Training | `https://www.acadvizen.com` | popup and dialog styles present |
| www `/about`, `/courses`, `/contact`, `/blog`, `/digital-marketing-course-in-btm-layout` | 200 | "… \| Acadvizen" | itself | no "(Main)" or "enroll.acadvizen.com" in titles |
| www, all 320 baseline addresses | 200 | — | — | Metadata 319/320 identical to the 23 Oct baseline (the MG Road canonical fix intended); visible text 319/320 (the homepage popup) |
| www `/admin`, `/admin/leads` | 200 (route) | — | — | protected; anonymous Leads API 401; content lock POST `/api/cms/pages` 423 |

**Layout:** 12 key Enrollment pages at 1440 / 768 / 390 px (`evening/layout*.out`):
- no horizontal overflow, broken image or empty template section;
- header, footer and forms present.

The only failed request is one image on `/timeline/` (`uploads/2026/09/ChatGPT-Image-Sep-3-2026-03_25_43-PM.png`, 404). That file is missing from the 24 Oct full backup too, so it is a **pre-existing content gap, not caused by the cleanup**.

**Main blog images:** all 319 image addresses found on the 86 posts load. This morning's run counted 372 addresses on the same posts. The visible text of every post is unchanged, and the morning list was not saved, so which 53 addresses no longer appear cannot be determined: **not explained**.

## 6. Tests, lint, build

| Check | Result | Environment |
|---|---|---|
| PHP tests (`tests/php/run.php`, PHP 8.3 in Docker) | **367/367 pass** (8 new for 0.7.11) | local |
| PHP lint, every plugin file | no syntax errors | local |
| JavaScript unit tests | **318/318 pass** | local |
| Secret scan, all tracked files | clean | local |
| Main build / lint | **not run:** no Main code changed today (the uncommitted `next.config.mjs` change is someone else's and was not touched) | — |
| Plugin package | 0.7.11, 28 files byte-identical to source, sha256 `d4265fed0039027d93e71a962f9f3dbac5e34dee16f13f90928cacebeb2a73b6` | local |
| Live working-copy test | **14/14 PASS** (run 5) | **production** |
| Full regression, Main 320 + Enrollment | Main metadata 319/320 and text 319/320 vs 23 Oct (explained); Enrollment 57/59 (the 2 known differences); sitemap 58/58; routes OK | **production** |

## 7. Deployment

- **Plugin 0.7.11:** installed on production through Plugins → Upload (Replace current with uploaded), with the owner's approval, on 28 Oct before 17:26 UTC (the first test against it started then). WordPress reported "Plugin updated successfully". The plugin is active, and the public readme shows `Stable tag: 0.7.11`.
- **Commit:** the commit that adds this report, on branch `headless-wordpress`: plugin 0.7.11 code, tests, tools and documents. The commit hash is shown in the chat message that hands over this report.
- **Main:** no deployment (unchanged, `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa`).

## 8. Backup and rollback

| Change | Undo |
|---|---|
| Yoast deactivated | Plugins → Yoast SEO → Activate (not recommended, see section 1 #2) |
| Homepage title "Home"; five button links → #7696 | Approvals & Publishing → Recent publications → **Restore** on the page (each publication archived the previous version) |
| #2941 restored to Draft | Templates → Popups → Trash (only if no button uses it; none does now) |
| LiteSpeed Do Not Cache URIs | LiteSpeed Cache → Cache → Excludes → empty the field → Save |
| Plugin 0.7.11 | Upload the 0.7.10 package `dist/acadvizen-cms-0.7.10-worktree-c3ea1d8461ec/acadvizen-cms.zip` (Replace current with uploaded) |
| Test pages | In the Trash; nothing to undo |

- **Database backup:** the latest verified backup is the **26 Oct** database backup recorded in [PRODUCTION-ACCEPTANCE-2026-10-26.md](PRODUCTION-ACCEPTANCE-2026-10-26.md). **No new full backup was taken today:** this environment has no hosting (SSH/hPanel) access, and no change made today needs a database restore to undo. Every change above has its own undo.
- **Restoration was not re-tested today.**
- Never restore an older full backup over the live website.

## 9. Evidence files

All under `docs/cms-implementation/evidence/production-20261028/`:

| File | Contents |
|---|---|
| `evening/heads-before.json`, `heads-after-yoast*.json` | Head tags before and after Yoast was deactivated |
| `evening/regression-evening.out`, `regression-evening-enrollment.out` | Full regression against the 23 Oct baselines |
| `evening/layout/`, `evening/layout.out`, `evening/layout2.out`, `layout/layout2.json` | Layout audit at 3 widths, plus the comparison images |
| `evening/popups/`, `evening/repoint-*.out` | Button fixes and click tests |
| `evening/approvals-history-redacted.json` | Publishing history (account e-mail redacted) |
| `evening/inventory-20261029.csv` / `.json` | Page inventory (A) |
| `working-copy-0711-run*.out`, `working-copy-0711/` | Live state-machine tests (runs 1–3 were interrupted by the local network or failed one assertion; see section 4) |

## 10. Remaining items

| Item | Who | Effect while open |
|---|---|---|
| Request re-indexing of https://enroll.acadvizen.com/ (and any Main page shown with an old "(Main)" title) in Google Search Console | Owner (Search Console access) | Google may show the old title until it recrawls |
| Fresh full backup (database and files) through hPanel | Owner / host | None for today's changes (each has its own undo); good practice after a day of changes |
| Re-upload the missing Timeline image (`ChatGPT-Image-Sep-3-2026-03_25_43-PM.png`) or remove it from the page | Team | One image does not show on `/timeline/` (pre-existing) |
| Decide on ElementsKit Lite, EmailKit and Pixel Manager (inactive since the bulk plugin reactivation; not used by any design) | Owner | None seen on the websites; Pixel Manager is for WooCommerce tracking |
| Working copy #9304 "New" (of New Home in the Trash) | Team | Cannot be published (0.7.11); discard it, or restore New Home only with the owner's approval |
| Homepage address `/demo/` | Optional | None: served at `/`, and `/demo/` 301-redirects there |

# Duplicate and test-content audit, 27 Oct 2026

**For:** the owner and the team.

**Covers:** https://www.acadvizen.com (Main) and https://enroll.acadvizen.com (Enrollment). Every Main page is a WordPress document in the Enrollment admin, so both websites were audited from one WordPress plus each website's public pages.

**Times:** UTC.

## 1. Result in numbers

| | Count |
|---|---|
| **Removed** (test content and confirmed redundant copies) | **76** items: 75 moved to the WordPress **Trash** (restorable until about 26 Nov 2026), 1 test image deleted (file kept) |
| **Retained intentionally** (each with a reason, section 4) | 21 version archives, 8 working copies, 38 templated location pages, 4 Main city/area pages, 3 cross-site same-name pages, 2 "Mega Menu … Copy" templates, 1 template archive |
| **Awaiting review** (owner or team decision, section 5) | 9 groups: 10 published Enrollment pages in 5 pairs, 23 items of two retired homepages, 2 extra Demo copies, 1 "Test" draft with real content, 8 template drafts, 145 duplicate media copies, 1 wrong canonical, 10 test blogs in Main's own database |
| Exact duplicates still public | **0**. No two public pages on either website, or across the two, have the same body text. No sitemap lists an address twice |

"Zero duplicates" would not be true: the near-identical location pages (kept on purpose) and the items under review remain.

## 2. How the audit was done (read-only first)

- **Every content type in the admin:**
  - Pages, Posts, Main Blogs, Locations, Tools, Courses, Templates, Header/Footer;
  - per item: ID, title, status, plugin labels ("Working copy of a live page", "Waiting for approval"), Publish To, website status, slug.
- **The REST API view of pages, posts, templates and media.** It includes the plugin's version archives, which the admin lists hide.
- **Approvals & Publishing:** the Main addresses; plus the Rank Math redirections.
- **Public pages of both websites:** every sitemap address (Main 310, Enrollment 65). For each: status, title, canonical and robots. Each page's own body text was extracted from its Elementor document, without header, footer or popups, then compared:
  - exactly, by hash;
  - for near duplicates, by 5-word overlap of at least 80 %;
  - within each website and across the two.
- **Detail checks of every suspect:**
  - author, dates and stored content size;
  - the signed-in preview;
  - menu references;
  - for #8512, a word-level comparison with #3874.
- **Plugin code paths:** I confirmed that **Trash** fires none of the plugin's delete hooks. Removal from Main and deletion of version records happen only on permanent deletion. Trashed blog drafts send nothing to Main.

Raw inventories and logs are kept locally, not in Git: `dup-inventory.json`, `dup-content.json` and the cleanup log.

## 3. Removed (76)

**Recovery.** Before each item was touched:
- it was re-read, and skipped if anything had changed since the audit (none had);
- its full record (content, title, slug, status, template, meta) was saved locally in `dup-cleanup-backup-20261027/`.

Pages and posts went to the **Trash**: *Pages → Trash → Restore* brings any of them back until WordPress empties the Trash after 30 days. Items created before 24 Oct 15:15 are also in the verified backup of 24 Oct.

| # | What | IDs | Why it is redundant |
|---|---|---|---|
| 54 | Labelled test pages "CMS ACCEPTANCE / APPROVAL / SCHEDULE / FAILURE …" (18–26 Oct): 26 pages + 28 of their version archives | 8402–11862 | Our production acceptance runs; all drafts; addresses already 404 on both websites; no menu or link pointed at them |
| 7 | Posts "CMS PRODUCTION TEST blog …" | 8289, 8296, 8471, 8478, 8486, 8764, 8771 | Drafts created by `tools/verify-wordpress-live.mjs` (15–19 Oct) |
| 10 | Main Blogs drafts: 9 "CMS PRODUCTION TEST blog …" + `e2e-acadvizen-staging-blog-…` | 10547–10555, 10575 | Test drafts imported from Main's database. The e2e one is from the project's e2e suite (recorded in BASELINE.md as a harmless test draft). Never public |
| 1 | Page "Social Media & Influencer Marketing" `/social-media-influencer-marketing/` (published) | 8512 | 96 % word-for-word copy of #3874 `/learn-digital-marketing/`, created 19 Oct. #3874 is the canonical page: it is in the Courses and Main menus. A Rank Math 301 already sent #8512's address to #3874, so the copy was unreachable and only added a redirecting entry to the sitemap. **The redirect is kept** |
| 1 | Page "Elementor Page #8343" | 8343 | Empty draft (no content, no Elementor design), default title, no references |
| 2 | Posts "Akhil" | 175, 176 | Two identical empty drafts (8 Aug), no content, no references |
| 1 | Image "CMS ACCEPTANCE media 202610181847" | 8507 | Test upload of the 18 Oct acceptance run, attached to nothing. Media cannot go to the Trash: the file and record are saved locally, and it is also in the 24 Oct backup |

## 4. Retained intentionally

| Items | Reason |
|---|---|
| **21 version archives** of live pages: About Us 10, Demo/demo 8, Mentors 1, Mentors 1 1, Branches 1 | The plugin's version history behind **Restore** (at most 10 per page, pruned automatically). Hidden from the admin lists by design |
| **8 working copies**: #8516 Performance Marketing Course (the waiting approval item), #9349 About Us, #10996 Paternship, #11010 Placement, #11457 Mentors 1, #11526 Career 1, #11935 Demo – Copy (the homepage's copy), #11799 Header | The plugin's editing mechanism: visitors see the live page while the copy is edited. A copy is kept after publishing so the open editor keeps working. Copies can hold unpublished edits |
| **38 location landing pages that read almost the same:**<br>• Enrollment 33 area pages (for example `/digital-marketing-institute-in-koramangala/` and `/digital-marketing-institute-in-tirupati/`);<br>• Main 5 Bangalore course pages (`/seo-course-in-bangalore`, `/google-ads-course-in-bangalore`, …) | One design per area or course, with the place or course name changed. Each targets its own search. Intended, not accidental. A copywriter may want to vary the text for SEO |
| **4 Main city/area pages**: `/digital-marketing-courses-bangalore` and `/digital-marketing-course-bangalore`; the same pair for Mysore | Different page types from Main's original structure (city page and area page; 32 % similar). Both existed before the migration and are in the 23 Oct baseline |
| **3 same-name pages across the websites**: Placement, Courses, Projects on Main and on Enrollment | Each website has its own page, design and text (below 80 % similar). This is the publishing architecture: Main and Enrollment keep separate pages |
| **2 templates "Mega Menu – 6 Months Programs - Copy" and "… 1 year Programs - Copy"** | The names say "Copy", but the contents differ (6-month and 1-year programmes). Both are published and used by the mega menu |
| **Template #9638**, "Main — Location & service page design" (draft) | Version archive of the live design #8800 |
| Not duplicates, protected: the homepage #11892, the posts page #5436, the Global Styles canvas #7838, the shop's cart page #3570 "Members" | Required by WordPress, WooCommerce or the plugin |

## 5. Awaiting review (left untouched)

| # | Items | Why not removed | Suggested decision |
|---|---|---|---|
| R1 | **5 pairs of published Enrollment pages** (10 pages):<br>• `/mentors/` (#723) and `/mentors-1/` (#11453): both titled "Mentors 1", 81 % similar;<br>• `/placement/` (#745) and `/placement-1/` (#11011): 57 %;<br>• `/digital-marketing-jobs/` (#971) and `/career-1/` (#11521): 49 %;<br>• `/courses/` (#1300) and `/courses-1/` (#10936): 28 %;<br>• `/partnership/` (#964) and `/partnership-2/`: 58 % | The team published new versions next to the old pages (24–26 Oct). The menus still link the old pages (#723, #745, #964, #971). Which version is intended is the team's decision | Keep the intended version at the **old address**: copy the new design into it. Then unpublish the "-1" page and add a 301 from its address |
| R2 | **Retired homepages**:<br>• Home1 #6177 (unpublished 27 Oct), its 3 working copies #8533, #11850, #11884, 2 archives, and the redirect `home1 → /` (keep the redirect);<br>• "New Home": working copy #9304 (its live page was removed by the team on 26 Oct) and 10 archives | Team's own pages from today's homepage change. They may want to go back | When the new homepage is final: Pages → Trash for these drafts. The redirect stays |
| R3 | **Extra homepage copies** #11894 "demo" and #11896 "Demo" (drafts restored from the Trash) | Copies of the live homepage besides its current copy #11935. They may hold the team's experiments | Open each; trash it if nothing is needed |
| R4 | **#2876 "Test"** (draft, `/test/`, 3,400 words of testimonials, 635 widgets) | A design sandbox with real content; `/test/` was unpublished at the owner's request | Keep as a sandbox, or trash |
| R5 | **8 template drafts**: headers #958 and #5901, popup #2941 "Acadvizen Admission Popup", loop items #189, #383, #9199, #9207, untitled page #9198 | Unpublished, so not applied anywhere. Who uses them, and whether a loop grid points at them, cannot be read through the API | Templates → check each → Trash if unused |
| R6 | **145 duplicate media copies** in 69 groups (byte-identical size and dimensions), incl. **71 copies of Elementor's `placeholder.png`** (imported with each template insertion, 26 Sep–21 Oct, none attached) | Deleting media is permanent. Elementor designs may still point at a specific copy by address, which the API does not show | A media-usage scan, then delete unused copies, with a fresh backup first |
| R7 | **Canonical pointing to a missing page:** Main `/social-media-marketing-course-in-mg-road` declares canonical `/social-media-marketing-course-mg-road/`, which answers 404 (308 → 404). Same in the 23 Oct baseline | An SEO field carried over from Main's data; changing it is a content change to a live page | Set the canonical to the page's own address (Rank Math → Advanced) and Publish |
| R8 | **10 test blogs in Main's own database** (9 "CMS PRODUCTION TEST blog …" + the e2e draft) | Drafts, 404 publicly. They can only be removed in Main `/admin` → Blogs (separate sign-in) | Delete them there |

## 6. Verification after the cleanup (27 Oct, 10:30–10:50)

| Check | Result |
|---|---|
| Inventory before/after | Exactly the 76 planned items left; **0 unexpected** removals; no other item changed status or title; nothing new. Published: pages 78 → 77 (only #8512); Main Blogs 86, Locations 136, Tools 67, Course 1 unchanged |
| Main | **320/320** addresses identical to 23 Oct (status, sitemap, title, canonical, robots, description); sitemap 310, all drawn by WordPress; 4 Main-only pages noindex and out of the sitemap |
| Enrollment | Sitemap **64**, all 200 (the 301 entry is gone). The 59 baseline pages are unchanged apart from the three known differences: homepage, `/test/`, `/mentors/` title |
| Sitemaps | No address listed twice on either website. No noindex page in a sitemap |
| Redirects | 4 Rank Math redirects unchanged; `/social-media-influencer-marketing/` → 301 `/learn-digital-marketing/` |
| Internal links | 243 distinct internal targets from 374 public pages: **0** point at a removed item; **0** answer 4xx/5xx |
| Menus | All 4 menus point only at published content; the Main Website Menu is identical to its 26 Oct original |
| Homepage, layouts, popup | Both homepages, a blog post and a location page render at 1440 and 390 px with header, footer and navigation, and no page errors. The Main popup opens after 104 s and closes; nothing was submitted |
| Blog images | 372/372 load |
| Enquiry and admin | Enquiry route `POST` registered. Main `/admin` 200. Lock 423; Leads and the other Main lists not locked |
| Approvals | Unchanged: #8516 waiting; nothing approved or scheduled |
| Cross-site | Nothing that the other website needs was removed. Main pages, blogs, tools and locations are all still published; the only Main-targeted items removed were test drafts |

Pre-existing and unchanged: the 3 missing logo files on Enrollment `/learn-digital-marketing/` (see the ledger).

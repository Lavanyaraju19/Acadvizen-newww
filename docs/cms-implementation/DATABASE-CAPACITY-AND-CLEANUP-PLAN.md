# Enrollment database: import capacity and revision-cleanup plan (19 October 2026)

**For:** the site owner and whoever runs database work on Hostinger.
**Status:** measured on an isolated copy only. **Nothing in this document has been run on production.** Every production step below needs the owner's explicit approval.

## 1. How it was measured

- **Source:** the verified 17 Oct backup `u713346627_xDzzw.20261017093050.sql.gz` ("Dump completed 2026-10-17 9:43:54", 111 tables).
  - It was restored into MariaDB 11.8 in Docker in **2 min 40 s** (20:58:50 → 21:01:30 UTC, 18 Oct).
  - All 111 tables passed `mariadb-check`. WordPress started from the restored files and served the same pages.
- **Isolation:** one Docker network marked `internal` and no published ports, so the copy had no internet access.
  - No email, enquiry or request could leave it.
  - Media for the import was downloaded beforehand from public URLs and handed to the copy by a test-only filter.
- **Settings:** the copy ran production's settings: plugin 0.7.2, switches SITEMAP_CLEANUP, RENDER_BRIDGE, SITE_TEMPLATES and APPROVAL on.
- **Sizes:** read from `information_schema` after `ANALYZE TABLE`:
  - *reported* = data + index;
  - *allocated* = reported + free space inside the tables;
  - *files* = the database files on disk.
- **Tear-down:** the copy was deleted on 19 Oct 08:4x UTC: containers, volumes, extracted files and the copied dump. Only these measurements were kept.

Hostinger showed **2,528 MB used of 3,072 MB (544 MB free)**. The restored copy reported **2,507.6 MB**. We do not know whether Hostinger's figure counts reported size or file size, so both are given below.

## 2. Importing Main's content (the production bundle)

The bundle holds 286 records (17 pages, 108 locations, 94 blogs, 67 tools), 9 designs and 464 images. It was imported as the copy's own administrator, approved, published and rendered for Main, exactly as on production.

| Stage | Reported | Allocated |
|---|---|---|
| Before (restored 17 Oct copy) | 2,507.6 MB | 2,519.6 MB |
| After import + approve/publish + all 278 Main renders | 2,542.6 MB (**+35.0**) | 2,578.6 MB (**+59.0**) |
| After importing the corrected bundle a second time on top | 2,610.0 MB (+67.4 more) | 2,644.0 MB |

Notes:
- **Largest new item:** the stored Main renders (`wp_acv_render_versions`), 28.5 MB for one version of 278 pages.
  - The plugin keeps up to **5 versions per page** (gzip-compressed), so this can reach about **122 MB** as pages are re-rendered (each design change re-renders every Main page).
  - That is about 94 MB more than the first import.
- **Elementor page caches:** the import clears Elementor's page caches (88 rows, about 13 MB), which Elementor rebuilds as pages are visited.
  - In the measurement they were rebuilt by loading every public page; 87 came back.
- **Importing again** adds new revisions and render versions: +67 MB measured. Import **once**.
- **Images** are files, not database rows: 61.6 MB of uploads, counted in disk space, not the database quota.
- **The corrected location text** adds 108 short paragraphs. That is a negligible size difference: the +67 MB above is the cost of a *second* import, not of the correction.

**Answer:** one import needs about **35 MB now, and up to about 130–160 MB over time** with the render history. That fits within 544 MB. The import itself does not rebuild tables, so it needs no large temporary space. **No cleanup is required before the import.**

## 3. Revision cleanup (simulation)

The database holds **6,252 revisions** from the 17 Oct backup, 6,932 after the import's own. They account for most of `wp_postmeta` (1.69 GB) and `wp_posts` (0.80 GB).

The simulated policy:
- **A:** delete the revisions of pages that are already in Trash;
- **B:** keep the **newest 20 revisions** of every page;
- **C:** rebuild the two tables.

Pages are never deleted, including trashed pages. Only revisions are.

| Step | Revisions | Reported | Free inside tables | Files on disk |
|---|---|---|---|---|
| Start | 6,932 | 2,610.3 MB | 34 MB | 2,703 MB |
| A: revisions of trashed pages deleted (1,667) | 5,265 | 2,124.1 MB | 519 MB | **2,703 MB** |
| B: newest 20 per page kept (3,968 more) | 1,297 | 906.0 MB | 1,736 MB | **2,703 MB** |
| C: `OPTIMIZE TABLE` (rebuild) | 1,297 | 562.0 MB | 23 MB | **606 MB** |

What this shows:
- **Deleting revisions alone does not shrink the files.** The space becomes free space inside the tables. If Hostinger counts files, A and B free **nothing** until step C.
- **Step C needs temporary space:** each table is rewritten into a new file before the old one is dropped.
  - After A and B the new copies were **308 MB** (`wp_postmeta`) and **156 MB** (`wp_posts`). Rebuilding one table at a time, the largest temporary need is about **310 MB**, within the 544 MB free.
  - A rebuild **without** deleting first would need about 1.7 GB. **Never rebuild before deleting.**
  - The data directory measured 2,864 MB before, 3,060 MB at the highest 3-second sample, and 1,568 MB after.
- **After the cleanup:**
  - `mariadb-check`: **111/111 tables OK**;
  - all 283 published addresses gave the **same status, title and text length** as before (283/283);
  - all 69 published and 37 trashed pages were still there;
  - no page had more than 20 revisions; there was no orphaned metadata.

**We do not promise that Hostinger's figure drops by any particular number of MB.** It depends on what hPanel counts. Check hPanel after step B, and again after step C.

## 4. The production procedure (only after approval)

Run it in a quiet hour. Each step is checked before the next.

1. **Fresh backup**
   - hPanel → Websites → enroll.acadvizen.com → Backups → **Generate new backup** (database), then download it.
   - **Verify the download:** it is gzip-complete, ends with "Dump completed", and contains 111 tables.
   - Keep the 17 Oct backup as well. Do not continue without a verified fresh backup.
2. **Count first (read-only).** In hPanel → Databases → phpMyAdmin → SQL, on the Enrollment database:
   ```sql
   SELECT COUNT(*) FROM wp_posts r JOIN wp_posts p ON p.ID = r.post_parent WHERE r.post_type = 'revision' AND p.post_status = 'trash';
   SELECT COUNT(*) FROM (SELECT ID, ROW_NUMBER() OVER (PARTITION BY post_parent ORDER BY post_date DESC, ID DESC) rn FROM wp_posts WHERE post_type = 'revision') x WHERE rn > 20;
   ```
   Expect roughly 1,700 and 4,000. Stop if the numbers are far off.
3. **Delete with WordPress's own command** (SSH, WP-CLI, in the site folder; the same method as the simulation; it removes each revision's metadata too):
   ```bash
   wp db query "SELECT r.ID FROM wp_posts r JOIN wp_posts p ON p.ID = r.post_parent WHERE r.post_type='revision' AND p.post_status='trash'" --skip-column-names | xargs -n 200 wp post delete --force
   wp db query "SELECT ID FROM (SELECT ID, ROW_NUMBER() OVER (PARTITION BY post_parent ORDER BY post_date DESC, ID DESC) rn FROM wp_posts WHERE post_type='revision') x WHERE rn > 20" --skip-column-names | xargs -n 200 wp post delete --force
   ```
   Then check hPanel's database size.
4. **Rebuild, one table at a time, smaller first,** only if hPanel's figure did not drop and at least 400 MB is free:
   ```bash
   wp db query "OPTIMIZE TABLE wp_posts"
   wp db query "OPTIMIZE TABLE wp_postmeta"
   ```
5. **Check:**
   - `wp db check` (all OK);
   - the homepage, `/learn-digital-marketing/`, `/blogs/`, the About page and a course page answer 200 and look the same;
   - Main still renders WordPress-built pages;
   - hPanel's database size.

**If anything goes wrong:** hPanel → Backups → restore the fresh database backup from step 1. Importing it into an empty database took 2 min 40 s in the test. Clear the LiteSpeed cache afterwards.

## 5. A fix found during the measurement

- **The problem:** publishing a design (Elementor template) runs a "where is this design used?" search. On a production-sized database it took **89–95 s** for each design, because it read every revision's page data (about 1.5 GB). On the copy, approving and publishing the import's 9 designs kept the render queue busy for about **6 hours**.
- **Plugin 0.7.3** reads only published pages:
  - same answer (`/tools/activecampaign` for the tool card design);
  - **1.45 s** instead of 89.07 s, measured through the real plugin function on the copy.
- **Local results on 0.7.3:**
  - PHP tests 321/321;
  - bridge scenarios 44/44;
  - approval suite 47/47.
- It is **not installed**. It needs the commit, the package and the install approved.

The revision cleanup would also make the old query faster, but the fix does not depend on it.

# Production audit and handover status: 21 October 2026

**Recommendation: NO-GO for client handover.** The live sites work and nothing is broken. But only 108 of the 314 Main addresses can be edited from the Enrollment WordPress admin. Before anything more can move, three things are needed:

- a current production backup, which is blocked;
- the owner's approval to install 0.7.6 and move the remaining Main pages;
- an admin sign-in, so the publishing workflow can be re-tested on production today.

**Scope and method.** Every result below comes from the live websites, checked on 21 Oct 2026 between 11:50 and 13:15 UTC:

- **Main:** https://www.acadvizen.com
- **Enrollment:** https://enroll.acadvizen.com and its `/wp-admin/`

All checks were read-only:

- anonymous page and API requests;
- read-only Vercel CLI queries (deployment list, `inspect`, environment variable **names** only);
- a browser with tracking requests blocked, with no sign-in, no clicks on forms and no submissions.

**Nothing was changed on production.** There was no plugin install, setting change, content change, cache purge, deployment, enquiry or commit. Local and isolated-copy results appear only in §7, as supplementary context. They are not counted as production results.

Labels used: `PRODUCTION — VERIFIED`, `PRODUCTION — FAILED`, `PRODUCTION — BLOCKED`, `PRODUCTION — NOT VERIFIED`.

## 1. Answers to the audit questions

| # | Question | Result | Evidence |
|---|---|---|---|
| 1 | Installed Acadvizen CMS plugin version on Enrollment | `PRODUCTION — VERIFIED`: **0.7.4** | Public `wp-content/plugins/acadvizen-cms/readme.txt`, "Stable tag: 0.7.4", 11:50Z |
| 2 | Plugin files and REST routes exist | `PRODUCTION — VERIFIED` | REST index of `acadvizen-cms/v1`: `/manifest`, `/render`, `/blogs`, `/blogs/<slug>`. Anonymous `/manifest` and `/render?path=/` answer **401** with `Cache-Control: no-cache, …, no-store, private` and `X-LiteSpeed-Cache-Control: no-cache`. Enquiry namespace `acadvizen/v1` has `/enquiry` (POST only; a GET answers 404 `rest_no_route`, as designed). |
| 3 | Main deployment, content source, configuration, integration | `PRODUCTION — VERIFIED` | Live deployment `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (created 18 Oct 2026 17:13Z), aliased to www.acadvizen.com and acadvizen.com (`vercel inspect`). Production variables present (names only, values not read): `WORDPRESS_CONTENT_ENABLED`, `WORDPRESS_CMS_API_URL`, `WORDPRESS_CONTENT_API_ENABLED`, `WORDPRESS_CMS_WEBHOOK_SECRET`. The Render Bridge is **on**: 108 Main addresses answer with the `x-acadvizen-render-version` header (drawn by WordPress); the other 217 crawled addresses are drawn by Main from its own database. |
| 4 | Main / Enrollment / Both destinations configured | `PRODUCTION — NOT VERIFIED` today | Needs an admin sign-in (the saved session expired; see §4, B3). Indirect evidence: Main pages published to Main render correctly on www (item 3, §2.2), and Enrollment pages are unchanged (§2.4). Last direct proof: 19 Oct 2026 on 0.7.3 (Main / Enrollment / Both 58/58). |
| 5 | Approval, publishing, scheduling, rollback, error recovery | `PRODUCTION — NOT VERIFIED` today | Testing these means creating and publishing test content on production, which needs owner approval and an admin sign-in (§4, B3 and B4). Last production proof: 19 Oct (0.7.3) approval 16/16, scheduling 7/7, Elementor Main/Enrollment/Both with approval 58/58; 20 Oct (0.7.4) 108 location pages approved and published. Neither run is counted as a pass for today. |
| 6 | Recent restorable backup | `PRODUCTION — BLOCKED` | Newest verified backup: **17 Oct 2026 09:43** (Hostinger set; restore tested on 19 Oct). Since then production changed: plugin 0.7.3 and 0.7.4 installed; 115 Main items imported; 108 pages published; timezone changed; `/test/` unpublished. A new backup attempt at 11:54Z failed: SSH answered "Permission denied", as on 19 Oct. No backup exists of the current state. |
| 7 | Release candidate on production (0.7.6 or later) | `PRODUCTION — VERIFIED`: **not installed** | Production runs 0.7.4. The 0.7.6 package is prepared but has not been uploaded (§3). |
| 8 | Remaining blockers | See §4 | |

## 2. Production verification results

### 2.1 Main: all addresses (`PRODUCTION — VERIFIED`)

Crawl script: `evidence/production-20261021/crawl.mjs`; result: `main-crawl.json`, 11:54Z.

- **Coverage:** 325 addresses = the 314 in Main's sitemap plus 11 linked from them but not in the sitemap. Every sitemap address answers **200**.
- **Sitemap families:** homepage 1, dedicated pages 12, location/service pages 111, programmatic city pages 28, blog list 1, blog posts 86, author page 1, data lists 4, course list 1, course page 1, tool list 1, tool pages 67.
- **Against this morning's record (04:54Z, same deployment):**
  - 317 of 325 identical in status, redirect, title, canonical, robots, description, h1 and visible text.
  - The other 8 differ only in visible text.
  - `/blog`, `/soft-skills` and `/tools/descript` change between two consecutive loads. That is dynamic content, not a change.
  - `/about`, `/achievements`, `/projects`, `/testimonials` and `/tools/ubersuggest` are stable now but differ from 04:54Z. There was no deployment and no production write by us, so the likely cause is a content edit in Main's database (Main `/admin`). **Cause not verified.**
- **SEO:**
  - All canonicals point to www.acadvizen.com.
  - `robots.txt` points to `/api/cms/sitemap/generate`, which serves 314 addresses.
  - 8 pages are noindex: tool addresses that show "Tool Details", none of them in the sitemap.

### 2.2 Main pages drawn by WordPress (`PRODUCTION — VERIFIED`)

All 108 location/service pages:

- **Chrome:** Main's header and footer are present (templates 8798/8799); Enrollment's header 960, footer 1035 and 1799 and popup 6147 are absent; the "ADMISSIONS OPEN" bar is absent.
- **SEO:** all 108 are indexable. 107 have a self-canonical.
- **Content:** `/affiliate-marketing-course-in-mg-road` shows the same visible text in both versions, as WordPress draws it and as Main draws it (`?acv-main=1`). The only difference is a hidden "Skip to content" link. Screenshots: `native-vs-wp-wp.png` and `native-vs-wp-main.png`.

### 2.3 Rendering at desktop, tablet and phone (`PRODUCTION — VERIFIED`)

13 live pages at 1440, 768 and 390 px wide (`prod-shots.json` and 39 screenshots in `evidence/production-20261021/shots/`):

- **Main:** homepage, `/placement`, `/achievements`, `/tools`, `/tools/adroll`, a blog post, a WordPress-drawn location page, `/digital-marketing-course-in-bangalore`, `/digital-marketing-courses-jayanagar`, `/courses`, `/contact`.
- **Enrollment:** homepage, `/blogs/`.

Results:

- **Status:** every page 200, no broken images.
- **Overflow:** no page can be scrolled sideways. Some pages measure 4–15 px wider than the screen: decorative glow shapes and the scrolling dock menu on Main, carousel slides on Enrollment. All of these are clipped (`overflow.mjs`).
- **`/placement` at 390 px:** renders in full (15,507 px tall) with no sideways scroll.
- **Chrome:** Main pages carry no Enrollment templates. Enrollment pages keep their own header, footer and announcement bar.

### 2.4 Enrollment (`PRODUCTION — VERIFIED`)

`enroll-compare.json`, 12:54Z:

- **Against 15 Oct:** 58 of 59 recorded addresses are identical in status, title, robots, canonical and Elementor document. The 59th is `/test/`.
- **`/test/`:** answers 404 and is absent from every Enrollment sitemap (`sitemap_index.xml` and its children). This is the 19 Oct owner-approved unpublish.
- **Logo:** the header logo links to `https://enroll.acadvizen.com/`.
- **Sitemaps and sign-in:** `sitemap_index.xml` and `page-sitemap.xml` answer 200; `wp-login.php` answers 200.
- **Forms:** the enquiry form and endpoint are present. **No enquiry was submitted.** Forms were last tested on production on 20 Oct 10:37Z (8/8, labelled test lead). They were not re-tested today: `PRODUCTION — NOT VERIFIED` today.

### 2.5 Defects found on production

| Result | Defect | Since | Fix |
|---|---|---|---|
| `PRODUCTION — FAILED` | `/blog/author/john-doe` is a placeholder author page, indexable and listed in Main's sitemap | before 21 Oct | Owner decision: remove or noindex it (Main data or code change) |
| `PRODUCTION — FAILED` | `/social-media-marketing-course-in-mg-road` has canonical `…/social-media-marketing-course-mg-road/`. That address redirects (308) to a **404** page. | at least 13 Oct (before the bridge) | Correct the page's canonical in its location record (a content change; needs approval) |
| `PRODUCTION — FAILED` (earlier finding, not re-measured today) | 8 tool links lead to noindex "Tool Details" pages; 5 tool logos are HTML, not images; the Clearbit logo service no longer resolves | before 21 Oct | Main data or code fix and a Main deployment |

## 3. Release package (not installed)

| | Value |
|---|---|
| Package | `dist/acadvizen-cms-0.7.6-worktree-c5b51b05c2a6/acadvizen-cms.zip` (git-ignored; not uploaded) |
| sha256 | `6356cd752c190b9e6a490a6b00929eb0efc311431515a11f95316a37347fe52b` (181,174 bytes, 27 files byte-identical to the source) |
| PHP | Requires PHP 8.0; all 23 PHP files pass `php -l` on PHP 8.3 |
| Changes vs production 0.7.4 | 8 files; no database table, no option and no outbound request added. See `RELEASE-REPORT-2026-10-21.md` §1. |
| Rollback | Upload the 0.7.4 package (`dist/acadvizen-cms-0.7.4-worktree-2cdb89872e37`, sha256 `14c1b949…ca69f`) with "Replace current with uploaded". No database change to undo. |
| Main content bundle (for later family moves) | `dist/main-rc-20261021/bundle-rc2.json`, 321 records (every family except `/companies`, `/internships`, `/resources`), sha256 `862c178719356c9406606c77971dd401ea53cd4f790a2ad71d4362cb928af39e`. Exported read-only from www.acadvizen.com, 21 Oct 11:47–12:55Z. **Not imported anywhere yet.** |

## 4. Blockers and what closes each one

| # | Blocker | Status | What closes it | Who |
|---|---|---|---|---|
| B1 | **No backup of the current production state** (newest: 17 Oct 09:43) | `PRODUCTION — BLOCKED` | Either (a) hPanel → Backups → generate a new backup, then download the Enrollment database (`…_xDzzw`) and the files; or (b) correct `SSH_PASS` in the private production env file so that `bash tools/backup-enrollment.sh` (read-only) can run and verify a restore. Evidence needed: the dump file, its sha256 and a restore test. | Owner |
| B2 | **0.7.6 not installed** (cache safety for signed 404s, scheduled-job repair, editor-preview chrome, noindex fix, per-record design) | `PRODUCTION — BLOCKED` by B1 and approval | After B1: the owner approves the install, then Plugins → Upload → Replace current with uploaded. Then verify: `readme.txt` 0.7.6; anonymous `/manifest` and `/render` 401 no-cache; a signed 404 is not cached; Main crawl identical to the record taken before the install. | Owner approves; then it can be done and verified |
| B3 | **Admin sign-in for authenticated checks** (Plugins screen, Approvals queue, Test connection, WP-Cron jobs, destination settings) | `PRODUCTION — BLOCKED` | The saved admin session expired. Either the owner signs in on this computer, or approves read-only use of the stored application credentials through a reviewed wrapper script. | Owner |
| B4 | **Live publishing tests today** (Main / Enrollment / Both, partial failure and retry, duplicate submission, stale submission refused, rollback) | `PRODUCTION — NOT VERIFIED` | These tests create draft, noindex test pages on production and publish them through Approvals. They need the owner's approval for that specific test run and B3. The team's Approvals #8516 and #8517 stay untouched. Evidence needed: `verify-elementor-live`, `verify-approval-live` and `verify-forms-live` results, each with the test items cleaned up afterwards. | Owner approves |
| B5 | **Main visual editing covers 108 of 314 addresses (34%)** | `PRODUCTION — FAILED` against the requirement of 100% | After B1 and B2: import the Main bundle one family at a time with owner approval for each, approve and publish, then verify each family on www against the record taken before (status, SEO, text, chrome, three widths). Each family is undone with "Undo this import". The database quota in hPanel must also be confirmed (2.44 GB used on 18 Oct). | Owner approves each family |
| B6 | **Four addresses need an owner decision**: `/companies`, `/internships`, `/resources` (empty data lists) and `/blog/author/john-doe` | Open | Owner decides: keep on Main, remove, or noindex | Owner |
| B7 | **Conflicting instructions on the Render Bridge**: earlier "keep it enabled, do not toggle"; the 21 Oct brief says "remain disabled until approved" | Open; left **enabled** as found | Owner confirms which instruction stands | Owner |
| B8 | **Credentials**: rotation of the WordPress application password and the Supabase keys stays deferred, as the client instructed | Open; risk **not** resolved | Client decision | Client |

## 5. Production actions in order (each needs the owner's go-ahead)

1. **Backup.** The owner makes a full Hostinger backup and downloads it (B1). We record its sha256 and test-restore it in an offline container.
2. **Sign-in.** The owner signs in to `enroll.acadvizen.com/wp-admin` on this computer, or approves the credential wrapper (B3). We re-read the Plugins screen, Approvals queue, Test connection and the scheduled jobs (read-only).
3. **Install 0.7.6** (approval B2). We upload the package from §3 and verify the routes, cache headers and a full Main crawl.
4. **Live workflow test** (approval B4), labelled, draft and noindex. Steps:
   - publish to Main, to Enrollment and to Both;
   - one destination failing, then a retry;
   - a duplicate submission;
   - a stale submission refused;
   - restore an earlier version;
   - then remove the test items.
5. **Family moves**, one at a time with approval and verification (B5). Suggested order:
   1. blogs;
   2. the 28 programmatic city pages;
   3. tool pages;
   4. dedicated pages;
   5. homepage.
6. **Decisions and Main fixes** (B6, the defects in §2.5): approved content or Main code changes.
7. **Final acceptance** on production: full crawl, three-width screenshots, Enrollment comparison, and the workflow tests again. Then a GO decision.

## 6. Evidence index

All files are in `docs/cms-implementation/evidence/production-20261021/`. The screenshots are kept out of Git commits.

| File | What it shows |
|---|---|
| `main-crawl.json` | Every Main address: status, redirect, title, canonical, robots, description, h1, drawn by WordPress or Main, text hash |
| `enroll-compare.json` | The 59 Enrollment addresses against 15 Oct |
| `prod-shots.json`, `shots/*.png` | 13 pages × 3 widths: status, overflow, height, Elementor documents, admissions bar, broken images |
| `shots/native-vs-wp-*.png` | The same location page as drawn by WordPress and by Main |
| `backup-attempt-20261021.txt` | The failed read-only backup attempt (account and host omitted) |
| `crawl.mjs`, `prod-shots.mjs`, `overflow.mjs`, `native-vs-wp.mjs`, `retry-fetch.mjs` | The read-only scripts used |

No secret, cookie or personal data is included. The screenshots show only public pages.

## 7. Supplementary context (not production evidence)

- **Isolated copy** of the 17 Oct production backup, with 0.7.6 and the first Main release-candidate bundle (310 Main addresses):
  - content and SEO matched the live site family by family;
  - no Enrollment chrome on any Main render;
  - real editor → Publish → Approvals → publish runs succeeded for `/about`, the tool design (3 of 3 checked pages updated) and the area design.
  - The copy was removed on 21 Oct at about 13:10Z (containers, volumes, network, the two localhost proxies, the temporary copy-only admin). The backup file it came from is kept in Downloads.
- **Local test suites:** PHP 349/349, JavaScript unit 304/304, TypeScript, lint and build pass. The full local WordPress regression is being rerun: on 21 Oct at 10:45 something outside this work emptied the local test helpers, and they were restored from the repository.

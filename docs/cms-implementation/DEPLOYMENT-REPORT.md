# Deployment report: unified Elementor CMS (updated 14 October 2026, after the Main release)

**Summary (14 Oct):**
- **Main released to production** at the owner's request: commit `7f1a75f` on `headless-wordpress`.
  - All 314 addresses were identical before and after.
  - Live CMS workflows were verified on production.
- The exposed legacy Supabase keys are **no longer used by Main**. They still have to be **disabled** in the Supabase dashboard (owner).
- **WordPress plugin upgraded to 0.7.0** on 14 Oct (after backup verification and a fresh content export); verified on production.
- Render Bridge and approval: **off**.

## 0. Production release of 14 October 2026

| Step | Result | Evidence |
|---|---|---|
| Push | `0554e5f..ac007da`, then `..7f1a75f` (revert of the homepage Course Modules commit, owner decision P12), no force | GitHub `headless-wordpress` |
| Before snapshot | 314/314 addresses 200 (08:57 UTC) | `evidence/production-release-20261014/main-before-0857Z.json` |
| Main deployment | `dpl_EnsscA7xTNrXwVuDiScBN1SWV7qg`: commit `7f1a75f`, target production, Ready, aliases www.acadvizen.com and acadvizen.com | Vercel API and `vercel inspect` |
| Checks after | `/`, `/admin`, `/robots.txt`, `/api/public-config` 200; sitemap 314 addresses; unsigned content API request 401; bridge manifest 404 (note 15 Oct: this endpoint answers 404 to any request without Main's internal token, with the bridge on or off, so it is not evidence. Bridge OFF is shown by Vercel production having no `WORDPRESS_CONTENT_ENABLED` variable: names-only check of 14 Oct) | `verify-main.txt` |
| Before vs after | **314/314 identical** on status, title, description, canonical, robots, H1, JSON-LD, forms and text | `compare-before-after.md` |
| Server key switched to an unexposed key | Vercel `SUPABASE_SECRET_KEY` (Sensitive) set from an existing new-style Supabase secret key that was never in Git; redeployed as `dpl_8buuxRSh6bxAbmNLCTyurdxwLrRj` | Signed content API 16/16 PRODUCTION |
| Browser key fixed | Vercel `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` held the legacy anon JWT; set to the real publishable key. Redeployed as **`dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5` (live)** | Public config serves `sb_publishable_…`; Supabase accepts it (200); 0 of 30 browser scripts contain a legacy JWT; content API 16/16 again |
| CMS workflows on production (plugin 0.6.1) | Blogs to Main only, Enrollment only and Both, with edits and cleanup: 15/16 (the failing check is "plugin 0.7.0 installed": expected until P8). Main pages from the Master Admin: **17/17**. Signed content API: **16/16** | `blogs-0.6.1.log`, `pages-0.6.1.log`, `content-api*.log` |
| Elementor Pro licence | **Active** ("Elementor Pro Advanced"), read on wp-admin → Elementor → License | Read-only |
| Backups before the plugin upgrade | Owner-supplied Hostinger backup (database and files): **valid but from 10 Oct 09:24**. Gzip OK; the database dump is complete (108 tables, ends with "Dump completed"); the files archive holds 81,826 files including `wp-config.php`; SHA-256 recorded. Byte-identical to the copies downloaded on 12 Oct; does not contain the Master Admin plugin or later changes. **Owner chose:** add a fresh content export, then upgrade. Export taken 14 Oct (Tools → Export → All content): 998 items, 100 Elementor designs, 52 published pages and 7 posts, equal to the live counts. Kept locally only | `plugin-0.7.0/backup-verification.txt`, `content-export.txt` |
| **Plugin upgrade 0.6.1 → 0.7.0** | Package `0.7.0-62a13a4`: full SHA-256 checked; rebuild reproduces the same bytes. Installed with *Replace current with uploaded*. **0.7.0 active**; 32 plugins, 27 active, unchanged; no other plugin changed | `plugin-0.7.0/plugins-*.json` |
| After the upgrade | Master Admin: 3 screens (bridge off, by design), **every link on them opens (5/5)**; the live 0.6.1 had 3 dead links (O-45), now gone. Site Health **Good, 0 critical** (scheduled events running, REST API available). `acadvizen/v1/enquiry` still registered. Enrollment: **59/59 pages identical**; screenshot differences equal the natural variation of carousels (measured) | `plugin-0.7.0/admin-and-enrollment-checks.txt` |
| Live workflows on 0.7.0 | Signed content API **16/16**; blogs to Main / Enrollment / Both **16/16**; Main pages **17/17**; all test content removed | `plugin-0.7.0/*.log` |
| Main after the plugin upgrade | **314/314 addresses unchanged** against the morning baseline (one address re-read after a connection error) | `plugin-0.7.0/main-314-after-plugin.md` |

**Rollback of the plugin:** upload `dist/acadvizen-cms-0.6.1-2cc2148/acadvizen-cms.zip` (SHA-256 `dd6fcf27dfa101eb5940e868d11673d0bc8fec67f5a7264110039cfa2295e32c`) with *Replace current with uploaded*. Rehearsed on WordPress 7.0.7 / PHP 8.3 / Elementor 4.3.5: content and settings kept.

**Rollback of Main** (a Vercel deployment keeps the variables it was built with):
- **While the legacy Supabase keys are still enabled:** promote `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (release 10, commit `80134d4`).
- **After the legacy keys are disabled (P11):**
  - Release 10 and the first two deployments of 14 Oct (`dpl_EnsscA7x…`, `dpl_8buuxRSh…`) still use a legacy key and **must not be promoted**.
  - Release 10's code (`80134d4`) reads only the legacy variable, so rebuilding it would fail too.
  - Roll back only to a commit that contains the key picker (`03d18dc`, release 11, or later): `node scratchpad/vercel/deploy-prod-git.cjs <branch> <sha>` rebuilds that commit with the current, unexposed keys.

## 1. Production on 13 Oct (before the release; superseded by §0)

| Item | State | How checked |
|---|---|---|
| www.acadvizen.com | HTTP 200, served by Vercel (iad1) | Public request |
| Main deployment | `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (commit `80134d4`), as recorded 12 Oct; not changed since | No deploy or promote was made |
| enroll.acadvizen.com | HTTP 200 | Public request |
| CMS plugin on Enrollment | **0.6.1** | Public `readme.txt` "Stable tag: 0.6.1" |
| WordPress → Main structured connection (`WORDPRESS_CONTENT_API_ENABLED`) | **On**, since 12 Oct (earlier approval) | Observed 12 Oct; not changed |
| Render Bridge (`WORDPRESS_CONTENT_ENABLED`) | **Off** | Observed 12 Oct; not changed |
| Approval (`ACADVIZEN_CMS_APPROVAL`) | Not present (needs plugin 0.7.0) | — |
| DNS, WordPress core, other plugins, secrets | Unchanged by this work | No access used |

## 2. Prepared, not deployed

**Repository:** branch `headless-wordpress`, local only.

**Commits ahead of `origin/headless-wordpress` (`0554e5f`), not pushed:**
- `f855e33` Release 11: prefer `SUPABASE_SECRET_KEY` in middleware and notification routes
- `8e27175` Acceptance tests: scheduled publishing and role permissions
- `13eac79` Docs: final handover set
- `03d18dc` Release 11: validated Supabase key picker; notification routes refuse cleanly
- `df30076` Performance: site settings and menus load concurrently
- `fc53a7e` Dependencies: nodemailer 10.1.0; sharp 0.35.5
- `436a822` Performance: CMS lookups stop early when a slug has no row

**Uncommitted working tree:** none of it is committed, per the instruction not to commit without approval.
- **Main:** `lib/wordpress/contentApi.js` (edit-conflict protection, Redirects).
- **Plugin 0.7.0:**
  - approval-first publishing (`includes/approval.php`);
  - widget compatibility registry (`includes/registry.php`);
  - two-way blog sync;
  - Redirects;
  - importer under approval;
  - the homepage and Main-address fixes.
- **Tests:**
  - PHP suite;
  - unit tests;
  - WordPress acceptance suites, including the new `approval-acceptance.mjs`.
- **Documents:** this handover set.

## 3. What a production rollout would involve (each step needs authorization)

| Step | Change | Visible to visitors? | Rollback |
|---|---|---|---|
| 1 | Push and promote release 11 (Main) | No change to pages expected; faster tool pages | Promote `dpl_8C59…` again |
| 2 | Install plugin 0.7.0 on Enrollment | No | Reinstall 0.6.1 (rehearsed) |
| 3 | `ACADVIZEN_CMS_APPROVAL` in wp-config.php | No: changes how editors publish | Remove the line |
| 4 | `ACADVIZEN_CMS_RENDER_BRIDGE` in wp-config.php | No: shows the Elementor publishing screens | Remove the line |
| 5 | Vercel `WORDPRESS_CONTENT_ENABLED=true`, then redeploy | Only for pages later approved and published to Main | Unset it and redeploy, or promote the previous deployment |
| 6 | Move Main pages one group at a time | Yes, each page as approved | Per page: Restore or Draft; all: step 5 rollback |

The detailed runbook with backups is in `MAIN-MIGRATION-PLAN.md` §4. Release and rollback steps for Main are in `FINAL-RELEASE-AND-ROLLBACK.md`.

## 4. Verification after each production step (to run when authorized)

- `node tools/verify-production.mjs`: compares the 314 Main addresses with the baseline.
- The Enrollment 60-page comparison (`FINAL-ACCEPTANCE-TESTS.md`).
- **Acadvizen Master Admin → Settings → Test connection:** Connected.
- **After step 2:** Widget compatibility lists production's widgets (O-25).
- **After step 5:** the first moved page must show **Verified** on Main in Approvals, and the other 313 addresses must be unchanged.

## 5. Authorizations still needed

Every row in §3 is owner-only, plus:
- a staging environment, or acceptance of production-only checks with labelled test content removed afterwards (O-5);
- reviewer accounts (names and emails);
- which Main pages move first (`MAIN-MIGRATION-PLAN.md` §2).

## 6. Exact release commands (each step only after its own approval)

```sh
# 0. Local commits of the reviewed work (local only; no push)
git status --short                      # review; the .bak and screenshots stay out
# 1. Plugin package from the committed tree (local)
node tools/build-cms-plugin.mjs         # -> dist/acadvizen-cms-0.7.0-<commit>/acadvizen-cms.zip, verified against the commit; record its SHA-256
# 2. Before any production change: a snapshot of every Main address (read-only)
node tools/main-route-inventory.mjs --main https://www.acadvizen.com --out before-release.json --text
# 3. Main release (APPROVAL): push the branch, then promote the Preview
git push origin headless-wordpress
npx vercel promote <preview-url> --scope lavanyaraju581-6438s-projects
# 4. After the promote: the same snapshot, compared (the bridge is still off: all 314 must be identical)
node tools/main-route-inventory.mjs --main https://www.acadvizen.com --out after-release.json --text
node tools/main-migration-compare.mjs before-release.json after-release.json --md release-compare.md
# 5. Hostinger full backup of enroll.acadvizen.com (owner, hPanel), downloaded off-site
# 6. Plugin 0.7.0 (APPROVAL): Plugins > Add New > Upload > Replace current with uploaded; then Test connection
# 7. Approval (APPROVAL): define( 'ACADVIZEN_CMS_APPROVAL', true ); in wp-config.php; assign reviewers
# 8. Elementor pages for Main (APPROVAL, separately): MAIN-MIGRATION-PLAN.md section 4
```

**Rollback per step:**

| Step | Rollback |
|---|---|
| 3 | `npx vercel promote` the previous deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` |
| 6 | Upload `dist/acadvizen-cms-0.6.1-2cc2148/acadvizen-cms.zip` (SHA-256 `dd6fcf27…`) |
| 7 | Remove the line |
| 8 | Unset `WORDPRESS_CONTENT_ENABLED` and redeploy |
| Data | The step 5 backup, then **Publishing → Republish all Main Website pages now** (Main caches drawn pages for up to 5 minutes; `FINAL-RELEASE-AND-ROLLBACK.md` §6) |

## 7. Release gates of the brief, and their status

| Gate | Status | Evidence |
|---|---|---|
| Every inventoried Main route works at its intended public URL | **Production today: 314/314** pass the live check; 0 broken internal links (read-only, 13–14 Oct). **After migration: LOCAL only.** Rehearsal #7: 92/92 verified; 86/103 identical to Main's own pages; every difference classified; kept-on-Main addresses identical | `MAIN-ROUTE-CHECKLIST.md`, `evidence/route-audit/`, `evidence/sitewide-migration/rehearsal7/` |
| Main content, layouts, media, forms, enquiries and SEO verified | LOCAL. 14 Oct defects fixed: blog cards, FAQ accordions, header/footer source, robots and titles, card verification, importer references, server descriptions (O-31 to O-41). Remaining differences are accepted or environmental | Same |
| Enrollment pages and the enquiry/API intact | LOCAL suites pass. Production (read-only, 14 Oct): `acadvizen/v1/enquiry` registered; 59 pages read for links, 1 existing broken link (O-42). Nothing deployed | `TEST-RESULTS.md` |
| Elementor edits saved, previewed, approved, published, verified | LOCAL | `approval-acceptance.mjs` |
| Main publication blocked without approval; edits after approval invalidate it | LOCAL (including SEO fields and Main menus) | approval and reliability suites |
| Main / Enrollment / Both, and partial failure with retry of the failed website only | LOCAL | A6–A9, R1–R2 |
| Rollback restores the prior content and routes | LOCAL: Restore, Main-only Make live, Draft, Undo import, migration suite 13/13. Database restore after rehearsals #4–#7: content identical | A10, R8, M5, `evidence/sitewide-migration/` |
| No secrets exposed | Tracked-file scan and untracked-text scan clean | `TEST-RESULTS.md` |
| Backups and tested recovery | LOCAL: isolated backup restored into a separate stack. 21/21 tables, sign-in, media 36/36, **87/87 pages identical**. **Production: a fresh Hostinger backup and its restore rehearsal are still required (P1, P4)** | `evidence/restore-rehearsal-20261014/` |
| Production smoke tests and visual comparisons | **Not run**: no deployment has been authorized | — |
| Staging | **Blocked**: no staging exists (O-5) | — |
| Popup with Elementor Pro | **Not verified**. Without Pro the refusal is verified (exact reason, no partial import; approval 47/47). With Pro it needs staging with a licensed Pro | O-31; P2, P6 |

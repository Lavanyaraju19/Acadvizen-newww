# Deployment report: unified Elementor CMS (13 October 2026)

**Summary: nothing was deployed in this phase.** Production is exactly as it was. Everything new is prepared and tested LOCAL, and waits for the owner's authorization.

## 1. Production now (read-only checks, 13 Oct ~08:20 UTC)

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

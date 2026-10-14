# Maintenance guide: central CMS, Elementor and plugins

For the site owner and the technical maintainer of the central CMS (WordPress at enroll.acadvizen.com and the Main website on Vercel).

## 1. What runs where

| Part | Version on production (observed 12–13 Oct) | Owner of updates |
|---|---|---|
| WordPress | 7.0.7 (7.1.3 available) | Site owner, in Hostinger |
| PHP / database | 8.3.35 / MariaDB 11.8.9 | Hostinger |
| Theme | Astra | Site owner |
| Elementor / **Elementor Pro** | 4.3.3 / 4.3.0 (4.3.4 / 4.3.1 available) | Site owner. **Pro is a paid licence** (below) |
| Acadvizen Master Admin (the CMS plugin) | **0.6.1** live; **0.7.0** prepared, not installed | Maintainer (package built from `wordpress/acadvizen-cms`) |
| Other plugins | 32 installed, 27 active (the list and 13 pending updates are in `FINAL-OPEN-ISSUES.md` O-6, O-11) | Site owner |
| Main website | Next.js 15.5.27 on Vercel, project `acadvizen-newww-ua9d`; Supabase `hhfccftkfryesjirauwf` | Maintainer; promotion by the owner |

## 2. Elementor licensing

- **Elementor (free)** is GPL and updates from wordpress.org.
- **Elementor Pro** needs an **active licence** connected in Elementor → License, for updates and Pro features. The licence holder is the site owner; it was not visible in this engagement.
  - **If the licence lapses:** Pro widgets keep working, but security updates stop. Renew before it lapses.
  - **If Pro is deactivated:** every Pro widget becomes "not available". With approval on, any page using one can no longer be submitted or approved, and the registry shows **blocked** with the fix "activate the plugin". Live pages are not changed.
- **Update Elementor and Elementor Pro together.** Their versions must match closely; the rehearsal applied them in the same group (O-6).

### Dependencies of the Elementor-based Main website (Option B)

| Dependency | Needed for | Licence | Production state |
|---|---|---|---|
| Elementor (free) | Every page and template | GPL | 4.3.3 active |
| **Elementor Pro** | The converter's element custom CSS (exact widths, blur and similar details on migrated Main pages), popups (e.g. Quick Registration), Pro forms, display conditions | **Paid, active licence required** | 4.3.0 installed; licence status not visible to the engineer |
| Ultimate Addons / Header Footer Elementor | Main and Enrollment headers and footers | Free | Active |
| Rank Math SEO | Titles, descriptions, canonical, robots and schema of migrated pages | Free (Pro optional) | Active |
| MetForm, Contact Form 7 | Forms forwarded by Main | Free | Active |
| Acadvizen Master Admin 0.7.0 | Approval, publishing, bridge, import | Project code | 0.6.1 installed; 0.7.0 prepared |
| Vercel (Main), Supabase | Main application and data | Existing plans | Unchanged |

**Without an active Elementor Pro:**
- Approvals blocks popups.
- The compatibility report says "NOT SHOWN" for custom-CSS details.
- Migrated pages then look less like Main (LOCAL measurement without Pro: 18–31% of first-screen pixels differ on `/soft-skills`).

## 3. Updating safely

**Order** (rehearsed locally, `evidence/o6-update-rehearsal/`):
1. Hostinger **full backup**, downloaded.
2. WordPress core.
3. Elementor + Elementor Pro together.
4. The other plugins.
5. **After each step:**
   - the Enrollment 60-page comparison;
   - **Acadvizen Master Admin → Settings → Test connection**;
   - with the Render Bridge on, also `node tools/verify-production.mjs`, which compares the Main addresses;
   - with 0.7.0, also **Acadvizen Master Admin → Widget compatibility**: no widget a live page uses may become "not available".
6. **Rollback:** restore the backup.

**Updating the CMS plugin itself:**
1. Build the package with `node tools/build-cms-plugin.mjs`.
2. **Plugins → Add New → Upload → Replace current with uploaded.**
3. Settings, content, approval states, archives and history are kept.
4. Rolling back means uploading the previous package. The update and rollback were rehearsed identical (O-6 evidence).

## 4. Switches (wp-config.php on enroll.acadvizen.com; Vercel environment for Main)

| Switch | Where | Effect | Production now |
|---|---|---|---|
| `ACADVIZEN_CMS_MAIN_URL`, `ACADVIZEN_CMS_WEBHOOK_SECRET` (+ `_INTERNAL_URL`, `_LOOPBACK_URL` when needed) | wp-config.php | The connection to Main. The secret is never shown in the admin | Set |
| `WORDPRESS_CONTENT_API_ENABLED` | Vercel | Main accepts structured edits from WordPress | **On** (since 12 Oct) |
| `ACADVIZEN_CMS_APPROVAL` | wp-config.php | Approval before publishing (0.7.0) | Not set (0.7.0 not installed) |
| `ACADVIZEN_CMS_RENDER_BRIDGE` | wp-config.php | Shows the native Elementor publishing screens (0.7.0) | Not set |
| `WORDPRESS_CONTENT_ENABLED` | Vercel (redeploy needed) | Main serves approved Elementor pages at their Main addresses | **Off** |
| `ACADVIZEN_CMS_SITEMAP_CLEANUP`, `_LOGIN_BRANDING`, `_SITE_TEMPLATES` | wp-config.php | Optional extras (`includes/config.php`) | Not set |

**Change one switch at a time,** and only with the owner's approval. `MAIN-MIGRATION-PLAN.md` §4 gives the order for turning on Elementor pages for Main.

## 5. Routine tasks

| Every | Task |
|---|---|
| Week | **Approvals → Recent publications:** nothing left in Partial failure or Failed |
| Week | Review **Users**: only expected Administrators and Reviewers. Reviewer is the role **Reviewer (approves publishing)** |
| Month | Apply plugin updates (§3) after a backup |
| Month | **Export the approval history** if a long audit trail is needed (it keeps the latest 1,000 entries). From a server shell: `wp option get acv_cms_approval_log --format=json > approval-history-YYYY-MM.json` |
| Quarter | Restore test: restore a Hostinger backup to a staging copy and open the admin |
| After adding a widget add-on | Open **Widget compatibility**. If a widget must be blocked on Main or treated as code, add a rule (`WIDGET-COMPATIBILITY.md`) |
| After changing the Main code | Run the test set in `FINAL-ACCEPTANCE-TESTS.md`, the full list (unit, tsc, lint, PHP, build, WordPress suites) |

## 6. Housekeeping the CMS does by itself

- **Working copies** of live pages stay until they are published or discarded. **Discard working copy** (in the page's Approval box) removes one.
- **Archives:** the 10 most recent earlier revisions are kept per page; older ones are deleted when a new revision is published.
- **Verification checks** run through WP-Cron at 15 s, 45 s, 90 s, 3, 5 and 10 minutes after publishing.
  - On a quiet site, WP-Cron runs only when someone visits. Hostinger's cron calling `wp-cron.php` every minute keeps the checks on time.
- **Main drawings** are kept as versions (database table `{prefix}acv_render_versions`) for rollback.

## 7. Where things are documented

| Topic | Document |
|---|---|
| Everyday editing | `HOW-TO-PUBLISH.md`, `ADMIN-USER-GUIDE.md` |
| Reviewing | `REVIEWER-GUIDE.md` |
| Main / Enrollment / Both | `DESTINATION-GUIDE.md` |
| Widgets | `WIDGET-COMPATIBILITY.md` |
| Releases, backups, rollback | `FINAL-RELEASE-AND-ROLLBACK.md` |
| Security | `FINAL-SECURITY-REPORT.md` |
| Open items | `FINAL-OPEN-ISSUES.md` |

# Final release and rollback: Acadvizen Master Admin / headless CMS (13 October 2026, updated 15 October 2026)

## Current state and rollback (15 October 2026; sections 1–6 below are historical, 13 October)

| Component | State (checked 15 Oct 13:00 UTC) |
|---|---|
| Main website | Vercel project `acadvizen-newww-ua9d`, production deployment **`dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`** (commit `7f1a75f`), serving `www.acadvizen.com` and `acadvizen.com` (308 → www). No production deployment since 14 Oct |
| Enrollment plugin | Acadvizen Master Admin **0.7.1**, package `dist/acadvizen-cms-0.7.1-6fb8222/acadvizen-cms.zip` (sha256 `37bf4a16f125c1e83b3de76a09c801be3556a6cac6a303bf020af7be7d049cab`), installed 15 Oct 08:40 UTC |
| Branch | `headless-wordpress` at `1bb4970`, pushed. Same application code as the live Main deployment (later commits: docs, tools, tests, `.gitignore`, plugin) |
| Render Bridge / approval workflow | Off / off |

**Rollback**

| Problem | Action |
|---|---|
| Plugin 0.7.1 misbehaves | WordPress → **Plugins → Add New Plugin → Upload Plugin** → choose `acadvizen-cms.zip` from `dist/acadvizen-cms-0.7.0-62a13a4/` (sha256 `7f0d354bea3058cc12b2c232444d0dc8d575e2b7f699657ef4e6378ca51cd5d9`) → **Install Now** → **Replace current with uploaded**. Rehearsed 0.7.0 → 0.7.1 → 0.7.0 on WordPress 7.0.7 / PHP 8.3 (15 Oct): clean. **Noindex after rolling back to 0.7.0** (0.7.0 neither writes nor removes the Rank Math robots setting): (1) Enrollment copies saved under 0.7.1 keep their setting; (2) a **new** blog's Enrollment copy gets none, so it is published `index, follow` even with "Hide from search engines" ticked, and Rank Math submits it to IndexNow (auto-submit is on for Posts); (3) changing "Hide from search engines" on an existing blog no longer reaches its Enrollment copy. While on 0.7.0, avoid publishing hidden blogs to Enrollment or Both |
| A future Main deployment misbehaves | Vercel → `acadvizen-newww-ua9d` → Deployments → **`dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`** → ⋯ → **Promote**. This is the only verified production deployment built with the new Supabase keys. Vercel may treat this as an Instant Rollback, which pauses automatic production deployments until the next promotion |
| Package files | `dist/` is not in Git (local to the engineer's PC). Either package can be rebuilt byte-identically with `node tools/build-cms-plugin.mjs 62a13a4` (0.7.0) or `node tools/build-cms-plugin.mjs 6fb8222` (0.7.1); compare the sha256 before uploading |

**Do not, when rolling back:**
- promote `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`, `dpl_EnsscA7x…` or `dpl_8buux…` (the rollback targets of 13–14 Oct). They depend on the legacy Supabase keys and stop working once those keys are disabled;
- use **Redeploy** on a preview deployment to put it into production. A preview build has no production settings; this caused the 14 Oct incident;
- add `www.acadvizen.com` or `acadvizen.com` to any project other than `acadvizen-newww-ua9d`. The duplicate project `acadvizen-newww` has no server settings.

**Backups (15 Oct): Owner-Accepted Risk, interim.**
- There is no complete database backup newer than 10 Oct 09:24. The 15 Oct export is incomplete (58 of 108 tables).
- The owner accepted this for about two days, until the next hosting backup. It must then be downloaded and verified: all tables present and the dump complete. A restore test should be done in an isolated copy, never on production.
- A content export (15 Oct, 998 items) and the files archive (14 Oct) exist. A content export is not a database backup.

## 1. Verified current state (historical: 12 Oct 2026 20:07–20:25 UTC)

| Component | State |
|---|---|
| Main website | Vercel project **`acadvizen-newww-ua9d`**. Production = **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`** (commit `80134d4`, Release 10), Ready, serving `www.acadvizen.com` and `acadvizen.com`. Functions in `iad1`; Node.js 20.x |
| Rollback target for Release 10 | `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` (Release 9, `dde1328`), Ready |
| Enrollment plugin | Acadvizen Master Admin **0.6.1**, package `dist/acadvizen-cms-0.6.1-2cc2148/acadvizen-cms.zip` (SHA-256 `dd6fcf27dfa101eb5940e868d11673d0bc8fec67f5a7264110039cfa2295e32c`). Public files byte-identical to the package. Plugin **0.7.0** is prepared in the working tree (uncommitted, not installed) |
| Previous plugin (rollback) | `dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip` (SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`) |
| Enrollment WordPress | 7.0.7 on PHP 8.3.35 / MariaDB 11.8, LiteSpeed, Astra; 32 plugins (27 active); 7.1.3 and 13 plugin updates pending (O-6) |
| Git | GitHub `headless-wordpress` = `0554e5f`; `main` = `48d61a8` (untouched). **Local** `headless-wordpress` is ahead by the release-11 commits listed in §3. Nothing pushed |

## 2. Settings (names only; values never in Git)

| Where | Name | State | Meaning |
|---|---|---|---|
| Vercel Production | `WORDPRESS_CONTENT_API_ENABLED` | `true` | Content API on: WordPress edits Main records through signed requests (owner approval, release 9; decision O-2) |
| Vercel Production | `WORDPRESS_CMS_WEBHOOK_SECRET` | set (Sensitive) | Shared secret; equals the WordPress side (signed request → 200) |
| Vercel Production | `WORDPRESS_CMS_API_URL` | set | Lets the WordPress editor frame Main previews. It does not turn on the bridge |
| Vercel (all environments) | `WORDPRESS_CONTENT_ENABLED` | **absent** | Render Bridge **off** |
| Vercel Production | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | set | Supabase access. `SUPABASE_SECRET_KEY` is not set (no key change, by the owner's decision) |
| Vercel Preview / Development | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` only | — | No production secret in Preview or Development |
| `wp-config.php` | `ACADVIZEN_CMS_MAIN_URL`, `ACADVIZEN_CMS_WEBHOOK_SECRET` | set | Plugin Settings: "Shared secret: Set"; Test connection: Connected |

Release 11 needs **no new or changed environment variable**.

## 3. Release 11 (committed locally; NOT pushed or deployed)

| Commit | Change | Production effect |
|---|---|---|
| `f855e33` | Key fallback in the middleware and notification routes; slug tests | None (same key selected) |
| `8e27175` | Scheduling and role-permission acceptance tests | None (test tools) |
| `13eac79` | Handover documents (first version) | None |
| `03d18dc` | Validated key picker (`lib/supabaseServiceKey.js`); notification routes answer 503 when no key is configured | None (same key selected); safer if a key is mis-set later |
| `df30076` | Site settings and menus load concurrently (`lib/siteMenus.js`) | Same content, one to two fewer database round trips per public page (O-4) |
| `fc53a7e` | `nodemailer` 10.1.0; Next.js's `sharp` 0.35.5 | `npm audit` 0. Mailer not active on production; Vercel serves images through its own optimiser |
| *uncommitted (Main)* | `lib/wordpress/contentApi.js`: edit-conflict protection (`expected_updated_at`, conditional update) and the **redirects** content type with its safety rules; `tests/unit/wordpress-content-api.test.js` (+14) | Main: only after deployment. Without a version sent, saves behave exactly as before |
| *uncommitted (plugin 0.7.0)* | `wordpress/acadvizen-cms/*`: Both partial-failure warning, plain "could not be reached" message, two-way blog sync (`includes/blog-sync.php`), conflict-aware forms, Redirects screen, native publishing screens hidden unless `ACADVIZEN_CMS_RENDER_BRIDGE`, `acv-cms-flash` class, version 0.7.0; `tests/php/run.php` (+19) | Only after the owner installs 0.7.0 (**after** Main release 11) |
| *uncommitted (tests, docs)* | `tests/wordpress/{both-failure,conflict,blog-sync,redirects}-acceptance.mjs` (new), `acceptanceKit.mjs`, five suites exit 1 on a failed check; all `docs/cms-implementation` updates and evidence | None |

**Commit status:**
- `03d18dc`, `df30076`, `fc53a7e` and `436a822` were committed locally on 13 Oct, before the owner's instruction of the same day not to commit. They are not pushed.
- Everything after that instruction is **uncommitted** for the owner's review.
- Nothing was reset, rebased or rewritten.

**Main application files changed since the live commit `80134d4`:**
- `src/middleware.js`;
- `app/api/admin/notifications/route.js`;
- `app/api/admin/notifications/[id]/read/route.js`;
- `lib/env.ts`;
- `lib/supabaseServiceKey.js` (new);
- `lib/siteCmsServer.js`;
- `lib/siteMenus.js` (new);
- `lib/cmsPublishing.js` (`436a822`, lookup short-circuit);
- `lib/wordpress/contentApi.js` (uncommitted: conflicts, redirects);
- `package.json`, `package-lock.json`.

The rest is tests, tools and documents. **Not committed (the owner's own changes):** `.gitignore` and `lib/wordpress/config.js.pre-integration-fix.bak`.

**Checks before release:** the final local run passed every step (`FINAL-ACCEPTANCE-TESTS.md` §E). The production regression shows the live sites unchanged (§A). Feature switches are unchanged: content API on, bridge off.

### Manual release steps (owner)

**Step 0: review and commit the uncommitted work.** Do not stage `.gitignore` or the `.bak` file.
```
cd <your local copy of the repository>
git status --short
git diff -- wordpress/acadvizen-cms tests docs        # review
git add lib/wordpress/contentApi.js tests/unit/wordpress-content-api.test.js
git commit -m "Content API: edit-conflict protection; Main redirects with safety rules; tests"
git add wordpress/acadvizen-cms tests/php/run.php tests/wordpress
git commit -m "Plugin 0.7.0: blogs kept in step across editors, conflict-aware forms, redirects, clear failure messages, native publishing hidden while the bridge is off; tests"
git add docs/cms-implementation
git commit -m "Docs: final handover, publishing workflow, acceptance evidence"
```

**Step 1: Main (release 11).**
```
git status --short                                   # expect only: M .gitignore, ?? lib/wordpress/config.js.pre-integration-fix.bak
git log --oneline origin/headless-wordpress..HEAD    # expect the release-11 commits
git push origin headless-wordpress                   # never main
```

**Expected:** the push succeeds, and Vercel → `acadvizen-newww-ua9d` → Deployments shows a new **Preview** for the pushed commit, status Ready.
- If no Preview appears (this happened on 12 Oct), create one for the exact commit with the Vercel CLI or API. Use target **preview**, never production.
- Preview has no Supabase variables, so its pages may not load data. That is expected; do not add production secrets to Preview.

**Promote:** Deployments → that Preview → ⋯ → **Promote to Production**. Vercel rebuilds it with the Production variables.

**Verify (§4), within 10 minutes of promotion.**

**Step 2: plugin 0.7.0 (after Main release 11 is live).**
1. Build it: `node tools/build-cms-plugin.mjs`. Expected output: `dist/acadvizen-cms-0.7.0-<commit>/acadvizen-cms.zip`, with SHA-256 and file count printed and verified against the commit.
2. Back up Enrollment (Hostinger).
3. WordPress → Plugins → Add New → Upload Plugin → the ZIP → **Replace current with uploaded**.
4. Verify:
   - Plugins list shows 0.7.0;
   - the Posts editor shows the **Main Website** box, and Main Website → **Redirects** opens;
   - the menu no longer lists the native Main Blogs / Courses / Locations / FAQs / Testimonials / Tools screens (production has none of their posts);
   - Settings → Test connection → Connected;
   - the 60-page Enrollment comparison is unchanged.
5. Rollback: upload the 0.6.1 ZIP the same way.

## 4. Smoke tests after a Main deployment

| Check | Expected |
|---|---|
| `curl -s -o /dev/null -w "%{http_code}" https://www.acadvizen.com/` (also `/blog`, `/admin-login`, `/sitemap.xml`, `/robots.txt`) | 200 |
| `npx vercel inspect https://www.acadvizen.com` | the new deployment ID, target production, Ready |
| Every sitemap URL | 200 (314 today); titles, descriptions, robots and canonicals unchanged |
| `curl -sI https://www.acadvizen.com/preview/wordpress/pages/x \| grep -i frame-ancestors` | `'self' https://enroll.acadvizen.com` |
| `curl -s -X POST -d '{}' https://www.acadvizen.com/api/wordpress/content` | 401 `missing_timestamp` |
| `curl -s -o /dev/null -w "%{http_code}" https://www.acadvizen.com/api/wordpress/bridge-manifest` | 404 |
| `/api/admin/notifications` signed out | 401 |
| `/admin` sign-in, then the notifications bell | Loads (proves the key picker selects the working key) |
| WordPress → Acadvizen Master Admin → Settings → **Test connection** | Connected |
| Header menu and footer on `/` and a course page | Same items as before |

## 5. Rollback

| Situation | Steps | Verify |
|---|---|---|
| Main misbehaves after release 11 | Vercel → Deployments → **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`** (Release 10) → ⋯ → **Promote to Production** (Instant Rollback, about a minute; data untouched) | §4 |
| Main misbehaves on Release 10 | Promote `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` (Release 9) | §4 (Release 9: Test connection shows 503) |
| Stop WordPress editing Main (content-API switch off) | Vercel → Settings → Environment Variables → remove `WORDPRESS_CONTENT_API_ENABLED` → Redeploy production | `POST /api/wordpress/content` → 503 `content_api_disabled` |
| Plugin misbehaves | WordPress → Plugins → Add New → Upload the 0.6.0 ZIP → **Replace current with uploaded**, or deactivate the plugin | Plugins list version; Enrollment unchanged |
| Bad content saved from WordPress | The record → **Earlier versions → Restore** | Public page shows the earlier text |
| After WordPress updates (O-6) | Restore the Hostinger backup taken just before; or reinstall the previous plugin versions and restore the database. This exact sequence was rehearsed locally (`evidence/o6-update-rehearsal/`) | Enrollment baseline comparison |
| Database disaster | Supabase → Database → Backups (daily; point-in-time recovery off) | Owner only |

**Rollback triggers:**
- a 5xx on any smoke URL;
- any change in the 314-URL comparison;
- "Test connection" failing;
- the `/admin` notifications failing;
- unexpected content.

**Rollback rehearsal on production:** not executed. It would change production, and no authorisation was given. The targets are Ready. The WordPress-update rollback was rehearsed locally.

## 6. Backups and rollback with approval and Elementor pages (plugin 0.7.0; prepared, not installed)

**What the CMS keeps by itself**

| Kept | Where | Used by |
|---|---|---|
| The previous live revision of each page, at every publication (latest 10 per page) | Private archive copies in WordPress (hidden from lists; meta `_acv_archive_of`) | **Approvals → Restore** (reviewers) |
| Every drawing of a page for the Main website | Table `{prefix}acv_render_versions` | Main rollback to an earlier drawing; Main keeps the previous drawing when a new one fails |
| Who did what, and which revision | Option `acv_cms_approval_log` (latest 1,000 entries) | Approvals → History; export it (`FINAL-MAINTENANCE-GUIDE.md` §5) |

**Rollback, from smallest to largest**

| Situation | Steps | Verify | Tested |
|---|---|---|---|
| One page's latest change is wrong | **Approvals → Recent publications → Restore** the earlier revision | Shows **Verified** on each chosen website | LOCAL (A10) |
| A page must disappear from Main now | A reviewer sets the page to Draft, or changes Publish To to Enrollment and publishes. Main serves its own page at that address again (within about 10 seconds; during Main's 30-second address cache the visitor is sent once to Main's own page, never a 404), or Main's 404 if it has no page there | The Main address | Draft: LOCAL (`migration-acceptance.mjs` M5). Publish To change under approval: not tested (O-23) |
| One website failed during a publication | Fix the cause, then **Check again**. The failing website kept its previous version meanwhile | Verified | LOCAL (A9) |
| All Elementor pages on Main must stop | Vercel: remove `WORDPRESS_CONTENT_ENABLED` → Redeploy, or promote the previous deployment. Main serves its own pages again | `tools/verify-production.mjs` (314 addresses) | Switch behaviour: bridge unit tests and LOCAL scenarios |
| Approval itself must be switched off | Remove `ACADVIZEN_CMS_APPROVAL` from wp-config.php. Publishing works as in 0.6.1; approval data stays and is ignored | Publish a test draft | LOCAL (approval tests switch it per run) |
| Plugin 0.7.0 must go | Before downgrading, publish or **Discard** open working copies (otherwise they stay as ordinary drafts). Then upload 0.6.1 → **Replace current with uploaded**. Archives stay as private drafts; to remove them: `wp post delete $(wp post list --post_type=any --post_status=any --meta_key=_acv_archive_of --format=ids) --force` | Plugins list; Test connection | Update and rollback rehearsed with 0.6.x (O-6). The 0.7.0 → 0.6.1 downgrade with working copies present is not rehearsed |
| Data loss | Hostinger full backup (WordPress files and database) and Supabase backups, taken before every production step (`MAIN-MIGRATION-PLAN.md` §4, step 1) | Restore to staging first | Not executed (owner-controlled) |

**Recovery rehearsed LOCAL (13 Oct):**
- The local WordPress database was backed up (`wp db export`, checksum recorded) before a site-wide migration test, then restored three times (`wp db import`).
- Each time, all 103 local Main addresses came back identical to the snapshot taken before the test, and the post count matched.

**Lesson for a real restore:** restoring the WordPress database does not tell Main anything. Main keeps serving its cached drawings of WordPress pages for up to 300 seconds (`lib/wordpress/bridge.js`). After restoring WordPress:
- run **Acadvizen Master Admin → Publishing → Republish all Main Website pages now**, which redraws them and notifies Main;
- or wait at least 5 minutes before comparing;
- then run `node tools/main-route-inventory.mjs` and compare with the pre-change snapshot (`tools/main-migration-compare.mjs`).

**Rollback rehearsal of the Elementor-page switch on production: not executed** (it is a production traffic change, not authorized).

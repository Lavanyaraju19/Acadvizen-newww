# Final release and rollback: Acadvizen Master Admin / headless CMS (13 October 2026)

## 1. Verified production state (read on 12 Oct 18:49 UTC and again 19:33–19:50 UTC)

| Component | Version / identifier |
|---|---|
| Main website (Vercel project `acadvizen-newww-ua9d`) | Release 10: deployment **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`**, commit **`80134d4`**, READY since 2026-10-12 16:04:24 UTC; serves `www.acadvizen.com` and `acadvizen.com`. Function region `iad1` |
| Previous Main deployment (rollback target) | Release 9: **`dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X`**, commit `dde1328`, READY |
| Enrollment plugin | Acadvizen Master Admin **0.6.1** (active since 12 Oct 18:16 UTC), package `dist/acadvizen-cms-0.6.1-2cc2148/acadvizen-cms.zip`, SHA-256 `dd6fcf27dfa101eb5940e868d11673d0bc8fec67f5a7264110039cfa2295e32c` |
| Previous plugin (rollback) | `dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3` |
| Git | GitHub `headless-wordpress` at `0554e5f` (`main` untouched at `48d61a8`). **Local** `headless-wordpress` is ahead by the release-11 commits `f855e33` and `8e27175` plus one docs commit. None is pushed |
| WordPress core | 7.0.7 (7.1.3 available, not installed) |

## 2. Settings (names only; values never in Git)

| Where | Name | State | Meaning |
|---|---|---|---|
| Vercel Production | `WORDPRESS_CONTENT_API_ENABLED` | **`true`** | **Content API on:** WordPress can edit Main's existing records through signed requests. Switched on 12 Oct with the owner's approval (release 9) |
| Vercel Production | `WORDPRESS_CMS_WEBHOOK_SECRET` | set (Sensitive) | The shared secret; equals the WordPress side (signed request verified, HTTP 200) |
| Vercel Production | `WORDPRESS_CMS_API_URL` | set | Allows the WordPress editor to frame Main previews. It does **not** turn on the bridge |
| Vercel (any) | `WORDPRESS_CONTENT_ENABLED` | **not set** | **Render Bridge off.** WordPress-rendered pages and WordPress blogs are never served at Main addresses |
| Vercel Production | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | set | Supabase access. `SUPABASE_SECRET_KEY` is **not** set; by the owner's decision no key is changed (`FINAL-SECURITY-REPORT.md`) |
| `wp-config.php` (Enrollment) | `ACADVIZEN_CMS_MAIN_URL`, `ACADVIZEN_CMS_WEBHOOK_SECRET` | set | Plugin Settings: "Shared secret: Set" |
| `wp-config.php` | `ACADVIZEN_CMS_SITEMAP_CLEANUP`, `_LOGIN_BRANDING`, `_SITE_TEMPLATES` | off | Optional Enrollment-wide features; keep off unless separately approved |

**Approval rules:**
- **Bridge activation** (`WORDPRESS_CONTENT_ENABLED=true`) needs explicit owner approval *after* its own end-to-end tests. It is **not** proposed.
- **The content-API switch is the owner's decision.** It can be switched off at any time with the steps in section 5.

## 3. Release 11 (committed locally; NOT pushed or deployed)

| Commit | Files | Change |
|---|---|---|
| `f855e33` | `src/middleware.js`, `app/api/admin/notifications/route.js`, `app/api/admin/notifications/[id]/read/route.js`, `tests/unit/supabase-key-rotation.test.js`, `tests/unit/wordpress-content-api.test.js` | Server reads prefer `SUPABASE_SECRET_KEY`, falling back to `SUPABASE_SERVICE_ROLE_KEY`. Plus tests: the key guard; 11 malformed addresses; rename onto a taken address |
| `8e27175` | `tests/wordpress/scheduling-acceptance.mjs`, `tests/wordpress/permissions-acceptance.mjs` | Acceptance tests (not part of the site build) |
| docs commit | `docs/cms-implementation/…` | These handover documents and the fresh evidence |

**Not committed (the owner's own changes):** `.gitignore` (adds `.vercel` and `.env*.local`) and `lib/wordpress/config.js.pre-integration-fix.bak`.

**Behaviour on production after deployment: unchanged.** Production sets only `SUPABASE_SERVICE_ROLE_KEY`, which these lines still use. Release 11 only removes the technical obstacle to a future key rotation. Deploying it is therefore **optional and not urgent**; it can ride along with the next Main release.

**Checks:** the fresh run (12 Oct 19:33–19:47 UTC) passed every step; see `FINAL-OPEN-ISSUES.md` "Final run".

**Owner steps, when approved** (manual workflow; the engineer has no authorisation to push or deploy):
```
git status --short                    # only .gitignore and the .bak file remain (yours)
git log --oneline origin/headless-wordpress..HEAD   # the release-11 and docs commits
git push origin headless-wordpress    # never main; this should create a Vercel Preview
```
1. Vercel → Deployments → the Preview for the new commit (Ready).
2. Check it: `/`, `/blog`, `/admin-login` = 200, and `/admin` sign-in works.
3. ⋯ → **Promote to Production**.
4. Run the smoke tests in §4.

If the push does not create a Preview (this happened on 12 Oct), create one for the exact commit with the Vercel CLI or API, with target **preview**, never production.

**Rollback after release 11:** promote the current Release 10 deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` again (Instant Rollback).

## 4. Smoke tests after any Main deployment (expected results)

| Check | Expected |
|---|---|
| `curl -s -o /dev/null -w '%{http_code}' https://www.acadvizen.com/` (also `/blog`, `/admin-login`, `/sitemap.xml`, `/robots.txt`) | 200 |
| Every sitemap URL | 200 (314 today) |
| `curl -sI https://www.acadvizen.com/preview/wordpress/pages/x \| grep -i frame-ancestors` | `'self' https://enroll.acadvizen.com` |
| `curl -s -X POST -d '{}' https://www.acadvizen.com/api/wordpress/content` | 401 `missing_timestamp` |
| `curl -s -o /dev/null -w '%{http_code}' https://www.acadvizen.com/api/wordpress/bridge-manifest` | 404 |
| WordPress → Acadvizen Master Admin → Settings → Test connection | Connected |
| `node tools/verify-content-api-live.mjs` | 16/16. It creates and removes one labelled noindex page; run only when a write test is approved |

## 5. Rollback

| Situation | Steps | Verify |
|---|---|---|
| Main misbehaves after release 11 | Vercel → Deployments → `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (Release 10) → ⋯ → **Promote to Production** | Smoke tests above |
| Main misbehaves on Release 10 | Vercel → Deployments → `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` (Release 9) → ⋯ → **Promote to Production** (Instant Rollback, about a minute; data untouched) | Smoke tests above (Release 9: "Test connection" shows 503 and previews are blocked; content unaffected) |
| Stop WordPress editing Main entirely (content-API switch off) | Vercel → Settings → Environment Variables → remove `WORDPRESS_CONTENT_API_ENABLED` → redeploy the current production deployment (Redeploy) | `POST /api/wordpress/content` answers 503 `content_api_disabled`; WordPress Main Website screens show an error |
| Plugin 0.6.1 misbehaves | WordPress → Plugins → Add New → Upload the 0.6.0 ZIP → **Replace current with uploaded**; or Deactivate "Acadvizen Master Admin" | Plugins list shows the version; Enrollment pages unchanged |
| Bad content saved from WordPress | The record → **Earlier versions → Restore** | Public page shows the earlier text |
| Database disaster | Supabase → Database → Backups (daily physical backups; point-in-time recovery off) | Owner only; last resort |
| Enrollment disaster | Hostinger backups (10 Oct files + database verified complete); never click Restore without a decision | Owner only |

**Rollback triggers:**
- a 5xx on any smoke URL;
- any change in the 314-URL comparison;
- "Test connection" failing;
- unexpected content on a Main page.

**Owner:** the site owner (Vercel, Supabase and Hostinger account holder).

**Rollback rehearsal:** not executed. A rehearsal would change production, and no authorisation was given. The targets were confirmed READY on 12 Oct.

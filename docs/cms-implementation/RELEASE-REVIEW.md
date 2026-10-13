# Release 11: review sheet (13 October 2026)

**Status: committed locally on `headless-wordpress`; NOT pushed or deployed.** The owner pushes and promotes it (`FINAL-RELEASE-AND-ROLLBACK.md` §3).

**Base:** `0554e5f` (on GitHub). Live is Release 10 (`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`, built from `80134d4`).

| Commit | What | Review notes |
|---|---|---|
| `f855e33` | Middleware and notification routes prefer `SUPABASE_SECRET_KEY`; slug tests | Superseded in detail by `03d18dc` |
| `8e27175` | Scheduling and role-permission acceptance tests | Test tools only |
| `13eac79` | First version of the handover documents | Docs |
| `03d18dc` | `lib/supabaseServiceKey.js`: the new key is used only when it has a server-key shape, otherwise the legacy key. `lib/env.ts`, the middleware and the notification routes use it. The routes answer 503 when no key is configured | Found in review: the plain `||` let a malformed new value displace the working key. 7 tests. Proven locally with only `sb_secret_`/`sb_publishable_` keys (all suites pass) |
| `df30076` | Site settings and menus load concurrently (`lib/siteMenus.js`) | 15 tests; identical output to the old sequential code in 12 cases |
| `fc53a7e` | `nodemailer` 10.1.0; Next.js's `sharp` 0.35.5 via override | `npm audit` 0; mailer tests 11/11; Node 20.x on Vercel; local image optimiser AVIF/WebP/PNG OK |
| `436a822` | CMS lookups stop early when a slug has no row in a table | 9 tests; hits, preview and custom selects unchanged; tool pages 6.2 → 1.9 s at 200 ms per query |
| docs commit | Final documents and evidence | Docs |

**Production effect:**
- the same key is selected, so no visible change;
- same content, faster pages;
- dependencies patched.
- **No environment variable, region or feature-switch change.**

**Excluded (the owner's):** `.gitignore`, `lib/wordpress/config.js.pre-integration-fix.bak`.

**Rollback:** promote `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` again.

# Release 10: review sheet

**Status (12 October 2026, 18:40 UTC): released.** Commit `80134d4` was pushed and its Preview `dpl_HRwdKQX423uCLGUwUsDdTLPd1skC` promoted, so **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` is live** (READY 16:04:24 UTC). Every gate below passed first.

The push did not trigger a Vercel build: no deployment and no GitHub status appeared. The Preview was therefore created through the Vercel API for exactly `80134d4`, with target **preview**, before promotion.

Follow-up, found by the production acceptance tests:
- plugin **0.6.1** (`2cc2148`), an "Enrollment only" blog stays live when edited again; installed on Enrollment;
- acceptance tooling `367309f`.

Results: `TEST-RESULTS.md` (R10-1 … R10-20).

*(Prepared on 12 October 2026, evening, for the owner's review; the text below is the original sheet.)*

Base: `headless-wordpress` at `5d2f64a`. Live is release 9 (`dpl_4YpH3TaN…`, `dde1328`).

## Why

Two production defects, both found while resolving the "configuration mismatch" between `WORDPRESS_CONTENT_ENABLED` and `WORDPRESS_CONTENT_API_ENABLED`. These are **not** a mismatch: they are two independent integrations, and neither may enable the other. Turning on reading would let WordPress/Elementor pages take over Main addresses.

1. **WordPress's "Test connection" button reports "Not connected" even when the connection works.**
   - It calls `/api/wordpress/slug-check`, which only answered when WordPress *reading* was on.
   - PRODUCTION answers it with 503 `wordpress_content_disabled` today.
   - Fix: the slug check (signed, read-only) answers when **either** integration is on.
2. **Previews inside the WordPress editor are blocked.**
   - Main allows the WordPress origin to frame `/preview/wordpress/…` only when `WORDPRESS_CMS_API_URL` is set; production doesn't set it (live header: `frame-ancestors 'none'`).
   - Fix: a **configuration change, not code:** set that variable in Vercel Production.
   - Tests now prove it does not switch on reading.

## Files

| File | Change |
|---|---|
| `lib/wordpress/config.js` | Documents the two integrations. Adds `getContentApiConfig()` (content API) and `getSlugCheckConfig()` (either integration). `getWordPressConfig()` (reading) is unchanged |
| `app/api/wordpress/content/route.js` | Uses `getContentApiConfig()`. Same behaviour; secrets under 32 characters were already refused |
| `app/api/wordpress/slug-check/route.js` | Uses `getSlugCheckConfig()` |
| `tools/verify-content-api-live.mjs` | Reads only the quoted secret, so a comment or joined line in the credentials file is ignored |
| `tests/unit/wordpress-integration-switches.test.js` (new, 8 tests) | Defaults off; only `"true"` counts; neither switch enables the other; bad URLs and short secrets fail closed; the slug check under every combination (signed, wrong secret, stale, unsigned); the content API refused when only reading is on; each route uses its own switch |
| `tests/unit/wordpress-preview-framing.test.js` (new, 3 tests) | With the URL: only the preview route may be framed, only by WordPress, and no bridge scripts or frames. Without it, or with an invalid one: nothing may be framed |
| `tests/wordpress/structured-acceptance.mjs` | An interrupted run now discards its own private draft copy (never the live page) |
| `docs/cms-implementation/*.md`, `evidence/local-structured/results-202610121319.json` | Corrected Step 7 (set `WORDPRESS_CMS_API_URL`), owner actions, results; the 56/56 LOCAL run |

Not included (owner's own changes, leave unstaged): `.gitignore`, `lib/wordpress/config.js.pre-integration-fix.bak`.

## Commits (prepared locally as three narrow commits; push and deploy only with the owner's approval)

1. **Code and unit tests:**
   - `lib/wordpress/config.js`
   - `app/api/wordpress/content/route.js`
   - `app/api/wordpress/slug-check/route.js`
   - `tests/unit/wordpress-integration-switches.test.js`
   - `tests/unit/wordpress-preview-framing.test.js`
2. **Tooling and the test harness:**
   - `tools/verify-content-api-live.mjs`
   - `tests/wordpress/structured-acceptance.mjs`
3. **Docs and evidence:** `docs/cms-implementation/*`

Not committed (owner's own files): `.gitignore`, `lib/wordpress/config.js.pre-integration-fix.bak`.

**Vercel Production variables (status 12 Oct 13:56 UTC):**
- `WORDPRESS_CMS_API_URL` is set (by the owner, 13:54 UTC; value verified);
- `WORDPRESS_CONTENT_ENABLED` is **not** set, and must stay unset.

**Actions that need approval:**
```
git push origin headless-wordpress     # never main; creates a Preview only
```
Then Deployments → the new `headless-wordpress` Preview (Ready) → ⋯ → **Promote to Production**. That rebuilds with the Production variables, so both fixes go live together.

After the deployment, check:

```
curl -sI https://www.acadvizen.com/preview/wordpress/pages/x | grep -i frame-ancestors     # 'self' https://enroll.acadvizen.com
curl -s -X POST -d '{}' https://www.acadvizen.com/api/wordpress/slug-check                 # 401 missing_timestamp (not 503)
curl -s -o /dev/null -w '%{http_code}\n' https://www.acadvizen.com/api/wordpress/bridge-manifest   # 404: reading stays off
node tools/verify-content-api-live.mjs
```

**Undo:** promote `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` again, and remove the variable.

---

# Release 9: review sheet (prepared 12 October 2026, not committed)

Base: branch `headless-wordpress` at `80edb95`. That commit equals the live code (`45d78b9`) plus documentation only, and equals `origin/headless-wordpress`.

The owner commits, pushes and deploys (`OWNER-ACTIONS.md` step 4). Nothing here has been committed, pushed or deployed by the engineer.

## What it changes on the live websites

| Change | Visible effect | Risk |
|---|---|---|
| The sitemap leaves out noindex pages, noindex SEO overrides and noindex blogs | None today: PRODUCTION has 0 such pages or blogs. Prevents a future contradiction once editors tick "noindex" | Low. Every other sitemap rule is unchanged, and a missing column only drops that one filter |
| The rich-text editor in Main `/admin` is no longer inside a `<label>` (popup content; city hero, about and FAQ answer) | Clicking into the text no longer toggles Bold or loses the first letter typed | Low. Only the wrapper element changes, from `<label>` to `<div>`, with the same classes |
| Dependency security updates (`npm audit fix`; tiptap 3.28 → 3.31.4, same major version) | None expected | Low to medium. Covered by the build, unit tests, the editor smoke test, the upload smoke test and 115 browser checks |
| Switching the content API on | Takes effect with this deployment, because the variables are already set. WordPress can then change Main content through signed requests only | Covered by the live tool, and undone by Instant Rollback |

## Files (24, including FINAL-EVIDENCE-REPORT.md)

| File | Why |
|---|---|
| `lib/publicSitemap.js`, `lib/publicSitemapRoutes.js` | Sitemap noindex rules (`indexableRows`) |
| `tests/unit/public-sitemap.test.js` | 2 new tests for those rules |
| `app/admin/popups/PopupManagerClient.jsx`, `app/admin/cities/CityBuilderClient.jsx` | Editor wrapper `<label>` → `<div>`: 4 places, 8 lines |
| `tests/unit/rich-text-editor-wrappers.test.js` (new) | Fails if any screen puts the editor inside a `<label>` again (it caught all 4 before the fix) |
| `package.json`, `package-lock.json` | Security updates: 74 version lines, all from registry.npmjs.org, no package added or removed |
| `tools/verify-content-api-live.mjs` (new) | Live check of the signed API and of Main-only publishing, on one disposable noindex page |
| `tools/verify-wordpress-live.mjs` (new) | Live check of Main only, Enrollment only and Both from the WordPress admin, on one disposable noindex blog |
| `tests/wordpress/acceptanceKit.mjs`, `tests/wordpress/structured-acceptance.mjs` | Test cleanup also deletes the test blog's Enrollment copy for good. It uses each post's own Delete Permanently link, never Empty Trash |
| `docs/cms-implementation/*.md` (7 files; `OWNER-ACTIONS.md`, `FINAL-EVIDENCE-REPORT.md` and this file are new) | Owner steps, release and rollback, test results, client handover, admin guide |
| `docs/cms-implementation/evidence/*/results-20261012*.json` (5 new) | LOCAL results of this build's browser runs |

## Checks on the change set

- **Secrets:** each of the 24 files was compared against every value in the private credentials file and in `.env.local`, plus JWT, Supabase-secret, GitHub-token and private-key patterns. 0 findings. One login email found in a doc was removed.
- **Archives and dumps:** none. No backup file exists in or near the project.
- **Tests:** see "Release 9 evidence" in `PRODUCTION-RELEASE-AND-ROLLBACK.md`. Unit 197/197, PHP 242/242, TypeScript and ESLint 0 errors, build OK, browser acceptance 115/115, live tools 16/16 and 15/15 (all LOCAL).

## Not in this release

- The plugin (`wordpress/acadvizen-cms`) is unchanged: 0.6.0 is the package in `dist/`.
- No database migration.
- `supabase db push` was never run.
- No Supabase key was changed.

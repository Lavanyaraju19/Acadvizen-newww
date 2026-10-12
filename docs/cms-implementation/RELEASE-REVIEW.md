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

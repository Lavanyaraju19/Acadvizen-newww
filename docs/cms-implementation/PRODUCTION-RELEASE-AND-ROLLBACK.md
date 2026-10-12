# Production releases and rollback

Every release goes out on its own, from a branch that contains only what is being released. Each release is tested and built first, then compared on production data with the live site, deployed as one exact commit, and verified on the live site. The previous deployment stays available to promote back.

## Releases made (PRODUCTION)

| # | What | Branch and commit | Vercel deployment | Verified on the live site |
|---|---|---|---|---|
| 1 | A live page no longer answers 404 while a private draft copy of it exists, plus regression tests | `release/draft-404-fix`, `cb0093d` (on top of the previous live `d48492b`) | `dpl_2ZCk4Vtf9W6s3X7MT3f2zdPSHN2u`, 11 Oct 2026 10:33 UTC | <ul><li>All 314 sitemap URLs answer 200.</li><li>`verify-production.mjs`: 26 passed, 10 failed, the same as before the release.</li><li>The draft scenario itself is BLOCKED on production (see below).</li></ul> |
| 2 | Next.js 15.5.22 → 15.5.27 (security release) | `release/next-15.5.27`, `80fc059` | `dpl_9ZCRdZD4ALJSWVzz64E47nHNSt3P` | <ul><li>The build log shows Next.js 15.5.27.</li><li>314/314 URLs answer 200.</li><li>Same baseline (26/10).</li><li>No error logs.</li><li>`npm audit`: 0 critical.</li></ul> |
| 4 | Main side of the central CMS. It includes:<ul><li>the WordPress content API, **switched off**;</li><li>the homepage lists and navigation refactors (no visible change);</li><li>city page feature cards;</li><li>the unpublished-tool page fix;</li><li>durable replay protection.</li></ul> | `release/cms-main`, `45d78b9` | `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (**live**, 12 Oct 2026) | <ul><li>All sitemap URLs answer 200.</li><li>`verify-production.mjs`: **27 passed, 9 failed** (the tool page check now passes; the rest are the known Enrollment issues).</li><li>The content API answers 503 `content_api_disabled`.</li><li>No error logs.</li><li>Before release, against production data: 314/314 URLs answered 200. Ten key pages, at desktop and phone width, differed from the live site by 0.001–0.098 % of pixels (/tools compared once its tool grid had loaded).</li></ul> |
| 3 | Menu links no longer multiply across page views; a draft copy no longer changes the live page's address or SEO before publishing | `release/admin-fixes`, `0cb4886` | `dpl_9ZdvT6jSoj6pauZaSmXUtc9ufSzt` | <ul><li>314/314 URLs answer 200.</li><li>Navigation links appear once each over repeated requests.</li><li>Same baseline (26/10).</li><li>No error logs.</li></ul> |

| 9 | Sitemap leaves out noindex pages; rich-text editor fix; dependency security updates; **content API switched on**; live verification tools | `headless-wordpress`, `dde1328` (Preview `dpl_9HgzJNtZZAEvNpnqSopxMnngaNWQ`, promoted) | `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` (**live**, 12 Oct 2026) | <ul><li>Before promotion, the release build ran on production data: 314/314 sitemap URLs identical to live in status, title, description, robots, canonical and og:url. Twenty key-page screenshots differed from live by 0.000–0.094 % of pixels (`/tools` compared once its 67-tool grid had loaded).</li><li>After promotion: 314/314 URLs answer 200; `verify-production.mjs` 27/9, unchanged; the API refuses unsigned requests (401).</li><li>`verify-content-api-live.mjs`: **16/16 PRODUCTION**.</li><li>Editor fix checked on production `/admin/popups` (nothing saved).</li></ul> |

Release 9's first promotion failed with `git_info_fail` (Vercel could not read the commit from GitHub) before building. The live site was not affected: `www` stayed on `dpl_EuZnhizE…`. One retry succeeded, as with release 3.

The Preview environment has no Supabase variables, so a Preview cannot show database content. A promoted Preview is rebuilt with the Production variables, which is why every release is checked on production data before promotion.

Before each release, its build ran against **production data** (read-only page loads). It answered all 314 sitemap URLs with 200, and unknown addresses with 404, exactly like the live site.

Release 3's first deployment attempt was refused by Vercel with `git_info_fail` before building. That was a transient failure to read the commit from GitHub: the commit was on GitHub, and the GitHub API answered. One retry succeeded. Nothing was released by the failed attempt.

## How to roll back a release

| Situation | Step | Effect |
|---|---|---|
| The live Main website misbehaves after a release | Vercel → project `acadvizen-newww-ua9d` → Deployments → the previous deployment from the table above → **Promote to Production**. For release 9, that is `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (release 4, content API off) | The previous release serves again within a minute. Data is not touched |
| Roll back to before all four releases | Promote `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56` (commit `d48492b`) | The site as it was on 10 October |
| The WordPress plugin misbehaves | WordPress → Plugins → Deactivate "Acadvizen Master Admin", or upload the previous package from `dist/` | Main content is not affected (it lives in Supabase) |
| The WordPress content API misbehaves (once enabled) | Vercel: remove `WORDPRESS_CONTENT_API_ENABLED` and redeploy (or Promote the previous deployment) | The API answers 503; nothing can change Main content from WordPress |
| A Main record was changed by mistake from WordPress | Its edit screen → **Earlier versions** → **Restore** | The earlier text comes back. The first change of an existing record keeps the version before it |
| The replay-protection table must go | `drop table if exists public.wordpress_content_requests;` | The API then refuses all changes (503) until the table exists again |

Promote is exactly the step Vercel's dashboard offers; the API equivalent is a production deployment of the earlier commit (`scratchpad` tool `deploy-prod-git.cjs <branch> <sha>`).

## Releases still to make, and what each needs

| # | What | Ready | Blocked by |
|---|---|---|---|
| 5 | Supabase migration `202610110001_wordpress_content_request_ids.sql` (replay protection; additive) | **Done, 12 Oct 2026.** Applied as one file and recorded with `migration repair`; verified: RLS on, no policies, no public access | — |
| 6 | WordPress plugin 0.6.0 on Enrollment (live is still 0.4.0, checked 12 Oct) | Package `dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`, 24 files, byte-identical to commit `45d78b9`. Enrollment backups verified 12 Oct | WordPress access. The saved password was refused a fourth time on 12 Oct; the owner must set a new one (`OWNER-ACTIONS.md` step 2) or upload the ZIP |
| 7 | Connect the two sites | **Main side done and live (12 Oct):** both variables set, release 9 deployed, the API is on, and unsigned requests are refused | The `wp-config.php` constants on Enrollment (`OWNER-ACTIONS.md` step 3) |
| 8 | Production acceptance | `verify-content-api-live.mjs` **16/16 PRODUCTION** (12 Oct). `verify-wordpress-live.mjs` (Main only, Enrollment only, Both through the WordPress admin) passes LOCAL 15/15 and waits for steps 6 and 7 | WordPress access |
| 9 | Release 9 (`RELEASE-REVIEW.md`) | **Done, 12 Oct**: live as `dpl_4YpH3TaN…` (see "Releases made") | — |
| 10 | Secret guard and removal of the hard-coded production database password from 12 scripts (`8535030`). No website code changed, so no deployment is needed | Pushed to `headless-wordpress`; the GitHub "Secret scan" workflow passed | — |

### Release 9 evidence (LOCAL unless stated)

| Check | Result |
|---|---|
| Unit tests | 197/197 |
| PHP plugin tests / PHP lint | 242/242 / 20 files, 0 errors (plugin unchanged) |
| TypeScript / ESLint | 0 errors / 0 errors (10 old warnings) |
| Production build | Compiled (Next.js 15.5.27) |
| WordPress browser acceptance on this build | Pages/blogs/permissions/security 56/56; site chrome 18/18; homepage 14/14; city, service, SEO and media 15/15; courses 12/12. **Total 115/115.** Courses passed on a rerun: the first run lost a checkbox click in headless Chromium and saved the course inactive |
| Sitemap noindex fix | 7/7. Pages with their own noindex flag or a noindex SEO override answer 200 with `noindex, follow` and are not in `sitemap.xml`; the indexable control page is listed; the sitemap still builds when the override column is missing. **PRODUCTION:** 0 noindex pages, blogs or overrides today, so deploying removes no current URL |
| Editor fix | 6/6. Fast and slow typing give exactly the expected HTML. With the live code, one click toggled Bold; this was reproduced on the old dependencies, so it is not caused by the upgrade |
| Dependency updates | `npm audit --omit=dev`: 6 high and 27 moderate → 2 high and 0 moderate. Upload smoke 5/5 (sharp 0.35.5 still turns a PNG into WebP) |
| `tools/verify-content-api-live.mjs` | LOCAL 16/16. PRODUCTION: stops before changing anything while the API is off (verified) |
| `tools/verify-wordpress-live.mjs` | LOCAL 15/15, including the Enrollment copy being deleted for good |

### Step 7 exactly

One random secret of at least 32 characters, the same on both sides. Store it only in the private credentials file, never in Git, chat or documents.

1. **Vercel** → project `acadvizen-newww-ua9d` → Settings → Environment Variables → Production:
   - `WORDPRESS_CMS_WEBHOOK_SECRET` = the secret (type **Sensitive**);
   - `WORDPRESS_CONTENT_API_ENABLED` = `true`.

   Do **not** set `WORDPRESS_CMS_API_URL` or `WORDPRESS_CONTENT_ENABLED`. Those switch on the separate Elementor Render Bridge and WordPress-blog features, which are not part of this release.
   **Status: done 12 Oct.**
2. **Deploy** production: release 9 through **Promote to Production** (`OWNER-ACTIONS.md` step 4). A promoted preview is rebuilt with the Production variables. Then `POST https://www.acadvizen.com/api/wordpress/content` without a signature must answer **401**, not 503. `tools/verify-content-api-live.mjs` checks this first.
3. **WordPress** (hPanel → File Manager → `wp-config.php` of enroll.acadvizen.com, above "That's all, stop editing"):
   ```php
   define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
   define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '<the same secret>' );
   ```
   The plugin reads these only as constants. There is no settings-page alternative.
4. WordPress → Master Admin → Main Website: the screens list live records.

Rollback, fastest first:
- **Instant Rollback:** promote `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` again. That build keeps its old variables, so the API answers 503.
- Deactivate the plugin.
- Remove the two Vercel variables and deploy.

## Production checks done without changing content

- **Plugin API (`tools/cms-api-smoke.mjs`): 13/13.** Unsigned, malformed and wrong-secret calls answer 401, and the enquiry route is registered.
- **Live websites (`tools/verify-production.mjs`): 27 passed, 9 failed after release 4.** All 9 failures are on Enrollment and existed before: the sitemaps return 404, three redirects return 404, `/contact-us/` returns 404, and the logo link points to the wrong address.

## Not verified on production

- Everything that needs plugin 0.6.0 on Enrollment and the API switched on: WordPress → Main publishing, Enrollment-only and Both publishing, permissions, menus, media, SEO and responsive views on production. Each is covered by the two live tools and `TEST-PLAN.md`, and each is waiting for `OWNER-ACTIONS.md` steps 1–4.
- The Enrollment backup: no downloaded copy was found on this PC.

**Verified since:** the draft-copy scenario through Main's own admin. It passed on PRODUCTION on 12 Oct: the live page answered 200 and was unchanged on 10/10 requests while its draft copy existed, and the test page was cleaned up. The sitemap defect that test found is fixed in release 9.

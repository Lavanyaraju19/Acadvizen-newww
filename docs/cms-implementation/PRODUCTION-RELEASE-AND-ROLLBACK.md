# Production releases and rollback

Every release goes out on its own, from a branch that contains only what is being released. Each release is tested and built first, then compared on production data with the live site, deployed as one exact commit, and verified on the live site. The previous deployment stays available to promote back.

## Releases made (PRODUCTION)

| # | What | Branch and commit | Vercel deployment | Verified on the live site |
|---|---|---|---|---|
| 1 | A live page no longer answers 404 while a private draft copy of it exists, plus regression tests | `release/draft-404-fix`, `cb0093d` (on top of the previous live `d48492b`) | `dpl_2ZCk4Vtf9W6s3X7MT3f2zdPSHN2u`, 11 Oct 2026 10:33 UTC | <ul><li>All 314 sitemap URLs answer 200.</li><li>`verify-production.mjs`: 26 passed, 10 failed, the same as before the release.</li><li>The draft scenario itself is BLOCKED on production (see below).</li></ul> |
| 2 | Next.js 15.5.22 → 15.5.27 (security release) | `release/next-15.5.27`, `80fc059` | `dpl_9ZCRdZD4ALJSWVzz64E47nHNSt3P` | <ul><li>The build log shows Next.js 15.5.27.</li><li>314/314 URLs answer 200.</li><li>Same baseline (26/10).</li><li>No error logs.</li><li>`npm audit`: 0 critical.</li></ul> |
| 4 | Main side of the central CMS. It includes:<ul><li>the WordPress content API, **switched off**;</li><li>the homepage lists and navigation refactors (no visible change);</li><li>city page feature cards;</li><li>the unpublished-tool page fix;</li><li>durable replay protection.</li></ul> | `release/cms-main`, `45d78b9` | `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (**live**, 12 Oct 2026) | <ul><li>All sitemap URLs answer 200.</li><li>`verify-production.mjs`: **27 passed, 9 failed** (the tool page check now passes; the rest are the known Enrollment issues).</li><li>The content API answers 503 `content_api_disabled`.</li><li>No error logs.</li><li>Before release, against production data: 314/314 URLs answered 200. Ten key pages, at desktop and phone width, differed from the live site by 0.001–0.098 % of pixels (/tools compared once its tool grid had loaded).</li></ul> |
| 3 | Menu links no longer multiply across page views; a draft copy no longer changes the live page's address or SEO before publishing | `release/admin-fixes`, `0cb4886` | `dpl_9ZdvT6jSoj6pauZaSmXUtc9ufSzt` | <ul><li>314/314 URLs answer 200.</li><li>Navigation links appear once each over repeated requests.</li><li>Same baseline (26/10).</li><li>No error logs.</li></ul> |

Before each release, its build ran against **production data** (read-only page loads). It answered all 314 sitemap URLs with 200, and unknown addresses with 404, exactly like the live site.

Release 3's first deployment attempt was refused by Vercel with `git_info_fail` before building. That was a transient failure to read the commit from GitHub: the commit was on GitHub, and the GitHub API answered. One retry succeeded. Nothing was released by the failed attempt.

## How to roll back a release

| Situation | Step | Effect |
|---|---|---|
| The live Main website misbehaves after a release | Vercel → project `acadvizen-newww-ua9d` → Deployments → the previous deployment from the table above → **Promote to Production** | The previous release serves again within a minute. Data is not touched |
| Roll back to before all four releases | Promote `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56` (commit `d48492b`) | The site as it was on 10 October |
| The WordPress plugin misbehaves | WordPress → Plugins → Deactivate "Acadvizen Master Admin", or upload the previous package from `dist/` | Main content is not affected (it lives in Supabase) |
| The WordPress content API misbehaves (once enabled) | Vercel: remove `WORDPRESS_CONTENT_API_ENABLED` and redeploy (or Promote the previous deployment) | The API answers 503; nothing can change Main content from WordPress |
| A Main record was changed by mistake from WordPress | Its edit screen → **Earlier versions** → **Restore** | The earlier text comes back. The first change of an existing record keeps the version before it |
| The replay-protection table must go | `drop table if exists public.wordpress_content_requests;` | The API then refuses all changes (503) until the table exists again |

Promote is exactly the step Vercel's dashboard offers; the API equivalent is a production deployment of the earlier commit (`scratchpad` tool `deploy-prod-git.cjs <branch> <sha>`).

## Releases still to make, and what each needs

| # | What | Ready | Blocked by |
|---|---|---|---|
| 5 | Supabase migration `202610110001_wordpress_content_request_ids.sql` (replay protection; additive) | Tested locally: idempotent, duplicates refused, no public access | Database access: the Supabase SQL editor (owner), or a database password / Supabase access token for `supabase db push` |
| 6 | WordPress plugin 0.6.0 on Enrollment | Package `dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`, 24 files, byte-identical to commit `45d78b9` | A working WordPress administrator login, and a confirmed Enrollment backup |
| 7 | Shared secret and API URL on both sides; `WORDPRESS_CONTENT_API_ENABLED=true` | Names are in `IMPLEMENTATION.md` | Steps 5 and 6. The secret must be set in `wp-config.php`, which needs Hostinger File Manager or SFTP |
| 8 | Production acceptance on labelled test content (the `tests/wordpress` suites, pointed at production) | Scripts ready | Step 7, and one approved test enquiry |

## Production checks done without changing content

- **Plugin API (`tools/cms-api-smoke.mjs`): 13/13.** Unsigned, malformed and wrong-secret calls answer 401, and the enquiry route is registered.
- **Live websites (`tools/verify-production.mjs`): 27 passed, 9 failed after release 4.** All 9 failures are on Enrollment and existed before: the sitemaps return 404, three redirects return 404, `/contact-us/` returns 404, and the logo link points to the wrong address.

## Not verified on production

**The draft-copy scenario through Main's own admin.** The Main admin password in the owner's access checklist was rejected twice ("Invalid email or password"), and I stopped to avoid a lockout. Release 1 is verified on every public URL, against production data, and by the regression tests. The live draft test needs a working Main admin login, or steps 5–7 (the signed API is now deployed, switched off).

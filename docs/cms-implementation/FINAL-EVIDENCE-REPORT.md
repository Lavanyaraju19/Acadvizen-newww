# Final evidence report: Acadvizen central CMS (updated 12 October 2026, 18:40 UTC)

Every result below is labelled by where it ran:
- **PRODUCTION:** the live websites and database.
- **LOCAL:** a copy, using a local WordPress, a local Main build and a local database.

A LOCAL pass is never counted as a live result.

## Verdict (12 October 2026, 18:40 UTC)

**The CMS works end to end on production. Overall status: NOT CLIENT-READY**, for one reason only: an unresolved **critical security risk**. Production credentials (the Supabase service-role key, the production database password and the Main admin password) are readable in public Git history and have not been changed. Rotating the service-role key is on hold by the owner's instruction. Once those credentials are changed, nothing else blocks client use.

Proven on production, through the real WordPress admin:
- Main only, Enrollment only and Both publishing, including updates;
- create, draft, preview, publish, private copy, update, address clash, unpublish and delete;
- cleanup of every test item on both sites;
- no change to the 314 Main URLs or the 60 Enrollment pages.

Details: "Release 10 and production acceptance" below.

## Release 10 and production acceptance (PRODUCTION, 12 October 2026)

| Item | Evidence |
|---|---|
| Main deployment | **`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`**, commit **`80134d4`**, READY at 16:04:24 UTC, serving `www.acadvizen.com` and `acadvizen.com`. Promoted from the reviewed Preview `dpl_HRwdKQX423uCLGUwUsDdTLPd1skC`. Rollback target: Release 9 `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` (READY) |
| Enrollment plugin | **Acadvizen Master Admin 0.6.1**, active, installed 18:16 UTC. Package `dist/acadvizen-cms-0.6.1-2cc2148/acadvizen-cms.zip`, SHA-256 `dd6fcf27dfa101eb5940e868d11673d0bc8fec67f5a7264110039cfa2295e32c`, 24 files identical to commit `2cc2148`. Rollback: the 0.6.0 package with "Replace current with uploaded", or deactivate |
| WordPress connection | Settings: Main Website address set, "Shared secret: Set", optional features off. **"Test connection" → "Connected. The Main Website accepted a signed request."** (16:10 and 18:37 UTC). Main Website → Pages lists 50 Main pages, and 24 content tabs |
| API security (`verify-content-api-live.mjs`) | **16/16** at 16:34 and 18:24 UTC. Unsigned, wrong-secret and stale requests refused (401); replayed change refused (409); errors carry codes only. Slug check: signed 200; unsigned and wrong secret 401; invalid path 400; existing address reported as a conflict. Bridge manifest 404 |
| Preview framing | `/preview/wordpress/…` sends `frame-ancestors 'self' https://enroll.acadvizen.com`; every other route keeps `'none'` / `SAMEORIGIN`. The editor shows Main's page in Main's design inside the frame (`evidence/production-r10/03`, `04`) |
| Page workflow in the real admin (`verify-wordpress-pages-live.mjs`) | **17/17** on 0.6.0 (16:35 UTC) and **17/17** on 0.6.1 (18:20 UTC, 0 click fallbacks). Labelled noindex page: create → draft private (404) → sections → editor preview → publish (public 200, noindex, canonical to itself, not in sitemap) → private copy (live unchanged) → publish copy (update live, fresh request too) → an existing address refused, nothing overwritten → unpublish (404) → Trash + Delete permanently → 404, not in sitemap |
| Blogs Main / Enrollment / Both in the real admin (`verify-wordpress-live.mjs`) | **16/16** on 0.6.1 (18:17 UTC). Main only: public on Main, absent from Enrollment, noindex. Enrollment only: one form submission, Enrollment copy `publish`, public 200; not on Main; **saving again keeps it live (shown as Published)**. Both: public on both; an edit reaches both. Cleanup: Main admin list and trash empty, Enrollment copy deleted for good, both URLs 404. Elementor home 200 |
| Regression | Main: **314/314 sitemap URLs identical** to the pre-release snapshot (status, title, description, robots, canonical), before and after all tests. Enrollment: **60/60 pages identical** (status, title, robots, canonical, Elementor). Site Health: 0 critical. Enquiry route registered (POST). `/admin-login` 200 |
| Cleanup | 0 test pages or blogs on Main (list and trash). 0 Enrollment posts titled "CMS PRODUCTION TEST" in any status, including trash. Nothing in the Main sitemap or the public Enrollment post list |

### Defects found on production and fixed

| Defect | Fix | Proof |
|---|---|---|
| WordPress "Test connection" answered `wordpress_content_disabled` | Release 10 (`16a549e`): the slug check answers when the content API is on | "Connected" on production |
| Editor previews blocked (`frame-ancestors 'none'`) | `WORDPRESS_CMS_API_URL` set (owner) and deployed with Release 10 | Header on production; editor screenshots |
| An "Enrollment only" blog showed Status "Draft", so the next save (or a version restore) unpublished it from Enrollment | Plugin **0.6.1** (`2cc2148`), with 10 PHP tests | Production 16/16, including "saving again keeps it live" |
| Test tooling: a retried click submitted the reloaded form twice on the slow server; errors could end with "0 failed"; Windows Chromium stopped painting wp-admin | `367309f` | One POST per save; errors reported as FAIL; 0 click fallbacks |

### Not tested on production, and why

- **Author and Contributor permissions:** there are no such test accounts on production, and creating users is a production change. LOCAL: PASS (403 for the screens each role may not open).
- **Main media library upload, menus, header and footer, homepage lists, courses, city and service pages:** an edit there shows to every visitor immediately. LOCAL: PASS (`TEST-RESULTS.md`).
- **Scheduled publishing:** not tested on any level.
- **A Preview with WordPress settings:** BLOCKED. No non-production database is active, the staging WordPress runs plugin 0.3.0, and production secrets must not be copied into Preview.

### Observations for the owner (not caused by the CMS)

- **The Enrollment homepage now shows "Where Our Learners Build Their Careers" twice.** It was edited in Elementor at 11:44 and 12:42 UTC by WordPress user ID 1 (the integration account is ID 2 and never edited it).
- **Three plugins were added to Enrollment during the day:** Microsoft Clarity and WPConsent (active), and Pixel Manager for WooCommerce (inactive).
- **Updates pending:** WordPress 7.1.3, and 13 plugin updates.
- **Enrollment is slow:** public pages take 3–5 s, and the Main Website admin screens about 20 s.

## Earlier verdict (12 October, before Release 10), kept for history

**Main side live and verified; plugin 0.6.0 installed on Enrollment with the site preserved. NOT client-ready yet:** the `wp-config.php` constants are missing, so the plugin is "Not connected", and the three live publishing tests have not run. The notes below describe the blocker as it stood before the install.

The WordPress side is blocked by one external dependency: a working WordPress administrator password.
- The saved password was refused a fourth time on 12 Oct ("password … incorrect").
- No further attempts were made.
- Until the owner sets a new password (`OWNER-ACTIONS.md` step 2), these cannot be done or tested on the live sites:
  - plugin 0.6.0 installation;
  - the `wp-config.php` constants;
  - publishing from WordPress to Main only, Enrollment only and Both.

They are not claimed as done.

**Security is not passed.** Old commits in the public GitHub history (every branch, including `main`) contain production credentials:
- the Supabase service-role key (not rotated, by the owner's decision);
- the production database password;
- the working Main admin password;
- another admin password.

None is in the current files any more, and a guard now blocks new ones. But history is public, so anyone can still read these values. Each one stays a live risk until it is changed. See "Security" below.

## PRODUCTION evidence

| Area | Result | Date |
|---|---|---|
| Live Main deployment | `dpl_4YpH3TaN11ijr6gfzfjorRmMxQ4X` = release 9 (commit `dde1328`, promoted from Preview `dpl_9HgzJNtZ…`). The first promotion failed with `git_info_fail` without touching live; the retry succeeded. Rollback target: `dpl_EuZnhizE…` | 12 Oct |
| Release 9 compared with the previous live site (production data, before promotion) | 314/314 sitemap URLs identical in status, title, description, robots, canonical and og:url; 20 key-page screenshots differ by 0.000–0.094 % of pixels | 12 Oct |
| After promotion | 314/314 sitemap URLs answer 200; `verify-production.mjs` 27 passed / 9 failed, unchanged (known Enrollment issues) | 12 Oct |
| Content API (`verify-content-api-live.mjs`) | **16/16 PRODUCTION.** Unsigned, wrong-secret and stale requests refused (401); signed request accepted. Main-only publishing of a disposable noindex page: draft not public → published with its section → noindex → not in the sitemap → edit → the same signed change sent again refused (409) → removed → 404 → 0 rows left | 12 Oct |
| Editor fix on production `/admin/popups` | One click plus typing gives exactly the typed text (Bold no longer toggles). Nothing was saved | 12 Oct |
| Vercel Production variables | `WORDPRESS_CMS_WEBHOOK_SECRET` (Sensitive) and `WORDPRESS_CONTENT_API_ENABLED` set. No other variable was changed | 12 Oct |
| Replay-protection table (migration `202610110001`) | Applied and recorded. RLS on, 0 policies, no access for `anon` or `authenticated`. `db push` was not used | 12 Oct |
| Supabase backups | 8 daily backups completed, latest 11 Oct 18:44 UTC. No point-in-time recovery; storage files are not included | 12 Oct |
| Draft copy never breaks a live page (Main `/admin`, disposable noindex page) | 14/15. The page stayed 200 and unchanged on 10/10 requests; cleanup confirmed (404, 0 rows). The failure was a real sitemap defect, fixed in release 9 | 12 Oct |
| Noindex content today | 0 published pages, 0 blogs, 0 SEO overrides marked noindex | 12 Oct |
| Enrollment plugin | Still 0.4.0 (public readme). Home page answers 200 | 12 Oct |
| Releases 1–4 | Live and verified: 314/314 sitemap URLs answer 200 | 11–12 Oct |
| `tools/verify-production.mjs` after release 4 | 27 passed, 9 failed. All 9 failures are known Enrollment issues: the sitemaps, three redirects, `/contact-us/` and the logo link | 12 Oct |
| Enrollment backup (Hostinger, taken 10 Oct about 09:24–09:29 server time, downloaded 12 Oct) | **Verified** (details in the next table) | 12 Oct |
| WordPress production login | Refused four times with the old password. The owner's new password **worked** at about 15:44 IST (administrator; Site Health 0 critical). It was **refused** at about 15:53 IST, after the session had been signed out, with the credentials file unchanged. The account password was changed in WordPress in between. Not retried | 12 Oct |
| Plugin 0.6.0 install | **Installed and active** (about 16:30 IST, with the owner's dedicated administrator account). The package hash was checked; WordPress reported "Plugin updated successfully" (0.4.0 → 0.6.0) | 12 Oct |
| Enrollment after the install | Only the Acadvizen plugin version changed. Site Health 0 critical; 60/60 pages identical to the baseline; enquiry route intact (POST); Course Enquiries, CF7, MetForm and Elementor active | 12 Oct |
| WordPress → Main connection | **Working (13:57 UTC).** The owner set the `wp-config.php` constants. Settings: "Shared secret: Set"; Main Website → Pages lists 50 Main pages. The "Test connection" button and editor previews need release 10 plus the already-set `WORDPRESS_CMS_API_URL` to be deployed | 12 Oct |
| Main's shared secret | Equals the credentials-file secret (signed read-only request, HTTP 200). This is the authoritative value for `wp-config.php` | 12 Oct |
| Two defects found on production, fixes ready (release 10, not deployed) | (1) WordPress's "Test connection" gets 503 from `/slug-check`. (2) WordPress's preview frames are refused (`frame-ancestors 'none'`; `WORDPRESS_CMS_API_URL` missing). LOCAL with production-like settings: Connected; preview allowed only for WordPress; reading/bridge stays off; 56/56 + 16/16 + 15/15 + 210 unit | 12 Oct |
| Main-only, Enrollment-only, Both publishing from the WordPress admin | **NOT TESTED on production:** needs WordPress access (plugin 0.6.0 and `wp-config.php`). LOCAL 15/15 with the same tool | — |

## Enrollment backup verification (files kept privately in the owner's Downloads folder, outside Git)

The account number in the file names is shortened here, because this repository is public.

| File | Size | Check | Result |
|---|---|---|---|
| `u71…627.20261010092409.tar.gz` (website files) | 2,411,157,890 bytes | Full read of the archive (`tar -tvzf`) | Complete, 95,489 entries. enroll.acadvizen.com: 45,435 entries, 1.47 GB, including `wp-config.php`, `.htaccess`, Elementor, Elementor Pro, themes and 5,033 upload files. Also holds the staging site and the temporary Hostinger domain |
| `u71…627_xDzzw.20261010092409.sql.gz` (**Enrollment database**) | 242,355,723 bytes | `gzip -t`; dump header and trailer; table names only | Valid. MariaDB 11.8.9, 108 `wp_` tables (posts, postmeta, options, users, Elementor), 3,352 insert batches, "Dump completed on 2026-10-10 9:29:14". The Enrollment `wp-config.php` in the files backup names this database |
| `u71…627_od1Hd.…sql.gz` (staging cms.acadvizen.com database) | 343,376,700 bytes | Same | Valid, complete (109 tables) |
| `u71…627_kb4Ph.…sql.gz` (a small WordPress database) | 30,095 bytes | Same | Valid, complete (21 tables) |

No database content was printed or copied; only the table names and the database name were read. The backup predates plugin 0.4.0, which was found installed at 14:52 on 10 Oct. Any Enrollment edits made after 10 Oct 09:24 are not in it.

Rollback readiness, from least to most disruptive:
1. Deactivate the plugin (the Elementor site is unaffected).
2. Re-upload plugin 0.4.0 (`dist/acadvizen-cms-0.4.0-a795fb0`, SHA-256 `01d62f3f…`).
3. Instant Rollback of Main to `dpl_EuZnhizE…`.
4. Full Hostinger restore from these files. This is a last resort, done only by the owner, and it would undo Enrollment changes made since 10 Oct.

## LOCAL evidence (release-9 build)

| Suite | Result |
|---|---|
| Unit tests | 197/197 |
| PHP plugin tests / lint | 242/242 / 0 errors |
| TypeScript / ESLint / build | 0 errors / 0 errors / compiled |
| Browser acceptance through the real WordPress admin | 115/115 (pages and blogs 56, site chrome 18, homepage 14, more content 15, courses 12) |
| Live tools, run against LOCAL | Content API 16/16; WordPress publishing (Main only, Enrollment only, Both, cleanup) 15/15 |
| Sitemap, editor and upload smoke tests | 7/7, 6/6, 5/5 |

## Defects found and fixed in this session

| Defect | Where | Status |
|---|---|---|
| Noindex pages and blogs listed in `sitemap.xml` | Main (live code, latent) | Fixed in release 9 |
| Clicking into the rich-text editor toggled Bold and lost the first letter (popups, city builder) | Main `/admin` (live) | Fixed in release 9 |
| 6 high and 27 moderate dependency advisories | Main | 2 high left: `nodemailer` needs a major version; Next.js pins its own `sharp` |
| Test runs left the Enrollment copy of their test blog behind | Test tools | Fixed. The 7 old LOCAL leftovers are removed |
| The live replay check used a read, which is never claimed | New live tool | Fixed. It now replays a change, which is refused with 409 |

## Security (12 October 2026)

Every branch and tag of the repository was scanned, along with every tracked file. Values were compared against the private credentials file and `.env.local`, plus secret patterns. Only names, commits and files were printed.

| Credential | In the current files | In public history | Status |
|---|---|---|---|
| Supabase service-role key | No | Commits `07fb544`, `e0207ee` (3 scripts), on all 17 branches including `main` | **UNRESOLVED.** Full read and write access to Main data, including leads. Not rotated, by the owner's instruction |
| Production database password (project `hhfc…`) | **Removed 12 Oct** (`8535030`): it was in 12 scripts, 6 of them inside connection URLs | Commit `e0207ee` | **UNRESOLVED until it is reset.** Direct database access. Resetting it does not change the API keys and does not affect the websites, which do not use it |
| Main admin password (working account) | No | 4 commits (`5dd9b15` … `e0207ee`) | **UNRESOLVED until it is changed.** Gives access to `www.acadvizen.com/admin` |
| Another admin password (`ADMIN_PASSWORD` in `.env.local`) | No | 3 commits | Change it if that account still exists |
| Supabase anon key | No | 4 commits | Public by design (it is in every page). Not a risk |
| The new content-API shared secret | No | No | Clean. It exists only in the private credentials file and in Vercel (Sensitive) |

**Put in place:**
- `tools/check-secrets.mjs` refuses keys, tokens, private keys, hard-coded passwords and service keys, and environment files. It prints no values.
- `.githooks/pre-commit` (`npm run hooks:install`; installed in this clone) runs the guard on every commit. It refused a commit during setup, so it was seen working.
- `.github/workflows/secret-scan.yml` runs it on every push and pull request. It passed on `8535030`.
- `.env*` files are ignored by Git.

**Not done, and why:**
- **Rewriting history** would need force-pushing every branch, including `main` (forbidden). It would not remove copies already cloned, forked or cached either. The values must be treated as public.
- **Rotating any credential** needs the owner's decision.

## Remaining, with owner

Already done: the Enrollment backup, WordPress access, plugin 0.6.1, `wp-config.php`, Release 10, and the live tests.

1. **Security, the only thing between this CMS and "client-ready":**
   - reset the production database password and the Main admin password (strongly recommended; neither is a Supabase API key);
   - rotate the service-role key (strongly recommended; on hold by the owner's instruction);
   - change the passwords shared in chat, including the WordPress password shared on 12 Oct;
   - the integration account's username is the example name from the docs, so it is guessable: keep its password unique and strong, or replace the account.
2. **Enrollment content:** remove the duplicated "Where Our Learners Build Their Careers" section from the homepage (an Elementor edit made on 12 Oct).
3. **Known Enrollment issues:** the sitemaps, the redirects, `/contact-us/` and the logo link.
4. **Optional:**
   - WordPress and plugin updates (test on staging first);
   - a staging database, so future Previews can be tested with real settings.

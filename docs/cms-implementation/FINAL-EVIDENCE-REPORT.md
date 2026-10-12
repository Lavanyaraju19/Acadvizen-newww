# Final evidence report: Acadvizen central CMS (12 October 2026)

Every result below is labelled by where it ran:
- **PRODUCTION:** the live websites and database.
- **LOCAL:** a copy, using a local WordPress, a local Main build and a local database.

A LOCAL pass is never counted as a live result.

## Verdict

**Main side live and verified on production. NOT client-ready yet.**

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
| WordPress production login | Refused four times, the last on 12 Oct when the owner sent the same password again. Stopped to avoid a lockout | 11–12 Oct |
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

1. ~~Enrollment backup~~: done and verified on 12 Oct.
2. **Set a new WordPress password** for the administrator account and save it in the credentials file (`OWNER-ACTIONS.md` step 2). That is all that blocks:
   - installing plugin 0.6.0;
   - the `wp-config.php` constants (or the owner adds them, step 3);
   - the live Main-only, Enrollment-only and Both tests.
3. ~~Release 9~~: live and verified on 12 Oct.
4. **Security decisions:**
   - reset the production database password and the Main admin password (strongly recommended; neither is a Supabase API key);
   - rotate the service-role key (strongly recommended; on hold by the owner's instruction);
   - change the passwords shared in chat, including the WordPress password just sent.
5. Fix the known Enrollment issues: sitemaps, redirects, `/contact-us/` and the logo link.

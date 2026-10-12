# Final evidence report: Acadvizen central CMS (12 October 2026)

Every result below is labelled by where it ran:
- **PRODUCTION:** the live websites and database.
- **LOCAL:** a copy, using a local WordPress, a local Main build and a local database.

A LOCAL pass is never counted as a live result.

## Verdict

**Implemented, and waiting for specific owner actions. Not yet production-ready.**

The required live tests (Main only, Enrollment only and Both publishing from WordPress) cannot run until all of the following are done:
- plugin 0.6.0 is installed on Enrollment;
- the shared secret is in `wp-config.php`;
- Main is deployed with the content API switched on.

These need the owner (`OWNER-ACTIONS.md` steps 1–4). They are not claimed as done.

**Security is not passed.** A Supabase service-role key is exposed in the public GitHub history, and by the owner's decision it has not been rotated. Anyone who finds it can read and change all Main data, including leads.

## PRODUCTION evidence

| Area | Result | Date |
|---|---|---|
| Live Main deployment | `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (commit `45d78b9`, release 4) | 12 Oct |
| Content API state | 503 `content_api_disabled` (off until the next deployment) | 12 Oct |
| Vercel Production variables | `WORDPRESS_CMS_WEBHOOK_SECRET` (Sensitive) and `WORDPRESS_CONTENT_API_ENABLED` set. No other variable was changed | 12 Oct |
| Replay-protection table (migration `202610110001`) | Applied and recorded. RLS on, 0 policies, no access for `anon` or `authenticated`. `db push` was not used | 12 Oct |
| Supabase backups | 8 daily backups completed, latest 11 Oct 18:44 UTC. No point-in-time recovery; storage files are not included | 12 Oct |
| Draft copy never breaks a live page (Main `/admin`, disposable noindex page) | 14/15. The page stayed 200 and unchanged on 10/10 requests; cleanup confirmed (404, 0 rows). The failure was a real sitemap defect, fixed in release 9 | 12 Oct |
| Noindex content today | 0 published pages, 0 blogs, 0 SEO overrides marked noindex | 12 Oct |
| Enrollment plugin | Still 0.4.0 (public readme). Home page answers 200 | 12 Oct |
| Releases 1–4 | Live and verified: 314/314 sitemap URLs answer 200 | 11–12 Oct |
| `tools/verify-production.mjs` after release 4 | 27 passed, 9 failed. All 9 failures are known Enrollment issues: the sitemaps, three redirects, `/contact-us/` and the logo link | 12 Oct |
| Enrollment backup (Hostinger, taken 10 Oct about 09:24–09:29 server time, downloaded 12 Oct) | **Verified** (details in the next table) | 12 Oct |
| WordPress production login | Refused three times. Not retried | 11–12 Oct |

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

## Remaining, with owner

1. ~~Enrollment backup~~: done and verified on 12 Oct.
2. WordPress access, or the owner uploads plugin 0.6.0 (2).
3. The `wp-config.php` constants (3).
4. Commit, push and Promote release 9 (4). Then the engineer runs the live tools and the production acceptance, and reports PRODUCTION results.
5. Strongly recommended:
   - rotate the exposed Supabase service-role key;
   - change the passwords shared in chat;
   - fix the known Enrollment issues (sitemaps, redirects, `/contact-us/`, logo link).

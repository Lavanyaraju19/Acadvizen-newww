# Client handover: Acadvizen central CMS (12 October 2026)

## Where things stand, in plain language

**Built and tested, on a copy of both websites:**
- One WordPress admin edits the Main website's existing content: pages, the homepage, courses, blogs, tools, city and service pages, header, footer, menus, images and SEO. Main keeps its own design, because WordPress changes the content and Main draws it exactly as before.
- Blogs can go to the Main website, the Enrollment website, or both.
- Every change can be previewed first and undone afterwards.
- All of this is tested on a local copy. Every area has a browser test that works through the admin like a person would (`TEST-RESULTS.md`).

**Already improved on the live Main website (four releases on 11–12 October):**
- A page no longer disappears while someone prepares changes to it.
- The website runs a patched Next.js version, which closes a critical security advisory.
- Menu links can no longer multiply.
- Editing a draft no longer disturbs the live page's address or SEO.
- The Main website already has the part that receives changes from WordPress, switched off until the steps below. An unpublished test tool page is now correctly hidden.

**Not live yet:**
- The new WordPress screens: the Enrollment website runs plugin 0.4.0; the new screens are in 0.6.0.
- The connection between the two websites.

These need things only the owner can give (below).

**Security warning:** a Main database master key is visible in the public GitHub history. The owner decided not to change it for now. Until it is changed, anyone who finds it can read and change the Main website's data. Changing it is strongly recommended (`PRODUCTION-READINESS-AUDIT.md`).

**The exact owner steps are in `OWNER-ACTIONS.md`. Every result, labelled PRODUCTION or LOCAL, is in `FINAL-EVIDENCE-REPORT.md`.** The Vercel side of the connection was set on 12 October; it switches on with the next deployment.

**Overall status (12 October): implemented, and waiting for specific owner actions.** It is not ready for daily use from WordPress yet. Three things are needed:
- WordPress access, or a plugin upload by the owner (step 4);
- the shared secret on Vercel plus a redeploy, and in `wp-config.php` (step 6);
- ~~an Enrollment backup~~: **verified 12 Oct**. The files and database backups of 10 Oct are complete and valid, and kept privately outside Git.

Three local fixes are also waiting for the owner's commit and deploy (`PRODUCTION-RELEASE-AND-ROLLBACK.md`, release 9).

## How to use it (once connected)

Step-by-step guide for editors: `ADMIN-USER-GUIDE.md`. It covers:
- finding and editing an existing page, safely, through a private copy;
- previewing on desktop, tablet and mobile;
- the homepage, courses, city and service pages;
- header, footer and menus;
- images (the Main library);
- SEO overrides;
- blog authors and categories;
- choosing Main, Enrollment or Both;
- checking that a change is live;
- restoring an earlier version;
- what to do when something fails.

## What you need to do, in order

| # | Action | Who | Time |
|---|---|---|---|
| 1 | Strongly recommended: rotate the Supabase key that is in the public GitHub history (Supabase → Project Settings → API), then update it in Vercel and redeploy | Owner | 30 min |
| 2 | Back up **enroll.acadvizen.com** (files and database): hPanel → Websites → enroll.acadvizen.com → Backups. Keep the downloaded files private, outside the project folder. Supabase daily backups: **confirmed** (8 completed, latest 11 Oct; point-in-time recovery off) | Owner | 20 min |
| 3 | ~~Run migration `202610110001`~~ **Done 12 Oct** and verified (no public access) | — | — |
| 4 | WordPress access. Either: (a) while signed in to WordPress, create a dedicated Administrator user for the integration, or set a new password on your profile, and put it in `C:\Users\HP\.acadvizen-production.env` as `WP_PROD_USER` / `WP_PROD_PASS` (never in chat); or (b) install the plugin yourself: Plugins → Add New → Upload Plugin → the ZIP below → **Replace current with uploaded**. The account's email address should also be changed to one you can read, so the password can be reset | Owner | 5–10 min |
| 5 | ~~Main admin login~~ **Done:** the operations admin account works | — | — |
| 6 | Plugin 0.6.0 (`dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`, 24 files, byte-identical to commit `45d78b9`). Then connect the sites. The secret and the two Vercel variables are already set; what remains is two lines in `wp-config.php` and the release-9 deployment. Exact steps: `OWNER-ACTIONS.md`, steps 3–4. The Main side is already live | Owner (Vercel redeploy, wp-config) + engineer | 30 min |
| 7 | Production acceptance on "CMS PRODUCTION TEST" content, with screenshots, then deleted (`TEST-PLAN.md`) | Engineer | 2–3 h |
| 8 | When you start editing: click **Copy the links shown today** (Menus) and **Copy what the homepage shows today** (Homepage, Lists). The website looks the same afterwards | Editor | 2 min |
| 9 | Enrollment fixes: sitemaps, three redirects, `/contact-us/`, the logo link (`../ACADVIZEN_CLIENT_HANDOVER.md` §10) | Owner or engineer | 30 min |
| 10 | Change every password that was shared in chat during the project: Hostinger, WordPress, FTP, Vercel token | Each account owner | — |

## Acceptance matrix

| Area | Built | Tested (LOCAL) | Live |
|---|---|---|---|
| Existing Main pages (private draft copy, preview, publish, restore) | Yes | PASS | Not installed |
| Homepage (banner, call to action, lists) | Yes | PASS | Not installed |
| Courses and course sections | Yes | PASS | Not installed |
| Blogs, authors, categories, tags; Main / Enrollment / Both | Yes | PASS (blogs, targets); authors and categories tested by unit tests | Not installed |
| Tools, locations, cities, testimonials | Yes | PASS | Not installed |
| City and service pages, with sections | Yes | PASS | Not installed |
| Header, footer, menus, site labels | Yes | PASS | Not installed |
| Media library (upload, pick) | Yes | PASS | Not installed |
| SEO fields and SEO overrides | Yes | PASS | Not installed |
| Permissions (Author, Contributor, Editor) | Yes | PASS | Not installed |
| Security (signatures, replay, forged status, preview links) | Yes | PASS | The plugin API's refusals are verified live (13/13) |
| Draft never breaks a live page | Yes | PASS | **Released, and PASS on production** (12 Oct): a live test page stayed 200 and unchanged on 10/10 requests while its draft copy existed; cleaned up |
| Noindex pages left out of the sitemap | Yes (12 Oct) | PASS | **Not released.** Found by the production test; no live page is affected today |
| Next.js security upgrade | Yes | PASS | **Released** |
| Menu duplication, draft address/SEO fixes | Yes | PASS | **Released** |
| Existing enquiry form and leads | Unchanged | — | Route registered; no live test enquiry sent (needs approval) |
| Backups | — | — | Supabase: **confirmed** (daily, no point-in-time recovery). Enrollment (Hostinger): see step 2 |

## Can the client use it today?

**No.** On the live websites the new screens are not installed yet, and the connection is not switched on. Today the client keeps editing:
- Main content in `www.acadvizen.com/admin`;
- Enrollment in WordPress, as before.

Everything is ready for steps 2–7. After them, the client edits both websites from WordPress.

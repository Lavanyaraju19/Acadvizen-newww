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

**Overall status: NOT READY for daily use.** It is ready for the connection steps below.

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
| 2 | Back up **enroll.acadvizen.com** (files and database): hPanel → Websites → enroll.acadvizen.com → Backups. Note the date. Confirm in Supabase → Database → Backups that daily backups exist | Owner | 20 min |
| 3 | In Supabase → SQL Editor, run the file `supabase/migrations/202610110001_wordpress_content_request_ids.sql`. It only adds one table, used to stop repeated requests | Supabase owner | 5 min |
| 4 | Give the engineer a working WordPress administrator account. Put it in the local file `C:\Users\HP\.acadvizen-production.env` as `WP_PROD_USER` and `WP_PROD_PASS`, never in chat. The earlier one was refused | Owner | 5 min |
| 5 | Give a working Main admin login, the same way (`MAIN_ADMIN_EMAIL`, `MAIN_ADMIN_PASSWORD`). The one in the checklist was refused | Owner | 5 min |
| 6 | The engineer installs plugin 0.6.0 (`dist/acadvizen-cms-0.6.0-45d78b9/acadvizen-cms.zip`, SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`, 24 files, byte-identical to commit `45d78b9`), sets the secret code in `wp-config.php` and Vercel, and switches the connection on. The Main side is already live | Engineer (needs 2–5) | 1 h |
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
| Draft never breaks a live page | Yes | PASS | **Released**; all live pages answer 200 |
| Next.js security upgrade | Yes | PASS | **Released** |
| Menu duplication, draft address/SEO fixes | Yes | PASS | **Released** |
| Existing enquiry form and leads | Unchanged | — | Route registered; no live test enquiry sent (needs approval) |
| Backups | — | — | **Not confirmed** (owner, step 2) |

## Can the client use it today?

**No.** On the live websites the new screens are not installed yet, and the connection is not switched on. Today the client keeps editing:
- Main content in `www.acadvizen.com/admin`;
- Enrollment in WordPress, as before.

Everything is ready for steps 2–7. After them, the client edits both websites from WordPress.

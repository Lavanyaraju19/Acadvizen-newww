# Client handover: Acadvizen central CMS (12 October 2026, updated 18:40 UTC)

## Status today

**The CMS works on the live websites, but it is NOT CLIENT-READY**, because of one critical security item the owner must resolve (below). Nothing else blocks client use.

| | Live today |
|---|---|
| Main website | Release 10: deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`, commit `80134d4`, live since 12 Oct 2026 16:04 UTC |
| Enrollment WordPress | Acadvizen Master Admin **0.6.1** (12 Oct 2026 18:16 UTC), connected: "Test connection" says **Connected** |
| Proven on the live sites, through the real WordPress admin | Create, save as draft (private), preview in Main's design, publish, change a live page privately and publish the change, refuse an address already in use, unpublish, delete. Blogs to **Main only**, **Enrollment only** and **Both**, including later edits. All test content removed from both sites |
| Unchanged | All 314 Main addresses (titles, descriptions, robots, canonicals), all 60 Enrollment pages and their Elementor layouts, the enquiry endpoint, Main's own `/admin` |
| Evidence | `FINAL-EVIDENCE-REPORT.md`, `TEST-RESULTS.md` (R10), screenshots in `evidence/production-r10/` |

**Critical, owner:** production credentials (the database master key, the database password and the Main admin password) can be read in old public GitHub commits. Change them (`OWNER-ACTIONS.md`, top section). The database password and the admin password can be changed without affecting the websites.

### How WordPress and the Main website work together

When you edit Main content in WordPress (**Acadvizen Master Admin → Main Website**), WordPress sends the change to the Main website over a signed, secret-protected connection. The Main website stores it and shows it in its own design within about a minute. WordPress never changes Main's design, and Main never changes Enrollment.

Blogs can also be copied to the Enrollment website, where they appear as normal WordPress posts in the Enrollment design. Enrollment pages themselves are still edited as before, in **Pages** with Elementor.

### Client administrator checklist

1. Sign in at `https://enroll.acadvizen.com/wp-admin/` with your own administrator account.
2. Go to **Acadvizen Master Admin → Settings** and press **Test connection**. It must say **Connected**. If not, see "When something fails" below.
3. **Change a live page:** **Main Website → Pages** → **Edit** → **Prepare changes privately** → edit and **Save section** → **Preview** → Status **Published** → **Save**. Visitors see nothing until that last step.
4. **New blog:** **Main Website → Blogs** → **Add new** → title, address, text blocks, image and SEO fields → **Publish To** (Main, Enrollment or Both) → Status **Published** → **Save**. Open the public address to check it.
5. **Hide something:** set Status to **Draft** and **Save**, or use **Trash** (it can be restored from the trash).
6. **Undo a change:** **Earlier versions → Restore** on the edit screen.
7. **If the website looks wrong after a change:** restore the earlier version. If the whole site is affected, ask the owner to roll back the deployment (`PRODUCTION-RELEASE-AND-ROLLBACK.md`, one click in Vercel).
8. **Known limits:**
   - global edits (menus, header, footer, homepage lists) show to every visitor at once: preview first;
   - scheduled publishing has not been tested;
   - the Enrollment admin is slow (about 20 s per Main Website screen).

## Background: how we got here

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
- An unpublished test tool page is now correctly hidden.
- **Release 9 (12 October), live and checked on production:**
  - the Main website now **receives changes from WordPress**, through a signed connection (16/16 live checks);
  - noindex pages stay out of the sitemap;
  - the text editor no longer toggles bold on click;
  - security updates.

**Installed 12 October:** plugin **0.6.0** on the Enrollment website, with the site preserved (all 60 pages identical, enquiry route intact).

**Connected 12 October:** WordPress → Main works on production; the Main Website screens list the live Main pages. The "Test connection" button and the editor's preview frames start working with release 10 (awaiting the owner's approval). The live publishing tests (Main only, Enrollment only, Both) have not run yet.

**Security warning (not passed):** old commits in the public GitHub history contain:
- the Supabase service-role key;
- the production database password;
- the working Main admin password.

They are no longer in the current files, and a guard now blocks new ones. But the old values stay readable until each one is changed. The owner decided not to rotate the Supabase key for now. The other two can be reset without affecting the websites (`FINAL-EVIDENCE-REPORT.md`, "Security").

**The exact owner steps are in `OWNER-ACTIONS.md`. Every result, labelled PRODUCTION or LOCAL, is in `FINAL-EVIDENCE-REPORT.md`.**

**Earlier status (12 October, before Release 10):** the Main side was live and verified, and a working WordPress password was the remaining blocker. That has since been resolved (see "Status today").

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

## Quick guide for the client (plain language)

Everything below is done in the Enrollment WordPress admin. Routine content work does **not** need the Main website's separate `/admin` dashboard. That dashboard is only for leads, enquiries, students and users.

1. **Sign in.**
   - Go to `https://enroll.acadvizen.com/wp-admin/` and sign in with your own WordPress account.
   - **Lost access?** Use **Lost your password?** on the sign-in page. That only works if the account's email address is one you can read, so keep it up to date. Otherwise, the person who holds the Hostinger account opens hPanel → Websites → enroll.acadvizen.com → **WP Admin** (it signs in without a password) → **Users** → your account → **Set New Password**.
2. **Edit the Main website.** Go to **Acadvizen Master Admin → Main Website** and pick a tab:
   - Pages, Blogs, Courses, Homepage, Header and footer, Menus, City and service pages, Media library or SEO;
   - then **Filter**, then **Edit**.

   **Edit the Enrollment website** as before, in **Pages** with Elementor.
3. **Choose where a blog appears.** Set **Publish To**: **Main Website**, **Enrollment Website** or **Both Websites**, then **Save**. With Both, each website shows it in its own design.
4. **Preview and publish safely.**
   1. On a live page, click **Prepare changes privately**. Visitors keep seeing the live page.
   2. Edit, then click **Preview (desktop, tablet, mobile)**.
   3. When it's right, set **Status** to **Published** and **Save**.

   Nothing reaches visitors before that last step.
5. **SEO.**
   - Each page and blog has an SEO title, description and **noindex** ("hide from search engines"). A noindex page is also left out of the sitemap.
   - The **SEO** tab overrides these for any address.
6. **When something fails.**
   - A red message at the top says what went wrong, for example that the address is already used, a link is broken, or the Main website couldn't be reached. The live website keeps the previous version.
   - **Retrying is safe:** press **Save** again. The same change is never applied twice, and a second page with the same address is refused, so retries never create duplicates.
   - For a page with a publish problem, **Publishing** shows the reason and a **Retry** button.
7. **Undo and remove.**
   - **Earlier versions → Restore** brings back any of the last 20 saves.
   - **Trash** takes something off the website at once. **Restore** in the trash brings it back as a draft.
8. **Who to contact.** The website administrator, who is the owner of the Hostinger, Vercel and Supabase accounts, for access problems or anything this guide doesn't cover. The full editor guide is `ADMIN-USER-GUIDE.md`.

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

**Technically yes, from 12 October.** Main content can be edited from the Enrollment WordPress admin, and Enrollment as before. This was proven on the live websites. Main's own `/admin` is still there for leads, enquiries, students and users.

**Formally, not yet:** the project stays NOT CLIENT-READY until the owner changes the credentials exposed in public GitHub history (`OWNER-ACTIONS.md`).

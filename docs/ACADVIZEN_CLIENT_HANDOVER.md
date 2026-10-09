# Acadvizen websites — handover report

Status on 9 October 2026: **NOT COMPLETE.**

- **Done:** the Main website fixes are live and verified.
- **Pending:**
  - connecting the central WordPress editor (the Master CMS) to the production websites;
  - the live publishing tests that follow it.
- **Waiting on:** owner access to the hosting account (hPanel), the production WordPress admin and the Main admin.

Section 12 lists exactly what remains.

Every result below is labelled by where it was observed:
- **PRODUCTION**: the live websites;
- **STAGING**: the test copy at `cms.acadvizen.com` and its preview Main website;
- **LOCAL**: tests on the development machine.

Staging and local results support the work; they are not proof that production works.

---

## 1. Summary for the client

Acadvizen runs two public websites:
- **Main**, `https://acadvizen.com` (the website, course pages, blog, tools, student login and the Main admin);
- **Enrollment**, `https://enroll.acadvizen.com` (the enrolment and enquiry website).

This project adds one central editor, the **Master CMS** at `https://cms.acadvizen.com/wp-admin/`. The team will edit the public pages of both websites there with WordPress and Elementor, and publish each page to Main, to Enrollment, or to both.

**Live today:**
- The Main website's page titles no longer repeat "| Acadvizen" twice.
- The `/contact` form now sends every enquiry to Admin → Leads. Before, it discarded them.
- Main's sitemap lists only working addresses.
- Every part of the central editor has been built and tested on the staging copy.

**Still to do:** the editor is not yet connected to the live websites. That step needs access to the hosting account and the live WordPress admin, which only the owner holds (section 12).

## 2. Architecture and publishing behaviour

| Part | Address | What it is |
|---|---|---|
| Master CMS | `https://cms.acadvizen.com/wp-admin/` | WordPress + Elementor admin, served by the Enrollment WordPress installation under a second address (not a third public website). Search engines are told not to index it. |
| Main | `https://acadvizen.com` (served at `https://www.acadvizen.com`) | Next.js on Vercel. Its own `/admin` keeps leads, users, courses and other application data. |
| Enrollment | `https://enroll.acadvizen.com` | WordPress + Elementor (unchanged public site and enquiry API `POST /wp-json/acadvizen/v1/enquiry`). |

**Publishing.** Every page in the CMS has a **Publish To** choice:

| Choice | Effect |
|---|---|
| Main | WordPress renders the page and Main serves it at its address. It is not shown on Enrollment. |
| Enrollment | Enrollment shows it as a normal WordPress page; Main does not. |
| Both | Both websites show it. |

**Versions.**
- Each page keeps its last 5 published versions.
- A failed render never replaces the live version.
- An older save can never overwrite a newer one.
- "Make live" on an earlier version is an explicit rollback, and the next edit replaces it.

The full technical guide is `docs/ACADVIZEN_MASTER_ADMIN.md`.

## 3. Deployment

| Item | Value | Evidence |
|---|---|---|
| Repository and branch | `github.com/Lavanyaraju19/Acadvizen-newww`, `headless-wordpress` | `git fetch`: local equals `origin/headless-wordpress` |
| Commits released 9 Oct | `f42d9cc` (CMS integration, off by default), `cc1b51f` (sitemap), `af233d1` (contact form message) | Git |
| Main production deployment | `dpl_F9QmBR5vWeHyEwWvxF9kyvqFb8N2`, commit `af233d1`, READY | Vercel API (PRODUCTION) |
| WordPress integration on Main | **Off**: no `WORDPRESS_*` variables in Vercel | Vercel API (PRODUCTION) |
| Previous deployment (rollback) | `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD`, commit `a8cc4d5`, READY | Vercel API (PRODUCTION) |
| Plugin on production Enrollment | Not installed | `/wp-json/` lists no `acadvizen-cms/v1` (PRODUCTION) |
| `cms.acadvizen.com` | Still serves the **staging** copy | Login page and STAGING banner (PRODUCTION DNS, same server as Enrollment) |

## 4. Live verification (PRODUCTION, 9 October 2026)

Command: `node tools/verify-production.mjs` (read-only; nothing is submitted). Result: **26 passed, 10 failed, 4 informational**. The informational checks are CMS checks that apply after the cutover.

| Check | Result |
|---|---|
| `acadvizen.com` redirects to `www.acadvizen.com` (308) | PASS |
| Main sitemap: 316 URLs, every one answers 200 | PASS |
| Doubled "\| Acadvizen" titles | PASS: 0 of 316 (313 of 318 before) |
| Canonical tag on every page, on the www address; no sitemap page is noindex | PASS |
| No staging addresses in any page | PASS |
| `/`, `/about`, `/contact`, `/blog`, `/tools`, `/courses`, `/login`, `/admin`, `/robots.txt` | PASS (200) |
| Main logo links to the homepage | PASS |
| Meta pixel loads on the live site | PASS (browser check with tracking blocked) |
| Contact form behaviour (sends blocked, nothing stored) | PASS: posts to `/api/cms/leads` with form type `contact`; one request even with a double click; readable message on network failure or a request that takes over 20 seconds; the typed details stay |
| Contact form **stores** the enquiry in Admin → Leads | **NOT VERIFIED**: needs one approved test enquiry |
| "Local E2E" test course and tool no longer public | **FAIL**: both pages answer 200 and appear on 19 pages |
| Enrollment standard sitemaps (`/sitemap_index.xml`, page, post) | PASS (200 XML; was 404 on 8 October) |
| Enrollment sitemap excludes page-builder internals and test content | **FAIL**: lists header/footer templates, popups, forms, mega-menu items, `/test/`, `/3570-2/` |
| Enrollment redirects for 3 renamed pages | **FAIL**: all 3 answer 404; `/about-us/` passes (301) |
| Enrollment footer "Apply Now" button | **FAIL**: links to `/contact-us/` (404) |
| Enrollment logo links to `https://acadvizen.com/` | **FAIL**: links to Enrollment |
| Enrollment enquiry API `POST /acadvizen/v1/enquiry` registered | PASS |

## 5. Publishing test matrix

| Test | PRODUCTION | STAGING (9 Oct, test page created and deleted) |
|---|---|---|
| Publish to Main: shown on Main, not on Enrollment | NOT RUN (CMS not connected) | PASS (28–34 s) |
| Publish to Enrollment: shown on Enrollment, removed from Main | NOT RUN | PASS (2 s; Main removed in 6 s) |
| Publish to Both | NOT RUN | PASS (Main 70 s, Enrollment at once) |
| Back to Main only: removed from Enrollment | NOT RUN | PASS (1 s) |
| A then B: B replaces A | NOT RUN | PASS (4–11 s) |
| Two quick saves: newest wins, older never returns | NOT RUN | PASS (0 of 12 checks over 60 s) |
| Explicit rollback, and it holds | NOT RUN | PASS (4 s) |
| New publish after rollback supersedes it | NOT RUN | PASS |
| Trash: gone from both sites and the sitemap | NOT RUN | PASS |
| Lead forms, popup, security probes, enquiry API | — | PASS (72/72, 9/9, 37/37, contract unchanged) |

## 6. Backups and restore

| Item | Status |
|---|---|
| Main deployment rollback | READY: `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD` (and `dpl_4NXtehzFEQ2NLKG6vZXzVqJpk7ba`) can be promoted in Vercel. The 9 October commits change no database schema. |
| Enrollment database and files backup | **NOT VERIFIED** (needs hPanel) |
| Supabase backup / point-in-time recovery | **NOT VERIFIED** (needs the Supabase dashboard) |
| Restore test | **NOT RUN** |

## 7. Database size and capacity

The production Enrollment database size is **unknown**: it can only be read in hPanel. The hosting limit is 3 GB.

The staging copy measured 2.39 GB, most of it old revisions. That figure is staging, not production. The migration adds roughly 0.3–0.4 GB.

No import runs until the production size and a backup are confirmed.

## 8. Security

- **Configuration:** the integration is **off** on production. Main reads no WordPress settings until it is enabled.
- **Secrets in Git:** no real environment file is tracked. `.env.example` and `.env.example_tmp` hold placeholders only. A scan of all 86 released files against the known secret values found none.
- **Staging and production are kept apart:**
  - production Vercel variables hold only the Supabase and app settings;
  - staging sends no requests to production Main (0 in its isolation log);
  - staging fires no production tracking;
  - staging is not indexed.
- **Plugin safeguards (tested on STAGING, 37/37):**
  - signed webhooks with replay protection;
  - forged headers ignored;
  - the render route unreachable directly;
  - address allowlists, and request size and rate limits.
- **Credential rotation:** **owner action.** Rotate the credentials shared in chat during the project:
  - the staging WordPress admin password (`cms.acadvizen.com` → Users → Profile);
  - the staging FTP password (hPanel → Files → FTP Accounts);
  - the staging webhook secret (`wp-config.php` and the staging preview);
  - the Vercel access token (Vercel → Account Settings → Tokens: create a new one, delete the old).
  
  Also rotate any Supabase or Main admin credential that was ever pasted.

## 9. Rollback procedure

1. **Main:** Vercel → project `acadvizen-newww-ua9d` → Deployments → `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD` (`a8cc4d5`) → ⋯ → **Promote to Production**. After the CMS is connected, removing `WORDPRESS_CONTENT_ENABLED` and redeploying also returns every page to Next.js.
2. **WordPress:** Master Admin → Import → Undo removes imported records. Deactivating the plugin returns Enrollment to its previous state.
3. **CMS address:** remove `cms.acadvizen.com` from the Enrollment website in hPanel and the two `ACADVIZEN_CMS_*_URL` constants from `wp-config.php`.
4. **Database:** restore the hPanel backup.

A rollback has **not** been exercised on production. Promoting a previous deployment is Vercel's standard one-step operation; it was not run because the live site works.

## 10. Test cleanup

- STAGING: 0 test items remain. The test enquiries and test pages were removed and the listing re-checked.
- PRODUCTION: no test content was created.

## 11. Known pre-existing issues (not caused by this project)

- **Enrollment `/my-account/`, `/cart/`, `/checkout/` answer 404.**
  - WooCommerce is installed but has 0 products, and `/shop/` shows "no products found".
  - No page links to these addresses, and enrolment works through enquiry forms.
  - Impact: none on visitors today. Decide whether WooCommerce is needed.
- **Main "Related Blogs" is empty** on the article checked (`/blog/career-in-digital-marketing-2026`): the heading shows with no posts. The WordPress version, once connected, shows 3 related posts.
- **Enrollment's WordPress Address uses `http://`.** Browsers upgrade the requests to https (the site sends `upgrade-insecure-requests`). Change it to `https://` after the backup.

## 12. Remaining owner actions (in order)

| # | Action | Where | Unlocks |
|---|---|---|---|
| 1 | Approve **one** labelled test enquiry (`ACV TEST — delete me`, fictional data), or submit it yourself | Reply in chat, or `https://www.acadvizen.com/contact` | Proof that enquiries are stored in Admin → Leads; the test record is then deleted |
| 2 | Unpublish "Local E2E Course" and "Local E2E Tool" | `https://www.acadvizen.com/admin` → Courses / Tools | Removes test data from 19 public pages and the sitemap |
| 3 | Enrollment fixes (section 13) | `https://enroll.acadvizen.com/wp-admin/` | Clean sitemap, working redirects, footer button and logo |
| 4 | Back up Enrollment's files and database; read the database size; confirm the Supabase backup | hPanel → Websites → enroll → Backups / Databases; Supabase → Database → Backups | Safe import and cutover |
| 5 | Move staging off `cms.acadvizen.com` and attach that address to the Enrollment website | hPanel → Websites → Domains | The CMS address points at production |
| 6 | Upload the plugin and must-use plugin, add the four `wp-config.php` constants, activate; add the every-minute cron | hPanel → File Manager and Advanced → Cron Jobs (guide §11, Phase B) | The production CMS |
| 7 | Add `WORDPRESS_CMS_API_URL` and `WORDPRESS_CMS_WEBHOOK_SECRET` in Vercel production | Vercel → Settings → Environment Variables | Then the integration can be switched on, redeployed and tested |
| 8 | Rotate the credentials listed in section 8 | Each account | Security |

After steps 4–7, the remaining work can be completed with the access already granted:
- enable the integration and redeploy;
- run the publishing matrix on production with a temporary test page, then delete it;
- import the content and re-verify.

## 13. Enrollment fixes (exact values)

- **Rank Math → Sitemap Settings → Post Types:** turn off Header Footer templates, PopupKit campaigns, MetForm forms and WPR mega menu.
- **Rank Math → Redirections → Add New** (301 Permanent):
  - `/contact-us/` → `/digital-marketing-course-enquiry/`;
  - `/advanced-digital-marketing-course-in-mangalore/` → `/ai-integrated-digital-marketing-course-in-mangalore/`;
  - `/social-media-influencer-marketing/` → `/learn-digital-marketing/`.
  
  Each destination is the page that took over that address, matched by WordPress page ID.
- **Templates → Theme Builder → Footer #1799:** both "Apply Now" buttons → `https://enroll.acadvizen.com/digital-marketing-course-enquiry/`.
- **Pages:** "Test" (`/test/`) → Draft. **Posts:** the untitled post `/3570-2/` → Draft.
- **Header #960 → Site Logo → Link:** `https://acadvizen.com/`. Set the logo image's alternative text to "Acadvizen".
- **Check:** `node tools/verify-production.mjs`. The Enrollment checks should pass.

## 14. How to re-verify at any time

```
node tools/verify-production.mjs            # read-only checks of all three addresses
node tools/verify-production.mjs --cutover  # after the CMS is connected: CMS checks must pass too
```

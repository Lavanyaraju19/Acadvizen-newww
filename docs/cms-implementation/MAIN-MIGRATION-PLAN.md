# Moving the Main website's pages into WordPress/Elementor: inventory and plan

Status on 13 October 2026: **built and tested LOCAL only. Nothing has been migrated on production.** Every production step below needs the owner's written go-ahead.

## 1. The chosen architecture, and why

The brief asks for one WordPress/Elementor admin for both websites, with the real Elementor editor and broad design freedom, and prefers moving Main into WordPress/Elementor.

Implemented as **Main drawn by WordPress, served by Main** (the "Render Bridge"):

- **Pages are designed in Elementor** in the central admin (`enroll.acadvizen.com/wp-admin`). Each one has **Publish To**: Main, Enrollment or Both.
- **WordPress draws each Main page** with the same Elementor that draws Enrollment pages. The Main website (Next.js on Vercel) serves the approved, drawn page at its Main address.
- **One page at a time can take over a Main address.** The rest of Main keeps working as it does today.
- **Main keeps what only Main can do:** the domain, application routes, the student and admin areas, the Supabase data, enquiry handling and SEO routes.

Rejected alternative: pointing www.acadvizen.com at WordPress (a DNS move).

| | Render Bridge (chosen) | Move the domain to WordPress |
|---|---|---|
| Admin, student, login and API features | Kept as they are | Lost, or rebuilt in WordPress |
| Programmatic city pages, tools, data-driven lists | Kept | Rebuilt |
| Rollback | Per page, by unpublishing in WordPress. Whole switch: one Vercel setting | DNS rollback (hours, with caching) |
| Risk to the 314 live Main addresses | Only the pages moved, one at a time | All at once |

Rendering is never reimplemented. Main shows the HTML Elementor produced, so any widget that works on Enrollment draws the same way on Main. What can differ is behaviour after the page loads, such as forms, carts and logins. The compatibility registry (`WIDGET-COMPATIBILITY.md`) checks that before approval.

## 2. Inventory of Main addresses, and where each one goes

Source: production inventory, 10 October 2026 (read-only: `evidence/inventory-main-production.json`; Main routes in `app/(public)`).

| Main addresses | Count | Today | Goes to | Notes |
|---|---|---|---|---|
| `/` homepage | 1 | Next.js page from `homepage_settings` and home sections | **Elementor page**, marked as the Main homepage (it always replaces) | Dynamic lists (courses, tools, testimonials) become Elementor content or the plugin's data widgets/shortcodes. Lead popup: the plugin's `[acv_lead_form]` |
| Marketing pages: about, achievements, contact, hire-from-us, explore-programs, soft-skills, projects, testimonials, privacy-policy, terms-of-service | 10 | Dedicated Next.js routes | **Elementor pages** with "Replace an existing Main page" | Forms: `[acv_lead_form]`, Elementor Pro Form or MetForm (submissions forwarded by Main to WordPress) |
| Course landing pages: ai-digital-marketing-course, digital-marketing-course-in-bangalore, -in-jayanagar, digital-marketing-internship-in-bangalore, google-ads-, seo-, social-media-marketing-course-in-bangalore | 7 | Dedicated Next.js routes | **Elementor pages** (replace) | Course-module accordions are converted (`tools/main-to-elementor/README.md`) |
| Page Builder pages in Supabase `pages` | 140 (134 published) | `app/(public)/[slug]` and the shared location layout | **Elementor pages**, or Locations sharing one design | Bundle builder decides per page. Dry run: 134 published pages to import |
| Blogs `/blog/<slug>` and blog lists | 88 (86 published) | Supabase `blogs` | **WordPress blog posts** (`acv_blog`), drawn by Elementor templates | The current live structured connection already edits blogs from WordPress |
| Tools `/tools/<slug>` | 68 (67 active) | Supabase `tools_extended` | **WordPress tools** (`acv_tool`) with one shared Elementor design | |
| Courses `/courses/<slug>`, `/courses` | 2 + list | Supabase `courses` | **Stay Main** for now (structured editing from WordPress already live) | Course pages hold pricing, enquiry and data the Main admin uses |
| Programmatic city pages `/digital-marketing-course-<city>` | Generated | `app/(public)/[slug]` | **Stay Main** | Generated from data: one design for any number of addresses |
| Companies, internships, placement, resources (lists and details) | 0 rows today | Supabase | **Stay Main**; move when they have content | Empty in production |
| Admin, login, register, forgot-password, dashboard, admin-dashboard, maintenance, preview, sales, api | — | Next.js application | **Never replaceable** (`NEVER_REPLACEABLE_SEGMENTS`) | Enforced in `lib/wordpress/bridgeRouting.js` |
| Leads, students, users, LMS, notifications | — | Main `/admin` and Supabase | **Stay Main** | Not website content |

**Main features that need work, or a decision, before their pages move**

| Feature | What is needed | State |
|---|---|---|
| Lead and enquiry forms | `[acv_lead_form]` sends to Main's enquiry flow; Elementor/MetForm/CF7 forms are forwarded by Main to WordPress | Built. Shortcode output covered by PHP tests and forwarding by unit tests. **No browser submission on a bridged Main page yet** (O-24): test the first moved page's form before moving the rest |
| Main header, footer and menu | Imported as Elementor header/footer templates and a WordPress menu (`--only shell`) | Built in an earlier phase; not re-run in this phase |
| Global colours and fonts | Imported into the Elementor kit (Site Settings). Changing them is reviewer-only | Import built in an earlier phase. Reviewer-only saving: LOCAL (A12) |
| Course finder, location explorer, learner map | Stay Main (data-driven). Embed them on an Elementor page only through a reviewed widget | Not built (not needed for the first pages) |
| SEO (title, description, canonical, JSON-LD) | Imported into Rank Math per page; served with the page | Built in an earlier phase; not re-run in this phase |
| Redirects | Main **Redirects** (structured) keep working beside moved pages | Built (0.7.0); LOCAL |

## 3. The migration tool (already in the repository)

- **`tools/main-to-elementor/` builds a bundle from the live Main website.** It only reads:
  - public pages, at 1440, 800 and 390 px;
  - published rows, through the public Supabase key.
  It converts them into native Elementor containers and widgets, keeping each page's address, SEO and media.
- **Acadvizen Master Admin → Import Main Website** loads the bundle. Undo import removes everything the import created.
- **Plugin 0.7.0 with approval on:**
  - every imported page goes in as a draft and is **submitted for approval**;
  - re-importing a page that is already live writes its **working copy**, so the live page stays as it is until a reviewer approves;
  - nothing an import does is visible on either website without a reviewer.
  Verified LOCAL in `approval-acceptance.mjs` A15.

## 4. Production migration runbook (requires authorization at each marked step)

Nothing here has been run on production.

1. **Backups** 🔒
   - Hostinger full backup of enroll.acadvizen.com (files and database), downloaded off-site.
   - Supabase backup or point-in-time marker for `hhfccftkfryesjirauwf`.
   - Record the current Vercel deployment id as the rollback target.
2. **Install plugin 0.7.0** 🔒 over 0.6.1 (Plugins → Add New → Upload, Replace current).
   - Rehearsed: update and rollback were identical (`evidence/o6-update-rehearsal`).
3. **Turn on approval** 🔒: `define( 'ACADVIZEN_CMS_APPROVAL', true );` in wp-config.php.
   - Do this before anything is imported or bridged, so from the first page nothing goes live without a reviewer.
4. **Create reviewer accounts** 🔒: role **Reviewer (approves publishing)**, or an Administrator.
5. **Import the shell and tools bundle** 🔒 (header, footer, menu, kit, tools). With approval on, everything waits in **Approvals**.
6. **Turn on the Render Bridge on WordPress** 🔒: `define( 'ACADVIZEN_CMS_RENDER_BRIDGE', true );`.
   - This only shows the native editors and boxes; Main is still unchanged.
7. **Turn on the Render Bridge on Main** 🔒 (production traffic change):
   - Vercel env `WORDPRESS_CONTENT_ENABLED=true`, then redeploy.
   - Until a page is approved and published to Main, Main serves exactly what it serves today. Only published pages with Publish To = Main or Both take over their addresses.
8. **Move one low-traffic page first** 🔒, for example `/soft-skills`:
   - review it in **Approvals** (desktop, tablet and phone previews);
   - approve and publish;
   - wait for "Verified" on Main;
   - compare with the old page;
   - keep watching for 24 hours.
9. **Move the rest in groups:** marketing pages, then course landing pages, then Page Builder pages, then blogs and tools. Each group gets:
   - its own approval;
   - verification of every address;
   - a full 314-address comparison (`tools/verify-production.mjs`) after the group.
10. **Homepage last** 🔒, after the others have run cleanly for a week.

**Rollback at any step**

| Scope | How |
|---|---|
| One page | **Approvals → Restore** an earlier revision, or set the WordPress page to Draft. Main serves its own page again at the next manifest refresh (seconds) |
| All Main pages | Vercel env `WORDPRESS_CONTENT_ENABLED` off and redeploy, or promote the recorded deployment. Main is back to its own pages |
| Plugin | Reinstall the 0.6.1 package |
| Data | Hostinger and Supabase backups from step 1 |

## 5. What is proven, and what is not

| Claim | Evidence | Where |
|---|---|---|
| Elementor pages drawn by WordPress serve correctly at Main addresses, including global styles, forms and failure handling | `tests/wordpress/scenarios.mjs` 44/44 | LOCAL |
| Approval workflow: real Elementor editor, Main / Enrollment / Both, verification, partial failure, retry, rollback, importer | `tests/wordpress/approval-acceptance.mjs` 47/47 and `approval-reliability-acceptance.mjs` 38/38 (Enrollment/both failing, replay, scheduling) | LOCAL |
| Same layout and responsive sizes at desktop, tablet and phone on both websites | A8 and screenshots in `evidence/approval/` | LOCAL |
| One real Main page moved end to end: `/soft-skills` converted from the local Main build, imported under approval, approved, published over its Main address, compared, taken off line, import undone | `tests/wordpress/migration-acceptance.mjs` 13/13. All 8 content lines, the H1, title, description and canonical identical; no sideways scrolling on a phone; Main serves its own page again ~10 s after unpublishing; Undo import removes the page and the template working copies it made | LOCAL |
| Visual fidelity of that page | First-screen pixel difference 17.9% (desktop) and 31.0% (phone). Same layout, header, menu, cards and floating bar. Differences: the subtitle line is wider and the card blur is missing (both held in element custom CSS, which needs Elementor Pro, absent locally; production has Pro); the header is slightly shorter; the decorative glows are placed differently; the floating bar sits higher, and its "Apply Now" wraps | LOCAL. **Review each moved page in the desktop/tablet/phone preview before approving** |
| Converter output for all Main pages | Production dry run only (`evidence/import-dry-run-production.json`: counts and collisions) | Run page by page during the migration (§4 step 9) |
| Any of this on production | — | **Not done**: no authorization, no staging, no production WordPress login in this engagement |

Elementor Pro is not installed locally. Elementor 4.3.3 lists Pro-style widgets such as Form and Posts, but the Pro Form submission, Theme Builder conditions and popups were checked through their rules and the proxy policy, not exercised end to end.

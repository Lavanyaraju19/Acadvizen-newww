# Feature inventory: one CMS for both websites (13 October 2026)

Every editable feature of the two websites, where it is edited, which website it reaches, and what has been verified.

**Classes:**
- **VERIFIED (PROD)**: implemented and verified end to end on the live websites.
- **LOCAL**: implemented and verified on the full local copy only (no staging exists).
- **PARTIAL**: implemented with a stated limit.
- **MAIN /admin ONLY**: editable today only in Main's own admin; not yet in WordPress.
- **SITE-SPECIFIC**: belongs to one website by design, or is infrastructure; intentionally not synchronised.

**Release states:**
- **live**: Main deployment `dpl_8C59…` + plugin 0.6.1;
- **prepared**: Main release 11 + plugin 0.7.0, local and not deployed.

## How "edit once" works

There is **one copy of each piece of Main content**: the record in Main's database. Both editors change that same record:
- WordPress → Acadvizen Master Admin → **Main Website**;
- Main's own `/admin`.

Nothing is duplicated, so nothing has to be "published twice".

**What 0.7.0 / release 11 add to make two editors safe:**
- **Edit-conflict protection:** a save made on a version that changed meanwhile in the other editor is refused, and nothing is overwritten.
- **Blogs, the one content type that lives on both websites:** a blog is one Main record plus one normal WordPress post. A change made in any of the three editors reaches both websites:
  - Main Website → Blogs;
  - the regular WordPress Posts editor;
  - Main's `/admin`.
- **Per-destination status**, failures shown as failures, and conflicts that never overwrite anything.

## A. Main Website content edited from WordPress (Main Website screens)

| Feature | Main table(s) | Class | Evidence |
|---|---|---|---|
| Pages and their sections (create, private draft copy, preview, publish, unpublish, trash, delete, versions) | `pages`, `sections` | **VERIFIED (PROD)** 17/17 (12 Oct) | AT-20 |
| Blogs, Publish To Main / Enrollment / Both | `blogs` + WordPress post | **VERIFIED (PROD)** 16/16 (12 Oct) | AT-21–23 |
| Blogs edited in the regular WordPress Posts editor, Main's `/admin` and Main Website → Blogs, kept in step; "Also publish on the Main Website" for new posts | `blogs` + WordPress post | **LOCAL** 18/18 (prepared 0.7.0) | `tests/wordpress/blog-sync-acceptance.mjs` |
| Blog article content from the regular editor | `blogs.content_json` | **PARTIAL**: headings, paragraphs with formatting, lists and images reach Main. Tables, embeds, galleries and shortcodes are reported "not shown on the Main Website" and left out; quotes become paragraphs | PHP tests, S3 |
| Edit-conflict protection (two editors, one record) | every type with a version (`updated_at`) | **LOCAL** 9/9 + 6 unit tests (prepared) | `conflict-acceptance.mjs` |
| Redirects (Main's middleware): one per address, no loops or chains, system addresses refused, live pages and blogs never hidden, start switched off, delete only when off and confirmed | `redirects` | **LOCAL** 11/11 + 8 unit tests (prepared) | `redirects-acceptance.mjs` |
| Header, footer, menus, site settings | `header_settings`, `footer_settings`, `menus`, `site_settings` | **LOCAL** 18/18 | AT-26 |
| Homepage banner, call to action, sections, lists (incl. the FAQ and programme lists) | `homepage_hero`, `homepage_cta`, `home_sections` | **LOCAL** 14/14 | AT-27 |
| Courses and course sections | `courses`, `course_details` | **LOCAL** 12/12 | AT-29 |
| City pages, service pages, locations, cities | `city_pages`, `service_pages`, `locations`, `cities` | **LOCAL** 15/15 | AT-28 |
| Tools, testimonials | `tools_extended`, `testimonials` | **LOCAL** (structured suite) | AT-25 |
| Media library (upload, type check, pick) | `media` + storage | **LOCAL** | AT-28 |
| SEO titles, descriptions, canonical, noindex (per record) and SEO overrides (any address) | record fields, `seo_metadata` | **LOCAL**; per-record noindex and canonical also **VERIFIED (PROD)** on pages and blogs | AT-20, AT-28 |
| Blog authors, categories, tags | `authors`, `blog_categories`, `blog_tags` | **LOCAL** | AT-25 |
| Scheduling (publish and remove automatically) | record fields | **LOCAL** 7/7 | AT-31 |
| Roles (Administrator, Editor, Author, Contributor) | WordPress capabilities | **LOCAL** 9/9 + suite | AT-33/34 |
| Partial failure on Both (Main down, Main refuses, Enrollment copy fails, retry without duplicates) | — | **LOCAL** 12/12 + 3/3 (prepared) | `both-failure-acceptance.mjs` |

## B. Main features still edited only in Main's own `/admin`

**MAIN /admin ONLY** today. They are not broken; they are simply not yet in WordPress. Adding one means a content-API definition, a WordPress screen definition, schema checks and tests, as was done for redirects.

| Main `/admin` section | Table | Note |
|---|---|---|
| Banners | `banners` | Device and page targeting (JSON). Candidate for the next step |
| Popups | `popups` | Triggers and targeting (JSON). Candidate |
| Companies, placements, internships | `companies`, `placements`, `internships` | Simple lists. Candidates |
| Resources | `resources` | Downloads linked to courses and tools. Candidate |
| Reusable sections, templates | `reusable_sections` | Main's own section library |
| Course finder, location explorer, learner map, trust / trust-conversion, internal links, landing SEO | various | Main-specific tools |
| Sitemap settings, robots | `sitemap_settings` | Website-wide technical SEO; keep with the developer |
| Legacy homepage tables (`homepage_faq`, `homepage_testimonials`, …) | `homepage_*` | Fallbacks behind the WordPress-edited homepage lists |

## C. Site-specific or infrastructure (intentionally NOT synchronised)

| Feature | Website | Why |
|---|---|---|
| Enrollment pages, Elementor layouts, Elementor templates, global colours and fonts (Elementor kit), Header & Footer Elementor, WordPress menus | Enrollment | Enrollment's own design system, edited with Elementor as before. Main's design lives in its Next.js code. An Elementor design cannot be shown on Main except through the Render Bridge, which is **off** (owner decision). Not claimed as parity |
| WooCommerce / ShopEngine (cart, checkout), MetForm and Contact Form 7 forms, the enquiry plugin, popups made with PopupKit | Enrollment | Commerce and forms; protected, untouched |
| Rank Math SEO and redirects | Enrollment | Enrollment's own SEO; separate from Main's redirects |
| Leads, enquiries, students, users, LMS, audit log, import/export | Main `/admin` | Operational and personal data; never in the publishing workflow |
| Main forms (`forms`: email routing, webhooks, autoresponders) | Main `/admin` | Infrastructure-like settings (where enquiries go); kept out of the publishing workflow on purpose |
| Credentials, environment variables, deployment and region, server configuration | both | Infrastructure; never CMS-managed |

## D. Native WordPress publishing model ("Publish To" on pages, native Main Blogs / Courses / Locations / FAQs / Testimonials / Tools)

**State:**
- **Live:** shown in the admin (plugin 0.6.1). Production has **0** posts in every native type (checked 13 Oct). Its "Publish To → Main" needs Main to read WordPress (`WORDPRESS_CONTENT_ENABLED`, the Render Bridge), which is **off**, so it publishes nothing visible on Main.
- **Prepared (0.7.0):** hidden unless `ACADVIZEN_CMS_RENDER_BRIDGE` is set to true in `wp-config.php`. Nothing is deleted: the post types stay registered, and the constant brings everything back.
- Verified locally: the menu shows only working destinations, and the page editor has no dead "Publish To" box.

## E. What one action does in each editor

| Editor | Action | Result |
|---|---|---|
| Main Website → (any type) | Save | Main updated (one signed request). For blogs targeted at Enrollment or Both, the WordPress post too, in the same action. Per-destination result shown: green = everything, yellow = Main only (Enrollment copy failed, with a retry instruction), red = nothing changed |
| Regular WordPress Posts editor, linked post | Update | The WordPress post, then Main (guarded by version). Result in the editor ("Main Website: in step / not updated / conflict") and in the Posts list column |
| Regular WordPress Posts editor, new post with "Also publish on the Main Website" | Publish | The WordPress post, plus a published Main blog, linked from then on |
| Main `/admin` | Save | Main. Linked WordPress posts follow within 5 minutes (or immediately with Main Website → Blogs → **Check now**). A WordPress post also changed here meanwhile is never overwritten: it shows a conflict |
| Any editor | Trash or delete | Only on that website. Trashing on one website never deletes on the other. A blog removed on Main sets its WordPress post to Draft (kept) |

## F. Elementor for both websites, with approval (plugin 0.7.0; prepared)

Turned on by `ACADVIZEN_CMS_RENDER_BRIDGE` and `ACADVIZEN_CMS_APPROVAL` in wp-config.php, plus `WORDPRESS_CONTENT_ENABLED` on Main. All three are off on production.

| Feature | Class | Evidence |
|---|---|---|
| Design any page in the real Elementor editor (containers, nested layouts, typography, responsive values, media, buttons) and publish it to Main, Enrollment or Both | LOCAL | `approval-acceptance.mjs` A1–A8; bridge `scenarios.mjs` A–F |
| Same layout and responsive sizes at desktop, tablet and phone on both websites | LOCAL | A8, with screenshots in `evidence/approval/` |
| "Publish" submits the exact revision; drafts and pending pages are not public | LOCAL | A2, A3 |
| Only reviewers approve; Editors cannot, even by a direct call | LOCAL | A4 |
| Any edit after approval cancels it; a changed revision cannot be published | LOCAL | A5; PHP state-machine tests |
| Live pages are edited through working copies; direct Elementor/REST saves and trashing are refused | LOCAL | A7 |
| Publish to Main only, Enrollment only, or Both, each verified by the revision mark on the public page | LOCAL | A6, A8, A15 |
| Partial failure reported per website (never success); **Check again** retries and recovers: Main failing (A9), Enrollment failing (R1), both failing (R2) | LOCAL | A9; `approval-reliability-acceptance.mjs` R1, R2 |
| A repeated, replayed or forged publish/approve request is refused; nothing is published twice | LOCAL | R3 |
| Scheduled publishing of an approved revision: at its time, only if unchanged; Cancel schedule; lost jobs restored | LOCAL | R4; PHP tests |
| Approval switched off: nothing waiting goes live, live pages stay, approval screens disappear | LOCAL | R5 |
| Rollback to an earlier approved revision, verified on both websites; reviewers only | LOCAL | A10 |
| Missing or unsupported widgets block submission, with reason and fix; typed code needs an explicit code review | LOCAL | A11; `WIDGET-COMPATIBILITY.md` |
| Global styles (Elementor kit) reviewer-only and recorded | LOCAL | A12 |
| "Main homepage" takes effect only when that page is approved and published | LOCAL | A14 |
| Import Main Website under approval: new pages submitted, live pages via working copies, importer never confuses a copy with its page | LOCAL | A15 |
| Widget compatibility screen and extensible rules (`acv_cms_widget_rules`) | LOCAL | 189 widgets classified locally |
| Approvals screen: pending, approved, recent publications per website, history (audit) | LOCAL | A4–A10 drive it |
| Moving Main's existing pages into Elementor | PARTIAL | One real page (`/soft-skills`) moved end to end, LOCAL (`migration-acceptance.mjs` 13/13: content, title, description and canonical identical; visual differences listed in O-28). Other pages not yet converted. Runbook in `MAIN-MIGRATION-PLAN.md` |
| Menus, popups, code snippets, plugin settings under approval | Not built | O-22 |

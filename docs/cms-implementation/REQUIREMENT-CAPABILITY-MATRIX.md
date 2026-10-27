# Requirements, capabilities and evidence (updated 27 October 2026)

**27 Oct 2026:** plugin **0.7.10** and Main `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` (with the ownership lock) are live and re-verified. Production results, including the final verification of 27 Oct (§6), are in [PRODUCTION-ACCEPTANCE-2026-10-26.md](PRODUCTION-ACCEPTANCE-2026-10-26.md).

**For:** the owner and the reviewers who accept the handover.

This document covers three things:
- each handover requirement, how the system meets it, and the evidence;
- the Elementor features available for the Main Website;
- the exact publication contract.

**Labels used:**
- **PRODUCTION** means checked on the live websites.
- **LOCAL** means checked on the Docker copy only.
- **BLOCKED** names what is missing.

Day-by-day evidence: [PRODUCTION-TASK-LEDGER.md](PRODUCTION-TASK-LEDGER.md).

---

## 1. How Main gets Elementor's visual control while staying Next.js

Main pages are designed in the Enrollment WordPress with Elementor, and **drawn by WordPress and Elementor themselves** (the Render Bridge). www.acadvizen.com (Next.js on Vercel) fetches the approved, signed drawing and serves it at the page's own address, with its own SEO head, sitemap, forms forwarding and admin.

So **every Elementor feature that draws on Enrollment draws identically on Main**. Nothing is re-implemented in Next.js, so nothing can be lost in translation. What can differ is what a widget does *after* the page loads, when it calls back into WordPress (shop, sign-in, live search). Those are classified per widget (section 2).

Evidence (PRODUCTION, 22 Oct, `verify-elementor-live.mjs` 58/58):
- a new page built in Elementor (heading, text, button, uploaded image);
- published to Main, Enrollment and Both;
- checked live at 1440 / 768 / 390 px;
- updated through a working copy, restored and unpublished.

Today all 310 Main sitemap addresses are drawn this way, with 0 differences in status, title, canonical, robots or description against 21 Oct (23 Oct crawl).

## 2. Elementor feature inventory (PRODUCTION, read 24 Oct 2026)

**Source:** Acadvizen Master Admin → Widget compatibility on enroll.acadvizen.com (read-only). Raw data: `evidence/production-widget-inventory-20261024.json`.

**Versions:** Elementor 4.3.5, Elementor Pro 4.3.2, Royal Elementor Addons 1.7.1069, Essential Addons 6.8.6, MetForm 4.3.2, Ultimate Addons for Elementor 2.9.5, ShopEngine 4.9.7, WooCommerce 11.2.1.

**437 widgets installed:**

| On the Main Website | Widgets | Which |
|---|---|---|
| Works | 347 | Every layout, content, media, navigation, carousel, tabs, accordion, gallery, video, counter, icon, testimonial and form widget of Elementor, Elementor Pro, Royal, Essential Addons, UAE and Timeline. Includes MetForm (27) and the Elementor Pro Form: submissions are forwarded to WordPress |
| Works; the reviewer checks it | 8 | Search (2) and Sitemap: they search or list WordPress, not Main. Posts and Archive Posts: shown as they were at publishing time. Code Highlight. Hostinger Reach and Max Mega Menu: check their interactive parts in the Main preview |
| Typed code: reviewer with code rights only | 3 | HTML, Shortcode, Custom HTML (on both websites) |
| Cannot be published to Main | 79 | 29 WooCommerce widgets of Elementor Pro and 49 ShopEngine widgets (shop, cart and checkout run on Enrollment only), and Login (signs in to WordPress). Submit, approve and publish are refused with this reason; nothing is dropped silently |

**On Enrollment,** 434 widgets work and the same 3 need code rights.

**Measured coverage (25 Oct 2026).** These categories are kept apart, and none is counted as "working" without evidence.

| Status | Widgets | Evidence |
|---|---|---|
| **Verified live on Main** | The 11 types used by the 310 live Main pages: Image, Text Editor, Navigation Menu, HTML, Heading and Button (all 310 pages), Shortcode (178), Nested Accordion (23), Video (2), Image Carousel (1), Nested Carousel (1). Plus Container nesting, typography, colours, backgrounds, spacing and responsive sizes | Every page answers 200, drawn by WordPress; SEO identical to 23 Oct; text verified at migration. `evidence/production-main-widgets-used-20261025.json` |
| **Verified end to end (create → preview → publish → update → restore)** | Container (nested), Heading, Text Editor, Button, Image, checked at 1440 / 768 / 390 px | PRODUCTION `verify-elementor-live` 58/58 (22 Oct); LOCAL `approval-acceptance` 47/47 and `direct-publish-acceptance` 11/11 (25 Oct) |
| **Drawn by Elementor, not individually tested on Main** | The other 336 widgets marked "Works" (section 2) | They are drawn by the same Elementor and add-ons as on Enrollment, but no Main page uses them yet. Check each in the Main preview before first use |
| **Works with a reviewer check** | 8 (section 2) | Behaviour after load differs on Main (search, post lists, unknown add-ons) |
| **Refused on Main, with the reason** | 79: WooCommerce (29), ShopEngine (49), Login (1) | Shop, cart and sign-in run only on Enrollment. Publish them to Enrollment, or link to them |
| **Needs a dependency** | Elementor Pro features (popups, custom CSS, motion effects, Theme Builder) | Pro 4.3.2 is active on production (licence status not checked). If it lapses, affected pages are flagged |

**Page and site features:**

| Feature | Main | How |
|---|---|---|
| Containers, flexbox/grid, nesting, spacing, width, alignment | Yes | Elementor's own output |
| Per-device settings (desktop / tablet / phone), hiding per device | Yes | Elementor's own CSS. Checked live at 1440/768/390 |
| Typography, colours, backgrounds, borders, shadows | Yes | Same |
| Custom CSS, custom attributes, motion effects (Elementor Pro) | Yes, flagged for review | Pro is active on production |
| Entrance animations | Yes, flagged for review | Elementor's own scripts |
| Templates shared by many pages (blog, tool, location, area, city designs) | Yes | Theme templates. One change, after approval, redraws every page using it |
| Header and footer | Yes | "Main Website Header / Footer" templates |
| Menus | Yes | "Main Website Menu" (WordPress menus) |
| Global colours and fonts (Site Settings / kit) | Yes, with care | Shared by both websites, so a kit change marks every waiting approval "changed". Main's own colours and fonts are set in its designs (see the operating manual §11) |
| Popups | Yes, flagged for review | Elementor Pro popups draw; their triggers run in the visitor's browser |
| Forms | Yes | Elementor Pro Form, MetForm, Contact Form 7: posted to WordPress through Main's forwarding. The enquiry endpoint `acadvizen/v1/enquiry` is unchanged |
| Dynamic tags | Yes, flagged for review | Values are fixed at publishing time on Main |
| Media Library | Yes | Shared library; in-use files are protected from deletion (0.7.7) |
| SEO (title, description, canonical, robots, social image) | Yes | Rank Math fields of the page, sent with the approved drawing. Main writes them in its own `<head>` |

## 3. Requirement-to-capability matrix

| # | Requirement | How it is met | Evidence | Status |
|---|---|---|---|---|
| R1 | One WordPress + Elementor admin for both websites | enroll.acadvizen.com/wp-admin; Elementor editor for every page, post and template of both | 310/310 Main addresses drawn by WordPress; `verify-elementor-live` 58/58 | **PRODUCTION** |
| R2 | Full practical visual control of Main, Main stays Next.js | Render Bridge (section 1) | section 1; 437-widget inventory (section 2) | **PRODUCTION** |
| R3 | Custom Master CMS dashboard out of the main editing workflow, without breaking services | Plugin **0.7.8** (carried in 0.7.9): content types (Main Blogs, Courses, Locations, Tools, FAQs, Testimonials) are normal top-level WordPress menus; the plugin menu is "Approvals & Publishing" and opens Approvals; the overview page is no longer listed (its address still works); 9 duplicate links removed. Screen names and every service unchanged | PHP 356/356; LOCAL: menu and all 8 screens 200, screen hook names unchanged, stall repair attached (`evidence/local-menu-078.png`) | **PRODUCTION** (0.7.8 menus, live since 26 Oct) |
| R4 | Destination: Enrollment / Main / Both in the normal workflow | Page Settings → **Publish To (Acadvizen)** in Elementor; also in the WordPress editor | `verify-elementor-live` (each destination) | **PRODUCTION** |
| R5 | Approval before publishing | Editors, Authors, Contributors: Publish = submit; a reviewer approves the exact revision, after ticking each chosen website's preview. Administrators and Reviewers: from 0.7.9, Publish/Update publishes directly (self-approval recorded), section 5a | `verify-approval-live` 16/16 (PRODUCTION, 0.7.6); `direct-publish-acceptance` 11/11 and `approval-acceptance` 47/47 (LOCAL, 0.7.9) | **PRODUCTION** 26 Oct: `verify-elementor-live` 52/52 (direct publish), `verify-approval-live` 16/16 (submit flow) |
| R6 | Truthful remote status, retry, preview, rollback | Section 4 | Section 4 | **PRODUCTION** |
| R7 | Both: failure reported, never success | Each website has its own state. The outcome is "partial failure" (or "failed") with each website's reason; the failed website keeps the previous version; Check again retries | PRODUCTION `verify-failure-retry-live` 8/8 (26 Oct). No secret was used: a temporary Rank Math redirect was the cause. Reported **failed** with each website's reason; Main kept V1; Check again verified both. LOCAL: `both-failure-acceptance` 12/12 | **PRODUCTION**. Lost-check recovery also verified 26 Oct (Contact and 23 others) |
| R8 | Scheduling | Future date → "Schedule approved revision"; any change cancels it | PRODUCTION `verify-scheduling-live` 6/6 on 26 Oct (live 52 s after its time) | **PRODUCTION** |
| R9 | Media deletion protection | 0.7.7 `media-guard.php`: files used by published, scheduled or waiting content cannot be deleted; the page using it is named | PHP tests; live since 22 Oct | **PRODUCTION** |
| R10 | Over-long blog categories handled safely | Section 5 | Section 5 | **No change needed** |
| R11 | 11 blog drafts stay drafts | The import keeps them unsubmitted | Blogs import log 22 Oct | **PRODUCTION** |
| R12 | Forms and enquiry route preserved | `acadvizen/v1/enquiry` untouched; Main forwards form posts to WordPress | Enrollment 58/59 identical (`/test/` intended) | **PRODUCTION** |
| R13 | SEO preserved | Per-page Rank Math fields; Main's head, sitemap and robots | 23 Oct crawl: 0 differences | **PRODUCTION** |
| R14 | `/test/` unpublished; Bangalore "Feature title" placeholder omitted | — | 23 Oct crawl | **PRODUCTION** |
| R15 | Four Main-only pages noindex and out of the sitemap while empty | Main release 40f41a7 | Live `dpl_2B5hNrES…` | **PRODUCTION** |
| R16 | Main `/admin` keeps Leads and the Main-only lists | The ownership lock refuses WordPress-drawn content in Main's admin with 423. Companies, internships, resources, authors, categories, tags and leads stay editable | 27 Oct: `/admin` and `/admin/leads` 200; pages 423; entity lists 401; Leads read 401, empty submission 400 (anonymous) | **PRODUCTION** (lock on since 26 Oct 12:51Z). A signed-in check of Main's admin was not repeated after the lock: its separate login was not available |
| R17 | Fresh backup before releases that depend on it | Hostinger hPanel backups | Newest is 17 Oct | **DONE 26 Oct**: `u713346627_xDzzw` backup of 24 Oct 15:15 downloaded through hPanel (owner's sign-in), sha256 `b9f1a0fb…`, restore-tested in an isolated container (111 tables) |
| R18 | Accounts | One existing Administrator account manages both websites (agreed setup). Users → Add New User remains available if wanted later | 27 Oct: user #1, administrator with the review capability, signed in; every CMS screen opens; the LIVE suites ran under it | **PRODUCTION**. Personal accounts: **NOT REQUIRED** |

## 4. Publication contract

For every publication, and for each chosen website separately:

| State shown | Meaning |
|---|---|
| **Publishing** | Sent; the website is being checked (within a few minutes) |
| **Published (verified)** | The public address answered 200 and shows **the approved revision** (by fingerprint), not just any page |
| **Failed** | The website did not take the change, or shows another revision. The reason is given, for example "HTTP 200 but another revision is shown". **The previous approved version stays live** |
| **Removed** | Unpublished; the public address no longer shows it (on Main, Main's own original page returns) |
| **Rolled back** | An earlier approved version was restored and verified |

The overall result is:
- **verified** only when every chosen website is verified;
- **partial failure** when at least one website is verified and another failed, with the failed website named;
- **failed** when no website took the change.

"Both" never reports success while one website failed.

| Action | Where | What happens |
|---|---|---|
| Preview | Elementor → Preview on the Main Website; Approvals → *Enrollment design*, *As on the Main website*, *Desktop / tablet / phone* | Draws the saved revision as each website will show it. Publishes nothing. Signed, and only for signed-in users |
| Check again / Retry | Approvals → Recent publications | Puts each failed website back to Publishing and redraws it. Verified websites are left alone |
| Stalled publication | Opening Pages, a page, the Publishing screen | Repaired automatically, at most once a minute |
| Restore / Rollback | Approvals → Restore, or Versions & Rollback | Reviewer only. Republishes an earlier approved revision to the same websites and verifies it |
| Approval validity | Approvals | An approval covers the exact fingerprint: content, settings, SEO, terms, the referenced media files, and shared styles and templates. Any change marks it "changed since it was submitted" and offers "Submit the current version again" |

## 5. The three over-long blog categories (rechecked 24 Oct 2026)

Three Main blog posts carry a "category" that is really a keyword list of 256, 276 and 304 characters. WordPress allows 200. The posts are:
- `digital-marketing-course-in-bangalore-your-big-opportunity`;
- `how-to-get-leads-on-meta-business-suite-using-claude`;
- `google-ads-ai-max-explained-what-the-september-2026-auto-upgrade-changed`.

**Findings (PRODUCTION):**
- Neither the WordPress-drawn post nor Main's own version (`?acv-main=1`) shows the category anywhere: not on the page, in its metadata or structured data, or on `/blog`.
- Main's `/blog/category/…` pages read Main's own database (`blog_categories`). They stay on Main, outside WordPress and outside the sitemap, so they still show these posts exactly as before.
- **Nothing was truncated:** the import stored no category for these three rather than a shortened one. The full text remains in Main's database and in the import bundle.

**Decision:** no WordPress representation is needed. A shortened or split name would invent categories that Main never had. If the owner wants real categories for these posts, the clean fix is to give them proper short categories in Main's admin (Blog taxonomy) and in WordPress.

## 5a. "Publish does not publish": causes found on production and the fix (25 Oct 2026, plugin 0.7.9)

Found read-only on production (Approvals history, Publishing status, Templates, live HTML). **Fixed on production 26 Oct 2026** (plugin 0.7.9, then 0.7.10 for P4).

| # | What the team saw | Cause (evidence) | Fix in 0.7.9 | Local test |
|---|---|---|---|---|
| P1 | Clicking **Publish** on Enrollment pages (New Home, Courses 1, Placement 1, Mentors 1, Career 1, Branches, Partnership) changed nothing on the website | With approval on, Publish only *submits*. On 24 Oct: 35 submissions, 0 approvals, 0 publications; 9 items still waiting. 29 history entries are "changed after it was submitted": publishing again after an edit set the page back to Draft | Publish / Update by an Administrator or Reviewer publishes (recorded as approved by them; scheduled if future-dated). The working copy stays open, so Update works again in the same editor. Editors, Authors and Contributors still submit. Compatibility rules still apply | `direct-publish-acceptance.mjs` **11/11** |
| P2 | `/contact` showed **Publishing** for 1.5 days although it was live | The chain of background checks is a series of one-off WP-Cron jobs; one was lost, so the result was never recorded | Lost checks are resumed (hourly, and when Approvals or Publishing opens) | D7, PHP unit |
| P3 | The Main homepage's **Quick Registration popup** (lead form) was approved and published on 23 Oct but never appears | Elementor Pro shows popups from a cache of display conditions. It was rebuilt while the popup was *pending* (left out) and is not rebuilt when a template is published. Confirmed in Pro's source (`conditions-cache.php`: only `publish`/`draft`; no status hook) and on the live homepage (no popup markup, no revision mark `d41d742c…`) | The cache is rebuilt whenever a template goes on or off the websites or its conditions change, and once after the update; then the Main pages are redrawn | **PRODUCTION 26 Oct:** popup markup and revision mark `d41d742c…` on the homepage after the update |
| P4 | After P3, the popup opened but appeared as a block at the bottom of the homepage | Elementor loads its dialog styles (`conditionals/dialog.min.css`) from script only when another element (the image lightbox, on Enrollment) needs them first; the Main homepage has none | 0.7.10 links the dialog styles on every page drawn for Main | **PRODUCTION 26 Oct:** a fixed, centred overlay at 1440 and 390 px after ~96 s; closes; no page errors |
| P5 | Two Main pages answered "temporarily unavailable" (503) once each during the site-wide redraw | Right after a publication Main has no cached copy; when a busy WordPress refused that first fetch, Main gave up | Main retries a quick refusal once (`lib/wordpress/retry.js`) | Unit 6/6; Main release, see the ledger |

The Main publishing path itself works: 288 Main pages are "Published", and every recent Main publication is verified (the approved revision is shown at its address).

## 6. What is not complete, and why (27 Oct 2026)

**No technical item is open.** The items that were listed here on 25 Oct were all done on 26 Oct and are verified on production:
- the correct database backup;
- the push;
- the 0.7.9 and 0.7.10 installs;
- the ownership lock;
- the scheduling re-run;
- the Both failure test.

Personal accounts are **not required**.

| Kind | Item | Owner |
|---|---|---|
| Content decision | Enrollment homepage title ("Demo - Copy") and description | Client / team |
| Content decision | #8516, the only waiting approval item | Team |
| Content fix | 3 missing logos on Enrollment `/learn-digital-marketing/` | Team |
| Supported, not fully tested | 336 widgets not used on Main yet; signed-in Main `/admin` after the lock | Check before first use |
| Future enhancement | Homepage unpublish warning (`PROPOSAL-HOMEPAGE-UNPUBLISH-WARNING.md`) | Owner approval needed to build |

# Test plan

Three levels. A result only counts at the level where it was observed.

| Level | Where | Purpose |
|---|---|---|
| **Automated** | Repository | PHP and Node unit tests, lint, types, build, package verification |
| **LOCAL end-to-end** | `tests/wordpress`: Docker WordPress 7.1 with Elementor 4.3.3, HFE, Rank Math, CF7, MetForm and Astra, plus a local production build of Main with the integration on | Full publishing behaviour with disposable content, without touching live sites |
| **PRODUCTION** | `enroll.acadvizen.com` and `www.acadvizen.com` | The acceptance tests below. Only with: a confirmed backup, a working WordPress admin login, the shared secret configured, and the owner's approval |

## Rules for production test content

- Title `CMS PRODUCTION TEST YYYYMMDD-HHMM`; address `cms-production-test-yyyymmdd-hhmm`.
- Rank Math "No Index" on, and kept out of every menu.
- Never the homepage, an important landing page, a real lead or a real customer record.
- Deleted after the test; the deletion is verified on both websites.
- No live enquiry without separate approval (it would reach the business inbox and Leads).

## Commands

```sh
php tests/php/run.php                      # PHP plugin tests
npm run test:unit                          # Node tests
npx tsc --noEmit && npx next lint && npx next build
node tools/build-cms-plugin.mjs            # reproducible package + verification
node tests/wordpress/scenarios.mjs         # LOCAL end-to-end (README in tests/wordpress)
node tests/wordpress/structured-acceptance.mjs   # LOCAL admin acceptance, Main Website screens
node tests/wordpress/site-chrome-acceptance.mjs  # header, footer, menus, site labels
node tests/wordpress/homepage-acceptance.mjs     # homepage banner, call to action, lists
node tests/wordpress/courses-acceptance.mjs      # courses, course sections, course lists
node tests/wordpress/more-content-acceptance.mjs # city and service pages, SEO overrides, media library
node tools/cms-api-smoke.mjs               # PRODUCTION plugin API, read-only
node tools/verify-production.mjs           # PRODUCTION websites, read-only
```

## Acceptance tests (production; LOCAL equivalents in brackets)

| ID | Test | Preconditions | Pass criteria |
|---|---|---|---|
| A | Inventory: existing records visible in the central admin | Import run (authorised, after backup) | Admin counts equal the inventory: 86 blogs, 67 tools, 134 pages. Spot checks match the public pages (title, image, address, SEO); no duplicates |
| B | Create a Main page with heading, paragraph, image, button and a two-column section; typography, colour and spacing; save the draft, reopen it, preview on desktop, tablet and mobile | WordPress admin login, secret set | Layout persists; **Preview on the Main Website** shows it; the draft is not public anywhere (L/A) |
| C | Publish it to Main | + integration on | Status "Main: Published"; the public URL answers 200 with the content, styles, image, links and canonical; Enrollment 404; screenshot (A) |
| D | Edit an existing page (approved, non-critical) | + owner approval of the page | Text and visual change visible on the public URL; unrelated routes unchanged. Otherwise BLOCKED and done on a test page |
| E | Blog CRUD: create, publish, edit, draft, trash, restore and delete a test blog; existing blogs unchanged | As C | Appears on and disappears from `/blog/<slug>` and `/blog`; the other 86 blogs unchanged |
| F | Other types: courses, locations, cities and areas, FAQs, testimonials, media, menus, templates | As C | Create, publish and remove, as for E (E) |
| G | Destination isolation: Main only, Enrollment only, Both; a retry does not duplicate | As C | Each website checked separately (A, B, C, H) |
| H | Revisions: v1 → v2 → restore v1 (text **and** design) → the next edit replaces it | As C | Public page matches each step (F) |
| I | Shared styles and templates: affected-pages list, then a change applied | As C, and an agreed time window (the change is visible to every visitor) | The list matches the pages that changed; unrelated settings kept (D) |
| J | Scheduling: a test page scheduled 10 minutes ahead | As C, plus the server cron | Not public before; public within about 2 minutes after; timezone recorded |
| K | Forms and enquiries | Separate approval for one test enquiry | Stored and notified as before; the enquiry API still answers |
| L | Regression | — | `verify-production.mjs` no worse than baseline; `cms-api-smoke.mjs` all pass |

## Main Website screens (hybrid structured editing, plugin 0.5.0)

`tests/wordpress/structured-acceptance.mjs` drives the real WordPress admin in a browser, acting as a non-technical administrator.
- **Target:** a local Main build connected to a local Supabase. The Supabase holds a copy of one production page, one production blog and one production tool.
- **Evidence:** screenshots and a results JSON in `docs/cms-implementation/evidence/local-structured/`.
- **Production:** once the connection is on, the same steps are the PRODUCTION acceptance script, run on CMS PRODUCTION TEST content only. Step B is the exception: it needs the owner to choose an existing page.

| Group | What the admin does | Pass criteria |
|---|---|---|
| A | Finds Acadvizen Master Admin → Main Website (with mouse and with keyboard), the tabs, and an existing page | Menu entry present; one tab per content type; the page is listed with its address and status |
| B | Changes an existing live page through a private copy: edits a section, previews on desktop, tablet and mobile, publishes, then restores the original | While the draft exists, the live page answers 200 and is unchanged.<br>Preview renders at 1280, 820 and 390 px.<br>After publishing, the change is live.<br>The restored page is pixel-identical (< 0.1 % of pixels differ) on desktop and mobile.<br>An unchanged save changes nothing. |
| D/E | Creates a blog, publishes it to Main, Enrollment and Both, edits it, restores an earlier version, trashes it and restores it | Each website checked separately.<br>noindex is honoured.<br>The restored version is the one live.<br>Trash removes it from both websites.<br>Restore brings it back as a private draft. |
| E | Creates a tool (show, then hide) and a new page with three sections and design settings | The tool appears, then disappears.<br>The page stays private until published.<br>Sections appear in order.<br>Alignment and "hide on phones" are applied.<br>Unpublishing takes the page off. |
| I | Uses an address that is already taken | A clear message; the typed text is kept |
| H | Tests permissions and security: Authors, Contributors, forged statuses, preview links, unsigned and replayed requests | Author: no pages (403), only their own articles.<br>Contributor: draft or review only; a forged "Published" is refused.<br>A changed or foreign preview link is refused.<br>An unsigned request gets 401.<br>A replayed signed change is applied once (409). |
| J | Regression | `/`, `/blog`, `/tools` and the edited page answer 200; the Activity log records the changes |
| Z | Cleanup | Every CMS TEST record is removed and its address answers 404 |

### Further Main Website areas (plugin 0.6.0)

| Suite | What a non-technical admin does | Pass criteria |
|---|---|---|
| Site chrome | Copies the links shown today into menus; edits, hides and shows a link; turns on the announcement bar; changes the copyright line and a label | The homepage is pixel-identical after the copy (< 0.1 % of pixels differ). Each change shows on the website. Untouched colours (including rgba) keep their values. Everything is put back |
| Homepage | Copies what the homepage shows today; edits an FAQ question and restores the earlier version; hides a list; changes the banner and the closing call to action | Pixel-identical after the copy. The edit shows; the restore brings the original back. Hiding a list brings back the built-in one unchanged. Banner and call-to-action changes show |
| Courses | Creates a course with a curriculum and skills; edits and restores it; adds a course section; hides the course | The course page shows the title, modules, topics and skills. A "Live list: courses" section lists the course. Restore works. Hiding removes the course everywhere |
| City and service pages, SEO, media | Creates a city page with a feature and a section placed at the top; tries a service page address already used by a page, then a free one; edits and removes an SEO override; uploads an image and picks it from "Main library" | The city page shows its heading, feature and the top section. The clash is refused with a message. The override changes the page title and its removal restores the page's own. The image is publicly reachable and fills an image field |

The production runs of these suites use CMS PRODUCTION TEST content. The copy steps (menus and homepage lists) are real, intended changes: copying keeps the website identical. On production they are run once, when the client starts editing, not as tests.

# Publishing workflow: Main, Enrollment and Both (13 October 2026)

How a change made in the Enrollment WordPress admin reaches each website, and what was verified, where.

**Environment labels:**
- **PROD** = the live sites;
- **LOCAL** = a full local copy (local WordPress with the plugin, a local production build of Main, local Supabase).

**No staging exists** (`FINAL-OPEN-ISSUES.md` O-5).

## 1. Current production state (observed, read-only, 12 Oct 2026 19:41–20:25 UTC)

| Switch | State | Meaning |
|---|---|---|
| `WORDPRESS_CONTENT_API_ENABLED` (Vercel Production) | **ON** since 12 Oct 2026 (release 9, approved by the owner at the time) | WordPress **can** publish Main content to www.acadvizen.com now |
| `WORDPRESS_CONTENT_ENABLED` (Render Bridge) | **OFF** (absent in every environment) | WordPress/Elementor pages are never served at Main addresses |
| Plugin | Acadvizen Master Admin **0.6.1** | Plugin **0.7.0** (§7) is prepared locally only: not committed, not installed |

**Your instruction says to keep the WordPress-to-Main publishing bridge disabled.**
- The Render Bridge is disabled.
- The content connection that publishes to Main is **enabled**, and has been since 12 Oct. It was not changed in this work.
- To switch it off: Vercel → acadvizen-newww-ua9d → Settings → Environment Variables → remove `WORDPRESS_CONTENT_API_ENABLED` → Redeploy production.
  - Effect: `POST /api/wordpress/content` → 503 `content_api_disabled`; the Main Website screens show "not switched on".
  - Nothing already published changes.
- This is your decision (O-2). Nothing is toggled without your explicit instruction.

## 1b. Workflow status (re-checked read-only on 13 Oct 2026, 11:10–11:20 UTC)

**Production observations:**
- the live deployment is still `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (Ready, created 12 Oct);
- `/api/wordpress/bridge-manifest` → 404, so the Render Bridge is off;
- an unsigned `POST /api/wordpress/content` → `missing_timestamp`, so the content API is on and refuses unsigned requests;
- the plugin is 0.6.1 (public readme).

| Workflow | Production | LOCAL |
|---|---|---|
| Native Elementor publishing on Enrollment (WordPress itself; the CMS plugin is not involved without approval) | `NOT VERIFIED` by this engagement: no production WordPress login was used, and no page was published there. The 60 existing pages were unchanged (12 Oct) | `VERIFIED WORKING`: bridge scenario B; with approval, A6–A8 and R1 |
| Master Admin → Main (structured editing: pages, blogs and the other Main Website screens) | `VERIFIED WORKING` for pages (17/17) and blogs, 12 Oct, with labelled test content removed afterwards. Other screens: `NOT VERIFIED` on production | `VERIFIED WORKING` (final run, `TEST-RESULTS.md`) |
| Master Admin → Enrollment (blogs with Publish To = Enrollment) | `VERIFIED WORKING`, 12 Oct | `VERIFIED WORKING` |
| Master Admin → Both (blogs) | `VERIFIED WORKING`, 12 Oct (publish and edit reach both) | `VERIFIED WORKING`, with partial failure and Main stopped |
| Elementor pages → Main / Both (Render Bridge) | `NOT VERIFIED`: the bridge is off and plugin 0.7.0 is not installed (owner approval required) | `VERIFIED WORKING`: scenarios, approval, reliability and migration suites |
| Approval before publishing (exact revision, reviewers only, invalidation, audit, scheduling, partial failure, retry, rollback) | `NOT VERIFIED`: not installed | `VERIFIED WORKING` |

## 2. The flow, step by step (code)

1. **Admin form.** Acadvizen Master Admin → Main Website → (type) → Edit. The plugin checks the WordPress capability and ownership, and the nonce (`handle_main_save`, `wordpress/acadvizen-cms/includes/main-content.php`).
2. **Signed request.** `main_content_request` → `post_to_main` (`includes/main-site.php`) sends JSON to `https://www.acadvizen.com/api/wordpress/content`, with:
   - `X-Acadvizen-Timestamp`;
   - `X-Acadvizen-Signature` = HMAC-SHA256 over `timestamp.body` with the shared secret;
   - a unique `request_id`.
   A production-isolation guard stops any copy of WordPress other than enroll.acadvizen.com from targeting the live Main.
3. **Main checks** (`app/api/wordpress/content/route.js` → `handleContentRequest`, `lib/wordpress/contentApi.js`):
   - switch on;
   - signature valid, within a 5-minute window;
   - purpose `content`;
   - `request_id` claimed once in the database table `wordpress_content_requests` (replays → 409);
   - entity allowed;
   - fields validated (`validateRecord`);
   - address rules (format, reserved routes, taken by another record or alias → 409 `slug_taken`; nothing overwritten);
   - links checked before publishing.
4. **Store.** Supabase (service key, server only). Every change keeps an earlier version in WordPress ("Earlier versions → Restore").
5. **Revalidate.** `revalidate()` refreshes the affected Main paths and cache tags (detail page, listings, sitemap). If that fails, the editor is told the change shows within 5 minutes.
6. **Render.** The Main pages read Supabase per request and render **in Main's own Next.js design** (structured fields and sections; no WordPress HTML or shortcodes). Publish state and schedule are applied at query time (`lib/cmsPublishing.js`).
7. **Enrollment (blogs only).** For **Enrollment** or **Both**, after Main has accepted the save, `sync_enrollment_blog_copy` creates or updates a normal WordPress post (status `publish` or `draft`). Existing Enrollment pages and Elementor layouts are never touched.
8. **Feedback.** The result notice says what happened on each website:
   - red = nothing saved;
   - yellow (0.7.0) = Main saved but the Enrollment copy failed;
   - green = everything saved.

## 3. Content types and destinations

| Content (screen) | Destination selector | Main storage (table) | Verified |
|---|---|---|---|
| **Blogs** | **Main / Enrollment / Both** | `blogs` (+ an Enrollment WordPress post for Enrollment/Both) | PROD 16/16 (12 Oct); LOCAL 16/16 + 15/15 failure cases + 18/18 edit-anywhere (0.7.0) |
| **Redirects** (0.7.0) | Main only | `redirects` (read live by Main's middleware) | LOCAL 11/11 + unit tests |
| **Pages** (with sections) | Main only (Enrollment pages stay native WordPress + Elementor) | `pages`, `sections` | PROD 17/17 (12 Oct); LOCAL 17/17, structured 56/56 |
| Header, Footer, Menus, Site settings | Main only | `header_settings`, `footer_settings`, `menus`, `site_settings` | LOCAL 18/18 |
| Homepage banner, call to action, sections, lists | Main only | `homepage_hero`, `homepage_cta`, `home_sections` | LOCAL 14/14 |
| Courses, course sections | Main only | `courses`, `course_details` | LOCAL 12/12 |
| City pages, service pages, locations, cities, tools, testimonials, media, SEO overrides, authors, categories, tags | Main only | the matching tables | LOCAL 15/15 + structured suite |

**For each supported type** (verified as stated; PROD = the page workflow AT-20 and blog targets AT-21–23):
- **Draft:** saving a draft never changes the public site; a draft page answers 404 (PROD AT-20).
- **Publish:** publishing updates the chosen destination (PROD pages and blogs).
- **Design:** pages render in Main's design (PROD screenshots in `evidence/production-r10/`).
- **Update / rename:**
  - An update shows on the next request (PROD AT-20, AT-39).
  - Renaming to an address already in use is refused, and both records are unchanged (unit tests; PROD AT-20 address clash).
  - Redirects from a renamed page's old address were **not** separately verified.
- **Unpublish / Trash / Delete permanently:** the item answers 404, and nothing else changes (PROD AT-20, AT-40).
- **Existing Supabase records are protected:** an address in use (`slug_taken`), reserved application routes and aliases are refused; a private "draft copy" edits a live page without touching it.
- **Errors are visible:** red notice; the typed content is kept for a retry; nothing half-saved.

## 4. Test A — Main only (blog)

| Step | LOCAL (13 Oct 03:44, plugin 0.6.1 code) | PROD (12 Oct, labelled test content, removed) |
|---|---|---|
| Draft not public | PASS | PASS |
| Publish → `/blog/<slug>` 200 in Main's design, noindex for test content | PASS | PASS |
| Update → visible on the next request | PASS | PASS |
| Enrollment unchanged (no WordPress post) | PASS | PASS |
| Cleanup (Trash, Delete permanently → 404; nothing else touched) | PASS | PASS (0 test items left) |

## 5. Test B — Enrollment only (blog)

| Step | LOCAL | PROD |
|---|---|---|
| One submission creates one WordPress post, `publish`, 200 on Enrollment | PASS | PASS |
| Main does not show it (kept private on Main) | PASS | PASS |
| Saving again keeps it live (fixed in 0.6.1) | PASS | PASS |
| Existing Enrollment pages unchanged | — | PASS: 60/60 pages identical to the first baseline (12 Oct 23:45) |
| Cleanup: the Enrollment copy is removed | PASS | PASS |

## 6. Test C — Both (blog)

| Step | LOCAL | PROD |
|---|---|---|
| Publish → Main `/blog/<slug>` 200 **and** an Enrollment post 200, each in its own design | PASS | PASS |
| Controlled edit reaches both | PASS | PASS |
| **C0 Main unreachable**: red message "The Main Website could not be reached, so nothing was changed there…"; typed title kept; no Enrollment copy | PASS 3/3 (plugin 0.6.2) | not run (it would need taking production down) |
| **C1 Main refuses** (address used by an existing blog): red message; no Enrollment copy; the existing blog unchanged | PASS | not run |
| **C2 Main saves, Enrollment copy fails** (forced by a local test-only mu-plugin): **yellow warning** "Saved on the Main Website. Enrollment Website copy failed: … Fix the problem and click Save again"; Main published; no Enrollment copy | PASS (0.6.2). **On 0.6.1 the same text appears in a green success box** (the defect fixed in 0.6.2) | not run |
| **C3 Retry after the cause is fixed**: green success naming Enrollment; exactly one Enrollment copy; a second save → still one (no duplicates); Main still serves one blog | PASS | not run |

Evidence:
- `tests/wordpress/both-failure-acceptance.mjs`, LOCAL run 13 Oct 04:2x UTC: 12/12 plus 3/3 in Main-down mode, exit code 0;
- the same test on the unfixed code: C2 failed as expected (green box).

## 7. Edit anywhere, never overwrite (prepared: Main release 11 + plugin 0.7.0; LOCAL only)

**Blogs are kept in step across three editors** (`wordpress/acadvizen-cms/includes/blog-sync.php`; test `tests/wordpress/blog-sync-acceptance.mjs`, 18/18 LOCAL).

| Step | Result (LOCAL) |
|---|---|
| S1 Main Website → Blogs, Publish To Both, one Save | Main blog **and** Enrollment post created; the post marked "In step" |
| S2 Edited in Main's own `/admin` | Enrollment post follows (title and article), via the 5-minute check or **Check now** |
| S3 Edited in the regular WordPress Posts editor (REST save, as the block editor does) | Main follows: title, article, bold kept. The cover image does not become an extra block; the public Main blog shows the edit |
| S4 Changed on both sides before they were aligned again | The WordPress edit is not sent (Main keeps its change); marked "Conflict"; the next check does not overwrite the WordPress side either; saving the chosen version in Main Website → Blogs resolves it on both |
| S5 Enrollment post moved to the trash | Main blog stays live |
| S6 Removed on Main | Enrollment post set to Draft, kept |
| S7 New regular post with "Also publish on the Main Website" | Published on Main too, linked, "In step" |
| S8 Contributor tries that option | Refused (403); nothing created on Main |

**Edit conflicts for every Main type with a version** (Main `lib/wordpress/contentApi.js`, plugin form version; test `conflict-acceptance.mjs`, 9/9 LOCAL + 6 unit tests):
- A WordPress save on a record changed meanwhile in Main's `/admin` is refused: red message, the other change kept, typed text kept.
- Saving again is an informed overwrite.
- The check and the write are one conditional update.
- Main's `/admin` itself still saves last-write-wins. It is not part of this change.

**Redirects** (§3; `redirects-acceptance.mjs` 11/11 LOCAL):
- created switched off; switching on gives a live 301 on Main;
- live pages, system addresses, chains, loops and duplicates are refused;
- deleting needs the redirect switched off, plus confirmation.

**Native "Publish To" model hidden** while the Render Bridge is off (`ACADVIZEN_CMS_RENDER_BRIDGE`), so no editor offers a destination that shows nothing.

## 7b. Plugin 0.7.0 contents (prepared locally; NOT installed, NOT committed)

| Change | Why |
|---|---|
| A partial "Both" failure shows a yellow **warning**, not a success notice | A green box suggested both websites were updated |
| "Main Website could not be reached" message in plain language, with what to do; local codes translated | Raw `cURL error 7` was shown before |
| Two-way blog sync, "Also publish on the Main Website", per-post status, **Check now** | Edit once, either editor |
| Edit-conflict protection on every Main Website form | Two editors never silently overwrite each other |
| Main Website → **Redirects** | Main's redirects were editable only in Main's own admin |
| Native publishing screens hidden unless `ACADVIZEN_CMS_RENDER_BRIDGE` is true | They publish nothing visible while Main does not read WordPress |
| Result notice class `acv-cms-flash`; version 0.7.0 | Reliable reading by support and tests |

**Needs Main release 11 deployed first**, because conflicts and redirects are answered by Main's API. With the old Main:
- the plugin's redirect screen would get "unsupported entity";
- version checks would be ignored (no harm, no protection).

**To release (owner, after approval):**
1. Commit.
2. Run `node tools/build-cms-plugin.mjs` → `dist/acadvizen-cms-0.7.0-<commit>/acadvizen-cms.zip`.
3. Deploy Main release 11.
4. Upload the plugin (Plugins → Add New → Upload → **Replace current with uploaded**).
5. Rollback: the 0.6.1 package.

## 8. What is NOT verified

- **PROD:** header, footer, menus, homepage lists, courses, city and service pages, media upload, scheduling, Author/Contributor (no staging; no production test accounts).
- **PROD:** the Both failure cases C0–C3. They would need breaking a live destination.
- **Any STAGING result:** there is no staging environment.

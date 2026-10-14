# Final open issues: Acadvizen Master Admin / headless CMS (13 October 2026)

**Status labels:**
- `PASS — VERIFIED` (production)
- `PASS — VERIFIED IN STAGING ONLY`
- `PASS — VERIFIED LOCALLY ONLY`
- `BLOCKED — EXTERNAL ACTION REQUIRED`
- `OWNER APPROVAL REQUIRED`
- `FAIL — FIX REQUIRED`
- `ACCEPTED RESIDUAL RISK`

**Overall: NOT READY for an unconditional handover.**
- **Live CMS:** works for pages and blogs (`PASS — VERIFIED`). Every other content type is `PASS — VERIFIED LOCALLY ONLY`, because no staging exists.
- **Credentials:** the public-history exposure is an `ACCEPTED RESIDUAL RISK` by the owner's decision, not a fix.
- **Release 11:** improves security readiness and performance. Code commits are local, waiting for the owner's manual push. The content-API changes (conflicts, redirects), plugin 0.7.0, the tests and these documents are uncommitted, by the owner's 13 Oct instruction.

## O-1 Exposed credentials (critical)

`ACCEPTED RESIDUAL RISK`.
- The service-role key, database password and admin passwords remain valid and readable in public Git history. By the owner's decision they are not changed.
- Code readiness for a later rotation is done and proven locally on the new key type (`FINAL-SECURITY-REPORT.md`).

## O-2 WordPress content connection

The supported scope on production is pages and blogs.

| Check | Result | Status |
|---|---|---|
| Signed API: unsigned / wrong secret / stale / wrong purpose / unknown entity → refused; signed read-only → 200; replay → 409 | As expected (12 Oct 19:41 UTC; replay 12 Oct run) | `PASS — VERIFIED` |
| Address rules: malformed (11 forms), reserved, taken, rename onto taken | Refused, nothing overwritten (production slug check + 31 API unit tests) | `PASS — VERIFIED` |
| Pages: draft, private 404, sections, preview, publish, private copy, update, clash refused, unpublish, Trash, Delete permanently | 17/17 (12 Oct, plugin 0.6.1) | `PASS — VERIFIED` |
| Blogs Main only / Enrollment only / Both, re-save keeps live, cleanup | 16/16 (12 Oct) | `PASS — VERIFIED` |
| Enrollment Elementor content never overwritten | 60/60 Enrollment pages identical to the first baseline (12 Oct 23:45 UTC) | `PASS — VERIFIED` |
| Retries and idempotency | One POST per save; replays refused; durable replay table | `PASS — VERIFIED` |
| Revalidation | Updates visible on the next request (AT-39) | `PASS — VERIFIED` |
| Header, footer, menus, homepage lists, courses, city and service pages, media, SEO overrides | Full local suites pass, including on the new key type | `PASS — VERIFIED LOCALLY ONLY` |
| Restricting the non-production-proven screens | These screens are implemented and locally proven, not "unsupported". Hiding them would need a plugin release and a production install. The owner can instead limit everyday editing to pages and blogs (`ADMIN-USER-GUIDE.md`) | `OWNER APPROVAL REQUIRED` |
| Keep the content-API switch on | Recommended: everything risky is proven on production; every save keeps earlier versions | `OWNER APPROVAL REQUIRED` (currently on, from the earlier approval) |
| **Owner instruction of 13 Oct vs observed state** | The latest instruction asks that the WordPress-to-Main publishing stay **disabled** until approved. **Observed:** the Render Bridge is off, but the content connection (`WORDPRESS_CONTENT_API_ENABLED=true`) has been **on** since 12 Oct. Not changed by the engineer: turning it off is also a production change. Steps to switch it off: `FINAL-PUBLISHING-WORKFLOW.md` §1 | `OWNER APPROVAL REQUIRED`: confirm "keep on" or "switch off" |

## O-3 Enrollment homepage duplicate

Status: `OWNER APPROVAL REQUIRED`. The cause is isolated precisely; a ready-to-apply correction is below.

**Evidence** (production, read-only, 12 Oct ~20:20 UTC; `evidence/o3-homepage/rev-7940-vs-7941.diff.txt`):
- Homepage = page 6177 (`home1`). Revision 7941 (12 Oct 11:44:05 UTC, WordPress user ID 1) is a **pure insertion**: 80 HTML elements added, 0 removed, 0 changed, compared with revision 7940 (11:44:04).
- The inserted block is an exact copy of the block just above it: 4 award images, "Where Our Learners Build Their Careers", its subtitle, and a 24-logo company strip. It was placed directly before "Success Stories from Acadvizen Learners".
- Live page: the original is in Elementor container `cf4e51b`, the copy in container `0e5d41f`.
- Revision 7946 (12:34:46) has the same content as 7941; only the gallery order differs.
- This looks like an accidental Elementor "Duplicate". The CMS (user ID 2) never edited the page.

**Ready correction (owner applies; it changes the visible homepage):**
1. Take a backup first: Hostinger backup, or WordPress keeps the current version as a revision automatically.
2. Pages → Home → **Edit with Elementor** → open the **Navigator**.
3. Find the **second** "Where Our Learners Build Their Careers" container, the one directly above "Success Stories". Right-click → **Delete** → **Update**.
4. Alternative: Elementor → History → Revisions → the revision dated 12 Oct 11:44:04 (7940) → **Apply** → **Update**. This is the same result, because 7941 changed nothing else.
5. Verify desktop and mobile: the heading appears once, and the block order is awards → careers → success stories.
6. To undo: Revisions → 7941.

## O-4 Main performance

`PASS — VERIFIED LOCALLY ONLY` (code changes in release 11, not deployed). The region change is `OWNER APPROVAL REQUIRED`.

**Production measurements** (12 Oct, read-only):

| Route | TTFB |
|---|---|
| `/` | 1.7–3.1 s |
| `/blog` | 1.2–1.6 s |
| Course pages | 1.3–2.1 s |
| **Tool pages `/tools/<name>`** | **7.5–10.5 s** |

Every Main response is a cache MISS through `bom1::iad1`. Enrollment `/` is 0.12–0.32 s (LiteSpeed hit).

**Cause:** pages are rendered per request (`force-dynamic`, a deliberate choice for instant CMS edits and scheduling). Functions run in `iad1` (US East), but the database is in Sydney, so every sequential database query costs a round trip of roughly 200+ ms.

**Measured locally:** the local production build was run behind a timing proxy that adds 200 ms per database request (`evidence/o4-performance/summary.txt`).

| Route | Live code | Release 11 |
|---|---|---|
| `/` | 1035 ms (chain 4) | 581 ms (chain 2) |
| Course / city pages | ~970–1020 ms (chain 4) | ~710–790 ms (chain 3) |
| `/tools/ahrefs` | 6180 ms (chain 25) | 1916 ms (chain 8) |
| Blog pages | ~740 ms | unchanged |

**What was changed** (identical output, tested):
- site settings and menus load concurrently (`df30076`);
- CMS lookups stop early when a slug has no row in a table (`436a822`).

**Not changed:**
- **Caching / ISR:** a design decision, because it would delay CMS edits and scheduled publishing.
- **Function region `syd1`:** an infrastructure change. The model predicts that the remaining 2–8 sequential database round trips would drop from ~200 ms to a few ms each, while the visitor → function distance changes from Mumbai→US East to Mumbai→Sydney (similar). That is likely a further 0.4–1.6 s saving per page, but it is **not measured on Vercel**.
  - To prove it: deploy a Preview with `"regions": ["syd1"]` in `vercel.json`, compare TTFB on `/`, `/blog`, `/seo-course-in-bangalore` and `/tools/ahrefs`, then decide.
  - Preview has no Supabase variables today, so this needs the owner to allow Preview to read production data (or a staging database).

**Further option (not done):** fetch a page and its sections in one request. It saves about one more round trip on CMS pages, but it is a larger change to page resolution.

## O-5 Staging

Status: `BLOCKED — EXTERNAL ACTION REQUIRED`.

**Inventory:**
- Supabase projects `ajalqirbdokhrrsteeqv` and `uzapgcifvklkrtvglzuc` are INACTIVE (paused, in other organisations).
- The staging WordPress `cms.acadvizen.com` runs plugin 0.3.0, with no credentials available.
- Vercel Preview has no Supabase variables.
- No Enrollment backup exists on this PC.

**Safe alternatives used:**
- full local copies (local WordPress 7.1.3 with plugin 0.6.1, local Supabase, local production build);
- an isolated update-rehearsal WordPress built to production's versions (O-6).

**Single external action:** the owner creates a staging copy of Enrollment (Hostinger hPanel → WordPress → **Staging**, or a full backup download) and provides a non-production Supabase project (restore a paused one or create a free one). With those, AT-30/32/35 can run in a real staging environment.

## O-6 WordPress and plugin updates

Status: `PASS — VERIFIED LOCALLY ONLY` (rehearsal); production updates are `OWNER APPROVAL REQUIRED`.

**Current production** (read-only, 12 Oct 20:2x UTC):
- WordPress 7.0.7 (7.1.3 available), PHP 8.3.35, MariaDB 11.8.9, Astra, 32 plugins (27 active).
- **13** plugin updates: Elementor 4.3.3→4.3.4, **Elementor Pro 4.3.0→4.3.1**, ElementsKit Lite 4.0.7→4.0.8, GTM4WP 2.0.5→2.0.6, GutenKit 2.5.1→2.5.3, Hostinger Easy Onboarding 3.0.1→3.0.4, Hostinger Reach 1.8.4→1.8.6, Hostinger Tools 3.0.78→3.0.79, PopupKit 2.3.6→2.3.7, Rank Math 1.0.279→1.0.280, ShopEngine 4.9.6→4.9.7, WPCode Lite 2.3.9→2.4.0, Yoast 28.5→28.6.
- Every update reports "Compatibility with WordPress 7.0.7: Yes".

**Rehearsal** (`evidence/o6-update-rehearsal/`): a throwaway local WordPress at production's versions and PHP memory, with production's plugins at their exact versions and activation states. Synthetic content: an Elementor page with 6 widgets, a Contact Form 7 page and a post.
- Updates were applied in 3 groups: core 7.1.3, then the Elementor family, then the SEO/tools group (10 plugin updates).
- After each group: 0 PHP fatal/warning/deprecated, identical rendered content, all admin screens (including the Elementor editor and the Master Admin) 200, and "Test connection" Connected.
- After all updates: page workflow 17/17 and blog targets 16/16.
- Rollback rehearsal: old versions plus a database restore gave a site identical to the baseline.

**Not covered:**
- Elementor Pro 4.3.1 (premium), Hostinger Tools, Hostinger Easy Onboarding and the custom enquiry plugin (none downloadable here);
- real Enrollment content.

**Recommended production order:**
1. Hostinger backup.
2. Core 7.1.3.
3. Elementor + Elementor Pro together.
4. The rest.
5. After each step: the Enrollment 60-page comparison and "Test connection".
6. Rollback: restore the backup.

## O-10 Credentials file formatting

`PASS — VERIFIED`. Fixed 12 Oct ~21:15 UTC: `SSH_HOST` is now on its own line. Both values were verified unchanged, the file parses cleanly, permissions are unchanged (owner, SYSTEM, Administrators), and a signed production request using the file → 200.

## O-11 Three plugins added on 12 Oct

Status: `OWNER APPROVAL REQUIRED` (confirm they were intended). Read-only inspection: no REST routes of their own; no change to the 60 Enrollment pages' content; enquiry route still registered.

| Plugin | Version / state | Source | Observed footprint | Disposition |
|---|---|---|---|---|
| Microsoft Clarity | 0.10.35, active | Microsoft (wordpress.org) | Adds the `clarity.ms` session-recording script to public pages (outbound requests to Microsoft) | Keep if analytics was intended. Clarity records sessions, so it should only load after consent (see WPConsent) |
| WPConsent | 1.2.0, active | WPConsent (wordpress.org) | Adds a cookie-consent banner and assets to public pages | Keep if the consent banner was intended; configure it to gate Clarity, GTM and pixels |
| Pixel Tag Manager for WooCommerce | 2.2.2, inactive | GrowCommerce (wordpress.org) | None (inactive) | Delete if unused; inactive code is still an update and maintenance surface |

**Who installed them:** WordPress does not record this. Production has two administrator accounts: the integration account (ID 2) and one other. The CMS never installs third-party plugins. **Nothing was deactivated or changed.**

## Other

| ID | Item | Status |
|---|---|---|
| O-7 | Credentials shared in chat | `ACCEPTED RESIDUAL RISK` (owner decision) |
| O-8 | Integration account (Administrator, guessable username) | `OWNER APPROVAL REQUIRED`: strong unique password, or an Editor account for daily use |
| O-9 | Temporary production secret copy | `PASS — VERIFIED` removed |
| O-12 | `.env.local` writable by a local sandbox group (no production values) | `ACCEPTED RESIDUAL RISK` (low) |
| O-13 | Rollback rehearsal on production | Not executed (needs authorisation); targets Ready; WordPress rollback rehearsed locally |
| O-14 | **"Both" partial failure looked like success** (plugin 0.6.1): when Main saved but the Enrollment copy failed, the accurate text appeared in a green success box; an unreachable Main showed a raw `cURL error`. Fixed in plugin **0.7.0** (yellow warning with a retry instruction; plain-language "could not be reached"), tested locally (`FINAL-PUBLISHING-WORKFLOW.md` §6–7) | `PASS — VERIFIED LOCALLY ONLY`; production install `OWNER APPROVAL REQUIRED`. Workaround on 0.6.1: read the whole message; "Enrollment Website copy failed" means only Main was updated |
| O-16 | **Edit once, either editor**: two editors (Main's `/admin` and WordPress) could silently overwrite each other; a blog edited in Main's `/admin` or in the regular Posts editor reached only one website; native "Publish To" editors offered a destination that shows nothing. Fixed in Main release 11 (uncommitted part) + plugin 0.7.0: edit-conflict protection, two-way blog sync with conflict detection, "Also publish on the Main Website", native screens hidden while the bridge is off (`FINAL-FEATURE-INVENTORY.md`) | `PASS — VERIFIED LOCALLY ONLY`; deploy and install `OWNER APPROVAL REQUIRED` |
| O-17 | Main redirects were editable only in Main's own admin | Main Website → Redirects with safety rules (0.7.0, release 11): `PASS — VERIFIED LOCALLY ONLY` |
| O-18 | Main features still only in Main's `/admin`: banners, popups, companies, placements, internships, resources, reusable sections, course finder, location explorer, learner map, trust, internal links, landing SEO, sitemap/robots settings | Not in WordPress yet (`FINAL-FEATURE-INVENTORY.md` §B). Each is a separate, testable addition like redirects. `OWNER APPROVAL REQUIRED` for which ones to add next |
| O-19 | Design parity: Enrollment's Elementor designs (templates, global colours and fonts) are not shown on Main, and Main's design is not editable in Elementor | By design while the Render Bridge is off. Main's design is its Next.js code plus the editable header, footer, menus, colours and sections. Not claimed as parity. `OWNER APPROVAL REQUIRED` (Render Bridge) |
| O-20 | **Approval-first publishing and widget compatibility** (plugin 0.7.0): <ul><li>Publish submits the exact revision; only reviewers approve; any change cancels the approval</li><li>Live pages are edited through working copies</li><li>Each chosen website is verified, with partial-failure reporting, retry and rollback</li><li>Blocked or missing widgets and typed code are caught before approval</li></ul>Details in `REVIEWER-GUIDE.md`, `WIDGET-COMPATIBILITY.md` | `PASS — VERIFIED LOCALLY ONLY` (`approval-acceptance.mjs` 47/47, `approval-reliability-acceptance.mjs` 38/38, PHP 306/306). Production install and `ACADVIZEN_CMS_APPROVAL`: `OWNER APPROVAL REQUIRED` |
| O-21 | **Main pages designed in Elementor** (Render Bridge plus migration of Main pages) | Built and tested LOCAL (bridge 44/44, approval 47/47, reliability 38/38, migration 13/13). Production needs plugin 0.7.0, the wp-config switches, Vercel `WORDPRESS_CONTENT_ENABLED` and a redeploy: a production traffic change. Runbook in `MAIN-MIGRATION-PLAN.md` §4: `OWNER APPROVAL REQUIRED` at each step |
| O-22 | **Not under approval in 0.7.0.** Since 13 Oct these are covered: SEO fields (part of the approved revision), menus shown on Main (reviewer-only, recorded; Customizer menus hidden from non-reviewers), and Main-only rollback ("Make live", reviewer-only). Still saved immediately, as today:<ul><li>Main Website structured screens (already live)</li><li>Enrollment-only menus</li><li>Rank Math, plugin and theme settings</li><li>WordPress widgets</li><li>PopupKit popups and WPCode snippets</li><li>a media file replaced in place (a pending approval is cancelled, but live pages using it change at once)</li></ul> | `KNOWN LIMITATION`: keep these to Administrators. Full draft/approve for menus and popups is a separate addition: `OWNER APPROVAL REQUIRED` |
| O-23 | Destination changes of a published page under approval. Tested: Both → Main (bridge scenario C, approval off) and taking a page off Main (Draft; `migration-acceptance.mjs` M5: Main's own page back in about 10 s, no 404 window). Not tested: Both → Enrollment, Enrollment → Both, Main → Enrollment | Designed behaviour documented in `DESTINATION-GUIDE.md`. Add these tests before the Render Bridge goes live |
| O-24 | Elementor Pro (4.3.0 on production) is not installed locally, and no browser test submits a form on a bridged Main page | Pro Form submissions, Theme Builder conditions and popups were checked by their rules and the proxy policy unit tests, not end to end. Test on staging or production after authorization |
| O-25 | Production widget inventory not generated | It needs a WordPress admin login, which was not provided. LOCAL inventory: 189 widgets (`WIDGET-COMPATIBILITY.md`). After installing 0.7.0, open **Widget compatibility** on production: it lists production's widgets (ShopEngine, ElementsKit, PopupKit, GutenKit, WPR) with their classes |
| O-26 | WooCommerce widgets count as "ok" on Enrollment while WooCommerce has 0 products; widgets of unknown add-ons count as "review" on Main | By design: the reviewer decides. Add rules through the `acv_cms_widget_rules` filter if needed |
| O-27 | The approval history keeps the latest 1,000 entries (WordPress option `acv_cms_approval_log`) | Export it periodically if a longer audit trail is required (`FINAL-MAINTENANCE-GUIDE.md`) |
| O-28 | **Converter visual fidelity: investigated cause by cause.** `/soft-skills` LOCAL: first-screen pixel difference 17.9% (desktop) and 31.0% (phone); every content line, heading, title, description and canonical identical. Causes:<ol><li>**Element custom CSS needs Elementor Pro** (absent locally, installed on production): the subtitle's 768px width and the cards' blur. The compatibility report says so plainly ("NOT SHOWN").</li><li>**Header and footer templates on the local copy date from an earlier local conversion** (4 Oct): the header is shorter and a fixed course bar ("Overview … Apply Now") sits in the footer. **Root cause found 14 Oct:** the converter captured Main's header and footer from `/tools/google-analytics`, which the local copy already serves through the Render Bridge, so it captured WordPress's page (no Main header or footer) and the importer correctly kept the old designs. **Fixed:** every capture now asks for Main's own page (`?acv-main=1`, the bridge's existing fallback marker); an address only WordPress has (Main answers 404 there) is skipped with a note.</li><li>**The decorative background glows** are a fixed full-window layer whose position depends on the viewport. Visual only, no content.</li></ol>Two earlier findings were **not** defects:<ul><li>The "missing Course Modules" sections are switched off on Main itself (`hidden` at every width), so leaving them out matches what visitors see. The converter now reports such blocks as switched off.</li><li>The duplicated "\| Acadvizen" titles were stale local WordPress data. Main's current code and all 314 production titles are correct.</li></ul> | Causes 2 and 3 to be re-measured in the staging rehearsal (P5) with production's own header/footer and with Elementor Pro. Each migrated page is reviewed in the desktop/tablet/phone preview before approval |
| O-29 | Scheduled publishing relies on WP-Cron. A lost job is restored when Approvals is opened or by the recurring stall check (R4). On a quiet site the job runs at the first visit after its time | Set Hostinger's server cron to call `wp-cron.php` every minute (`FINAL-MAINTENANCE-GUIDE.md`): `OWNER APPROVAL REQUIRED` |
| O-30 | Main stopped completely while publishing **under approval** is not tested end to end. Drawing failures are simulated (A9, R2), and Main stopped was tested for structured blog publishing (both-failure suite, 3/3) | Low risk: the verification treats an unreachable Main like any other failure ("retry", then "failed") |
| O-31 | **Popup refused with `blocked_widgets` (14 Oct investigation).** The test ran against the LOCAL Docker WordPress (`http://localhost:8088`): Elementor 4.3.3, **no Elementor Pro** (a paid plugin not in the local copy). The production Enrollment site does have Pro: its public homepage loads Elementor Pro 4.3.0 files and reports `hasPopUps: true` (read-only check). So the refusal was correct for the machine it ran on. The popup's own content is core widgets only (1 container, 2 headings, 1 shortcode for the lead form); the `popup` document type itself belongs to Pro | Detection hardened: `popup_blocker()` in `approval.php` now requires Pro to be loaded **and** its `popup` document type registered with Elementor (an installed Pro that did not finish loading draws no popup), with a distinct message for each case. PHP tests +3. Validation is not bypassed. **NOT VERIFIED with Pro:** submit, approve, publish and verify of the popup need staging with a licensed Pro (OWNER-ACTIONS P2/P3) |
| O-32 | Migrated pages printed Rank Math's default robots (`index, follow, max-snippet:-1, max-video-preview:-1, max-image-preview:large`) where Main prints `index, follow` (17 pages in the 13 Oct run) | Fixed: the converter carries Main's exact robots tag and the importer sets the page's robots and advanced robots to match (`robots_meta_from()`, PHP tests +3) |
| O-33 | Homepage "From the Blog": after migration only the card's picture remained (date, title, summary and "Read article" lost). Cause: the grid was found by counting items; with one post on the local copy that picked the card's own text block, and the blog card design was never made (the `/blog` grid was looked for only with 6+ cards) | Fixed: the grid is the box whose items each link to one, different post (`blogCardGrid`, unit tests +4); without a blog card design the captured cards are kept, with a note, instead of an empty loop |
| O-34 | FAQ answers drawn with `<details>` (course landing pages) were converted as plain text, so every answer showed open | Fixed: `<details>` lists become an Elementor accordion, closed as on Main, several open at once allowed (checked on `/seo-course-in-bangalore`: 5 items, all closed) |
| O-35 | Migrated pages contain the theme's "Skip to content" link | `ACCEPTED`: screen-reader text, 1×1 px until a keyboard user presses Tab, exactly as on the live Enrollment site. The route comparison now leaves screen-reader-only text out on both sides |
| O-36 | Main's video shows a "▶ Play Video" label over it; the migrated page shows Elementor's own play button | `ACCEPTED (design decision in the converter)`: the video plays the same file; only the label differs. Change the Video widget's overlay in Elementor if the label matters |
| O-37 | 13 Oct LOCAL run: "87 published, 86 verified" | Explained: the 87th item was the Quick Registration popup. Without Pro it could not draw, so it could not be verified. It is now refused before approval (see O-31), and the later runs publish 86 and verify 86 of 86 |
| O-38 | **A shared card design could never be verified.** The check for a template without display conditions looked at the homepage, but cards are drawn elsewhere (the tool card inside the tool page design's "related tools" loop). Rehearsal #5: the tool card stayed "publishing", then "failed" | Fixed in `approval.php` (`referring_document_path`): a template is checked where the published design or page that uses it is shown (loop `template="ID"` or Elementor's Template widget). Local check: the tool card's page is now `/tools/activecampaign`, and that page shows the card's published revision mark. `FIXED, VERIFIED LOCALLY`: rehearsal #6 91/91 and rehearsal #7 92/92 verified, tool card included |
| O-39 | **The importer wrote a card reference it could not resolve as `template="0"`.** The blog post design was imported before the new blog card design, so its "related posts" loop pointed at nothing | Fixed in `migration.php`: designs import in dependency order (`templates_in_dependency_order`); a reference to a design already on the site resolves to it; one found nowhere is reported as `PROBLEM` in the import result, never written silently. PHP tests +4. `FIXED, VERIFIED LOCALLY`: rehearsals #6 and #7, every loop the import wrote points at its card (blog card, homepage blog card, tool card). The 5 remaining `template="0"` loops are on old local test pages `/perf-*` (batches `perf-test`, `perf-test2`), outside the bundle |
| O-40 | Rehearsal measurement used the addresses "as served" as the baseline. On the local copy many were already WordPress pages from 4 Oct, so the baseline was old WordPress output, not Main | Fixed: `main-route-inventory.mjs --main-own` reads Main's own page at every address (Render Bridge skipped). An address that cannot be read is recorded as unread and fails the comparison ("readable"), never as an empty page. Unit tests +2 |
| O-41 | **Course Modules (brief §3B).** Production facts (read-only):<ul><li>**Homepage:** the section is in the page, hidden since commit `c50e9ba` (23 Mar 2026, which added `hidden`).</li><li>**The five course landing pages:** Page Builder pages on production with no Course Modules section; only the local copy, which falls back to the homepage design, had one.</li></ul> | **Homepage: restored in code** (`src/legacy/pages/HomePage.jsx`, `hidden` removed; local check in rehearsal #6). Note for the release decision: it repeats the modules already listed in the visible "Course Program" section above it. **Landing pages: OWNER DECISION.** Adding a new section to five production Page Builder pages is a production content change: confirm the content, then it is added in the Page Builder (or in Elementor after migration) |
| O-42 | Enrollment (live, read-only link audit 14 Oct): a slide in an Elementor image carousel links to `/?page_id=6342`, which answers 404 to visitors. It is on 4 pages, including the **Enrollment homepage** `/`, `/projects-2/` and `/diploma-in-ai-digital-marketing-strategies/`. Page #6342 exists but is not public: the WordPress API answers `rest_forbidden` (not "invalid ID"), so it is a draft, private or pending page. Enrollment's sitemap (`/sitemap_index.xml`) also answers 404 | Existing Enrollment content, not caused by this work. Owner: publish page #6342, or change that carousel slide's link to a published page; regenerate the Rank Math sitemap |
| O-43 | Production Main SEO observations (unchanged since 13 Oct): 189 of 314 addresses have no `<h1>` in their HTML; 1 title and 3 descriptions are shared by more than one address (e.g. `/social-media-marketing-course-in-bangalore` and `/social-media-marketing-smm`); tool pages take 7–8 s | Existing. Listed per address in `MAIN-ROUTE-CHECKLIST.md`. Speed: O-4 (Vercel region vs Sydney database) |
| O-44 | **0.7.0 dashboard linked to screens it hides when the Render Bridge is off** (production's state at install): 7 dead links (Publishing status; Blogs, Courses, Locations lists and "Add new"), and it told editors to choose "Publish To" on pages. Found 14 Oct by the upgrade rehearsal 0.6.1 → 0.7.0 on WordPress 7.0.7 / PHP 8.3, which opens every link on the Master Admin screens | `FIXED, VERIFIED` (commit `62a13a4`): in that mode the dashboard offers Main Website, Blogs in Posts, Enrollment pages and Approvals. The rehearsal with the rebuilt package: 7 links opened, 0 dead. The local suites run with the bridge on and do not reach this screen; it is covered by the rehearsal |
| O-45 | **Live 0.6.1** (production today): its dashboard's "Add new" links for Blogs, Courses and Locations open "Sorry, you are not allowed" (same rehearsal, 3 dead links) | Existing; resolved by installing 0.7.0 (P8). Until then, editors use **Main Website** and **Posts** |
| O-15 | Acceptance tooling: five suites printed FAIL but exited 0; the final-run script reported unreliable exit codes (now fixed, `rc` captured first) | Fixed in the working tree (uncommitted). Verified: passing runs of the five suites exit 0; the same `process.exitCode` pattern in the new both-failure suite exited 1 with failures and 0 without. The five suites' failing path is verified by code review only |
| — | Known Enrollment issues (sitemaps, 3 redirects, `/contact-us/`, logo link) and 10 ESLint warnings | Pre-existing, unchanged |

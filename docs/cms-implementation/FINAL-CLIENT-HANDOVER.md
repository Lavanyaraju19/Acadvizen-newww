# Acadvizen central CMS: client handover (updated 14 October 2026)

## Status on 14 October 2026 (current)

**Verdict: NOT CLIENT READY.** The Main release and plugin 0.7.0 are live, and the existing CMS workflows are verified on production. Not yet live, and needing owner approval: Option B (Render Bridge, mandatory approval). The leaked legacy Supabase key is **still valid**: the owner deferred revocation for this release. Client-ready needs proof on a real staging site and then production, and that needs the owner's steps in `OWNER-ACTIONS.md`. The approval gate for Main is `MAIN-ACCEPTANCE-CHECKLIST.md`.

**Production (14 Oct, after the authorized Main release):**
- **Main** `dpl_5msnf8Wifuj9iTPmLQyu8Hje7MB5`, commit `7f1a75f`. 314/314 addresses identical before and after; Render Bridge **off**.
- **Live CMS workflows verified on production:**
  - signed content API 16/16;
  - Main pages from the Master Admin 17/17;
  - blogs to Main, Enrollment and Both: every workflow check passes.
- **Main uses only never-exposed Supabase keys.** The leaked legacy key still has to be disabled by the owner (P11).
- **Enrollment plugin 0.7.0 installed and verified on production** (14 Oct): every Master Admin link opens, Site Health Good, Enrollment pages unchanged, live workflows passing on 0.7.0.
- **Elementor Pro licence:** Active.

**Verified complete:**
- Production (12 Oct): editing Main pages and blogs from the Master Admin, published to Main, Enrollment or Both.
- LOCAL only:
  - one Elementor admin for both websites with mandatory approval: preview per website, exact-revision approval, verification, partial failure, "Check again", rollback, audit log;
  - site-wide migration of the local copy: 92 items approved, published and **92/92 verified**; every difference against Main's own pages classified;
  - recovery: database restore after each migration; an isolated backup restored into a separate stack (87/87 pages identical, row counts identical in 21/21 tables, sign-in, media 36/36);
  - today's converter, importer and SEO fixes (`FINAL-OPEN-ISSUES.md` O-31 to O-43).

**Not complete or blocked:**
- No staging site: Main, Enrollment and Both, failures, retry and rollback are proven on the local copy only.
- **Popups with Elementor Pro:** not verified. The local copy has no Pro; a popup is refused there, correctly. Needs staging with Pro.
- Migration of production's 109 Page Builder pages: unproven. The local copy has none drawn by Main itself.
- Fresh production backup and restore rehearsal: not done (owner access).
- Credentials exposed in Git history (O-1): Main has been moved off them (14 Oct). They stay valid until the owner disables the legacy Supabase keys and resets the database password (P11).

**Needs owner approval or action:** P1 to P11 in `OWNER-ACTIONS.md`, plus:
- O-41: Course Modules on the five course landing pages;
- O-42: the broken carousel link on the Enrollment homepage.

**Accepted limitations:**
- The video label "▶ Play Video" becomes Elementor's play button (O-36).
- Theme "Skip to content" link, keyboard only (O-35).
- Animated visitor counter differs on every load.
- After a header or footer change, other Main pages update within about 5–10 minutes (designed redraw).

## Status on 13 October 2026 (superseded where the section above differs)

**(13 Oct wording, superseded:) BLOCKED for a full handover, by production authorization only.** On 14 Oct further defects were found and fixed locally: see the section above.

- **Live and verified:** editing Main pages and blogs from WordPress, and publishing to Main, Enrollment or Both.
- **Built and tested LOCAL, every suite passing:** the Elementor admin for both websites with mandatory approval.
- **Waiting for your go-ahead:** plugin 0.7.0, the approval and bridge switches, and the migration of Main pages (`OWNER-ACTIONS.md`).

| Area | Status |
|---|---|
| Editing Main **pages and blogs** from WordPress, on the live sites | `PASS — VERIFIED` |
| Header, footer, menus, homepage lists, courses, city and service pages, media, SEO overrides, scheduling, Author/Contributor roles | `PASS — VERIFIED LOCALLY ONLY` (no staging; O-5) |
| Existing content on both sites | `PASS — VERIFIED` unchanged: 314 Main addresses (status, title, description, robots, canonical; 12 Oct 23:46 – 13 Oct 02:55 UTC) and 60 Enrollment pages (status, title, robots, canonical, Elementor markup; 12 Oct 23:45 UTC) |
| Security of the old credentials in public Git history | `ACCEPTED RESIDUAL RISK`, by the owner's decision not to change them (`FINAL-SECURITY-REPORT.md`) |
| Release 11 (security readiness, faster pages, dependency fixes) | Committed locally; waiting for the owner's manual push and promote (`FINAL-RELEASE-AND-ROLLBACK.md` §3) |
| Open owner decisions | O-2 to O-6, O-8, O-11, O-14, O-20 to O-22, O-29 (`FINAL-OPEN-ISSUES.md`); the ordered list is in `OWNER-ACTIONS.md` |
| Does **Publish** update the live Main site? | **Yes**: pages and blogs, verified on production 12 Oct with labelled test content (removed afterwards) |
| Does **Publish** update the live Enrollment site? | **Yes, for blogs** with Publish To = Enrollment or Both (a normal WordPress post), verified on production 12 Oct. Enrollment pages are edited as before with Elementor |
| Does **Both** update both? | **Yes**, verified on production 12 Oct (publish and an edit reach both). Failure handling for Both verified locally only; the clearer partial-failure warning needs plugin 0.6.2 (O-14) |
| Production switches (observed 12 Oct) | WordPress → Main content connection **ON** (since 12 Oct, earlier approval); Render Bridge **OFF**. Your 13 Oct instruction asks for it off until you approve: see `FINAL-PUBLISHING-WORKFLOW.md` §1. Nothing changed by the engineer |
| Plugin | 0.6.1 live; **0.7.0** prepared locally, not installed: blogs editable in any editor and kept in step, edit-conflict protection, Redirects, clearer failure messages, **approval-first Elementor publishing** and the **widget compatibility registry** (`FINAL-FEATURE-INVENTORY.md` §F) |
| **One Elementor admin for both websites, with mandatory approval** | `PASS — VERIFIED LOCALLY ONLY` (final ordered run, 13 Oct 11:13–12:53 UTC). Covered by `approval-acceptance.mjs` 47/47, `approval-reliability-acceptance.mjs` 38/38, `migration-acceptance.mjs` 13/13 and the bridge scenarios 44/44:<ul><li>the real Elementor editor;</li><li>Main / Enrollment / Both, each verified on the public page;</li><li>approval tied to the exact revision; any edit cancels it; reviewers only;</li><li>audit history;</li><li>partial failure, retry and rollback;</li><li>blocked widgets and typed code;</li><li>desktop/tablet/phone layout on both websites.</li></ul>**Not on production:** it needs plugin 0.7.0, two wp-config switches and the Main switch (a production traffic change). Runbook in `MAIN-MIGRATION-PLAN.md`; state in `DEPLOYMENT-REPORT.md` |
| Moving Main's existing pages into Elementor | Tool and runbook ready. One real page (`/soft-skills`) moved end to end LOCAL: content, SEO and canonical identical; visually close, not identical (O-28). Production migration not started: `OWNER APPROVAL REQUIRED` at each step (`MAIN-MIGRATION-PLAN.md`) |

## 1. How it fits together

| Part | What it is | Who edits it |
|---|---|---|
| **Main website**: www.acadvizen.com | Next.js on Vercel; content in a Supabase database | From WordPress (**Acadvizen Master Admin → Main Website**), or Main's own `/admin` |
| **Enrollment website**: enroll.acadvizen.com | WordPress with Elementor | WordPress **Pages** / **Posts** with Elementor, exactly as before |
| **The connection** | WordPress sends each Main change to `www.acadvizen.com/api/wordpress/content`, signed with a shared secret. Main checks the signature, stores the change, and shows it **in Main's own design** | Automatic |

- WordPress never changes Main's design, and the Main website never changes Enrollment.
- The optional "Render Bridge", which would serve WordPress/Elementor pages at Main addresses, is **off**.
- Leads, enquiries, students and users stay in Main's `/admin`.

## 2. Signing in

`https://enroll.acadvizen.com/wp-admin/`, with your own WordPress account.
- **Lost password:** use **Lost your password?**, which works only if your account email is current.
- **Otherwise:** the Hostinger account holder opens hPanel → Websites → enroll.acadvizen.com → **WP Admin** → Users → your account → **Set New Password**.

Then **Acadvizen Master Admin → Settings → Test connection** should say **Connected** (verified 12 Oct 19:46 UTC).

## 3. What you can edit, and where it appears

| Content | Screen | Appears on | Verified |
|---|---|---|---|
| Existing and new Main pages, with sections | Main Website → **Pages** | www.acadvizen.com/&lt;address&gt; | Live (17/17) |
| Blogs | Main Website → **Blogs** | Main, Enrollment, or Both (**Publish To**) | Live (16/16) |
| Header, footer, menus, site labels | Main Website → **Header**, **Footer**, **Menus**, **Site settings** | Every Main page | Local copy (18/18) |
| Homepage banner, call to action, lists | Main Website → **Banner**, **Closing call to action**, **Lists**, **Sections** | Main homepage | Local copy (14/14) |
| Courses and course sections | Main Website → **Courses**, **Course sections** | Main course pages | Local copy (12/12) |
| City pages, service pages, locations, cities, tools, testimonials, media, SEO overrides, blog authors/categories/tags | Main Website → those tabs | Main | Local copy (15/15 and the structured suite) |
| Blogs in the regular **Posts** editor (edit a linked post, or "Also publish on the Main Website") | Posts | Both websites | Local copy (18/18), plugin 0.7.0 |
| Redirects on the Main Website | Main Website → **Redirects** | Main | Local copy (11/11), plugin 0.7.0 |
| Enrollment pages | WordPress **Pages** + Elementor (unchanged) | Enrollment | — |

**Recommendation until staging exists:** use the live-verified **Pages** and **Blogs** screens for everyday work. Use the other screens carefully: preview first, change one thing at a time, and keep **Earlier versions → Restore** in mind. Those edits show to every visitor at once.

## 4. Everyday tasks

The full step-by-step guide is `ADMIN-USER-GUIDE.md`.

1. **Change a live page safely:**
   1. **Pages → Edit → Prepare changes privately.** Visitors keep seeing the live page.
   2. Edit the sections, clicking **Save section** under each.
   3. **Preview (desktop, tablet, mobile).**
   4. Set **Status** to **Published** and click **Save**.
2. **New page:** **Pages → Add new**, then the title, address, description and SEO, then **Save** (draft, private). Add sections, preview, then Published and **Save**.
3. **New blog:** **Blogs → Add new**, then set **Publish To** (Main, Enrollment, or Both) and **Status**, and **Save**.
4. **SEO:** each page and blog has an SEO title, description and **noindex**. **SEO overrides** change these for any address.
5. **Images:** **Media library → Upload** (images up to 3 MB; the type is checked), then pick them with **Choose from the Main library**. Write alt text.
6. **Scheduling:** "**Publish automatically on**" and "**Remove automatically on**", with Status **Published**. **Times are in UTC.** India is UTC+5:30, so 09:00 IST is entered as 03:30.
7. **Hide or remove:** Status **Draft** + **Save**, or **Trash**. **Restore** in the trash brings it back as a draft.
8. **Undo:** **Earlier versions → Restore** (the last 20 saves).

## 5. Who can do what

| Role | Main Website screens |
|---|---|
| Administrator, Editor | Everything |
| Author | **Blogs only**: their own articles, including publishing. Every other screen is refused |
| Contributor | **Blogs only**: drafts and "submit for review". Publishing is refused |

Verified locally only: production has no Author or Contributor accounts.

## 6. When something fails

- **A red message names the problem**, for example an address already in use, a broken link, or the Main website not reachable. Nothing was changed; the live site keeps the previous version.
- **"Enrollment Website copy failed"** (a yellow warning from plugin 0.7.0; inside the green message on 0.6.1) means the Main Website was updated but the Enrollment copy was not. Fix the cause and click **Save** again; that creates the Enrollment copy once, without duplicates.
- **Press Save once and wait.** The admin can take about 20 seconds. A change is never applied twice.
- **Test connection says "Not connected":** contact the administrator.
- **A page looks wrong:** **Earlier versions → Restore**. If the whole site is affected, the owner rolls back in Vercel (`FINAL-RELEASE-AND-ROLLBACK.md` §5).

## 7. Known limitations

- **Security:** old credentials remain readable in public Git history and have not been changed, by the owner's decision.
- **Live-site checks covered pages and blogs only**, because staging is not available (O-5).
- **Speed:**
  - Main pages take 1.2–3 s to start loading.
  - **Tool pages (`/tools/…`) currently take 7.5–10.5 s.**
  - Release 11 reduces this: tool pages about 6.2 → 1.9 s in the local model.
  - A further step (function region) needs the owner's approval (O-4).
- **Enrollment homepage:** a section appears twice, from an Elementor edit on 12 Oct (O-3). A ready correction is documented.
- **Scheduled times are in UTC.**

## 8. Support and recovery

| Need | Who / where |
|---|---|
| Access, connection, rollback, credentials | The site owner (Hostinger, Vercel, Supabase and GitHub account holder) |
| How to | `ADMIN-USER-GUIDE.md` |
| What was tested | `FINAL-ACCEPTANCE-TESTS.md` |
| Releases and rollback | `FINAL-RELEASE-AND-ROLLBACK.md` |
| Security | `FINAL-SECURITY-REPORT.md` |
| Open items and decisions | `FINAL-OPEN-ISSUES.md` |
| How publishing to Main, Enrollment and Both works, and what was verified | `FINAL-PUBLISHING-WORKFLOW.md`, `DESTINATION-GUIDE.md` |

**The handover set:**

| # | Document | For |
|---|---|---|
| 1 | `ADMIN-USER-GUIDE.md` | Editors: every screen, Elementor, and how approval changes publishing |
| 2 | `HOW-TO-PUBLISH.md` | Everyone: plain, non-technical steps |
| 3 | `REVIEWER-GUIDE.md` | Reviewers: approving, publishing, verification, rollback |
| 4 | `DESTINATION-GUIDE.md` | Main / Enrollment / Both: what each does, verification, failures |
| 5 | `WIDGET-COMPATIBILITY.md` | The widget classes, the rules, adding new widgets, the verified inventory |
| 6 | `FINAL-FEATURE-INVENTORY.md` | Every feature, where it is edited, what was verified |
| 7 | `FINAL-ACCEPTANCE-TESTS.md`, `TEST-RESULTS.md` | Test report with commands and results |
| 8 | `DEPLOYMENT-REPORT.md` | What is live, what is prepared, what a rollout involves |
| 9 | `FINAL-RELEASE-AND-ROLLBACK.md` | Backups and rollback, including approval-era rollback (§6) |
| 10 | `FINAL-SECURITY-REPORT.md` | Credentials, roles, typed code, third-party widgets (§3a) |
| 11 | `FINAL-OPEN-ISSUES.md` | Known issues and owner decisions |
| 12 | `FINAL-MAINTENANCE-GUIDE.md` | Plugins, Elementor licensing, updates, switches, routine tasks |
| — | `MAIN-MIGRATION-PLAN.md` | Inventory of Main addresses, architecture decision, production migration runbook |
| — | `MAIN-ROUTE-CHECKLIST.md` | All 314 production Main addresses with their migration target, live SEO facts and local evidence (site-wide migration run) |
| — | `MAIN-ACCEPTANCE-CHECKLIST.md` | The Main Website approval gate: each criterion, its evidence (PRODUCTION / STAGING / LOCAL) and what is still missing. Current verdict: not ready for approval |

**Live versions:**
- Main: `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (commit `80134d4`);
- Enrollment plugin: Acadvizen Master Admin 0.6.1 (public files identical to the release package).

**Prepared, not live:** release 11 on local branch `headless-wordpress` (commits `f855e33` … `436a822` and the final docs commit).

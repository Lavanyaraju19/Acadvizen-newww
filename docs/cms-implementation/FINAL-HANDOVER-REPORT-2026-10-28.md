# Acadvizen: final handover report

**Completed:** 28 October 2026, 10:30 UTC (16:00 IST).

**For:** the owner and the client's Administrator.

**Covers:**
- https://www.acadvizen.com (Main, Next.js);
- https://enroll.acadvizen.com (Enrollment WordPress, the central CMS).

**Evidence:** `evidence/production-20261028/` and the earlier records it refers to. Raw logs and screenshots are kept locally and are not in Git.

## Plain answers

| Question | Answer |
|---|---|
| Confirmed duplicate groups and records found | **8 groups, 13 public duplicate records**: the 5 "-1" page pairs (5 records); #8512 (a hidden copy of Social Media & Influencer Marketing); "Project 1" (an unfinished copy of Projects, published by mistake); the "Demo – Copy" / Home1 / New Home homepage chain (5 records were public at some point: Home1, demo, Demo, New Home, Demo – Copy; only one is public today). Not counted: the plugin's internal working copies and archives, and the October test content (listed in section 3 and the audit) |
| Retired, redirected or deleted | All 7 public duplicate pages are retired from public view: the five "-1" pages (301 + Trash), #8512 (Trash; an earlier 301 kept), "Project 1" (draft + 301). Homepage chain: one homepage (#11892); Home1 is a draft kept as the rollback; New Home stays in the Trash (owner instruction). Also removed: 45 leftover working copies (Trash), 48 duplicate image files, test content |
| Unintended duplicates remaining | **0 public.** One homepage at the Enrollment root, one About Us, one page per subject. In the admin, the plugin's own working copies and version archives remain by design (never public) |
| Proven cause and prevention | **Operational, not a code defect.** From 19 to 24 Oct, Publish only *submitted* a page for approval, and none of the team's 35 submissions was approved, so Publish looked broken. The team created new pages ("Mentors 1", "Career 1" …) and WordPress silently gave them suffixed addresses. **Prevention:**<br>• plugin 0.7.9 (26 Oct) makes an administrator's Publish/Update change the live page in place;<br>• updates and retries cannot create pages: edits go to the page's single working copy, linked by page id;<br>• Main refuses a second record at an address in use (409) and any replayed request;<br>• the client guides now say "edit, don't duplicate" and explain what a "-1" address means.<br>Verified live today: repeated Update kept one page (design test) |
| Does publishing work on both live websites? | **Yes.** Live tests today:<br>• Main, Enrollment and Both design test (create → draft → preview → publish → update → double update → cleanup), with the design measured at 1440 and 390 px: every step passed;<br>• approval workflow **16/16** (submit, approve, publish, working copy, reject, resubmit, restore, unpublish).<br>The team also published the homepage themselves today (verified by the CMS at 10:00–10:05 UTC) |
| Required pages showing errors or old content? | **No.**<br>• Main: 320/320 addresses checked, 319 identical to the 23 Oct baseline plus 1 intended change.<br>• Enrollment: sitemap 58/58 answer 200; 57/59 baseline pages identical plus 2 explained.<br>• 0 broken internal links; images 372/372; carousels 38/38.<br>One incident today: Enrollment's sitemap files answered 404 (section 6); fixed and verified |
| Safe for client handover? | **Yes: CLIENT-READY**, with one recommended setting change that needs the owner's authorization (section 12) |

## 1. Executive summary and final status

**Status: CLIENT-READY.**

The Administrator can manage both websites from https://enroll.acadvizen.com/wp-admin/:
- Enrollment pages are edited with Elementor;
- Main pages are designed with Elementor and published to Main through the plugin (Publish To: Main / Enrollment / Both);
- Main keeps Next.js, its `/admin`, Leads and the content lock.

Every acceptance check below was run on the live websites today, apart from those explicitly marked otherwise.

## 2. Work completed (27–28 Oct)

| Item | Result |
|---|---|
| Five "-1" page pairs | New designs merged into the original pages (address, SEO and menu links kept); "-1" pages 301-redirected and trashed. Titles of the originals restored today: "Mentors 1" → "Mentors", "Career 1" → "Career" |
| "Project 1" (#11578) | Unfinished page with placeholder text ("Add Your Heading Text Here / Lorem ipsum"), published 27 Oct, in the sitemap and linked from nowhere. Unpublished (kept as a draft for the team); `/project-1/` → 301 → `/projects-2/` |
| Leftover working copies | 45 copies already published and identical to their live page moved to the Trash (records saved first). The homepage copy edited by the team today was not touched |
| Partner carousel, 38 pages | Zomato restored at its original address; the lost Uber and PwC slides removed (owner decision). 38/38 verified; 8 logos load at 1440 and 390 px |
| #8516 Performance Marketing Course | Reviewed (it corrects wrongly copied text, adds no new code), published; the approval queue is empty |
| Duplicate images | 48/48 deleted after a fresh reference scan; each saved first and also in the 24 Oct backup; the 46 kept identical copies load |
| Enrollment homepage SEO | Approved title and description (from Home1). They survived the team's republish today |
| Main canonical | `/social-media-marketing-course-in-mg-road` is self-canonical |
| Enrollment sitemap 404 (found today) | Fixed: rewrite rules rebuilt (Settings → Permalinks → Save, no setting changed) and the cached 404s purged for the three sitemap addresses only. All 200 |

**Genuinely outstanding:** one LiteSpeed setting, awaiting authorization (section 12). Nothing else.

## 3. Duplicate groups (IDs, URLs, decisions)

| Group | Authoritative (kept) | Retired | Redirect |
|---|---|---|---|
| Mentors | #723 `/mentors/` | #11453 `/mentors-1/` (Trash) | `/mentors-1/` → `/mentors/` |
| Placement | #745 `/placement/` | #11011 `/placement-1/` (Trash) | → `/placement/` |
| Career | #971 `/digital-marketing-jobs/` | #11521 `/career-1/` (Trash) | → `/digital-marketing-jobs/` |
| Courses | #1300 `/courses/` | #10936 `/courses-1/` (Trash) | → `/courses/` |
| Partnership | #964 `/partnership/` | #11007 `/partnership-2/` (Trash) | → `/partnership/` |
| Social Media & Influencer Marketing | #3874 `/learn-digital-marketing/` | #8512 (Trash, 27 Oct) | `/social-media-influencer-marketing/` → (the team's own 301) |
| Projects | #6412 `/projects-2/` (linked from the site) | #11578 `/project-1/` (draft) | → `/projects-2/` |
| Homepage | #11892 (Settings → Reading homepage) | Home1 #6177 draft = rollback; New Home #8517 in the Trash (owner); stale copies trashed | `/home1/` and `/demo/` → `/` |
| About Us | #969 `/about-us-digital-marketing-institute-jayanagar/` (menu) | none public (its working copy and archives are internal) | `/about-us/` → #969 (WordPress's old-address redirect) |

**Not duplicates (kept on purpose):**
- the same names on Main and on Enrollment (Placement, Courses, Projects, About): separate pages for separate websites;
- "Placement Support" `/placement-2/`: different content;
- the Main Bangalore and Mysore city/area page pairs;
- the near-identical location landing pages: one per area, by design.

## 4. Inventory before and after

| Type | 27 Oct before the audit | 28 Oct final | Why |
|---|---|---|---|
| Pages, published | 78 | 71 | −5 "-1" pages, −#8512, −"Project 1" |
| Pages, drafts (not copies) | 25 (mostly test pages) | 3 | Home1 (rollback), #3570 shop cart page, "Project 1" |
| Pages, pending approval | 1 (#8516) | 0 | #8516 published |
| Working copies (internal) | 19 | 5 | 45 leftovers trashed; copies made today by edits |
| Version archives (internal, hidden) | 61 | 80 | rollback history of today's publications (at most 10 per page, pruned automatically) |
| Posts | 16 | 7 | test drafts trashed |
| Main Blogs / Tools / Locations / Course | 97 / 67 / 136 / 1 | 87 / 67 / 136 / 1 | 10 test blog drafts trashed |
| Media | 1,418 | 1,370 | −48 duplicates, −1 test image, +1 Zomato logo |
| Redirects (Rank Math) | 4 | 10 | +5 "-1" addresses, +`/project-1/` |
| Enrollment sitemap | 65 | 58 | −5 "-1" pages, −`/social-media-influencer-marketing/`, −`/project-1/` |
| Main sitemap | 310 | 310 | unchanged |

## 5. Publishing tests on the live websites (28 Oct)

| Test | Result |
|---|---|
| `verify-design-live` Main (#12427) | All Main steps passed: draft not public; preview design at 1440/390; Publish → live in 25 s with the measured design; Update in place (same id and address); double Update → one page; noindex; outside the sitemap and menus |
| `verify-design-live` Enrollment (#12521) and Both (#12554) | **37/37.** Enrollment live in 14 s; Both live on both websites in 39 s; Update and double Update as above. A first Enrollment run stopped on a 3-minute editor time-out (local network) and was cleaned up; re-run passed |
| `verify-approval-live` (#12602, Both) | **16/16.** Draft not public → Publish submits (waiting) → approve → live on Main and Enrollment in 42 s → the live page cannot be changed directly (403), Elementor opens its working copy → the change waits → Reject keeps V1 → resubmit, approve, publish → live in 55 s → Restore → earlier version live in 6 s → Unpublish: gone from both websites |
| Cleanup | Every test page unpublished and moved to the Trash with its copies; the test addresses answer 404 on both websites |
| Partial failure for Both / scheduling | Plugin unchanged since the LIVE passes of 26 Oct: failure-retry 8/8, scheduling 6/6 (`evidence/production-20261026/`) |

How the editor was used: the real Elementor editor in a browser. Publish and Update were clicked on Elementor's top bar; design settings were applied with Elementor's own editor commands.

## 6. Live verification (28 Oct, 10:10–10:30 UTC)

| Check | Result |
|---|---|
| Main, 320 addresses (sitemap 310 + 10 Main-own) vs 23 Oct: status, sitemap membership, served by WordPress, title, canonical, robots, description | 319 identical + 1 intended (MG Road canonical). 310 drawn by WordPress. 5xx: none |
| Main-only noindex pages `/blog/author/john-doe`, `/companies`, `/internships`, `/resources` | 200, `noindex, follow`, outside the sitemap |
| Enrollment, 59 baseline pages vs 23 Oct | 57 identical. 2 explained: homepage robots order; `/test/` 404 (retired as approved) |
| Enrollment sitemap | 58 addresses, all 200, none listed twice |
| **Enrollment sitemap incident** | At about 10:00 UTC, `/sitemap_index.xml`, `/page-sitemap.xml` and `/post-sitemap.xml` answered 404, while `/?sitemap=1` answered 200. WordPress's rewrite rules had lost Rank Math's sitemap rules (also seen on 8, 10 and 16 Oct), and LiteSpeed had cached the 404 for an hour. **Fixed at 10:20:** Permalinks re-saved (no setting changed) and those three addresses purged from LiteSpeed; all three now answer 200 (`sitemap-fix.out`) |
| Duplicates on the public websites | 0 exact duplicate bodies; 0 duplicates across the websites; the near-identical pairs are the location landing pages (by design) |
| Internal links / menus | 242 internal targets on 368 pages, 0 broken, 0 to removed pages; 4/4 menus point only at published content |
| Images and carousels | Blog images 372/372; partner carousel 38/38 pages (8 logos, both widths) |
| Desktop and phone (1440 / 390), fresh browser | Main home, a Main blog post, a Main location page, Enrollment home, an Enrollment course page: header, footer, navigation, 0 broken images, 0 page errors, no sideways scroll. Quick Registration popup opens and closes; nothing submitted |
| Routes | Main `/admin` 200, `/admin/leads` 200, `/contact` 200; content lock: anonymous POST `/api/cms/pages` **423**; companies, internships, resources, authors 401 (not locked); Leads read 401, empty POST 400 (validation); signed CMS API 401 no-store; enquiry route `/wp-json/acadvizen/v1/enquiry` registered (`POST`); `/test/` 404 |
| Main `/admin` signed in | See section 8 |
| Approval queue | Empty (waiting 0, approved 0) |

## 7. Automated tests

| Suite | Result |
|---|---|
| PHP unit (`tests/php/run.php`) | 359/359 |
| JS unit (`npm run test:unit`) | 318/318. One timing test ("one round trip per table", 240 ms limit) failed once at 250 ms while a browser test was running on the same machine; it passed on 3 separate re-runs. That code has not changed since 26 Oct |
| Secret scan (`npm run secrets:check`) | No secrets in tracked files |
| `next build` / `next lint` | **Not run.** No Main code has changed since the deployed release (`b804b34`, built and verified on 26 Oct). The working tree also holds an unrelated uncommitted `next.config.mjs` change, so a local build would not represent production |

## 8. Main `/admin` and Leads

**Verified signed in (10:30 UTC).** The owner signed in personally through Main's normal admin login; nothing was typed by the tools, and no session was saved.
- The dashboard `/admin` loaded.
- On **Leads** (`/admin/leads`), the authenticated Leads API answered **200**, and the list showed rows (8 rows on the screen).
- No error text and no page errors. Only counts were read: no lead details.

**Unchanged and checked anonymously:**
- the content lock, which refuses WordPress-owned content with 423;
- Leads, users and the Main-only lists, which remain editable in Main `/admin`;
- the public lead form route, which validates input (400 on an empty request; nothing was submitted).

`evidence/production-20261028/final/main-admin.txt`

## 9. Versions

| What | Value |
|---|---|
| Git | branch `headless-wordpress`; content and documentation commit listed in the ledger (pushed) |
| Main deployment | `dpl_13s8yPa5GTauWxsi4hvchXrvPVVa` (Ready), built from `b804b34` + the content lock; verified 28 Oct 08:28 UTC |
| Enrollment plugin | Acadvizen Master Admin **0.7.10** (public readme and plugin list) |
| No code release in this pass | Every change was content or configuration made through WordPress |

## 10. Backup and rollback

| What | How to undo |
|---|---|
| Page edits (merges, titles, carousels, SEO) | Approvals & Publishing → Recent publications → **Restore**, or Versions & Rollback |
| Retired pages, trashed copies and test pages | Pages → Trash → **Restore** (WordPress empties the Trash 30 days after each item was trashed, from about 26 Nov) |
| Redirects | Rank Math → Redirections → delete or deactivate |
| "Project 1" | Pages → Quick Edit → Published (and delete its redirect) |
| Deleted images | Restore-tested database and files backup of 24 Oct (all 48 included), plus a fresh copy of each file and its record taken before deletion (kept with the developer) |
| Sitemap fix | None needed (no setting changed) |
| Code | Main: `bash tools/release/release-main.sh --undo`. Plugin: `node tools/release/install-plugin.mjs --undo` (0.7.9) |

**Never restore an older full backup over the live website:** it would remove every change made since.

## 11. Client instructions

These documents now cover editing, preview, Publish To, verifying the live page, the waiting/verified/failed states, interrupted publishing, avoiding duplicates, the Trash and rollback:
- `client-guide/OPERATING-MANUAL.md`, including §10d status, the trash and redirects, and **avoiding duplicate pages**;
- `client-guide/QUICK-START.md`;
- `REQUIREMENT-CAPABILITY-MATRIX.md` §7: what is editable where, and what is not (sign-in and account pages of Main are never replaceable by WordPress; Main-only lists are edited in Main `/admin`).

## 12. Remaining items

| Item | Type | What is needed |
|---|---|---|
| **LiteSpeed: do not cache the sitemap addresses** | Recommended prevention (not blocking: the sitemaps work now) | **Owner authorization.** My attempt to change this LiteSpeed setting was refused by this environment's safety check. The setting: **LiteSpeed Cache → Cache → Excludes → Do Not Cache URIs**, two lines: `sitemap_index.xml` and `-sitemap`, then Save. Without it, a future rewrite-rule glitch can leave the sitemaps answering a cached 404 for up to about two hours (the plugin rebuilds the rules within an hour; LiteSpeed keeps a 404 for an hour) |
| New Home #8517 | Owner decision (kept in the Trash as instructed) | none unless you want it back before about 25 Nov |
| Home1 #6177 (draft) | Rollback copy of the 26 Oct homepage | Trash it when the new homepage is final |

## 13. Evidence index

| Folder | Contents |
|---|---|
| `evidence/production-20261028/` | `design-live*.out`, `approval-live.out`, `titles.out`, `project-1.out`, `trash-copies.out`, `sitemap-fix.out`, `final/` (regression, duplicate scan, links/menus/queue, render, carousel, inventory counts, Main admin), screenshots |
| `evidence/production-20261027/` | merges, carousel, media deletion, homepage SEO, the 27 Oct design test |
| `DUPLICATE-AUDIT-2026-10-27.md` | the full duplicate audit, stages 1–3 and the media list |
| `PRODUCTION-TASK-LEDGER.md` | the day-by-day record with resume commands |

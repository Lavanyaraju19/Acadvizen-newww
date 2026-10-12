# Final open issues: Acadvizen Master Admin / headless CMS (13 October 2026)

**Overall status: NOT CLIENT-READY without a recorded limitation.**
- The CMS itself passed every production gate that can be run without staging.
- The security gate stays open. Production credentials remain readable in public Git history, and by the owner's decision they are not being changed (`FINAL-SECURITY-REPORT.md`).
- Owner decisions O-2 to O-6 are open.

## Critical

| ID | Issue | Evidence | Impact | Status / next action |
|---|---|---|---|---|
| O-1 | Production credentials readable in public Git history: service-role key (C1), database password (C2), Main admin password (C3) | `FINAL-SECURITY-REPORT.md` §1 (commit IDs, no values) | Anyone can read or change all Main data, including leads, and sign in to `/admin` | **Residual risk by owner decision (13 Oct): no rotation.** Code readiness for a later rotation is done (release 11, local). Closes only if the owner rotates and the old values are verified as rejected |

## Owner decisions (nothing changed by the engineer)

### O-2: Content-API switch (`WORDPRESS_CONTENT_API_ENABLED=true` in Vercel Production)

**What it does:**
- It lets WordPress (Acadvizen Master Admin → Main Website) save Main records through the signed endpoint `/api/wordpress/content`.
- Without it, that endpoint answers 503 and the Main Website screens show an error.
- It does not serve WordPress pages on Main; that is the separate Render Bridge, which is off.

**State:** switched on 12 Oct with the owner's approval (release 9). Still on, verified 12 Oct 19:41 UTC.

**Proven on production:**
- signed security (unsigned, wrong-secret, stale, replay, path validation);
- "Test connection";
- the page workflow, 17/17;
- blogs Main / Enrollment / Both, 16/16, including a re-save;
- cleanup;
- 314 Main URLs and 60 Enrollment pages unchanged.

**Proven only on a local copy:** menus, header and footer, homepage lists, courses, city and service pages, media upload, scheduling, Author and Contributor roles (no staging, O-5).

**Options:**
- **(a) Keep it on** and limit everyday editing to pages and blogs until the rest is proven on staging.
- **(b) Switch it off** until staging exists (`FINAL-RELEASE-AND-ROLLBACK.md` §5: one variable plus a redeploy).

**Recommendation: (a).**
- The risky parts (signing, replay, address clashes, publish/unpublish, revalidation) are proven on production.
- Every save keeps an earlier version that can be restored.
- Switching off removes the client's ability to edit Main from WordPress, which is the purpose of the project.

### O-3: Enrollment homepage duplicate

"Where Our Learners Build Their Careers" appears twice:
- WordPress revision 7941 (12 Oct 11:44:05 UTC, user ID 1, an Elementor edit) doubled it; revision 7940 had it once.
- Not caused by the CMS: user ID 2 never edited the page.
- Unchanged since: 60/60 Enrollment pages identical to the post-Release-10 capture (12 Oct 19:41 UTC).

**Options:** restore revision 7940 (Pages → Home → Revisions), or keep it if intended. Not touched.

### O-4: Main performance

**Measurements** (12 Oct 19:45 UTC, 3 runs each):

| Address | TTFB |
|---|---|
| `/` | 1.67–1.94 s |
| `/blog` | 1.16–1.54 s |
| `/seo-course-in-bangalore` | 1.58–1.73 s |
| Enrollment `/` | 0.12–0.32 s (LiteSpeed hit) |

**Cause:**
- Main is always a Vercel cache MISS.
- Requests enter at the `bom1` (Mumbai) edge, functions run in `iad1` (Washington DC), and the database is in Sydney, so each query crosses the US and Australia.

**Proposal** (a deployment setting; not done):
- Set the function region to `syd1` and redeploy.
- Measure the same three addresses before and after.
- Roll back by restoring `iad1`.

### O-5: Staging environment

**Current state:** none usable.
- The two other Supabase projects are paused.
- `cms.acadvizen.com` runs plugin 0.3.0, with no credentials.

**Needed:** a non-production Supabase project, plus a staging WordPress with plugin 0.6.1 pointing at a staging Main. Then run AT-30/32/35 there.

### O-6: WordPress updates

**Pending:**
- Core 7.0.7 → 7.1.3.
- 12 plugin updates: Elementor 4.3.4, ElementsKit 4.0.8, GTM4WP 2.0.6, GutenKit 2.5.3, Hostinger Easy Onboarding 3.0.4, Hostinger Reach 1.8.6, Hostinger Tools 3.0.79, PopupKit 2.3.7, Rank Math 1.0.280, ShopEngine 4.9.7, WPCode 2.4.0, Yoast 28.6.

**Procedure:** staging first, with a backup; then production; then rerun the Enrollment baseline comparison. Not applied.

## High / medium (not blocking the CMS itself)

| ID | Issue | Status |
|---|---|---|
| O-7 | Credentials shared in chat (WordPress, Hostinger, FTP, Vercel) | Open; not changed by owner decision (residual risk) |
| O-8 | Integration account username is guessable | Open; owner decision |
| O-9 | `%TEMP%\acadvizen-production-verify.env` held production secrets | **Closed** 12 Oct 19:47 UTC: confirmed redundant and unreferenced, then removed (`FINAL-SECURITY-REPORT.md` C9) |
| O-10 | Credentials file: the SSH host is joined onto the end of the secret line | Open; owner's file, not edited |
| O-11 | Three plugins added to Enrollment on 12 Oct by someone else (Microsoft Clarity and WPConsent active; Pixel Manager inactive) | Open; owner to confirm they are intended |
| O-12 | Project `.env.local` also writable by a local sandbox group from another tool (no production values in it) | Low; optional `icacls` clean-up |

## Not tested on production (passed LOCAL)

The reason is the same for each: a visitor-facing write without staging (O-5), or no test accounts on production.
- AT-30: menus, header and footer, homepage lists, courses, city and service pages, media upload.
- AT-32: scheduled publishing. LOCAL end to end 7/7 (12 Oct 19:36–19:43 UTC); the site time zone is UTC, as on production.
- AT-35: Author and Contributor. LOCAL 9/9 by direct request, plus suite H3–H5.
- AT-41: rollback execution. Targets are READY; not exercised.

## Pre-existing (documented, not fixed here)

- **Known Enrollment issues:** the sitemaps, three redirects, `/contact-us/`, and the logo link (`verify-production.mjs`: 9 known failures).
- **Code:** 10 ESLint warnings; 2 high `npm audit` findings (`nodemailer` needs a major version; Next.js's own `sharp`).

## Final run (fresh, 12 Oct 19:33–19:47 UTC; LOCAL unless stated)

**Tree:** `0554e5f` + release 11 (since committed as `f855e33` and `8e27175`; the only later change is comment wording).

**Environment:** a production build of Main with production's switch settings (content API on, `WORDPRESS_CMS_API_URL` set, bridge off), plus the local WordPress with plugin 0.6.1.

**Log:** `evidence/final-run/fresh-run-20261012T1933.txt`.

| Suite | Result |
|---|---|
| Unit (`node --test tests/unit/*.test.js`) | 214/214 (rerun after the comment edit: 214/214) |
| TypeScript / ESLint | exit 0 / 0 errors, 10 pre-existing warnings |
| PHP tests / `php -l` | 252/252 / 20 files clean |
| Secret guard / `npm audit` | clean / 2 high, pre-existing |
| `tests/wordpress/structured-acceptance.mjs` | 56/56 (`evidence/local-structured/results-202610121933.json`) |
| `tests/wordpress/permissions-acceptance.mjs` | 9/9 |
| `tests/wordpress/scheduling-acceptance.mjs` | 7/7 |
| `tools/verify-wordpress-live.mjs` (blogs) | 16/16 |
| `tools/verify-wordpress-pages-live.mjs` (pages) | 17/17, 0 click fallbacks |
| `tools/verify-content-api-live.mjs` (signed API) | 16/16 |
| Production-equivalent build | compiled, exit 0 |

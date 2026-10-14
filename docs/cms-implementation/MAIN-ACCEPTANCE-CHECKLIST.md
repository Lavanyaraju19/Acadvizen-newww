# Main Website acceptance checklist (Option B)

Updated 14 October 2026. Every line says what proves it and where that proof was made: **PRODUCTION**, **STAGING** or **LOCAL** (the Docker copy on the engineer's PC). Main is ready for the owner's approval only when every line is **Met** with PRODUCTION or STAGING evidence.

**Current verdict: NOT READY FOR APPROVAL.** No staging environment exists yet and nothing of Option B is on production. The local work is complete enough to rehearse on staging.

Production today (read-only checks, 14 October):
- Main: `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (commit `80134d4`).
- Enrollment plugin: Acadvizen Master Admin 0.6.1.
- Render Bridge: off.
- Main addresses: 314.

| # | Criterion | Status | Evidence | What is missing |
|---|---|---|---|---|
| 1 | All required Main features implemented and verified | **Partly met** | **PRODUCTION (12 Oct):**<ul><li>Structured Main editing from WordPress (hybrid content API): `verify-content-api-live` 16/16</li><li>`verify-wordpress-pages-live` 17/17</li><li>`verify-wordpress-live` 16/16</li></ul>**LOCAL (Option B):**<ul><li>Elementor on Main: bridge 44/44, approval 47/47, reliability 38/38, migration 13/13</li><li>Unit 265, PHP 312 (`TEST-RESULTS.md`)</li></ul> | Option B on staging (P2, P3, P5), then production |
| 2 | All 277 addresses planned for WordPress have a documented, verified disposition | **Documented; verified LOCAL for 3 of the 5 families** | `MAIN-ROUTE-CHECKLIST.md` (regenerated 14 Oct from evidence): every production address with owner, live checks, links, notes and the LOCAL rehearsal result. Rehearsal #7 converted from **Main's own pages** (`?acv-main=1`) and verified: homepage, the 14 dedicated pages, all 68 local tool pages (67 on production) and blog posts. Result: 86/103 identical, rest classified | **Page Builder pages (109 on production): unproven.** The local copy has none drawn by Main itself (its 9 are WordPress-only test pages). Needs staging with production content (P5). Blog posts: 2 local versus 86 on production |
| 3 | The 37 addresses kept on Main still work | **Met on production today; after-migration check pending** | **PRODUCTION:** 314/314 pass the live check (status, canonical, not noindex, visible text), 0 broken internal links (13–14 Oct). **LOCAL:** the kept addresses (courses, tool list, data lists, city pages) were identical to Main's own pages after rehearsal #7 | The same check after each production batch (P10) |
| 4 | No required content or function silently left out | **Met LOCAL for the converter's known cases** | Converter notes list every block it left out. 14 Oct fixes:<ul><li>blog cards</li><li>FAQ accordions</li><li>header and footer source</li><li>robots and titles</li><li>card verification</li><li>importer references</li><li>server descriptions</li></ul>Rehearsal #7: 92/92 verified; 86/103 identical to Main's own pages; every difference classified (`MAIN-ROUTE-CHECKLIST.md`) | Review of each staging page's notes before approval |
| 5 | Main publishing, preview, approval, revision history and rollback work end to end | **Met LOCAL only** | Approval suite (47 checks) and reliability suite R1–R8 (38 checks):<ul><li>Previews per website</li><li>Exact-revision approval</li><li>Verification</li><li>Retry</li><li>Rollback "Make live"</li><li>Audit log</li></ul> | Staging (P5), then production after P8–P9 |
| 6 | SEO, forms, course content, tools, city pages, menus, headers, footers, responsive layout | **Partly met LOCAL** | Address comparisons on titles, descriptions, canonical, robots, H1, JSON-LD, forms and visible text (`main-migration-compare.mjs`). Desktop, tablet and phone screenshots (`evidence/approval/`) | Production-content comparison on staging. A form submitted on a bridged Main page (O-24). A popup with Elementor Pro (O-31) |
| 7 | All critical and high defects resolved | **Not met** | Fixed defects are listed in `TEST-RESULTS.md` | **Open, critical:** credentials exposed in Git history are not rotated (owner decision, P11, `FINAL-SECURITY-REPORT.md`) |
| 8 | Recovery and rollback tested | **Met LOCAL only** | <ul><li>**Rollback of a whole migration:** after each of rehearsals #4–#7 the local database was restored from a checksummed backup, and the addresses came back with the same content. #4, #5 and #6 measured 102/103 identical; the one difference was an animated visitor counter. #7: content identical on all 103 addresses; robots/title changed only because of a plugin fix applied mid-run</li><li>**Isolated restore (14 Oct):** fresh backup (database and all of `wp-content`, SHA-256), restored into a separate stack (port 8089). Results: 21/21 tables with identical row counts; core checksums OK; plugins identical; sign-in works; media 36/36; public pages **87/87 identical** (`evidence/restore-rehearsal-20261014/`)</li><li>Per-page rollback: approval suite</li></ul> | P1 fresh **production** backup and the P4 restore rehearsal on staging |
| 9 | Production evidence supports every claim | **Not met** | Production evidence so far covers the hybrid content API (release 10) only | P7–P10, each with before/after inventories |

## Enrollment and both-site checks (section 6 of the brief)

These come after Main passes. LOCAL results to date:
- **Enrollment-only publishing changes Enrollment only.** Destination suites; the Main inventory stays identical.
- **Main-only publishing changes Main only.** Enrollment pages compared before and after.
- **Both is tracked per website.** Partial failure is reported, and "Check again" retries only the failed website (both-failure 12 + 3; reliability R2).
- **Drafts and previews never change public pages.** The "while waiting for approval" comparison: 103/103 identical.
- **Rollback restores one website without touching the other.** Per-destination rollback (`DESTINATION-GUIDE.md`).

None of this has been run on staging or production.

## Owner decisions that block approval

See `OWNER-ACTIONS.md`:
- P1: fresh backup;
- P2, P3: staging;
- P6: Elementor Pro licence state;
- P7–P10: release and migration batches;
- P11: credential rotation.

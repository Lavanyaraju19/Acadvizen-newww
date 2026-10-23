# Release report: Master Admin 0.7.6 and the Main visual-editing release candidate (21 October 2026)

**Nothing in this report was changed on production.** No commit, push, deployment, plugin installation, cache purge, setting change or content change was made on either website. Every production check below was a read-only request.

## 1. Versions

| | Version | Evidence |
|---|---|---|
| Installed on enroll.acadvizen.com | **0.7.4** | Public `readme.txt` "Stable tag: 0.7.4", read 21 Oct 2026 05:15 and 07:5x UTC |
| Prepared, not installed | **0.7.6** | `dist/acadvizen-cms-0.7.6-worktree-c5b51b05c2a6/acadvizen-cms.zip`, 181,174 bytes, sha256 `6356cd752c190b9e6a490a6b00929eb0efc311431515a11f95316a37347fe52b`; 27 files, all byte-identical to the working tree; 23 PHP files lint clean |
| Superseded, not installed | 0.7.5 | `dist/acadvizen-cms-0.7.5-worktree-a17a03213fd3`, sha256 `faba88a8…7399f3`; 0.7.6 contains all of it |
| Rollback target | 0.7.4 | `dist/acadvizen-cms-0.7.4-worktree-2cdb89872e37`, sha256 `14c1b949…ca69f` |
| Main Website | `dpl_56BrUwoX4opAgGZ3UDBrw4iBQEa1` (commit `bb43086`) | Render Bridge **enabled** (location pages answer with `x-acadvizen-render-version`), left as the owner instructed |

**0.7.6 against 0.7.4** (8 files: `acadvizen-cms.php`, `readme.txt`, `includes/rest.php`, `render-bridge.php`, `publisher.php`, `design.php`, `content-types.php`, `approval.php`; no database table, no option written, no outbound request added):

1. **Cache safety (0.7.5):** every response of the plugin's REST routes, errors included, tells LiteSpeed Cache not to store it, before the route runs. Proved in a copy of production with LiteSpeed Cache 7.9.1 emulating a LiteSpeed server: a signed 404 from `/render` was stored for an hour under 0.7.4 (`public,max-age=3600`, what anonymous visitors were served on 20 Oct) and is `no-cache` under 0.7.6; anonymous `/manifest` and `/render` stay 401 `no-cache`.
2. **Scheduled-job repair (0.7.5):** each manifest request from Main re-creates the two recurring jobs if WP-Cron lost them. Proved in the copy: jobs dropped, one signed manifest request, both scheduled again (0.7.4: still missing).
3. **Editor preview chrome:** Elementor's editor previews a Main-only page, working copy or Main design inside Main's header and footer; before, Enrollment's header and its "ADMISSIONS OPEN" bar. Header Footer Elementor templates follow the same rule as Theme Builder templates, so a header or footer shared with Both is never chosen for a Main page. Enrollment pages and pages for Both keep Enrollment's chrome (checked in the copy: Enrollment front page #6177 still shows header #960, footer #1035 and its bar).
4. **noindex fix:** "Hide from search engines" in Master Admin now marks the Main render noindex, sets the page's robots tag to noindex (Rank Math and WordPress) and removes it from both sitemaps. Before, only Main's blog API honoured it, so the Render Bridge would have published such a page as "index, follow".
5. **Per-record design:** a location can be drawn by a design chosen for it (Locations → Details → Design), plus the area-page text fields; `[acv_loop]` gains `layout="row"` and `same_design="yes"`.

## 2. Tests (commands, results)

| Suite | Command | Result |
|---|---|---|
| PHP | `docker run --rm -v "$PWD:/app" -w /app php:8.3-cli php tests/php/run.php` | **349/349** (21 Oct) |
| JavaScript unit | `node --test tests/unit/*.test.js` | **304/304** (21 Oct) |
| TypeScript | `npx tsc --noEmit -p .` | rc 0, no output (21 Oct 08:09) |
| Lint | `npx next lint` | rc 0, 0 errors, 10 warnings (21 Oct 08:10) |
| Build | `npx next build` (bridge on, local env) | Compiled successfully in 32.4 s (21 Oct 08:12) |
| Local WordPress suites | `scratchpad/hostcheck/full-local.sh` | PENDING (first run stopped: the machine was overloaded by the copy and an export; timeouts at login, not assertions) |
| Package | `node tools/build-cms-plugin.mjs --worktree` | 0.7.6, sha256 above |

## 3. Main visual editing: release candidate (isolated copy)

Details, address by address: `MAIN-VISUAL-EDITING-INVENTORY.md`.

- **Release-candidate bundle:** `main-rc-20261021`, 5,818,640 bytes, sha256 `1d795bc8c2004a71a3e246ccebe11993fbc8880113f1ff3253d9f249d3c41638` (scratchpad `proto/export-full/bundle-rc.json`; not in Git). Exported read-only from www.acadvizen.com on 21 Oct 2026 07:54–08:37 UTC.
- **Copy:** the 17 Oct 2026 Enrollment backup restored in Docker with no internet, plugin 0.7.6, production's feature switches and responsive CSS. Bundle imported, every item approved and published as a reviewer does, 310 Main addresses rendered.
- **Results:** PENDING

## 4. What still needs the owner

Nothing below has been done. Each item needs the owner's explicit approval for that specific action.

1. **Install 0.7.6 on enroll.acadvizen.com** (the zip and checksum in §1). Steps: take a fresh backup first, then follow Plugins → Add New → Upload Plugin → "Replace current with uploaded". No setting changes and no cache purge are needed. Rollback steps are in §5.
2. **Render Bridge state.** Production has it **enabled**. The owner's earlier instruction was to keep it enabled and not toggle it, but the 21 Oct brief says it "must remain disabled until the owner has approved activation". It was not touched. The owner must confirm which instruction stands.
3. **Move Main families to WordPress, one at a time** (import the release-candidate bundle's family, approve, publish, check). Until then, every Main address keeps showing the Next.js page. Suggested order: blogs → location pages → tool pages → dedicated pages → homepage. Each step is undone with "Undo this import" for its batch.
4. **Four addresses need a decision, not a conversion:** `/companies`, `/internships` and `/resources` (empty data lists on Main; left out of the bundle) and `/blog/author/john-doe` (a placeholder author that is indexable and in Main's sitemap).
5. **Main defects found while checking production (read-only):** 8 tool links lead to soft-404 pages; 5 tool logos are HTML instead of images; the Clearbit logo service used for tool logos no longer resolves. These are Main code or data fixes and need a Main deployment, which is not part of this release.
6. **Credentials.** Rotating the WordPress application password and the Supabase keys stays deferred, as the client instructed. The exposure risk recorded on 16 Oct is **not** resolved.

Checked read-only on 21 Oct: Enrollment's `sitemap_index.xml` and `page-sitemap.xml` answer 200 (the 404s of 16 Oct are gone).

## 5. Rollback

- **Plugin:** Plugins → Add New → Upload Plugin → the 0.7.4 zip → "Replace current with uploaded". Rehearsed in the copy on 21 Oct 2026 (0.7.6 → 0.7.4 → 0.7.6, behaviour as expected at each step). No database change to undo.
- **A Main page moved to WordPress:** Approvals → Recent publications → Restore (earlier version), or Pages / Locations → Quick Edit → Status Draft: Main draws its own page at that address again.
- **A whole family:** Import Main Website → "Undo this import" for its batch (deletes what that batch created; verified in a copy on 19 Oct 2026).
- **Everything Main serves from WordPress at once:** Vercel → the Main project's variable `WORDPRESS_CONTENT_ENABLED` (the bridge). Not to be touched without the owner, who asked to keep the bridge enabled.

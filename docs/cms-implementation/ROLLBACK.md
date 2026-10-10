# Rollback and recovery

Use the least drastic step first. Each step keeps all content.

| Situation | Step | Effect | Tested |
|---|---|---|---|
| One Main page looks wrong after an update | WordPress → Acadvizen Master Admin → **Versions & Rollback** → the page → **Make live** on the earlier version | The earlier text **and** design come back within seconds; the next update replaces it | LOCAL (scenario F) |
| A shared change (header, footer, global colour) looks wrong | Undo it in Elementor (template revisions / Site Settings), then save; every Main page republishes | Pages come back in the background (about 30–50 s locally; minutes in production) | LOCAL (scenario D, forward direction) |
| The plugin misbehaves on Enrollment | WordPress → Plugins → **Deactivate** "Acadvizen Master Admin" | Its jobs stop, the API is gone (Main keeps its cached pages), and the address rules are rebuilt in the database. Content is kept. `.htaccess` is not touched | LOCAL (scenario L) |
| Remove the plugin completely | Deactivate, then **Delete** | Also removes its table of published versions and its options. WordPress content is kept | Code review (`uninstall.php`) |
| Go back to the previous plugin version | Deactivate, delete, then upload the previous package from `dist/` (0.4.0: SHA-256 `01d62f3f…e6809`) and activate | Previous behaviour | Package verified |
| Main shows WordPress pages wrongly | Vercel → `acadvizen-newww-ua9d` → remove `WORDPRESS_CONTENT_ENABLED` → redeploy, or **Promote** the previous deployment | Every route returns to the Next.js pages | Integration-off build: LOCAL build |
| A Main deployment is bad | Vercel → Deployments → previous READY deployment → **Promote to Production**. Today: `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56` (`d48492b`), before it `dpl_F9QmBR5vWeHyEwWvxF9kyvqFb8N2` | Previous Main | Not rehearsed on production |
| An import went wrong | Acadvizen Master Admin → Import Main Website → **Undo import** | Removes everything that import created | STAGING (earlier) |
| Enrollment database or files damaged | Restore the hPanel backup of **enroll.acadvizen.com** taken before the change | Whole-site restore | **Backup not yet confirmed** |
| Supabase migrations | Leave them: they only add columns, and the code works with and without them | — | LOCAL (throwaway Postgres) |

**Before any high-impact change** (activation of a new version, import, global template change, migrations), have:
- a backup with its date and scope;
- the exact change and its expected impact written down;
- the way back from this table chosen;
- the owner's go-ahead.

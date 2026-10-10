# Acadvizen — access audit (updated 10 October 2026, 13:00 UTC)

No secret value was printed or recorded while testing these rows. Credentials shared in chat during the project must be rotated (handover, section 5, step 10).

| Service | Needed for | Access now | Evidence (10 Oct) | Next action to unblock |
|---|---|---|---|---|
| GitHub `Lavanyaraju19/Acadvizen-newww` | Pushing `headless-wordpress` | **Working** | `origin/headless-wordpress` = `d48492b`. Local commits `f0d54ff`, `930e29c`, `745387d` and the documentation are **not pushed**: pushing waits for the owner's release approval | Owner approves the release (handover, section 9) |
| Vercel project `acadvizen-newww-ua9d` (Main) | Deploys; reading deployments and variable names | **Working** | Live production `dpl_ApR7YEAzC1r1bJfA3EiEdvAnqo56` (`d48492b`); 7 production variables, none `WORDPRESS_*` (names only read) | None |
| Vercel environment variables (write) | `WORDPRESS_CMS_API_URL`, `WORDPRESS_CMS_WEBHOOK_SECRET` | **Not used** (production change) | — | Owner adds both after the plugin is installed (handover, section 5, step 5), or approves the engineer doing it |
| Vercel DNS | Nothing; no DNS change is needed | No access | `cms` and `enroll` both resolve to 147.93.17.189 | None |
| Main `/admin` (`operation@acadvizen.com`) | Leads, Tools, test-record cleanup | **Working** (account given by the owner in chat) | Leads API 200; Tools API 200 (68 tools). Deleted the test lead `7d1a4247-…` and unpublished "Local E2E Course" and "Local E2E Tool" | Rotate this password (it was shared in chat) |
| Production Enrollment WordPress (`enroll.acadvizen.com/wp-admin`) | Plugin install; Enrollment fixes | **Blocked** | Two sets of credentials (the checklist's and the one given in chat) were rejected. Attempts stopped to avoid locking the account | **Owner:** install the plugin, or create a working administrator for the engineer and store it in a local file (never in chat) |
| Hostinger hPanel | Backups, database size, File Manager (`wp-config.php`), cron | **Blocked** | The login page answers with a Cloudflare challenge (403). Not bypassed | **Owner:** perform the hPanel steps, or grant access through hPanel → Access Manager |
| Supabase dashboard | Backups; applying the two migrations | **Blocked** | The login requires a CAPTCHA. Not bypassed | **Supabase owner:** confirm backups and run the two migrations (handover, section 11) |
| Staging WordPress and FTP (`cms.acadvizen.com`) | Staging tests | Credentials exist locally; **not used this session** | The staging plugin runs an earlier build | Optional: update staging to the release package and re-run the lifecycle |
| Production test enquiry | Proving lead storage | Used once (approved) | Lead stored 10 Oct 09:42 UTC, verified, then deleted by id | No further live enquiries without a new approval |

## Owner's access checklist (`ACADVIZEN_ACCESS_CHECKLIST.md`)

- The checklist is kept out of Git through `.git/info/exclude`. It must never be committed.
- Its `WORDPRESS_CMS_API_URL` is **wrong**: a wp-admin screen. The correct value is `https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1`.
- **Use a new secret for production,** generated when the plugin is installed. Do not reuse a secret that was written into a file or shared, and never the staging one.

## Safety gates (all must pass before any production write to WordPress or data)

| # | Gate | Status |
|---|---|---|
| 1 | Enrollment backup: listed, with date and scope, for **enroll.acadvizen.com** | **Not confirmed** |
| 2 | Enrollment database below 2.0 GB before any import (limit 3 GB) | **Unknown** |
| 3 | Supabase: today's backup or point-in-time recovery | **Not confirmed** |
| 4 | Main rollback: a previous READY production deployment | **Ready**: `dpl_F9QmBR5vWeHyEwWvxF9kyvqFb8N2` and `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD` |
| 5 | The verified plugin package (SHA-256 `188dce51…b725`) is the one uploaded | Ready locally |

# Acadvizen — access audit (10 October 2026)

Every row was tested on 10 October 2026, read-only. No secret value was printed or recorded.

**Credentials available to this environment:**
- `C:\Users\HP\.acadvizen-staging.env`: staging WordPress and FTP;
- `C:\Users\HP\.acadvizen-vercel.env`: a Vercel token for one project;
- the Git credential helper, for GitHub.

The repository's `.env.local` is **not** authorised for this work and was not used.

| Service | Needed for | Permission needed | Access now | Evidence (10 Oct) | Next action to unblock |
|---|---|---|---|---|---|
| GitHub `Lavanyaraju19/Acadvizen-newww` | Pushing `headless-wordpress` | Write on the repository | **Working** | `git ls-remote` reads `505c53e`; pushes of `f42d9cc`, `cc1b51f`, `af233d1`, `19e5e5f` and `505c53e` succeeded | None |
| Vercel project `acadvizen-newww-ua9d` (Main) | Production deploys; reading deployments and variable names | Project-scoped token (deploy + read) | **Working** for deploys and reads | Lists the project; created production deployments `dpl_4NXt…`, `dpl_9rMT…` and `dpl_F9Qm…` (all READY). Team and user endpoints answer `team_unauthorized` (narrow token) | None for deploys |
| Vercel environment variables | Adding `WORDPRESS_CMS_API_URL` and `WORDPRESS_CMS_WEBHOOK_SECRET` | Write on project variables | **Not tested** (writing is a production change) | The token reads variable names. A write would only be attempted after the CMS prerequisites pass | Owner adds both in Vercel → `acadvizen-newww-ua9d` → Settings → Environment Variables (Production). Or confirm I may write them with this token once the secret exists |
| Vercel DNS (`acadvizen.com`, nameservers `ns1/ns2.vercel-dns.com`) | Nothing: `cms` and `enroll` already point at 147.93.17.189 | — | **No access** (token answers `forbidden`) | DNS-over-HTTPS: `cms` and `enroll` are both A 147.93.17.189 | None. **No DNS change is required** for the cutover |
| Staging WordPress (`cms.acadvizen.com/wp-admin`) | Tests, rehearsal | Administrator | **Working** | Logged in as administrator after a fresh login (`wp-login.mjs`) | None |
| Staging FTP (Hostinger) | Uploading plugin files to staging | FTP account for the staging site | **Working** | Directory listing shows `wp-config.php` and `wp-content` | None |
| Production Enrollment WordPress (`enroll.acadvizen.com/wp-admin`) | §13 fixes; plugin install and activation; Rank Math; Elementor templates | Administrator | **No credentials** | Login page reachable (200); no production account available here | **Owner:** do §13 and plugin activation yourself, or create a dedicated administrator for this work (Users → Add New, role Administrator) and store it in a new local file such as `C:\Users\HP\.acadvizen-production.env` (never in chat) |
| Hostinger hPanel (Enrollment hosting) | Backups, database size, domains (moving staging off `cms`, attaching `cms` to Enrollment), File Manager, cron | Account owner, or hPanel access granted to a collaborator | **No access** | Server identified as Hostinger (`platform: hostinger`, LiteSpeed) | **Owner:** perform the hPanel steps, or grant access through hPanel → Account → Access Manager, and keep the login in a local file (never in chat) |
| Production `wp-config.php` | The four `ACADVIZEN_CMS_*` constants | hPanel File Manager or SFTP for the production site | **No access** | — | Comes with hPanel access (above) |
| Supabase (Main data) | Backup and point-in-time-recovery status; restore path | Project Owner/Admin on the dashboard | **No access** | — | **Owner:** Supabase → Project → Database → Backups: confirm today's backup and PITR; report the result |
| Main `/admin` | Unpublishing the two "Local E2E" records; seeing the test lead | An admin account | **No authorised account** | — (`.env.local` holds one, but it is not authorised) | **Owner:** unpublish both records, or authorise a dedicated admin account in a new local credential file |
| Production test enquiry | Proving lead storage | Explicit approval | **Not approved** | — | **Owner:** reply "approve test lead" |
| Credential rotation | Security | Each account's owner | **Owner only** | — | Rotate the staging WordPress password, staging FTP password, staging webhook secret and Vercel token (and any credential pasted in chat), then update the two local credential files |

## What the current access allows

**Done:**
- push and production-deploy Main with the WordPress integration off;
- verify all live websites read-only (`node tools/verify-production.mjs`);
- run every staging test.

**After the owner's hPanel and WordPress steps:**
- switch on the integration (`WORDPRESS_CONTENT_ENABLED=true`) and redeploy, if the two variables have been added;
- run the production publishing tests;
- run the bundle import, only after the backup and the database size are confirmed.

## Safety gates (all must pass before any production change to WordPress or data)

1. **Enrollment backup:** downloaded and listed, with a timestamp.
2. **Database capacity:** the production database size is known and below 2.0 GB before the import (limit 3 GB).
3. **Supabase:** a backup exists for today, or PITR is active.
4. **Main rollback:** ready. `dpl_Axdg9QLftFyTUBY5HuKiXtLui3RD` (`a8cc4d5`) is READY and serves `/`, `/about` and `/contact` (verified 9 October).
5. **The CMS address points at production:** `cms.acadvizen.com` serves the Enrollment installation, not staging. Today it still serves staging (its home is `https://cms.acadvizen.com`, and its login logo links to the staging Main).

# Owner actions (updated 13 October 2026)

These are the steps only the owner can take. Do them in this order. After step 5, tell the engineer, who then runs the live checks in step 6 and reports real results.

Never paste a password or the shared secret into chat, Git, a document or a screenshot.

## Approval requests for production (updated 14 October 2026: current)

Each request names the exact operation, what it touches, the risk, the backup it relies on and the rollback. **Nothing below has been done.** Approve them one at a time ("approve P1", and so on). The engineer then does that step only and reports evidence.

| # | Operation | Who | Touches | Risk | Backup / rollback |
|---|---|---|---|---|---|
| **P1** | **Fresh production backup:** Hostinger hPanel → Websites → enroll.acadvizen.com → Backups → *Create backup* (files + database), then download both archives off-site. Record time, sizes and SHA-256 (`certutil -hashfile <file> SHA256`) | Owner (hPanel login) | Read-only for the site | None | — (this is the backup) |
| **P2** | **Staging for WordPress:** hPanel → WordPress → *Staging* → create a staging copy of enroll.acadvizen.com. Set it to "Discourage search engines". Keep its wp-config without the production Main secret | Owner | A new subdomain; production is not changed | A staging copy that still holds production keys could call production. The plugin refuses to talk to production Main from a non-production host (`production_isolation_error`) | Delete the staging site |
| **P3** | **Staging for Main:** a non-production Supabase project (Supabase → New project) with the schema migrated. A Vercel **Preview** environment pointing at it (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SECRET_KEY`, `WORDPRESS_CMS_WEBHOOK_SECRET` for staging only, `WORDPRESS_CONTENT_ENABLED=true`) | Owner (Supabase and Vercel accounts) | New resources only | Preview variables must never be the production ones | Delete the project and the variables |
| **P4** | **Restore rehearsal:** restore the P1 backup onto the P2 staging site and run the comparison tools against it | Engineer, after P1–P2 | Staging only | None | — |
| **P5** | **Staging rehearsal of everything:** install plugin 0.7.0 on staging, switch on approval and the bridge there, run every suite against staging, migrate the 277 planned addresses of a staging copy of production content, and compare them address by address. This also covers what the local copy cannot prove: the 109 Page Builder pages, the popup with Elementor Pro (staging needs a licensed Pro), and Main, Enrollment and Both on real hosts | Engineer, after P2–P4 | Staging only | None | Restore P1 onto staging |
| **P6** | **Elementor Pro licence.** Done 14 Oct: the owner confirmed Pro 4.3.0 is installed and active (Plugins screen), and the public site loads Pro 4.3.0 files with popups enabled. **Still open:** wp-admin → Elementor → License shows *Active* (licence, not just the plugin), and staging (P2) needs Pro too, or popups cannot be tested there | Owner | Read-only | — | — |
| **P7** | **Commit and push** the reviewed work (`DEPLOYMENT-REPORT.md` §6, steps 0–3), then **promote** the Preview to production | Engineer, after explicit approval | Main production deployment | A new Main release; the bridge stays off, so no Main address should change. Verified by `main-route-inventory` before and after | Promote `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` |
| **P8** | **Install plugin 0.7.0** on production (Replace current with uploaded) | Owner or engineer, after P1 | Enrollment WordPress | The admin screens change (see `DEPLOYMENT-REPORT.md` §2), and the blog two-way sync starts | Upload the 0.6.1 package (SHA-256 `dd6fcf27…`); P1 backup |
| **P9** | **Switch on approval:** `define( 'ACADVIZEN_CMS_APPROVAL', true );` in wp-config.php; assign reviewers | Owner (file access) | How editors publish | Editors can no longer publish directly; that is the intent | Remove the line |
| **P10** | **Bridge and migration, in batches** (`MAIN-MIGRATION-PLAN.md` §4): the RENDER_BRIDGE constant, Vercel `WORDPRESS_CONTENT_ENABLED=true` and redeploy, then the approved batches one at a time, each compared before continuing | Engineer, per batch approval | Main production traffic for migrated addresses only | Visible content changes on each migrated address | Per page: Restore or Draft. All: unset the variable and redeploy. Data: P1 |
| **P11** | **Credential rotation** (`FINAL-SECURITY-REPORT.md` §6). **Your earlier decision was not to rotate.** The latest brief asks for rotation; please confirm explicitly which applies | Owner (provider dashboards) | Supabase keys, the database password, admin and hosting passwords | A dependent service could break if updated in the wrong order; the order and checks are in §6 | Re-enable the old key until the new one is confirmed |
| **P12** | **Course Modules: decide** (O-41). (a) The homepage section, hidden since 23 March, is shown again in the prepared release: confirm you want it back (it repeats the modules of the "Course Program" section above it). (b) The five course landing pages on the live site have never had this section. Adding it there is new content: say which pages and confirm the content | Owner (decision) | (a) Main homepage at the next release; (b) five production Page Builder pages | (a) longer homepage; (b) a production content change | (a) put `hidden` back in `HomePage.jsx`; (b) Page Builder history |
| **P13** | **Enrollment carousel link** (O-42): a slide in the image carousel on the Enrollment homepage, `/projects-2/` and one diploma page links to `/?page_id=6342`. That page is not published, so visitors get 404. Publish page #6342, or change the slide's link in Elementor | Owner | Enrollment content | None | Elementor revision history |

**Why the engineer cannot do P1–P3, P6 and P11:**
- The production WordPress password was refused earlier, and hPanel sits behind a Cloudflare check.
- The Supabase and Vercel account actions need the account owner.
- Licence status is only visible inside wp-admin.

## Remaining, as of 13 October 2026, 13:00 UTC

**Production is unchanged** (read-only, 13 Oct 11:10–11:20 UTC):
- `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` is live and Ready;
- plugin 0.6.1;
- content API on (unsigned requests refused);
- Render Bridge off (manifest 404).

Nothing was pushed, deployed, installed or committed in this phase.

**New since 03:00 UTC (LOCAL, uncommitted):** one Elementor admin for both websites, with mandatory approval:
- exact revision, reviewers only, any edit cancels the approval;
- Main / Enrollment / Both, each verified on the public page;
- honest partial failure and retry, replay protection, scheduled publishing, rollback;
- the widget compatibility registry;
- migration of real Main pages (one page proven end to end).

Results: `TEST-RESULTS.md` (13 Oct, final run). Overview: `FINAL-CLIENT-HANDOVER.md`.

**Your decisions and actions, in order** (each production step needs your explicit go-ahead; the engineer takes none on their own):
1. **Review and commit** the uncommitted work (list: `DEPLOYMENT-REPORT.md` §2). Nothing is committed without your approval.
2. **Release 11 + plugin 0.7.0 to production:** push, promote, then upload the 0.7.0 package (`DEPLOYMENT-REPORT.md` §3 steps 1–2). Rollback for each step is listed there.
3. **Reviewer accounts:** who approves publishing? Give their WordPress accounts the role **Reviewer (approves publishing)**, or keep it to Administrators.
4. **Approval on:** add `define( 'ACADVIZEN_CMS_APPROVAL', true );` to wp-config.php (step 3). Do this before step 5.
5. **Elementor pages for Main:** `ACADVIZEN_CMS_RENDER_BRIDGE` in wp-config.php, then Vercel `WORDPRESS_CONTENT_ENABLED=true` and redeploy (steps 4–5). This changes production traffic only for pages later approved and published to Main.
6. **Migrate Main pages** one group at a time (`MAIN-MIGRATION-PLAN.md` §4), starting with one low-traffic page. Review each in the desktop/tablet/phone preview; the converter is close but not pixel-identical (O-28).
7. **Server cron:** Hostinger → Cron Jobs → call `https://enroll.acadvizen.com/wp-cron.php` every minute. This keeps scheduled publishing and verification on time (O-29).
8. **Staging (O-5)** would let all of the above be rehearsed on a copy first. Strongly recommended.
9. Earlier items below (O-2 to O-4, O-6, O-8, O-11) still stand.

## Earlier: remaining as of 13 October 2026, 03:00 UTC

**Production is unchanged and healthy** (read-only checks, 12 Oct 19:41 – 13 Oct 02:55 UTC):
- Release 10 is live (`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`);
- plugin 0.6.1 is installed and identical to its package;
- "Test connection" says Connected;
- all 314 Main addresses and all 60 Enrollment pages are identical to the baselines.

**Your decision, recorded:** existing passwords and keys are not changed, rotated, revoked or deleted. The exposure in public Git history therefore remains an accepted residual risk (`FINAL-SECURITY-REPORT.md`).

**First, two decisions from your 13 Oct instruction:**
- **WordPress → Main publishing is currently ON** (since 12 Oct; Render Bridge OFF). Say "keep on", or "switch off" (Vercel → remove `WORDPRESS_CONTENT_API_ENABLED` → Redeploy). Nothing was changed.
- **Uncommitted work** (content-API conflicts and redirects, plugin 0.7.0, new tests, these documents) waits for your review. Commit commands: `FINAL-RELEASE-AND-ROLLBACK.md` §3, step 0. Four code commits made earlier on 13 Oct (`03d18dc`, `df30076`, `fc53a7e`, `436a822`) are local and unpushed.

**Your actions, in order of value:**
1. **Release 11** (committed locally, not pushed): `git push origin headless-wordpress`, then promote the new Preview in Vercel (`FINAL-RELEASE-AND-ROLLBACK.md` §3, with smoke tests and rollback). What it brings:
   - faster pages: tool pages about 6.2 → 1.9 s in the local model; home and course pages one or two fewer database round trips;
   - `npm audit` 0 (was 2 high);
   - safer handling of Supabase keys.
   - Nothing visible changes.
2. **Staging (O-5), the single external action that unblocks the rest:**
   - Hostinger hPanel → WordPress → **Staging** for enroll.acadvizen.com (or a full backup download);
   - a non-production Supabase project.
3. **Enrollment homepage (O-3):** delete the duplicated container, following the steps in `FINAL-OPEN-ISSUES.md` O-3, if it was not intended.
4. **WordPress updates (O-6):** they passed a local rehearsal. On production: Hostinger backup, then core, then Elementor + Elementor Pro, then the rest, comparing after each step.
5. **Decide:**
   - O-2: keep the content connection on (recommended);
   - O-4: try the `syd1` region on a Preview;
   - O-8: the integration account's password or role;
   - O-11: confirm Clarity, WPConsent and Pixel Manager were intended, and gate Clarity behind consent.
6. **If you later decide to rotate credentials:** the optional plan is in `FINAL-SECURITY-REPORT.md` §5.

**Done by the engineer (no production change):**
- removed the redundant `%TEMP%acadvizen-production-verify.env` (12 Oct 19:47 UTC; do not save it again from an open editor tab);
- put the SSH host on its own line in your credentials file (values unchanged; O-10).

## Earlier status, as of 12 October 2026, 18:40 UTC

Everything technical is done and verified on production:
- Release 10 is live (`dpl_8C59rWUwpicv7eaqiqinsRWeKP5T`);
- plugin 0.6.1 is installed;
- "Test connection" says Connected;
- Main only, Enrollment only and Both pass through the real admin, with all test content removed.

Owner actions left:
1. **Critical: change the credentials exposed in public Git history.** Without this, the project is not client-ready.
   - **Production database password:** Supabase → Project Settings → Database → Reset. The websites do not use it.
   - **Main admin password:** in `www.acadvizen.com/admin`.
   - **Service-role key:** on hold by your instruction. It gives full read and write access to all Main data, including leads.
2. **Passwords shared in chat:** change them (Hostinger, WordPress, FTP, Vercel). Give the WordPress integration account a unique password; its username is guessable.
3. **Enrollment homepage:** "Where Our Learners Build Their Careers" now appears twice (Elementor edit on 12 Oct, 11:44 and 12:42 UTC, by WordPress user ID 1). Remove the duplicate in Elementor if it is not intended.
4. **Your credentials file:** put the SSH host on its own line. It is joined onto the end of the `ACADVIZEN_CMS_WEBHOOK_SECRET` line.
5. **Optional:**
   - WordPress 7.1.3 and 13 plugin updates (test first);
   - a staging database for future Preview testing;
   - the known Enrollment issues (sitemaps, redirects, `/contact-us/`, logo link).

## Earlier status, as of 12 October 2026 (evening)

**Update, 12 Oct 13:57 UTC:**
- **`wp-config.php` is done**, by the owner. Plugin Settings show "Main Website address https://www.acadvizen.com" and "Shared secret: Set". The **Main Website → Pages** screen lists 50 Main pages, so WordPress → Main signed requests work on production.
- **`WORDPRESS_CMS_API_URL` was added** to Vercel Production at 13:54 UTC, with the correct value. The running deployment was built earlier, so it does not see it yet.
- **What remains is release 10, with your approval:** commit, push and Promote. Until then, "Test connection" shows `http_503: wordpress_content_disabled` and editor previews are blocked.

Earlier notes, kept for history:

Plugin 0.6.0 is installed and active on Enrollment, and the site is preserved. Main's production secret was verified to equal the credentials-file secret, using a signed read-only request (HTTP 200). Three things remained:

1. **`wp-config.php`** (done since; see the update above).
   - The SSH details you added cannot be used: the engineer's permission system refused SSH access ("credential exploration"). That decision is yours.
   - Either allow it (add a permission rule in Claude Code for the SSH step), or add the lines yourself in hPanel → File Manager → `public_html/wp-config.php`:
     1. **Download** the file first; that copy is the backup.
     2. Above `/* That's all, stop editing! */`, add:
        ```php
        define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
        define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', '<the 64-character value between the quotes of ACADVIZEN_CMS_WEBHOOK_SECRET in your credentials file>' );
        ```
   - Afterwards: WordPress → Acadvizen Master Admin → **Settings** → "Shared secret: Set".
2. **Release 10 (Main), with your approval** (`RELEASE-REVIEW.md` lists the commands):
   - **the WordPress "Test connection" button works:** before this fix it reports "Not connected" in production even when the connection works;
   - **the Vercel Production variable** `WORDPRESS_CMS_API_URL=https://enroll.acadvizen.com/wp-json/acadvizen-cms/v1`, so the WordPress editor's preview frames are allowed. Do **not** set `WORDPRESS_CONTENT_ENABLED`.
3. **Credentials file format.** The `ACADVIZEN_CMS_WEBHOOK_SECRET` line is missing a line break: the SSH host setting is joined onto the end of it.
   - The engineer's tools now read only the quoted value, so the secret still works.
   - Put the SSH host on its own line anyway, or other tools may misread it.

## Already done (no action needed)

| Item | State |
|---|---|
| Database table for replay protection (`202610110001`) | Applied on PRODUCTION and verified (12 Oct) |
| Shared secret | Created. Only in `C:\Users\HP\.acadvizen-production.env`, as `ACADVIZEN_CMS_WEBHOOK_SECRET` |
| Vercel, Production: `WORDPRESS_CMS_WEBHOOK_SECRET` (Sensitive) and `WORDPRESS_CONTENT_API_ENABLED=true` | Set on 12 Oct. They take effect at the next production deployment (step 4). Until then, the live API answers 503 (checked) |
| Supabase backups | 8 daily backups, all completed. Point-in-time recovery is off |
| Main admin login | Works |

## 1. Back up the Enrollment website and keep the files (20 minutes)

**Done, 12 Oct.** The 10 October files backup and database backup were downloaded and verified: complete and valid, and the database is the one Enrollment uses. Details are in `FINAL-EVIDENCE-REPORT.md`. Keep them private and out of Git.

Optional, before installing the plugin: download a newer backup in the same way, so any Enrollment changes made after 10 Oct are covered too. Never click **Restore** unless you have decided on a full rollback. The steps below are kept for future backups.

1. hPanel → **Websites** → enroll.acadvizen.com → **Dashboard** → **Backups** (left sidebar).
2. **Restore and download** → **Files backups** → choose the newest date → **Download files**. Wait until the archive is prepared, then **Download**. You get a `.tar.gz` file.
3. **Database backups** → choose the newest date and the WordPress database → **Download database** → **Download**. You get a `.sql.gz` file.
4. Save both in a private folder **outside the project**, for example `C:\Users\HP\Backups\acadvizen-enroll\2026-10-12\`. Never put them in the project folder or in Git.
5. Tell the engineer the folder path only. The engineer checks:
   - the file sizes;
   - that each archive opens and is complete (`gzip -t`, plus a count of the archive's entries);
   - that the database dump contains WordPress tables, by checking table names only.

   No content is printed or copied.

The backup listed in hPanel is itself a restore point (Backups → Restore). The downloaded copy is an independent second copy.

## 2. Give the engineer WordPress access, or install the plugin yourself (10 minutes)

**Done, 12 Oct.**
- The owner added a dedicated administrator account (in the credentials file).
- The engineer signed in once and installed plugin **0.6.0**, now active.
- The Enrollment site is unchanged: 60/60 pages identical to the baseline.

**Remaining blocker: step 3 (`wp-config.php`).** The notes below are history. On 12 Oct, the password sent again in chat was compared with the saved one: it is the same. One more attempt was made and refused ("The password you entered … is incorrect"). That is four refusals in all, so it will not be tried again.

Quickest fix (about 3 minutes):
1. hPanel → **Websites** → enroll.acadvizen.com → **WP Admin**. This signs you in without a password.
2. **Users → Profile → Set New Password**, then **Update Profile**.
3. Put the new password in `C:\Users\HP\.acadvizen-production.env` as `WP_PROD_PASS='…'`. Then tell the engineer "password updated". Not in chat. The account's email address should be changed to one you can read, so its password can be reset. Choose **one** of these two options.

**Option A, preferred: an engineer account.**
1. While signed in to WordPress → **Users** → **Add New User**.
2. A username of your choice (not written in any document); your own email address; a strong password; role **Administrator** → **Add New User**.
3. Open `C:\Users\HP\.acadvizen-production.env` in Notepad. Set `WP_PROD_USER='<that username>'` and `WP_PROD_PASS='<that password>'`, then save. You can remove this account after the handover.

**Option B: install the plugin yourself.**
1. WordPress → **Plugins** → **Add New Plugin** → **Upload Plugin**.
2. Choose `dist\acadvizen-cms-0.6.0-45d78b9\acadvizen-cms.zip` from the project folder.
   - SHA-256 `93d5e3913c7ac1f492ab6062ec88eb7047754afc6f709778c03eceffccdcf8f3`.
   - In PowerShell, `Get-FileHash <file>` must show the same value.
3. Click **Install Now**, then **Replace current with uploaded**. The plugin stays active.
4. **Plugins** must now show "Acadvizen Master Admin", version **0.6.0**.

What the upgrade from 0.4.0 changes on the Enrollment site:
- it adds its own versions table if needed;
- it refreshes WordPress's saved address rules, in the database only;
- it re-registers its two scheduled jobs.

It does not write `.htaccess`, and it does not change Elementor pages, the theme, menus, posts or other plugins.

**Undo:** **Plugins** → Deactivate "Acadvizen Master Admin" (the Elementor site is unaffected), or upload the previous ZIP the same way.

## 3. Add the shared secret to WordPress (5 minutes)

**Status (12 Oct):** not done. This is the **only remaining blocker**: the plugin reports "Not connected to the Main Website" until these two lines exist. Choose one:
- **(a) Let the engineer do it:** hPanel → **Files → FTP Accounts**. Note the SFTP host, port and username, and set a password. Save them in the credentials file as `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER` and `SFTP_PASS`. The engineer then downloads `wp-config.php` as a private backup outside Git, adds exactly the two lines, checks the PHP syntax, uploads it, and checks the site.
- **(b) Do it yourself**, with the steps below. Download `wp-config.php` first as its backup.

1. Open `C:\Users\HP\.acadvizen-production.env` in Notepad. Copy the value of `ACADVIZEN_CMS_WEBHOOK_SECRET`: the text between the quotes, without the quotes.
2. hPanel → **Websites** → enroll.acadvizen.com → **File Manager** → the site's folder (usually `public_html`) → right-click `wp-config.php` → **Edit**.
3. Just above the line `/* That's all, stop editing! Happy publishing. */`, add:
   ```php
   define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
   define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', 'PASTE-THE-SECRET-HERE' );
   ```
   Replace `PASTE-THE-SECRET-HERE` with the copied value, keeping the quotes. **Save.**
4. Reload any WordPress admin page. If it shows an error, the lines have a typing mistake. Remove the two lines and save to undo.

## 4. Release Main (commit, push, deploy)

**Done on 12 Oct**, under the owner's Option 2 approval:
- commit `dde1328` was pushed to `headless-wordpress` (never `main`);
- the Preview was checked, then promoted;
- live is `dpl_4YpH3TaN…`, and the content API is on and verified.

The steps below are kept for future releases.

This one deployment does two things: it releases the reviewed fixes (`RELEASE-REVIEW.md`), and it switches the content API on, using the variables already set.

1. Review the changes (`git diff`, plus the files listed in `RELEASE-REVIEW.md`). Then, on branch `headless-wordpress`:
   ```
   git add -A app lib tests tools docs package.json package-lock.json
   git status        # must list only the files in RELEASE-REVIEW.md
   git commit -m "Sitemap leaves out noindex pages, editor label fix, dependency security updates, live verification tools"
   git push origin headless-wordpress
   ```
   **Do not push to `main`.** `main` is Vercel's production branch, but it is older than what is live. Pushing it would replace the live site with older code.
2. Vercel → project **acadvizen-newww-ua9d** → **Deployments**. The push creates a **Preview** deployment of `headless-wordpress`. Wait for it to show **Ready**.
3. On that deployment: **⋯** → **Promote to Production** → confirm. Vercel rebuilds it with the **Production** variables.
4. Check: `https://www.acadvizen.com/` loads. Then tell the engineer: "deployed".

**Undo:** Vercel → Deployments → `dpl_EuZnhizEMjYzDATZg45okXUgs1WY` (the current live one) → **⋯** → **Promote to Production** (Instant Rollback). The old build comes back unchanged, with the API off, within a minute.

## 5. Tell the engineer

Say "steps 1–4 done" and give the backup folder path. Nothing else is needed in chat.

## 6. What the engineer then runs (live, PRODUCTION)

| Command | What it proves |
|---|---|
| `node tools/verify-content-api-live.mjs` | Signed API on: unsigned, wrong-secret, stale and replayed requests refused. Main-only publishing of one disposable noindex page: draft hidden → published → section shown → noindex → edit → removed → 404 → nothing left |
| `node tools/verify-wordpress-live.mjs` | Through the Enrollment admin, with one disposable noindex test blog: Main only, Enrollment only, Both, an edit reaching both, then removal from Main, Enrollment and both trash cans. The Elementor home page is still served |
| `node tools/verify-production.mjs` | Every key public page of both sites. Its known Enrollment failures are listed in `PRODUCTION-RELEASE-AND-ROLLBACK.md` |

Plus the production acceptance of the admin screens, as listed in `TEST-PLAN.md`, on labelled test content only.

None of these checks touches leads or sends an enquiry. Results are reported as PRODUCTION only when they ran on the live sites.

## 7. Security (strongly recommended)

- **Also in the public history (found 12 Oct):** the production database password and the working Main admin password. Neither is a Supabase API key, and resetting them does not affect the websites.
  - **Database password:** Supabase → Project Settings → Database → Reset database password.
  - **Main admin password:** `www.acadvizen.com/admin` → your profile.
  - Then keep the new values out of chat. Scripts read the database password from `SUPABASE_DB_PASSWORD`.
- **Unresolved serious risk:** the Supabase service-role key is in the public GitHub history. Anyone who finds it can read and change all Main data, including leads. By your decision it has not been rotated. Rotating it is the single most important security step left: Supabase → Project Settings → API → roll the service role key, then update it in Vercel and redeploy.
- Change the passwords shared in chat during the project: Hostinger, WordPress, FTP and the Vercel login.
- A VS Code AI extension (Blackbox) keeps a compressed copy of the project's `.env.local` in its own storage. Consider removing it, or clearing that extension's storage.

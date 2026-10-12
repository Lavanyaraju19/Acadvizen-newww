# Owner actions to finish the production release (12 October 2026)

These are the steps only the owner can take. Do them in this order. After step 5, tell the engineer, who then runs the live checks in step 6 and reports real results.

Never paste a password or the shared secret into chat, Git, a document or a screenshot.

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

The WordPress password given earlier was refused three times. It will not be tried again. The account's email address should be changed to one you can read, so its password can be reset. Choose **one** of these two options.

**Option A, preferred: an engineer account.**
1. While signed in to WordPress → **Users** → **Add New User**.
2. Username, for example `acv-integration`; your own email address; a strong password; role **Administrator** → **Add New User**.
3. Open `C:\Users\HP\.acadvizen-production.env` in Notepad. Set `WP_PROD_USER='acv-integration'` and `WP_PROD_PASS='<that password>'`, then save. You can remove this account after the handover.

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

1. Open `C:\Users\HP\.acadvizen-production.env` in Notepad. Copy the value of `ACADVIZEN_CMS_WEBHOOK_SECRET`: the text between the quotes, without the quotes.
2. hPanel → **Websites** → enroll.acadvizen.com → **File Manager** → the site's folder (usually `public_html`) → right-click `wp-config.php` → **Edit**.
3. Just above the line `/* That's all, stop editing! Happy publishing. */`, add:
   ```php
   define( 'ACADVIZEN_CMS_MAIN_URL', 'https://www.acadvizen.com' );
   define( 'ACADVIZEN_CMS_WEBHOOK_SECRET', 'PASTE-THE-SECRET-HERE' );
   ```
   Replace `PASTE-THE-SECRET-HERE` with the copied value, keeping the quotes. **Save.**
4. Reload any WordPress admin page. If it shows an error, the lines have a typing mistake. Remove the two lines and save to undo.

## 4. Release Main (commit, push, deploy): your manual step (15 minutes)

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

- **Unresolved serious risk:** the Supabase service-role key is in the public GitHub history. Anyone who finds it can read and change all Main data, including leads. By your decision it has not been rotated. Rotating it is the single most important security step left: Supabase → Project Settings → API → roll the service role key, then update it in Vercel and redeploy.
- Change the passwords shared in chat during the project: Hostinger, WordPress, FTP and the Vercel login.
- A VS Code AI extension (Blackbox) keeps a compressed copy of the project's `.env.local` in its own storage. Consider removing it, or clearing that extension's storage.

# Acadvizen central CMS: client handover (13 October 2026)

**Status: NOT READY for an unconditional handover.**

- **The CMS works on the live websites.** Re-verified 12 Oct 19:33–19:47 UTC: 314 Main addresses and 60 Enrollment pages unchanged, signed security, "Test connection" Connected.
- **Security limitation:** production credentials remain readable in old public GitHub commits. The owner decided on 13 Oct that existing passwords and keys are not to be changed in this work, so that risk is **open, not fixed** (`FINAL-SECURITY-REPORT.md`, `FINAL-OPEN-ISSUES.md` O-1).
- **Open owner decisions:** O-2 to O-6 (content-connection switch, Enrollment homepage duplicate, performance, staging, WordPress updates).

Handing over with these limitations written down is the owner's call.

## 1. How it fits together

| Part | What it is | Who edits it |
|---|---|---|
| **Main website**: www.acadvizen.com | Next.js on Vercel; content in a Supabase database | From WordPress (**Acadvizen Master Admin → Main Website**), or Main's own `/admin` |
| **Enrollment website**: enroll.acadvizen.com | WordPress with Elementor | WordPress **Pages** / **Posts** with Elementor, exactly as before |
| **The connection** | WordPress sends each Main change to `www.acadvizen.com/api/wordpress/content`, signed with a shared secret. Main checks the signature, stores the change, and shows it **in Main's own design** within about a minute | Automatic |

- WordPress never changes Main's design, and the Main website never changes Enrollment.
- The optional "Render Bridge", which would serve WordPress/Elementor pages at Main addresses, is **off**.
- Leads, enquiries, students and users stay in Main's `/admin`.

## 2. Signing in

`https://enroll.acadvizen.com/wp-admin/`, with your own WordPress account.
- **Lost password:** use **Lost your password?**, which works only if your account email is current.
- **Otherwise:** the Hostinger account holder opens hPanel → Websites → enroll.acadvizen.com → **WP Admin** → Users → your account → **Set New Password**.

Then **Acadvizen Master Admin → Settings → Test connection** should say **Connected**.

## 3. What you can edit, and where it appears

| Content | Screen | Appears on | Verified |
|---|---|---|---|
| Existing and new Main pages, with sections | Main Website → **Pages** | www.acadvizen.com/&lt;address&gt; | **Live** (17/17) |
| Blogs | Main Website → **Blogs** | Main, Enrollment, or Both (**Publish To**) | **Live** (16/16) |
| Header, footer, menus, site labels | Main Website → **Header**, **Footer**, **Menus**, **Site settings** | Every Main page | Local copy (18/18) |
| Homepage banner, call to action, lists | Main Website → **Banner**, **Closing call to action**, **Lists**, **Sections** | Main homepage | Local copy (14/14) |
| Courses and course sections | Main Website → **Courses**, **Course sections** | Main course pages | Local copy (12/12) |
| City pages, service pages, locations, cities | Main Website → those tabs | Main | Local copy (15/15) |
| Tools, testimonials | Main Website → those tabs | Main | Local copy |
| Images for Main | Main Website → **Media library** (upload, pick) | Main | Local copy |
| SEO overrides | Main Website → **SEO overrides** | Main | Local copy |
| Blog authors, categories, tags | Main Website → those tabs | Main blog | Local copy |
| Enrollment pages | WordPress **Pages** + Elementor (unchanged) | Enrollment | — |

"Local copy" means the feature was proven on a full copy of both sites but not yet on the live sites, because those edits show to every visitor at once. Preview first, and keep "Earlier versions" in mind.

## 4. Everyday tasks

The full step-by-step guide is `ADMIN-USER-GUIDE.md`.

1. **Change a live page safely:**
   1. **Pages → Edit → Prepare changes privately.** Visitors keep seeing the live page.
   2. Edit sections, clicking **Save section** under each.
   3. **Preview (desktop, tablet, mobile).**
   4. Set **Status** to **Published** and click **Save**. The change replaces the live page.
2. **New page:** **Pages → Add new**, then title, address, description and SEO, then **Save** (draft, private). Add sections, preview, then Published and **Save**.
3. **New blog:** **Blogs → Add new**, then write with the block buttons, set **Publish To** and **Status**, and **Save**.
   - **Main:** www.acadvizen.com/blog/…
   - **Enrollment:** a normal post on enroll.acadvizen.com, kept private on Main. Status shows whether it is live on Enrollment, and later edits keep it live.
   - **Both:** each site shows it in its own design.
4. **SEO:** each page and blog has an SEO title, description and **noindex**. A noindex item is hidden from search engines and left out of the sitemap. **SEO overrides** change these for any address.
5. **Images:** **Media library → Upload** (images up to 3 MB; the file type is checked), then pick them with **Choose from the Main library**. Write a short description of each image (alt text) where the field is offered.
6. **Scheduling:**
   - "**Publish automatically on**" and "**Remove automatically on**", with Status set to **Published**.
   - **Times are entered in the site's time zone, which is UTC** (shown as "+00:00" next to the field). India is UTC+5:30, so 09:00 IST is entered as 03:30.
   - Proven on a local copy: the page appeared within seconds of its time, and was removed on time.
7. **Hide or remove:** Status **Draft** + **Save**, or **Trash**. **Restore** in the trash brings it back as a draft. Editors and Administrators can **Delete permanently**.
8. **Undo:** **Earlier versions → Restore** (the last 20 saves).

## 5. Who can do what

| Role | Main Website screens |
|---|---|
| Administrator, Editor | Everything |
| Author | **Blogs only**: their own articles, including publishing. Every other screen is refused (verified by direct request) |
| Contributor | **Blogs only**: drafts and "submit for review". Publishing is refused, even if forced |

## 6. When something fails

- **A red message names the problem**, for example an address already in use, a broken link, or the Main website not reachable. The live site keeps the previous version.
- **Retrying is safe:** press **Save once** and wait. The admin can take about 20 seconds; a double click is not needed. A change is never applied twice.
- **Test connection says "Not connected":** contact the administrator (see section 8).
- **A page looks wrong after a change:** **Earlier versions → Restore**. If the whole site is affected, the owner rolls back the deployment in Vercel (`FINAL-RELEASE-AND-ROLLBACK.md` §5).

## 7. Known limitations

- **Security:** old credentials are readable in public Git history and, by the owner's decision, have not been changed (see the status at the top).
- **The live-site checks covered pages and blogs only.** The other content types passed on a local copy; staging is not available yet (O-5).
- **Slow screens.** The Main Website admin screens take about 20 seconds (the Enrollment server is slow when nothing is cached). The Main public pages take 1.5–3.5 s (O-4 proposes a fix).
- **Scheduled times are in UTC** (section 4).
- **"Delete permanently" on a blog that was also on Enrollment** moves the Enrollment copy to WordPress's trash. WordPress empties it after 30 days.

## 8. Support and recovery

| Need | Who / where |
|---|---|
| Access, connection, rollback, credentials | The site owner (holds the Hostinger, Vercel, Supabase and GitHub accounts) |
| How to | `ADMIN-USER-GUIDE.md` |
| What was tested | `FINAL-ACCEPTANCE-TESTS.md` |
| Releases and rollback | `FINAL-RELEASE-AND-ROLLBACK.md` |
| Security | `FINAL-SECURITY-REPORT.md` |
| Open items | `FINAL-OPEN-ISSUES.md` |

**Live versions:**
- Main: deployment `dpl_8C59rWUwpicv7eaqiqinsRWeKP5T` (commit `80134d4`, 12 Oct 2026);
- Enrollment plugin: Acadvizen Master Admin 0.6.1 (12 Oct 2026). The installed public files are identical to the release package.

**Prepared, not live:** release 11 (`f855e33`), committed locally and not pushed or deployed. It makes no visible change; it only lets the database key be replaced later without a code change (`FINAL-RELEASE-AND-ROLLBACK.md` §3).

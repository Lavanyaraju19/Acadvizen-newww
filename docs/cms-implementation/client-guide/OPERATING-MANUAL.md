# Acadvizen websites: operating manual

**For:** Acadvizen administrators and reviewers.

**Matches:** the production system as of 26 October 2026.
- Enrollment WordPress with the Acadvizen Master Admin plugin **0.7.10** (installed 26 Oct 2026).
- Main website deployment `dpl_2B5hNrES1eUqxDhrbVJVuEfkiAyV`.

Every screenshot here was taken on the live admin; e-mail addresses are masked. For the short version, see [QUICK-START.md](QUICK-START.md).

---

## 1. How the two websites work together

| | Main Website (www.acadvizen.com) | Enrollment Website (enroll.acadvizen.com) |
|---|---|---|
| What visitors get | A Next.js website on Vercel | A WordPress / Elementor website |
| Where you edit its pages | **Enrollment WordPress admin**, with Elementor | **Enrollment WordPress admin**, with Elementor |
| How a change gets there | WordPress draws the approved page; www.acadvizen.com serves it at the same address | WordPress publishes it directly |

**Which Main addresses come from WordPress.** All 310 public Main addresses in the sitemap are drawn from WordPress (checked 23 Oct 2026):

| Kind of page | How many |
|---|---|
| Homepage and dedicated pages | 20 |
| Blog posts | 86 |
| Tool pages | 67 |
| Location and service pages | 108 |
| City pages | 13 |
| Area and city-course pages | 15 |
| Course page | 1 |

**What stays in the Main Website's own system.** Its own admin (www.acadvizen.com/admin), sign-in pages and student areas. Also these four pages, which show Main database lists:

- `/companies`, `/internships`, `/resources`: these show "check back soon" while empty and stay out of search engines until they have items;
- `/blog/author/…`: author pages.

If you need a page back on the Main Website's own original version, set its WordPress copy to Draft (section 6). Main then shows its original page again at that address.

## 2. Signing in and finding things

1. Go to https://enroll.acadvizen.com/wp-admin/. Sign in, and tick **Remember Me**.

2. Until 26 Oct 2026 the left menu had **Acadvizen Master Admin** with these entries (today's menu is in step 3):

   | Menu item | What it is for |
   |---|---|
   | Dashboard | Overview |
   | Main Website | Main content screens |
   | Pages | |
   | Main Blogs | |
   | Blog Categories | |
   | Courses | |
   | Locations | |
   | Cities & Areas | |
   | FAQs | |
   | Testimonials | |
   | Tools | |
   | Media | |
   | Templates | |
   | Header & Footer | |
   | Menus | |
   | Global Styles | |
   | Website Design | |
   | SEO | |
   | Redirects | |
   | Publishing | Status of every page published to the Main Website |
   | Versions & Rollback | Earlier published versions |
   | Settings | Read-only: set by your developer |
   | Import Main Website | Developer tool |
   | Approvals | The review queue |

   ![Master Admin dashboard](screenshots/01-master-admin-dashboard.png)

3. **The menu (since 26 Oct 2026, plugin 0.7.8 and later)** follows standard WordPress (the screenshot above shows the earlier layout):

   | Left menu | Contains |
   |---|---|
   | **Approvals & Publishing** (opens Approvals) | Approvals, Publishing status, Versions & Rollback, Main Website, Global Styles (both websites), Website Design, Widget compatibility, Import Main Website, Settings |
   | **Pages**, **Templates**, **Media**, **Appearance → Menus**, **Rank Math SEO** (with Redirections), **UAE → Header & Footer** (the Main header and footer) | Their usual WordPress places (no longer repeated under the plugin's menu) |
   | **Main Blogs** | Blog posts, Add New Blog, Blog Categories |
   | **Courses**, **Tools**, **FAQs**, **Testimonials** | Each its own menu |
   | **Locations** | Locations, Add New Location, Cities & Areas |

   The old Master Admin overview page leaves the menu. Approvals, publishing checks, versions, previews, retries and rollback work exactly as before.

## 3. Editing a page

1. Open the list (for example **Pages**, **Main Blogs** or **Tools**).
2. Hover over the page and click **Edit with Elementor**.
   - **A live page** opens as a **working copy**. Visitors keep seeing the published version until your change is approved and published.
   - **A new page** starts as a draft.
3. In Elementor:
   - **Text, headings, buttons:** click the element on the page and edit it in the left panel. Button links are under *Link*.
   - **Images:** click the image, then **Choose Image**, and pick from or upload to the Media Library. Fill in the *Alt text*.
   - **Sections:** drag widgets from the left panel. Use the element's right-click menu to **Duplicate**, **Delete**, or copy and paste. Use **Structure** (the layers icon) to reorder.
   - **Layout and style:** the *Layout* and *Style* tabs of each element set spacing, columns, width, alignment, background, colours and typography.
   - **Tablet and phone:** switch the device icons at the top. Many settings can be different per device.
4. **Page Settings → Publish To (Acadvizen)** chooses the website: **Enrollment Website**, **Main Website** or **Both**. See section 1 and the screenshot in the quick start.
5. **Preview on the Main Website** (in that panel) shows the last *saved* version exactly as the Main Website will show it. It publishes nothing.
6. Click **Publish** (or **Update**).
   - **For Administrators and Reviewers,** this publishes straight away, recorded on Approvals as approved by you. You can keep editing in the same window and click **Update** again. A future publish date schedules it instead. Choosing *Pending Review* (Quick Edit or the WordPress editor) asks for a review instead.
   - **For Editors, Authors and Contributors,** this **submits** the page for approval. It does not go live until it is approved and published (section 4).
   - A design that cannot be shown on a chosen website (for example a shop widget on Main) is refused with the reason. Typed HTML or shortcodes need an administrator.

![Elementor editor](screenshots/13-elementor-editor.png)

**Shared designs.** Blog posts, tool pages and location pages share one design each, edited under **Templates**. Changing a shared design changes every page that uses it, after approval. The Main header and footer are under **Header & Footer**.

**Shared search settings.** Page title, meta description, canonical URL, robots (index or noindex) and social image are set in the SEO panel of each page or post. They change the live page like content does, so they need approval too.

## 4. Approvals

**Acadvizen Master Admin → Approvals** lists:

- **Waiting for approval:** each item with its websites, a compatibility note and preview links. The previews are *Enrollment design*, *As on the Main website* and *Desktop / tablet / phone*.
- **Approved, ready to publish**
- **Recent publications**
- **History:** who did what, and when.

![Approvals](screenshots/02-approvals.png)

**To approve:**
1. Open each preview.
2. Tick **"I checked the … preview"** for every chosen website.
3. Click **Approve this revision**.
4. Click **Publish approved revision**, or schedule it if the page has a future publish date.

An administrator may approve their own work.

**To send it back:** write what should change and click **Reject**. The item goes back to its author as a draft.

**"Changed since it was submitted".** The item, or something shared that it uses, changed after it was submitted: a header, footer, template, an image, or the site styles. An approval only ever publishes exactly what was approved, so the old approval no longer applies. Check the preview, click **Submit the current version again**, then approve that.

## 5. After publishing: checking the result

- **Publishing** lists every Main page with its status, for example "Main: Published (version 12, 3 hours ago)".
  - A publication is checked on each chosen website within a few minutes.
  - **Failed** means that website did not take the change. The previous version stays live.
  - Open **Versions & rollback** for the page, or use **Check again** / **Retry** on Approvals → Recent publications.
- **Both** reports each website separately. A failure on one never shows as complete success.

![Publishing status](screenshots/03-publishing-status.png)

## 6. Undo, unpublish, restore

| You want to … | Do this |
|---|---|
| Put the previous version back | Approvals → Recent publications → **Restore**, or **Versions & Rollback** → choose the page → choose the version |
| Take a page off the website | The list (Pages, Main Blogs, Tools…) → **Quick Edit** → Status **Draft** → Update. On a Main address, the Main Website then shows its own original page again. |
| Change a page that is live | Edit it (you get a working copy) → Publish → Approvals |

![Versions and rollback](screenshots/04-versions-rollback.png)

## 7. Scheduling

Set a future publish date in the page's **Publish** box (WordPress) before submitting. After approval, **Approved, ready to publish** offers **Schedule approved revision for …**.

The site time zone is **Asia/Kolkata**. Any change to a scheduled item before its time cancels the schedule, and it has to be approved again.

## 8. Media

**Media** is the shared library.

- **Upload:** drag files in.
- **Describe:** set *Alt text*, title, caption and description on each image.
- **In-use images are protected.** An image that a published, scheduled or waiting page still uses **cannot be deleted**. WordPress names the page that uses it. Remove it from that page first.
- **Imported images:** images imported from the Main Website are titled **"Main Website: …"**. They are in use; please keep them.

![Media Library](screenshots/12-media-library.png)

## 9. Menus, header and footer

- **Menus:** the **Main Website Menu** drives the Main header links (Courses with its dropdown, Placement, Achievements, Blog, Contact). The Enrollment menus are the website's existing menus.
- **Header & Footer:** the Main header and footer are Elementor templates published to the Main Website only. Editing one changes every Main page that WordPress draws, after approval.

## 10. What needs your developer

- **Developer-only areas:**
  - Master Admin **Settings** and **Settings → Acadvizen CMS Switches**;
  - plugins, themes, `wp-config.php`;
  - the Vercel project;
  - **Elementor → Site Settings / Global styles**, which affect both websites and make every waiting approval "changed";
  - **Import Main Website**.
- **Backups:**
  - The hosting backups are in Hostinger hPanel → Backups.
  - The last verified backup set is from **24 October 2026 15:15** (database `…_xDzzw` and files; checksum and test restore on 26 Oct, see `PRODUCTION-ACCEPTANCE-2026-10-26.md`).
  - Hostinger makes a backup **weekly** (next: 31 Oct). On this plan, manual backups are locked; for a backup before a large change, wait for the weekly one or upgrade the plan.
  - Ask for a fresh backup before large changes.
- **The Main Website's own admin** (www.acadvizen.com/admin) still opens. Content now edited in WordPress should be edited **here**, not there. Edits made there to pages that WordPress draws will not show on the website.

## 10a. Users, roles and sign-in safety

**Today:** two Administrator accounts exist. One of them is also used by the team for daily work and was used for the 22–23 Oct test runs. Give every person their own account.

**Roles that exist in this WordPress:**

| Role | Can do |
|---|---|
| **Administrator** | Everything, including approving and publishing (self-approval allowed) and the settings. Keep this to one or two owners. |
| **Reviewer (approves publishing)** | Added by Master Admin: everything an Editor can do, plus approving and publishing on **Approvals**. |
| **Editor** | Creates and edits all pages, posts and media, and submits for approval. Cannot approve or publish. |
| **Author** | Own blog posts, submitted for approval. |
| **Contributor** | Own drafts only. |

**To add a person** (an Administrator does this):
1. Go to **Users → Add New User**.
2. Enter the name and e-mail, choose the role, and tick *Send the new user an email*.
3. The person sets their own password from the e-mail.

**Password and session safety:**
- Each person changes their own password under **Users → Profile → Set New Password**.
- On the same screen, **Log Out Everywhere Else** ends that account's other sessions.
- Do not share an account, and never send passwords by e-mail or chat.

**Before removing the shared account:** check that each new account can do its job. Then the owner removes or demotes the shared one.

## 10b. Backups

Hostinger keeps the backups. **hPanel → Websites → enroll.acadvizen.com → Files → Backups** lets you:
- generate a new backup;
- download the latest **database** backup (database `…_xDzzw` is the Enrollment website);
- download the **files** backup.

**Pick the right database.** The hosting account holds several databases. The Enrollment website's is the one ending in **`_xDzzw`**; its backup is a few hundred MB. The 24 Oct download `u713346627_kb4Ph…sql.gz` (30 KB) is a different, almost empty WordPress, not the Enrollment website.

Ask your developer to verify a downloaded backup: checksum, integrity, table count and a test restore in an isolated copy. **Never restore an older backup over the live website**: it would lose every enquiry and change made since.

## 10c. Main Website's own admin

www.acadvizen.com/admin still works for **leads**, users, the student area, and the lists behind **/companies**, **/internships**, **/resources** and the blog author, category and tag pages.

Content that WordPress now draws (pages, blogs, tools, locations, header, footer, menus, SEO) must be edited in **WordPress**. Since 26 Oct 2026 Main's admin **refuses** such edits with the message "This content is managed in the WordPress Master Admin" (HTTP 423). Leads, users, the student area and the companies, internships, resources and blog author, category and tag lists stay editable there.

## 11. Known differences and limits (as of 23 Oct 2026)

These are known and recorded; none breaks a page.

| Where | What |
|---|---|
| Main colours and fonts | Main colours and fonts are set in each design, not in shared Site Settings (this protects other people's approvals). A brand-wide colour change means editing the shared templates (header, footer, blog / tool / location designs) and the dedicated pages. |
| `/blog` list | September dates read "SEP" (Main used "SEPT"). |
| `/achievements` | The alumni stories carousel uses arrows and dots instead of side tabs. |
| `/digital-marketing-courses-bangalore` | Main showed a "Why choose us" block with placeholder words ("Feature title"); the WordPress version leaves it out. **Owner decision pending.** |
| Homepage | The video shows the browser's player controls under its cover; the page is a little taller on phones. |
| Location pages | No `<h1>` heading (also the case on the Main Website before). |
| 3 blog categories | Three Main posts had a "category" that is a keyword list of 256–304 characters (WordPress allows 200). They were not stored in WordPress, and not shortened. Rechecked 24 Oct: neither website shows these categories on the post or on `/blog`, and Main's own category pages are unchanged. To give these posts real categories, choose short ones in Main's admin and in WordPress. |
| Main's own admin | Locked for content WordPress now draws since 26 Oct (see 10c). |
| Homepage registration popup | Fixed 26 Oct (plugin 0.7.10): the Quick Registration popup now opens over the homepage after about 90 seconds, on desktop and phone. |
| Publication status | Fixed 26 Oct (plugin 0.7.9): a check that was lost is resumed hourly and whenever Approvals opens (Contact is verified again). |

Evidence for every result is in `docs/cms-implementation/PRODUCTION-TASK-LEDGER.md`. What each Elementor widget does on each website, and the exact publication states, are in `docs/cms-implementation/REQUIREMENT-CAPABILITY-MATRIX.md`.

# Acadvizen websites: operating manual

**For:** Acadvizen administrators and reviewers.

**Matches:** the production system as of 23 October 2026.
- Enrollment WordPress with the Acadvizen Master Admin plugin **0.7.7**.
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

2. The left menu has **Acadvizen Master Admin** with these entries:

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
6. Click **Publish**. With approval switched on, this **submits** the page; it does not go live.

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
  - The last verified backup set is from 17 October 2026.
  - Ask for a fresh backup before large changes.
- **The Main Website's own admin** (www.acadvizen.com/admin) still opens. Content now edited in WordPress should be edited **here**, not there. Edits made there to pages that WordPress draws will not show on the website.

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
| 3 blog categories | Categories longer than 200 characters (they were tag lists) were not stored. |
| Main's own admin | Not locked for content WordPress now draws (`WORDPRESS_OWNS_PUBLIC_CONTENT` is not set). |

Evidence for every result is in `docs/cms-implementation/PRODUCTION-TASK-LEDGER.md`.

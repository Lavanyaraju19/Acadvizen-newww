# Publishing with the Acadvizen Master Admin — guide for editors

> **Status (10 October 2026):** this describes the system as built and tested on the staging copy. On the live Enrollment website the plugin is **not installed yet**, so these screens do not exist there today. Until then, keep editing Main content in `https://www.acadvizen.com/admin` and Enrollment pages in WordPress as before. `docs/ACADVIZEN_CLIENT_HANDOVER.md`, section 5, lists what has to happen first.

## Where to work

| To change | Use |
|---|---|
| Pages, courses, locations, Main blogs, tools, FAQs, testimonials, headers, footers, menus, colours and fonts | WordPress: `https://enroll.acadvizen.com/wp-admin/` → **Acadvizen Master Admin** menu, Pages, Templates |
| Leads, enquiries, students, users, LMS and other application data | Main admin: `https://www.acadvizen.com/admin` (unchanged) |

## The one choice that matters: Publish To

Every page, course, location, blog and tool has a **Publish To** box on the right of the edit screen:

| Choice | What visitors see |
|---|---|
| **Enrollment Website** | Shown on `enroll.acadvizen.com` only. This is the default for every existing page, so nothing changes until you choose otherwise. |
| **Main Website** | Shown on `www.acadvizen.com` only. On the Enrollment website it stays hidden (visitors get "not found") and out of search engines. |
| **Both Websites** | Shown on both: design once, published to both. |

Blogs and tools are Main Website content by default.

## Everyday tasks

**Create**
1. Open the content type (for example Acadvizen Master Admin → Main Blogs → Add New Blog), or Pages → Add New.
2. Enter the title and content. Click **Edit with Elementor** to design a page.
3. Choose Publish To.

**Review before publishing**
- **Save Draft** keeps it private on both websites.
- **Preview** shows it to you only.

Drafts are never sent to the Main website.

**Publish**
- Click **Publish**.
- Enrollment shows the page at once.
- For Main, the Publish To box shows "Main: Publishing…" and then "Main: Published (version N, date)". On the test copy this took between a few seconds and about a minute.

**Update**
- Edit, then click **Update**. The Main website gets the new version the same way.
- Autosaves and "Save Draft" on a published page do **not** change the live page.

**Change the address**
- Edit the address (slug) and click Update.
- On the Main website, the old address then sends visitors to the new one.

**Unpublish**
- Either change Status to Draft and Update, or set Publish To to the other website.
- The page is removed from the website(s) it no longer targets, and from the sitemap.

**Delete**
- Move to Trash. The page disappears from both websites.
- Restoring it from the Trash brings it back.

**Undo a change**
1. Open Acadvizen Master Admin → **Versions & Rollback**, choose the page, and click **Make live** on an earlier version.
2. That version stays live until the page is next updated.

## What the status messages mean

| Message | Meaning / what to do |
|---|---|
| Main: Published (version N, …) | Live on the Main website |
| Main: Publishing… | Wait; refresh the screen in a minute |
| Main: Publishing… a first attempt failed, trying again automatically | Nothing to do. The previous version stays live |
| Main: Update failed — previous version still live | Open Acadvizen Master Admin → **Publishing** for the reason, then click Retry |
| Main: Address already used by an existing Main Website page — not shown | The Main website already has its own page at that address. Choose another address, or ask an administrator to tick "Replace" |
| Main: Rolled back to version N | An earlier version was made live on purpose |

## SEO and images

- **Title, description, canonical address and share image** are set in each item's Rank Math box (Main blogs also have SEO fields in "Blog details for the Main Website").
- **"Hide from Google"** ("Do not show this blog in Google search results") on a Main blog keeps it out of search results.
- **Images:** upload to the Media Library and add them in Elementor or as the cover image (Main blogs). Always fill in the image's Alternative Text.

## Shared parts (affect many pages)

Headers, footers, menus, global colours and fonts, and the shared designs under Acadvizen Master Admin → **Website Design** are used on many pages. Saving one republishes every Main page in the background, which can take several minutes. Avoid these changes at busy times.

## Who can do what

- **Editors** can create, edit and publish.
- Only **administrators** can:
  - replace an existing Main website page or set the Main homepage;
  - change Settings;
  - import content.

## If something looks wrong

- Check the item's Publish To box and Acadvizen Master Admin → **Publishing**.
- Acadvizen Master Admin → **Settings** → **Test connection to the Main Website** should say "Connected".
- Send the message shown there to your developer. The technical guide is `docs/ACADVIZEN_MASTER_ADMIN.md`, section 12.

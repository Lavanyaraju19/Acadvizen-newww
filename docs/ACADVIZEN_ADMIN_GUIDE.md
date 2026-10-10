# Publishing with the Acadvizen Master Admin — guide for editors

> **Status (10 October 2026):** this describes the system as built and tested on the staging copy and on a local test system (details: `docs/ACADVIZEN_VISUAL_BUILDER.md`). On the live Enrollment website the plugin is **not installed yet**, so these screens do not exist there today. Until then, keep editing Main content in `https://www.acadvizen.com/admin` and Enrollment pages in WordPress as before. `docs/ACADVIZEN_CLIENT_HANDOVER.md`, section 5, lists what has to happen first.

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
- **Preview** (in Elementor) shows it to you only, with the Enrollment website's design.
- **Preview on the Main Website** shows exactly how it will look on www.acadvizen.com, with Main's header, footer and styles.
  - Where: the Publish To box on the edit screen, or Elementor → gear icon (Page Settings) → Publish To.
  - It works for drafts, pages pending review and scheduled pages, and publishes nothing.
  - It shows the last **saved** version: click Save Draft first, then reload the preview.
  - Icons can be missing in this preview only.

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

## Redesigning

**Change the colour scheme or fonts of the whole website**
1. Open Acadvizen Master Admin → **Global Styles**. Elementor opens its Site Settings.
2. Change Global Colors or Global Fonts, then click **Save Changes** at the bottom of the panel.

Every page that uses the global colours changes, on both websites. The Main website republishes its pages in the background, which can take several minutes. A page's own colours, set directly on that page, stay as they are.

**Redesign a page from scratch**
1. Open it with **Edit with Elementor**.
2. Add, move, duplicate or delete sections, columns and widgets by dragging them.
3. Change spacing, backgrounds, borders, fonts and animations in the left panel.

To work safely on a live page:
1. Use **Duplicate** (Pages list). The copy is a draft with a different address.
2. Redesign the copy and check it with **Preview on the Main Website**.
3. When it is ready:
   - set the old page to Draft and change its address (for example add `-old`);
   - give the copy the original address;
   - publish the copy.

To undo, do the same the other way round. Alternatively, redesign the live page directly: each Update is kept as a version, and **Versions & Rollback → Make live** brings back the previous design.

**Desktop, tablet and mobile**
- Use Elementor's device switcher at the bottom of the panel.
- Settings made in tablet or mobile view apply only to that device.

## Templates and shared designs

- **Save a design for reuse:** in Elementor, the arrow next to Publish → **Save as Template**. To use it, open the folder icon in any page and insert it.
- **One design for every course, location, tool or blog page:** Acadvizen Master Admin → **Website Design** → choose a type → **Edit design with Elementor**. Saving updates every page of that type that has no design of its own.
- **Headers and footers:** under Templates. A header or footer used on only one of the websites needs the developer to switch on one setting first (`ACADVIZEN_CMS_SITE_TEMPLATES`). Until then, both websites use the header and footer they use today.

## City and area pages

1. Add the city: Acadvizen Master Admin → **Cities & Areas** → Add, with no parent.
2. Add the area with the city as its **parent**.
3. Create the page: Acadvizen Master Admin → **Locations** → Add New. Enter the title and address (slug), tick its area under Cities & Areas, and fill in the details (address, phone, map link, courses).
4. Choose Publish To, check with **Preview on the Main Website**, then **Publish**. On the Main website it appears at `www.acadvizen.com/<address>`.
5. If you change the address later, the old address sends visitors to the new one.

## What still needs a developer

- New features or new kinds of data (anything that is not a page, a design or a record of an existing type).
- Moving the current Main website pages into WordPress. This is a one-time import, and it has not been done on the live site yet. Until then, edit the existing Main pages in `www.acadvizen.com/admin`.
- The optional website settings (separate headers and footers per website, sitemap clean-up, login logo).

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

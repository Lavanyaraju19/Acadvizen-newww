# Publishing with the Acadvizen Master Admin — guide for editors

> **Status (12 October 2026).**
> - The Main website's side of the connection is **live**: release 9, with the signed connection switched on and checked on production.
> - The Enrollment website still runs plugin **0.4.0**. The **Main Website** screens described below arrive with plugin **0.6.0**, which is installed once the owner restores WordPress access (`OWNER-ACTIONS.md`).
> - Until then, keep editing Main content in `https://www.acadvizen.com/admin`.
>
> All screens were tested on a local copy (115 browser checks). The connection itself was tested on the live Main website.

## Where to work

| To change | Use |
|---|---|
| Pages, courses, locations, Main blogs, tools, FAQs, testimonials, headers, footers, menus, colours and fonts | WordPress: `https://enroll.acadvizen.com/wp-admin/` → **Acadvizen Master Admin** menu, Pages, Templates |
| Leads, enquiries, students, users, LMS and other application data | Main admin: `https://www.acadvizen.com/admin` (unchanged) |

## Finding existing pages and blogs

| Looking for | Where today |
|---|---|
| Enrollment pages (53) and posts (7) | WordPress → **Pages** / **Posts** (search box at the top right) |
| Images used on Enrollment | WordPress → **Media** (786 files) |
| Main website pages, blogs, tools, courses, homepage, header, footer, menus, city and service pages, images, SEO | WordPress → **Acadvizen Master Admin → Main Website** (plugin 0.6.0). These screens edit the Main website's own records directly; nothing is imported or copied, and each record keeps its www.acadvizen.com address |

## Editing the Main website's existing content: Acadvizen Master Admin → Main Website

> **Status (12 October 2026).** These screens are in plugin **0.6.0**. They were tested on a local copy only; they are **not installed or switched on** for the live websites yet (the live Enrollment site runs plugin 0.4.0). Until they are, the screens show "needs the connection to the Main Website", and Main content is still edited in `https://www.acadvizen.com/admin`.

This screen works directly on what www.acadvizen.com shows today: its pages, blogs, tools, locations, cities and testimonials. You change the text, pictures and settings; the Main website keeps drawing them **in its own design**, so a page looks exactly as before apart from what you changed.

**Find something.** Pick a tab (Pages, Blogs, Tools, Locations, Cities, Testimonials), then type part of the title or address and click **Filter**. Each row has **Edit**, **Preview**, **View live** and **Trash**.

**Change a live page safely.**
1. Open the page and click **Prepare changes privately**. You now work on a private copy; visitors still see the live page.
2. Under **Sections**, open a section, change its text, and click **Save section** under it. Use **Design and devices** for alignment, spacing, colours, text sizes, and **Hide on phones** / **Hide on tablets and computers**.
3. Click **Preview (desktop, tablet, mobile)** to see the copy exactly as www.acadvizen.com will draw it.
4. When it is right, set **Status** to **Published** and click **Save**. The message "Your draft copy was published onto the live page" confirms it. The page address does not change.

Sections can be added (**Add a section**), moved (drag ⠿, or ↑ ↓, then **Save order**), duplicated or deleted. Only the settings the Main website actually uses are offered. Anything else stored in a section is listed as "kept as it is" and never removed.

**Blogs.** Write the article with the block buttons (**Heading**, **Paragraph**, **List**, **Image**…), set **Publish To** (Main Website, Enrollment Website or Both Websites) and **Status**, then **Save**. With Both, each website shows the article in its own design.

**Tools, locations, cities, testimonials.** Edit the fields and tick **Show on the Main Website** to make the item visible; untick it to hide it.

**Undo a change.** Every save is kept under **Earlier versions** on the edit screen (the last 20). The first change you save to existing content also keeps the version before it, so even that first change can be undone. Click **Restore** next to a version to bring it back; the status is not changed. For pages, versions cover the page's own settings (title, address, SEO); section changes are protected by the private copy, so nothing reaches visitors before you publish.

**Remove something.** **Trash** takes it off the website at once; open the list's **Trash** link to **Restore** it (it comes back as a draft, not public). Only Editors and Administrators can **Delete permanently**, and only from the trash. For a blog that was also on the Enrollment website, its Enrollment copy goes to WordPress's own trash (**Posts → Trash**) as a safety net. WordPress empties that trash after 30 days. Delete it there sooner if you want it gone now, but use the post's own **Delete Permanently** link, not **Empty Trash**, which would also remove other people's trashed posts.

**See who changed what.** The **Activity** tab lists every change, who made it and whether it worked (Editors and Administrators).

### The homepage

Open **Main Website → Homepage** (the second row of tabs).

- **Banner:** the badge, heading and text at the very top of www.acadvizen.com. Leave a field empty to keep the built-in text.
- **Closing call to action:** the large box near the end (heading, text, button text and button link).
- **Lists:** the homepage's lists, such as course modules, skills, case studies, tools, hiring partners and frequently asked questions.
  - **The first time:** click **Copy what the homepage shows today**. The homepage looks exactly the same afterwards, and each list becomes editable.
  - **Editing a list:** open it, change, add, reorder (↑ ↓) or remove items, and **Save**.
  - **Hiding a list:** brings back the built-in one.
- **Sections:** the "Who is this for", "From the blog" and registration pop-up texts. In "Who is this for", a description is only shown when it is longer than the built-in one.

### Courses

**Courses** lists every course, with these fields:
- title, address, short description, images, duration and counts;
- **Skills**, one per line;
- **Curriculum**: modules, each with its topics, one per line;
- button texts and links, and SEO.

Tick **Show on the Main Website** to publish a course at www.acadvizen.com/courses/<address>, or untick it to hide the course.

**Course sections** are the extra text blocks of a course. Choose the course first, then **Add a section to this course**.

The **/courses** page itself is a page (Pages → *courses*). To list your courses there, add a **Live list: courses** section to it.

### City pages and service pages

- **City pages** appear at www.acadvizen.com/digital-marketing-course-in-<address>. They have a heading and introduction, an about block, features, figures, testimonials and questions.
- **Service pages** appear at www.acadvizen.com/<address>, for example *google-ads-course-in-mysuru*. They have a heading, overview, curriculum, benefits and questions. An address already used by a page, or by a fixed part of the website such as *blog* or *courses*, is refused, with a message.
- **Extra sections:** both, and **Locations**, can carry extra sections, added with the same section editor as pages. In **Design and devices**, choose **Where on the page**: at the top, after the introduction, before the questions, or at the end.

### Images: the Main Website media library

**Media library** shows the images the Main Website uses.
- **Adding an image:** choose a file (JPEG, PNG, WebP, GIF or AVIF, at most 3 MB), write a short description (alt text) and click **Upload**.
- **Using an image:** every image field has two buttons. **Choose image** picks from the WordPress (Enrollment) library. **Main library** picks from the Main Website's library.
- **Describing an image:** open it to change its name, alt text or caption.

### Blog authors, categories and tags

The **Blog** row of tabs has:
- **Authors:** name, photo and a short bio, shown at www.acadvizen.com/blog/author/<address>;
- **Categories:** www.acadvizen.com/blog/category/<address>;
- **Tags.**

On a blog, choose its **Author** and **Main category**. An author or category that is still used by a blog cannot be deleted. The message says how many blogs use it.

### SEO overrides

Some addresses have an **SEO override**: a title and description that replace the page's own SEO fields in search results.
- **On the page:** its edit screen says so, with **Edit the override** and **Remove it**.
- **All overrides:** the **SEO overrides** tab lists them all.
- **Removing one:** the page's own SEO fields apply again.

### Header, footer and menus

The **Whole website** row of tabs has:
- **Header:** the announcement bar above the menu (on or off, text, link, colours), the phone, email and social links.
- **Footer:** contact details, social links, the copyright line (*{year}* and *{company}* are filled in automatically) and colours.
- **Menus:** the links of the header menu, the footer list and the small legal links.
  - **The first time:** click **Copy the links shown today**. The website looks the same, and every link becomes editable.
  - **Each link has** its text, address, a position, and **Show under** (to make it a drop-down item). It also has switches for computers and phones.
  - **In the header:** a link called *Courses* opens the course menu.
- **Site settings:** the company name, fallback social profiles and the small labels of the header and footer.

Colours left empty use the website's own colours. A colour such as *rgba(255,255,255,0.1)* (a see-through white) is kept as it is.

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
  - It works once the developer has added the connection secret. Until then, it explains that the secret is missing.

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
- On the **Main Website** screen, WordPress's usual roles apply:
  - **Editors and Administrators** work on everything;
  - **Authors** see and publish only the articles they wrote there;
  - **Contributors** save drafts and submit them for review;
  - pages, tools, locations, cities and testimonials need an Editor.
- Only **administrators** can:
  - replace an existing Main website page or set the Main homepage;
  - change Settings;
  - import content.

## Checking that a change is live

1. Wait for the Publish To box (or Acadvizen Master Admin → **Publishing**) to say "Main: Published (version N, …)".
2. Open the page's address shown in the box, in a **private window** so your browser's own copy is not used.
3. Check the text, the images and that the links work.
4. On the other website, check that the page is or is not there, as you chose in Publish To.

## When a publish fails

| You see | Do this |
|---|---|
| "Main: Publishing…" for more than 5 minutes | Open the Pages list once (this restarts an interrupted publish), wait a minute, then check again |
| "Main: Update failed — previous version still live" | Open Acadvizen Master Admin → **Publishing**, read the reason next to the page, and click **Retry**. The old version stays online meanwhile |
| "Main: Address already used by an existing Main Website page — not shown" | The Main website already has its own page there. Choose another address, or ask an administrator about "Replace" |
| Settings says "Not connected" | The connection to the Main website is not configured or is broken. Contact your developer and send them the message shown |
| The page is right in WordPress but old on the website | Wait a minute and reload in a private window. If it is still old, check its status (above) |

## If something looks wrong

- Check the item's Publish To box and Acadvizen Master Admin → **Publishing**.
- Acadvizen Master Admin → **Settings** → **Test connection to the Main Website** should say "Connected".
- Send the message shown there to your developer. The technical guide is `docs/ACADVIZEN_MASTER_ADMIN.md`, section 12.

# Acadvizen websites: quick start for administrators

You manage **both websites from one place**: the Enrollment WordPress admin at
**https://enroll.acadvizen.com/wp-admin/**.

- **Main Website:** www.acadvizen.com
- **Enrollment Website:** enroll.acadvizen.com

Nothing changes on either website until a reviewer approves it and it is published. An administrator may approve their own work.

## The everyday routine

1. **Sign in** at https://enroll.acadvizen.com/wp-admin/ and tick **Remember Me**.

2. **Open what you want to change** in the left menu:
   - **Pages:** the homepage, About, Contact, Courses list, Tools list, Placement, Achievements and the other dedicated pages.
   - **Main Blogs:** blog posts for www.acadvizen.com/blog.
   - **Tools**, **Courses**, **Locations** (with **Cities & Areas** inside it): the matching Main pages.

   *They are normal WordPress menu items, next to Posts and Pages. The plugin's own menu is **Approvals & Publishing**.*

3. **Edit with Elementor.** Click **Edit with Elementor**. Click any heading, text, button or image on the page and change it in the left panel.

   *Opening a live page gives you a private working copy. Visitors keep seeing the current version until your change is approved.*

   ![Elementor editor](screenshots/13-elementor-editor.png)

4. **Choose the website.** Open **Page Settings** (the page icon in the top bar), then **Publish To (Acadvizen)**, and pick one:

   | Choice | Where the page appears |
   |---|---|
   | Enrollment Website | enroll.acadvizen.com only |
   | Main Website | www.acadvizen.com only |
   | Both | both websites |

   ![Publish To](screenshots/14-elementor-publish-to.png)

5. **Preview.** Use the **Preview on the Main Website** link in that panel, or the desktop, tablet and phone icons at the top. Previewing publishes nothing.

6. **Publish.** Click **Publish** (or **Update**).
   - **Administrators and Reviewers:** this publishes, as in normal WordPress. The page updates on the chosen website(s) within about a minute, and you can keep editing and click **Update** again. A page with a future date is scheduled instead. (Choosing *Pending Review* instead asks for a review.)
   - **Editors, Authors and Contributors:** Publish only *submits* the change for approval. Nothing goes live until step 7.

7. **Approve and publish** (only for a submitted change). Click **Approvals & Publishing** in the left menu (it opens Approvals).
   1. Open the previews and tick **"I checked the … preview"**.
   2. Click **Approve this revision**.
   3. Click **Publish approved revision**.

   The website updates within about a minute.

   > **Edit, don't duplicate:** to change a page, open that page and click **Update**. Never create a new page or a copy to change an existing one. A new address ending in "-1" means the page already exists.
   >
   > **If Publish is interrupted** (lost connection, closed tab): your change stays in the page's working copy; it is not lost and not published. Open the page again and click **Publish** (or **Update**). The same page is updated; no copy is created.
   >
   > **"Draft" after Publish?** In Elementor you edit the page's *working copy*, which stays a draft by design. The live page is still **Published**. The coloured bar at the bottom of the editor shows the live page's real status (green = published and identical). In **Pages**, the page's own row has no "Draft" label.

   ![Approvals](screenshots/02-approvals.png)

8. **Check the live page.** **Approvals & Publishing → Recent publications** shows each website's result: *Published (verified)*, *Publishing* (being checked), or *Failed* with the reason. **Check again** retries a failed website. Open the page on the website to confirm.

## If something says "Changed since it was submitted"

The page, or something shared it uses (header, footer, template or site styles), changed after it was submitted. So the old approval no longer applies.

Check the preview, then click **Submit the current version again**, and approve that.

## Undo a change

- **Approvals → Recent publications → Restore** puts the earlier version back live.
- **Versions & Rollback** lists every published version of each Main page.
- To take a page off the website: **Pages (or Blogs, Tools…) → Quick Edit → Status: Draft**. A Main address then shows the Main Website's own original page again.
- **Never take the Enrollment homepage offline.** That is the page chosen under **Settings → Reading → Homepage**. To replace it: publish the new page, choose it there, check https://enroll.acadvizen.com/, and only then unpublish the old one.

## Images

Upload and replace images in **Media**. An image that a published or waiting page still uses **cannot be deleted**; WordPress tells you which page uses it.

Imported Main images are titled **"Main Website: …"**. Please don't delete them.

## Please do not

- change **Settings → Acadvizen CMS Switches** or the Master Admin **Settings**;
- change plugins, the theme, or anything under **Elementor → Site Settings** (it affects both websites);
  - in particular, **never activate a second SEO plugin** (such as Yoast SEO) next to **Rank Math**. On 28 October, Yoast was switched on for a few hours. It replaced every page title on both websites with "Demo - Copy", "About (Main) - enroll.acadvizen.com" and similar, and added wrong canonical addresses. All titles and descriptions live in Rank Math;
  - don't deactivate all plugins at once to troubleshoot; ask your developer instead;
- approve or delete other people's waiting items unless that is your role.

Ask your developer for any of these.

The full operating manual is in [OPERATING-MANUAL.md](OPERATING-MANUAL.md).

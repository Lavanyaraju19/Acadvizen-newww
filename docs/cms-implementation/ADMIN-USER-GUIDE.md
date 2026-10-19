# Acadvizen Master Admin — beginner's user manual

*For the person who updates the Acadvizen websites. No technical knowledge needed. Written 15 October 2026 for plugin 0.7.1.*

You manage the content of **two websites** from **one place**:

| Website | Address | What it is |
|---|---|---|
| **Main website** | `https://www.acadvizen.com` | The main Acadvizen site (courses, blog, tools, city pages) |
| **Enrollment website** | `https://enroll.acadvizen.com` | The enrollment and landing pages, designed with Elementor |

Both are managed from the **Enrollment website's WordPress admin**: `https://enroll.acadvizen.com/wp-admin/`. Students, leads, enquiries and payments stay in the Main website's own admin, `https://www.acadvizen.com/admin` (see section 13).

The one-page summary is `ADMIN-QUICK-REFERENCE.md`.

---

## How to read the labels in this manual

Every task carries one label, so you know how far you can rely on it:

| Label | Meaning |
|---|---|
| **Production-verified** | Done and checked on the real, live websites |
| **Local-only** | Tested on a full copy of the websites, not on the live ones. The screen is present on the live admin, but be extra careful: preview first and change one thing at a time |
| **Disabled** | Built, but switched off on the live websites. Do not use it |
| **Unavailable** | Not part of this system |
| **Unverified** | A normal WordPress or Elementor feature that this project did not test |

---

## 1. Which content appears on which website

| Content | Where you edit it | Main website | Enrollment website |
|---|---|---|---|
| **Blogs** | Master Admin → Main Website → **Blogs** | Yes, if Publish To = Main Website or Both Websites | Yes, if Publish To = Enrollment Website or Both Websites |
| Main pages | Master Admin → Main Website → **Pages** | Yes | No |
| Courses, course sections | Main Website → **Courses**, **Course sections** | Yes | No |
| Tools, city pages, service pages, locations, cities, testimonials | Main Website → those tabs | Yes | No |
| Homepage banner, closing call to action, sections, lists | Main Website → **Homepage:** row | Yes (homepage) | No |
| Header, footer, menus, site settings, redirects, SEO overrides | Main Website → **Whole website:** row | Yes (every page) | No |
| Images for the Main website | Main Website → **Media library** | Yes | No |
| Enrollment pages | WordPress → **Pages** → **Edit with Elementor** | No | Yes |
| Images for the Enrollment website | WordPress → **Media** | No | Yes |

**Only Blogs let you choose the website.** Everything under *Main Website* appears on the Main website only.

---

## 2. Signing in and out

**Production-verified** (15 Oct 2026).

**Sign in**
1. Open `https://enroll.acadvizen.com/wp-admin/`.
2. Type your **Username or Email Address** and your **Password**.
3. Click **Log In**.
4. You see the WordPress dashboard. The black menu on the left contains **Acadvizen Master Admin**.

**Sign out**
1. Point at your name at the top right of the screen.
2. Click **Log Out**.

**Forgot your password?** Click **Lost your password?** on the sign-in page. A reset link is sent to your account's email address. Never send a password by chat or email.

*Example:* sign in, check that **Acadvizen Master Admin** is in the left menu, then click **Log Out**. You are back on the sign-in page.

---

## 3. Finding your way: Acadvizen Master Admin → Main Website

**Production-verified** (screens checked 15 Oct 2026).

1. In the left menu, point at **Acadvizen Master Admin** and click **Main Website**.
2. The screen is called **Main Website — Pages**. Below the heading are four rows of tabs:

| Row | Tabs |
|---|---|
| (first row) | **Pages, Blogs, Tools, City pages, Service pages, Courses, Course sections, Media library, Locations, Cities, Testimonials, Activity** |
| **Homepage:** | **Banner, Closing call to action, Sections, Lists** |
| **Blog:** | **Authors, Categories, Tags** |
| **Whole website:** | **Header, Footer, Menus, SEO overrides, Redirects, Site settings** |

3. Each tab shows a list. To find something, choose a status in **All statuses** or type in **Search title or address**, then click **Filter**.
4. Each row has links on the right. Depending on the tab, these are **Edit**, **Preview**, **View live**, **Hide**/**Show** and **Trash**.
5. To create something new, click **Add new** next to the heading.

**Good to know**
- A screen can take a few seconds to open, because it fetches the live Main website. Wait for it, and **click Save only once**.
- A new item has a **Create** button. An existing item has a **Save** button.
- **Status** decides what visitors see. **Only Published is shown on the website.** *In review* and *Approved* are only labels for your team; the approval workflow is **Disabled**. **Archived** keeps an item off the website.
- The other entries in the **Acadvizen Master Admin** menu are **Pages, Media, Templates, Header & Footer, Menus, Global Styles, SEO, Redirects** and **Settings**. They are shortcuts to the **Enrollment** website's own WordPress tools; they do not change the Main website. In particular, **Global Styles** opens the Elementor editor for the whole Enrollment site's colours and fonts. Do not change it unless you mean to restyle every Enrollment page.

---

## 4. Blogs: write, preview, publish, update, unpublish

**Production-verified:**
- **Enrollment Website** and **Both Websites**: 15 Oct 2026, plugin 0.7.1;
- **Main Website**: 14 Oct 2026, plugin 0.7.0;
- editing and unpublishing: 15 Oct.

### 4.1 Write a new blog (as a draft)
1. **Main Website → Blogs → Add new**. The screen is called **New blog**.
2. Fill in:
   - **Title**, for example *5 SEO tips for beginners*;
   - **Address**: the end of the web address, lowercase with dashes, for example `seo-tips-for-beginners`;
   - **Summary**: shown on the blog list and under the title.
3. Optionally fill in **Excerpt**, **Cover image** (**Choose image** or **Main library**), **Author** and **Main category**.
4. Under **Article**, click a block button (**Heading**, **Paragraph**, **List** or **Image**) and type into the block. Add as many blocks as you need.
5. Optionally fill in **SEO title** and **SEO description**.
6. In the **Publish** box on the right:
   - **Publish To**: choose the website (see 4.2);
   - **Status**: leave it on **Draft**.
7. Click **Create**. The message "Saved on the Main Website." confirms it.

A draft is **not public** on either website.

### 4.2 Choosing the website: Publish To

| Choose | The blog appears at |
|---|---|
| **Main Website** | `https://www.acadvizen.com/blog/<address>` |
| **Enrollment Website** | `https://enroll.acadvizen.com/<address>/` (a normal Enrollment post, in the Enrollment design) |
| **Both Websites** | Both addresses above, each in its own website's design, from one save |

*Example:* you pick **Both Websites** with the address `seo-tips-for-beginners`. After publishing, the article is at `https://www.acadvizen.com/blog/seo-tips-for-beginners` and at `https://enroll.acadvizen.com/seo-tips-for-beginners/`.

### 4.3 Preview before publishing
- Open the blog (**Edit**) and click **Preview (desktop, tablet, mobile)**. You see it in the Main website's design. Use **Desktop**, **Tablet** and **Mobile** to switch sizes, and **← Back to editing** to return.
- For the Enrollment design of a draft (Enrollment or Both), open WordPress → **Posts**, find the post with the same title (it is a draft) and click **Preview**.

### 4.4 Publish
1. Open the blog (**Edit**).
2. Set **Status** to **Published**.
3. Click **Save**.
4. Check the live address (section 11). On the tests it appeared within seconds.

### 4.5 Update a published blog
1. **Edit** → change the text → **Save**. The change reaches the website or websites in **Publish To**.
2. Check the live address.

### 4.6 Unpublish (take it off the website)
1. **Edit** → set **Status** to **Draft** → **Save**.
2. Check: the live address now shows "page not found".

The blog is kept as a draft, so you can publish it again later. For Enrollment and Both, the Enrollment post also becomes a draft. It disappears from the Enrollment blog list, RSS feed and sitemap.

### 4.7 Hide from search engines
- Tick **Hide from search engines** to keep an article out of Google and other search engines. With Enrollment or Both, the Enrollment post gets the same setting, and it is not sent to search engines (**Production-verified**, plugin 0.7.1).
- This does **not** hide it from visitors: a published article still appears in the blog lists and the Enrollment RSS feed. To keep something private, leave it as a **Draft**.
- **Leave out of the sitemap** removes it from the Main website's sitemap (**Local-only**).

### 4.8 Remove a blog completely
**Trash** (in the list) takes it off the website at once. **Local-only** for restoring from the trash (section 12); **Delete permanently** is final.

### 4.9 Editing a blog in WordPress → Posts
**Local-only.** A blog published to Enrollment or Both is also a normal post under WordPress → **Posts**, and saving it there also updates the Main website. For everyday work, use **Main Website → Blogs**.

---

## 5. Main website pages

**Production-verified** (15 Oct 2026, 17 checks): creating, sections, preview, publishing, private changes, address protection and unpublishing.

### 5.1 Change a live page safely (recommended)
1. **Main Website → Pages** → find the page (for example search `about`) → **Edit**.
2. Click **Prepare changes privately**. You now work on a private copy; visitors still see the live page.
3. Under **Sections**, open a section, change its text and click **Save section** under it.
4. Click **Preview (desktop, tablet, mobile)** and check the copy.
5. Set **Status** to **Published** and click **Save**. The message "Your draft copy was published onto the live page" confirms it.
6. Open the live address (**View live** in the list) and check the change.

### 5.2 Create a new page
1. **Main Website → Pages → Add new** (**New page**).
2. Fill in **Title** and **Address**, for example `summer-workshop`. The page will be at `https://www.acadvizen.com/summer-workshop`.
3. Optionally fill in **Short description**, **SEO title**, **SEO description** and **Share image**.
4. Leave **Status** on **Draft** and click **Create**.
5. Under **Sections**, choose a section type, click **Add**, fill it in and click **Save section**. Repeat for each section.
6. **Preview (desktop, tablet, mobile)**, then set **Status** to **Published** and click **Save**.

**Address already used?** If another page already uses the address, saving is refused with "This address is already used by another record." Nothing is overwritten. Choose a different address.

### 5.3 Unpublish a page
**Edit** → **Status: Draft** → **Save**. The address then shows "page not found".

---

## 6. Courses and course sections

**Local-only** (12 checks on the test copy). The production form was checked (15 Oct).

**Edit a course**
1. **Main Website → Courses** → **Edit**.
2. Fields you will use most: **Title**, **Subtitle**, **Short description**, **Description**, **Main image**, **Duration**, **Skills** (one per line), **Curriculum** (modules with their topics), **Main button text / link**, **SEO title / description**.
3. **Show on the Main Website** ticked = visible at `https://www.acadvizen.com/courses/<address>`. Unticked = hidden.
4. Click **Save**, then check with **View live**.

*Example:* change **Duration** from 4 to 5 → **Save** → **View live** → the course page shows 5.

**Course sections** are extra text blocks on a course page:
1. **Course sections**.
2. Choose the course (*Choose a course to see its sections.*).
3. **Add a section to this course** → **Section heading**, **Text**, **Position** → **Create**.

---

## 7. Homepage content

**Local-only** (14 checks on the test copy). The production forms were checked (15 Oct).

Open **Main Website** and use the **Homepage:** row:

| Tab | What it changes on `https://www.acadvizen.com` | How |
|---|---|---|
| **Banner** | The badge, heading and text at the very top | **Edit** → **Badge above the heading**, **Heading**, **Text under the heading** → **Save**. Leave a field empty to keep the built-in text |
| **Closing call to action** | The large box near the end | **Edit** → **Heading**, **Text**, **Button text**, **Button link** → **Save** |
| **Sections** | Texts such as "Who is this for" and "From the blog" | **Edit** → change → **Save**. **Hide** hides that section |
| **Lists** | Homepage lists (skills, tools, hiring partners, frequently asked questions…) | **Not set up yet on the live site** (the list is empty). The first time, someone must click **Copy what the homepage shows today**; the homepage looks the same afterwards and each list becomes editable. Ask the technical team to do this first step with you |

On the **Banner**, **Closing call to action**, **Header**, **Footer** and **Site settings** rows you will also see **Delete permanently**. **Never use it there**: use **Edit**.

---

## 8. Header, footer, navigation and site settings

**Local-only** (18 checks on the test copy). The production forms were checked (15 Oct). Changes appear on **every** Main page. Other pages can take about 5–10 minutes to show them.

| Tab | Fields |
|---|---|
| **Header** | **Show the announcement bar above the menu**, **Announcement text**, **Announcement link**, colours, **Phone number**, **Email address**, **Social links** |
| **Footer** | **Phone**, **Email**, **Address**, **Social links**, **Copyright line** (*{year}* and *{company}* are filled in automatically), colours |
| **Menus** | Each link: **Menu** (Header menu, Footer links or Legal links), **Text**, **Link**, **Show under** (makes it a drop-down item), **Position**, **Opens in**, **Show on computers and tablets**, **Show on phones** |
| **Site settings** | **Company name**, social profiles, and the small labels of the header and footer |

**Menus are not set up yet on the live site** (the list is empty). The first time, someone must click **Copy the links shown today**; the website looks the same afterwards and every link becomes editable. Ask the technical team to do this first step with you.

*Example (announcement bar):* **Header → Edit** → tick **Show the announcement bar above the menu** → **Announcement text**: *New batch starts 1 November* → **Save** → open the homepage and check the bar.

---

## 9. Other Main content

**Local-only** (15 checks on the test copy). The production forms were checked (15 Oct).

| Tab | Key fields | Visible when |
|---|---|---|
| **Tools** | Name, Address, Category, Description, Logo, Website | **Show on the Main Website** ticked (also **Show**/**Hide** in the list) |
| **City pages** | City, Address, Heading, Introduction, Features, Figures, Questions and answers | **Show on the Main Website** ticked. Address: `/digital-marketing-course-in-<address>` |
| **Service pages** | Title, Address, Overview, Curriculum, Questions and answers | **Show on the Main Website** ticked. An address already used by a page or a fixed part of the site (e.g. *blog*) is refused |
| **Locations**, **Cities** | Name, Address, Introduction, contact details | **Show on the Main Website** ticked |
| **Testimonials** | Student name, Role, Company, Course, Rating (1–5), Quote, Photo | **Show on the Main Website** ticked |
| **Authors**, **Categories**, **Tags** (row **Blog:**) | Name, Address, description or photo | Used by blogs. An author or category still used by a blog cannot be deleted |

---

## 10. SEO, redirects and images

**SEO on a page or blog** (**Production-verified** for pages and blogs): **SEO title**, **SEO description**, **Canonical address** (leave empty normally), **Share image**, **Hide from search engines**, **Leave out of the sitemap**.

**SEO overrides** (**Local-only**):
- Some addresses (for example the homepage) have an override that replaces the page's own SEO fields.
- **Main Website → SEO overrides** → **Edit** → **SEO title**, **SEO description**, **Social sharing image** → **Save**.
- **Remove override** makes the page's own SEO fields apply again.

**Redirects** (**Local-only**): send visitors from an old address to a new one on the Main website.
1. **Main Website → Redirects → Add new**.
2. **Old address**, e.g. `/old-seo-course`; **Send visitors to**, e.g. `/seo-course-in-bangalore`; **Kind of redirect**: **Permanent (301)** for a page that has moved.
3. Click **Create**. It is saved **switched off**.
4. **Edit** → tick **Show on the Main Website** → **Save**. Now it works.

To stop a redirect, untick **Show on the Main Website** → **Save**. The website refuses redirects that would loop, duplicate another redirect, take over system addresses, or hide a published page.

**Images for the Main website** (**Local-only**):
1. **Main Website → Media library**.
2. Under **Add an image to the Main Website library**, choose a file (JPEG, PNG, WebP, GIF or AVIF, at most 3 MB) and write the alt text.
3. Click **Upload**.

To use an image, click **Main library** next to any image field. **Choose image** picks from the Enrollment library instead. To describe an image, **Edit** it: **Name**, **Description for screen readers and search engines (alt text)**, **Caption**.

**Scheduling** (**Local-only**): **Publish automatically on** and **Remove automatically on**, with **Status: Published**. **Times are in UTC** (India is UTC + 5:30): to publish at 10:00 IST, enter 04:30.

---

## 11. Checking that a change is live

1. In the list, click **View live**, or open the address yourself:

| Content | Live address |
|---|---|
| Main page | `https://www.acadvizen.com/<address>` |
| Blog (Main) | `https://www.acadvizen.com/blog/<address>` |
| Blog (Enrollment) | `https://enroll.acadvizen.com/<address>/` |
| Course | `https://www.acadvizen.com/courses/<address>` |
| Tool | `https://www.acadvizen.com/tools/<address>` |
| City page | `https://www.acadvizen.com/digital-marketing-course-in-<address>` |
| Author / category | `https://www.acadvizen.com/blog/author/<address>`, `…/blog/category/<address>` |

2. Not updated yet? Reload the page in a **private window** (Ctrl + Shift + N in Chrome). Header and footer changes can take about 5–10 minutes on other pages.
3. An unpublished or trashed item should show "page not found".

---

## 12. Mistakes and troubleshooting

| Situation | What to do | Label |
|---|---|---|
| You published too early | **Edit** → **Status: Draft** → **Save** | Production-verified |
| You want to change a live page without visitors seeing work in progress | **Prepare changes privately** (section 5.1) | Production-verified |
| "This address is already used by another record." | Choose another address. Nothing was overwritten | Production-verified |
| You want an earlier version back | On the edit screen, **Earlier versions** (the last 20 saves) → **Restore** next to the version. The status is not changed | Local-only |
| You trashed something by mistake | List → **Trash** link → **Restore**. It comes back as a draft (not public) | Local-only |
| A red message after Save | Read it: it names the problem (for example, the Main website not reachable). Nothing was changed. Wait a minute, then click **Save** once | Local-only |
| "Enrollment Website copy failed" (yellow) | The Main website was updated but the Enrollment copy was not. Click **Save** again once; the copy is created without duplicates | Local-only |
| Save refused because someone else changed it | What you typed stays in the form. Check the live version, then **Save** again to replace their change | Local-only |
| The whole website looks wrong | Stop and contact the technical team. They have a tested rollback (`FINAL-RELEASE-AND-ROLLBACK.md`) | — |

**Golden rules**
- Click **Save** or **Create** **once** and wait.
- Change one thing at a time, then check it live.
- Keep test content as **Draft**.
- Never use **Delete permanently** on Banner, Closing call to action, Header, Footer or Site settings.

---

## 13. Enrollment pages with Elementor

**Unverified.** This is the Enrollment website's normal WordPress and Elementor editing, unchanged by this project and not tested by it. The production screen shows **Edit with Elementor** on the Enrollment pages (15 Oct).

**Change text on an Enrollment page without changing its design**
1. WordPress left menu → **Pages**.
2. Point at the page and click **Edit with Elementor**.
3. Click the text on the page and type the new wording. Change only the text: do not move, delete or restyle sections.
4. Click the green **Update** button at the top (on a draft it may read **Publish**).
5. Open the page on `https://enroll.acadvizen.com` and check it.

**Be careful**
- **Global Styles** (colours and fonts) and **Header & Footer** change **every** Enrollment page.
- **Undo a mistake:** Elementor keeps a history of each page (**History → Revisions** in the Elementor editor). Restoring a revision is an Elementor feature not tested by this project; if unsure, ask the technical team.
- **Do not** use **Instant Indexing: Submit Page** or **Duplicate** unless you know you need them.

**Main website admin** (`https://www.acadvizen.com/admin-login`, **Production-verified** sign-in and sign-out, 15 Oct): students, leads, enquiries and payments. Sign out with the sign-out button in the admin.

---

## 14. What is not available

| Feature | Label |
|---|---|
| Approval workflow (review and approve before publishing) | **Disabled** |
| Designing Main website pages, or pages for Both, with Elementor (Render Bridge) | **Disabled** |
| Popups published through the Master Admin | **Disabled** (needs the Render Bridge) |
| Choosing the website for anything other than Blogs | **Unavailable**: everything else is Main-only |
| Editing students, leads or enquiries in WordPress | **Unavailable**: use Main `/admin` |

---

## 15. Who can do what

**Local-only:** the live site currently has administrator accounts only.

| Role | Main Website screens |
|---|---|
| Administrator, Editor | Everything |
| Author | Blogs only: their own articles, including publishing |
| Contributor | Blogs only: drafts and "submit for review"; publishing is refused |

---

## Evidence behind this manual

- **Production checks, 15 Oct 2026** (`TEST-RESULTS.md`):
  - Main pages 17/17;
  - Enrollment-only blog 14/14;
  - Both 17/17;
  - sign-in checks M1–M3;
  - a read-only capture of every Main Website screen: tab names, field labels, buttons and choices;
  - Main 314 / Enrollment 59 pages unchanged.
- **Production, 14 Oct:** Main-only blog (16/16 run on plugin 0.7.0).
- **Test copy (Local-only), 15 Oct:** structured content 56/56, courses 12/12, homepage 14/14, header/footer/menus 18/18, other content 15/15, redirects 11/11, scheduling 7/7, permissions 9/9, Both failure 12/12.
- **Status:** `FINAL-CLIENT-HANDOVER.md`.

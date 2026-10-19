# Acadvizen Master Admin — quick reference (one page)

*Plugin 0.7.2 (live), 19 October 2026. Full steps and explanations: `ADMIN-USER-GUIDE.md`.*

## Addresses

| What | Where |
|---|---|
| Sign in (manages both websites) | `https://enroll.acadvizen.com/wp-admin/` → **Log In** |
| Main website content (pages, blogs, courses, homepage, header, footer, menus, tools, cities…) | Left menu → **Acadvizen Master Admin → Main Website** |
| Pages designed in Elementor (for Main, Enrollment or both) | Left menu → **Pages** → **Edit with Elementor** |
| Reviewing and publishing Elementor pages | Left menu → **Acadvizen Master Admin → Approvals** |
| Students, leads, enquiries, payments | `https://www.acadvizen.com/admin-login` |

## Which website shows what

| You edit… | Shows on |
|---|---|
| **Blogs** (Main Website → Blogs) | The website you pick in **Publish To**: **Main Website**, **Enrollment Website** or **Both Websites** |
| An Elementor page | The website you pick in the page's **Publish To** setting: **Main Website**, **Enrollment Website** or **Both Websites** |
| Everything else under **Main Website** | Main website only |

## What each status means

| You see | Visitors see it? |
|---|---|
| **Draft** | No |
| **Waiting for approval** (Elementor pages) | No. A reviewer must approve it first |
| **Approved, ready to publish** | Not yet. Goes live when a reviewer clicks **Publish approved revision** |
| **Approved and scheduled** / **Scheduled for …** | Not yet. Goes live at the time shown |
| **Published** / **Published (verified)** | **Yes**. "Verified" means the system re-checked the live page |
| **Publishing failed, retrying** / **Failed** | The previous version stays live. See "If something goes wrong" |
| **Rejected** | No. It went back to the editor as a draft |
| **Show on the Main Website** ticked (tools, courses, locations, cities, testimonials, redirects) | Yes |

## Everyday tasks

| Task | Steps | Checked on the live websites? |
|---|---|---|
| New blog | **Blogs → Add new** → title, address, summary, article → **Publish To** → Status **Published** → **Save** | Yes (Main, Enrollment and Both) |
| Change a live Main page safely | **Pages → Edit → Prepare changes privately** → edit → **Preview (desktop, tablet, mobile)** → Status **Published** → **Save** | Yes |
| New Elementor page | **Pages → Add New** → design in Elementor → **Publish To** → **Publish** (this submits it for approval) | Yes (Main, Enrollment and Both) |
| Approve and publish (reviewers) | **Approvals** → **Preview** on each website → **Approve this revision** → **Publish approved revision** | Yes |
| Change a live Elementor page | Open it in Elementor (a private working copy opens) → change → **Publish** → reviewer approves and publishes | Yes |
| Hide a page | Main Website screens: Status **Draft** → **Save**. Elementor pages: **Pages** → **Quick Edit** → Status **Draft** → **Update** | Yes |
| Bring back an earlier version | Main Website screens: **Earlier versions** → **Restore**. Elementor pages: **Approvals** → **Recent publications** → **Restore** | Yes (Elementor pages); copy of the site (Main screens) |
| Header, footer, menus | **Main Website → Header / Footer / Menus** → change → **Save** | Yes |
| Redirect | **Redirects → Add new** → old address, new address → **Create** → tick **Show on the Main Website** → **Save** | Yes |
| Upload a Main image | **Media library** → choose file (up to 3 MB) and alt text → **Upload** | Yes |
| Schedule | **Publish automatically on** / **Remove automatically on**, with Status **Published** | Yes (Main pages) |
| Courses, homepage banner and lists, cities, tools, testimonials | The matching **Main Website** screen → **Save** | Copy of the site only |

**Times** are in the site time zone, which is shown next to every date field. Today that is **UTC**, so 09:00 India time is entered as 03:30. Switching the site to **Asia/Kolkata** is a one-line setting that the owner has to approve.

## Live addresses

| Content | Address |
|---|---|
| Main page | `www.acadvizen.com/<address>` |
| Blog on Main | `www.acadvizen.com/blog/<address>` |
| Blog on Enrollment | `enroll.acadvizen.com/<address>/` |
| Course | `www.acadvizen.com/courses/<address>` |
| Tool | `www.acadvizen.com/tools/<address>` |

Not updated yet? Reload in a private window. Header, footer and Elementor changes can take up to about 5 minutes to reach every Main page.

## If something goes wrong

| Problem | What to do |
|---|---|
| Published too early | Hide it (see above). Nothing else changes |
| "This address is already used…" | Pick another address. Nothing was overwritten |
| **Publishing failed, retrying** | Wait a few minutes. It retries by itself, and the previous version stays live |
| **Failed** / "Main Website copy failed" / "Enrollment Website copy failed" | Read the message, fix what it names, then click **Retry** (or **Save** once more). It never creates a duplicate |
| Red error after Save | Read it, wait a minute, **Save** once |
| The whole site looks wrong | Stop and contact the technical team. Rollback is documented for them |

## Rules

- Save **once**, then wait (up to about 20 seconds).
- Change one thing at a time, then check it on the live website.
- **Hide from search engines** does not hide a page from visitors. Use **Draft** to keep something private.
- Never **Delete permanently** the Banner, Closing call to action, Header, Footer or Site settings.
- **Global Styles** and **Header & Footer** in the Master Admin menu change the whole **Enrollment** site.

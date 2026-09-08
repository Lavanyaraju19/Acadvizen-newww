# ACADVIZEN ADMINISTRATOR OPERATING MANUAL & VIDEO TRAINING SCRIPT

Source-audited on 2026-08-09 from the local Acadvizen Next.js/Supabase codebase.

This document is written for non-technical Acadvizen administrators. It explains what the admin dashboard can actually do, how each module maps to the live website, and how to demonstrate the CMS in a training video. It is based on source inspection of the current admin routes, shared CMS APIs, public page resolvers, and reusable admin components. No code, database records, published content, deployment settings, or Supabase data were changed while producing it.

## 1. What The Admin Dashboard Is

The Acadvizen admin dashboard is the control room for website content, landing pages, course information, blogs, SEO, menus, forms, leads, media, users, and site-wide settings.

Use it to:

- Create and edit website pages.
- Build pages with visual sections.
- Manage homepage content.
- Publish blogs, courses, city pages, service pages, resources, tools, companies, internships, placements, and testimonials.
- Upload and reuse media files.
- Manage menus, header, footer, redirects, sitemap, robots.txt, and SEO.
- Track leads and form submissions.
- Manage admin users and roles.
- Review audit history.

Do not use it to:

- Edit code.
- Change the database structure.
- Deploy the website.
- Override a broken production release.
- Assume every saved record appears everywhere automatically. Many records only appear where a public page, feed, or Page Builder block uses them.

## 2. Dashboard Home

Open `/admin` to see the main dashboard.

The dashboard includes:

- System health checks for database, storage, authentication, email, and API.
- CMS health scan status.
- Recent activity.
- Admin notifications, with unread counts and mark-read controls.
- Quick actions for common jobs such as creating a page, blog, course, city page, banner, media upload, lead review, and website preview.

Admin training note: start here in the video. Explain that this page is a status screen and shortcut hub, not the main editing area.

## 3. Admin Navigation Reference

The admin sidebar is permission-aware. A user may not see every item if their role does not include the required permission.

| Admin Area | What It Manages | Main Public Impact |
|---|---|---|
| Dashboard | Health, notifications, quick actions | No direct content |
| Homepage | Homepage-specific sections | `/` |
| Header | Logo, announcement, CTAs, header styling | Site-wide header |
| Footer | Footer columns, legal links, social/contact/CTA | Site-wide footer |
| Menus | Header/footer/legal/mobile navigation items | Site navigation |
| Redirects | 301/302 redirects | Old URLs forwarding to new URLs |
| Sitemap | XML sitemap settings and download | Search engine discovery |
| Robots | Robots.txt content | Search engine crawl rules |
| Import / Export | Bulk content import/export | Content operations |
| Reusable Sections | Reusable section records | Page building support |
| Templates | Page templates and draft page creation | Faster page creation |
| Pages | General CMS pages and Page Builder | `/{slug}` and `/` for home |
| Blogs | Blog posts | `/blog`, `/blog/{slug}` |
| Blog Taxonomy | Blog authors, categories, tags | Blog filtering and author pages |
| Courses | Course categories and course cards | `/courses`, `/courses/{slug}` |
| Course Details | Extra course detail sections | Course detail pages |
| Tools | Tool profiles | `/tools`, `/tools/{slug}` |
| Companies | Company profiles | `/companies`, `/companies/{slug}` |
| Placements | Student placement stories | `/placement`, placement feeds |
| Course Finder | Explore Programs goal cards | `/explore-programs` |
| Internships | Internship opportunities | `/internships`, `/internships/{slug}` |
| Testimonials | Student reviews | Testimonial pages and feed blocks |
| Forms | Forms and submissions | Embedded forms and lead capture |
| Popups | Popups, bars, slide-ins | Public popup system if mounted |
| Banners | Banner records for slots | Banner slots where present |
| Cities | Designed city landing pages | `/digital-marketing-course-in-{slug}` |
| Locations | City/area hierarchy and area sections | `/digital-marketing-courses-{slug}` |
| Service Pages | Service landing pages | `/{slug}` |
| Resources | Downloadable or linked resources | `/resources`, `/resources/{slug}` |
| Internal Links | Link graph and suggestions | SEO planning, not automatic body edits |
| Location Explorer | Location/course explorer groups | Page Builder location explorer block |
| Learner Map | Map pins and learner counts | Page Builder learner map block |
| Media | Uploaded files, folders, usage | Used throughout site |
| Users | Admin users and roles | Access control |
| Students | User approval and role/status review | User/admin access workflows |
| Audit Log | Change history | Governance and troubleshooting |
| Trust | Success stories, recruiters, instructors, certifications, metrics, badges, events, CTAs | Feed blocks and trust sections |
| Landing SEO | Programmatic SEO records | Advanced landing/SEO records |
| Leads | Consultation/inquiry/brochure leads | Sales follow-up |
| LMS | Modules and lessons | LMS content records |
| SEO | Global slug-level SEO records | Metadata by page slug |
| Settings | Global business, branding, contact, analytics, SMTP, SEO, maintenance | Site-wide configuration |

## 4. Saving, Previewing, Publishing

The dashboard uses several visibility patterns:

- Some screens use `status` with `draft` and `published`.
- Some screens use `is_active` or labels such as `Visible`, `Published`, or `Active`.
- Some records have both status and active flags.
- Scheduled publishing is available for pages and blogs through `scheduled_publish_at` and `scheduled_unpublish_at`.

General rule:

1. Save the content.
2. Make sure it is published or active.
3. Use Preview or View Live if the screen provides it.
4. Check the public URL in a fresh browser tab.

Technical behavior in admin-friendly language:

- When content is saved, the CMS attempts to refresh affected website pages and cache tags.
- If a save message says the content was saved but cache refresh failed, save again or ask a developer to check cache revalidation.
- When a page slug changes, the system can create a redirect and move SEO metadata to the new slug.
- Pages and blogs with future publish dates remain hidden until the scheduled time.
- Pages and blogs with scheduled unpublish dates stop appearing after that time.

## 5. Pages And Page Builder

Go to `Pages` to create and edit general website pages.

Page fields include:

- Title.
- Slug. The slug `home` maps to `/`.
- Description.
- SEO title.
- SEO description.
- Canonical URL.
- Status: draft or published.
- Go-live date.
- Take-down date.
- Page sections.
- Optional page template.

The Page Builder lets admins add, reorder, duplicate, hide, delete, and configure sections. It also supports preview, live preview overlay, version history, undo/redo for ordering, copy/paste of sections, and saving a section as a reusable block.

Autosave note: page and CMS autosave data is stored in the browser every 30 seconds and expires after 24 hours. It is local to the browser, so it should not replace clicking Save.

Available Page Builder section types:

| Section Type | Use It For |
|---|---|
| Hero | Main page intro with heading, text, badges, buttons, and image |
| Text Block | Simple content section |
| Image Block | Image-led section |
| Video Block | Video or embed section |
| Two Column Layout | Text/media split layouts |
| Three Column Layout | Three-column content |
| Testimonial | Single testimonial |
| FAQ | Questions and answers |
| Gallery | Multiple images |
| CTA Banner | Call-to-action area |
| Stats Section | Metric counters |
| Feature Cards | Cards with title, description, image, bullets, and button |
| Pricing | Plan cards |
| Team | Instructor or team profiles |
| Map | Embedded map and address |
| Custom Rich Text | Advanced HTML content |
| Testimonials Feed | Live testimonials from CMS |
| Placement Feed | Live placement records |
| Recruiters Feed | Live hiring partner records |
| Instructors Feed | Live instructor profiles |
| Certifications Feed | Live certification records |
| Success Stories Feed | Live success stories |
| Metrics Counters | Live metric counters |
| Trust Badges Feed | Live trust badge records |
| Community Events Feed | Live event records |
| CTA Block Reference | Reusable CTA block by key |
| Courses Feed | Live course records |
| Tools Feed | Live tool records |
| Company Logos Feed | Live company/recruiter logos |
| Lead Form | Built-in lead capture form |
| Form Embed | Embed a form created in Forms |
| Location Explorer | Interactive location/course explorer |
| Interactive Learner Map | Map pins and learner statistics |

Important Page Builder controls:

- Section visible toggle.
- Hide on mobile.
- Hide on desktop.
- Background color.
- Text color.
- Font family.
- Heading and text size.
- Button colors.
- Image width, height, radius, fit, and alt text.
- Alignment, padding, column count, max width.
- Advanced JSON override for precise control.

Training workflow: create a draft page, add Hero, Text Block, Feature Cards, FAQ, and CTA Banner, preview it, then publish only after review.

## 6. Page Templates

Go to `Templates`.

Templates help admins create new pages faster. A template stores a group of page sections and metadata. Applying a template creates a new draft page and sends the admin to Page Builder.

Template types include:

- Homepage.
- Landing.
- City.
- Location course.
- Course.
- Short course.
- Campaign.
- Corporate training.
- Placement.
- Blog.
- Contact.
- About.
- FAQ.
- Privacy.
- Terms.
- Blank.

Template features:

- Create, edit, delete, duplicate.
- Preview resolved sections.
- Apply to new page.
- Version history and restore.
- Parent template support. If a child template has no sections, it can inherit from a parent.
- Location-course generator that can combine Course, City, and Area into a suggested title and slug.

Important warning: deleting a template does not delete pages already created from it.

## 7. Reusable Sections And Blocks

Go to `Reusable Sections`.

This admin area manages reusable section records such as hero, CTA, testimonials, FAQ, gallery, contact, pricing, features, and general sections.

The Page Builder also has a Save as Reusable Block action. That creates a reusable block record with content JSON.

Verified behavior:

- Reusable records can be created, edited, deleted, and duplicated.
- Page Builder can save a section as a reusable block.

Not verified from code:

- Automatic propagation from a reusable section to pages that already used it.
- A full visual picker for inserting saved reusable sections back into any page.

Training guidance: present reusable sections as a content library, not as a guaranteed global-sync system.

## 8. Homepage

Go to `Homepage`.

The homepage has its own admin structure and also uses public homepage data loaders. Its major editable areas are:

- Hero.
- Course highlights.
- Course modules.
- Curriculum.
- Projects.
- Partners.
- Placements.
- Testimonials.
- FAQ.
- Tools.
- CTA.
- Page settings and section visibility/order.

Homepage content is separate from general Pages. Editing a course in `Courses` may affect course feeds, but homepage-specific placement/testimonial/project modules use their own homepage tables unless the public component is coded to consume shared records.

Training workflow:

1. Open Homepage.
2. Choose the section to edit.
3. Update text, image, order, and active status.
4. Save.
5. Preview the homepage.

## 9. Courses

Go to `Courses`.

There are two main groups:

Course Categories:

- Name.
- Slug.
- Icon.
- Description.
- Sort order.
- Featured.
- Menu visible.
- Active.

Courses:

- Title, slug, subtitle, short title.
- Category.
- Badge.
- Short description and full description.
- Duration, duration value, duration unit.
- Learning mode and learning hours.
- Projects count, case studies count, AI tools count, certification count.
- Internship and placement support toggles.
- Primary and secondary CTA labels and URLs.
- Icon.
- Course image, thumbnail, and PDF.
- Display order.
- Featured.
- Active/Published.

Public impact:

- `/courses`.
- `/courses/{slug}`.
- Course feed blocks in Page Builder.
- Explore Programs course sections.
- Header/course menu if course categories are menu-visible.

Go to `Course Details` to add extra course detail sections linked to a course. Fields include course, section title, content, and order.

Training workflow: create category first, then course, then optional course details. Keep slugs short and stable.

## 10. Explore Programs

Public URL: `/explore-programs`.

Explore Programs is not controlled by one single custom admin page by default. It pulls from many CMS tables:

- Course categories.
- Courses.
- Cities.
- Locations.
- Placements.
- Companies.
- Tools.
- Testimonials.
- Blogs.
- Course finder goals.

Go to `Course Finder` to manage goal cards shown in the course finder area. Fields include:

- Goal.
- Icon keyword.
- Description.
- Course slugs as a JSON array.
- Priority.
- Active.

The public Explore Programs page also has fallback static sections. If a CMS page with slug `explore-programs` exists and public CMS rendering is enabled, that CMS page can override the default renderer.

Training guidance: teach admins that Explore Programs is a composed page. Updating courses, locations, placements, tools, testimonials, blogs, and goals can all affect it.

## 11. Blogs

Go to `Blogs`.

Blog fields include:

- Title.
- Slug.
- Description.
- Main content.
- Featured image.
- Up to six inline image slots.
- SEO title and SEO description.
- Tags.
- Categories.
- Status: draft or published.
- Go-live date.
- Take-down date.
- Author.
- Open Graph image.
- Noindex.
- FAQ schema JSON.

Blog editor block types:

- Heading.
- Paragraph.
- List.
- Quote.
- Image.
- Video.
- Link.

Blog editor features:

- Simple copy-paste mode.
- Advanced block mode.
- Inline image library using markers such as `[IMAGE_1]`.
- Media picker.
- Featured, OG, inline, and block media support.
- Local draft recovery.
- Unsaved-change warning.
- Save, delete, preview, view live, and version history.

Go to `Blog Taxonomy` to manage:

- Authors.
- Blog categories.
- Blog tags.

Public impact:

- `/blog`.
- `/blog/{slug}`.
- `/blog/category/{slug}`.
- `/blog/tag/{slug}`.
- `/blog/author/{slug}`.
- Blog/resource sections in Explore Programs.

Training workflow: create taxonomy first, draft the blog, preview, set status to published, and use scheduling only when timing matters.

## 12. Cities And Locations

There are two different city/location systems. This is one of the most important admin concepts.

### City Pages

Go to `Cities`.

These are designed city landing pages with public URL:

`/digital-marketing-course-in-{slug}`

City Page fields include:

- City name.
- Slug.
- Priority.
- Hero title, subtitle, description.
- Hero image and video.
- Hero CTA text and link.
- About title, description, image.
- Features.
- Stats.
- Testimonials.
- Gallery.
- FAQ.
- Contact phone, email, address, Google Maps URL.
- SEO title, description, keywords, OG image, canonical URL.
- Active status.

Actions include:

- Add City.
- Save City Page.
- Enable or disable.
- Duplicate.
- Delete.
- Preview.
- View live.

Important behavior: new city pages default to inactive until enabled.

### Locations And Areas

Go to `Locations`.

This area has three panels:

1. Cities hierarchy.
2. Areas/Locations.
3. Designed sections for the selected location.

Cities hierarchy fields:

- Name.
- Slug.
- State.
- Country.
- SEO title.
- SEO description.
- Intro text.
- Active.

Areas/Locations fields:

- Name.
- Slug.
- City.
- Footer label.
- Display order.
- SEO title.
- SEO description.
- Intro text.
- Why text.
- Demand text.
- Active.

Location public URL:

`/digital-marketing-courses-{slug}`

Designed location sections can use Page Builder style blocks and insertion zones such as top, after intro, before FAQ, and end.

Important route behavior:

- `/digital-marketing-course-in-{slug}` uses City Pages.
- `/digital-marketing-courses-{slug}` uses Locations.
- `/digital-marketing-course-{slug}` is a legacy/programmatic city-course route and does not have the same visual admin editor.

Training guidance: if the URL says `course-in`, use City Pages. If the URL says `courses-`, use Locations.

## 13. Location Explorer And Learner Map

Go to `Location Explorer` to manage explorer groups and items.

Groups include:

- Name.
- Slug.
- City.
- Variant.
- Heading.
- Subheading.
- CTA label.
- CTA URL.
- Active.
- Order.

Items connect a group to:

- Location.
- Course.
- Custom label.
- Custom URL.
- Order.
- Active.

These are used by the Page Builder Location Explorer block.

Go to `Learner Map` to manage map pins.

Fields include:

- Label.
- Country and state.
- City.
- Location.
- Latitude and longitude.
- Learner count.
- Growth percent.
- Representative image.
- Course.
- CTA label and URL.
- Order.
- Active.

These are used by the Page Builder Interactive Learner Map block.

## 14. Service Pages

Go to `Service Pages`.

Service page fields include:

- Title.
- Slug.
- Hero title.
- Hero subtitle.
- Overview.
- Curriculum JSON.
- Benefits JSON.
- FAQs JSON.
- Meta title.
- Meta description.
- Order.
- Active.

Public URL:

`/{slug}`

Service pages can also have designed sections attached through the sections editor. Use these to place Page Builder blocks around fixed service content such as overview, benefits, curriculum, and FAQ.

## 15. Landing SEO

Go to `Landing SEO`.

This is an advanced admin area for programmatic SEO records:

- Cities/locations.
- Landing page templates.
- Course plus city landing pages.
- Redirects.
- Reusable blocks.

Because some fields accept raw JSON, this area should be used by advanced admins only.

Training guidance: show where it is, explain what it controls, and warn that JSON fields should not be edited casually.

## 16. Tools

Go to `Tools`.

Tool fields include:

- Name.
- Slug.
- Category.
- Description.
- Logo.
- Brand color.
- Website URL.
- Active.

Public impact:

- `/tools`.
- `/tools/{slug}`.
- Tools feed blocks.
- Explore Programs tool/tag cloud.

## 17. Companies

Go to `Companies`.

Company profile fields include:

- Company name.
- Logo.
- Description.
- Website URL.
- Hiring status.
- Featured.
- Active/Published.

Public impact:

- `/companies`.
- `/companies/{slug}`.
- Company logo/feed sections where used.

## 18. Placements

Go to `Placements`.

Placement fields include:

- Student name/title.
- Company name.
- Role.
- Location.
- Package/salary.
- Featured image.
- Company logo.
- Accent color.
- Description.
- Display order.
- Active.

Public impact:

- `/placement`.
- Placement feeds.
- Explore Programs career outcome sections.

Note: `Trust` also includes a Placement Records manager using the same placement entity. Be careful not to confuse homepage placements, trust placement records, and main placement records.

## 19. Testimonials

Go to `Testimonials`.

Fields include:

- Name.
- Role.
- Company.
- Course.
- Rating.
- Image.
- Video testimonial URL.
- Quote.
- Display order.
- Active.

Public impact:

- Testimonial pages.
- Testimonials feed blocks.
- Explore Programs student voice sections.

## 20. Trust And Conversion Elements

Go to `Trust`.

This area manages content that can be pulled into Page Builder feed sections:

- Student success stories.
- Placement records.
- Hiring partners/recruiters.
- Instructor profiles.
- Industry certifications.
- Achievement counters.
- Trust badges/accreditations.
- Events and workshops.
- Call-to-action blocks.

Training guidance: explain that these records are building blocks. They appear where a public page or Page Builder feed section requests them.

## 21. Internships

Go to `Internships`.

Fields include:

- Company name.
- Role.
- Logo.
- Location.
- Duration.
- Salary.
- Deadline.
- Apply link.
- Eligibility.
- Description.
- Status.
- Active.

Public impact:

- `/internships`.
- `/internships/{slug}`.

## 22. Resources

Go to `Resources`.

Fields include:

- Title.
- Slug.
- Description.
- Content.
- File upload.
- External URL.
- Related course.
- Related tool.
- Resource type: PDF, video, image, brochure, or LLM link.
- SEO title.
- SEO description.
- Order.
- Active.

Public impact:

- `/resources`.
- `/resources/{slug}`.

Training note: resources can be files or external links. Always test the download or destination URL after publishing.

## 23. LMS

Go to `LMS`.

This area manages:

- LMS modules linked to courses.
- LMS lessons linked to modules.

Module fields include course, title, description, and order.

Lesson fields include module, title, file URL, content, and order.

Training guidance: treat this as structured learning content. Public delivery behavior should be checked against the live LMS experience before promising students can see a lesson.

## 24. Media Library

Go to `Media`.

The media library supports:

- Uploading files.
- Choosing a storage bucket.
- Creating, renaming, and deleting folders.
- Nested folders.
- Search.
- Filters by all, image, video, or file.
- Grid/list view.
- Bulk select.
- Bulk move.
- Bulk delete.
- Editing image details.
- Replacing an image.
- Checking where a file is used.
- Copying a file URL.

Metadata fields include:

- Display name.
- Alt text.
- Caption.
- Folder.
- Tags.

Safety rules:

- Use descriptive file names before upload when possible.
- Always add alt text for important images.
- Use Where is this used before deleting.
- Bulk delete may skip or block in-use items.
- Replacing an image can update references, so preview key pages afterward.

## 25. Forms

Go to `Forms`.

Supported field types:

- Text.
- Email.
- Phone.
- Number.
- Textarea.
- Select.
- Checkbox.
- Radio.
- Date.
- Time.
- URL.
- File.
- Image.
- Hidden.
- HTML.

Form settings include:

- Name.
- Description.
- Success message.
- Error message.
- Redirect URL.
- Send email toggle.
- Email recipient.
- Email subject.
- Webhook toggle and URL.
- Send test webhook.
- Autoresponder toggle.
- Autoresponder email field, subject, and body.
- Store submissions.
- Status: draft or published.

Field-level settings include:

- Label.
- Placeholder.
- Required.
- Options.
- Default value.
- Validation rules.
- Conditional logic.
- Width.
- CSS class.
- HTML block content.

Form actions include:

- Add field.
- Duplicate field.
- Delete field.
- Reorder fields.
- Preview.
- Save.
- Delete.
- View submissions.
- Export CSV.

Important rule: only published forms should be expected to appear live when embedded in a page.

## 26. Leads

Go to `Leads`.

The Leads screen shows:

- Name.
- Email.
- Phone.
- Page.
- Source.
- Status.
- Created date.

Lead statuses:

- New.
- Contacted.
- Qualified.
- Closed.

Training workflow: open Leads daily, update each lead status after follow-up, and save the changed row.

## 27. Menus

Go to `Menus`.

Menu locations:

- Header.
- Footer.
- Legal.
- Mobile.

Menu item fields include:

- Label.
- Parent item.
- Existing page destination.
- Destination URL.
- Same tab or new tab.
- Icon.
- Short description.
- Desktop visible.
- Mobile visible.
- Enabled/active.

Menu actions include:

- Add menu item.
- Edit.
- Duplicate.
- Toggle active.
- Delete.
- Preview.
- Version history.
- Save as draft.
- Add/update and publish.
- Publish menu.

Dropdown workflow:

1. Create the top-level parent item.
2. Create or edit a child item.
3. Set Parent Item to the top-level item.
4. Repeat for more children.
5. Publish the menu.

Important behavior:

- Dragging reorders items only within the same parent.
- Parent selector is used to move items between levels.
- Menus support up to three levels.
- Deleting a parent moves children up instead of deleting them.
- Draft menu items can appear in admin preview but not live until published.

## 28. Header

Go to `Header`.

Header settings include:

- Logo URL/upload.
- Logo alt text.
- Logo link.
- Announcement bar enabled, text, link, background color, and text color.
- Header-specific nav items.
- Primary and secondary CTAs.
- Phone, email, and social display toggles.
- Social items.
- Sticky header.
- Transparent header.
- Header background, text, and border colors.
- Mobile menu style: drawer or dropdown.

Training guidance: use Header for global logo, announcement, CTA, and header styling. Use Menus for main navigation structures if the live site is using menu records.

## 29. Footer

Go to `Footer`.

Footer settings include:

- Logo URL and alt text.
- Footer columns and links.
- Copyright text.
- Year.
- Company name.
- Legal links.
- Social links.
- Contact information.
- Newsletter settings.
- Footer CTA.
- Background, text, link, and border colors.

Footer actions include preview, validation, and save.

Training guidance: after editing the footer, check desktop and mobile because footer columns and long links can wrap differently.

## 30. SEO

Go to `SEO`.

SEO records are keyed by page slug. Fields include:

- Page slug.
- Meta title.
- Meta description.
- Canonical URL.
- Open Graph title.
- Open Graph description.
- Open Graph image.
- Twitter title.
- Twitter description.
- Twitter image.
- Noindex.
- Schema JSON.

SEO priority guidance:

- Use page/blog/city-specific SEO fields first when editing that content.
- Use the SEO module for global slug-level overrides or pages without a dedicated SEO editor.
- Use `noindex` only when a page should not appear in search results.
- Be careful with schema JSON.

## 31. Redirects

Go to `Redirects`.

Redirect fields include:

- Old URL.
- New URL.
- Redirect type: 301 or 302.
- Active.

Features include:

- Search.
- Add.
- Edit.
- Delete.
- Export CSV.
- Import CSV.
- Hit count display.
- Created date.
- Test button.

Redirect safety:

- Use 301 for permanent moves.
- Use 302 for temporary moves.
- Avoid redirecting a URL to itself.
- Avoid chains such as A to B to C.
- After changing an important page slug, check whether the system created the redirect automatically.
- If the browser rejects a path in the URL input, enter the full URL.

## 32. Sitemap

Go to `Sitemap`.

The sitemap manager controls:

- Include pages.
- Include blogs.
- Include courses.
- Include city pages.
- Change frequency for each type.
- Priority for each type.
- Last generated timestamp.

Actions:

- Save settings.
- Generate now.
- Download sitemap XML.

Sitemap URL shown by the admin:

`https://acadvizen.com/api/cms/sitemap/generate`

Training note: after important content launches, generate/download the sitemap and submit the sitemap URL to Google Search Console.

## 33. Robots.txt

Go to `Robots`.

This screen edits robots.txt. It includes:

- Text editor.
- Preview.
- Save.
- Reset to default.
- Download preview.
- Quick rules: allow all, allow Googlebot, disallow admin, disallow API, crawl delay, add sitemap.

Default content allows the site and points to:

`/api/cms/sitemap/generate`

Safety warning: robots.txt can block search engines from important pages. Only trained admins should edit it.

## 34. Popups

Go to `Popups`.

Popup display types:

- Modal popup.
- Slide-in panel.
- Top/bottom bar.
- Corner popup.

Trigger types:

- Immediate.
- Time delay.
- Scroll percentage.
- Exit intent.
- Click trigger.

Fields include:

- Popup name.
- Display type.
- Trigger type.
- Delay seconds or scroll percentage.
- Status: draft or published.
- Image URL.
- Rich text content.
- Close button.
- Overlay.
- Device targeting: mobile, tablet, desktop.
- Show frequency: once per session, always, once per visitor, custom days.
- Start date.
- End date.
- Target pages.
- Exclude pages.
- Active.

Actions:

- New popup.
- Save popup.
- Enable/disable.
- Delete.
- Preview.

Training note: target pages are entered one per line, such as `/courses` or `/contact`. Empty target pages means all pages.

## 35. Banners

Go to `Banners`.

Fields include:

- Name.
- Type: hero, sidebar, footer, popup, floating.
- Priority.
- Status: draft or published.
- Desktop image.
- Tablet image.
- Mobile image.
- Link URL.
- Alt text.
- Title.
- Description.
- Button text.
- Button color.
- Text color.
- Background color.
- Show button.
- Device targeting.
- Start date.
- End date.
- Page targeting.
- Active.

Actions:

- New.
- Save.
- Enable/disable.
- Move up/down.
- Delete.
- Preview.

Important note: banner records appear only where the website has a banner slot. If a page has no banner slot, creating a banner alone will not make it appear there.

## 36. Import / Export

Go to `Import / Export`.

Supported content types:

- Pages.
- City Pages.
- Blogs.
- Courses.
- Forms.
- Menus.
- Leads.
- Users.
- Settings.

Formats:

- JSON.
- CSV.

Modes:

- Export.
- Import.

Import workflow:

1. Choose content type.
2. Choose JSON or CSV.
3. Choose Import.
4. Select the file.
5. Review preview.
6. Confirm import.
7. Review success/failure counts and errors.

Safety warning: import changes bulk content. Export first, import small batches, and never import an unreviewed spreadsheet.

## 37. Users, Roles, And Students

Go to `Users` for admin user management.

User features:

- Search by name or email.
- Filter by role.
- Add user.
- Assign role.
- Delete user.
- Manage roles.

Role permission categories include:

- Pages.
- Blogs.
- Courses.
- Media.
- Forms.
- Popups.
- Banners.
- Settings.
- Users.
- Roles.
- SEO.
- Analytics.
- Backup.

Role actions include create, read, update, delete, publish, restore, depending on category.

Go to `Students` for the users and access approval workflow. It supports:

- Search by email, full name, or student ID.
- Filter by role.
- Filter by approval status.
- Change role.
- Change approval status.
- Approve.
- Reject.

Safety rule: do not give publishing, user, roles, settings, SEO, or import/export access unless the person needs it.

## 38. Audit Log

Go to `Audit Log`.

The audit log shows:

- When the change happened.
- Who made it.
- Action: create, update, delete.
- Content type.
- Fields changed.

Filters:

- Content type.
- Action.

Training workflow: when someone asks, "Who changed this?", check Audit Log first.

## 39. Settings

Go to `Settings`.

Settings sections include:

- Business info.
- Branding.
- Contact.
- Social media.
- Google Maps.
- Business hours.
- Analytics.
- Email/SMTP.
- Default SEO.
- Site settings.

Important fields:

- Business name, tagline, description.
- Logo, logo alt, favicon.
- Phone, email, address.
- LinkedIn, Twitter, Instagram, Facebook, YouTube, WhatsApp.
- Google Maps API key and embed URL.
- Business hours.
- Google Analytics ID.
- Google Tag Manager ID.
- Facebook/Meta Pixel IDs.
- SMTP host, port, username, password, from email, from name.
- Default meta title and description.
- Default OG image.
- Maintenance mode.
- Maintenance message.
- Allowed IPs.
- Cookie banner.
- Copyright text.

Safety warning: maintenance mode can hide the website from visitors except admins or allowed IPs. Treat it as a high-risk setting.

## 40. Website-To-Admin Mapping

| Website Area | Admin Area To Edit |
|---|---|
| Homepage hero and homepage modules | Homepage |
| General page at `/{slug}` | Pages |
| Blog list and posts | Blogs, Blog Taxonomy |
| Course listing and course details | Courses, Course Details |
| Explore Programs | Courses, Course Categories, Cities, Locations, Placements, Companies, Tools, Testimonials, Blogs, Course Finder |
| City landing pages `/digital-marketing-course-in-{slug}` | Cities |
| Area/location pages `/digital-marketing-courses-{slug}` | Locations |
| Service landing pages | Service Pages |
| Tools pages | Tools |
| Company pages | Companies |
| Placement pages | Placements |
| Internship pages | Internships |
| Resource pages | Resources |
| Student testimonials | Testimonials |
| Header logo/announcement/CTA | Header |
| Navigation/dropdowns | Menus |
| Footer links/contact/social/newsletter/CTA | Footer |
| Forms on pages | Forms, then Page Builder Form Embed |
| Leads from forms | Leads |
| Popups | Popups |
| Banners | Banners, if page has a banner slot |
| SEO metadata | Page/blog/city/service editor, SEO, Landing SEO |
| Redirect from old URL | Redirects |
| XML sitemap | Sitemap |
| Crawl rules | Robots |
| Uploaded images/files | Media |
| Admin user permissions | Users |

## 41. Admin-To-Website Mapping

| Admin Area | Where It Can Show |
|---|---|
| Homepage | `/` |
| Pages | `/{slug}` or `/` for home |
| Templates | Creates draft pages, not public by itself |
| Reusable Sections | Building blocks, public only when used |
| Courses | `/courses`, `/courses/{slug}`, feeds, Explore Programs |
| Course Details | Course detail pages |
| Course Finder | Explore Programs |
| Blogs | Blog list, post pages, taxonomy pages |
| Cities | City landing pages |
| Locations | Area/location pages and footer/location feeds |
| Location Explorer | Pages containing the explorer block |
| Learner Map | Pages containing the map block |
| Service Pages | Public slug pages |
| Tools | Tool list/details and feed blocks |
| Companies | Company list/details and logo feeds |
| Placements | Placement pages and feed blocks |
| Testimonials | Testimonial pages and feed blocks |
| Trust | Trust/feed blocks where used |
| Forms | Pages containing embedded forms |
| Leads | Admin only |
| Media | Wherever a file URL is used |
| Header/Footer/Menus | Site-wide layout/navigation |
| SEO/Redirects/Sitemap/Robots | Search and routing behavior |
| Users/Students/Audit Log | Admin only |

## 42. Common Admin Tasks

### Create A New General Page

1. Open `Pages`.
2. Click New.
3. Enter title and slug.
4. Add SEO title and description.
5. Add sections in Page Builder.
6. Preview.
7. Set status to published.
8. Save.
9. Open the public URL.

### Edit An Existing Page

1. Open `Pages`.
2. Search for the page.
3. Open it.
4. Edit fields or sections.
5. Preview.
6. Save.
7. Check the live page.

### Hide A Page Temporarily

1. Open `Pages`.
2. Select the page.
3. Change status to draft or set a take-down date.
4. Save.
5. Confirm the public page is no longer visible.

### Change A Page Slug

1. Open the page.
2. Edit the slug.
3. Save.
4. Check the new URL.
5. Check Redirects for an old-to-new redirect.
6. Check SEO metadata.

### Create A Blog Post

1. Open `Blogs`.
2. Click New.
3. Add title, slug, excerpt/description, content, featured image, taxonomy, and SEO.
4. Preview.
5. Set status to published.
6. Save.
7. Open `/blog/{slug}`.

### Schedule A Blog

1. Open the blog.
2. Set status to published.
3. Set Go live at to the future date/time.
4. Save.
5. Confirm it is not visible early.

### Add A Course

1. Open `Courses`.
2. Add or confirm the course category.
3. Create the course.
4. Fill title, slug, category, description, duration, counts, CTA, image, and active status.
5. Save.
6. Add Course Details if needed.
7. Check `/courses/{slug}`.

### Add A City Landing Page

1. Open `Cities`.
2. Click Add City.
3. Fill city name and slug.
4. Complete hero, about, features, stats, testimonials, gallery, FAQ, contact, and SEO.
5. Save.
6. Enable the city.
7. Preview and view live.

### Add An Area/Location Page

1. Open `Locations`.
2. Create or select the hierarchy city.
3. Create the location/area.
4. Fill slug, city, intro, why, demand, SEO, order, and active status.
5. Add designed sections if needed.
6. Save.
7. Open `/digital-marketing-courses-{slug}`.

### Add A Form To A Page

1. Open `Forms`.
2. Create the form.
3. Add fields.
4. Set success/error messages and email/webhook settings.
5. Publish the form.
6. Open `Pages`.
7. Add a Form Embed section.
8. Select the form.
9. Save and test the public form.

### Review Leads

1. Open `Leads`.
2. Review new leads.
3. Contact the lead outside the CMS.
4. Change status to contacted, qualified, or closed.
5. Save.

### Build A Dropdown Menu

1. Open `Menus`.
2. Choose Header.
3. Create the parent item.
4. Create child items and select the parent.
5. Preview.
6. Publish menu.
7. Check desktop and mobile navigation.

### Upload And Use An Image

1. Open `Media`.
2. Choose bucket/folder.
3. Upload image.
4. Add alt text and caption.
5. Copy URL or select it from an editor media picker.
6. Use it in the desired page/module.

### Replace An Image

1. Open `Media`.
2. Search for the image.
3. Use Where is this used.
4. Replace or edit the image.
5. Check every important page that used it.

### Create A Redirect

1. Open `Redirects`.
2. Add old URL.
3. Add new URL.
4. Choose 301 for permanent or 302 for temporary.
5. Save.
6. Test the old URL.

### Edit SEO For A Page

1. Prefer the page's own SEO fields if available.
2. If needed, open `SEO`.
3. Search or create a slug SEO record.
4. Fill meta title, description, canonical, OG/Twitter fields.
5. Save.
6. Check page source or SEO preview tooling outside the CMS.

### Put Site Into Maintenance Mode

1. Open `Settings`.
2. Open Site Settings.
3. Enable Maintenance Mode.
4. Set the maintenance message.
5. Add allowed IPs if needed.
6. Save all settings.
7. Disable maintenance mode as soon as work is complete.

### Add A Popup

1. Open `Popups`.
2. Click New Popup.
3. Enter name, display type, trigger, content, devices, frequency, and targeting.
4. Set status to published.
5. Save.
6. Enable.
7. Test on a targeted page.

### Add A Banner

1. Open `Banners`.
2. Create banner.
3. Add images for desktop, tablet, and mobile.
4. Add text, URL, device targeting, schedule, and page targeting.
5. Publish and enable.
6. Check the page where the banner slot exists.

### Export Content Before Bulk Work

1. Open `Import / Export`.
2. Select content type.
3. Select JSON.
4. Export.
5. Keep the file as a rollback reference.

### Import Content Safely

1. Export current content first.
2. Prepare a small CSV or JSON file.
3. Open Import / Export.
4. Select type and format.
5. Import.
6. Review preview.
7. Confirm.
8. Review errors.

### Add An Admin User

1. Open `Users`.
2. Click Add User.
3. Enter name, email, optional password, and role.
4. Create user.
5. Confirm the user can sign in.

### Create A Custom Role

1. Open `Users`.
2. Click Manage Roles.
3. Click New Role.
4. Enter role name and description.
5. Select permissions.
6. Create role.
7. Assign it to a test user.

## 43. Publishing Checklist

Before publishing:

- Confirm title and slug.
- Confirm the URL does not conflict with another page.
- Confirm SEO title and description.
- Confirm images load and have alt text.
- Confirm forms submit correctly.
- Confirm buttons link to correct pages.
- Confirm mobile preview or mobile browser check.
- Confirm status is published or active.
- Confirm scheduled dates are correct.
- Confirm redirects if a slug changed.
- Confirm page appears or hides as expected.

After publishing:

- Open the live URL.
- Test navigation paths to the page.
- Submit any form if the page contains one.
- Check key images.
- Check internal links.
- If SEO-sensitive, generate sitemap and submit/update Search Console.

## 44. Safety Rules For Admins

- Do not edit JSON fields unless trained.
- Do not delete media without checking usage.
- Do not change slugs casually.
- Do not import bulk data without exporting first.
- Do not give broad permissions to temporary users.
- Do not enable maintenance mode unless planned.
- Do not block important pages in robots.txt.
- Do not assume a saved draft is live.
- Do not assume a published record appears everywhere. It must be connected to a page, feed, menu, or slot.
- Always test live pages after changes.

## 45. Troubleshooting

| Problem | What To Check |
|---|---|
| Page does not show | Status, active flag, slug, scheduled publish date, public URL |
| Page still shows old content | Save again, refresh browser, cache revalidation error message |
| Blog does not appear | Status, future go-live date, slug, taxonomy, public `/blog/{slug}` |
| Course missing from feeds | Course active flag, category active flag, display order |
| Form not visible | Form status published, correct Form Embed block selected |
| Form submits but no email | SMTP settings, form email settings, mail status warning |
| Image missing | Media URL, bucket access, image field, external URL validity |
| Menu item not live | Menu item active, desktop/mobile visibility, Publish Menu clicked |
| Popup not showing | Status, active, trigger, device targeting, page targeting, date range |
| Banner not showing | Status, active, page targeting, date range, whether the page has a banner slot |
| Redirect not working | Old URL, new URL, active flag, redirect loop |
| SEO not updating | Page-level SEO vs global SEO record, cache, search engine delay |
| User cannot see a menu item | Role permissions |
| Lead missing | Form store submissions setting, form submission error |

## 46. Verified Limits And Unclear Areas

The following points are important for honest admin training:

- Reusable section propagation to existing pages was not verified.
- Banner display depends on public banner slots being present.
- Popup display depends on the public popup system being mounted and matching target conditions.
- Some legacy static pages exist in the codebase and may not be fully controlled by CMS records.
- Programmatic city-course routes exist separately from the visual City Page Builder.
- Landing SEO contains powerful JSON fields and should be treated as advanced.
- LMS admin records exist, but public delivery should be verified against the live student LMS before training students.

## 47. Capability Matrix

| Capability | Supported In Admin | Notes |
|---|---:|---|
| Create general page | Yes | Pages |
| Visual page building | Yes | Page Builder sections |
| Preview page | Yes | Pages/blogs/cities/templates have preview features |
| Publish/unpublish page | Yes | Status/active fields |
| Schedule page/blog | Yes | Pages and blogs |
| Version history | Yes | Pages/blogs/templates/menus where implemented |
| Create template | Yes | Templates |
| Apply template to page | Yes | Creates draft page |
| Manage homepage | Yes | Dedicated homepage builders |
| Manage courses | Yes | Courses and Course Details |
| Manage Explore Programs content | Partly distributed | Multiple source modules |
| Manage city landing pages | Yes | Cities |
| Manage area/location pages | Yes | Locations |
| Manage blogs | Yes | Blogs and taxonomy |
| Manage tools | Yes | Tools |
| Manage companies | Yes | Companies |
| Manage placements | Yes | Placements and Trust |
| Manage testimonials | Yes | Testimonials |
| Manage forms | Yes | Forms |
| View leads | Yes | Leads |
| Export form submissions | Yes | Forms |
| Manage media | Yes | Media library |
| Check media usage | Yes | Media |
| Manage navigation | Yes | Menus and Header |
| Manage footer | Yes | Footer |
| Manage redirects | Yes | Redirects |
| Manage sitemap | Yes | Sitemap |
| Manage robots.txt | Yes | Robots |
| Manage SEO metadata | Yes | Content editors and SEO module |
| Manage popups | Yes | Popups |
| Manage banners | Yes | Banners, slot-dependent |
| Manage users and roles | Yes | Users |
| Approve/reject users/students | Yes | Students |
| See audit history | Yes | Audit Log |
| Bulk import/export | Yes | Import / Export |
| Deploy website | No | Not an admin dashboard function |
| Edit database schema | No | Not an admin dashboard function |
| Edit application code | No | Not an admin dashboard function |

## 48. Video Training Script

### Video Title

Acadvizen Admin Dashboard Training: How To Manage Website Content, Courses, Pages, SEO, Forms, And Leads

### Audience

Acadvizen administrators, content editors, marketing team members, SEO team members, and admissions/sales team members.

### Style

Calm, step-by-step, non-technical. Use real screen actions. Avoid developer terms unless briefly explaining why a save or publish step matters.

### 0:00 - 1:30: Welcome And Purpose

Say:

"Welcome to the Acadvizen admin dashboard training. In this walkthrough, we will learn how to safely manage the website without touching code. We will cover pages, homepage sections, courses, blogs, city pages, forms, leads, media, SEO, menus, and user access."

Show:

- Admin dashboard home.
- Sidebar.
- System status cards.
- Quick actions.

Emphasize:

"If your role has limited permissions, you may not see every menu item shown in this training."

### 1:30 - 3:30: Dashboard Home

Show:

- Health status.
- Notifications.
- Recent activity.
- Quick actions.

Say:

"This page is the starting point. It helps you check whether the CMS is healthy and gives quick shortcuts to common work."

Do:

- Point to Create Page, Create Blog, Create Course, Upload Media, View Leads, and Preview Website.

### 3:30 - 8:00: Admin Navigation Tour

Show:

- Each sidebar group quickly.

Say:

"Think of the dashboard in groups: content pages, courses and learning, location pages, marketing tools, SEO and site settings, and access control."

Mention:

- Pages for general website pages.
- Homepage for homepage modules.
- Courses for course catalog.
- Cities and Locations for location SEO pages.
- Forms and Leads for inquiries.
- Media for files.
- Menus, Header, Footer for navigation and layout.
- SEO, Redirects, Sitemap, Robots for search.
- Users and Audit Log for governance.

### 8:00 - 16:00: Pages And Page Builder

Demo:

1. Open Pages.
2. Create a new draft page.
3. Enter title and slug.
4. Add SEO title and description.
5. Add Hero section.
6. Add Text Block.
7. Add Feature Cards.
8. Add FAQ.
9. Reorder sections.
10. Hide and show a section.
11. Duplicate a section.
12. Preview.
13. Save.

Say:

"The page is not live just because we typed content. It becomes live when its status and schedule allow it."

Emphasize:

- Slug controls URL.
- `home` means homepage.
- Preview before publishing.
- Autosave helps recover browser work, but Save is still required.

### 16:00 - 20:00: Templates And Reusable Content

Demo:

1. Open Templates.
2. Show template list.
3. Preview a template.
4. Apply to a new page.
5. Show created draft page.

Say:

"Templates save time. They are starting points for pages. Changing a template later does not automatically rewrite every page already created from it."

Demo:

- Open Reusable Sections.
- Show reusable records.

Say:

"Reusable content is best treated as a library of building blocks."

### 20:00 - 26:00: Homepage

Demo:

1. Open Homepage.
2. Open Hero.
3. Show text, image, and CTA fields.
4. Open course highlights or testimonials.
5. Reorder an item.
6. Save.
7. Preview homepage.

Say:

"The homepage has dedicated editors. Some homepage modules are separate from the general course, placement, and testimonial records, so always edit the section that controls the exact homepage area."

### 26:00 - 34:00: Courses And Course Details

Demo:

1. Open Courses.
2. Show Course Categories.
3. Add or edit a category.
4. Show Courses.
5. Add or edit a course.
6. Upload course image or thumbnail.
7. Set active/published.
8. Open Course Details.
9. Add a detail section.

Say:

"Create the category first, then the course. A course needs to be active to appear in public course lists and feeds."

### 34:00 - 43:00: Explore Programs, Cities, And Locations

Demo:

1. Open Course Finder.
2. Show goal cards.
3. Open Cities.
4. Show city page sections and URL pattern.
5. Open Locations.
6. Show hierarchy city, area/location, and designed sections.
7. Open Location Explorer and Learner Map.

Say:

"Explore Programs is assembled from many areas: courses, categories, cities, locations, placements, companies, tools, testimonials, blogs, and course finder goals."

Emphasize:

- `digital-marketing-course-in-{slug}` means City Pages.
- `digital-marketing-courses-{slug}` means Locations.

### 43:00 - 51:00: Blogs

Demo:

1. Open Blog Taxonomy.
2. Show authors, categories, tags.
3. Open Blogs.
4. Create/edit a draft blog.
5. Add featured image.
6. Add content block.
7. Add inline image marker.
8. Set SEO.
9. Preview.
10. Publish or schedule.

Say:

"Taxonomy keeps the blog organized. A blog can be saved as a draft, published immediately, or scheduled for later."

### 51:00 - 58:00: Media

Demo:

1. Open Media.
2. Upload an image.
3. Create/select folder.
4. Edit details and alt text.
5. Copy URL.
6. Use Where is this used.

Say:

"Before deleting or replacing media, always check where it is used. One image can appear on many pages."

### 58:00 - 1:06:00: Forms And Leads

Demo:

1. Open Forms.
2. Create a form.
3. Add name, email, phone, and message fields.
4. Set success message.
5. Show email, webhook, autoresponder, and store submissions settings.
6. Publish form.
7. Open a page and add Form Embed.
8. Open Leads.
9. Change a lead status.

Say:

"Forms collect visitor information. Leads is where the sales or admissions team tracks follow-up."

### 1:06:00 - 1:13:00: Menus, Header, Footer

Demo:

1. Open Menus.
2. Create parent menu item.
3. Create child menu item.
4. Preview.
5. Publish menu.
6. Open Header.
7. Show logo, announcement, CTA.
8. Open Footer.
9. Show columns, legal links, social links, contact, newsletter, CTA.

Say:

"Menus control navigation structure. Header controls global header branding and CTA settings. Footer controls the bottom of the website."

### 1:13:00 - 1:21:00: SEO, Redirects, Sitemap, Robots

Demo:

1. Open SEO.
2. Show slug-level metadata.
3. Open Redirects.
4. Create a sample old-to-new redirect.
5. Open Sitemap.
6. Show include toggles, priority, generate, download.
7. Open Robots.
8. Show preview and quick rules.

Say:

"SEO tools help search engines understand and discover pages. Redirects protect traffic when URLs change. Robots.txt is powerful and should be edited carefully."

### 1:21:00 - 1:27:00: Popups, Banners, Tools, Companies, Placements, Testimonials

Demo:

1. Open Popups.
2. Show trigger, device, frequency, targeting.
3. Open Banners.
4. Show image slots and targeting.
5. Open Tools, Companies, Placements, Testimonials quickly.

Say:

"These modules create reusable marketing content. They appear on public pages only where the website has a listing, detail page, feed section, popup system, or banner slot."

### 1:27:00 - 1:33:00: Users, Students, Audit Log, Settings

Demo:

1. Open Users.
2. Show user list and role assignment.
3. Open Manage Roles.
4. Show permission categories.
5. Open Students.
6. Show approval filters.
7. Open Audit Log.
8. Filter by action.
9. Open Settings.
10. Show business, branding, analytics, SMTP, SEO, maintenance.

Say:

"Access control matters. Only give people the permissions they need. The audit log helps us see who changed what."

Safety warning:

"Maintenance mode, SMTP, analytics, robots.txt, import/export, users, and roles should be handled by trained admins only."

### 1:33:00 - 1:38:00: Import / Export And Safe Operations

Demo:

1. Open Import / Export.
2. Select Pages.
3. Select JSON.
4. Export.
5. Switch to Import.
6. Show preview step without confirming.

Say:

"Always export before importing. Import is powerful and can change many records at once."

### 1:38:00 - 1:42:00: Final Publishing Checklist

Say:

"Before publishing, check title, slug, SEO, images, buttons, forms, mobile view, status, schedule, and redirects. After publishing, always open the live URL and test the important actions."

Show:

- A page preview.
- Public live URL.

### 1:42:00 - 1:45:00: Closing

Say:

"The admin dashboard is designed to let the team manage the website safely without code. When in doubt, save a draft, preview, ask for review, and publish only after checking the live page."

End with:

"For high-risk changes such as imports, user permissions, maintenance mode, robots.txt, and site-wide settings, follow the checklist and involve the senior admin or developer when needed."

## 49. Quick Reference For Trainers

Most important messages to repeat:

- Draft is not live.
- Active/Published usually means visible.
- Slugs control URLs.
- Preview before publishing.
- Check live after publishing.
- Export before importing.
- Do not delete media without checking usage.
- Do not edit JSON casually.
- Roles control what admins can see.
- Not every CMS record appears everywhere automatically.

Best first training demos:

- Create a draft page.
- Edit homepage hero.
- Publish a blog.
- Add a course.
- Add a form to a page.
- Review leads.
- Build a dropdown menu.
- Upload an image and check usage.
- Add a redirect.
- Review audit log.


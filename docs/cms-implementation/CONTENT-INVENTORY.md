# Content inventory — both websites (10 October 2026, 14:52–15:05 UTC)

Read-only, from production:
- **Main:** Supabase rows through the Main admin API (authorised admin session);
- **Enrollment:** the public WordPress REST API.

The searchable record lists are in `evidence/inventory-main-production.json` and `evidence/inventory-enrollment-production.json`. Each record has its id, title, slug, status/active flag, dates, and whether it has an SEO title, SEO description and image. Search or filter them with any JSON viewer, or for example `node -e "…"`.

## Where the existing content lives, and who can edit it today

| Content | Website | Source of truth | Count | Editable today in | Visible in the central WordPress admin? |
|---|---|---|---|---|---|
| **Blog posts** | Main `/blog/<slug>` | Supabase `blogs` | **88** (86 published, 2 draft); all 86 published are in the sitemap | Main `/admin` → Blogs | **No.** "Main Blogs" in WordPress has **0** records, because the import has not been run. Nothing was deleted (section "Import") |
| CMS pages: location/service landing pages (`…-course-in-<area>`) and others | Main | Supabase `pages` | **140** (134 published, 6 draft); 125 location/service style, 15 others | Main `/admin` → Pages | No (import not run) |
| Tools | Main `/tools/<slug>` | Supabase `tools_extended` | 68 (67 active; 1 inactive test tool) | Main `/admin` → Tools | No (import not run) |
| Locations | Main | Supabase `locations` | 13 (india, bangalore, mysore, jayanagar, jp-nagar, koramangala, indiranagar, mg-road, rajajinagar, rr-nagar, hsr-layout, whitefield, marathahalli) | Main `/admin` → Locations | No |
| Cities | Main | Supabase `cities` | 2 (bangalore, mysore) | Main `/admin` → Cities | No |
| Courses | Main `/courses/<slug>` | Supabase `courses` (+ `course_details`) | 2 rows: `ai-integrated-digital-marketing-program` (active, draft status) and the inactive test course | Main `/admin` → Courses | No |
| Course categories | Main | Supabase | 4 (Flagship, Career, Specialist, Certification) | Main `/admin` | No |
| Page templates | Main | Supabase `page_templates` | 10 (Blank, Course-style, Location-style, Campaign, General, Premium, Location Course, Landing, Contact, Homepage) | Main `/admin` → Templates | No; Elementor templates replace them after the import |
| Testimonials | Main | Supabase | 2 | Main `/admin` | No |
| Homepage, global and sitemap settings | Main | Supabase (1 row each) | 3 | Main `/admin` → Homepage / Settings | No |
| Redirects | Main | Supabase `redirects` | 1 | Main `/admin` → Redirects | No |
| Media | Main | Supabase storage (admin media API) | 338 | Main `/admin` → Media | No; the import copies used images into the WordPress Media Library |
| Leads | Main | Supabase `leads` | 2 (count only) | Main `/admin` → Leads | Stays in Main `/admin` (application data, never moved) |
| Pages | Enrollment | WordPress `page` (Elementor) | **53** published | **WordPress → Pages (central admin)** | **Yes** |
| Posts | Enrollment | WordPress `post` | 7 published (project/case-study articles), 10 categories | WordPress → Posts | **Yes** |
| Media | Enrollment | WordPress Media Library | 786 | WordPress → Media | **Yes** |
| Headers, footers, templates, popups, forms | Enrollment | Elementor / HFE / PopupKit / MetForm / CF7 | Not countable without admin access | WordPress → Templates / Elementor | **Yes** |
| Main Blogs, Courses, Locations, Tools, FAQs, Testimonials (Master Admin types) | Both | WordPress custom types (plugin 0.4.0) | Main Blogs published to Main: 0. Others not countable without admin access; expected 0 (new types) | WordPress → Acadvizen Master Admin | Yes (empty until the import) |
| Other Main content tables (success stories, placements, companies, internships, resources, reusable sections, FAQs, menus, banners, popups, forms, CTA blocks, …) | Main | Supabase | 0 rows each (or the table does not exist) | Main `/admin` | — |

**In short:** Enrollment's existing content is already in the central admin, because it *is* that WordPress. Main's existing content (88 blogs, 140 pages, 68 tools, 13 locations, …) is still only in Supabase and Main's `/admin`. It becomes visible in the central admin only when the **Import Main Website** step is run on production. That step needs the owner's backup, WordPress admin access and approval; it has not been run.

## Import: dry run against production (nothing written)

`evidence/import-dry-run-production.json`:

| Would create in WordPress | Count |
|---|---|
| Main Blogs (`acv_blog`), keeping `/blog/<slug>` | **86** |
| Tools (`acv_tool`), keeping `/tools/<slug>` | **67** |
| Pages and Locations from the published Supabase pages, keeping their Main addresses | **134** |

The importer, `tools/main-to-elementor`, builds the bundle from the public website plus published Supabase rows:
- **Left out:** test records (`local-e2e-…`), drafts and the inactive tool.
- **No duplicate slugs** in the source.
- **Repeatable:** every record carries a source key, so running it again updates instead of duplicating.
- **Reversible:** "Undo import" removes everything one import created.

**Conflicts found.** Two Main CMS pages share a slug with an existing Enrollment page: `courses` and `ai-integrated-digital-marketing-course-in-jp-nagar`.
- WordPress gives the imported page a different internal slug.
- **The existing Enrollment pages are not touched.**
- The Main address is kept through the page's explicit Main path.
- Review both after the first batch.

**Owner decisions before an import:**
- `dummy-dm-course` is a **published** blog that looks like test content. It *would* be imported, so unpublish it first if it is not real.
- `e2e-acadvizen-staging-blog-…` is a draft and is not imported. It can be deleted in Main `/admin`.

## Test-like records found

| Record | Where | State | Action |
|---|---|---|---|
| Local E2E Course `local-e2e-course-1779297401` | Main courses | Unpublished (inactive) | Done 10 Oct |
| Local E2E Tool `local-e2e-tool-1779297401` | Main tools | Unpublished; its page still shows the name until `930e29c` is deployed | Deploy |
| `e2e-acadvizen-staging-blog-1785569102593-fg8il6` | Main blogs | Draft, 404 | Owner may delete |
| `dummy-dm-course` | Main blogs | **Published** | **Owner to confirm** |
| `/test/`, `/3570-2/` | Enrollment | Published, in the sitemap | Owner: set to Draft |

# Visual website building — what is implemented (10 October 2026)

**The visual builder is Elementor, in the Enrollment WordPress admin, for both websites.**
- **Enrollment:** shows Elementor pages as it always has.
- **Main:** for pages published to it, Main serves exactly what WordPress and Elementor render. Its own pages and `/admin` stay as they are.

There is deliberately **no second, custom page builder**. Main's `/admin` already has a section builder backed by Supabase. A third editor would give the client competing sources of truth. Instead, `WORDPRESS_OWNS_PUBLIC_CONTENT=true` makes Main's `/admin` refuse edits to content that WordPress manages.

Where each result was observed:
- **LOCAL:** the Docker WordPress plus a local Main build (`tests/wordpress`, 44/44 checks, 10 Oct 2026);
- **STAGING** *(historical, retired)*: `cms.acadvizen.com` (2–10 Oct, earlier plugin build); not a CMS address, nothing depends on it;
- **PRODUCTION:** the plugin is installed (0.4.0) but not connected to Main, so no publishing behaviour has been verified on production yet. `docs/cms-implementation/CLIENT-HANDOVER.md` has the production acceptance matrix.

## Implementation matrix

| Requirement | How it works | Main | Enrollment | Evidence | Limits |
|---|---|---|---|---|---|
| Drag-and-drop editing: select, move, duplicate, delete, nest | Elementor editor (native) | Yes: published render | Yes | LOCAL A/C/F (layout changes reach Main); STAGING visual parity, 32 widget types | Elementor Pro widgets need Enrollment's Pro licence (licensed to enroll's domain) |
| Arbitrary layouts: containers, columns, grids, alignment, spacing, sizes | Elementor containers (native) | Yes | Yes | LOCAL A, F (1 ↔ 2 columns, padding) | — |
| Backgrounds, borders, shadows, typography, animations | Elementor style controls (native) | Yes: CSS inlined into each version | Yes | LOCAL A/F (background colours); STAGING animated headline, galleries | Per-visitor widgets show their state at publish time |
| Component library: hero, text, images, galleries, video, cards, FAQ, testimonials, forms, CTAs | Elementor widgets, plus the plugin's shortcodes `[acv_faqs]`, `[acv_testimonials]`, `[acv_tools]`, `[acv_loop]`, `[acv_lead_form]`, `[acv_breadcrumbs]`, `[acv_toc]`, `[acv_field]` | Yes | Yes | PHP tests (shortcodes, lead form); STAGING forms | Main lead forms post to Main's `/api/cms/leads`; Enrollment forms keep their own handling |
| Responsive editing (desktop, tablet, mobile) | Elementor breakpoints and per-device settings (native) | Yes | Yes | LOCAL: a mobile-only heading size and "hide on tablet" are in the Main render (`@media (max-width:767px)`) | — |
| Global styles: colours, fonts | Elementor Site Settings (kit). Master Admin → Global Styles opens it | Yes: every Main page re-rendered automatically | Yes | LOCAL D (global colour reaches Main in about 50 s and Enrollment; a page's own colour is kept); STAGING colours and fonts | A site-wide re-render takes minutes; done in the background, most-visited pages first |
| Theme presets (save and reuse a design system) | Elementor → Tools → Import/Export Kit (native) | Applies through the kit | Yes | Not tested | Importing a kit changes both websites |
| Templates: create, edit, duplicate, rename, save a page as a template, apply | Elementor Templates (native). Master Admin → Website Design sets one template per record type (courses, locations, tools, blogs) | Yes | Yes | STAGING (shared designs); PHP tests (design templates) | Group assignment by display conditions needs Elementor Pro (Enrollment licence) |
| Headers and footers per website | Header Footer Elementor / Elementor Pro Theme Builder, with Publish To on the template | Yes, with `ACADVIZEN_CMS_SITE_TEMPLATES` | Yes | STAGING (both directions); PHP tests | **Off by default** (first install). Turn it on before giving Main its own header |
| Menus | WordPress Appearance → Menus | Yes: re-render on save | Yes | STAGING | — |
| City and area pages | Locations (`acv_location`) with Cities & Areas (`acv_city`, parent → child); shared design; `[acv_loop]` lists for internal links | Yes, at `/<slug>` | Yes, when target is Enrollment/Both | LOCAL E (city → area, preview, publish, address change 301) | Area pages share the Main address scheme `/<slug>` (as Main's existing location pages) |
| New pages, addresses, parent pages, SEO | WordPress pages, slug, parent; Rank Math fields | Yes. Existing Main routes win unless "Replace" is ticked; application paths can never be replaced | Yes | LOCAL A/E; STAGING slug change and Replace | — |
| **Preview before publishing** | Elementor Preview (Enrollment look). **Preview on the Main Website** (new in 0.4.0): drafts, pending, scheduled and private pages, rendered with Main's header, footer and styles in a sandboxed viewer; stores nothing | Yes | Yes | LOCAL A/E; browser test (button, 200, sandbox, noindex, tampered nonce 403, no overflow at 390 px); anonymous and forged requests 404; PHP tests | Shows the last **saved** state. Elementor's unsaved autosave of a published page is not included |
| Draft, pending review, scheduled, published, unpublished, trash | WordPress statuses | Only "published" reaches Main; unpublish or trash removes it | Yes | LOCAL A (draft not public), C (target change), E; STAGING trash/restore | No separate "approved" state; use Pending Review → an Editor publishes. Scheduled → Main relies on WordPress's own publish event; **not tested end to end** |
| Versions and restore | Main: 5 stored versions per page, Make live, with styling included. WordPress/Elementor revisions for editing history | Yes: text **and** design restored | WordPress revisions | LOCAL F (green v1 → red v2 → rollback → green v1, then the next update replaces it) | Templates and global styles are restored through Elementor revisions or kit history, not Main versions |
| Publish to Main, Enrollment or Both | Publish To (edit screen and Elementor Page Settings) | — | — | LOCAL A/B/C; PHP tests | — |
| Per-site status, failures, retry | Status per website, Publishing log, automatic retries (1 and 5 minutes), Retry button. A failure never replaces the live version | Yes | — | LOCAL H (failed render recorded, previous version kept, retry recovered) | — |
| Cache revalidation | Signed webhook revalidates the page, the manifest and the sitemap; 5-minute safety refresh | Yes | — | LOCAL A–F (changes visible in 7–51 s) | A brand-new address can take up to about 30 s to route |
| Main stays up if WordPress is down | Main serves cached versions; its own routes never depend on WordPress | Yes | — | LOCAL: WordPress stopped; `/`, `/about`, `/courses`, `/blog`, `/tools`, `/contact` and a published WordPress page all answered 200, with content | A page's first view after a cold cache needs WordPress |
| Security | Signed, purpose-bound HMAC requests (5-minute window); capability and nonce checks; sandboxed previews; secrets only in `wp-config.php`/Vercel | — | — | LOCAL smoke 18/18 (incl. expired, wrong path, wrong secret); STAGING 37/37 probes; PHP signature tests | No per-request replay cache. A captured signature is valid for 5 minutes and only for its own read-only purpose |
| Media library | WordPress Media Library (native): upload, alt text, captions, cropping | Images load from WordPress | Yes | STAGING | — |
| Undo/redo, autosave, unsaved-change indicator, shortcuts | Elementor (native) | — | — | Elementor feature | — |

## Not implemented (needs engineering or a decision)

- **A side-by-side visual comparison** of the draft and the live page. Workaround: open "Preview on the Main Website" and the live page in two tabs.
- **A publish-scope confirmation** listing every affected page for a global change. Template screens say that saving republishes every Main page, but there is no per-page list.
- **An "Approved" workflow state** beyond WordPress's Pending Review.
- **Moving the existing Main pages into WordPress.** The import tool exists and was tested on staging, but it has **not been run on production**. Until it is, the existing Main pages are still edited in Main's `/admin`, and only new pages can be built in Elementor.
- **New application features** (new data types, logic, integrations) still need code. The builder changes design and content, not behaviour.

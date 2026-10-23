# Main Website: visual-editing inventory (21 October 2026)

Every address of www.acadvizen.com and how it is edited in the WordPress admin (https://enroll.acadvizen.com/wp-admin/). Source of the address list: a read-only crawl of production on 21 Oct 2026 (`sitemap.xml` + every same-site link on those pages): **314 sitemap addresses** and 10 linked addresses outside the sitemap.

**Where things stand**
- **Production:** 108 of 314 addresses (34.4%) are drawn by WordPress and edited visually (the location pages, live since 20 Oct). Everything else is still drawn by the Main Website.
- **Release candidate (isolated copy, 21 Oct):** 310 of 314 addresses (98.7%) were built as WordPress/Elementor pages, published through Approvals and compared with production. They reach production only by owner-approved cutovers, family by family.
- **The other 4** (`/companies`, `/internships`, `/resources`, `/blog/author/john-doe`) need an owner decision before anything is built (§3).
- **The client requirement "every Main page visually editable" is therefore not met on production.** It can be met for 310 addresses by the cutovers in §4, and for the last 4 only after the owner's decision.

## 1. Families

| Family | Addresses | How it is edited in WordPress (after its cutover) | Copy vs production (21 Oct) |
|---|---|---|---|
| Location pages | 108 | Own title, description and SEO (Locations) + one shared design, "Main — Location & service page design" | **Live on production since 20 Oct.** Copy 108/108: title, canonical, robots, description, heading and 100% of the text |
| "Digital Marketing Course in <area>" pages | 13 | The same as location pages: they are the same kind of Page Builder page | 13/13, 100% of the text |
| Homepage | 1 | Own Elementor page. "From the Blog" is a live list of the newest posts; registration popup | SEO identical; visible text identical apart from the blog cards (fixed after this run, §2) |
| Dedicated pages | 19 (15 + `/blog`, `/tools`, `/courses`, `/placement`) | Own Elementor page each. `/blog` and `/tools` hold live lists (the tool list with search and categories) | SEO identical on 19/19; visible text identical (checked at 1440 and 390 px on `/`, `/courses`, `/placement`, `/achievements`, `/about`) |
| Blog posts | 86 | Own fields (title, article, image, SEO) + one shared "Main — Blog post design" | 86/86, text ≥ 98.5% |
| Tool pages | 67 | Own fields + one shared "Main — Tool page design" | Text and SEO 67/67. The tool name is an h1 in the page HTML; production adds the same h1 only in the browser |
| Course page | 1 | Own Elementor page | Pass; text 97.3% (the difference is spacing around a quote) |
| "Digital Marketing Courses in <area>" pages | 13 | Shared "Main — Area course page design". Each page's own heading, introduction and "Nearby areas" title are fields (Locations → Details). "Nearby areas" is a live list: the other area pages of the same city group, in their order, at most six | 13/13; every "Nearby areas" list identical to production, link for link, in order (13/13) |
| City course pages (Bangalore, Mysore) | 2 | Shared "Main — City course page design" with the city name bound | 2/2 |
| Not converted: owner decision | 4 | See §3 | — |

In the copy, all 310 pages use only Main's header and footer: none contains Enrollment's footer, popup, course bar or "ADMISSIONS OPEN" bar. None scrolls sideways at 1440, 768 or 390 px.

**Linked, not in the sitemap (10):**
- `/register`: the Main registration flow, never replaced (application).
- `/explore-programs`: an interactive program finder (application).
- 8 tool addresses (buffer, elevenlabs, google-tag-manager, hootsuite, later, metricool, synthesia, youtube-ads): Main links to tools that have no record. It answers 200 with "Tool Details" and noindex (a soft 404). The links should be fixed on Main.

## 2. Gaps found and closed in the copy (21 Oct)

| Gap (20 Oct) | Cause | Fix | Result |
|---|---|---|---|
| Editor previewed Main pages inside Enrollment's header and "ADMISSIONS OPEN" bar | Main chrome was chosen only for signed renders | Plugin 0.7.6: Main chrome in the Elementor preview of Main-only documents | Homepage, /about and the tool, blog and location designs open with Main's header #8873 and footer #8874; Enrollment's front page keeps its own header, footer and bar |
| Tool and blog designs did not load in the editor | The copy was busy re-rendering 280 pages when they were opened (load, not a defect) | — | Both open in 25–33 s; Main homepage and Enrollment front page about 5 min in the slow Docker copy |
| Homepage "180 DAYS \| 120+ Tools \| 25+" line all white | WordPress removes inline `color:rgb(…)` from headings | Exporter writes colours as hex | Colours kept |
| Homepage video without its "Play Video" cover | — | Elementor's overlay styled as Main's tint and pill | Cover shown |
| Homepage value cards "not centred" | Mis-read: production's text is at the top of the card too | — | No change needed |
| `/achievements` collage misplaced, hero card too wide | Grid spans lost; a capped card drawn full width | Grid spans kept; drawn capped boxes centred at their width | Matches production |
| `/achievements` alumni stories 02 and 03 missing | A screenshot only sees the first story | Every story read by clicking through; an Elementor Nested Carousel with one editable slide per story | 3 stories, own titles and videos. **Remaining difference:** Elementor's arrows and dots instead of the vertical side tabs; the card is wider |
| Course page FAQ answers missing | Each FAQ item sat in its own animation wrapper | Accordion detection looks through such wrappers (only for real disclosure buttons) | Answers present |
| Footer city links wrapping onto two lines (all WordPress-drawn Main pages, also the 108 live ones) | Measured widths, one font pixel too narrow | One-line text in a row sizes to its content | In the release candidate |
| Homepage "From the Blog" showed 4 posts, production 6 | Number of cards fixed at 4 | As many as Main shows, in its columns | Exported and imported 21 Oct (§4 verification) |
| "Hide from search engines" could be published to Main as "index, follow" | The bridge read Rank Math's setting only | Plugin 0.7.6 (see the release report) | PHP tests |

**Known differences that remain** (no visible text missing):
- `/achievements`: carousel navigation (above).
- A one-space difference inside quotation marks in testimonials ("“ Hands-on …”" on production).
- `/courses`: Main's server HTML has the heading "Digital Marketing Courses"; Main's script then shows "Courses", which is what visitors see. The copy shows "Courses".
- Copied videos show a black first frame before play in our headless capture; production shows the first frame. Not verified in a real browser.
- Pages are 0–16% taller on some widths (spacing). Measured per page in `scratchpad/proto/shots-rc/report.json`.
- "Related resources" and "Featured courses" on area pages are fixed in the design (editable). Main recalculates them from the newest posts.

## 3. Owner decisions (not converted)

| Address | Today | Why it is not converted | Options |
|---|---|---|---|
| `/companies`, `/internships`, `/resources` | Heading, introduction and "being updated / no openings" text; their tables have 0 rows; detail pages under each | A static WordPress copy would hide every company, internship or resource added later in Main's admin | (a) keep on Main until they have data (the 13 Oct plan); or (b) a WordPress list bound to Main's data (needs a Main release adding these tables to the content API) |
| `/blog/author/john-doe` | "John Doe … No posts available"; indexable and in the sitemap | Placeholder data | Remove the author on Main (recommended) rather than migrate |

## 4. Moving a family to production (each needs the owner's approval)

1. Install plugin 0.7.6 (release report).
2. Import Main Website → the family's bundle. Nothing goes live: every page is submitted for approval.
3. A reviewer publishes one page, checks it on www.acadvizen.com at desktop, tablet and phone (content, SEO, forms), then publishes the rest.
4. The checks used here are repeatable: `compare-family.mjs` (SEO and text against production), `nearby-check.mjs` (area lists) and `shots.mjs` (three widths), all read-only.
5. **Rollback:** per page, Approvals → Recent publications → Restore, or Quick Edit → Draft (Main draws its own page again). Per family, Import Main Website → Undo this import.

## 5. Shared components

| Component | How it is edited | State |
|---|---|---|
| Main header and footer on WordPress-drawn pages | Elementor templates "Main Website Header" / "Main Website Footer" (production #8798 / #8799) | Live for the 108 location pages; footer width fix in the release candidate |
| Main header and footer on Main's own pages | Main Website → Header, Footer, Menus (structured) | Unchanged until every page is moved |
| Designs shared by many pages | Templates: Location & service page, Area course page, City course page, Blog post, Tool page, and the cards (blog, homepage blog, tool, tool listing, nearby area) | Release candidate |
| Registration popup (homepage) | Elementor popup "Quick Registration popup (Main homepage)" | Release candidate |
| Global colours and fonts | Elementor Site Settings (shared with Enrollment; Main's colours and fonts are added, none removed) | Live (added on 19 Oct) |
| Floating course bar, call buttons | Part of each Elementor design | Release candidate |

## 6. Every address

Generated from the 21 Oct crawl, the copy's renders and their comparison with production (`scratchpad/proto/inventory3.mjs`). "Copy" = SEO and text checks; "text" = share of production's visible text lines found on the copy's page.

| Address | In sitemap | Kind | How it is edited in WordPress (after its cutover) | Copy (SEO and text vs production) | Production |
|---|---|---|---|---|---|
| `/` | yes | Homepage | Own Elementor page; "From the Blog" a live list; registration popup | text95 (text 89.2%) | Main (cutover pending approval) |
| `/about` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/achievements` | yes | Dedicated page | Own Elementor page | pass (text 96.9%) | Main (cutover pending approval) |
| `/affiliate-marketing-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-chamarajpet` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-marketing-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-partnership-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/affiliate-partnership-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/ai-digital-marketing-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-basavanagudi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-chamarajpet` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-electronic-city` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-jayanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-digital-marketing-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-integrated-digital-marketing-course-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-integrated-digital-marketing-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-integrated-digital-marketing-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-powered-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/ai-powered-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/blog` | yes | Dedicated page | Own Elementor page; the post grid a live list | pass (text 100%) | Main (cutover pending approval) |
| `/blog/10-powerful-use-cases-every-marketer-should-know-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/24-digital-marketing-tools-you-actually-need-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/ai-and-automation-in-digital-marketing-future-trends-explained` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/ai-digital-marketing-career-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/ai-powered-lead-generation-smarter-leads-higher-roi-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/ai-tools-every-digital-marketer-must-master-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/author/john-doe` | yes | Not converted | Owner decision: placeholder author "John Doe" ("No posts available"), indexable and in the sitemap; recommended: remove on Main rather than migrate | — | Main |
| `/blog/behind-the-scenes-a-day-in-the-life-of-our-performance-marketing-student` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/best-affiliate-marketing-niches-2026-high-commission-low-competition-opportunities-for-beginners` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/best-digital-marketing-tools-every-beginner-should-know-in-2026-free-paid` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/career-in-digital-marketing-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/chatgpt-gemini-claude-which-ai-tool-will-marketers-utilize-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/claude-ai-for-digital-marketers-2026-guide-acadvizen` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 99%) | Main (cutover pending approval) |
| `/blog/claude-ai-meta-integration-guide-for-marketers-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/complete-roadmap-to-become-a-digital-marketer-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/death-of-keyword-understanding-user-intent-entities` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/death-of-the-link-birth-of-the-answer-geo-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-course-in-bangalore-fees-placements` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-course-in-bangalore-your-big-opportunity` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-for-non-it-graduates-is-it-a-good-career-switch` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-in-the-uk-vs-india-salary-and-growth-comparison-2026-edition` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-skills-next-generation-ai-era` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-marketing-trends-2026-complete-guide-for-marketers` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/digital-skills-education-6th-standard` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/doctor-of-digital-marketing-skills-beat-tools-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/dummy-dm-course` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/e-commerce-marketing-trends-to-watch-this-festive-season-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/email-marketing-automation-in-2026-sequences-that-actually-sell` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/email-marketing-in-2026-the-complete-strategy-guide-to-higher-opens-clicks-and-revenue` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/from-campus-to-career-how-acadvizen-inspired-future-digital-marketers-at-the-c2c-expo-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/google-ads-ai-max-explained-what-the-september-2026-auto-upgrade-changed` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/google-ads-bidding-update-2026-what-marketers-must-know` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/grow-your-brand-social-media-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/growth-hacking-techniques-for-digital-marketers-in-2026-ai-marketing-trends` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/highest-paying-digital-marketing-roles-in-india-2026-edition` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-ai-search-sge-is-changing-the-way-people-find-information-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-artificial-intelligence-is-transforming-digital-marketing-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-search-engines-work-complete-seo-basics-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-choose-the-right-affiliate-marketing-program-as-a-beginner` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-crack-the-google-and-accenture-digital-marketing-interview` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-create-a-landing-page-website-in-wordpress` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-get-leads-on-meta-business-suite-using-claude` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-get-your-first-freelance-digital-marketing-client-in-2026-complete-beginner-s-guide` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-land-a-high-paying-remote-job-for-a-us-based-company-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-negotiate-your-first-digital-marketing-salary` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/how-to-use-claude-ai-for-digital-marketing-practical-guide` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 98.5%) | Main (cutover pending approval) |
| `/blog/how-will-ai-impact-digital-marketing-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/internship-to-full-time-job-how-acadvizen-students-convert-opportunities` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/keyword-research-strategies-for-better-google-rankings` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/keyword-research-vs-prompt-research-the-future-of-seo` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/lead-generation-ads-that-convert-7-templates-that-work-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/local-seo-guide-how-small-businesses-can-rank-on-google-maps` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/mastering-global-meta-ads-running-campaigns-for-international-brands-2026-guide` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/mba-vs-digital-marketing-course-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/meta-ads-ai-stack-andromeda-claude-performance-ads` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/meta-andromeda-ai-smarter-facebook-instagram-ads-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/new-age-seo-2026-marketing-strategy` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/on-page-seo-the-complete-beginner-s-guide-to-higher-google-rankings-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/optimized-local-brand-for-voice-search` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/paid-ads-vs-affiliate-marketing-which-has-better-roi-for-beginners` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/performance-marketing-skills-demand-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/placement-faq-everything-you-need-to-know-about-our-100-support` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/programmatic-seo-how-brands-rank-for-thousands-of-keywords-at-once` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/ready-for-your-digital-marketing-plans-to-generate-results` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/remote-digital-marketing-jobs-how-to-get-hired-by-global-companies-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/running-ads-without-digital-strategy-you-re-burning-money` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/same-marketing-different-results-why-seo-isn-t-working` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/seo-vs-paid-ads-career-growth` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/seo-vs-performance-marketing-which-career-is-better-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/short-form-video-marketing-why-15-seconds-can-make-or-break-your-brand` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/the-complete-acadvizen-guide-to-launching-a-digital-marketing-career-in-2025` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/the-german-job-seeker-visa-a-complete-guide-for-digital-marketers-2026-edition` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/the-role-of-marketing-automation-tools-in-modern-businesses` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/the-ultimate-seo-strategy-guide-how-to-rank-higher-on-google-and-grow-your-business-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/top-10-digital-marketing-agencies-in-india-hiring-right-now-2026-edition` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/top-5-mistakes-freshers-make-in-their-first-digital-marketing-job` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/top-seo-mistakes-costing-you-traffic-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/video-seo-tiktok-youtube-shorts-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/voice-search-optimization-is-your-brand-ready-for-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-bangalore-hyderabad-are-the-hubs-for-performance-marketers-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-brands-are-shifting-budgets-from-tv-ads-to-digital-campaigns` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-instagram-marketing-matters-for-businesses-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-learn-digital-marketing-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-our-students-are-2-steps-ahead-of-the-industry` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-should-every-marketer-care-about-aeo-and-geo-in-2026-rather-than-just-seo` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/why-you-should-still-invest-in-a-website-in-2026` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/blog/zero-click-seo-google-ai-overviews-snippets` | yes | Blog post | Own fields (title, article, SEO) + shared "Blog post design" | pass (text 100%) | Main (cutover pending approval) |
| `/companies` | yes | Not converted | Owner decision: empty "companies" list (0 rows) with detail pages; a static copy would hide companies added later. Options: stay on Main, or a list bound to Supabase (needs a Main release) | — | Main |
| `/contact` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/content-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/content-marketing-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/content-marketing-course-in-jayanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/content-marketing-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/content-marketing-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/content-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/conversion-rate-optimization-cro-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/conversion-rate-optimization-cro-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/course-basic` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/courses` | yes | Dedicated page | Own Elementor page | h1 (text 99.4%) | Main (cutover pending approval) |
| `/courses/ai-integrated-digital-marketing-program` | yes | Course page | Own Elementor page | pass (text 97.3%) | Main (cutover pending approval) |
| `/degree-in-digital-marketing-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/digital-marketing-analytics-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/digital-marketing-analytics-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/digital-marketing-analytics-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/digital-marketing-course-bangalore` | yes | Area / city course page | Shared "Main — City course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 96.7%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-banashankari` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-basavanagudi` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-bidadi` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-btm-layout` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-chamarajpet` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-electronic-city` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-jp-nagar` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-koramangala` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-mg-road` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-rajajinagar` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-ramanagar` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-rr-nagar` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-in-whitefield` | yes | Location page (-in- city) | Own title/description/SEO + the shared "Location & service page design" (same family as the 108) | pass (text 100%) | Main (cutover pending approval) |
| `/digital-marketing-course-mysore` | yes | Area / city course page | Shared "Main — City course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 96.7%) | Main (cutover pending approval) |
| `/digital-marketing-courses-bangalore` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-hsr-layout` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-india` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-indiranagar` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-jayanagar` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-jp-nagar` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-koramangala` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-marathahalli` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-mg-road` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-mysore` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-rajajinagar` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-rr-nagar` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-courses-whitefield` | yes | Area / city course page | Shared "Main — Area course page design" with the page name bound; "Nearby areas" a live list of the other pages | pass (text 97.9%) | Main (cutover pending approval) |
| `/digital-marketing-internship-in-bangalore` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/diploma-in-digital-marketing-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/dropshipping-course-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/dropshipping-course-in-electronic-city` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/dropshipping-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/dropshipping-course-in-ramanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/dropshipping-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-basavanagudi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-electronic-city` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/email-marketing-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-bangalore` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/google-ads-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-electronic-city` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-jayanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-ramanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-ads-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-digital-marketing-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-digital-marketing-course-in-basavanagudi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/google-digital-marketing-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/hire-from-us` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/influencer-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/influencer-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/internships` | yes | Not converted | Owner decision: empty "internships" list (0 rows); as /companies | — | Main |
| `/paid-social-media-advertising-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/paid-social-media-advertising-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/placement` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/privacy-policy` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/projects` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/resources` | yes | Not converted | Owner decision: empty "resources" list (0 rows); as /companies | — | Main |
| `/search-engine-marketing-sem-google-ads` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/search-engine-optimization-seo` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-bangalore` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/seo-course-in-basavanagudi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-chamarajpet` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-jayanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-ramanagar-acadvizen` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/seo-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/smm-course-in-banashankari` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/smm-course-in-basavanagudi-social-media-marketing` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/smm-course-in-chamarajpet-social-media-marketing` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/smm-course-in-national-college` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-bangalore` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/social-media-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-btm-layout` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-electronic-city` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-jayanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-jp-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-koramangala` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-mg-road` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-ramanagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-rr-nagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-course-in-whitefield` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/social-media-marketing-smm` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/soft-skills` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/terms-of-service` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/testimonials` | yes | Dedicated page | Own Elementor page | pass (text 100%) | Main (cutover pending approval) |
| `/tools` | yes | Dedicated page | Own Elementor page; the tool grid a live list with search and categories | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/activecampaign` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/adobe-xd` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/adroll` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/ahrefs` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/amplitude` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/answer-the-public` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/brevo` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/canva` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/capcut` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/carrd` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/chatgpt` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/clarity` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/claude` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/convertkit` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/copy-ai` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/criteo` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/dalle` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/descript` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/figma` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/framer` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/freshsales` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/ga4` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/google-ads` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/google-analytics` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/google-search-console` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/hotjar` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/hubspot` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/illustrator` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/invideo` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/jasper` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/linkedin-ads` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/loom` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/mailchimp` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/make` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/mangools` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/meta-ads` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/microsoft-ads` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/midjourney` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/mixpanel` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/moz` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/n8n` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/notion-ai` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/outbrain` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/photoshop` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/pipedrive` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/pixlr` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/quillbot` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/rytr` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/salesforce` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/screaming-frog` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/semrush` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/serpstat` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/shopify` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/squarespace` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/surfer-seo` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/taboola` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/tag-manager` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/tiktok-ads` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/ubersuggest` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/veed` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/vistacreate` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/webflow` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/wix` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/wordpress` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/writesonic` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/zapier` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/tools/zoho` | yes | Tool page | Own fields + shared "Tool page design" | h1 (text 100%) | Main (cutover pending approval) |
| `/top-10-digital-marketing-institutes-in-bangalore` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/video-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/video-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/web-analytics-data-marketing-course-in-bidadi` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/web-analytics-data-marketing-course-in-rajajinagar` | yes | Location page | Live on production since 20 Oct: own title/description/SEO + shared "Location & service page design" | pass (text 100%) | served from WordPress |
| `/explore-programs` | no | Application route | Interactive program finder (Main application); not in the sitemap | — | Main |
| `/register` | no | Application route | Main registration flow; never replaceable (bridgeRouting NEVER_REPLACEABLE_SEGMENTS) | — | Main |
| `/tools/buffer` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/elevenlabs` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/google-tag-manager` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/hootsuite` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/later` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/metricool` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/synthesia` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |
| `/tools/youtube-ads` | no | Not a page | Linked tool without a record: Main answers 200 "Tool Details", noindex (soft 404) — fix the links on Main | — | Main |

-- Seeds named starter page_templates so a non-coder admin can pick a real design from
-- Admin > Pages > New Page (or Admin > Page Templates > Apply) instead of building 15-20 sections
-- by hand. Reuses the existing page_templates/template_data/apply-template infrastructure
-- (lib/templateResolver.js, app/api/cms/templates/[id]/apply/route.js) - no new template system.
--
-- Section types used are all already registered in components/sections/DynamicSectionRenderer.jsx.
-- Hero/stats_section/feature_cards/testimonial/faq/cta_banner opt into the premium Acadvizen
-- Immersive Experience look via style_json.layout_variant = "immersive" (see HeroSection.jsx etc).
-- *_feed sections (company_logos_feed, testimonials_feed, courses_feed, tools_feed,
-- instructors_feed) pull real CMS data at render time and are simply omitted if that table is
-- empty - never fabricated. gallery/map/faq are seeded with empty items/no embed so they start
-- omitted (GallerySection/MapSection/FaqSection all return null on empty content) until an admin
-- adds real media/address/questions - never a blank heading over an empty box. feature_cards and
-- stats_section, which do require literal seeded content to render at all, use clearly
-- instructional scaffolding copy ("Add your ...") rather than any invented claim, number, name,
-- or quote about Acadvizen - this is starter-template scaffolding, not live page content, and is
-- explicitly distinct from the "never fabricate real placements/testimonials/trainers" rule that
-- governs the live Course/City/Location renderers.

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'Premium Landing Page', 'premium-landing-page',
  'A complete, designed marketing landing page: hero, trust strip, benefits, testimonials, FAQ, lead form, and final CTA. Best for a standalone campaign or offer page that should feel like a full Acadvizen page, not a blank canvas.',
  'landing', true, false,
  $json$
  {"sections": [
    {"type": "hero", "order_index": 0, "visibility": true, "content_json": {"heading": "Your Premium Program Headline", "subheading": "Describe the transformation this program delivers, in one clear sentence.", "buttons": [{"label": "Talk to an Advisor", "href": "/contact", "target": "_self"}, {"label": "Explore Courses", "href": "/courses", "target": "_self"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "company_logos_feed", "order_index": 1, "visibility": true, "content_json": {"heading": "Trusted by hiring partners", "limit": 10}},
    {"type": "feature_cards", "order_index": 2, "visibility": true, "content_json": {"heading": "Why choose this program", "subheading": "Highlight three reasons a learner should choose this program.", "cards": [{"title": "Add your first benefit", "text": "Describe what makes this program valuable."}, {"title": "Add your second benefit", "text": "Describe another concrete outcome."}, {"title": "Add your third benefit", "text": "Describe what sets this apart."}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "two_column_layout", "order_index": 3, "visibility": true, "content_json": {"heading": "Program overview", "left": {"heading": "What you'll do", "text": "Describe the day-to-day learning experience here."}, "right": {"heading": "What you'll walk away with", "text": "Describe the concrete skills or outcomes here."}}},
    {"type": "testimonials_feed", "order_index": 4, "visibility": true, "content_json": {"heading": "What learners say", "limit": 6}},
    {"type": "gallery", "order_index": 5, "visibility": true, "content_json": {"heading": "Inside the experience", "items": []}},
    {"type": "faq", "order_index": 6, "visibility": true, "content_json": {"heading": "Frequently asked questions", "items": []}},
    {"type": "lead_form", "order_index": 7, "visibility": true, "content_json": {"heading": "Get a free consultation"}},
    {"type": "cta_banner", "order_index": 8, "visibility": true, "content_json": {"heading": "Ready to get started?", "button": {"label": "Enroll Now", "href": "/contact"}}, "style_json": {"layout_variant": "immersive"}}
  ]}
  $json$::jsonb
where not exists (select 1 from public.page_templates where slug = 'premium-landing-page');

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'Course-style Landing Page', 'course-style-landing-page',
  'A course-marketing style layout for a campaign or service page - at-a-glance stats, tools, mentors, and outcomes. For normal Pages that need course-page presentation; not a replacement for the real /courses/{slug} course entity page.',
  'course', true, false,
  $json$
  {"sections": [
    {"type": "hero", "order_index": 0, "visibility": true, "content_json": {"heading": "Your Course-style Page Headline", "subheading": "Describe who this is for and what they will achieve.", "buttons": [{"label": "Talk to Admissions", "href": "/contact", "target": "_self"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "stats_section", "order_index": 1, "visibility": true, "content_json": {"heading": "Program at a glance", "stats": [{"label": "Duration", "value": "Add value"}, {"label": "Mode", "value": "Add value"}, {"label": "Projects", "value": "Add value"}, {"label": "Placement Support", "value": "Add value"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "courses_feed", "order_index": 2, "visibility": true, "content_json": {"heading": "Explore related programs", "limit": 6}},
    {"type": "feature_cards", "order_index": 3, "visibility": true, "content_json": {"heading": "What you'll gain", "cards": [{"title": "Add your first outcome", "text": "Describe a concrete skill or outcome."}, {"title": "Add your second outcome", "text": "Describe another concrete skill or outcome."}, {"title": "Add your third outcome", "text": "Describe another concrete skill or outcome."}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "tools_feed", "order_index": 4, "visibility": true, "content_json": {"heading": "Tools you'll use", "limit": 8}},
    {"type": "instructors_feed", "order_index": 5, "visibility": true, "content_json": {"heading": "Learn from mentors", "limit": 6}},
    {"type": "testimonials_feed", "order_index": 6, "visibility": true, "content_json": {"heading": "What learners say", "limit": 6}},
    {"type": "faq", "order_index": 7, "visibility": true, "content_json": {"heading": "Frequently asked questions", "items": []}},
    {"type": "lead_form", "order_index": 8, "visibility": true, "content_json": {"heading": "Talk to our admissions team"}},
    {"type": "cta_banner", "order_index": 9, "visibility": true, "content_json": {"heading": "Ready to start your career?", "button": {"label": "Enroll Now", "href": "/contact"}}, "style_json": {"layout_variant": "immersive"}}
  ]}
  $json$::jsonb
where not exists (select 1 from public.page_templates where slug = 'course-style-landing-page');

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'Location-style Landing Page', 'location-style-landing-page',
  'A city/area-marketing style layout for a campaign or service page - stats, local proof, map placeholder. For normal Pages that need location-page presentation; not a replacement for the real City/Area entity pages (Admin > Locations).',
  'city', true, false,
  $json$
  {"sections": [
    {"type": "hero", "order_index": 0, "visibility": true, "content_json": {"heading": "Course Name in [Area]", "subheading": "Practical, job-ready training available near [Area].", "buttons": [{"label": "Talk to an Advisor", "href": "/contact", "target": "_self"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "stats_section", "order_index": 1, "visibility": true, "content_json": {"heading": "At a glance", "stats": [{"label": "Duration", "value": "Add value"}, {"label": "Mode", "value": "Add value"}, {"label": "Batches", "value": "Add value"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "courses_feed", "order_index": 2, "visibility": true, "content_json": {"heading": "Programs available here", "limit": 6}},
    {"type": "feature_cards", "order_index": 3, "visibility": true, "content_json": {"heading": "Why learn here", "cards": [{"title": "Add your first reason", "text": "Describe a local advantage."}, {"title": "Add your second reason", "text": "Describe another local advantage."}, {"title": "Add your third reason", "text": "Describe another local advantage."}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "testimonials_feed", "order_index": 4, "visibility": true, "content_json": {"heading": "What local learners say", "limit": 6}},
    {"type": "company_logos_feed", "order_index": 5, "visibility": true, "content_json": {"heading": "Hiring partners", "limit": 12}},
    {"type": "gallery", "order_index": 6, "visibility": true, "content_json": {"heading": "Inside the classroom", "items": []}},
    {"type": "map", "order_index": 7, "visibility": true, "content_json": {"heading": "Find us"}},
    {"type": "faq", "order_index": 8, "visibility": true, "content_json": {"heading": "Frequently asked questions", "items": []}},
    {"type": "lead_form", "order_index": 9, "visibility": true, "content_json": {"heading": "Get a free counselling session"}},
    {"type": "cta_banner", "order_index": 10, "visibility": true, "content_json": {"heading": "Ready to start your digital marketing career?", "button": {"label": "Enroll Now", "href": "/contact"}}, "style_json": {"layout_variant": "immersive"}}
  ]}
  $json$::jsonb
where not exists (select 1 from public.page_templates where slug = 'location-style-landing-page');

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'Campaign Page', 'campaign-page',
  'A short, focused conversion page for a single offer or promotion - hero, quick trust strip, benefits, proof, and one lead form. Fewer sections than Premium Landing Page by design.',
  'campaign', true, false,
  $json$
  {"sections": [
    {"type": "hero", "order_index": 0, "visibility": true, "content_json": {"heading": "Your Campaign Headline", "subheading": "State the offer and why it matters, in one line.", "buttons": [{"label": "Claim This Offer", "href": "/contact", "target": "_self"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "stats_section", "order_index": 1, "visibility": true, "content_json": {"heading": "Why act now", "stats": [{"label": "Add a metric label", "value": "Add value"}, {"label": "Add a metric label", "value": "Add value"}, {"label": "Add a metric label", "value": "Add value"}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "feature_cards", "order_index": 2, "visibility": true, "content_json": {"heading": "What's included", "cards": [{"title": "Add your first benefit", "text": "Describe what's included."}, {"title": "Add your second benefit", "text": "Describe what's included."}, {"title": "Add your third benefit", "text": "Describe what's included."}]}, "style_json": {"layout_variant": "immersive"}},
    {"type": "testimonials_feed", "order_index": 3, "visibility": true, "content_json": {"heading": "What learners say", "limit": 4}},
    {"type": "lead_form", "order_index": 4, "visibility": true, "content_json": {"heading": "Claim this offer"}},
    {"type": "cta_banner", "order_index": 5, "visibility": true, "content_json": {"heading": "Don't miss out", "button": {"label": "Get Started", "href": "/contact"}}, "style_json": {"layout_variant": "immersive"}}
  ]}
  $json$::jsonb
where not exists (select 1 from public.page_templates where slug = 'campaign-page');

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'General Content Page', 'general-content-page',
  'A simple editorial/informational page - banner, body copy, a content/image split, FAQ, and a closing CTA. Best for About, policy, or explainer-style pages that are mostly text.',
  'about', true, false,
  $json$
  {"sections": [
    {"type": "hero", "order_index": 0, "visibility": true, "content_json": {"heading": "Your Page Title", "subheading": "A short supporting line about this page."}},
    {"type": "text_block", "order_index": 1, "visibility": true, "content_json": {"heading": "Overview", "text": "Write the main body content for this page here."}},
    {"type": "two_column_layout", "order_index": 2, "visibility": true, "content_json": {"heading": "More detail", "left": {"heading": "Add a heading", "text": "Add supporting detail here."}, "right": {"heading": "Add a heading", "text": "Add supporting detail here."}}},
    {"type": "faq", "order_index": 3, "visibility": true, "content_json": {"heading": "Frequently asked questions", "items": []}},
    {"type": "cta_banner", "order_index": 4, "visibility": true, "content_json": {"heading": "Want to know more?", "text": "Get in touch with our team.", "button": {"label": "Contact Us", "href": "/contact"}}}
  ]}
  $json$::jsonb
where not exists (select 1 from public.page_templates where slug = 'general-content-page');

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select 'Blank Page (Page Builder)', 'blank-page',
  'Starts with no sections at all - build the page manually in the Page Builder, section by section. Choose this only if none of the designed templates fit.',
  'blank', true, false,
  '{"sections": []}'::jsonb
where not exists (select 1 from public.page_templates where slug = 'blank-page');

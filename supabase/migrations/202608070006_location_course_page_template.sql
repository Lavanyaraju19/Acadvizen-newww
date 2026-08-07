-- Seeds a default "Location Course Page" page_template so admins can generate course+area landing
-- pages (e.g. "Digital Marketing Course in JP Nagar") via Templates -> Apply -> pick Course/City/
-- Area, matching the location page generator wired into app/admin/templates/PageTemplatesClient.jsx.
-- Uses only section types that are genuinely registered and render real data today
-- (components/sections/DynamicSectionRenderer.jsx) - courses_feed, tools_feed, company_logos_feed
-- were added in the same change that added this migration. The template is a starting point: an
-- admin fills in real per-page content through the Page Builder after generating a page from it.
-- app/admin/templates/PageTemplatesClient.jsx's TEMPLATE_TYPES picker was extended to offer these
-- additional template types; the DB check constraint must allow them or saving/seeding any
-- template with one of these types fails.
alter table public.page_templates drop constraint if exists page_templates_template_type_check;
alter table public.page_templates add constraint page_templates_template_type_check
  check (template_type = any (array[
    'homepage', 'landing', 'city', 'location_course', 'course', 'short_course', 'campaign',
    'corporate_training', 'placement', 'blog', 'contact', 'about', 'faq', 'privacy', 'terms', 'blank'
  ]::text[]));

insert into public.page_templates (name, slug, description, template_type, is_active, is_default, template_data)
select
  'Location Course Page',
  'location-course-page',
  'Default starting point for course + area landing pages (e.g. "Digital Marketing Course in JP Nagar"). Generate a page from this via Templates -> Apply, optionally picking a Course, City and Area to auto-suggest the title and slug.',
  'location_course',
  true,
  false,
  jsonb_build_object('sections', jsonb_build_array(
    jsonb_build_object('type', 'hero', 'order_index', 0, 'visibility', true, 'content_json', jsonb_build_object(
      'heading', 'Digital Marketing Course in [Area]',
      'subheading', 'Practical, AI-integrated training for [Area], [City] - live projects, real tools, placement support.',
      'primary_cta_label', 'Talk to an Advisor',
      'secondary_cta_label', 'Download Curriculum'
    )),
    jsonb_build_object('type', 'stats_section', 'order_index', 1, 'visibility', true, 'content_json', jsonb_build_object(
      'heading', 'At a glance',
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Duration', 'value', '6 Months'),
        jsonb_build_object('label', 'Mode', 'value', 'Classroom + Online'),
        jsonb_build_object('label', 'Projects', 'value', '10+'),
        jsonb_build_object('label', 'Placement Support', 'value', 'Yes')
      )
    )),
    jsonb_build_object('type', 'courses_feed', 'order_index', 2, 'visibility', true, 'content_json', jsonb_build_object(
      'heading', 'Programs available in [Area]', 'limit', 6
    )),
    jsonb_build_object('type', 'feature_cards', 'order_index', 3, 'visibility', true, 'content_json', jsonb_build_object(
      'heading', 'Why learn with Acadvizen',
      'items', jsonb_build_array(
        jsonb_build_object('title', 'Integrated AI Tools', 'description', 'Hands-on with 30+ real AI marketing tools.'),
        jsonb_build_object('title', 'Live Projects', 'description', 'Work on real client-style campaigns.'),
        jsonb_build_object('title', 'Placement Support', 'description', 'Career guidance and hiring partner access.')
      )
    )),
    jsonb_build_object('type', 'tools_feed', 'order_index', 4, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Tools you will use', 'limit', 8)),
    jsonb_build_object('type', 'instructors_feed', 'order_index', 5, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Learn from industry mentors', 'limit', 6)),
    jsonb_build_object('type', 'placement_feed', 'order_index', 6, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Career outcomes', 'limit', 6)),
    jsonb_build_object('type', 'company_logos_feed', 'order_index', 7, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Hiring partners', 'limit', 12)),
    jsonb_build_object('type', 'testimonial', 'order_index', 8, 'visibility', true, 'content_json', jsonb_build_object('heading', 'What learners say')),
    jsonb_build_object('type', 'gallery', 'order_index', 9, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Inside the classroom')),
    jsonb_build_object('type', 'map', 'order_index', 10, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Find us in [Area]')),
    jsonb_build_object('type', 'faq', 'order_index', 11, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Frequently asked questions', 'items', jsonb_build_array())),
    jsonb_build_object('type', 'lead_form', 'order_index', 12, 'visibility', true, 'content_json', jsonb_build_object('heading', 'Get a free counselling session')),
    jsonb_build_object('type', 'cta_banner', 'order_index', 13, 'visibility', true, 'content_json', jsonb_build_object(
      'heading', 'Ready to start your digital marketing career?',
      'primary_cta_label', 'Enroll Now'
    ))
  ))
where not exists (select 1 from public.page_templates where slug = 'location-course-page');

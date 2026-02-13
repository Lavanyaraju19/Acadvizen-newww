-- Refresh homepage CMS content to match new layout
insert into public.home_sections
  (section_key, title, subtitle, body, items_json, cta_json, order_index, is_active)
values
  (
    'hero',
    'Acadvizen - Build Your Own Digital Marketing Course',
    'Choose your tools, customize your syllabus, and train for real jobs in India & abroad.',
    null,
    null,
    '{
      "apply_label": "Apply Now",
      "brochure_label": "Download Brochure",
      "brochure_url": "#",
      "curriculum_label": "View Curriculum"
    }'::jsonb,
    1,
    true
  ),
  (
    'why_acadvizen',
    'Why We Are Different',
    'Most institutes force a fixed syllabus. At Acadvizen, you build your own learning path.',
    null,
    '[
      "What modules you want",
      "Which tools you want to master",
      "Your pace and career goals",
      "Your specialization (SEO, Ads, Social, Analytics)"
    ]'::jsonb,
    null,
    2,
    true
  ),
  (
    'who_for',
    'Who Is This For?',
    null,
    null,
    '[
      { "title": "Freshers", "desc": "Start your career in digital marketing with a customized learning plan." },
      { "title": "Working Professionals", "desc": "Upskill with tools and modules that match your job requirements." },
      { "title": "Business Owners", "desc": "Learn marketing tools that grow your business." },
      { "title": "Freelancers", "desc": "Build your own skill stack and get more clients." }
    ]'::jsonb,
    null,
    3,
    true
  ),
  (
    'syllabus',
    'Build Your Own Syllabus',
    null,
    null,
    '[
      "Digital Marketing Fundamentals",
      "Content Marketing",
      "SEO (On-page & Off-page)",
      "Social Media Marketing",
      "Google Ads & Performance Marketing",
      "Email Marketing & Automation",
      "Analytics (GA4 & Tag Manager)"
    ]'::jsonb,
    '[
      "Google Ads",
      "Meta Ads Manager",
      "SEMrush / Ahrefs",
      "HubSpot / Mailchimp",
      "Canva / Adobe",
      "ChatGPT & AI Tools",
      "CRM tools (Zoho, Salesforce)"
    ]'::jsonb,
    4,
    true
  ),
  (
    'tools_section',
    'Tools You Will Master',
    'Browse 75+ industry tools across every marketing category.',
    null,
    null,
    null,
    5,
    true
  ),
  (
    'live_projects',
    'Live Projects & Placement Support',
    null,
    'Work on real campaigns and get hands-on experience.',
    null,
    null,
    6,
    true
  ),
  (
    'placement_support',
    null,
    'Placement Support',
    null,
    '[
      "Resume building",
      "LinkedIn profile optimization",
      "Mock interviews",
      "Hiring partner network",
      "Internship & job opportunities in India & abroad"
    ]'::jsonb,
    null,
    7,
    true
  ),
  (
    'blog_section',
    'From the Blog',
    'Latest insights from Acadvizen.',
    'No blog posts yet.',
    null,
    null,
    8,
    true
  ),
  (
    'registration_popup',
    'Quick Registration',
    'Reserve your spot in under 60 seconds.',
    'I agree to the Privacy Policy and allow Acadvizen to contact me.',
    null,
    '{"submit_label":"Register Now"}'::jsonb,
    20,
    true
  )
on conflict (section_key)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  items_json = excluded.items_json,
  cta_json = excluded.cta_json,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

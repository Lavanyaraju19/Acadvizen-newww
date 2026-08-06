-- Historical recovery migration for 20260722_page_templates.sql (tracked, not edited here).
--
-- 20260722_page_templates.sql's `create table` now defines slug directly (see that file),
-- so its own seed INSERT already succeeds and this file's `where not exists` guard makes
-- the re-seed here a harmless no-op. Kept only for deployments that already ran an older
-- copy of 20260722_page_templates.sql before slug existed on the table.

insert into public.page_templates (name, slug, description, template_type, template_data, is_default)
select v.name, v.slug, v.description, v.template_type, v.template_data::jsonb, v.is_default
from (values
  ('Homepage Template', 'homepage-template', 'Default homepage layout with hero, features, and CTA', 'homepage', '{"sections": [{"type": "hero", "data": {"title": "Welcome to Our Website", "subtitle": "Your success starts here", "cta_text": "Get Started"}}]}', true),
  ('Landing Page Template', 'landing-page-template', 'High-converting landing page template', 'landing', '{"sections": [{"type": "hero", "data": {"title": "Transform Your Future", "subtitle": "Join thousands of successful graduates", "cta_text": "Enroll Now"}}]}', true),
  ('Contact Page Template', 'contact-page-template', 'Contact form and information template', 'contact', '{"sections": [{"type": "contact", "data": {"title": "Get in Touch", "email": "info@example.com", "phone": "+1234567890"}}]}', true)
) as v(name, slug, description, template_type, template_data, is_default)
where not exists (select 1 from public.page_templates p where p.slug = v.slug);

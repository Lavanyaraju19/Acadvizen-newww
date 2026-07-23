-- Page Templates Schema

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Page templates table
create table if not exists public.page_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  template_type text not null check (template_type in ('homepage', 'landing', 'city', 'course', 'blog', 'contact', 'about', 'faq', 'privacy', 'terms')),
  template_data jsonb not null,
  is_default boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_page_templates_type on public.page_templates(template_type);
create index if not exists idx_page_templates_default on public.page_templates(is_default) where is_default = true;

-- Trigger for updated_at
drop trigger if exists set_page_templates_updated_at on public.page_templates;
create trigger set_page_templates_updated_at
before update on public.page_templates
for each row execute function public.set_updated_at();

-- RLS policies
alter table public.page_templates enable row level security;

drop policy if exists "page_templates_admin_all" on public.page_templates;
create policy "page_templates_admin_all"
on public.page_templates for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Insert default templates
insert into public.page_templates (name, description, template_type, template_data, is_default) values
('Homepage Template', 'Default homepage layout with hero, features, and CTA', 'homepage', '{"sections": [{"type": "hero", "data": {"title": "Welcome to Our Website", "subtitle": "Your success starts here", "cta_text": "Get Started"}}]}', true),
('Landing Page Template', 'High-converting landing page template', 'landing', '{"sections": [{"type": "hero", "data": {"title": "Transform Your Future", "subtitle": "Join thousands of successful graduates", "cta_text": "Enroll Now"}}]}', true),
('Contact Page Template', 'Contact form and information template', 'contact', '{"sections": [{"type": "contact", "data": {"title": "Get in Touch", "email": "info@example.com", "phone": "+1234567890"}}]}', true)
on conflict do nothing;
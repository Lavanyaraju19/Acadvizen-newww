-- Seed blog section for homepage CMS
insert into public.home_sections
  (section_key, title, subtitle, body, order_index, is_active)
values
  (
    'blog_section',
    'From the Blog',
    'Latest insights from Acadvizen.',
    'No blog posts yet.',
    17,
    true
  )
on conflict (section_key)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

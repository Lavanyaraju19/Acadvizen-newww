-- Seed placement page sections for CMS
insert into public.page_sections
  (page_slug, section_key, title, subtitle, body, order_index, is_active)
values
  (
    'placement',
    'hero',
    'Placements',
    'Recent placements, hiring partners, and role highlights.',
    null,
    1,
    true
  ),
  (
    'placement',
    'empty',
    null,
    null,
    'No placements available.',
    2,
    true
  )
on conflict (page_slug, section_key)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  body = excluded.body,
  order_index = excluded.order_index,
  is_active = excluded.is_active;

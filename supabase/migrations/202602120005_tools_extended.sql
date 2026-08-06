-- Extended tools catalog for homepage and tools section
create table if not exists public.tools_extended (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  brand_color text,
  category text,
  description text,
  website_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

alter table public.tools_extended enable row level security;
drop policy if exists "tools_extended_public_select" on public.tools_extended;
create policy "tools_extended_public_select"
  on public.tools_extended
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "tools_extended_admin_write" on public.tools_extended;
create policy "tools_extended_admin_write"
  on public.tools_extended
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.tools_extended (name, slug, logo_url, brand_color, category, description, website_url, is_active)
values
  ('Ahrefs','ahrefs',null,'#0B1F2A','SEO','SEO suite for keyword research, backlinks, and rank tracking.','https://ahrefs.com',true),
  ('SEMrush','semrush',null,'#FF642D','SEO','All-in-one SEO and competitive intelligence platform.','https://semrush.com',true),
  ('Moz','moz',null,'#00A57E','SEO','SEO tools for keyword research and site audits.','https://moz.com',true),
  ('Ubersuggest','ubersuggest',null,'#FFB020','SEO','Keyword and content ideas for SEO growth.','https://neilpatel.com/ubersuggest',true),
  ('Screaming Frog','screaming-frog',null,'#00A3E0','SEO','Site crawler for technical SEO audits.','https://screamingfrog.co.uk/seo-spider',true),
  ('Google Search Console','google-search-console',null,'#4285F4','SEO','Monitor search performance and site indexing.','https://search.google.com/search-console',true),
  ('Surfer SEO','surfer-seo',null,'#2F80ED','SEO','On-page SEO optimization and content editor.','https://surferseo.com',true),
  ('AnswerThePublic','answer-the-public',null,'#1E1E1E','SEO','Content ideas from real search queries.','https://answerthepublic.com',true),
  ('Mangools','mangools',null,'#00C2FF','SEO','SEO toolkit for keywords and rank tracking.','https://mangools.com',true),
  ('Serpstat','serpstat',null,'#7E3FF2','SEO','SEO and PPC analytics platform.','https://serpstat.com',true),

  ('Google Ads','google-ads',null,'#4285F4','Ads','Advertising platform for search and display.','https://ads.google.com',true),
  ('Meta Ads','meta-ads',null,'#1877F2','Ads','Advertising across Facebook and Instagram.','https://www.facebook.com/business/ads',true),
  ('LinkedIn Ads','linkedin-ads',null,'#0A66C2','Ads','B2B advertising on LinkedIn.','https://www.linkedin.com/marketing-solutions/ads',true),
  ('TikTok Ads','tiktok-ads',null,'#010101','Ads','Video ads on TikTok.','https://ads.tiktok.com',true),
  ('Microsoft Ads','microsoft-ads',null,'#2B579A','Ads','Search ads across Microsoft network.','https://ads.microsoft.com',true),
  ('Taboola','taboola',null,'#1A2E35','Ads','Native advertising network.','https://www.taboola.com',true),
  ('Outbrain','outbrain',null,'#EB5E28','Ads','Content discovery and native ads.','https://www.outbrain.com',true),
  ('Criteo','criteo',null,'#00AEEF','Ads','Commerce media platform for retargeting.','https://www.criteo.com',true),
  ('AdRoll','adroll',null,'#6B46C1','Ads','Retargeting and growth marketing.','https://www.adroll.com',true),

  ('Canva','canva',null,'#00C4CC','Design','Design tool for social and marketing creatives.','https://www.canva.com',true),
  ('Figma','figma',null,'#0ACF83','Design','Collaborative design and prototyping.','https://www.figma.com',true),
  ('Adobe XD','adobe-xd',null,'#FF26BE','Design','UI/UX design and prototyping.','https://www.adobe.com/products/xd.html',true),
  ('Photoshop','photoshop',null,'#0D99FF','Design','Image editing for professionals.','https://www.adobe.com/products/photoshop.html',true),
  ('Illustrator','illustrator',null,'#FF9A00','Design','Vector design and illustration.','https://www.adobe.com/products/illustrator.html',true),
  ('Pixlr','pixlr',null,'#00B7C2','Design','Online photo editor.','https://pixlr.com',true),
  ('VistaCreate','vistacreate',null,'#7C3AED','Design','Templates and creative assets.','https://create.vista.com',true),

  ('WordPress','wordpress',null,'#21759B','Website','CMS for websites and blogs.','https://wordpress.org',true),
  ('Webflow','webflow',null,'#146EF5','Website','Visual web design and hosting.','https://webflow.com',true),
  ('Wix','wix',null,'#2D7FF9','Website','Website builder for small businesses.','https://www.wix.com',true),
  ('Shopify','shopify',null,'#95BF47','Website','Ecommerce platform.','https://www.shopify.com',true),
  ('Squarespace','squarespace',null,'#111111','Website','Website builder for creatives.','https://www.squarespace.com',true),
  ('Framer','framer',null,'#FF4B4B','Website','Interactive web design tool.','https://www.framer.com',true),
  ('Carrd','carrd',null,'#7C3AED','Website','One-page site builder.','https://carrd.co',true),

  ('ChatGPT','chatgpt',null,'#10A37F','Gen AI','AI assistant for content and workflows.','https://chat.openai.com',true),
  ('Claude','claude',null,'#6B46C1','Gen AI','AI assistant for writing and analysis.','https://claude.ai',true),
  ('Jasper','jasper',null,'#FF5A5F','Gen AI','AI copywriting platform.','https://www.jasper.ai',true),
  ('Writesonic','writesonic',null,'#4F46E5','Gen AI','AI content generation suite.','https://writesonic.com',true),
  ('Copy.ai','copy-ai',null,'#111827','Gen AI','AI writer for marketing copy.','https://www.copy.ai',true),
  ('Rytr','rytr',null,'#00B894','Gen AI','AI writing assistant.','https://rytr.me',true),
  ('Quillbot','quillbot',null,'#22C55E','Gen AI','Paraphrasing and grammar tool.','https://quillbot.com',true),
  ('Notion AI','notion-ai',null,'#111111','Gen AI','AI for notes and docs.','https://www.notion.so/product/ai',true),
  ('Midjourney','midjourney',null,'#8B5CF6','Gen AI','AI image generation.','https://www.midjourney.com',true),
  ('DALL·E','dalle',null,'#00A3E0','Gen AI','AI image generation.','https://openai.com/dall-e',true),

  ('Google Analytics','google-analytics',null,'#E37400','Analytics','Web analytics platform.','https://analytics.google.com',true),
  ('GA4','ga4',null,'#F9AB00','Analytics','Google Analytics 4 reporting.','https://analytics.google.com',true),
  ('Tag Manager','tag-manager',null,'#246FDB','Analytics','Manage marketing tags.','https://tagmanager.google.com',true),
  ('Hotjar','hotjar',null,'#FF3C00','Analytics','Behavior analytics and heatmaps.','https://www.hotjar.com',true),
  ('Clarity','clarity',null,'#1F6FEB','Analytics','Session recordings and heatmaps.','https://clarity.microsoft.com',true),
  ('Mixpanel','mixpanel',null,'#7C3AED','Analytics','Product analytics.','https://mixpanel.com',true),
  ('Amplitude','amplitude',null,'#2563EB','Analytics','Product analytics and insights.','https://amplitude.com',true),

  ('HubSpot','hubspot',null,'#FF7A59','CRM','CRM and marketing automation.','https://www.hubspot.com',true),
  ('Zoho','zoho',null,'#E11D48','CRM','Business suite and CRM.','https://www.zoho.com',true),
  ('Salesforce','salesforce',null,'#00A1E0','CRM','Enterprise CRM platform.','https://www.salesforce.com',true),
  ('Pipedrive','pipedrive',null,'#262B33','CRM','Sales CRM and pipeline management.','https://www.pipedrive.com',true),
  ('Freshsales','freshsales',null,'#25C2A0','CRM','CRM for sales teams.','https://www.freshworks.com/crm/sales',true),

  ('Mailchimp','mailchimp',null,'#FFE01B','Email','Email marketing and automation.','https://mailchimp.com',true),
  ('Brevo','brevo',null,'#0B0B45','Email','Email and marketing automation.','https://www.brevo.com',true),
  ('ConvertKit','convertkit',null,'#E74C3C','Email','Email marketing for creators.','https://convertkit.com',true),
  ('ActiveCampaign','activecampaign',null,'#356AE6','Email','Email automation and CRM.','https://www.activecampaign.com',true),

  ('CapCut','capcut',null,'#111111','Video','Video editor for short-form content.','https://www.capcut.com',true),
  ('VEED','veed',null,'#00C4CC','Video','Online video editor.','https://www.veed.io',true),
  ('InVideo','invideo',null,'#2D9CDB','Video','Video creation platform.','https://invideo.io',true),
  ('Descript','descript',null,'#5B21B6','Video','Video and podcast editor.','https://www.descript.com',true),
  ('Loom','loom',null,'#625DF5','Video','Screen recording for teams.','https://www.loom.com',true),

  ('Zapier','zapier',null,'#FF4A00','Automation','Workflow automation.','https://zapier.com',true),
  ('Make','make',null,'#4338CA','Automation','Automation and integrations.','https://www.make.com',true),
  ('n8n','n8n',null,'#EA580C','Automation','Open-source workflow automation.','https://n8n.io',true)
on conflict (slug) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  brand_color = excluded.brand_color,
  category = excluded.category,
  description = excluded.description,
  website_url = excluded.website_url,
  is_active = excluded.is_active;

update public.tools_extended
set logo_url = 'https://logo.clearbit.com/' || regexp_replace(website_url, '^https?://([^/]+).*$','\\1')
where (logo_url is null or logo_url = '')
  and website_url is not null;

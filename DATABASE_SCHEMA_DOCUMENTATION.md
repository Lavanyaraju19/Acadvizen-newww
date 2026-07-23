# Acadvizen Headless CMS - Database Schema Documentation

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Database:** PostgreSQL (via Supabase)

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Content Tables](#content-tables)
3. [Configuration Tables](#configuration-tables)
4. [Enterprise Tables](#enterprise-tables)
5. [Indexes](#indexes)
6. [Relationships](#relationships)
7. [Row-Level Security](#row-level-security)

---

## Core Tables

### profiles

User profile information linked to Supabase Auth.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: User ID (references Supabase Auth)
- `email`: User email address
- `full_name`: User's full name
- `role`: User role (user, admin, editor)
- `avatar_url`: Profile picture URL
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

---

## Content Tables

### pages

Website pages with content and metadata.

```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique page identifier
- `title`: Page title
- `slug`: URL-friendly page identifier
- `description`: Page description
- `seo_title`: SEO title tag
- `seo_description`: SEO meta description
- `status`: Page status (draft/published)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### sections

Content sections within pages.

```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content_json JSONB,
  order_index INTEGER DEFAULT 0,
  visibility BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique section identifier
- `page_id`: Parent page ID
- `type`: Section type (hero, text, image, etc.)
- `content_json`: Section content as JSON
- `order_index`: Display order
- `visibility`: Section visibility
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### blogs

Blog posts and articles.

```sql
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB,
  excerpt TEXT,
  author TEXT,
  featured_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique blog identifier
- `title`: Blog title
- `slug`: URL-friendly blog identifier
- `content`: Blog content as JSON
- `excerpt`: Blog excerpt for listings
- `author`: Author name
- `featured_image`: Cover image URL
- `status`: Blog status (draft/published)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### courses

Course information and curriculum.

```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique course identifier
- `title`: Course title
- `slug`: URL-friendly course identifier
- `description`: Full course description
- `short_description`: Brief summary
- `image_url`: Course image
- `order_index`: Display order
- `is_published`: Publication status
- `is_active`: Active status
- `is_featured`: Featured course flag
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### menus

Navigation menu items.

```sql
CREATE TABLE menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_location TEXT NOT NULL CHECK (menu_location IN ('header', 'footer', 'mobile')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  parent_id UUID REFERENCES menus(id) ON DELETE CASCADE,
  target TEXT DEFAULT '_self',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique menu identifier
- `menu_location`: Menu location (header/footer/mobile)
- `title`: Display text
- `url`: Link destination
- `order_index`: Display order
- `parent_id`: Parent menu ID for nested items
- `target`: Link target (_self/_blank)
- `is_active`: Active status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### testimonials

Customer testimonials.

```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  quote TEXT NOT NULL,
  image_url TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique testimonial identifier
- `name`: Customer name
- `role`: Customer role/title
- `quote`: Testimonial text
- `image_url`: Customer image
- `video_url`: Video testimonial URL
- `order_index`: Display order
- `is_active`: Active status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### media

Media assets and files.

```sql
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  bucket TEXT,
  path TEXT,
  type TEXT,
  width INTEGER,
  height INTEGER,
  size INTEGER,
  alt_text TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique media identifier
- `url`: Media file URL
- `bucket`: Storage bucket name
- `path`: File path in storage
- `type`: Media type (image, video, document)
- `width`: Image width (pixels)
- `height`: Image height (pixels)
- `size`: File size (bytes)
- `alt_text`: Alternative text
- `caption`: Image caption
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

---

## Configuration Tables

### seo_metadata

SEO and meta tag information.

```sql
CREATE TABLE seo_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,
  canonical_url TEXT,
  noindex BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique SEO identifier
- `page_slug`: Associated page slug
- `meta_title`: Meta title tag
- `meta_description`: Meta description tag
- `og_title`: Open Graph title
- `og_description`: Open Graph description
- `og_image`: Open Graph image
- `twitter_title`: Twitter card title
- `twitter_description`: Twitter card description
- `twitter_image`: Twitter card image
- `canonical_url`: Canonical URL
- `noindex`: No-index flag
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### site_settings

Global site configuration.

```sql
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT,
  logo TEXT,
  favicon TEXT,
  contact_email TEXT,
  phone_number TEXT,
  address TEXT,
  social_links JSONB,
  footer_content JSONB,
  announcement_bar JSONB,
  default_seo_title TEXT,
  default_seo_description TEXT,
  default_og_image TEXT,
  design_tokens JSONB,
  ui_copy JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Settings identifier (always 'default')
- `company_name`: Company name
- `logo`: Logo URL
- `favicon`: Favicon URL
- `contact_email`: Contact email
- `phone_number`: Contact phone
- `address`: Physical address
- `social_links`: Social media links (JSON)
- `footer_content`: Footer content (JSON)
- `announcement_bar`: Announcement bar settings (JSON)
- `default_seo_title`: Default SEO title
- `default_seo_description`: Default SEO description
- `default_og_image`: Default OG image
- `design_tokens`: Design tokens (JSON)
- `ui_copy`: UI copy text (JSON)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

---

## Enterprise Tables

### page_versions

Page version history for rollback.

```sql
CREATE TABLE page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_json JSONB,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  change_summary TEXT
);
```

**Columns:**
- `id`: Unique version identifier
- `page_id`: Parent page ID
- `version_number`: Version number
- `content_json`: Page content snapshot
- `seo_title`: SEO title snapshot
- `seo_description`: SEO description snapshot
- `status`: Status snapshot
- `created_by`: User who created version
- `created_at`: Creation timestamp
- `notes`: Version notes
- `change_summary`: Change description

### blog_versions

Blog version history.

```sql
CREATE TABLE blog_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT,
  content JSONB,
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  status TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  change_summary TEXT
);
```

**Columns:**
- `id`: Unique version identifier
- `blog_id`: Parent blog ID
- `version_number`: Version number
- `title`: Title snapshot
- `content`: Content snapshot
- `excerpt`: Excerpt snapshot
- `seo_title`: SEO title snapshot
- `seo_description`: SEO description snapshot
- `status`: Status snapshot
- `created_by`: User who created version
- `created_at`: Creation timestamp
- `notes`: Version notes
- `change_summary`: Change description

### activity_logs

User activity tracking.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  changes_before JSONB,
  changes_after JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique log identifier
- `user_id`: User who performed action
- `action_type`: Type of action (create, update, delete)
- `entity_type`: Type of entity (page, blog, etc.)
- `entity_id`: Entity identifier
- `changes_before`: State before change
- `changes_after`: State after change
- `ip_address`: User IP address
- `user_agent`: Browser user agent
- `created_at`: Timestamp

### scheduled_content

Content scheduling for automated publishing.

```sql
CREATE TABLE scheduled_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique schedule identifier
- `entity_type`: Type of entity (page, blog)
- `entity_id`: Entity identifier
- `scheduled_at`: Scheduled publish time
- `status`: Schedule status
- `published_at`: Actual publish time
- `error_message`: Error message if failed
- `created_at`: Creation timestamp

### health_scans

Site health tracking metrics.

```sql
CREATE TABLE health_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seo_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  link_score INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  security_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  issues JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Columns:**
- `id`: Unique scan identifier
- `scan_date`: Scan timestamp
- `seo_score`: SEO health score (0-100)
- `content_score`: Content health score (0-100)
- `link_score`: Link health score (0-100)
- `performance_score`: Performance score (0-100)
- `security_score`: Security score (0-100)
- `overall_score`: Overall health score (0-100)
- `issues`: JSON array of detected issues
- `created_at`: Creation timestamp

---

## Indexes

### Performance Indexes

```sql
-- Pages
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);
CREATE INDEX idx_pages_created_at ON pages(created_at DESC);

-- Sections
CREATE INDEX idx_sections_page_id ON sections(page_id);
CREATE INDEX idx_sections_order ON sections(page_id, order_index);

-- Blogs
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);

-- Menus
CREATE INDEX idx_menus_location ON menus(menu_location);
CREATE INDEX idx_menus_order ON menus(menu_location, order_index);

-- SEO Metadata
CREATE INDEX idx_seo_page_slug ON seo_metadata(page_slug);

-- Activity Logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Scheduled Content
CREATE INDEX idx_scheduled_scheduled_at ON scheduled_content(scheduled_at);
CREATE INDEX idx_scheduled_status ON scheduled_content(status);
```

---

## Relationships

### Entity Relationship Diagram

```
profiles (1) ----< (N) page_versions
profiles (1) ----< (N) blog_versions
profiles (1) ----< (N) activity_logs

pages (1) ----< (N) sections
pages (1) ----< (N) page_versions
pages (1) ----< (1) seo_metadata (via page_slug)

blogs (1) ----< (N) blog_versions

menus (1) ----< (N) menus (self-referencing for nested menus)
```

### Foreign Key Constraints

- `sections.page_id` → `pages.id` (CASCADE DELETE)
- `page_versions.page_id` → `pages.id` (CASCADE DELETE)
- `blog_versions.blog_id` → `blogs.id` (CASCADE DELETE)
- `menus.parent_id` → `menus.id` (CASCADE DELETE)
- `page_versions.created_by` → `profiles.id`
- `blog_versions.created_by` → `profiles.id`
- `activity_logs.user_id` → `profiles.id`

---

## Row-Level Security

### RLS Policies

All tables have Row-Level Security enabled with the following policies:

#### Public Access
- Published pages: SELECT for public
- Published blogs: SELECT for public
- Menus: SELECT for public (active items)
- Site settings: SELECT for public

#### Admin Access
- All tables: Full access for admins
- Uses `is_admin()` function for authorization

#### Example Policy

```sql
-- Pages: Public can read published pages
CREATE POLICY "pages_public_read"
ON pages FOR SELECT
TO public
USING (status = 'published');

-- Pages: Admins can do everything
CREATE POLICY "pages_admin_all"
ON pages FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
```

---

## Data Types

### JSONB Columns

Several tables use JSONB for flexible data storage:

- `sections.content_json`: Section-specific content
- `blogs.content`: Rich blog content
- `site_settings.social_links`: Social media links
- `site_settings.footer_content`: Footer structure
- `site_settings.design_tokens`: Design system tokens
- `site_settings.ui_copy`: UI text strings
- `activity_logs.changes_before`: Data before change
- `activity_logs.changes_after`: Data after change
- `health_scans.issues`: Array of health issues

### Enums (CHECK Constraints)

- `pages.status`: 'draft' | 'published'
- `blogs.status`: 'draft' | 'published'
- `profiles.role`: 'user' | 'admin' | 'editor'
- `menus.menu_location`: 'header' | 'footer' | 'mobile'
- `scheduled_content.status`: 'pending' | 'published' | 'failed'

---

## Conclusion

This database schema documentation provides a complete overview of the Acadvizen Headless CMS database structure. All tables are designed with proper indexing, relationships, and security policies for optimal performance and data integrity.

**Last Updated:** 2026-07-22  
**Version:** 1.0

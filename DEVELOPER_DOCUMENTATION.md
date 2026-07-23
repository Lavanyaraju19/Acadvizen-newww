# Acadvizen Headless CMS - Developer Documentation

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Target Audience:** Developers and Technical Teams

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Authentication](#authentication)
7. [Authorization](#authorization)
8. [Frontend Components](#frontend-components)
9. [Customization Guide](#customization-guide)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Architecture

The Acadvizen Headless CMS follows a modern architecture:

```
┌─────────────────┐
│   Next.js App   │ (Frontend - React/Next.js 14)
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   API Routes    │  │   Supabase DB   │ (PostgreSQL)
│   (Next.js)     │  │   (Backend)     │
└────────┬────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │ (Authentication)
└─────────────────┘
```

### Key Design Principles

1. **Headless Architecture:** Content management separated from presentation
2. **API-First:** All content accessible via REST API
3. **Type Safety:** TypeScript throughout
4. **Performance:** Server-side rendering with caching
5. **Security:** Row-level security (RLS) in database

---

## Tech Stack

### Frontend

- **Framework:** Next.js 14.2.35
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom components with Lucide icons
- **State Management:** React hooks (useState, useEffect)
- **Form Handling:** Custom form components
- **HTTP Client:** fetch API with adminApiClient wrapper

### Backend

- **Database:** PostgreSQL (via Supabase)
- **ORM:** Supabase Client
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Real-time:** Supabase Realtime (optional)

### Development Tools

- **Package Manager:** npm
- **Build Tool:** Next.js built-in
- **Linting:** ESLint
- **Type Checking:** TypeScript compiler
- **Version Control:** Git

---

## Project Structure

```
acadvizen-newww-main/
├── app/                          # Next.js app directory
│   ├── admin/                    # Admin panel
│   │   ├── pages/              # Page management
│   │   ├── blogs/              # Blog management
│   │   ├── courses/            # Course management
│   │   ├── media/              # Media management
│   │   ├── menus/              # Menu management
│   │   ├── settings/           # Site settings
│   │   └── ...                 # Other admin modules
│   ├── api/                     # API routes
│   │   ├── cms/                # CMS API endpoints
│   │   │   ├── pages/          # Pages API
│   │   │   ├── blogs/          # Blogs API
│   │   │   ├── menus/          # Menus API
│   │   │   ├── sections/       # Sections API
│   │   │   ├── seo/            # SEO API
│   │   │   ├── settings/       # Settings API
│   │   │   └── _utils.js       # API utilities
│   │   └── ...                 # Other API routes
│   ├── [slug]/                  # Dynamic page routes
│   ├── blog/                   # Blog routes
│   ├── courses/                # Course routes
│   └── page.tsx                # Root page
├── components/                  # Reusable components
│   ├── admin/                  # Admin-specific components
│   │   ├── VersionHistory.jsx
│   │   ├── GlobalSearch.jsx
│   │   ├── ScheduleContent.jsx
│   │   └── ...
│   └── ui/                     # UI components
├── lib/                         # Utility libraries
│   ├── adminApiClient.js       # API client wrapper
│   ├── autosave.js             # Autosave utility
│   ├── storageUpload.js        # File upload utility
│   └── ...
├── supabase/                    # Database migrations
│   └── migrations/             # SQL migration files
├── public/                      # Static assets
└── .env.local                   # Environment variables
```

---

## Database Schema

### Core Tables

#### pages
```sql
- id (uuid, primary key)
- title (text)
- slug (text, unique)
- description (text)
- seo_title (text)
- seo_description (text)
- status (text: 'draft' | 'published')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### sections
```sql
- id (uuid, primary key)
- page_id (uuid, references pages)
- type (text)
- content_json (jsonb)
- order_index (integer)
- visibility (boolean)
- created_at (timestamptz)
```

#### blogs
```sql
- id (uuid, primary key)
- title (text)
- slug (text, unique)
- content (jsonb)
- excerpt (text)
- author (text)
- featured_image (text)
- status (text: 'draft' | 'published')
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### menus
```sql
- id (uuid, primary key)
- menu_location (text: 'header' | 'footer')
- title (text)
- url (text)
- order_index (integer)
- parent_id (uuid, references menus)
- target (text)
- is_active (boolean)
```

#### seo_metadata
```sql
- id (uuid, primary key)
- page_slug (text)
- meta_title (text)
- meta_description (text)
- og_title (text)
- og_description (text)
- og_image (text)
- canonical_url (text)
- noindex (boolean)
```

#### site_settings
```sql
- id (text, primary key: 'default')
- company_name (text)
- logo (text)
- favicon (text)
- contact_email (text)
- phone_number (text)
- address (text)
- social_links (jsonb)
- footer_content (jsonb)
- announcement_bar (jsonb)
- design_tokens (jsonb)
- ui_copy (jsonb)
```

### Enterprise Tables

#### page_versions
```sql
- id (uuid, primary key)
- page_id (uuid, references pages)
- version_number (integer)
- content_json (jsonb)
- seo_title (text)
- seo_description (text)
- status (text)
- created_by (uuid, references profiles)
- created_at (timestamptz)
- notes (text)
- change_summary (text)
```

#### activity_logs
```sql
- id (uuid, primary key)
- user_id (uuid, references profiles)
- action_type (text)
- entity_type (text)
- entity_id (uuid)
- changes_before (jsonb)
- changes_after (jsonb)
- ip_address (text)
- user_agent (text)
- created_at (timestamptz)
```

#### scheduled_content
```sql
- id (uuid, primary key)
- entity_type (text)
- entity_id (uuid)
- scheduled_at (timestamptz)
- status (text: 'pending' | 'published' | 'failed')
- published_at (timestamptz)
- error_message (text)
```

---

## API Reference

### Authentication

All admin API routes require authentication. Include the session token in the request header:

```javascript
headers: {
  'Authorization': `Bearer ${session_token}`
}
```

### Pages API

#### GET /api/cms/pages
Retrieve all pages (published by default)

```javascript
// Query parameters:
// - include_drafts: '1' to include draft pages (admin only)
// - slug: filter by slug
// - id: filter by id
// - include_sections: '1' to include page sections
// - limit: maximum number of results (default: 100)

GET /api/cms/pages?include_drafts=1&include_sections=1
```

#### POST /api/cms/pages
Create or update a page

```javascript
POST /api/cms/pages
Content-Type: application/json

{
  "id": "uuid", // optional for updates
  "title": "Page Title",
  "slug": "page-title",
  "description": "Page description",
  "seo_title": "SEO Title",
  "seo_description": "SEO Description",
  "status": "published" // or "draft"
}
```

#### DELETE /api/cms/pages/[id]
Delete a page

```javascript
DELETE /api/cms/pages/{page_id}
```

### Blogs API

#### GET /api/cms/blogs
Retrieve all blog posts

```javascript
GET /api/cms/blogs?include_drafts=1
```

#### POST /api/cms/blogs
Create or update a blog post

```javascript
POST /api/cms/blogs
Content-Type: application/json

{
  "id": "uuid", // optional for updates
  "title": "Blog Title",
  "slug": "blog-title",
  "content": { /* rich content */ },
  "excerpt": "Blog excerpt",
  "author": "Author Name",
  "featured_image": "image_url",
  "status": "published"
}
```

### Menus API

#### GET /api/cms/menus
Retrieve menu items

```javascript
// Query parameters:
// - location: 'header' | 'footer'
// - include_inactive: '1' to include inactive items

GET /api/cms/menus?location=header
```

#### POST /api/cms/menus
Create or update a menu item

```javascript
POST /api/cms/menus
Content-Type: application/json

{
  "id": "uuid", // optional for updates
  "menu_location": "header",
  "title": "Menu Item",
  "url": "/page",
  "order_index": 1,
  "parent_id": "uuid", // optional for nested items
  "target": "_self",
  "is_active": true
}
```

### SEO API

#### GET /api/cms/seo
Retrieve SEO metadata

```javascript
// Query parameters:
// - page_slug: filter by page slug

GET /api/cms/seo?page_slug=home
```

#### POST /api/cms/seo
Create or update SEO metadata

```javascript
POST /api/cms/seo
Content-Type: application/json

{
  "page_slug": "home",
  "meta_title": "Page Title",
  "meta_description": "Page description",
  "og_title": "OG Title",
  "og_description": "OG Description",
  "og_image": "image_url",
  "canonical_url": "https://example.com",
  "noindex": false
}
```

### Settings API

#### GET /api/cms/settings
Retrieve site settings

```javascript
GET /api/cms/settings
```

#### PUT /api/cms/settings
Update site settings

```javascript
PUT /api/cms/settings
Content-Type: application/json

{
  "company_name": "Company Name",
  "logo": "logo_url",
  "contact_email": "email@example.com",
  "phone_number": "+1234567890",
  "social_links": {
    "twitter": "https://twitter.com/example",
    "linkedin": "https://linkedin.com/example"
  }
}
```

---

## Authentication

### Supabase Auth Integration

The CMS uses Supabase Auth for authentication:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Session Management

Sessions are managed via HTTP-only cookies:

```javascript
// Middleware for session validation
export async function middleware(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }
  
  return NextResponse.next()
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

The CMS implements RBAC through database policies:

```sql
-- Check if user is admin
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
```

### Row-Level Security (RLS)

Database tables are protected with RLS policies:

```sql
-- Example: Pages table RLS
alter table public.pages enable row level security;

-- Admins can do everything
create policy "pages_admin_all"
on public.pages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Public can read published pages
create policy "pages_public_read"
on public.pages for select
to public
using (status = 'published');
```

---

## Frontend Components

### PageBuilderClient

Main component for page editing:

```javascript
import PageBuilderClient from './PageBuilderClient'

export default function Page() {
  return <PageBuilderClient />
}
```

Features:
- Drag-and-drop section ordering
- Real-time preview
- Autosave integration
- Version history access

### VersionHistory

Component for viewing and restoring content versions:

```javascript
import VersionHistory from '@/components/admin/VersionHistory'

<VersionHistory 
  entityType="page"
  entityId={pageId}
  onRestore={() => refreshPage()}
/>
```

### GlobalSearch

Search component for content discovery:

```javascript
import GlobalSearch from '@/components/admin/GlobalSearch'

<GlobalSearch />
```

Keyboard shortcut: `Ctrl+K` / `Cmd+K`

---

## Customization Guide

### Adding New Section Types

1. Create section component in `components/sections/`
2. Add section type to section registry
3. Update section builder UI
4. Add section API endpoint if needed

Example:

```javascript
// components/sections/CustomSection.jsx
export default function CustomSection({ content, onUpdate }) {
  return (
    <div className="custom-section">
      <h2>{content.heading}</h2>
      <p>{content.text}</p>
    </div>
  )
}
```

### Adding New Content Types

1. Create database table
2. Create API routes
3. Create admin UI components
4. Add to navigation menu

### Custom Styling

Modify Tailwind configuration in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#14b8a6',
        secondary: '#6366f1',
      }
    }
  }
}
```

### Custom API Endpoints

Create new API routes in `app/api/`:

```javascript
// app/api/custom/route.js
export async function GET(request) {
  const { supabase } = getSupabaseClientOrResponse(request)
  const { data } = await supabase.from('custom_table').select('*')
  return jsonOk(data)
}
```

---

## Deployment

### Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Production Build

```bash
npm run build
```

### Production Start

```bash
npm start
```

### Deployment Platforms

#### Vercel

```bash
vercel --prod
```

#### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Self-Hosted

```bash
npm run build
npm start
```

---

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
node e2e-test-framework.js
node test-additional-modules.js
```

### Manual Testing Checklist

- [ ] All CRUD operations work
- [ ] Publishing updates frontend immediately
- [ ] Autosave is functioning
- [ ] Version history accessible
- [ ] Global search works
- [ ] Media uploads work
- [ ] SEO metadata renders correctly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] No hydration errors

---

## Troubleshooting

### Common Issues

#### Build Errors

**Problem:** Build fails with module not found

**Solution:** Check import paths in API routes

#### Database Connection Errors

**Problem:** Cannot connect to Supabase

**Solution:** Verify environment variables and network connectivity

#### Authentication Failures

**Problem:** Users cannot log in

**Solution:** Check Supabase Auth configuration and RLS policies

#### Cache Issues

**Problem:** Changes not reflecting immediately

**Solution:** Check revalidation logic and cache headers

### Debug Mode

Enable debug mode in development:

```env
DEBUG=*
```

### Logging

Check logs in:

- Browser console (frontend errors)
- Server logs (API errors)
- Supabase dashboard (database errors)

---

## Support

### Documentation

- Administrator Manual: Non-technical user guide
- API Documentation: API reference
- Database Schema: Database structure

### Resources

- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- Tailwind CSS Documentation: https://tailwindcss.com/docs

### Community

- GitHub Issues: Report bugs and feature requests
- Discussion Forum: Community support

---

## Conclusion

This developer documentation provides the technical foundation for working with the Acadvizen Headless CMS. For specific implementation details, refer to the source code and inline comments.

**Last Updated:** 2026-07-22  
**Version:** 1.0

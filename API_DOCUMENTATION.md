# Acadvizen Headless CMS - API Documentation

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Base URL:** `https://your-domain.com/api`

---

## Authentication

All admin API endpoints require authentication. Include the session token in the Authorization header:

```http
Authorization: Bearer <session_token>
```

---

## Pages API

### GET /api/cms/pages

Retrieve pages with optional filtering.

**Query Parameters:**
- `include_drafts` (string, optional): Set to '1' to include draft pages (admin only)
- `slug` (string, optional): Filter by page slug
- `id` (string, optional): Filter by page ID
- `include_sections` (string, optional): Set to '1' to include page sections
- `limit` (integer, optional): Maximum results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Page Title",
      "slug": "page-title",
      "description": "Page description",
      "seo_title": "SEO Title",
      "seo_description": "SEO Description",
      "status": "published",
      "created_at": "2026-07-22T00:00:00Z",
      "updated_at": "2026-07-22T00:00:00Z",
      "sections": []
    }
  ]
}
```

### POST /api/cms/pages

Create or update a page.

**Request Body:**
```json
{
  "id": "uuid", // optional for updates
  "title": "Page Title",
  "slug": "page-title",
  "description": "Page description",
  "seo_title": "SEO Title",
  "seo_description": "SEO Description",
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Page Title",
    "slug": "page-title",
    ...
  }
}
```

### DELETE /api/cms/pages/[id]

Delete a page.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid"
  }
}
```

---

## Blogs API

### GET /api/cms/blogs

Retrieve blog posts.

**Query Parameters:**
- `include_drafts` (string, optional): Set to '1' to include draft posts
- `slug` (string, optional): Filter by slug
- `id` (string, optional): Filter by ID
- `limit` (integer, optional): Maximum results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "slug": "blog-title",
      "content": {},
      "excerpt": "Blog excerpt",
      "author": "Author Name",
      "featured_image": "image_url",
      "status": "published",
      "created_at": "2026-07-22T00:00:00Z",
      "updated_at": "2026-07-22T00:00:00Z"
    }
  ]
}
```

### POST /api/cms/blogs

Create or update a blog post.

**Request Body:**
```json
{
  "id": "uuid", // optional for updates
  "title": "Blog Title",
  "slug": "blog-title",
  "content": {},
  "excerpt": "Blog excerpt",
  "author": "Author Name",
  "featured_image": "image_url",
  "status": "published"
}
```

### DELETE /api/cms/blogs/[id]

Delete a blog post.

---

## Menus API

### GET /api/cms/menus

Retrieve menu items.

**Query Parameters:**
- `location` (string, optional): Filter by location (header/footer/mobile)
- `include_inactive` (string, optional): Set to '1' to include inactive items
- `limit` (integer, optional): Maximum results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "menu_location": "header",
      "title": "Menu Item",
      "url": "/page",
      "order_index": 1,
      "parent_id": null,
      "target": "_self",
      "is_active": true,
      "created_at": "2026-07-22T00:00:00Z",
      "updated_at": "2026-07-22T00:00:00Z"
    }
  ]
}
```

### POST /api/cms/menus

Create or update a menu item.

**Request Body:**
```json
{
  "id": "uuid", // optional for updates
  "menu_location": "header",
  "title": "Menu Item",
  "url": "/page",
  "order_index": 1,
  "parent_id": null,
  "target": "_self",
  "is_active": true
}
```

### DELETE /api/cms/menus/[id]

Delete a menu item.

---

## Sections API

### GET /api/cms/sections

Retrieve sections.

**Query Parameters:**
- `page_id` (string, optional): Filter by page ID
- `page_slug` (string, optional): Filter by page slug

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "page_id": "uuid",
      "type": "hero",
      "content_json": {},
      "order_index": 0,
      "visibility": true,
      "created_at": "2026-07-22T00:00:00Z",
      "updated_at": "2026-07-22T00:00:00Z"
    }
  ]
}
```

### POST /api/cms/sections

Create or update a section.

**Request Body:**
```json
{
  "id": "uuid", // optional for updates
  "page_id": "uuid",
  "type": "hero",
  "content_json": {},
  "order_index": 0,
  "visibility": true
}
```

### DELETE /api/cms/sections/[id]

Delete a section.

---

## SEO API

### GET /api/cms/seo

Retrieve SEO metadata.

**Query Parameters:**
- `page_slug` (string, optional): Filter by page slug

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "page_slug": "home",
      "meta_title": "Page Title",
      "meta_description": "Page description",
      "og_title": "OG Title",
      "og_description": "OG Description",
      "og_image": "image_url",
      "canonical_url": "https://example.com",
      "noindex": false,
      "created_at": "2026-07-22T00:00:00Z",
      "updated_at": "2026-07-22T00:00:00Z"
    }
  ]
}
```

### POST /api/cms/seo

Create or update SEO metadata.

**Request Body:**
```json
{
  "id": "uuid", // optional for updates
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

### DELETE /api/cms/seo/[id]

Delete SEO metadata.

---

## Settings API

### GET /api/cms/settings

Retrieve site settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "default",
    "company_name": "Company Name",
    "logo": "logo_url",
    "favicon": "favicon_url",
    "contact_email": "email@example.com",
    "phone_number": "+1234567890",
    "address": "Address",
    "social_links": {},
    "footer_content": {},
    "announcement_bar": {},
    "design_tokens": {},
    "ui_copy": {}
  }
}
```

### PUT /api/cms/settings

Update site settings.

**Request Body:**
```json
{
  "company_name": "Company Name",
  "logo": "logo_url",
  "contact_email": "email@example.com",
  "phone_number": "+1234567890",
  "social_links": {
    "twitter": "https://twitter.com/example"
  }
}
```

---

## Version History API

### GET /api/cms/pages/[id]/versions

Get page version history.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "page_id": "uuid",
      "version_number": 1,
      "content_json": {},
      "seo_title": "Title",
      "seo_description": "Description",
      "status": "published",
      "created_by": "uuid",
      "created_at": "2026-07-22T00:00:00Z",
      "notes": "Version notes",
      "change_summary": "Change description"
    }
  ]
}
```

### POST /api/cms/pages/[id]/versions/[versionId]/restore

Restore a page version.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Restored Title",
    ...
  }
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "data": null
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Public endpoints: 100 requests/minute
- Admin endpoints: 1000 requests/minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

---

## Conclusion

This API documentation provides complete reference for all Acadvizen Headless CMS API endpoints. For implementation details, refer to the source code in `app/api/cms/`.

**Last Updated:** 2026-07-22  
**Version:** 1.0

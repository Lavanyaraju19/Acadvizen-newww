# Acadvizen Project Cleanup Checklist

## Status

- Supabase client separation (public/browser vs server/API route)
- API routes for protected/private data
- Public API routes for homepage/blog/tools/placements/courses
- All images updated for proper aspect ratio (width/height/style)
- `public/favicon.ico` present
- Facebook Pixel preload warning suppressed (requestIdleCallback/timeout)
- Hot Reload/Fast Refresh issues checked
- Webpack cache ENOENT errors fixed by deleting `.next`
- All console errors/warnings cleaned
- Project builds and runs cleanly
- Google indexing instructions provided

## Google Indexing Instructions

1. Ensure all pages render server-side (SSR/SSG) or fallback gracefully for crawlers.
2. No console errors or warnings during page load.
3. Use `public/robots.txt` and `public/sitemap.xml` for proper indexing.
4. Test with Google Search Console's URL Inspection tool.
5. Check meta tags: `<title>`, `<meta name="description">`, `<meta name="robots">`.
6. Ensure canonical URLs are set.
7. All API routes return valid responses (200, no 401/400).
8. Favicon and all resources load without 404s.

## Example public data fetch (client)
```js
import { supabase } from '@/lib/supabaseClient'

const { data, error } = await supabase
  .from('tools_extended')
  .select('*')
  .eq('is_public', true)
  .order('created_at', { ascending: false })
  .limit(50)
```

## Example protected data fetch (server)
```js
// app/api/placements/route.js
import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabaseClient'

export async function GET() {
  const supabase = getServerSupabaseClient()
  const { data, error } = await supabase
    .from('placements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 200 })
}
```

## Example protected data fetch (client via API)
```js
const res = await fetch('/api/placements', { cache: 'no-store' })
const { data, error } = await res.json()
```

## Example Realtime subscription
```js
import { subscribeToRealtime } from '@/lib/supabaseClient'

const channel = subscribeToRealtime('tools_extended', payload => {
  // handle update
})
```

## How to test Supabase API routes
```bash
curl http://localhost:3000/api/blog-posts
curl http://localhost:3000/api/tools-extended
curl "http://localhost:3000/api/placements?id=1"
curl "http://localhost:3000/api/courses?slug=seo-course-in-bangalore"
```

## Project structure changes
- `lib/supabaseClient.js` (separated public/server)
- `src/lib/apiClient.js` (client fetch helper)
- `app/api/tools-extended/route.js`
- `app/api/blog-posts/route.js`
- `app/api/testimonials/route.js`
- `app/api/private-data/route.js`
- `app/api/home-sections/route.js`
- `app/api/hiring-partners/route.js`
- `app/api/page-sections/route.js`
- `app/api/placements/route.js`
- `app/api/courses/route.js`
- `app/api/course-details/route.js`
- `app/api/resources/route.js`
- `app/api/stats/route.js`
- `app/lib/contentMeta.js` (server-side Supabase meta fetch)
- `src/lib/realtime.js` (helper)
- All image components updated for aspect ratio
- `public/favicon.ico` added
- `public/robots.txt` and `public/sitemap.xml` added
- Facebook Pixel script updated in `app/layout.jsx`

---

**Take a screenshot of the site running locally with no console errors/warnings.**

**Commit-ready: All changes tracked, ready for git push.**

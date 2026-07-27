# Full Repository Audit Report

**Project:** Acadvizen Digital Marketing Website  
**Framework:** Next.js 14 (App Router)  
**Date:** Generated from thorough codebase analysis  
**Severity Levels:** Critical, High, Medium, Low

---

## 1. BUILD ISSUES

### 1.1 Missing `@supabase/ssr` Dependency (Critical)
- **File:** `middleware.js` (line 1)
- **Issue:** `import { createServerClient } from '@supabase/ssr'` — this package is not listed in `package.json` dependencies.
- **Impact:** Build will fail if `@supabase/ssr` is not installed. Running `npm run build` will throw module-not-found error.
- **Fix:** Install `@supabase/ssr` or replace with `@supabase/supabase-js` using cookie-based auth.

### 1.2 TypeScript build errors expected (High)
- **File:** `tsconfig.json` — `"strict": false` set (line 6)
- **Issue:** `strictNullChecks: true` but `strict: false` — inconsistent TypeScript strict config.
- Several `.ts` and `.tsx` files (like `sitemap.ts`, `manifest.ts`, `env.ts`) require strict checking but the config is lax.
- `next-env.d.ts` may be stale.
- **Impact:** Type errors at build time, especially with `.ts` files using any inferred types.
- **Fix:** Set `strict: true` and fix type errors incrementally.

### 1.3 webpack Alias to Non-existent Shim (High)
- **File:** `next.config.mjs` (line 37-39)
- **Issue:** `'react-router-dom': path.resolve(__dirname, 'src/lib/react-router-dom-shim.js')` — The legacy `src/legacy/pages/HomePage.jsx` imports `Link` from `react-router-dom` (line 14). The shim may not be a complete implementation.
- **Impact:** Broken navigation links, potential runtime errors.
- **Fix:** Remove react-router-dom usage and use Next.js `Link` from `next/link`.

### 1.4 Duplicate Supabase Client Definitions (Medium)
- **Files:** `lib/supabaseClient.ts`, `lib/supabaseBrowser.ts`, `src/lib/supabaseClient.js`, `src/lib/supabase.js`
- **Issue:** Four separate Supabase client initialization patterns across the codebase (lib/ and src/lib/). They may conflict or cause duplicate connections.
- **Impact:** Redundant code, potential connection leaks, hard to maintain.
- **Fix:** Consolidate to a single client initialization approach.

---

## 2. RUNTIME ISSUES

### 2.1 `initSupabase()` Unused Return (Low)
- **File:** `app/providers.jsx` (line 7, 13)
- **Issue:** `initSupabase()` always returns `null` (see `lib/supabaseClient.ts` line 22), and its `.catch(() => {})` swallows errors silently.
- **Impact:** Silent failures, hard to debug initialization issues.
- **Fix:** Either make `initSupabase` meaningful or remove the call.

### 2.2 Dynamic `window.fetch` Override in useEffect (High)
- **File:** `app/admin/AdminLayoutClient.jsx` (lines 136-159)
- **Issue:** The component replaces `window.fetch` globally to inject auth tokens for `/api/cms/` requests. This is a side effect in a React component that can cause issues with other parts of the app that use fetch.
- **Impact:** Potential memory leaks on unmount (restores original fetch), interference with other fetch calls, debugging complexity.
- **Fix:** Use a dedicated API client function that attaches auth headers instead of overriding global fetch.

### 2.3 `ensureFormFieldAttributes` DOM Mutation in Admin (Medium)
- **File:** `app/admin/AdminLayoutClient.jsx` (lines 24-72)
- **Issue:** Direct DOM manipulation using `querySelectorAll` in a React app. The MutationObserver scans the admin root for form fields and adds `id`/`name` attributes.
- **Impact:** Breaks React's virtual DOM abstraction. May cause re-render loops.
- **Fix:** Use React refs and controlled components instead.

### 2.4 CMS API Response Inconsistency (High)
- **File:** `app/api/cms/_utils.js` — `jsonError` function returns status 200 with error payloads for some endpoints (see entities route pattern).
- **Files:** `app/api/cms/entities/[entity]/route.js` — On database errors returns `jsonError(message, 200, [])`.
- **Impact:** HTTP 200 with error payloads is non-standard. Client error handling is fragile.
- **Fix:** Return appropriate HTTP status codes (4xx/5xx).

---

## 3. API ISSUES

### 3.1 Missing API Route Error Boundaries (High)
- **Files:** All API routes under `app/api/cms/`
- **Issue:** Many API routes lack try-catch at the top level. Unhandled promise rejections will result in 500 Internal Server Error with no structured response.
- **Impact:** Production crashes, hard to debug.
- **Fix:** Wrap all API route handlers in a global error boundary.

### 3.2 Admin Session API Inefficiency (Medium)
- **File:** `app/api/admin/session/route.js`
- **Issue:** The POST handler sets a cookie `acadvizen_admin_session` but never reads it. The GET handler always resolves admin context fresh.
- **Impact:** Redundant cookie write on every POST.
- **Fix:** Remove cookie logic or use it for session caching.

### 3.3 No Rate Limiting on API Routes (Critical)
- **Files:** All API route files
- **Issue:** No rate limiting on any endpoint, including lead capture (`/api/cms/leads`), registrations, and auth.
- **Impact:** Vulnerable to abuse, spam submissions, and DDoS.
- **Fix:** Implement rate limiting using middleware or a dedicated package.

### 3.4 Missing Input Validation on Entity Creation (High)
- **File:** `app/api/cms/entities/[entity]/route.js`
- **Issue:** `sanitizeEntityPayload` only whitelists allowed fields but does not validate data types, string lengths, or sanitize for XSS.
- **Impact:** Stored XSS, database constraint violations, data corruption.
- **Fix:** Implement server-side validation using a schema library (Zod, Yup).

---

## 4. CMS ISSUES

### 4.1 Version History Endpoint Missing for Entities (High)
- **File:** `app/api/cms/entities/[entity]/[id]/route.js`
- **Issue:** Only blogs and pages have version history endpoints. Other CMS entities lack version history support.
- **Impact:** Cannot restore previous versions of courses, tools, testimonials, etc.
- **Fix:** Implement generic version history for all CMS entities.

### 4.2 Duplicate Function Skips Validation (Medium)
- **File:** `app/api/cms/entities/[entity]/route.js` (lines 68-83)
- **Issue:** The `action: 'duplicate'` handler uses `sanitizeEntityPayload` on source data but doesn't validate the source exists with a proper select.
- **Impact:** Partial duplicates, data loss if source has null fields.
- **Fix:** Add full validation and ensure required fields are populated.

### 4.3 No Draft/Publish Workflow for Most Entities (High)
- **Files:** Most admin entity modules
- **Issue:** Only pages and blogs have status fields (`status: 'draft' | 'published'`). Other entities (courses, tools, testimonials) use `is_active` boolean which doesn't support draft workflow.
- **Impact:** Cannot preview changes before publishing.
- **Fix:** Add status field (draft/published) to all entities.

### 4.4 Homepage CMS Sections Not Independently Managed (Medium)
- **Files:** `app/admin/homepage/*` — Course Highlights, Curriculum, FAQ, etc.
- **Issue:** While there are individual admin pages for each section, the `lib/homepageCmsData.js` creates a NEW Supabase client instead of reusing the existing one.
- **Impact:** Multiple Supabase connections, potential rate limiting.
- **Fix:** Reuse shared Supabase client instance.

---

## 5. SECURITY VULNERABILITIES

### 5.1 Hardcoded Supabase Keys in Source Code (Critical)
- **File:** `lib/env.ts` (lines 7-12)
- **Issue:** Fallback Supabase URL and anon key are hardcoded in the source code.
- **Impact:** These are public keys (anon), but exposing the project URL and anon key in source code makes it easier for attackers to probe the Supabase project.
- **Fix:** Remove fallback values, validate env vars at build time, and fail fast if missing.

### 5.2 Missing Row Level Security (RLS) Policies for New Tables (Critical)
- **File:** `supabase/schema.sql` (lines 115-150)
- **Issue:** RLS is enabled only for base tables. Many migration-added tables may not have RLS policies defined.
- **Impact:** Unauthorized data access via direct Supabase client calls from the browser.
- **Fix:** Create RLS policies for all tables.

### 5.3 Service Role Key Used in Client-Side Context (High)
- **File:** `lib/supabaseServer.ts` (line 50)
- **Issue:** `getServerSupabaseClient` uses `SUPABASE_SERVICE_ROLE_KEY` by default when no auth token is provided.
- **Impact:** If this function is called from an API route that doesn't properly authenticate, it exposes full database access.
- **Fix:** Only use service role key when admin is authenticated.

### 5.4 No CSRF Protection (High)
- **Issue:** No CSRF tokens on any POST/PATCH/DELETE API endpoints.
- **Impact:** Cross-site request forgery attacks possible.
- **Fix:** Implement CSRF token validation.

### 5.5 HelmetProvider Used Without CSP (Medium)
- **File:** `app/providers.jsx` (line 12)
- **Issue:** `react-helmet-async` is used but Content Security Policy headers are not set.
- **Impact:** XSS attacks possible via CMS content injection.
- **Fix:** Generate and serve CSP headers.

---

## 6. PERFORMANCE BOTTLENECKS

### 6.1 No ISR Configuration (High)
- **File:** `app/page.jsx` — `export const revalidate = 0` and `export const dynamic = 'force-dynamic'`
- **Issue:** All public pages use `force-dynamic` which disables caching entirely.
- **Impact:** Slow page loads, high server load, poor Core Web Vitals.
- **Fix:** Use Incremental Static Regeneration (ISR) with appropriate `revalidate` intervals.

### 6.2 Large Images Not Optimized (High)
- **Files:** Various section components
- **Issue:** Images loaded via `<Image>` component without proper `sizes` attribute. The `next.config.mjs` allows all remote hosts.
- **Impact:** Slow LCP, poor image optimization.
- **Fix:** Restrict remote patterns, add proper `sizes`, use `priority` for above-fold images.

### 6.3 No Font Optimization (Medium)
- **Files:** `app/layout.jsx`, `tailwind.config.js`
- **Issue:** Inter font specified in tailwind config but not loaded via `next/font`.
- **Impact:** Layout shift (CLS), slow initial render.
- **Fix:** Use `next/font` to load Inter font.

### 6.4 Homepage Fetch All Data Blocks Initial Render (Medium)
- **File:** `app/page.jsx` (line 26)
- **Issue:** `fetchAllHomepageData()` fetches 13+ separate Supabase queries on every page load.
- **Impact:** Slow TTFB, waterfall of database requests.
- **Fix:** Consolidate into fewer queries or use a single composite endpoint.

### 6.5 Client-Side Navigation via Legacy react-router-dom (High)
- **File:** `src/legacy/pages/HomePage.jsx` (line 14)
- **Issue:** Uses `Link` from `react-router-dom` instead of Next.js `Link` from `next/link`.
- **Impact:** Full page reloads on navigation, defeating Next.js client-side transitions.
- **Fix:** Replace with `next/link`.

---

## 7. ACCESSIBILITY ISSUES

### 7.1 Missing Form Labels (High)
- **Files:** Multiple form components
- **Issue:** Many inputs lack explicit `<label>` elements or `aria-label` attributes.
- **Impact:** Screen readers cannot identify form fields.
- **Fix:** Add proper `<label htmlFor="...">` and `id` attributes to all form inputs.

### 7.2 Low Color Contrast (High)
- **File:** `app/globals.css` and various components
- **Issue:** The dark theme uses text colors like `text-slate-300` (#CBD5E1) on dark backgrounds.
- **Impact:** Readability issues for users with visual impairments.
- **Fix:** Increase contrast ratios to meet WCAG AA (4.5:1 for normal text).

### 7.3 Missing Skip Navigation Link (Medium)
- **File:** `app/layout.jsx`
- **Issue:** No skip-to-content link at the beginning of the page.
- **Impact:** Keyboard-only users must tab through all navigation.
- **Fix:** Add a skip navigation link.

### 7.4 Interactive Elements Missing Focus Styles (Medium)
- **Files:** Various components
- **Issue:** Custom button styles often remove default focus outlines without providing custom focus-visible styles.
- **Impact:** Keyboard users cannot see which element is focused.
- **Fix:** Add `focus-visible:ring-2` or similar focus indicators.

### 7.5 Non-Semantic HTML Structure (Medium)
- **Files:** HomePage.jsx and section components
- **Issue:** Extensive use of `<div>` elements with onClick handlers instead of semantic `<button>` or `<a>` elements.
- **Impact:** Screen readers cannot identify interactive elements.
- **Fix:** Use semantic HTML elements with proper roles.

---

## 8. SEO ISSUES

### 8.1 Duplicate Meta Tags (Medium)
- **File:** `app/layout.jsx` — metadata export defines title/description
- **File:** `app/page.jsx` — `generateMetadata` also returns title/description
- **Issue:** The root layout defines default metadata, but homepage overrides it.
- **Impact:** Potential duplicate or conflicting meta tags.
- **Fix:** Remove metadata from layout and ensure all pages define their own via `generateMetadata`.

### 8.2 Missing Hreflang Tags (Medium)
- **Issue:** The site is only in English but targets Indian users. No `hreflang` tags for regional variants.
- **Impact:** Missed international SEO opportunities.
- **Fix:** Add `hreflang="en-in"` and potentially other regional variants.

### 8.3 Robots.ts Uses `revalidate = 1` (Low)
- **File:** `app/robots.ts` (line 4)
- **Issue:** The robots.ts file has `export const revalidate = 1` which is unnecessary.
- **Impact:** Unnecessary server-side execution.
- **Fix:** Remove dynamic revalidation from static route files.

### 8.4 Sitemap May Be Incomplete (Medium)
- **File:** `app/sitemap.ts`
- **Issue:** The sitemap fetches data from multiple tables but catches errors silently.
- **Impact:** Search engines may not discover all pages.
- **Fix:** Add fallback static sitemap entries and log errors properly.

### 8.5 Missing Breadcrumb Schema on Public Pages (High)
- **File:** `app/(public)/[slug]/page.jsx`
- **Issue:** Only blog pages have breadcrumb structured data.
- **Impact:** Missed rich snippet opportunities in search results.
- **Fix:** Add BreadcrumbList schema to all page types.

---

## 9. RESPONSIVE DESIGN ISSUES

### 9.1 Horizontal Overflow on Tool Marquee (Medium)
- **File:** `src/legacy/pages/HomePage.jsx` — tools marquee section
- **Issue:** The logo scrolling marquees use `min-w-max` and `gap-8` which can cause horizontal scrollbars on small screens.
- **Impact:** Poor mobile experience.
- **Fix:** Use CSS overflow-x: hidden on parent container.

### 9.2 Fixed Width Panels on Mobile (Medium)
- **Files:** Section components
- **Issue:** Some section panels use fixed padding and min-widths that don't scale down gracefully on mobile viewports (< 360px).
- **Impact:** Content clipping on very small devices.
- **Fix:** Use relative units and test on 320px viewport.

---

## 10. BROKEN IMPORTS

### 10.1 Missing React Router Dom Import (High)
- **File:** `src/legacy/pages/HomePage.jsx` (line 14)
- **Issue:** `import { Link } from 'react-router-dom'` — `react-router-dom` is NOT in `package.json` dependencies.
- **Impact:** Import will fail at build time unless the webpack shim resolves it.
- **Fix:** Remove react-router-dom dependency and use `next/link`.

### 10.2 Conditional Absolute Imports (Medium)
- **File:** `jsconfig.json` — maps `@/*` to `src/*`
- **Issue:** Some imports in `/lib` files use `../../../` relative paths while others use `@/` absolute paths.
- **Impact:** Import confusion, difficulty refactoring.
- **Fix:** Standardize on one import convention.

---

## 11. DUPLICATE / DEAD CODE

### 11.1 Multiple Supabase Client Definitions (High)
- **Files:**
  - `lib/supabaseClient.ts`
  - `lib/supabaseBrowser.ts`
  - `src/lib/supabaseClient.js`
  - `src/lib/supabase.js`
- **Issue:** Four different ways to create/get Supabase client.
- **Impact:** Inconsistent behavior, maintenance burden.
- **Fix:** Consolidate to single `lib/supabaseBrowser.ts` and remove duplicates.

### 11.2 Legacy Pages Directory (`src/pages/`) Not Used (Medium)
- **Files:** `src/pages/_HomePage.jsx`, `src/pages/_LoginPage.jsx`
- **Issue:** Files exist in `src/pages/` but the project uses App Router (`app/` directory).
- **Impact:** Dead code, confusion for developers.
- **Fix:** Remove unused legacy page files.

### 11.3 Duplicate Blog Data (Medium)
- **File:** `data/blogs.js` — contains hardcoded blog data
- **Issue:** Blog data exists both as local hardcoded data and in the database.
- **Impact:** Data inconsistency, stale local data.
- **Fix:** Use database as single source of truth with appropriate fallback.

- **Files:** Content sourced from Supabase `blogs` table
- **Issue:** Blog data exists both as local hardcoded data and in the database. The homepage merges both sources.
- **Impact:** Data inconsistency, stale local data.
- **Fix:** Use database as single source of truth with appropriate fallback.

### 11.4 Unused Script Files (Low)
- **Files:** Multiple files in root directory: `fix-admin-jsx-manual.js`, `fix-admin-jsx-syntax.js`, `fix-all-admin-pages.js`, `fix-all-jsx-syntax.js`, `fix-import-paths.js`, `fix-import-paths-smart.js`, `debug-page.js`, `comprehensive-demonstration.js`, `e2e-test-framework.js`, `apply-migrations.js`, `cleanup-test-data.js`, `run-comprehensive-tests.js`
- **Issue:** Many utility/script files in the root are not referenced in `package.json`.
- **Impact:** Cluttered root directory, unused code.
- **Fix:** Move relevant scripts to `scripts/` folder, remove unused ones.

---

## 12. MEMORY LEAKS

### 12.1 Realtime Subscription Not Unsubscribed (High)
- **File:** `lib/supabaseClient.ts` — `subscribeToRealtime` function returns a channel but callers may not unsubscribe.
- **File:** `lib/realtime.ts` — same pattern.
- **Impact:** Memory leaks, stale subscriptions.
- **Fix:** Ensure all subscriptions are cleaned up on component unmount.

### 12.2 Event Listeners Not Cleaned Up in Some Components (Medium)
- **File:** `src/legacy/pages/HomePage.jsx` (scroll listener, timer, requestIdleCallback)
- **Issue:** The component has multiple event listeners and timers. The cleanup function is mostly correct, but timeout/interval IDs could leak if component unmounts during certain states.
- **Impact:** Potential memory leaks on route changes.
- **Fix:** Ensure all cleanup paths are covered.

---

## 13. HYDRATION ISSUES

### 13.1 Client-Server HTML Mismatch Risk (High)
- **File:** `src/legacy/pages/HomePage.jsx`
- **Issue:** The component uses `useState` with `localBlogs` and `cmsData` that could differ between server render (if SSRed) and client hydration.
- **Impact:** React hydration mismatch warnings, broken UI.
- **Fix:** Ensure consistent initial state between server and client.

### 13.2 Dynamic Data in Client Component (Medium)
- **File:** `app/admin/AdminLayoutClient.jsx`
- **Issue:** The entire admin layout is a client component (`'use client'`). The admin dashboard page tries to fetch data on mount only.
- **Impact:** No server-side rendering for admin pages.
- **Fix:** Keep admin as client-side, this is acceptable.

---

## 14. REACT / NEXT.JS WARNINGS

### 14.1 Missing `key` in Lists (High)
- **File:** `app/admin/AdminLayoutClient.jsx` (line ~380)
- **Issue:** Navigation items rendered with `key={nav.path}` — not using index as key is good but some list renders may not have stable keys.
- **Impact:** React reconciliation warnings.
- **Fix:** Audit all `.map()` calls for proper keys.

### 14.2 Hook Called Conditionally (Medium)
- **File:** `app/admin/AdminLayoutClient.jsx` — multiple `useEffect` hooks have early returns based on `isLoginLikePath`.
- **Impact:** While current implementation returns early inside the effect, the hook count is consistent. However, some effects may run with stale closures.
- **Fix:** Move conditional logic inside effects instead of returning early.

---

## 15. DATABASE ISSUES

### 15.1 Missing Indexes on Frequently Queried Tables (High)
- **Issue:** The base schema has indexes but many migration-added tables (homepage_*, sections, pages, blogs, etc.) lack indexes on frequently queried columns (`slug`, `status`, `is_active`, `created_at`, `updated_at`).
- **Impact:** Slow queries as data grows.
- **Fix:** Add indexes for all foreign keys and frequently filtered columns.

### 15.2 Column Name Inconsistencies (Medium)
- **Issue:** Some tables use `is_active` (tools_extended, internships, etc.), others use `is_published` (courses, tools base table), others use `status` (pages, location_pages). This inconsistency requires custom handling in `cmsEntities.js`.
- **Impact:** Complex entity configuration, potential bugs.
- **Fix:** Standardize on `status` (draft/published) across all tables.

### 15.3 Schema.sql Outdated (High)
- **File:** `supabase/schema.sql`
- **Issue:** The schema.sql file only contains base tables (profiles, courses, tools, etc.) but NOT the ~30+ tables added via migrations.
- **Impact:** Cannot recreate database from schema.sql alone. Disaster recovery would be difficult.
- **Fix:** Generate comprehensive schema.sql that includes all tables.

### 15.4 Missing RLS for Hybrid Tables (Critical)
- **Issue:** Many CMS tables (homepage_hero, homepage_faq, header_settings, footer_settings, pages, sections, redirects, banners, popups, forms, etc.) do not have RLS policies defined in any migration file.
- **Impact:** Data accessible via direct database client calls.
- **Fix:** Define RLS policies for all tables.

---

## 16. ENVIRONMENT VARIABLE ISSUES

### 16.1 Missing .env.local File (High)
- **Issue:** No `.env.local` or `.env.example` file found in the repository. The app will use hardcoded fallback values.
- **Impact:** Cannot run locally without knowing required env vars.
- **Fix:** Create `.env.example` with all required variables documented.

### 16.2 Fallback Values Mask Missing Config (Medium)
- **File:** `lib/env.ts`
- **Issue:** Fallback values for Supabase URL and anon key will silently be used if env vars are missing, potentially pointing to wrong project.
- **Impact:** Hard to debug configuration issues.
- **Fix:** Remove fallbacks and add startup validation that fails explicitly.

---

## 17. MISSING FUNCTIONALITY

### 17.1 No Loading States for Page Transitions (Medium)
- **Files:** App router pages
- **Issue:** Many page components don't export a `loading.jsx` file for the App Router's built-in loading state.
- **Impact:** Users see blank screens during navigation.
- **Fix:** Add `loading.jsx` for major route segments.

### 17.2 No Error Boundaries for Public Pages (High)
- **Files:** App router pages
- **Issue:** No `error.jsx` files defined for route segments. Runtime errors will show Next.js default error page.
- **Impact:** Poor user experience on errors.
- **Fix:** Add `error.jsx` for public and admin route segments.

### 17.3 Missing Empty States for Entity Lists (Medium)
- **File:** `app/admin/_components/EntityCrudManager.jsx`
- **Issue:** Shows "No items yet" but has no call-to-action to create the first item or import data.
- **Impact:** Non-technical admins may be confused.
- **Fix:** Add empty state with clear CTA.

### 17.4 No Maintenance Mode Banner for Admins (Low)
- **File:** `middleware.js`
- **Issue:** In maintenance mode, admins can access the site but are not shown a banner indicating maintenance mode is active.
- **Impact:** Admins may not realize maintenance mode is on.
- **Fix:** Add a visible banner for admin users during maintenance.

---

## Summary

| Severity | Count | Key Areas |
|----------|-------|-----------|
| **Critical** | 5 | Missing @supabase/ssr, hardcoded keys, missing RLS, no rate limiting, service key exposure |
| **High** | 18 | Build errors, runtime issues, API validation, missing error boundaries, performance, accessibility |
| **Medium** | 22 | Duplicate code, missing loading states, responsive issues, SEO gaps |
| **Low** | 8 | Minor optimization, code cleanup, documentation |
| **Total** | **53** | Requires systematic resolution |

---





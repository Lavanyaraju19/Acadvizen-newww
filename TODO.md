# Production Hardening - Prioritized Task List

## Audit Snapshot - 2026-07-28
- [x] Reviewed current Git status and confirmed an already-dirty worktree
- [x] Confirmed active stack is Next.js 14 App Router with mixed JS/TS and Supabase
- [x] Confirmed README is stale and still describes an old Vite/React Router architecture
- [x] Identified critical blockers in auth bootstrap, blog consistency, footer location links, FAQ rendering, and type-check readiness

## Priority 1 - Build and Runtime Blockers
- [x] Repair browser Supabase bootstrap so admin auth works when public env vars are missing from the bundle
- [x] Fix the current TypeScript blocker in `lib/rateLimiter.ts`
- [ ] Run `npm run build` to completion and fix remaining production build failures
- [ ] Run lint and capture real results

## Priority 2 - CMS to Public Consistency
- [x] Unify public blog visibility rules and shared published-blog fetching
- [x] Stop homepage latest-post logic from merging legacy fallback posts with CMS-published posts
- [x] Switch homepage FAQ rendering back to valid CMS-managed FAQ items when available
- [x] Fix footer location links so each label points to its own URL instead of a shared homepage/base URL
- [ ] Audit homepage section duplication root cause and remove any real duplicate rendering path

## Priority 3 - Security and Server Controls
- [x] Keep admin/session APIs on runtime-loaded browser auth instead of a frozen null client
- [ ] Review server-side permission coverage for key CMS write routes
- [ ] Standardize API success/error response shapes across critical CMS routes
- [ ] Verify no browser-exposed service-role usage remains

## Priority 4 - Production Verification
- [ ] Update production documentation to match the actual Next.js architecture
- [ ] Run responsive and smoke tests on the main public and admin routes
- [ ] Run E2E coverage for at least blog, homepage, and admin login flows
- [ ] Produce final readiness report with only command-backed claims


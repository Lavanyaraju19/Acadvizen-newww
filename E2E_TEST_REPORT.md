# End-to-End Test Report

**Generated:** 2026-07-23T10:34:27.269Z

## Summary

- **Total Tests:** 31
- **Passed:** 30
- **Failed:** 1
- **Warnings:** 0
- **Success Rate:** 96.8%

## Pages Module

Total: 3 | Passed: 2 | Failed: 1 | Warnings: 0

✅ Create Page
   - Page ID: 615fb01e-af5f-40b5-ab33-e23e67a64e14
✅ Database Persistence
   - Page saved to database
❌ API Retrieval
   - Status: 500

## Blogs Module

Total: 10 | Passed: 10 | Failed: 0 | Warnings: 0

✅ Create Blog
   - Blog ID: 32c461c4-8006-4069-8b6b-6ec5210edc27
✅ Database Persistence
   - Blog saved to database
✅ Update Blog
   - Blog updated successfully
✅ Publish Blog
   - Blog published
✅ Blog Listing
   - Blog appears in database
✅ Add SEO Metadata
   - SEO metadata added
✅ Duplicate Blog
   - Duplicate ID: c919f8f3-728a-4fbb-8a04-0a31b2e92e45
✅ Delete Blog
   - Blog moved to trash (draft status)
✅ Restore Blog
   - Blog restored
✅ Cleanup
   - Test data removed

## Menus Module

Total: 8 | Passed: 8 | Failed: 0 | Warnings: 0

✅ Create Menu Item
   - Menu ID: 83f502f0-3bea-4e65-962b-d518b470f1c4
✅ Database Persistence
   - Menu saved to database
✅ Update Menu
   - Menu updated successfully
✅ Menu API
   - Menu accessible via API
✅ Nested Menu
   - Child menu ID: 55496f53-c1f9-44c9-8acc-0cf3d1fd4315
✅ Delete Menu
   - Menu deleted
✅ Restore Menu
   - Menu restored
✅ Cleanup
   - Test data removed

## Cache Module

Total: 4 | Passed: 4 | Failed: 0 | Warnings: 0

✅ Create Test Page
   - Page ID: a278e1ba-5892-4fd5-bbac-454ccf71a6f1
✅ Initial Fetch
   - Page accessible
✅ Update Content
   - Content updated
✅ Cache Invalidation
   - Updated content visible immediately

## SEO Module

Total: 6 | Passed: 6 | Failed: 0 | Warnings: 0

✅ Create Test Page
   - Page ID: c2e56a60-78cc-4e80-830b-1e74dfd63893
✅ Add SEO Metadata
   - Comprehensive SEO metadata added
✅ Database SEO
   - SEO metadata in database
✅ API SEO
   - SEO accessible via API
✅ Frontend SEO
   - SEO metadata in HTML
✅ Update SEO
   - SEO metadata updated

## Failed Tests Summary

❌ [Pages] API Retrieval
   Details: Status: 500

## Final Status

❌ **1 TEST(S) FAILED** - System requires fixes before production


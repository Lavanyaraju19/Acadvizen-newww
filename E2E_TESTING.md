# E2E Testing Guide

## Prerequisites

Before running the E2E tests, ensure you have:

1. **Valid Admin Credentials**: Update the `.env` file with your actual admin credentials:
   ```
   ADMIN_EMAIL=your-admin-email@example.com
   ADMIN_PASSWORD=your-admin-password
   BASE_URL=http://localhost:3000
   ```

2. **Development Server**: The tests will automatically start the dev server, but make sure:
   - Node.js is installed
   - All dependencies are installed (`npm install`)
   - Supabase is accessible (check `.env.local`)

## Running the Tests

### Run All Tests (Headless)
```bash
npm run test:e2e
```

### Run Tests with UI (Interactive Mode)
```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode (Visible Browser)
```bash
npm run test:e2e:headed
```

### Run Specific Test File
```bash
npx playwright test e2e/admin-cms.spec.js
```

### Run Specific Test
```bash
npx playwright test -g "should create, edit, and delete course"
```

## Test Coverage

The E2E tests cover the following admin modules:

1. **Blog Taxonomy** - Authors, Categories, Tags
2. **Courses** - Course CRUD operations
3. **Tools** - Tool management
4. **Companies** - Company profiles
5. **Internships** - Internship listings
6. **Testimonials** - Student testimonials
7. **Media Library** - Media upload and management
8. **Trust & Conversion** - Success stories, placements, recruiters, etc.
9. **Landing SEO** - Cities, redirects, templates
10. **Leads** - Lead management and export
11. **LMS** - Modules and lessons
12. **SEO Settings** - SEO metadata management
13. **Website Settings** - Site settings and menu manager
14. **Pages** - Page builder and sections
15. **Navigation** - Cross-module navigation

## Test Features

Each test performs:
- ✅ Login to admin dashboard
- ✅ Create a new record
- ✅ Verify creation success message
- ✅ Edit the record
- ✅ Verify edit success message
- ✅ Refresh page and verify data persistence
- ✅ Delete the record
- ✅ Verify deletion success message
- ✅ Verify record removal

## Viewing Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Troubleshooting

### Tests Fail on Login
- Verify admin credentials in `.env` file
- Check if admin user exists in Supabase
- Ensure admin auth is working

### Tests Timeout
- Increase timeout in `playwright.config.js`
- Check if dev server starts correctly
- Verify Supabase connection

### Specific Module Tests Fail
- Check if the module route exists
- Verify database schema matches
- Check for JavaScript errors in browser console

## Updating Test Data

Test data uses timestamps to avoid conflicts. To change:
- Edit `testData` object in `e2e/admin-cms.spec.js`
- Update field names to match your schema
- Adjust selectors if UI changes

## Adding New Tests

To add tests for a new module:

1. Add test data to `testData` object
2. Create a new test.describe block
3. Use helper functions from `utils.js`:
   - `loginAdmin(page)` - Login to admin
   - `createRecord(page, entityName, fields)` - Create record
   - `editRecord(page, entityName, recordSelector, fields)` - Edit record
   - `deleteRecord(page, entityName, recordSelector)` - Delete record
   - `verifyRecordExists(page, recordSelector)` - Verify record exists
   - `verifyRecordNotExists(page, recordSelector)` - Verify record deleted

## CI/CD Integration

For CI/CD, set environment variables:
```bash
export ADMIN_EMAIL=ci-admin@example.com
export ADMIN_PASSWORD=ci-password
export BASE_URL=http://localhost:3000
npm run test:e2e
```

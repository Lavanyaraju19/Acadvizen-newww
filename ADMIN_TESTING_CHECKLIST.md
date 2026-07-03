# Acadvizen Admin CMS - Functional Testing Checklist

## Overview
This checklist provides step-by-step instructions for testing every admin module (except Blogs) to ensure full CRUD functionality, proper database persistence, and live website updates.

**Prerequisites:**
- Development server running (`npm run dev`)
- Admin access to Supabase database
- Browser with admin session authenticated

---

## 1. Blog Taxonomy Module
**Location:** `/admin/blog-taxonomy`

### Create Record
1. Navigate to `/admin/blog-taxonomy`
2. Click "New" button
3. Fill in fields:
   - Name: "Test Author"
   - Slug: (auto-generated as "test-author")
   - Description: "Test description for verification"
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in left sidebar list

### Edit Record
1. Click on the newly created record in sidebar
2. Change Name to "Test Author Updated"
3. Change Description to "Updated description"
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Changes persist in the form

### Delete Record
1. Select the record in sidebar
2. Click "Delete" button
3. Confirm deletion in dialog
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from sidebar list

### Database Verification
```sql
-- Check authors table
SELECT * FROM authors WHERE slug = 'test-author';

-- Check blog_categories table
SELECT * FROM blog_categories WHERE slug = 'test-category';

-- Check blog_tags table
SELECT * FROM blog_tags WHERE slug = 'test-tag';
```

### Live Website Verification
- Navigate to `/blog/author/test-author` (if record still exists)
- Verify author information displays correctly

### Possible Failure Points
- Invalid slug format (should be lowercase with hyphens)
- Duplicate slug values
- Empty required fields (name)

---

## 2. Courses Module
**Location:** `/admin/courses`

### Create Record
1. Navigate to `/admin/courses`
2. Click "New" button
3. Fill in fields:
   - Title: "Test Course"
   - Slug: (auto-generated as "test-course")
   - Description: "Test course description"
   - Short Description: "Short description"
   - Image URL: "https://example.com/image.jpg"
   - Thumbnail URL: "https://example.com/thumb.jpg"
   - PDF URL: "https://example.com/brochure.pdf"
   - Order Index: 10
   - Is Active: checked
   - Is Featured: checked
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in sidebar list

### Edit Record
1. Click on the course in sidebar
2. Change Title to "Test Course Updated"
3. Change Order Index to 20
4. Uncheck Is Featured
5. Click "Save"
6. **Expected:** Success message "Saved." appears
7. **Verify:** Changes persist

### Delete Record
1. Select the course in sidebar
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from list

### Database Verification
```sql
SELECT * FROM courses WHERE slug = 'test-course';
```

### Live Website Verification
- Navigate to `/courses/test-course` (if record exists)
- Verify course details display correctly
- Check if featured courses appear on homepage

### Possible Failure Points
- Duplicate slug
- Invalid URL formats
- Missing required fields (title, slug)

---

## 3. Tools Module
**Location:** `/admin/tools`

### Create Record
1. Navigate to `/admin/tools`
2. Click "New" button
3. Fill in fields:
   - Name: "Test Tool"
   - Slug: (auto-generated as "test-tool")
   - Category: "Testing"
   - Description: "Test tool description"
   - Logo URL: "https://example.com/logo.png"
   - Brand Color: "#00C4CC"
   - Website URL: "https://example.com"
   - Is Active: checked
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in sidebar

### Edit Record
1. Click on the tool in sidebar
2. Change Category to "Productivity"
3. Change Brand Color to "#FF642D"
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Changes persist

### Delete Record
1. Select the tool in sidebar
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from list

### Database Verification
```sql
SELECT * FROM tools_extended WHERE slug = 'test-tool';
```

### Live Website Verification
- Navigate to `/tools/test-tool` (if record exists)
- Verify tool details display correctly

### Possible Failure Points
- Invalid hex color code
- Invalid URL format
- Duplicate slug

---

## 4. Companies Module
**Location:** `/admin/companies`

### Create Record
1. Navigate to `/admin/companies`
2. Click "New" button
3. Fill in fields:
   - Company Name: "Test Company"
   - Company Logo: Upload image file or enter URL
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in sidebar

### Edit Record
1. Click on the company in sidebar
2. Change Company Name to "Test Company Updated"
3. Upload new logo file
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Changes persist

### Delete Record
1. Select the company in sidebar
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from list

### Database Verification
```sql
SELECT * FROM companies WHERE company_name = 'Test Company';
```

### Live Website Verification
- Check if company appears in hiring partners section
- Verify logo displays correctly

### Possible Failure Points
- Invalid image upload
- Empty company name
- Duplicate company name

---

## 5. Internships Module
**Location:** `/admin/internships`

### Create Record
1. Navigate to `/admin/internships`
2. Click "New" button
3. Fill in fields:
   - Company Name: "Test Company"
   - Role: "Digital Marketing Intern"
   - Description: "Test internship description"
   - Logo: Upload image file or enter URL
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in sidebar

### Edit Record
1. Click on the internship in sidebar
2. Change Role to "Social Media Intern"
3. Update Description
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Changes persist

### Delete Record
1. Select the internship in sidebar
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from list

### Database Verification
```sql
SELECT * FROM internships WHERE company_name = 'Test Company';
```

### Live Website Verification
- Navigate to internship listing page
- Verify internship details display correctly

### Possible Failure Points
- Empty required fields
- Invalid image upload
- Empty company name

---

## 6. Testimonials Module
**Location:** `/admin/testimonials`

### Create Record
1. Navigate to `/admin/testimonials`
2. Click "New" button
3. Fill in fields:
   - Name: "Test Student"
   - Role: "Marketing Manager"
   - Image URL: "https://example.com/photo.jpg" (or upload file)
   - Video URL: "https://youtube.com/watch?v=example"
   - Quote: "This is a test testimonial"
   - Order Index: 5
   - Is Active: checked
4. Click "Save"
5. **Expected:** Success message "Saved." appears
6. **Verify:** Record appears in sidebar

### Edit Record
1. Click on the testimonial in sidebar
2. Change Role to "Senior Marketing Manager"
3. Change Order Index to 10
4. Uncheck Is Active
5. Click "Save"
6. **Expected:** Success message "Saved." appears
7. **Verify:** Changes persist

### Delete Record
1. Select the testimonial in sidebar
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message "Deleted." appears
5. **Verify:** Record removed from list

### Database Verification
```sql
SELECT * FROM testimonials WHERE name = 'Test Student';
```

### Live Website Verification
- Navigate to `/testimonials` page
- Verify testimonial displays (if is_active = true)
- Verify video URL works if provided

### Possible Failure Points
- Invalid video URL format
- Invalid image upload
- Empty name field

---

## 7. Media Library Module
**Location:** `/admin/media`

### Upload Media
1. Navigate to `/admin/media`
2. Click "Upload New File"
3. Select an image file from your computer
4. Fill in:
   - Storage Folder: "site-assets"
   - Type: "image"
   - Description: "Test image"
5. Click "Save"
6. **Expected:** Success message appears
7. **Verify:** Image appears in media list

### Edit Media
1. Click on the media item
2. Change Description
3. Change Type if needed
4. Click "Save Changes"
5. **Expected:** Success message appears
6. **Verify:** Changes persist

### Delete Media
1. Select the media item
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Success message appears
5. **Verify:** Item removed from list

### Filter/Search
1. Use search bar to find media by name
2. Filter by file type (image, video, document)
3. **Expected:** Results filter correctly

### Database Verification
```sql
SELECT * FROM media WHERE description LIKE '%Test image%';
```

### Live Website Verification
- Use the uploaded media URL in other modules
- Verify image loads correctly on live site

### Possible Failure Points
- Invalid file type
- File size too large
- Bucket does not exist in Supabase Storage

---

## 8. Trust & Conversion Module
**Location:** `/admin/trust`

### Create Success Story
1. Navigate to `/admin/trust`
2. Find "Student Success Stories" section
3. Click "New" button in that section
4. Fill in fields:
   - Name: "Test Student"
   - Role: "Marketing Manager"
   - Company: "Test Company"
   - Summary: "Achieved great results"
   - Image URL: "https://example.com/photo.jpg"
   - Video URL: "https://youtube.com/watch?v=example"
   - Result Metric: "300% ROI"
   - Order Index: 1
   - Is Active: checked
5. Click "Save"
6. **Expected:** Success message appears
7. **Verify:** Record appears in list

### Edit/Delete Records
- Follow same pattern as other modules for edit/delete operations

### Test Other Sections
Repeat create/edit/delete for:
- Placement Records
- Hiring Partners (Recruiters)
- Instructor Profiles
- Industry Certifications
- Achievement Counters (Student Metrics)
- Trust Badges
- Events & Workshops (Community Events)
- Call-to-Action Blocks (CTA Blocks)

### Database Verification
```sql
-- Success stories
SELECT * FROM success_stories WHERE name = 'Test Student';

-- Placements
SELECT * FROM placements WHERE title LIKE '%Test%';

-- Recruiters
SELECT * FROM recruiters WHERE name LIKE '%Test%';

-- Instructors
SELECT * FROM instructors WHERE name LIKE '%Test%';

-- Certifications
SELECT * FROM certifications WHERE name LIKE '%Test%';

-- Student metrics
SELECT * FROM student_metrics WHERE label LIKE '%Test%';

-- Trust badges
SELECT * FROM trust_badges WHERE label LIKE '%Test%';

-- Community events
SELECT * FROM community_events WHERE title LIKE '%Test%';

-- CTA blocks
SELECT * FROM cta_blocks WHERE key LIKE '%test%';
```

### Live Website Verification
- Check homepage for success stories
- Check placement page for placement records
- Verify trust badges display
- Check events section for community events

### Possible Failure Points
- Invalid parent_id references
- Invalid order_index values
- Missing required fields

---

## 9. Landing SEO Module
**Location:** `/admin/landing-seo`

### Create Location Page
1. Navigate to `/admin/landing-seo`
2. Find "Target Locations" section
3. Click "New" button
4. Fill in fields:
   - Name: "Test City"
   - Slug: (auto-generated as "test-city")
   - State: "Karnataka"
   - Country: "India"
   - Meta Title: "Digital Marketing Course in Test City"
   - Meta Description: "Best digital marketing course in Test City"
   - Intro Text: "Learn digital marketing in Test City"
   - Highlights: JSON array of highlights
   - Is Active: checked
5. Click "Save"
6. **Expected:** Success message appears
7. **Verify:** Record appears in list

### Create Redirect
1. Find "URL Redirects" section
2. Click "New" button
3. Fill in fields:
   - From Path: "/old-page"
   - To Path: "/new-page"
   - Status Code: 301
   - Is Active: checked
4. Click "Save"
5. **Expected:** Success message appears
6. **Verify:** Redirect created

### Test Other Sections
Repeat create/edit/delete for:
- Landing Page Templates
- Location-Specific Landing Pages
- Reusable Content Blocks

### Database Verification
```sql
-- Cities
SELECT * FROM cities WHERE slug = 'test-city';

-- Location pages
SELECT * FROM location_pages WHERE slug LIKE '%test%';

-- Redirects
SELECT * FROM redirects WHERE from_path = '/old-page';

-- Reusable blocks
SELECT * FROM reusable_blocks WHERE name LIKE '%test%';

-- Page templates
SELECT * FROM page_templates WHERE slug LIKE '%test%';
```

### Live Website Verification
- Navigate to `/digital-marketing-course-in-test-city` (if city exists)
- Test redirect: visit `/old-page` should redirect to `/new-page`
- Verify reusable blocks display on pages

### Possible Failure Points
- Invalid slug format
- Duplicate slug
- Invalid status code (must be 301, 302, 307, 308)
- Invalid JSON format for highlights

---

## 10. Leads Module
**Location:** `/admin/leads`

### Test Search & Filter
1. Navigate to `/admin/leads`
2. Use search bar to search by name, email, phone, or page
3. **Expected:** Results filter by search term
4. Use status filter dropdown (All, New, Contacted, Qualified, Closed)
5. **Expected:** Results filter by status

### Export to CSV
1. Click "Export to CSV" button
2. **Expected:** CSV file downloads with all lead data
3. **Verify:** CSV opens correctly with all columns

### Update Lead Status
1. Click on a lead record
2. Change status from "New" to "Contacted"
3. Click "Save"
4. **Expected:** Status updated successfully
5. **Verify:** Status change persists

### Delete Lead
1. Select a lead record
2. Click "Delete" button
3. Confirm deletion
4. **Expected:** Lead deleted successfully
5. **Verify:** Lead removed from list

### Database Verification
```sql
SELECT * FROM leads WHERE status = 'contacted';
```

### Live Website Verification
- Submit a lead form on the live website
- Verify lead appears in admin panel
- Test lead status updates

### Possible Failure Points
- CSV export fails with large datasets
- Invalid status values
- Lead deletion doesn't cascade to related data

---

## 11. LMS Module
**Location:** `/admin/lms`

### Create Module
1. Navigate to `/admin/lms`
2. Find "Course Modules" section
3. Click "New" button
4. Fill in fields:
   - Course ID: (select from dropdown or enter UUID)
   - Title: "Test Module"
   - Description: "Test module description"
   - Order Index: 1
5. Click "Save"
6. **Expected:** Success message appears
7. **Verify:** Module appears in list

### Create Lesson
1. Find "Lesson Content" section
2. Click "New" button
3. Fill in fields:
   - Module ID: (select from dropdown or enter UUID)
   - Title: "Test Lesson"
   - Content: "Test lesson content"
   - File URL: "https://example.com/lesson.pdf"
   - Order Index: 1
4. Click "Save"
5. **Expected:** Success message appears
6. **Verify:** Lesson appears in list

### Edit/Delete Records
- Follow same pattern for edit/delete operations

### Database Verification
```sql
-- Modules
SELECT * FROM lms_modules WHERE title = 'Test Module';

-- Lessons
SELECT * FROM lms_lessons WHERE title = 'Test Lesson';
```

### Live Website Verification
- Access LMS student portal
- Verify modules and lessons display correctly
- Test lesson file downloads

### Possible Failure Points
- Invalid course_id reference
- Invalid module_id reference
- Invalid file URL
- Order index conflicts

---

## 12. SEO Settings Module
**Location:** `/admin/seo`

### Create SEO Record
1. Navigate to `/admin/seo`
2. Click "New" button
3. Fill in fields from each section:

**Basic SEO:**
- Page Slug: "test-page"
- Google Search Title: "Test Page - Acadvizen"
- Meta Description: "Test page description"

**Social Media SEO:**
- Facebook/LinkedIn Title: "Test Page"
- Facebook/LinkedIn Description: "Test description"
- Social Media Image: "https://example.com/og-image.jpg"
- Twitter Title: "Test Page"
- Twitter Description: "Test description"
- Twitter Image: "https://example.com/twitter-image.jpg"

**Advanced SEO Settings:**
- Canonical URL: "https://acadvizen.com/test-page"
- Hide from Search Engines: unchecked
- Structured Data (Schema.org JSON): `{"@type":"WebPage","name":"Test Page"}`

4. Click "Save"
5. **Expected:** Success message appears
6. **Verify:** Record appears in list

### Edit/Delete Records
- Follow same pattern for edit/delete operations

### Database Verification
```sql
SELECT * FROM seo_metadata WHERE page_slug = 'test-page';
```

### Live Website Verification
- Navigate to the page with the slug
- View page source and verify meta tags
- Test Open Graph preview on Facebook
- Test Twitter Card preview
- Verify structured data with Google Rich Results Test

### Possible Failure Points
- Invalid JSON format for structured data
- Invalid URL format
- Duplicate page slug
- Invalid image URLs

---

## 13. Website Settings Module
**Location:** `/admin/settings`

### Test Branding Section
1. Navigate to `/admin/settings`
2. Find "Branding & Contact Information" section
3. Update fields:
   - Logo URL: "https://example.com/logo.png"
   - Favicon URL: "https://example.com/favicon.ico"
   - Company Name: "Test Company"
   - Contact Email: "test@example.com"
   - Phone Number: "+91 9876543210"
   - Address: "Test Address"
   - Announcement Banner: "Test announcement"
   - Footer Content: "Test footer"
4. Click "Save Settings"
5. **Expected:** Success message "Settings saved." appears
6. **Verify:** Changes persist after page refresh

### Test Social Media Section
1. Find "Social Media Links" section
2. Update social media URLs
3. Click "Save Settings"
4. **Expected:** Success message appears
5. **Verify:** Changes persist

### Test Design Section
1. Find "Website Design & Colors" section
2. Update primary color, secondary color, fonts
3. Click "Save Settings"
4. **Expected:** Success message appears
5. **Verify:** Changes persist

### Test SEO Defaults Section
1. Find "Search Engine Optimization (SEO)" section
2. Update default SEO settings
3. Click "Save Settings"
4. **Expected:** Success message appears
5. **Verify:** Changes persist

### Test UI Copy Section
1. Find "Website Text Labels" section
2. Update navigation labels, button labels, footer labels
3. Click "Save Settings"
4. **Expected:** Success message appears
5. **Verify:** Changes persist

### Test Menu Manager
1. Find "Menu Manager" section
2. Select Location: "header"
3. Fill in:
   - Title: "Test Menu"
   - URL: "/test-page"
   - Order: 10
   - Parent Menu ID: (leave empty for top-level)
   - Target: "_self"
   - Active: checked
4. Click "Add Menu"
5. **Expected:** Success message "Menu item saved." appears
6. **Verify:** Menu item appears in header section

### Edit Menu Item
1. Click "Edit" on the menu item
2. Change Title to "Test Menu Updated"
3. Change Order to 20
4. Click "Update Menu"
5. **Expected:** Success message appears
6. **Verify:** Changes persist

### Delete Menu Item
1. Click "Delete" on the menu item
2. Confirm deletion
3. **Expected:** Success message "Menu item deleted." appears
4. **Verify:** Item removed from list

### Test Parent-Child Menu
1. Create a parent menu item (e.g., "Courses")
2. Create a child menu item with Parent Menu ID set to the parent's ID
3. **Expected:** Child item appears under parent in menu structure

### Database Verification
```sql
-- Site settings
SELECT * FROM site_settings WHERE id = 'default';

-- Menus
SELECT * FROM menus WHERE title = 'Test Menu';
```

### Live Website Verification
- Verify logo displays on all pages
- Verify favicon appears in browser tab
- Verify contact information displays
- Verify announcement banner shows
- Verify social media links work
- Verify color scheme changes apply
- Verify font changes apply
- Verify menu items appear in navigation
- Verify parent-child menu structure works
- Verify UI copy updates reflect on live site

### Possible Failure Points
- Invalid image URLs
- Invalid color codes
- Invalid URLs for social media
- Invalid parent_id reference
- Menu order conflicts
- Settings not persisting after refresh

---

## 14. Pages Module
**Location:** `/admin/pages`

### Create Page
1. Navigate to `/admin/pages`
2. Click "New Page" button
3. Fill in page details:
   - Title: "Test Page"
   - Slug: (auto-generated as "test-page")
   - Description: "Test page description"
   - SEO Title: "Test Page - Acadvizen"
   - SEO Description: "Test page SEO description"
   - Status: "draft"
4. Click "Save Draft"
5. **Expected:** Success message "Draft saved." appears
6. **Verify:** Page appears in sidebar

### Add Section to Page
1. Select the page in sidebar
2. Click "Add Section" button
3. Select section type: "hero"
4. Fill in section fields:
   - Heading: "Test Heading"
   - Subheading: "Test Subheading"
   - Text: "Test content"
   - Image Source: "https://example.com/image.jpg"
   - Button Label: "Learn More"
   - Button URL: "/courses"
5. Click "Save Section"
6. **Expected:** Success message "Section added." appears
7. **Verify:** Section appears in preview

### Edit Section
1. Click on the section in the list
2. Change Heading to "Test Heading Updated"
3. Change Image Source
4. Click "Save Section"
5. **Expected:** Success message "Section updated." appears
6. **Verify:** Changes appear in preview

### Reorder Sections (Drag-and-Drop)
1. Drag a section to a new position
2. Drop it in the desired location
3. **Expected:** Success message "Section order updated." appears
4. **Verify:** Sections reorder in preview

### Toggle Section Visibility
1. Click the eye icon on a section
2. **Expected:** Success message "Section visibility updated." appears
3. **Verify:** Section hides/shows in preview

### Duplicate Section
1. Click "Duplicate" on a section
2. **Expected:** Success message "Section duplicated." appears
3. **Verify:** Duplicate section appears below original

### Delete Section
1. Click "Delete" on a section
2. Confirm deletion
3. **Expected:** Success message "Section deleted." appears
4. **Verify:** Section removed from preview

### Publish Page
1. Change page status to "published"
2. Click "Publish" button
3. **Expected:** Success message "Page published." appears
4. **Verify:** Page status changes to published

### Preview Page
1. Click "Preview" button or navigate to page URL
2. **Expected:** Page displays with all sections
3. **Verify:** All sections render correctly
4. **Verify:** Images load correctly
5. **Verify:** Buttons work

### Edit Page Metadata
1. Select the page
2. Update Title, Description, SEO Title, SEO Description
3. Click "Save"
4. **Expected:** Success message appears
5. **Verify:** Changes persist

### Delete Page
1. Select the page in sidebar
2. Click "Delete Page" button
3. Confirm deletion
4. **Expected:** Success message "Page deleted." appears
5. **Verify:** Page removed from sidebar

### Test Parent-Child Pages
1. Create a parent page (e.g., "Courses")
2. Create a child page (e.g., "Digital Marketing")
3. **Expected:** Both pages appear in list
4. **Verify:** Navigation structure reflects parent-child relationship

### Test Image Uploads
1. In a section, use the file upload input
2. Select an image from your computer
3. **Expected:** Image uploads and URL appears in field
4. **Verify:** Image displays in preview

### Test Page Sections Import
1. Click "Import Live Pages" button (if available)
2. **Expected:** Existing website structure imports
3. **Verify:** Imported pages appear in sidebar

### Database Verification
```sql
-- Pages
SELECT * FROM pages WHERE slug = 'test-page';

-- Sections
SELECT * FROM sections WHERE page_id = (SELECT id FROM pages WHERE slug = 'test-page');
```

### Live Website Verification
- Navigate to `/test-page` (if published)
- Verify all sections display correctly
- Verify images load
- Verify links work
- Verify SEO meta tags are correct
- Test page on mobile devices
- Verify navigation menu includes the page

### Possible Failure Points
- Invalid slug format
- Duplicate slug
- Invalid image uploads
- Invalid JSON in section content
- Section order conflicts
- Page not publishing correctly
- Navigation not updating automatically
- Parent-child relationship not working
- Images not displaying on live site

---

## General Testing Notes

### Authentication Testing
- Verify admin session persists across page refreshes
- Verify logout functionality works
- Verify unauthorized users cannot access admin pages

### Error Handling Testing
- Try submitting empty required fields
- Try submitting invalid URLs
- Try submitting invalid email addresses
- Try submitting invalid JSON
- **Expected:** Appropriate error messages appear

### Performance Testing
- Test with large datasets (100+ records)
- Test image upload with large files
- Test page load times with many sections

### Cross-Browser Testing
- Test in Chrome
- Test in Firefox
- Test in Safari
- Test in Edge
- Test on mobile browsers

### Responsive Design Testing
- Test admin panel on mobile devices
- Test admin panel on tablet devices
- Verify all forms are usable on small screens

---

## Issues Requiring Authenticated Browser Session

The following features cannot be verified through code inspection and require authenticated browser testing:

1. **Authentication Flow**
   - Login/logout functionality
   - Session persistence
   - Permission checks

2. **File Uploads**
   - Actual file upload to Supabase Storage
   - File size validation
   - File type validation
   - Upload progress indicators

3. **Drag-and-Drop Functionality**
   - Section reordering in Pages module
   - Visual feedback during drag
   - Drop zone highlighting

4. **Live Preview**
   - Real-time preview of page changes
   - Preview mode vs published mode
   - Preview of draft pages

5. **Media Library Integration**
   - Media picker functionality
   - Image selection from library
   - Media search/filter in picker

6. **Menu Navigation Updates**
   - Automatic navigation menu updates when pages are published
   - Menu structure rendering on live site
   - Mobile menu functionality

7. **CMS Cache Invalidation**
   - Page revalidation after CMS updates
   - CDN cache clearing
   - Static page regeneration

8. **Form Validation**
   - Client-side validation messages
   - Real-time validation feedback
   - Form submission prevention on invalid data

---

## Summary

All admin modules have been reviewed and fixed for:
- ✅ Database schema alignment
- ✅ API route configuration
- ✅ Field mapping correctness
- ✅ CRUD operation implementation
- ✅ Menu/Navigation management
- ✅ Page/Section management
- ✅ Build compilation success

**Remaining items requiring browser testing:**
- All functional verification steps above
- Authentication and session management
- File upload functionality
- Drag-and-drop interactions
- Live preview and publishing
- Media library integration
- Navigation menu updates
- Cache invalidation
- Form validation UI
- Cross-browser compatibility
- Responsive design on mobile devices

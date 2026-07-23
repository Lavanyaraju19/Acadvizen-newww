# Acadvizen CMS - Admin User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Content Management](#content-management)
4. [SEO Management](#seo-management)
5. [Media Management](#media-management)
6. [User Management](#user-management)
7. [Settings](#settings)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Logging In

1. Navigate to `/admin` on your website
2. Enter your email and password
3. Click "Sign In"

### First Steps

1. **Update your settings** - Go to Settings → Business Info to update your company details
2. **Configure SEO defaults** - Go to Settings → Default SEO to set default meta tags
3. **Create your first page** - Go to Pages → Create Page
4. **Upload media** - Go to Media Library to upload images and files

---

## Dashboard

### Health Dashboard

The **Website Health Dashboard** shows the overall health of your website across 5 categories:

- **SEO Health** - Meta tags, descriptions, canonical URLs, focus keywords
- **Content Health** - Draft pages, scheduled content, empty pages
- **Link Health** - Broken links, redirect chains, 404 pages
- **Media Health** - Large images, missing ALT text, unused files
- **Performance** - Slow pages, large assets, cache status

**Color coding:**
- 🟢 Green = Healthy (80-100%)
- 🟡 Yellow = Warning (60-79%)
- 🔴 Red = Needs Attention (0-59%)

**How to use:**
1. Click "Run Scan" to check website health
2. Click on any category to see detailed issues
3. Fix issues by navigating to the relevant module

### Quick Actions

Quick actions provide one-click access to common tasks:
- Create Page
- Create Blog
- Create Course
- Upload Media
- View Leads
- Preview Website

### System Status

Shows the status of critical systems:
- Database
- Storage
- Authentication
- Email
- API

---

## Content Management

### Pages

**Creating a Page:**
1. Go to Pages → Create Page
2. Enter the page title
3. Enter the slug (URL-friendly name)
4. Add sections (Hero, About, Features, etc.)
5. Configure SEO settings
6. Save as Draft or Publish

**Editing a Page:**
1. Go to Pages
2. Click on any page in the list
3. Make your changes
4. Save or Publish

**Duplicating a Page:**
1. Go to Pages
2. Open the page you want to duplicate
3. Click "Duplicate" button
4. The new page will be created as a draft with "-copy" suffix

**Sections:**
You can add various sections to your pages:
- Hero - Main banner with title and CTA
- Text Block - Rich text content
- Image Block - Image with optional caption
- Video Block - Embedded video
- Two/Three Column Layout - Multi-column content
- Testimonials - Customer testimonials
- FAQ - Accordion-style questions and answers
- Gallery - Image gallery
- CTA Banner - Call-to-action banner
- Stats Section - Statistics counters
- Feature Cards - Feature highlights
- Custom Rich Text - Custom content with formatting

### Blogs

**Creating a Blog Post:**
1. Go to Blogs → Create Blog
2. Enter the blog title
3. Enter the slug
4. Write the content using the rich text editor
5. Set the category and tags
6. Configure SEO settings
7. Save as Draft or Publish

### Courses

**Creating a Course:**
1. Go to Courses → Create Course
2. Enter the course name
3. Enter the slug
4. Add course content (modules, lessons)
5. Set the price and duration
6. Configure SEO settings
7. Save as Draft or Publish

### City Pages

**Creating a City Page:**
1. Go to Cities → Create City Page
2. Enter the city name
3. Enter the slug (e.g., "bangalore")
4. Add city-specific content (hero, about, features, etc.)
5. Add testimonials from that city
6. Configure city-specific SEO
7. Save as Draft or Publish

### Homepage Builder

**Customizing the Homepage:**
1. Go to Homepage
2. Toggle section visibility (show/hide sections)
3. Drag sections to reorder them
4. Click "Edit" on any section to customize it
5. Click "Preview" to see changes
6. Save changes

### Header Builder

**Customizing the Header:**
1. Go to Header
2. Upload your logo
3. Configure the announcement bar
4. Add navigation menu items
5. Configure CTA buttons
6. Add contact information
7. Configure social media links
8. Set header style (sticky/transparent)
9. Save changes

### Footer Builder

**Customizing the Footer:**
1. Go to Footer
2. Configure 4 columns with links
3. Add contact information
4. Configure social media links
5. Add newsletter subscription
6. Configure legal links (Privacy, Terms, Cookies)
7. Set copyright text
8. Save changes

### Menu Builder

**Creating Menus:**
1. Go to Menus
2. Select the menu location (Header, Footer, Mobile)
3. Click "Add Menu Item"
4. Enter the title and URL
5. Set the target (_self for same tab, _blank for new tab)
6. Set parent item for nested menus
7. Save

**Reordering Menus:**
1. Use the up/down arrows to reorder items
2. Parent items should come before their children

---

## SEO Management

### Meta Tags

**Meta Title:**
- The title shown in search results
- Should be 30-60 characters
- Include your main keyword

**Meta Description:**
- The description shown in search results
- Should be 120-160 characters
- Include your main keyword and call-to-action

**Canonical URL:**
- The preferred URL for this page
- Prevents duplicate content issues

### Open Graph (Facebook/LinkedIn)

**OG Title:** Title shown when shared on social media
**OG Description:** Description shown when shared
**OG Image:** Image shown when shared (recommended: 1200x630px)

### Twitter Cards

**Card Type:** Summary, Summary with Large Image, App, Player
**Twitter Title/Description:** Twitter-specific tags
**Twitter Image:** Image shown on Twitter (recommended: 1200x600px)

### Schema

**JSON-LD Schema:** Structured data for search engines
**Breadcrumb Schema:** Navigation breadcrumbs

### SEO Score

The SEO Manager calculates a score (0-100) based on:
- Meta title presence and length
- Meta description presence and length
- Canonical URL
- Open Graph tags
- Focus keyword
- Schema markup

**Color coding:**
- 🟢 80-100 = Excellent
- 🟡 60-79 = Good
- 🔴 0-59 = Needs Improvement

---

## Media Management

### Uploading Files

1. Go to Media Library
2. Click "Upload Files"
3. Select files from your computer
4. Files are automatically uploaded to storage

### Organizing Media

**Folders:**
- Create folders to organize your media
- Click "Create Folder" to add a new folder
- Drag and drop files into folders

### Image Editor

**Editing Images:**
1. Go to Media Library
2. Click the edit icon (green) on any image
3. Use the image editor to:
   - Rotate (clockwise/counter-clockwise)
   - Flip (horizontal/vertical)
   - Resize
   - Adjust quality
   - Change format (JPEG, PNG, WebP)
4. Click "Save & Replace" to save changes

### File Types

**Supported:**
- Images: JPG, PNG, GIF, WebP, SVG
- Videos: MP4, WebM
- Documents: PDF, DOC, DOCX

---

## User Management

### User Roles

**Admin:** Full access to all features
**Editor:** Can create and edit content
**Author:** Can create content
**Contributor:** Can submit content for review
**Viewer:** Can only view content
**Super Admin:** Full access + user management

### Creating Users

1. Go to Users
2. Click "Add User"
3. Enter the user's email
4. Select the role
5. Click "Send Invite"

### Managing Permissions

Each role has specific permissions:
- Admin: All permissions
- Editor: Content creation, editing, publishing
- Author: Content creation only
- Contributor: Content submission for review
- Viewer: Read-only access

---

## Settings

### Business Information

**Business Name:** Your company name
**Tagline:** Short description of your business
**Description:** Longer description for SEO

### Branding

**Logo:** Upload your company logo
**Favicon:** Upload your website icon
**Logo Alt Text:** Alternative text for accessibility

### Contact Information

**Phone:** Your contact phone number
**Email:** Your contact email
**Address:** Your physical address
**City, State, Country, Postal Code:** Complete address

### Social Media

**LinkedIn, Twitter, Instagram, Facebook, YouTube, WhatsApp:** Your social media URLs

### Google Maps

**API Key:** Your Google Maps API key
**Embed URL:** The embed URL for your location

### Business Hours

Set your business hours for each day of the week.

### Analytics

**Google Analytics ID:** Your GA tracking ID (G-XXXXXXXXXX)
**Google Tag Manager ID:** Your GTM container ID (GTM-XXXXXX)
**Facebook Pixel ID:** Your Facebook pixel ID
**Meta Pixel ID:** Your Meta pixel ID

### Email/SMTP

Configure email sending for:
- Contact form submissions
- User invitations
- Notifications

### Site Settings

**Maintenance Mode:** Enable to show a maintenance page
**Cookie Banner:** Enable to show a cookie consent banner
**Copyright Text:** Footer copyright text

---

## Advanced Features

### Maintenance Mode

**When to use:**
- During major updates
- When fixing critical bugs
- During server maintenance

**How to enable:**
1. Go to Settings → Site Settings
2. Enable "Maintenance Mode"
3. Add a custom message
4. Optionally add allowed IP addresses
5. Save

**Note:** Admins can always access the site during maintenance mode.

### Redirects

**Creating a Redirect:**
1. Go to Redirects
2. Click "Add Redirect"
3. Enter the old URL (from)
4. Enter the new URL (to)
5. Select the type (301 = Permanent, 302 = Temporary)
6. Save

**Import/Export Redirects:**
- Export: Click "Export" to download as CSV
- Import: Click "Import" to upload a CSV file

### Sitemap

**Generating Sitemap:**
1. Go to Sitemap
2. Configure which content types to include
3. Set change frequency and priority for each type
4. Click "Generate Now"
5. Download the sitemap
6. Submit to Google Search Console

### Robots.txt

**Editing Robots.txt:**
1. Go to Robots.txt
2. Edit the robots.txt file directly
3. Use quick rules to add common patterns
4. Click "Preview" to see the result
5. Click "Save" to apply changes

### Import/Export

**Exporting Content:**
1. Go to Import/Export
2. Select the content type (Pages, Blogs, etc.)
3. Select the format (CSV or JSON)
4. Click "Export Now"

**Importing Content:**
1. Go to Import/Export
2. Select the content type
3. Select the format
4. Upload the file
5. Review the preview
6. Click "Confirm Import"

### Page Duplication

**Duplicating a Page:**
1. Open the page you want to duplicate
2. Click "Duplicate" button
3. The new page is created as a draft
4. Edit and publish as needed

### Reusable Sections

**Creating a Reusable Section:**
1. Go to Reusable Sections
2. Click "Create Section"
3. Enter the section name
4. Select the section type
5. Configure the section data
6. Save

**Using Reusable Sections:**
- Sections can be inserted into any page
- Duplicate sections to create variations
- Edit sections to update all instances

### Page Templates

**Using a Template:**
1. Go to Page Templates
2. View available templates
3. Duplicate a template to customize it
4. Use the template data when creating a new page

---

## Troubleshooting

### Common Issues

**Issue: Can't save changes**
- Check if you're logged in
- Check your role permissions
- Try refreshing the page

**Issue: Images not uploading**
- Check file size (max 10MB)
- Check file type (supported types only)
- Check your internet connection

**Issue: SEO score is low**
- Add meta title and description
- Add canonical URL
- Add Open Graph tags
- Add focus keyword

**Issue: Page not publishing**
- Check if all required fields are filled
- Check if the slug is unique
- Try saving as draft first

**Issue: Maintenance mode won't disable**
- Refresh the page
- Check if your IP is in the allowed list
- Try disabling and re-enabling

### Getting Help

If you need help:
1. Check this manual
2. Use the contextual help tooltips in the admin interface
3. Contact your system administrator

---

## Best Practices

### SEO Best Practices

- Always add meta titles and descriptions
- Use descriptive, keyword-rich titles
- Keep titles under 60 characters
- Keep descriptions under 160 characters
- Add canonical URLs to prevent duplicate content
- Use focus keywords in your content
- Add Open Graph images for social sharing

### Content Best Practices

- Use drafts to save work in progress
- Use version history to track changes
- Preview before publishing
- Use page templates for consistency
- Duplicate pages instead of starting from scratch

### Security Best Practices

- Use strong passwords
- Don't share your login credentials
- Log out when done
- Only give admin access to trusted users
- Review user permissions regularly

---

## Keyboard Shortcuts

- `Cmd/Ctrl + K` - Open global search
- `Esc` - Close modals
- `Enter` - Submit forms
- `Tab` - Navigate between fields

---

## Tips for Non-Technical Users

### Don't Worry About

- **Code:** You don't need to write any code
- **HTML/CSS:** The CMS handles this for you
- **Technical details:** Focus on content, not technical implementation

### Focus On

- **Content Quality:** Write good, engaging content
- **SEO:** Follow the SEO Manager suggestions
- **User Experience:** Make sure your site is easy to use
- **Images:** Use high-quality, optimized images

### When to Ask for Help

- If something doesn't work as expected
- If you're unsure about a setting
- If you need to customize beyond what's available
- If you encounter any errors

---

## Glossary

**CMS:** Content Management System - software to manage website content
**SEO:** Search Engine Optimization - improving visibility in search results
**Slug:** URL-friendly version of a page title
**Meta Tags:** HTML tags that describe your page to search engines
**Canonical URL:** The preferred URL for a page
**Open Graph:** Tags that control how your content appears on social media
**Schema:** Structured data that helps search engines understand your content
**301 Redirect:** Permanent redirect - tells search engines the page has moved permanently
**302 Redirect:** Temporary redirect - tells search engines the move is temporary
**Sitemap:** A file that lists all pages on your website for search engines
**Robots.txt:** A file that tells search engines what they can and cannot crawl
**RBAC:** Role-Based Access Control - different permissions for different user roles

---

## Contact

For additional help or support, contact your system administrator or developer.

---

*This manual is for the Acadvizen CMS v1.0*
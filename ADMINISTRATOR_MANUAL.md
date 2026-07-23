# Acadvizen Headless CMS - Administrator Manual

**Version:** 1.0  
**Last Updated:** 2026-07-22  
**Target Audience:** Non-technical Administrators

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Content Management](#content-management)
4. [Pages](#pages)
5. [Blogs](#blogs)
6. [Courses](#courses)
7. [Media Management](#media-management)
8. [Menus & Navigation](#menus--navigation)
9. [SEO Management](#seo-management)
10. [Site Configuration](#site-configuration)
11. [Enterprise Features](#enterprise-features)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to your website URL with `/admin` (e.g., `https://acadvizen.com/admin`)
2. Log in with your administrator credentials
3. You will be greeted with the main dashboard

### First-Time Setup

Before creating content, configure your site settings:

1. Go to **Settings** in the left sidebar
2. Update company information, contact details, and social links
3. Configure your header and footer
4. Set up SEO defaults
5. Save your changes

---

## Dashboard Overview

### Main Dashboard

The dashboard provides a quick overview of your site:

- **Recent Activity:** Latest content changes
- **Content Statistics:** Count of pages, blogs, courses, etc.
- **Quick Actions:** Fast access to common tasks
- **Health Status:** Site health indicators

### Navigation Menu

The left sidebar provides access to all CMS modules:

- **Dashboard:** Overview and statistics
- **Pages:** Manage website pages
- **Blogs:** Blog posts and articles
- **Courses:** Course catalog
- **Media:** Image and file management
- **Menus:** Navigation configuration
- **Settings:** Site configuration
- **SEO:** Search engine optimization
- **Users:** User management (if enabled)

---

## Content Management

### Publishing Workflow

All content follows this workflow:

1. **Create** - Draft your content
2. **Edit** - Make changes
3. **Preview** - See how it looks
4. **Publish** - Make it live
5. **Update** - Make changes to published content
6. **Archive/Delete** - Remove content when no longer needed

### Autosave

- Content is automatically saved every 30 seconds
- You'll see "Autosaved" indicator in the bottom right
- Autosaves are retained for 24 hours
- If you accidentally close the browser, your work is preserved

### Version History

- Every save creates a version
- Access version history by clicking the clock icon
- You can compare versions and restore previous versions
- Versions include change summaries

---

## Pages

### Creating a New Page

1. Navigate to **Pages** in the sidebar
2. Click **+ New Page** button
3. Fill in the required fields:
   - **Title:** Page heading
   - **Slug:** URL-friendly page name (auto-generated from title)
   - **Description:** Page description for SEO
4. Add sections to build your page content
5. Click **Save Draft** to save without publishing
6. Click **Publish** to make the page live

### Page Sections

Pages are built using sections. Available section types:

- **Hero:** Large banner with heading and CTA
- **Text:** Rich text content
- **Image:** Image display with optional caption
- **Features:** Feature grid/list
- **Testimonials:** Customer testimonials
- **CTA:** Call-to-action section
- **Divider:** Visual separator
- **Spacer:** Add vertical space

### Editing Pages

1. Go to **Pages**
2. Click on the page you want to edit
3. Make your changes
4. Click **Save** to update
5. Changes are reflected immediately on the live site

### Duplicating Pages

1. Go to **Pages**
2. Click the **Duplicate** button (copy icon)
3. A copy is created with "-copy" suffix
4. Edit the copy as needed

### Deleting Pages

1. Go to **Pages**
2. Click the **Delete** button (trash icon)
3. Confirm deletion
4. Page is permanently removed

### City Landing Pages

The CMS supports location-specific landing pages:

1. Create a new page
2. Use city-specific title (e.g., "Digital Marketing Course in Bangalore")
3. Add city-specific content and testimonials
4. Configure city-specific SEO
5. The page will be automatically included in location-based routing

---

## Blogs

### Creating a Blog Post

1. Navigate to **Blogs** in the sidebar
2. Click **+ New Blog Post**
3. Fill in the required fields:
   - **Title:** Blog post title
   - **Slug:** URL-friendly name (auto-generated)
   - **Excerpt:** Short summary for listings
   - **Content:** Full blog content
   - **Author:** Author name
   - **Featured Image:** Cover image
4. Add categories and tags
5. Click **Save Draft** or **Publish**

### Blog Categories

Organize your blog posts with categories:

1. Go to **Blogs**
2. Click **Categories** tab
3. Create new categories
4. Assign categories to blog posts

### Blog Tags

Add tags for better content discovery:

1. Go to **Blogs**
2. Click **Tags** tab
3. Create new tags
4. Assign tags to blog posts

### Scheduled Publishing

Schedule blog posts to publish automatically:

1. Create a blog post
2. Instead of clicking "Publish", click **Schedule**
3. Select the date and time
4. The post will automatically publish at the scheduled time

---

## Courses

### Managing Courses

1. Navigate to **Courses** in the sidebar
2. Click **+ New Course** to add a course
3. Fill in course details:
   - **Title:** Course name
   - **Slug:** URL-friendly name
   - **Description:** Course description
   - **Short Description:** Brief summary
   - **Duration:** Course length
   - **Price:** Course cost
4. Upload course materials
5. Set course visibility (Draft/Published)

### Course Features

- **Course Details:** Add detailed curriculum information
- **Pricing:** Set course prices and discounts
- **Enrollment:** Manage student enrollment
- **Analytics:** Track course performance

---

## Media Management

### Uploading Media

1. Navigate to **Media** in the sidebar
2. Click **Upload Media**
3. Select files from your computer
4. Images are automatically optimized
5. Add alt text for accessibility

### Media Library

- View all uploaded media
- Filter by type (images, videos, documents)
- Search by filename
- Download media files
- Delete unused media

### Image Editor

Basic image editing features:

- **Crop:** Resize and crop images
- **Rotate:** Rotate images 90 degrees
- **Flip:** Flip horizontally or vertically
- **Filters:** Apply basic filters

### Alt Text

Always add alt text to images for:

- Accessibility (screen readers)
- SEO (search engines)
- Fallback if image fails to load

---

## Menus & Navigation

### Menu Structure

The CMS supports multiple menu locations:

- **Header Menu:** Main navigation
- **Footer Menu:** Footer links
- **Mobile Menu:** Mobile navigation

### Creating Menu Items

1. Navigate to **Menus** in the sidebar
2. Select the menu location
3. Click **+ Add Menu Item**
4. Fill in the details:
   - **Label:** Display text
   - **URL:** Link destination
   - **Order:** Display order
5. Click **Save**

### Nested Menus

Create dropdown menus:

1. Create a parent menu item
2. Create child menu items
3. Set the **Parent** field to the parent item
4. The child items will appear in a dropdown

### Menu Locations

- **Header:** Top navigation bar
- **Footer:** Footer links section
- **Mobile:** Hamburger menu on mobile devices

---

## SEO Management

### Page SEO

Each page has SEO settings:

1. Edit a page
2. Scroll to **SEO Settings** section
3. Configure:
   - **Meta Title:** Page title (50-60 characters)
   - **Meta Description:** Page description (150-160 characters)
   - **Keywords:** Focus keywords
   - **OG Image:** Social sharing image
   - **Canonical URL:** Preferred URL

### Global SEO Settings

Configure site-wide SEO defaults:

1. Go to **Settings**
2. Click **SEO** tab
3. Set default meta titles and descriptions
4. Configure Open Graph defaults
5. Set up social media links

### Robots.txt

Control search engine crawling:

1. Go to **SEO**
2. Click **Robots.txt** tab
3. Edit the robots.txt file
4. Save changes

### Sitemap

Automatically generate XML sitemap:

1. Go to **SEO**
2. Click **Sitemap** tab
3. Click **Generate Sitemap**
4. Sitemap is available at `/sitemap.xml`

---

## Site Configuration

### Header Configuration

Customize your site header:

1. Go to **Header** in the sidebar
2. Configure:
   - **Logo:** Upload your logo
   - **Navigation:** Set up menu items
   - **CTA Button:** Configure call-to-action
   - **Announcement Bar:** Add announcement banner
3. Click **Save**

### Footer Configuration

Customize your site footer:

1. Go to **Footer** in the sidebar
2. Configure:
   - **About Section:** Company information
   - **Quick Links:** Important page links
   - **Social Links:** Social media profiles
   - **Copyright:** Copyright notice
3. Click **Save**

### Homepage Builder

Build your homepage visually:

1. Go to **Homepage** in the sidebar
2. Add sections to build your homepage
3. Drag and drop to reorder sections
4. Edit section content
5. Preview changes in real-time
6. Click **Save** to publish

### Global Settings

Configure site-wide settings:

1. Go to **Settings**
2. Configure:
   - **Company Information:** Name, address, contact
   - **Social Media:** Social profile links
   - **Email:** Contact email
   - **Phone:** Contact phone number
3. Click **Save**

---

## Enterprise Features

### Autosave

- Content is automatically saved every 30 seconds
- Prevents data loss from browser crashes
- Autosaves are retained for 24 hours
- You can restore autosaved content

### Version History

- Track all changes to content
- View who made changes and when
- Compare different versions
- Restore previous versions with one click
- Add notes to explain changes

### Global Search

- Press `Ctrl+K` (Windows) or `Cmd+K` (Mac) to open search
- Search across all content types
- Quick navigation to any content
- Search history for recent searches

### Scheduled Publishing

- Schedule content to publish automatically
- Set exact date and time
- Queue multiple posts for publishing
- Receive notifications when content publishes

### Bulk Actions

- Select multiple items at once
- Bulk publish/unpublish
- Bulk delete
- Bulk categorize
- Save time on repetitive tasks

### Backup & Restore

- Export all CMS data as JSON
- Import CMS data from backup
- Schedule automatic backups
- Restore from any backup point
- Essential for disaster recovery

### Activity Logs

- Track all user actions
- See who changed what and when
- Monitor content changes
- Audit trail for compliance
- Security monitoring

### Health Dashboard

- Monitor site health metrics
- SEO health score
- Content health indicators
- Performance metrics
- Security status
- Identify issues before they become problems

---

## Troubleshooting

### Content Not Appearing

**Problem:** Published content not showing on the site

**Solutions:**
1. Check the content status is "Published" (not "Draft")
2. Clear your browser cache
3. Wait 1-2 minutes for cache invalidation
4. Check the URL slug is correct
5. Verify the page is not password protected

### Images Not Loading

**Problem:** Images show as broken or won't upload

**Solutions:**
1. Check file size (max 10MB)
2. Verify file format (JPG, PNG, WEBP supported)
3. Check your internet connection
4. Try a different browser
5. Clear browser cache

### Login Issues

**Problem:** Cannot log in to admin panel

**Solutions:**
1. Verify your username and password
2. Check if your account is active
3. Clear browser cookies
4. Try incognito/private browsing mode
5. Contact your system administrator

### SEO Not Working

**Problem:** SEO changes not reflecting in search results

**Solutions:**
1. SEO changes take time to index (days to weeks)
2. Submit your sitemap to Google Search Console
3. Use the "Preview" feature to see how Google sees your page
4. Check for crawl errors in Search Console
5. Ensure meta tags are not blocked by robots.txt

### Slow Performance

**Problem:** Admin panel or site is slow

**Solutions:**
1. Check your internet connection
2. Clear browser cache
3. Disable browser extensions
4. Check if there are large media files
5. Contact support if issue persists

---

## Best Practices

### Content Creation

1. **Plan Before You Create:** Outline your content structure first
2. **Use Descriptive Titles:** Make titles clear and descriptive
3. **Add Alt Text:** Always add alt text to images
4. **Optimize Images:** Compress images before uploading
5. **Preview Before Publishing:** Always preview content before going live

### SEO Best Practices

1. **Unique Titles:** Each page should have a unique title
2. **Meta Descriptions:** Write compelling descriptions (150-160 characters)
3. **Keywords:** Use relevant keywords naturally
4. **Internal Links:** Link to related content
5. **Regular Updates:** Keep content fresh and updated

### Security Best Practices

1. **Strong Passwords:** Use complex, unique passwords
2. **Regular Backups:** Schedule regular backups
3. **Limit Access:** Only give admin access to trusted users
4. **Monitor Activity:** Review activity logs regularly
5. **Keep Updated:** Keep CMS and dependencies updated

### Media Management

1. **Organize Files:** Use descriptive filenames
2. **Compress Images:** Optimize images for web
3. **Use Alt Text:** Always add alt text
4. **Delete Unused:** Remove unused media files
5. **Backup Media:** Keep backups of important media

### Version Control

1. **Meaningful Notes:** Add notes when creating versions
2. **Regular Saves:** Save frequently to create versions
3. **Review History:** Review version history before major changes
4. **Test Restores:** Test restore functionality periodically
5. **Clean Up:** Archive old versions periodically

---

## Support

### Getting Help

If you need assistance:

1. **Documentation:** Check this manual first
2. **Activity Logs:** Review activity logs for error details
3. **Health Dashboard:** Check site health status
4. **Contact Support:** Reach out to your technical team

### Reporting Issues

When reporting issues, include:

- What you were trying to do
- What happened instead
- Browser and version
- Steps to reproduce the issue
- Screenshots if applicable

### Training Resources

- **Video Tutorials:** Available in the admin panel
- **Knowledge Base:** Comprehensive documentation
- **Webinars:** Regular training sessions
- **Support Tickets:** Submit issues for resolution

---

## Glossary

- **CMS:** Content Management System
- **Slug:** URL-friendly version of a title
- **Meta Title:** Page title shown in search results
- **Meta Description:** Page description shown in search results
- **Alt Text:** Alternative text for images
- **CTA:** Call-to-Action
- **SEO:** Search Engine Optimization
- **OG:** Open Graph (social media metadata)
- **Autosave:** Automatic saving of content
- **Version History:** Record of all content changes
- **Draft:** Unpublished content
- **Published:** Live content visible to visitors

---

## Conclusion

This manual covers all essential features of the Acadvizen Headless CMS. For advanced features or technical assistance, please refer to the Developer Documentation or contact your technical support team.

The CMS is designed to be intuitive and user-friendly, allowing non-technical administrators to manage all aspects of the website without developer intervention.

**Last Updated:** 2026-07-22  
**Version:** 1.0

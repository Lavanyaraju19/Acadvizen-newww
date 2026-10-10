# Acadvizen websites — project summary

**Status (10 October 2026): conditionally ready — not yet approved for handover.** The central editor is built, tested and now installed on the live Enrollment website (10 Oct). It is not yet connected to the Main website. That step needs the owner's hosting and WordPress access.

## What this project delivers

The Enrollment website's WordPress admin (`https://enroll.acadvizen.com/wp-admin/`) becomes the one place to edit shared content. Each page, course, location, blog or tool is published to:

- **Main**: `https://www.acadvizen.com` only;
- **Enrollment**: `https://enroll.acadvizen.com` only;
- **Both** websites.

Both websites keep their current design.
- **Visual editing:** pages are designed visually with Elementor: drag-and-drop layouts, colours, fonts, spacing, and separate tablet and mobile settings. Global colours and fonts apply to both websites.
- **Preview first:** "Preview on the Main Website" shows a draft exactly as www.acadvizen.com will show it, before anything is published.

`docs/ACADVIZEN_VISUAL_BUILDER.md` lists what is covered and what is not.
- **Recent versions:** each page keeps its recent versions, so an earlier one can be restored in one click.
- **Main's own admin** (`/admin`) continues to manage leads, students, courses and other application data.
- **The Enrollment website** keeps its pages, forms and enquiry handling.

## Live now

- Main page titles show "| Acadvizen" once.
- The Main contact form saves every enquiry to Admin → Leads, with lead names shown.
- The Main sitemap lists only working addresses.
- Admin → Tools lists all tools again.
- The test course is unpublished, and the test enquiry is deleted.
- The test tool is unpublished and gone from the tools list and the sitemap. Its own address still shows its name until the next Main update is deployed.
- The central editor is switched off on Main until it is installed and tested.

## Before handover is final

1. **Owner:**
   - back up the Enrollment website and confirm the database size;
   - confirm Supabase backups.
2. **Supabase owner:** run two prepared database updates. Until then, changing a lead's status in Admin → Leads fails.
3. **Owner, or engineer with a working admin login:** install the prepared plugin on the Enrollment website.
4. **Owner:** add the connection settings (a new shared secret, kept out of chat) in WordPress and Vercel, and a server cron job.
5. **Engineer:**
   - deploy the pending Main update;
   - switch the connection on;
   - run the live publishing tests (Main, Enrollment, Both, edit, change address, unpublish, restore a version);
   - remove the test page.
6. **Owner, or engineer with admin access:** tidy the Enrollment website:
   - sitemap addresses and contents;
   - three redirects;
   - the footer "Apply Now" button;
   - the logo link;
   - two test items set to draft.
7. **All account owners:** change the passwords that were shared in chat.

Exact steps: `docs/ACADVIZEN_CLIENT_HANDOVER.md`, section 5. Editors' guide: `docs/cms-implementation/ADMIN-USER-GUIDE.md`.

## Noted, not part of this project

The Enrollment website has WooCommerce installed but no products. `/my-account/`, `/cart/` and `/checkout/` do not exist and nothing links to them. Enrolment works through the enquiry forms.

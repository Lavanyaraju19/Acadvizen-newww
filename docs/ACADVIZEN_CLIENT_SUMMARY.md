# Acadvizen websites — project summary

**Status: in progress. The final connection step is pending.** (9 October 2026)

## What this project delivers

One central editor (Master CMS, `https://cms.acadvizen.com/wp-admin/`) where your team edits the public pages of both websites with WordPress and Elementor. Each page is published to:

- **Main**: `https://acadvizen.com` only;
- **Enrollment**: `https://enroll.acadvizen.com` only;
- **Both** websites.

Each page keeps its recent versions, so an earlier version can be restored in one click. Main's own admin (`/admin`) continues to manage leads, students, courses and other application data. The Enrollment website keeps its existing design, pages and enquiry forms.

## Live now

- Page titles on the Main website show "| Acadvizen" once (they repeated it before).
- The Main contact form sends every enquiry to Admin → Leads, with clear messages if something goes wrong. Before, enquiries from this form were not saved.
- The Main sitemap lists only working addresses.
- Main's sitemap pages answer correctly with the right canonical address, and no test-site addresses appear anywhere.
- The previous version of the Main website stays available and can be restored in one step.

## Before handover is final

1. Remove two test entries ("Local E2E" course and tool) still visible on the Main website.
2. Tidy the Enrollment website:
   - sitemap contents;
   - three redirects for renamed pages;
   - the footer "Apply Now" button;
   - the logo link to `acadvizen.com`;
   - two test items to draft.
3. Confirm backups and database space on the hosting account.
4. Connect the central editor to the live websites, then run the live publishing checks (Main, Enrollment, Both, and restoring a previous version).
5. Confirm with one labelled test enquiry that the contact form stores enquiries in Admin → Leads.

Every part of the central editor has already been built and tested on a full copy of the websites. Steps 1–3 and the hosting part of step 4 need the website owner's account access. The remaining technical steps follow immediately.

## Noted, not part of this project

The Enrollment website has WooCommerce installed but no products. The addresses `/my-account/`, `/cart/` and `/checkout/` do not exist and nothing links to them, so visitors are not affected. Enrolment works through the enquiry forms.
